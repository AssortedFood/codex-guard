// src/orchestrator.js
const fs       = require('fs');
const path     = require('path');
const { loadState } = require('./stateManager');

const STAGE_DIR = path.resolve(__dirname, 'stages');
const VALID_STAGES = require('./stateManager').VALID_STAGES;

/**
 * Loads the current state and invokes the matching stage handler.
 * @param {Object} [overrideState] - optional state to use instead of reading from disk.
 */
async function runCurrentStage(overrideState) {
  const state = overrideState || loadState();
  const { stage } = state;

  if (!VALID_STAGES.includes(stage)) {
    throw new Error(`Cannot run unknown stage "${stage}"`);
  }

  const handlerFile = path.join(STAGE_DIR, `${stage}.js`);
  if (!fs.existsSync(handlerFile)) {
    throw new Error(`Handler not found for stage "${stage}" at:\n  ${handlerFile}`);
  }

  const { run } = require(handlerFile);
  if (typeof run !== 'function') {
    throw new Error(`Handler for "${stage}" does not export a run() function`);
  }

  await run(state);
}

module.exports = { runCurrentStage };
