// logger.js
const chalk = require('chalk');

const PREFIX = '[CodexGuard]';

/**
 * Always draw into the top-line overlay.
 */
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
}

function success(message) {
  drawTopBar(chalk.green(fmt(message)));
}

function warn(message) {
  drawTopBar(chalk.yellow(fmt(message)));
}

function error(message) {
  drawTopBar(chalk.red(fmt(message)));
}

module.exports = { info, success, warn, error };
