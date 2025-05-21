import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import type { ChatCompletion } from "openai/resources/chat/completions";
import { LlmTextProcessingService } from '../types.js';
export declare class OpenAITextProcessingService implements LlmTextProcessingService {
    private openai;
    constructor();
    completion(messages: ChatCompletionMessageParam[], model?: string): Promise<ChatCompletion>;
}
