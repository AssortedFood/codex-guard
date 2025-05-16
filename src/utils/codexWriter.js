// src/utils/codexWriter.js

const path = require('path');
const { spawn } = require('child_process');

/**
 * Instructs the Codex CLI to edit a file in place using its built-in file-writing capability.
 * @param {string} promptMessage - A concise instruction for the edit.
 * @param {string} filePath      - Path to the target file (relative to project root, e.g. ".guard/objective.md").
 * @param {string} userFeedback  - The user’s single-line feedback.
 * @returns {Promise<void>}
 */
function writeFileWithCodex(promptMessage, filePath, userFeedback) {
  return new Promise((resolve, reject) => {
    // Compute the relative path for the Codex prompt
    const relativePath = path.relative(process.cwd(), filePath);

    // Build the instruction using the relative path
    const instruction = [
        // Base instruction from caller
        promptMessage,
        // File to modify
        `File: ${relativePath}`,
        // User feedback
        `Feedback: ${userFeedback}`,
        // Strict constraints
        `Please modify only this file. Do not read, list, or write any other files.`,
        `Where not explicitly required to read and edit this file, do not execute shell commands, git commands, or external tool calls.`,
      ].join('\n');

    // Prepare the Codex CLI command
    const cmd = [
      'codex',
      '-a', 'full-auto',
      '--quiet',
      instruction
    ];

    // Log the exact command for visibility
    console.log(`\n🔧 Running: ${cmd.map(arg =>
      arg.includes('\n') ? `"${arg}"` : arg
    ).join(' ')}\n`);

    // Spawn codex; let it read and write the file itself
    const proc = spawn(cmd[0], cmd.slice(1), {
      stdio: 'inherit',
      cwd: process.cwd()
    });

    proc.on('error', err => reject(err));
    proc.on('exit', code => {
      if (code !== 0) {
        return reject(new Error(`codex exited with code ${code}`));
      }
      resolve();
    });
  });
}

module.exports = { writeFileWithCodex };
