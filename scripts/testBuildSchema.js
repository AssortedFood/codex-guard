#!/usr/bin/env node
// scripts/testBuildSchema.js

const fs = require('fs');
const path = require('path');
const { buildBooleanFlagSchema } = require('../src/utils/structuredHelpers');

// 1) Load plan.json and extract all task IDs
const planPath = path.join(process.cwd(), '.guard', 'plan.json');
let plan;
try {
  plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
} catch (err) {
  console.error(`Error reading plan.json: ${err.message}`);
  process.exit(1);
}
const availableKeys = plan.map(item => item.id);

// 2) Build the Zod schema
const schema = buildBooleanFlagSchema({ availableKeys });

// 3) Inspect the generated schema shape
console.log('Generated Zod schema shape:');
console.dir(schema.shape, { depth: null });

// 4) (Optional) Test parsing a sample input
const sample = {};
for (const key of availableKeys) {
  sample[key] = undefined; // let defaults apply
}
const parsed = schema.parse(sample);
console.log('\nParsed sample (all flags default to false):');
console.log(parsed);
