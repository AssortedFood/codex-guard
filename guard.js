// guard.js

const { spawn } = require('child_process');
const { fetchTodayUsage } = require('./usage');
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');

let codexProcess = null;
let pendingShutdown = false;
let warnedHigh = false;
let stdoutBuffer = '';

// Load config
const configPath = path.join(__dirname, 'config.json');
if (!fs.existsSync(configPath)) {
  console.error(chalk.red('[CodexGuard] Missing config.json – please create one in the project root.'));
  process.exit(1);
}
const { daily_token_limit: DAILY_TOKEN_LIMIT, warning_threshold_percent: HIGH_WARNING_PERCENT = 95 } = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Strip ANSI escape codes
function stripAnsi(s) {
  return s.replace(/\x1b\[[0-9;]*m/g, '');
}

// Watch for “send a message” prompt (only once shutdown is pending)
function watchForPrompt(chunk) {
  if (!pendingShutdown) return;
  stdoutBuffer += stripAnsi(chunk.toString()).toLowerCase();
  if (stdoutBuffer.includes('send a message')) {
    console.error(chalk.red(
      '[CodexGuard] Current request finished — terminating Codex session.'
    ));    
    codexProcess.kill('SIGTERM');
  }
  // keep buffer to last 200 characters
  if (stdoutBuffer.length > 200) {
    stdoutBuffer = stdoutBuffer.slice(-200);
  }
}

// Mark that we should shut down once the current response finishes
function requestShutdown() {
  if (pendingShutdown) return;
  pendingShutdown = true;
  console.error(chalk.red(
    '[CodexGuard] Daily token cap reached – will shut down after this request completes.'
  ));
}

// Spawn the Codex CLI, teeing its stdout through our watcher
function runCodex(args) {
  codexProcess = spawn('codex', args, {
    stdio: ['inherit', 'pipe', 'pipe'],
    env: { ...process.env, FORCE_COLOR: '1' },
  });

  codexProcess.stdout.on('data', chunk => {
    process.stdout.write(chunk);
    watchForPrompt(chunk);
  });

  codexProcess.stderr.pipe(process.stderr);

  codexProcess.on('exit', (code, signal) => {
    const detail = signal
      ? `terminated by ${signal}`
      : `exited with code ${code}`;
    console.log(chalk.blue(`[CodexGuard] Codex has terminated (${detail}).`));
    process.exit(0);
  });
}

// Poll OpenAI daily usage every 60 seconds
function startUsagePolling() {
  setInterval(async () => {
    try {
      const used = await fetchTodayUsage();
      const pct  = used / DAILY_TOKEN_LIMIT * 100;
      const uFmt = used.toLocaleString();
      const lFmt = DAILY_TOKEN_LIMIT.toLocaleString();

      if (!warnedHigh && pct >= HIGH_WARNING_PERCENT) {
        console.warn(chalk.yellow(
          `[CodexGuard] Warning: ${pct.toFixed(1)}% of daily limit used (${uFmt}/${lFmt}).`
        ));
        warnedHigh = true;
      }

      if (used >= DAILY_TOKEN_LIMIT) {
        requestShutdown();
      } else {
        console.log(chalk.cyan(
          `[CodexGuard] Usage: ${uFmt}/${lFmt} (${pct.toFixed(1)}%)`
        ));
      }
    } catch (err) {
      console.error(chalk.red(`[CodexGuard] Usage check failed: ${err.message}`));
    }
  }, 10_000);
}

// Entrypoint
function main() {
  const args = process.argv.slice(2);
  console.log(chalk.green(
    `[CodexGuard] Launched – spawning codex with args: ${args.join(' ')}`
  ));

  runCodex(args);
  startUsagePolling();

  process.on('SIGINT', () => {
    requestShutdown();
  });
}

main();
