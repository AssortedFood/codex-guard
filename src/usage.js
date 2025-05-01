// src/usage.js
const fetch = require('node-fetch');
const config = require('./config');
const logger = require('./logger');

/**
 * Fetches total tokens used today via the OpenAI usage endpoint.
 */
async function fetchTodayUsage() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set.');
  }

  const today = new Date().toISOString().split('T')[0];
  const url = `https://api.openai.com/v1/usage?date=${today}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to fetch usage: ${response.status} ${response.statusText}\n${text}`);
  }

  const data = await response.json();
  let totalTokens = 0;
  if (Array.isArray(data.data)) {
    for (const entry of data.data) {
      totalTokens += (entry.n_context_tokens_total || 0)
                   + (entry.n_generated_tokens_total || 0);
    }
  }
  return totalTokens;
}

module.exports = { fetchTodayUsage };

/* ------------------------------------------------------------------
   CLI entrypoint: when run with `node src/usage.js`, print one-shot
   usage and exit. Does nothing when required by other modules.
------------------------------------------------------------------ */
if (require.main === module) {
  (async () => {
    try {
      const used = await fetchTodayUsage();
      const { DAILY_TOKEN_LIMIT, HIGH_WARNING_PERCENT: WARN_PCT } = config;
      const pct = (used / DAILY_TOKEN_LIMIT) * 100;
      const uFmt = used.toLocaleString();
      const lFmt = DAILY_TOKEN_LIMIT.toLocaleString();

      if (used >= DAILY_TOKEN_LIMIT) {
        logger.error(`Over cap! (${uFmt}/${lFmt}).`);
        process.exit(1);
      } else if (pct >= WARN_PCT) {
        logger.warn(`Warning: ${pct.toFixed(1)}% used (${uFmt}/${lFmt}).`);
      } else {
        logger.info(`Usage: ${uFmt}/${lFmt} (${pct.toFixed(1)}%)`);
      }
    } catch (err) {
      logger.error(`Usage check failed: ${err.message}`);
      process.exit(2);
    }
  })();
}
