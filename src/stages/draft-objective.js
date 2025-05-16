// src/stages/draft-objective.js

const path                      = require('path');
const { showFile, askFeedbackOrProceed } = require('../utils/TUI');
const { writeFileWithCodex }    = require('../utils/codexWriter');
const { saveState }             = require('../stateManager');
const { runCurrentStage }       = require('../orchestrator');

const OBJECTIVE_PATH = path.join(process.cwd(), '.guard', 'objective.md');

async function run(state) {
  while (true) {
    showFile(OBJECTIVE_PATH);

    const { isProceed, feedback } = await askFeedbackOrProceed(
      'Enter feedback to improve the Objective, or type `/proceed` to finish:'
    );

    if (isProceed) break;

    // send feedback to Codex and stream its output live
    await writeFileWithCodex(
      'Update the `# Objective` section of this file. Incorporate the following feedback:',
      OBJECTIVE_PATH,
      feedback
    );
  }

  saveState({ stage: 'draft-usage' });
  console.log('\n✅  Objective finalized. Moving on to draft-usage.\n');

  await runCurrentStage();
}

module.exports = { run };
