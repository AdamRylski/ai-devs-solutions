import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { LlmTextProcessingService } from '../types.js';
import fetch, { Response } from 'node-fetch';
import { Readable } from 'stream';

interface OllamaStreamResponse {
  message: {
    content: string;
    role: string;
  };
  done: boolean;
}

export class OllamaTextProcessingService implements LlmTextProcessingService {
  private readonly baseUrl: string;
  private readonly model: string;

  constructor(baseUrl: string = 'http://localhost:11434', model: string = 'incept5/llama3.1-claude:latest') {
    this.baseUrl = baseUrl;
    this.model = model;
  }

  private cleanResponseContent(content: string): string {
    // Remove markdown code block markers
    content = content.replace(/```json\n/g, '');
    content = content.replace(/```\n/g, '');
    content = content.replace(/```/g, '');
    
    // Remove any leading/trailing backticks
    content = content.replace(/^`+|`+$/g, '');
    
    // Trim any extra whitespace
    content = content.trim();

    
    
    return content;
  }

  async completion(messages: ChatCompletionMessageParam[], model?: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model || this.model,
          messages: messages.map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
      });

      if (!response.ok) {
        console.log("response: ", response);
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('No response body received from Ollama');
      }

      let fullContent = '';
      const stream = Readable.from(response.body);
      const decoder = new TextDecoder();

      for await (const chunk of stream) {
        const text = decoder.decode(chunk as Buffer);
        const lines = text.split('\n').filter(line => line.trim());

        for (const line of lines) {
          try {
            const data = JSON.parse(line) as OllamaStreamResponse;
            if (data.message?.content) {
              fullContent += data.message.content;
            }
          } catch (e) {
            console.warn('Failed to parse JSON line:', line);
          }
        }
      }

      if (!fullContent) {
        throw new Error('No completion message returned from Ollama');
      }

      return this.cleanResponseContent(fullContent);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error in Ollama completion:', error.message);
      } else {
        console.error('Unknown error in Ollama completion');
      }
      throw error;
    }
  }
}
