import OpenAI from "openai";
import { config } from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { PictureGenerationService } from '../types.js';
import type { ChatCompletion } from "openai/resources/chat/completions";
// Load environment variables from the project root
const __dirname = process.cwd();
config({ path: resolve(__dirname, '.env') });

export type VisionAnalysisOptions = Parameters<PictureGenerationService['pictureParameters']>[1];


export class OpenAIDalleService implements PictureGenerationService {
  private openai: OpenAI;

  constructor(openAiApiKey: string) {
    this.openai = new OpenAI({
      apiKey: openAiApiKey
    });
  }

  async pictureParameters(prompt: string, options?: { size?: "1024x1024" | "1792x1024" | "1024x1792"; response_format?: "url" | "b64_json"; }): Promise<string> {
    try {
      const response = await this.openai.images.generate({
        model: "dall-e-3",
        prompt,
        n: 1,
        size: options?.size || "1024x1024",
        response_format: "url",
      });

      if (!response.data?.[0]?.url) {
        throw new Error('No image URL received from DALL-E');
      }

      return response.data[0].url;
    } catch (error) {
      console.error("Error in DALL-E image generation:", error);
      throw error;
    }
  }
}