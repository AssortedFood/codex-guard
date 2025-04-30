// usage.js

const fetch = require('node-fetch');

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
      totalTokens += (entry.n_context_tokens_total || 0) + (entry.n_generated_tokens_total || 0);
    }
  }

  return totalTokens;
}

module.exports = { fetchTodayUsage };
