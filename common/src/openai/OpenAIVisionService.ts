import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import type { ChatCompletion } from "openai/resources/chat/completions";
import { config } from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { VisionProcessingService } from '../types.js';

// Load environment variables from the project root
const __dirname = fileURLToPath(new URL('.', import.meta.url));
config({ path: resolve(__dirname, '../../../.env') });

export type VisionAnalysisOptions = Parameters<VisionProcessingService['analyzeImage']>[2];

export class OpenAIVisionService implements VisionProcessingService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI();
  }

  /**
   * Analyzes an image using OpenAI's vision models
   * @param imageBase64 - Base64 encoded image data
   * @param prompt - The prompt to analyze the image with
   * @param options - Optional parameters for the vision analysis
   * @returns The chat completion response from OpenAI
   */
  async analyzeImage(
    imageBase64s: string[],
    prompt: string,
    options: VisionAnalysisOptions = {}
  ): Promise<ChatCompletion> {
    try {
      const {
        model = "gpt-4o-mini",
        maxTokens = 300,
        temperature = 0.7
      } = options;


      const content = [
        { type: "text", text: prompt } as const,
        ...imageBase64s.map((img) => ({
          type: "image_url" as const,
          image_url: {
            url: `data:image/jpeg;base64,${img}`
          }
        }))
      ];


      const messages: ChatCompletionMessageParam[] = [
        {
          role: "user",
          content: content as any // Type assertion to satisfy the SDK
        }
      ];

      const chatCompletion = await this.openai.chat.completions.create({
        model,
        messages,
        max_tokens: maxTokens,
        temperature
      });

      return chatCompletion;
    } catch (error) {
      console.error("Error in OpenAI vision analysis:", error);
      throw error;
    }
  }
} 