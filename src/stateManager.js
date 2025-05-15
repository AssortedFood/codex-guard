// src/stateManager.js
const fs   = require('fs');
const path = require('path');

const VALID_STAGES = [
  'draft-objective',
  'draft-usage',
  'refine-high',
  'refine-sub',
  'score-split',
  'deps-order',
  'exec',
  'validate',
  'done'
];

const STATE_PATH = path.join(process.cwd(), '.guard', 'state.json');

/**
 * Load and parse the current state.json.
 * @returns {Object} state object, e.g. { stage: 'initialized', ... }
 * @throws if the file is missing, malformed, or has an invalid stage.
 */
function loadState() {
  if (!fs.existsSync(STATE_PATH)) {
    throw new Error(`state.json not found at ${STATE_PATH}`);
  }

  let raw;
  try {
    raw = fs.readFileSync(STATE_PATH, 'utf8');
  } catch (err) {
    throw new Error(`Failed to read state.json: ${err.message}`);
  }

  let state;
  try {
    state = JSON.parse(raw);
  } catch (err) {
    throw new Error(`Invalid JSON in state.json: ${err.message}`);
  }

  if (!state.stage || typeof state.stage !== 'string') {
    throw new Error(`Missing or invalid "stage" property in state.json`);
  }
  if (!VALID_STAGES.includes(state.stage)) {
    throw new Error(
      `Unknown stage "${state.stage}" in state.json; must be one of: ${VALID_STAGES.join(', ')}`
    );
  }

  return state;
}

/**
 * Save the given state object to state.json.
 * @param {Object} newState - must include a valid `stage` string.
 */
function saveState(newState) {
  if (!newState.stage || typeof newState.stage !== 'string') {
    throw new Error(`Missing or invalid "stage" property when saving state`);
  }
  if (!VALID_STAGES.includes(newState.stage)) {
    throw new Error(
      `Attempt to save invalid stage "${newState.stage}". ` +
      `Valid stages are: ${VALID_STAGES.join(', ')}`
    );
  }

  const serialized = JSON.stringify(newState, null, 2) + '\n';
  try {
    fs.writeFileSync(STATE_PATH, serialized, 'utf8');
  } catch (err) {
    throw new Error(`Failed to write state.json: ${err.message}`);
  }
}

module.exports = {
  loadState,
  saveState,
  VALID_STAGES
};
