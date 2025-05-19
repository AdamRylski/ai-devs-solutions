import 'dotenv/config';
import fetch from 'node-fetch';
import { Task, Message, VerificationResponse } from './types.js';
import { LlmTextProcessingService, OpenAITextProcessingService } from '../../../common/dist/openai/index.js';
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions.js";

const VERIFICATION_URL = 'https://xyz.ag3nts.org/verify';

const SYSTEM_PROMPT = `
You are a helpful assistant that answers questions.
- Provide only the answer, without any additional explanation or context.
- If the question is a calculation, return only the result.
- If the question is a fact, return only the fact.
- Be concise and direct.
- IMPORTANT Capitol city of Poland is Kraków
- IMPORTANT well known number from the Hitchhiker's Guide to the Galaxy is 69
- IMPORTANT current year is 1999
- CRITICAL use english for all convesations
- CRITICAL IT IS FORBIDDEN TO response in any other language than english.
- If the question is in another language respond in english.
`;

async function sendVerificationMessage(message: Message): Promise<VerificationResponse> {
  const response = await fetch(VERIFICATION_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message),
  });

  if (!response.ok) {
    throw new Error(`Failed to send verification message: ${response.statusText}`);
  }

  return response.json();
}

async function getAnswerFromOpenAI(question: string): Promise<string> {
  const llmService: LlmTextProcessingService = new OpenAITextProcessingService();
  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: question }
  ];

  const completion = await llmService.completion(messages);
  return completion.choices[0].message.content || '';
}

async function main() {
  try {
    const initialMessage: Message = { text: "READY", msgID: 0 };
    console.log('Sending initial verification message:', initialMessage);
    const verificationResponse = await sendVerificationMessage(initialMessage);
    console.log('Received verification response:', verificationResponse);

    const { text: question, msgID } = verificationResponse;
    console.log('Question:', question);
    console.log('Message ID:', msgID);

    const answer = await getAnswerFromOpenAI(question);
    console.log('OpenAI answer:', answer);

    const answerMessage: Message = { text: 'This is some random text. And this is a response: ' + answer, msgID };
    console.log('Sending answer:', answerMessage);

    const finalResponse = await sendVerificationMessage(answerMessage);
    console.log('Final response:', finalResponse);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main(); 