import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import type { ChatCompletion } from "openai/resources/chat/completions";

export interface LlmTextProcessingService {
  /**
   * Process text messages using an LLM model and return a completion
   * @param messages Array of chat messages to process
   * @param model Optional model identifier to use for processing
   * @returns Promise resolving to a chat completion
   */
  completion(
    messages: ChatCompletionMessageParam[],
    model?: string
  ): Promise<ChatCompletion>;
}

export interface AudioProcessingService {
  /**
   * Transcribe audio data to text using OpenAI's Whisper model
   * @param audioData Buffer containing the audio data
   * @param fileName Name of the audio file (used to determine file type)
   * @returns Promise resolving to the transcribed text
   */
  transcribeAudio(
    audioData: Buffer,
    fileName: string
  ): Promise<string>;
}

export interface PictureAnalysisService {
  /**
   * Analyze one or more images using OpenAI's vision models
   * @param imageBase64s Array of base64 encoded image data
   * @param prompt The prompt to analyze the images with
   * @param options Optional parameters for the vision analysis
   * @returns Promise resolving to a chat completion containing the analysis
   */
  analyzeImage(
    imageBase64s: string[],
    prompt: string,
    options?: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
    }
  ): Promise<ChatCompletion>;
} 

export interface PictureGenerationService {
  /**
   * Generate image based on the prompt
   * @param prompt The prompt to generate the image with
   * @param options Optional parameters for the image generation
   * @returns Promise resolving to a url of the generated image
   */
  pictureParameters(
    prompt: string,
    options?: {
      size?: string;
      response_format?: string;
    }
  ): Promise<string>;
} 

export interface TokenizerService {
  /**
   * Process text messages using an LLM model and return a completion
   * @param messages Array of chat messages to process
   * @param model Optional model identifier to use for processing
   * @returns Promise resolving to a chat completion
   */
  tokenize(inputText: String, filename: String, model: string): Promise<TokenizedRecord>;
}

export interface TokenizedRecord {
  fileName: string;
  titleInfo?: string; // np. z nazwy pliku
  content: string;
  tokens: string[];
  namedEntities: {
    persons: string[];
    places: string[];
    objects: string[];
    animals: string[];
  };
  relatedFacts: string; // uzupełniane później
}