// src/stages/draft-objective.js

const fs                = require('fs');
const path              = require('path');
const { prompt }        = require('enquirer');
const { writeFileWithCodex } = require('../utils/codexWriter');
const { saveState }     = require('../stateManager');
const { runCurrentStage } = require('../orchestrator');

const OBJECTIVE_PATH = path.join(process.cwd(), '.guard', 'objective.md');

async function run(state) {
  // 1) Loop until the user types '/proceed'
  while (true) {
    // 1a) Display current contents
    console.log('\n📝 Current objective:\n');
    console.log(fs.readFileSync(OBJECTIVE_PATH, 'utf8'));

    // 1b) Prompt for feedback or proceed
    const { userInput } = await prompt({
      type: 'input',
      name: 'userInput',
      message: 'Enter feedback to improve the Objective, or type `/proceed` to finish:',
    });

    // 2) If user signals done, exit loop
    if (userInput.trim() === '/proceed') {
      break;
    }

    // 3) Otherwise, send feedback to Codex and update the file
    await writeFileWithCodex({
      filePath: OBJECTIVE_PATH,
      instruction: [
        'Update only the `# Objective` section of this file.',
        'Incorporate the following feedback:',
        userInput
      ].join('\n\n')
    });
    // Loop back to show the updated version
  }

  // 4) Advance state to the next stage
  saveState({ stage: 'draft-usage' });
  console.log('\n✅  Objective finalized. Moving on to draft-usage.\n');
  await runCurrentStage();
}

module.exports = { run };
