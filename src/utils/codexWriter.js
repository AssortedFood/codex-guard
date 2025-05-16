// src/utils/codexWriter.js

const path  = require('path');
const { spawn } = require('child_process');

// Toggle to true to log the full `codex` command
const DEBUG = false;

/**
 * Spawn Codex in full-auto/quiet mode, parse its JSON stdout,
 * and invoke onEvent(msg) for each parsed JSON object.
 *
 * @param {string} promptMessage  Instruction for Codex.
 * @param {string} filePath       Relative path to the file.
 * @param {string} feedback       User’s feedback.
 * @param {(msg: object) => void} onEvent  Callback for each JSON event.
 * @returns {Promise<void>}
 */
function runCodexAutoEdit(promptMessage, filePath, feedback, onEvent) {
  return new Promise((resolve, reject) => {
    const relative = path.relative(process.cwd(), filePath);
    const instruction = [
      promptMessage,
      `File: ${relative}`,
      `Feedback: ${feedback}`,
      `Modify only this file; do not inspect or write any other files, and do not make any unrelated tool calls (e.g. git).`
    ].join('\n');

    const cmd = ['codex', '-a', 'full-auto', '--quiet', instruction];

    if (DEBUG) {
      console.log('🔧 [codexWriter] Running:', cmd.map(a =>
        a.includes('\n') ? `"${a}"` : a
      ).join(' '));
    }

    const proc = spawn(cmd[0], cmd.slice(1), {
      stdio: ['ignore', 'pipe', 'ignore'],
      cwd: process.cwd()
    });

    let buffer = '';
    proc.stdout.setEncoding('utf8');

    proc.stdout.on('data', chunk => {
      buffer += chunk;
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop(); // incomplete tail

      for (const line of lines) {
        if (!line.trim()) continue;
        let msg;
        try {
          msg = JSON.parse(line);
        } catch (e) {
          if (DEBUG) console.error('🔁 JSON parse error:', e, line);
          continue;
        }
        // Only propagate the events the UI cares about:
        if (msg.type === 'function_call' || msg.type === 'function_call_output') {
          onEvent(msg);
        }
      }
    });

    proc.on('error', err => reject(err));
    proc.on('exit', code => {
      if (code === 0) return resolve();
      return reject(new Error(`codex exited with code ${code}`));
    });
  });
}

module.exports = { runCodexAutoEdit };
