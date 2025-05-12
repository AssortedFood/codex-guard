#!/usr/bin/env node
const fs           = require('fs');
const path         = require('path');
const { spawnSync }= require('child_process');
const initCmd      = require('./src/commands/init');
const { loadState }= require('./src/stateManager');

const LEGACY_PATH  = path.resolve(__dirname, 'src/guard.js');
const STAGES_DIR   = path.resolve(__dirname, 'src/stages');
const guardDir     = path.join(process.cwd(), '.guard');

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
    // sentinel finished -> legacy
    spawnSync('node', [LEGACY_PATH, '--full-auto'], { stdio: 'inherit' });
    return;
  }

  // in-progress sentinel -> dispatch to the right stage handler
  const handlerFile = path.join(STAGES_DIR, `${state.stage}.js`);
  if (!fs.existsSync(handlerFile)) {
    console.error(`❌  No stage handler for "${state.stage}" at ${handlerFile}`);
    process.exit(1);
  }
  const { run } = require(handlerFile);
  await run(state);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
