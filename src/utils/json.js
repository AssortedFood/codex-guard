// src/utils/json.js

const fs = require('fs');

function parseJson(jsonPath) {
    let plan;
    try {
        plan = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    } catch (err) {
        console.error(`Failed to read plan.json: ${err.message}`);
        process.exit(1);
    }
    return plan;
}

function filterJson(data, { fields }) {
  return data.map(item => {
    const out = {};
    for (const key of fields) {
      if (key in item) {
        out[key] = item[key];
      }
    }
    return out;
  });
}

function filterById(data, flags) {
  return data.filter(item => Boolean(flags[item.id]));
}

module.exports = {
  parseJson,
  filterJson,
  filterById,
};
