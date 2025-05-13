import fetch from 'node-fetch';
import { OpenAIService } from 'common';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

/**
 * Extracts the question from the HTML response
 * @param html - The HTML content from the server
 * @returns The extracted question text
 */
function extractQuestion(html: string): string {
    const match = html.match(/<p id="human-question">Question:<br \/>([^<]+)<\/p>/);
    if (!match) {
        throw new Error('Could not find question in the response');
    }
    return match[1].trim();
}

/**
 * Makes a GET request to the specified endpoint
 * @param url - The URL to make the request to
 * @returns Promise with the response text
 */
async function makeGetRequest(url: string): Promise<string> {
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'text/html'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.text();
    } catch (error) {
        console.error('Error making GET request:', error);
        throw error;
    }
}

/**
 * Sends a POST request with the answer
 * @param url - The URL to send the request to
 * @param answer - The answer to send
 * @returns Promise with the response text
 */
async function sendAnswer(url: string, answer: string): Promise<string> {
    try {
        const formData = new URLSearchParams({
            'username': 'tester',
            'password': '574e112a',
            'answer': answer
        });

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Accept': 'text/html',
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData.toString()
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.text();
    } catch (error) {
        console.error('Error sending answer:', error);
        throw error;
    }
}

async function main() {
    try {
        const url = 'https://xyz.ag3nts.org/';
        console.log('Making GET request to:', url);
        const html = await makeGetRequest(url);
        const question = extractQuestion(html);
        console.log('Captcha question:', question);

        const openai = new OpenAIService();
        const messages: ChatCompletionMessageParam[] = [
            { role: 'system', content: 'You are a helpful assistant that answers questions in Polish. Provide one word answer only.' },
            { role: 'user', content: question }
        ];
        
        const response = await openai.completion(messages);
        const answer = response.choices[0].message.content;
        if (!answer) {
            throw new Error('No answer received from OpenAI');
        }
        console.log('AI answer:', answer);

        console.log('Sending answer...');
        const result = await sendAnswer(url, answer);
        console.log('Server response:', result);
    } catch (error) {
        console.error('Application error:', error);
        process.exit(1);
    }
}

main().catch(console.error); 