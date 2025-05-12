// src/commands/init.js
const fs            = require('fs');
const path          = require('path');
const { saveState } = require('../stateManager');
// import the orchestrator
const { runCurrentStage } = require('../orchestrator');

module.exports = async function init() {
  const root     = process.cwd();
  const guardDir = path.join(root, '.guard');
  const pkgRoot  = path.resolve(__dirname, '..', '..');
  const tmpl     = path.join(pkgRoot, 'prompt-templates', 'objective.md');
  const dest     = path.join(guardDir, 'objective.md');
  const planPath = path.join(guardDir, 'plan.json');

  // 1) Bootstrap if needed
  if (!fs.existsSync(guardDir)) {
    try {
      fs.mkdirSync(guardDir);
      if (!fs.existsSync(tmpl)) {
        console.error('❌  Missing prompt-templates/objective.md in the package.');
        process.exit(1);
      }
      fs.copyFileSync(tmpl, dest);
      fs.writeFileSync(planPath, '[]\n', 'utf8');
      saveState({ stage: 'initialized' });
      console.log('✅  Initialized sentinel scaffolding in .guard/');
    } catch (err) {
      console.error(`❌  Failed to bootstrap .guard/: ${err.message}`);
      process.exit(1);
    }
  } else {
    console.log('🔄  .guard already present—resuming pipeline.');
  }

  // 2) Hand off to the orchestrator, which will load state.json
  //    and invoke the correct stage handler (or legacy wrapper).
  try {
    await runCurrentStage();
  } catch (err) {
    console.error(`❌  Error advancing pipeline: ${err.message}`);
    process.exit(1);
  }
};
