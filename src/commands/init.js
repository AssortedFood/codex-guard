// src/commands/init.js
const fs            = require('fs');
const path          = require('path');
const { saveState } = require('../stateManager');
// import the orchestrator
const { runCurrentStage } = require('../orchestrator');

module.exports = async function init() {
  const root = process.cwd();
  const guardDir = path.join(root, '.guard');
  const pkgRoot = path.resolve(__dirname, '..', '..');
  const objectiveTemplate = path.join(pkgRoot, 'prompt-templates', 'objective.md');
  const objectivePath = path.join(guardDir, 'objective.md');
  const usageTemplate = path.join(pkgRoot, 'prompt-templates', 'usage.md');
  const usagePath = path.join(guardDir, 'usage.md');
  const planPath = path.join(guardDir, 'plan.json');

  // 1) Bootstrap if needed
  if (!fs.existsSync(guardDir)) {
    try {
      fs.mkdirSync(guardDir);
      if (
          !fs.existsSync(objectiveTemplate) ||
          !fs.existsSync(usageTemplate)
        ) {
        console.error('❌  Missing one or more template files.');
        process.exit(1);
      }
      fs.copyFileSync(objectiveTemplate, objectivePath);
      fs.copyFileSync(usageTemplate, usagePath);
      fs.writeFileSync(planPath, '[]\n', 'utf8');
      saveState({ stage: 'draft-objective' });
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
