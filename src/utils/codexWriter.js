// src/utils/codexWriter.js

const path  = require('path');
const { spawn } = require('child_process');

// Toggle this to true to see debug logs and Codex output
const DEBUG = false;

/**
 * Instructs the Codex CLI to edit a file in place using its built-in file-writing capability.
 * Shows a spinner while the Codex process is running.
 *
 * @param {string} promptMessage - A concise instruction for the edit.
 * @param {string} filePath      - Path to the target file (relative to project root, e.g. ".guard/objective.md").
 * @param {string} userFeedback  - The user’s single-line feedback.
 * @returns {Promise<void>}
 */
function writeFileWithCodex(promptMessage, filePath, userFeedback) {
  return new Promise((resolve, reject) => {
    const relativePath = path.relative(process.cwd(), filePath);

    const instruction = [
      promptMessage,
      `File: ${relativePath}`,
      `Feedback: ${userFeedback}`,
      `Please modify only this file. Do not read, list, or write any other files.`,
      `Do not execute shell commands, git commands, or external tool calls.`
    ].join('\n');

    const cmd = [
      'codex',
      '-a', 'auto-edit',
      '--quiet',
      instruction
    ];

    if (DEBUG) {
      console.log(`\n🔧 Running: ${cmd.map(arg =>
        arg.includes('\n') ? `"${arg}"` : arg
      ).join(' ')}\n`);
    }

    // Hide output from Codex unless in DEBUG mode
    const stdioOption = DEBUG
      ? ['pipe', 'inherit', 'inherit']
      : ['pipe', 'ignore', 'ignore'];

    // Start spinner if not debugging
    let spinner;
    if (!DEBUG) {
      const frames = ['|','/','-','\\'];
      let i = 0;
      spinner = setInterval(() => {
        process.stdout.write(`\r⏳ ${frames[i = (i + 1) % frames.length]} Editing ${relativePath}`);
      }, 100);
    }

    const proc = spawn(cmd[0], cmd.slice(1), {
      stdio: stdioOption,
      cwd: process.cwd()
    });

    proc.on('error', err => {
      if (spinner) {
        clearInterval(spinner);
        process.stdout.write('\r'); // clear spinner line
      }
      if (DEBUG) console.error('✖ Codex process error:', err);
      reject(err);
    });

    proc.on('exit', code => {
      if (spinner) {
        clearInterval(spinner);
        process.stdout.write('\r'); // clear spinner line
      }
      if (DEBUG) console.log(`ℹ Codex exited with code ${code}`);
      if (code !== 0) {
        return reject(new Error(`codex exited with code ${code}`));
      }
      resolve();
    });
  });
}

module.exports = { writeFileWithCodex };
