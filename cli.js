#!/usr/bin/env node
// cli.js
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const initCmd = require('./src/commands/init');
const { loadState } = require('./src/stateManager');
const { runCurrentStage } = require('./src/orchestrator');

const LEGACY_PATH = path.resolve(__dirname, 'src/guard.js');
const STAGES_DIR  = path.resolve(__dirname, 'src/stages');
const guardDir    = path.join(process.cwd(), '.guard');

async function main() {
  const [,, cmd] = process.argv;

  if (cmd === 'init') {
    // bootstrap .guard and then resume into the next stage
    await initCmd();
    return;
  }

  // no args: auto-detect mode
  if (!fs.existsSync(guardDir)) {
    // no sentinel state => legacy
    spawnSync('node', [LEGACY_PATH, '--full-auto'], { stdio: 'inherit' });
    return;
  }

  // have .guard/ – load state
  let state;
  try {
    state = loadState();
  } catch (err) {
    console.error(`❌  Could not load state.json: ${err.message}`);
    process.exit(1);
  }

  if (state.stage === 'done') {
    // sentinel finished → fall back to legacy Codex
    spawnSync('node', [LEGACY_PATH, '--full-auto'], { stdio: 'inherit' });
    return;
  }

  // in-progress sentinel → hand off to the orchestrator
  await runCurrentStage(state);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
