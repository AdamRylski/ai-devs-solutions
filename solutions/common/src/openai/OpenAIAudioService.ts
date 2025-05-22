import OpenAI from "openai";
import { AudioProcessingService } from "../types.js";

export class OpenAIAudioService implements AudioProcessingService {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  async transcribeAudio(audioData: Buffer, fileName: string): Promise<string> {
    try {
      // Create a temporary file from the buffer
      const file = new File([audioData], fileName, {
        type: this.getMimeType(fileName),
      });

      const transcription = await this.openai.audio.transcriptions.create({
        file,
        model: "whisper-1", // This is the only model available for transcription
      });

      return transcription.text;
    } catch (error) {
      console.error("Error in OpenAI audio transcription:", error);
      throw error;
    }
  }

  private getMimeType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'mp3':
        return 'audio/mpeg';
      case 'mp4':
        return 'audio/mp4';
      case 'mpeg':
        return 'audio/mpeg';
      case 'mpga':
        return 'audio/mpeg';
      case 'm4a':
        return 'audio/mp4';
      case 'wav':
        return 'audio/wav';
      case 'webm':
        return 'audio/webm';
      default:
        throw new Error(`Unsupported audio file type: ${extension}`);
    }
  }
} 