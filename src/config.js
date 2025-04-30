// src/config.js
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

const CONFIG_PATH = path.join(__dirname, '../config.json');
if (!fs.existsSync(CONFIG_PATH)) {
  logger.error(`Missing config at ${CONFIG_PATH}`);
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));

module.exports = {
  DAILY_TOKEN_LIMIT:        raw.daily_token_limit,
  HIGH_WARNING_PERCENT:     raw.warning_threshold_percent  || 95,
  USAGE_INTERVAL:           raw.usage_check_interval_seconds || 60,
  IDLE_ALERT:               raw.idle_alert                 || false,
  SHUTDOWN_TIMEOUT:         raw.shutdown_timeout_seconds   || 60,
};
