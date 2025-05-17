#!/usr/bin/env node
// scripts/testInferFeedback.js

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

  const selectedKeys = await inferJsonSelectionFromFeedback({ planPath, feedbackText: feedback });

  // 4) Show result
  console.log('\n🎯 Inferred task IDs to update:', selectedKeys);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
