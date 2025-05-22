import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import type { ChatCompletion } from "openai/resources/chat/completions";
import { LlmTextProcessingService } from '../types.js';

export class OpenAITextProcessingService implements LlmTextProcessingService {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  async completion(messages: ChatCompletionMessageParam[], model: string = "gpt-4o"): Promise<ChatCompletion> {
    try {
      const chatCompletion = await this.openai.chat.completions.create({
        messages,
        model,
      });
      return chatCompletion;
    } catch (error) {
      console.error("Error in OpenAI completion:", error);
      throw error;
    }
  }
} 