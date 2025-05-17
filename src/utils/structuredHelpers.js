// src/utils/structuredHelpers.js

const { z } = require('zod');

function buildBooleanFlagSchema({ availableKeys }) {
  const shape = {};
  for (const key of availableKeys) {
    shape[key] = z.boolean().default(false);
  }
  return z.object(shape).strict();
}

function inferJsonSelectionFromFeedback({
  feedbackText,
  availableKeys,
  keySynonymsMap,
}) {
  console.log('inferJsonSelectionFromFeedback called with:');
  console.log('  feedbackText:', feedbackText);
  console.log('  availableKeys:', availableKeys);
  console.log('  keySynonymsMap:', keySynonymsMap);
  // TODO: implement NLP logic to pick keys
  return [];
}

module.exports = {
  inferJsonSelectionFromFeedback,
  buildBooleanFlagSchema,
};
