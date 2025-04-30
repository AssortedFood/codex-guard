// src/usageManager.js
const { fetchTodayUsage } = require('./usage');
const logger              = require('./logger');
const {
  DAILY_TOKEN_LIMIT,
  HIGH_WARNING_PERCENT,
} = require('./config');
const { markPendingShutdown } = require('./shutdown');

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_CALLS = 4;  // allow up to 4 calls in any 60s window

// Sliding‐window timestamps of when we actually called the API
const callTimestamps = [];

/**
 * Clean out timestamps older than RATE_LIMIT_WINDOW_MS
 */
function pruneOldCalls() {
  const cutoff = Date.now() - RATE_LIMIT_WINDOW_MS;
  while (callTimestamps.length && callTimestamps[0] < cutoff) {
    callTimestamps.shift();
  }
}

async function checkUsage() {
  // 1) Rate-limit guard
  pruneOldCalls();
  if (callTimestamps.length >= RATE_LIMIT_MAX_CALLS) {
    logger.warn(
      `Skipping usage check to avoid rate limit (${callTimestamps.length} calls in the last minute).`
    );
    return;
  }
  // record this call
  callTimestamps.push(Date.now());

  // 2) Actual API call
  try {
    const used = await fetchTodayUsage();
    const pct  = (used / DAILY_TOKEN_LIMIT) * 100;
    const uFmt = used.toLocaleString();
    const lFmt = DAILY_TOKEN_LIMIT.toLocaleString();

    if (used >= DAILY_TOKEN_LIMIT) {
      markPendingShutdown();
      logger.error(`Over cap! (${uFmt}/${lFmt}).`);
    } else if (pct >= HIGH_WARNING_PERCENT) {
      logger.warn(`Warning: ${pct.toFixed(1)}% used (${uFmt}/${lFmt}).`);
    } else {
      logger.info(`Usage: ${uFmt}/${lFmt} (${pct.toFixed(1)}%)`);
    }
  } catch (err) {
    logger.error(`Usage check failed: ${err.message}`);
  }
}

module.exports = { checkUsage };
