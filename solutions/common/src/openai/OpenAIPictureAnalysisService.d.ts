import type { ChatCompletion } from "openai/resources/chat/completions";
import { PictureAnalysisService } from '../types.js';
export type VisionAnalysisOptions = Parameters<PictureAnalysisService['analyzeImage']>[2];
export declare class OpenAIPictureAnalysisService implements PictureAnalysisService {
    private openai;
    constructor();
    /**
     * Analyzes an image using OpenAI's vision models
     * @param imageBase64 - Base64 encoded image data
     * @param prompt - The prompt to analyze the image with
     * @param options - Optional parameters for the vision analysis
     * @returns The chat completion response from OpenAI
     */
    analyzeImage(imageBase64s: string[], prompt: string, options?: VisionAnalysisOptions): Promise<ChatCompletion>;
}
