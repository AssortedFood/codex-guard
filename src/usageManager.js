// src/usageManager.js
const { fetchTodayUsage } = require('./usage');
const logger              = require('./logger');
const {
  DAILY_TOKEN_LIMIT,
  HIGH_WARNING_PERCENT,
} = require('./config');
const { markPendingShutdown } = require('./shutdown');

async function checkUsage() {
  try {
    const used = await fetchTodayUsage();
    const pct  = (used / DAILY_TOKEN_LIMIT) * 100;
    const uFmt = used.toLocaleString();
    const lFmt = DAILY_TOKEN_LIMIT.toLocaleString();

    if (used >= DAILY_TOKEN_LIMIT) {
      markPendingShutdown();
      logger.error(`Over cap! (${uFmt}/${lFmt}).`);
    }
    else if (pct >= HIGH_WARNING_PERCENT) {
      logger.warn(`Warning: ${pct.toFixed(1)}% (${uFmt}/${lFmt}).`);
    }
    else {
      logger.info(`Usage: ${uFmt}/${lFmt} (${pct.toFixed(1)}%)`);
    }
  } catch (err) {
    logger.error(`Usage check failed: ${err.message}`);
  }
}

module.exports = { checkUsage };
