/*
 * porting of implementation from here: https://til.simonwillison.net/llms/python-react-pattern
 */

import { DLLMId } from '~/modules/llms/store-llms';
import { callApiSearchGoogle } from '~/modules/google/search.client';
import { callChatGenerate, VChatMessageIn } from '~/modules/llms/transports/chatGenerate';
import { evaluate } from 'mathjs';

// prompt to implement the ReAct paradigm: https://arxiv.org/abs/2210.03629
const reActPrompt: string = `Take a deep breath first and work on this step-by-step. You are an advanced AI designed for Question Answering with in-depth reasoning capability, acting as an expert in research and information synthesis, critical thinking, data analysis, and other relevant fields. Upon receiving a Question from the User, you will engage in a comprehensive Thought process, followed by an Action, a PAUSE, and an Observation. Your expertise encompasses historical knowledge, scientific explanations, current affairs, cultural literacy, technological trends, educational tutoring, and ethical reasoning, ensuring that your answers are not only accurate but also informative and contextually rich.

Here's what you will do:
- Use "Thought: " to provide a thorough analysis and contemplation of the question.
- Use "Action: " to execute an available action, then immediately enter a PAUSE state. Avoid including "Observation: " or "Answer: " in the same output as PAUSE.
- "Observation" will be the result of the "Action" and is used for further reasoning or to formulate an answer.
- If "Observation" is not helpful or does not lead to an answer, choose a different "Action" to take.

Please follow these guidelines:
- The current date is set as {{currentDate}} for any date-related questions.

Available "Actions" include:

1. google:
   - Utilize for inquiries about recent developments, real-time data, or specifics that are time-sensitive.
   - Ideal for topics like news headlines, weather forecasts, stock market updates, sports scores, or event dates.
   - Ensure the query is precise to yield the most relevant results.
   - Outputs should be concise yet comprehensive, providing a summary along with key details.
   - In cases where information is too vast or varied, prioritize data from the most credible sources or the latest reports.
   - If the information is not readily available or is speculative, advise accordingly.

2. calculate:
   - Use for mathematical queries that can be expressed in standard mathematical notation.
   - The input should be a string that represents a mathematically valid expression.
   - The expression should use standard arithmetic operators and functions compatible with the mathjs library.
   - Avoid complex expressions that require advanced mathematical concepts not supported by mathjs.
   - If the original question is not in the form of a mathematical expression, convert it into one before processing.
   - Provide a detailed step-by-step breakdown of the calculations, showing intermediate steps and results if possible.
   - For example, to calculate the area of a circle with a radius of 3 units, the user should input "pi * 3^2", which will be evaluated to give the area.

3. wikipedia:
   - Employ solely for requests that specifically ask for information from Wikipedia or imply the need for encyclopedic knowledge.
   - Well-suited for historical data, biographical details, summaries of books or movies, scientific concepts, or geographical information.
   - Outputs should offer a succinct summary and include essential aspects of the subject, referencing the most pertinent parts of the Wikipedia article.
   - Strive to provide context that helps the user understand the relevance and significance of the information.
   - If an article is too long, focus on summarizing the introduction and any other sections directly related to the user’s question.
   - Acknowledge if a Wikipedia page on the topic does not exist or if the information is subject to dispute or ongoing updates.
   
An example interaction should go as follows:

Question: What is the capital of France?
Thought: The capital of France is a well-known fact, but to be accurate, I'll verify this information with a reliable source. Wikipedia is a suitable resource for this type of factual question.
Action: wikipedia: France

You will receive an "Observation" based on your "Action", along with all previous messages.

Observation: France is a country in Western Europe. The capital city, located on the Seine River, is Paris.

Your response should be detailed:
Answer: Paris is the capital of France. It is an iconic global city known for its culture, art, fashion, and gastronomy. The city of lights has a rich history and is home to numerous famous landmarks such as the Eiffel Tower, Notre-Dame Cathedral, and the Louvre Museum.
`;

export const CmdRunReact: string[] = ['/react'];

const actionRe = /^Action: (\w+): (.*)$/;

/**
 * State - Abstraction used for serialization, save/restore, inspection, debugging, rendering, etc.
 *
 * Keep this as minimal and flat as possible
 *   - initialize(): will create the state with initial values
 *   - loop() is a function that will update the state (in place)
 */
interface State {
  messages: VChatMessageIn[];
  nextPrompt: string;
  lastObservation: string;
  result: string | undefined;
}

export class Agent {
  // NOTE: this is here for demo, but the whole loop could be moved to the caller's event loop
  async reAct(question: string, llmId: DLLMId, maxTurns = 5, log: (...data: any[]) => void = console.log, show: (state: object) => void): Promise<string> {
    let i = 0;
    // TODO: to initialize with previous chat messages to provide context.
    const S: State = this.initialize(`Question: ${question}`);
    show(S);
    while (i < maxTurns && S.result === undefined) {
      i++;
      log(`\n## Turn ${i}`);
      await this.step(S, llmId, log);
      show(S);
    }
    // return only the 'Answer: ' part of the result
    if (S.result) {
      const idx = S.result.indexOf('Answer: ');
      if (idx !== -1) return S.result.slice(idx + 8);
    }
    return S.result || 'No result';
  }

  initialize(question: string): State {
    return {
      messages: [{ role: 'system', content: reActPrompt.replaceAll('{{currentDate}}', new Date().toISOString().slice(0, 10)) }],
      nextPrompt: question,
      lastObservation: '',
      result: undefined,
    };
  }

  truncateStringAfterPause(input: string): string {
    const pauseKeyword = 'PAUSE';
    const pauseIndex = input.indexOf(pauseKeyword);

    if (pauseIndex === -1) {
      return input;
    }

    const endIndex = pauseIndex + pauseKeyword.length;
    return input.slice(0, endIndex);
  }

  async chat(S: State, prompt: string, llmId: DLLMId): Promise<string> {
    S.messages.push({ role: 'user', content: prompt });
    let content: string;
    try {
      let tempContent = '';
      let needMore = true;
      while (needMore) {
        content = (await callChatGenerate(llmId, S.messages, 2500)).content; // Increased token limit for longer output
        // Check if the response contains "PAUSE" to decide if more content is needed.
        needMore = content.includes('PAUSE');
        tempContent += content;
        // If PAUSE was found, remove it and anything after it to continue the loop.
        tempContent = this.truncateStringAfterPause(tempContent);
      }
      content = tempContent;
    } catch (error: any) {
      content = `Error in callChat: ${error}`;
    }
    S.messages.push({ role: 'assistant', content });
    return content;
  }

  async step(S: State, llmId: DLLMId, log: (...data: any[]) => void = console.log) {
    log('→ reAct [...' + (S.messages.length + 1) + ']: ' + S.nextPrompt);
    const result = await this.chat(S, S.nextPrompt, llmId);
    log(`← ${result}`);
    const actions = result
      .split('\n')
      .map((a: string) => actionRe.exec(a))
      .filter((a: RegExpExecArray | null) => a !== null) as RegExpExecArray[];
    if (actions.length > 0) {
      const action = actions[0][1];
      const actionInput = actions[0][2];
      // Check if the action is one of the known keys, then assert the type
      if (action in knownActions) {
        S.lastObservation = await knownActions[action as keyof typeof knownActions](actionInput);
        S.nextPrompt = `Observation: ${S.lastObservation}`;
        log(S.nextPrompt);
      } else {
        throw new Error(`Unknown action: ${action}`);
      }
    } else {
      log('↙ done');
      S.result = result;
    }
  }
}

/**
 * Represents a function that executes an action and returns a result.
 * @typedef {Function} ActionFunction
 * @param {string} input - The input string to process.
 * @returns {Promise<string>} - A promise that resolves to the action result.
 */
type ActionFunction = (input: string) => Promise<string>;

/**
 * Fetches a snippet from a Wikipedia search.
 * @param {string} query - The search query.
 * @returns {Promise<string>} - A promise that resolves to the Wikipedia snippet.
 */
async function wikipedia(query: string): Promise<string> {
  const response = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  return data.query.search[0].snippet;
}

/**
 * Performs a Google search and returns the results.
 * @param {string} query - The search query.
 * @returns {Promise<string>} - A promise that resolves to the search results.
 */
async function search(query: string): Promise<string> {
  try {
    const data = await callApiSearchGoogle(query);
    return JSON.stringify(data);
  } catch (error: any) {
    console.error('Error fetching search results:', error);
    throw new Error('An error occurred while searching the internet. Please try again later.');
  }
}

/**
 * Calculates a mathematical expression using math.js.
 * @param {string} expression - The mathematical expression to evaluate.
 * @returns {Promise<string>} - A promise that resolves to the calculation result.
 */
const calculate = (expression: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      if (typeof expression !== 'string' || expression.trim() === '') {
        throw new Error('The expression is empty or not a string.');
      }
      const result = evaluate(expression);
      resolve(`The result is ${result}.`);
    } catch (error: any) {
      console.error(`Error in calculation: ${error.message}`);
      reject(new Error('Error in calculation. Please check the expression and try again.'));
    }
  });
};

type KnownActionKeys = 'wikipedia' | 'google' | 'calculate';

const knownActions: { [key in KnownActionKeys]: ActionFunction } = {
  wikipedia: wikipedia,
  google: search,
  calculate: calculate,
};
