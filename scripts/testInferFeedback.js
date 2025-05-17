#!/usr/bin/env node
// scripts/testInferFeedback.js

const fs = require('fs');
const path = require('path');
const { showFile, askFeedbackOrProceed } = require('../src/utils/TUI');
const { inferJsonSelectionFromFeedback } = require('../src/utils/structuredHelpers');

async function main() {
  const planPath = path.join(process.cwd(), '.guard', 'plan.json');

  // 1) Show current plan.json
  showFile(planPath);

  // 2) Prompt for feedback (we'll ignore /proceed here and just grab whatever they type)
  const { isProceed, feedback } = await askFeedbackOrProceed(
    'Enter feedback on which tasks you want to adjust (or type /proceed to exit):'
  );

  if (isProceed) {
    console.log('No feedback provided—exiting.');
    process.exit(0);
  }

  // 3) Load available IDs from plan.json
  let plan;
  try {
    plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
  } catch (err) {
    console.error(`Failed to read plan.json: ${err.message}`);
    process.exit(1);
  }
  const availableKeys = plan.map(item => item.id);

  // 4) Call inferJsonSelectionFromFeedback
  const keySynonymsMap = {
    // you can populate this with synonyms if desired
    // e.g. "authentication": ["auth", "login"]
  };

  const selectedKeys = inferJsonSelectionFromFeedback({
    feedbackText: feedback,
    availableKeys,
    keySynonymsMap
  });

  // 5) Show result
  console.log('\n🎯 Inferred task IDs to update:', selectedKeys);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
