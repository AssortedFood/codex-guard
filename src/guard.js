// guard.js
const { spawn }           = require('child_process');
const { createDetector }  = require('./notifier');
const logger              = require('./logger');
const config              = require('./config');
const shutdown            = require('./shutdown');
const usageManager        = require('./usageManager');
const { handleMessageTrigger, handleDoneTrigger } = require('./detectorHandlers');

// Start polling
setInterval(usageManager.checkUsage, config.USAGE_INTERVAL * 1000);

// Spawn Codex
const codex = spawn('codex', process.argv.slice(2), {
  stdio: ['inherit','pipe','pipe'],
  env:   { ...process.env, FORCE_COLOR:'1' },
});

// Initialize shutdown manager
shutdown.init(codex, config.SHUTDOWN_TIMEOUT);

// Wire detectors
const msgDet = createDetector('send a message', { bufferMax:200 });
msgDet.onDetect(handleMessageTrigger);

const doneDet = createDetector('done!', { bufferMax:200 });
doneDet.onDetect(handleDoneTrigger);

// Feed stdout into detectors
codex.stdout.on('data', chunk => {
  process.stdout.write(chunk);
  msgDet.feed(chunk);
  doneDet.feed(chunk);
});
codex.stderr.pipe(process.stderr);

// Initial usage check
usageManager.checkUsage();

// SIGINT
process.on('SIGINT', shutdown.markPendingShutdown);

// Exit on Codex exit
codex.on('exit', () => process.exit(0));
