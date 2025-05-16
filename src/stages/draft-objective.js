// src/stages/draft-objective.js

const fs = require('fs');
const path = require('path');
const { showFile, askFeedbackOrProceed, codexEditWithSpinner } = require('../utils/TUI');
const { saveState } = require('../stateManager');
const { runCurrentStage } = require('../orchestrator');

const OBJECTIVE_PATH = path.join(process.cwd(), '.guard', 'objective.md');
// load the template with your instruction
const TEMPLATE_PATH  = path.resolve(__dirname, '../../prompt-templates/draft-objective.md');
const DRAFT_INSTRUCTION = fs.readFileSync(TEMPLATE_PATH, 'utf8').trim();

async function run(state) {
  // 1) Loop until the user types '/proceed'
  while (true) {
    // 1a) Display current contents
    showFile(OBJECTIVE_PATH);

    // 1b) Prompt for feedback or proceed
    const { isProceed, feedback } = await askFeedbackOrProceed(
      'Enter feedback to improve the Objective, or type `/proceed` to finish:'
    );

    // 2) If user signals done, exit loop
    if (isProceed) {
      break;
    }

    // 3) Otherwise, send feedback to Codex via the TUI spinner wrapper
    await codexEditWithSpinner(
      DRAFT_INSTRUCTION,
      OBJECTIVE_PATH,
      feedback
    );
    // Loop back to show the updated version
  }

  // 4) Advance state to the next stage
  saveState({ stage: 'draft-usage' });
  console.log('\n✅  Objective finalized. Moving on to draft-usage.\n');

  // 5) Immediately invoke the orchestrator to continue with the next stage
  await runCurrentStage();
}

module.exports = { run };
