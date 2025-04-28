// wrapper.js

const { spawn } = require('child_process');
const { fetchTodayUsage } = require('./usage');
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');

let codexProcess = null;

// Load config
const configPath = path.join(__dirname, 'config.json');
if (!fs.existsSync(configPath)) {
  console.error(chalk.red('[CodexGuard] Missing config.json file!'));
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const DAILY_TOKEN_LIMIT = config.daily_token_limit;
const HIGH_WARNING_PERCENT = config.warning_threshold_percent || 80; // fallback to 80%

let warnedHigh = false;

// Start Codex CLI
function runCodex(args) {
  codexProcess = spawn('codex', args, { stdio: 'inherit' });

  codexProcess.on('exit', (code) => {
    console.log(chalk.blue(`[CodexGuard] Codex exited with code ${code}`));
    process.exit(code ?? 1);
  });
}

// Poll OpenAI usage every minute and warn/kill as needed
function startUsagePolling() {
  setInterval(async () => {
    try {
      const tokensUsed = await fetchTodayUsage();
      const percentUsed = (tokensUsed / DAILY_TOKEN_LIMIT) * 100;
      const usedFormatted = tokensUsed.toLocaleString();
      const limitFormatted = DAILY_TOKEN_LIMIT.toLocaleString();

      // High-threshold warning
      if (!warnedHigh && percentUsed >= HIGH_WARNING_PERCENT) {
        console.warn(
          chalk.yellow(
            `[CodexGuard] Warning: reached ${percentUsed.toFixed(1)}% of daily limit ` +
            `(${usedFormatted}/${limitFormatted}), threshold is ${HIGH_WARNING_PERCENT}%.`
          )
        );
        warnedHigh = true;
      }

      // Hard cap
      if (tokensUsed >= DAILY_TOKEN_LIMIT) {
        console.error(
          chalk.red(
            `[CodexGuard] Token limit exceeded (${usedFormatted}/${limitFormatted}). ` +
            `Shutting down Codex.`
          )
        );
        if (codexProcess) codexProcess.kill('SIGINT');
      } else {
        console.log(
          chalk.cyan(
            `[CodexGuard] Usage: ${usedFormatted}/${limitFormatted} ` +
            `(${percentUsed.toFixed(1)}%)`
          )
        );
      }
    } catch (err) {
      console.error(chalk.red(`[CodexGuard] Failed to fetch usage: ${err.message}`));
    }
  }, 60_000); // every 60 seconds
}

// Entrypoint
function main() {
  const args = process.argv.slice(2);
  console.log(
    chalk.green(
      `[CodexGuard] Launched with CodexGuard ${args.join(' ')}`
    )
  );
  runCodex(args);
  startUsagePolling();

  process.on('SIGINT', () => {
    console.log(chalk.blue('[CodexGuard] Received SIGINT. Shutting down.'));
    if (codexProcess && !codexProcess.killed) {
      codexProcess.kill('SIGINT');
    }
    process.exit();
  });
}

main();
