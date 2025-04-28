// wrapper.js

const { spawn } = require('child_process');
const { fetchTodayUsage } = require('./usage');
const path = require('path');
const fs = require('fs');

let codexProcess = null;

// Load config
const configPath = path.join(__dirname, 'config.json');
if (!fs.existsSync(configPath)) {
  console.error('[wrapper] Missing config.json file!');
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const DAILY_TOKEN_LIMIT = config.daily_token_limit;

// Start Codex CLI
function runCodex(args) {
  codexProcess = spawn('codex', args, { stdio: 'inherit' });

  codexProcess.on('exit', (code) => {
    console.log(`[wrapper] Codex exited with code ${code}`);
    process.exit(code ?? 1);
  });
}

// Poll OpenAI usage every minute
function startUsagePolling() {
  setInterval(async () => {
    try {
      const tokensUsed = await fetchTodayUsage();
      console.log(`[wrapper] Tokens used today: ${tokensUsed.toLocaleString()} / ${DAILY_TOKEN_LIMIT.toLocaleString()}`);

      if (tokensUsed >= DAILY_TOKEN_LIMIT) {
        console.warn(`[wrapper] Token limit exceeded (${tokensUsed.toLocaleString()} used, cap is ${DAILY_TOKEN_LIMIT.toLocaleString()}).`);
        if (codexProcess) {
          codexProcess.kill('SIGINT');
        }
      }
    } catch (error) {
      console.error('[wrapper] Failed to fetch usage:', error.message);
    }
  }, 60 * 1000); // every 60 seconds
}

// Entrypoint
function main() {
  const args = process.argv.slice(2);
  runCodex(args);
  startUsagePolling();

  process.on('SIGINT', () => {
    console.log('[wrapper] Received SIGINT. Shutting down.');
    if (codexProcess && !codexProcess.killed) {
      codexProcess.kill('SIGINT');
    }
    process.exit();
  });
}

main();
