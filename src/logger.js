// src/logger.js
const fs = require('fs');
const chalk = require('chalk');

const PREFIX = '[CodexGuard]';

// Open the controlling terminal for title updates
let ttyFd;
try {
  ttyFd = fs.openSync('/dev/tty', 'w');
} catch (err) {
  console.error('⚠️  Could not open /dev/tty, falling back to stderr');
  ttyFd = process.stderr.fd;
}

// Write OSC title sequence to controlling terminal
function setTitle(msg) {
  const seq = `\u001b]0;${msg}\u0007`;
  fs.writeSync(ttyFd, seq);
}

function drawTopBar(msg) {
  // save cursor, move to line1,col1, clear line, write, restore cursor
  process.stdout.write('\u001b7');
  process.stdout.write('\u001b[1;1H');
  process.stdout.write('\u001b[2K');
  process.stdout.write(msg);
  process.stdout.write('\u001b8');
}

function fmt(message) {
  return `${PREFIX} ${message}`;
}

function info(message) {
  drawTopBar(chalk.cyan(fmt(message)));
  setTitle(message);
}

function success(message) {
  drawTopBar(chalk.green(fmt(message)));
  setTitle(message);
}

function warn(message) {
  drawTopBar(chalk.yellow(fmt(message)));
  setTitle(message);
}

function error(message) {
  drawTopBar(chalk.red(fmt(message)));
  setTitle(message);
}

module.exports = { info, success, warn, error };