// src/utils/structuredHelpers.js

const { z } = require('zod');
const { fetchStructuredResponse } = require('./openai');
const { parseJson, filterJson } = require('./json');

function buildBooleanFlagSchema({ availableKeys }) {
  const shape = {};
  for (const key of availableKeys) {
    shape[key] = z.boolean();
  }
  return z.object(shape).strict();
}

async function inferJsonSelectionFromFeedback({ planPath, feedbackText }) {
    // Load available IDs from plan.json
    const plan = parseJson(planPath)
    const filteredPlan = filterJson(plan, { fields: ['id', 'description'] });
    const availableKeys = filteredPlan.map(item => item.id);
    const model = 'gpt-4.1-mini'
    const schema = buildBooleanFlagSchema({ availableKeys });
    const systemMessage = `
    You are a JSON flagging assistant.

    Your responsibilities:
    1. Read the appended plan.json.
    2. Read the user’s feedback.
    3. Identify which tasks are related to that feedback.
    4. For each task ID, output:
        • true  → task is related
        • false → task is unrelated
    `
    const userMessage = `
    plan.json:
    ${filteredPlan}
    
    Feedback:
    ${feedbackText}
    `;

    const DEBUG = false

    if (DEBUG == true) {
        console.log('inferJsonSelectionFromFeedback called with:');
        console.log('feedbackText:', feedbackText);
        console.log('availableKeys:', availableKeys);
        console.log('plan.json:',plan)
        console.log('filtered plan.json:',filteredPlan)

        const sample = {};
        for (const key of availableKeys) {
        sample[key] = undefined;
        }
        const parsed = schema.parse(sample);
        console.log(parsed);
    }

    const response = await fetchStructuredResponse(model, systemMessage, userMessage, schema)
    return response;
}

module.exports = {
  inferJsonSelectionFromFeedback,
  buildBooleanFlagSchema,
};
