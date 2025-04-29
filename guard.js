// guard.js
const { spawn } = require('child_process');
const { fetchTodayUsage } = require('./usage');
const path = require('path');
const fs = require('fs');
const logger = require('./logger');

let codexProcess = null;
let pendingShutdown = false;
let warnedHigh = false;
let stdoutBuffer = '';

// Load global config from ~/projects/codex-guard/config.json
const configPath = path.join(__dirname, 'config.json');
if (!fs.existsSync(configPath)) {
  logger.error(
    `Missing global config at ${configPath} – please create it with daily_token_limit and warning_threshold_percent.`
  );
  process.exit(1);
}
const {
  daily_token_limit: DAILY_TOKEN_LIMIT,
  warning_threshold_percent: HIGH_WARNING_PERCENT = 95,
} = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Strip ANSI escape codes
function stripAnsi(str) {
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}

// Watch for “send a message” prompt (only once shutdown is pending)
function watchForPrompt(chunk) {
  if (!pendingShutdown) return;

  stdoutBuffer += stripAnsi(chunk.toString()).toLowerCase();
  if (stdoutBuffer.includes('send a message')) {
    logger.error('Request complete — shutting down Codex session.');
    codexProcess.kill('SIGTERM');
  }

  // keep buffer to last 200 chars
  if (stdoutBuffer.length > 200) {
    stdoutBuffer = stdoutBuffer.slice(-200);
  }
}

// Mark that we should shut down after current response
function requestShutdown() {
  if (pendingShutdown) return;
  pendingShutdown = true;
  logger.error('Daily token cap reached — will shut down after this response.');
}

// Spawn the Codex CLI, teeing stdout through our watcher
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

  codexProcess.on('exit', () => process.exit(0));
}

// Perform the one-time “first usage” check; return true if already over cap
async function firstUsageCheck() {
  try {
    const used = await fetchTodayUsage();
    const pct = (used / DAILY_TOKEN_LIMIT) * 100;
    const uFmt = used.toLocaleString();
    const lFmt = DAILY_TOKEN_LIMIT.toLocaleString();

    if (used >= DAILY_TOKEN_LIMIT) {
      logger.error(`You are already over your daily cap! (${uFmt}/${lFmt}).`);
      return true;
    }

    // Not over yet: warn or show usage
    if (pct >= HIGH_WARNING_PERCENT) {
      logger.warn(
        `Warning: ${pct.toFixed(1)}% of daily limit used (${uFmt}/${lFmt}).`
      );
      warnedHigh = true;
    } else {
      logger.info(`Usage: ${uFmt}/${lFmt} (${pct.toFixed(1)}%)`);
    }
  } catch (err) {
    logger.error(`Initial usage check failed: ${err.message}`);
  }
  return false;
}

// Poll usage every 60 s, auto-shutdown if cap crossed mid-session
function startUsagePolling() {
  setInterval(async () => {
    try {
      const used = await fetchTodayUsage();
      const pct = (used / DAILY_TOKEN_LIMIT) * 100;
      const uFmt = used.toLocaleString();
      const lFmt = DAILY_TOKEN_LIMIT.toLocaleString();

      if (!warnedHigh && pct >= HIGH_WARNING_PERCENT) {
        logger.warn(
          `Warning: ${pct.toFixed(1)}% of daily limit used (${uFmt}/${lFmt}).`
        );
        warnedHigh = true;
      }

      if (used >= DAILY_TOKEN_LIMIT) {
        requestShutdown();
      } else {
        logger.info(`Usage: ${uFmt}/${lFmt} (${pct.toFixed(1)}%)`);
      }
    } catch (err) {
      logger.error(`Usage check failed: ${err.message}`);
    }
  }, 60_000);
}

// Entrypoint
async function main() {
  const args = process.argv.slice(2);
  logger.success(`Launched ${args.join(' ')}`);

  runCodex(args);

  const alreadyOver = await firstUsageCheck();
  if (!alreadyOver) {
    startUsagePolling();
  }

  process.on('SIGINT', () => {
    requestShutdown();
  });
}

main();
