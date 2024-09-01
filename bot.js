//
// ResearchBot
//
// Created in collaboration with OpenAIs gpt-4o model.
// 
// See LICENSE file for license.
//

const https = require('https');

const API_KEY = process.env.OPENAI_API_KEY;
if (!API_KEY) {
  console.error('OPENAI_API_KEY is not defined. Please set the environment variable.');
  process.exit(1);
}

async function makeRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(responseData);
        } else {
          //reject(`Failed with status code ${res.statusCode}\n<responseData begin>${responseData}<responseData end>\n<options begin>${options}<options end>\n<data begin>${data}<data end>`);
          reject(`Failed with status code: ${res.statusCode}\nresponseData: ${responseData}`);
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Error calling OpenAI API: ${error}`));
    });

    req.write(data);
    req.end();
  });
}

async function makeRequestWithRetries(options, data, maxRetries = 5, initialDelay = 1000) {
  let retries = 0;
  let delay = initialDelay;

  while (retries < maxRetries) {
    try {
      return await makeRequest(options, data);
    } catch (error) {
      if (retries === maxRetries - 1) throw error;
      console.error(`Request failed, retrying (${retries + 1}/${maxRetries}):`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
      retries++;
    }
  }
}

async function askLLM(messages, temperature) {
  const data = JSON.stringify({
    model: 'gpt-4o',
    messages: messages,
    max_tokens: 4000,
    temperature: temperature
  });

  const options = {
    hostname: 'api.openai.com',
    path: '/v1/chat/completions',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  try {
    const responseData = await makeRequestWithRetries(options, data);
    const parsedData = JSON.parse(responseData);
    return parsedData.choices[0].message.content.trim();
  } catch (error) {
    console.error("Failed on OpenAI calls after multiple retries.");
    return "";
  }
}

async function main() {
  const [topic, numIterations] = process.argv.slice(2);

  if (!topic || !numIterations) {
    console.error("usage: bot.js topic numIterations");
    process.exit(1);
  }

  let messages = [
    { role: "user", content: `I am learning everything I can about ${topic}. List the key things I need to know. Include things that are lesser known. Be concise and factual. Provide references as links. Use markdown.` },
  ];

  let information = await askLLM(messages, 0.0);
  messages.push({ role: "assistant", content: information });
  console.log("Initial Information:\n", information);

  for (let i = 0; i < parseInt(numIterations); i++) {
    const questions = await generateQuestions(messages, topic);
    messages.push({ role: "user", content: questions });
    console.log(`\nIteration ${i + 1} Questions:\n`, questions);

    information = await answerQuestions(messages, topic);
    messages.push({ role: "assistant", content: information });
    console.log(`\nIteration ${i + 1} Answers:\n`, information);

    // Keep the most recent questions and response pairs to constrain input token usage
    messages = messages.slice(-20);
  }
}

async function generateQuestions(messages, topic) {
  const systemMessage = `You are an expert in ${topic}. Be concise.`;
  const userMessage = `What are three follow up questions that could be asked? Do not repeat questions. Be concise. List the questions only. No formatting. Do not explain.`;

  let questions = await askLLM([
    { role: 'system', content: systemMessage },
    ...messages,
    { role: "user", content: userMessage },
  ], 1.0);

  questions += '\nProvide new information. Do not repeat previous answers.'
  return questions;
}

async function answerQuestions(messages, topic) {
  const systemMessage = `You are an expert in ${topic}. Be concise. Be factual. Provide references as links. Use markdown.`

  return await askLLM([
    { role: 'system', content: systemMessage },
    ...messages
  ], 0.0);
}

main();
