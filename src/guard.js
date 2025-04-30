// guard.js
const { spawn } = require('child_process');
const { fetchTodayUsage } = require('./usage');
const path = require('path');
const fs = require('fs');
const logger = require('./logger');
const { createDetector } = require('./notifier');

let codexProcess = null;
let pendingShutdown = false;
let warnedHigh = false;
let lastUsageCheck = 0;

// Load global config from project root
const configPath = path.join(__dirname, '../config.json');
if (!fs.existsSync(configPath)) {
  logger.error(`Missing global config at ${configPath} – please create it with daily_token_limit, warning_threshold_percent, and usage_check_interval_seconds.`);
  process.exit(1);
}
const {
  daily_token_limit: DAILY_TOKEN_LIMIT,
  warning_threshold_percent: HIGH_WARNING_PERCENT = 95,
  usage_check_interval_seconds: USAGE_INTERVAL = 60,
  trigger_string: TRIGGER = 'send a message',
} = JSON.parse(fs.readFileSync(configPath, 'utf8'));


/** 
 * Perform a usage/API check and handle warnings or shutdown.
 */
async function doUsageCheck() {
  try {
    const used = await fetchTodayUsage();
    lastUsageCheck = Date.now();
    const pct = (used / DAILY_TOKEN_LIMIT) * 100;
    const uFmt = used.toLocaleString();
    const lFmt = DAILY_TOKEN_LIMIT.toLocaleString();

    if (used >= DAILY_TOKEN_LIMIT) {
      logger.error(`You are over your daily cap! (${uFmt}/${lFmt}).`);
      pendingShutdown = true;
    } else if (pct >= HIGH_WARNING_PERCENT) {
      if (!warnedHigh) {
        logger.warn(`Warning: ${pct.toFixed(1)}% of daily limit used (${uFmt}/${lFmt}).`);
        warnedHigh = true;
      }
    } else {
      logger.info(`Usage: ${uFmt}/${lFmt} (${pct.toFixed(1)}%)`);
    }
  } catch (err) {
    logger.error(`Usage check failed: ${err.message}`);
  }
}

/**
 * Mark that we should shut down after the current response.
 */
function requestShutdown() {
  if (!pendingShutdown) {
    pendingShutdown = true;
    logger.error('Daily token cap reached — will shut down after this response.');
  }
}

// Create a detector for our trigger string
const detector = createDetector(TRIGGER, { bufferMax: 200 });
detector.onDetect(() => {
  // Always notify on trigger
  setTimeout(() => process.stdout.write('\x07'), 100);

  // Trigger a usage check only if enough time has passed
  const now = Date.now();
  if (!lastUsageCheck || (now - lastUsageCheck) / 1000 >= USAGE_INTERVAL) {
    doUsageCheck().then(() => {
      if (pendingShutdown && codexProcess) {
        logger.error('Request complete — shutting down Codex session.');
        codexProcess.kill('SIGTERM');
      }
    });
  } else if (pendingShutdown && codexProcess) {
    // If already over cap but interval hasn't elapsed, still shutdown on trigger
    codexProcess.kill('SIGTERM');
  }
});


/**
 * Spawn the Codex CLI and wire up the detector.
 */
function runCodex(args) {
  codexProcess = spawn('codex', args, {
    stdio: ['inherit', 'pipe', 'pipe'],
    env: { ...process.env, FORCE_COLOR: '1' },
  });

  codexProcess.stdout.on('data', chunk => {
    process.stdout.write(chunk);
    detector.feed(chunk);
  });
  codexProcess.stderr.pipe(process.stderr);

  codexProcess.on('exit', () => process.exit(0));
}


async function main() {
  const args = process.argv.slice(2);
  logger.success(`Launched ${args.join(' ')}`);

  // Initial usage check at startup
  await doUsageCheck();

  runCodex(args);

  process.on('SIGINT', () => {
    requestShutdown();
  });
}

main();
