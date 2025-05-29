import OpenAI from "openai";
import { EmbedderService } from '../types.js';

export class OpenAIEmbedder implements EmbedderService {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: 'text-embedding-3-large',
      input: text,
      encoding_format: 'float',
    });
    return response.data[0].embedding;
  }
}