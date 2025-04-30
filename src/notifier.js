// src/notifier.js

/**
 * Simple ANSI-stripper (removes CSI [m sequences)
 */
function stripAnsi(str) {
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}

/**
 * Creates a detector for a given target string.
 * Buffers incoming chunks (ANSI-stripped + lowercased), and
 * calls any registered callbacks as soon as the target is seen.
 */
function createDetector(target, opts = {}) {
  const t = target.toLowerCase();
  const bufMax = opts.bufferMax || 200;
  let buffer = '';
  const callbacks = [];

  return {
    /** Feed each stdout chunk here */
    feed(chunk) {
      buffer += stripAnsi(chunk.toString()).toLowerCase();
      if (buffer.includes(t)) {
        callbacks.forEach(cb => cb());
        // clear buffer so we only fire once per appearance
        buffer = '';
      }
      // trim to last bufMax chars
      if (buffer.length > bufMax) {
        buffer = buffer.slice(-bufMax);
      }
    },

    /** Register a callback to run on detection */
    onDetect(cb) {
      callbacks.push(cb);
    }
  };
}

module.exports = { createDetector };
