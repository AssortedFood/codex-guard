// src/utils/TUI.js

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const chalk = require('chalk');
const { runCodexAutoEdit } = require('./codexWriter');

/**
 * Display a file’s contents to the user.
 */
function showFile(filePath) {
  const relativePath = path.relative(process.cwd(), filePath);
  console.log(`\n📄 ${relativePath}:\n`);
  console.log(fs.readFileSync(filePath, 'utf8'));
}

/**
 * Prompt the user for single-line feedback or a proceed command.
 */
function askFeedbackOrProceed(message, proceedKeyword = '/proceed') {
  return new Promise(resolve => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(`${message}\n> `, answer => {
      rl.close();
      const t = answer.trim();
      resolve({ isProceed: t === proceedKeyword, feedback: t === proceedKeyword ? '' : answer });
    });
  });
}

/**
 * Show a spinner + latest event while Codex runs, then print final status.
 *
 * @param {string} promptMessage
 * @param {string} filePath
 * @param {string} feedback
 */
async function codexEditWithSpinner(promptMessage, filePath, feedback) {
  const relative = path.relative(process.cwd(), filePath);
  let lastEvent = '';

  const frames = ['|','/','-','\\'];
  let idx = 0;
  function redraw() {
    readline.clearLine(process.stdout, 0);
    readline.cursorTo(process.stdout, 0);
    process.stdout.write(
      chalk.dim(`⏳ ${frames[idx % frames.length]} Editing ${relative}`) +
      (lastEvent ? '  ' + lastEvent : '')
    );
  }

  const spinner = setInterval(() => {
    idx++;
    redraw();
  }, 100);

  try {
    await runCodexAutoEdit(promptMessage, filePath, feedback, msg => {
      if (msg.type === 'function_call') {
        lastEvent = chalk.cyan(`⚙️  ${msg.name}()`);
      } else if (msg.type === 'function_call_output') {
        const code = msg.metadata?.exit_code;
        if (code === 0) {
          lastEvent = chalk.green(`✅ ${msg.call_id}`);
        } else if (typeof code === 'number') {
          lastEvent = chalk.red(`✖ ${msg.call_id} (${code})`);
        } else {
          lastEvent = chalk.cyan(`🔮 ${msg.call_id}`);
        }
      }
      redraw();
    });

    // final success
    clearInterval(spinner);
    readline.clearLine(process.stdout, 0);
    readline.cursorTo(process.stdout, 0);
    console.log(chalk.green(`✔ ${relative} updated successfully`));

  } catch (err) {
    clearInterval(spinner);
    readline.clearLine(process.stdout, 0);
    readline.cursorTo(process.stdout, 0);
    console.log(chalk.red(`✖ codex failed: ${err.message}`));
    throw err;
  }
}

module.exports = {
  showFile,
  askFeedbackOrProceed,
  codexEditWithSpinner
};