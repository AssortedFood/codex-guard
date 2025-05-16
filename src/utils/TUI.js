// src/utils/TUI.js

const fs = require('fs');
const { prompt } = require('enquirer');

/**
 * Display a file’s contents to the user.
 * @param {string} filePath - Path to the file to show.
 */
function showFile(filePath) {
  console.log(`\n📄 ${filePath}:\n`);
  console.log(fs.readFileSync(filePath, 'utf8'));
}

/**
 * Prompt the user for single-line feedback or a proceed command.
 * Hitting Enter submits whatever was typed.
 *
 * @param {string} message - The prompt message to display.
 * @param {string} [proceedKeyword='/proceed'] - The keyword that signals completion.
 * @returns {Promise<{isProceed: boolean, feedback: string}>}
 */
async function askFeedbackOrProceed(message, proceedKeyword = '/proceed') {
  const { userInput } = await prompt({
    type: 'input',
    name: 'userInput',
    message
  });

  if (userInput.trim() === proceedKeyword) {
    return { isProceed: true, feedback: '' };
  } else {
    return { isProceed: false, feedback: userInput };
  }
}

module.exports = {
  showFile,
  askFeedbackOrProceed
};
