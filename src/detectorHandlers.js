// src/detectorHandlers.js
const { checkUsage }                  = require('./usageManager');
const { performShutdownIfPending }    = require('./shutdown');
const { IDLE_ALERT }                  = require('./config');

async function handleMessageTrigger() {
  if (IDLE_ALERT) setTimeout(() => process.stdout.write('\x07'), 100);
  await checkUsage();
  performShutdownIfPending();
}

function handleDoneTrigger() {
  performShutdownIfPending();
}

module.exports = { handleMessageTrigger, handleDoneTrigger };
