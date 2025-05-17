// src/utils/openai.js

const OpenAI = require('openai').default;
const { zodResponseFormat } = require('openai/helpers/zod');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function fetchStructuredResponse(model, systemMessage, userMessage, zodSchemaObject) {
  const completion = await openai.beta.chat.completions.parse({
    model,
    messages: [
      { role: 'system', content: systemMessage },
      { role: 'user',   content: userMessage },
    ],
    response_format: zodResponseFormat(zodSchemaObject, 'response'),
  });
  return completion.choices[0]?.message?.parsed;
}

module.exports = { fetchStructuredResponse };