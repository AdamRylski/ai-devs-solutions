import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { LlmTextProcessingService } from '../types.js';

export class OpenAITextProcessingService implements LlmTextProcessingService {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  async completion(messages: ChatCompletionMessageParam[], model: string = "gpt-4o"): Promise<string> {
    try {
      const chatCompletion = await this.openai.chat.completions.create({
        messages,
        model,
      });

      const msg = chatCompletion.choices[0].message.content || '';
      return this.cleanResponseContent(msg);
    } catch (error) {
      console.error("Error in OpenAI completion:", error);
      throw error;
    }
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
} 