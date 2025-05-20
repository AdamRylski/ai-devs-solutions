import OpenAI from "openai";
import { config } from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
// Load environment variables from the project root
const __dirname = fileURLToPath(new URL('.', import.meta.url));
config({ path: resolve(__dirname, '../../../.env') });
export class OpenAIVisionService {
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
    async analyzeImage(imageBase64s, prompt, options = {}) {
        try {
            const { model = "gpt-4o-mini", maxTokens = 300, temperature = 0.7 } = options;
            const content = [
                { type: "text", text: prompt },
                ...imageBase64s.map((img) => ({
                    type: "image_url",
                    image_url: {
                        url: `data:image/jpeg;base64,${img}`
                    }
                }))
            ];
            const messages = [
                {
                    role: "user",
                    content: content // Type assertion to satisfy the SDK
                }
            ];
            const chatCompletion = await this.openai.chat.completions.create({
                model,
                messages,
                max_tokens: maxTokens,
                temperature
            });
            return chatCompletion;
        }
        catch (error) {
            console.error("Error in OpenAI vision analysis:", error);
            throw error;
        }
    }
}
