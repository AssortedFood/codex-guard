// src/stages/draft-usage.js

const fs = require('fs');
const path = require('path');
const { showFile, askFeedbackOrProceed, codexEditWithSpinner } = require('../utils/TUI');
const { saveState } = require('../stateManager');
const { runCurrentStage } = require('../orchestrator');

const USAGE_PATH    = path.join(process.cwd(), '.guard', 'usage.md');
// load the template instruction
const TEMPLATE_PATH = path.resolve(__dirname, '../../prompt-templates/draft-usage.md');
const DRAFT_INSTRUCTION = fs.readFileSync(TEMPLATE_PATH, 'utf8').trim();

async function run(state) {
  // Loop until the user types '/proceed'
  while (true) {
    // Display current contents
    showFile(USAGE_PATH);

    // Prompt for feedback or proceed
    const { isProceed, feedback } = await askFeedbackOrProceed(
      'Enter feedback to improve the Usage section, or type `/proceed` to finish:'
    );

    // If user signals done, exit loop
    if (isProceed) {
      break;
    }

    // Otherwise, send feedback to Codex via the TUI spinner wrapper
    await codexEditWithSpinner(
      DRAFT_INSTRUCTION,
      USAGE_PATH,
      feedback
    );
    // Loop back to show the updated version
  }

  // Advance state to the next stage
  saveState({ stage: 'refine-high' });
  console.log('\n✅  Usage section finalized. Moving on to refine-high.\n');

  // Immediately invoke the orchestrator to continue with the next stage
  await runCurrentStage();
}

module.exports = { run };
