// src/shutdown.js
const logger = require('./logger');

let codexProcess     = null;
let pendingShutdown  = false;
let shutdownTimer    = null;
let shutdownTimeoutS = 60;

function init(process, timeoutSeconds) {
  codexProcess     = process;
  shutdownTimeoutS = timeoutSeconds;
}

function scheduleForcedShutdown() {
  if (shutdownTimer) return;
  shutdownTimer = setTimeout(() => {
    if (codexProcess) {
      logger.error(`No shutdown prompt in ${shutdownTimeoutS}s — forcing shutdown.`);
      codexProcess.kill('SIGTERM');
    }
  }, shutdownTimeoutS * 1000);
}

function markPendingShutdown() {
  if (pendingShutdown) return;
  pendingShutdown = true;
  logger.error('Daily token cap reached — will shut down after this response.');
  scheduleForcedShutdown();
}

function performShutdownIfPending() {
  if (pendingShutdown && codexProcess) {
    logger.error('Request complete — shutting down Codex session.');
    codexProcess.kill('SIGTERM');
  }
}

module.exports = {
  init,
  markPendingShutdown,
  scheduleForcedShutdown,  // you can keep exporting this if you need it
  performShutdownIfPending
};
