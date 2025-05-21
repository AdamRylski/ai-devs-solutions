import { AudioProcessingService } from "../types.js";
export declare class OpenAIAudioService implements AudioProcessingService {
    private openai;
    constructor();
    transcribeAudio(audioData: Buffer, fileName: string): Promise<string>;
    private getMimeType;
}
