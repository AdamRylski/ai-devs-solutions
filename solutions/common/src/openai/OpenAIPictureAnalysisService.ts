import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import type { ChatCompletion } from "openai/resources/chat/completions";
import { config } from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { PictureAnalysisService } from '../types.js';


export type VisionAnalysisOptions = Parameters<PictureAnalysisService['analyzeImage']>[2];

export class OpenAIPictureAnalysisService implements PictureAnalysisService {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
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

  /**
   * Analyzes images from URLs using OpenAI's vision models
   * @param imageUrl - URL of the image to analyze
   * @param prompt - The prompt to analyze the images with
   * @param options - Optional parameters for the vision analysis
   * @returns The response from OpenAI
   */
  async analyzeImageUrl(
    imageUrl: string,
    prompt: string,
    options: VisionAnalysisOptions = {}
  ): Promise<OpenAI.Responses.Response> {
    try {
      const {
        model = "gpt-4o",
        maxTokens = 300,
        temperature = 0.7
      } = options;

      const response = await this.openai.responses.create({
        model: model,
        input: [{
          role: "user",
          content: [
            { type: "input_text", text: prompt },
            {
              type: "input_image",
              image_url: imageUrl,
              detail: "auto" // Dodana wymagana właściwość
            }
          ]
        }],
        temperature
      });

      return response;
    } catch (error) {
      console.error("Error in OpenAI vision analysis:", error);
      throw error;
    }
  }

  // async extractDescriptionFromResponse(response: OpenAI.Responses.Response): Promise<string> {
  //   console.log('Response structure:', JSON.stringify(response, null, 2));
  
  //   return response.output_text


  //   // For OpenAI Vision API responses
  //   if ('choices' in response && Array.isArray(response.choices)) {
  //     const content = response.choices[0]?.message?.content;
  //     if (content) return content;
  //   }
    
  //   // For content array structure (Vision API alternative format)
  //   if ('content' in response && Array.isArray(response.content)) {
  //     const textContent = response.content
  //       .filter(item => item.type === 'text')
  //       .map(item => item.text)
  //       .join(' ');
  //     if (textContent) return textContent;
  //   }
    
  //   // For output array structure (Vision API alternative format)
  //   if ('output' in response && Array.isArray(response.output)) {
  //     const messageContent = response.output
  //       .filter(item => item.type === 'message')
  //       .map(item => item.content)
  //       .join(' ');
  //     if (messageContent) return messageContent;
  //   }

  //   // If no known structure is found, return the stringified response for debugging
  //   console.warn('Unknown response structure:', JSON.stringify(response, null, 2));
  //   return 'Could not extract description from response';
  // }

} 