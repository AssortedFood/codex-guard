// src/stages/draft-objective.js
const fs = require('fs');
const path = require('path');
const { saveState } = require('../stateManager');
const { spawnSync } = require('child_process');
const {
  createScreen, createBox, createLog
} = require('../ui/blessedHelpers');

async function run() {
  const guardDir = path.join(process.cwd(), '.guard');
  const filePath = path.join(guardDir, 'objective.md');

  // Ensure template exists
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '# Objective\n\n', 'utf8');
  }

  // Read initial content
  let content = fs.readFileSync(filePath, 'utf8');

  const screen = createScreen('Draft Objective');

  // Main UI components
  const editorBox = createBox({
    top: 1, left: 0,
    width: '100%', height: '70%',
    label: ' {bold}Objective Editor{/bold} ',
    content
  });
  screen.append(editorBox);

  const log = createLog({
    top: '70%', left: 0,
    width: '100%', height: '25%',
    label: ' {bold}Instructions{/bold} '
  });
  screen.append(log);

  screen.render();

  // Helper to run Codex auto-edit
  function autoEdit(feedback) {
    const prompt = `Based on this feedback: "${feedback}", edit .guard/objective.md`;
    const res = spawnSync('codex', ['-a','auto-edit','--quiet', prompt], {
      encoding: 'utf8'
    });
    if (res.status !== 0) {
      throw new Error(`Codex failed: ${res.stderr}`);
    }
    content = res.stdout;
    fs.writeFileSync(filePath, content, 'utf8');
  }

  // Interaction loop
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  function ask(question) {
    return new Promise(resolve =>
      readline.question(question, ans => resolve(ans.trim()))
    );
  }

  try {
    while (true) {
      // Show current content
      editorBox.setContent(content);
      log.log("Enter natural-language feedback, or just press Enter to skip:");
      screen.render();

      const feedback = await ask('Feedback: ');
      if (feedback) {
        autoEdit(feedback);
      }

      // Re-render and ask approval
      editorBox.setContent(content);
      log.log('Preview updated. Approve? (y/n)');
      screen.render();

      const approve = (await ask('Approve? ')).toLowerCase();
      if (approve === 'y' || approve === 'yes') break;
    }
  } finally {
    readline.close();
  }

  // Final save & state transition
  saveState({ stage: 'draft-usage' });
  screen.destroy();
  console.log('\n✅ Objective finalized. Moving to draft-usage.\n');
}

module.exports = { run };
