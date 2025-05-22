import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import fetch from 'node-fetch';
import { LlmTextProcessingService, OpenAITextProcessingService } from '../../common/src/openai/index.js';

export class S01E05Downloader {
    private readonly apiKey: string;
    private readonly baseUrl: string = 'https://c3ntrala.ag3nts.org/data';
    private readonly reportUrl: string = 'https://c3ntrala.ag3nts.org/report';
    private readonly llmService: LlmTextProcessingService;
    private readonly censorPrompt = `
You are a data censoring assistant. Your task is to censor personal information in the text.
Replace all personal data (names, addresses, ages, etc.) with the word "CENZURA".
Keep the structure of the sentence intact, only replace the personal information.
Provide only the censored text, without any additional explanation or context.

Examples:

USER: "Dane podejrzanego: Jakub Woźniak. Adres: Rzeszów, ul. Miła 4. Wiek: 33 lata."
AI: "Dane podejrzanego: CENZURA. Adres: CENZURA, ul. CENZURA. Wiek: CENZURA lata."

USER: "Dane personalne podejrzanego: Wojciech Górski. Przebywa w Lublinie, ul. Akacjowa 7. Wiek: 27 lat"
AI: "Dane personalne podejrzanego: CENZURA. Przebywa w CENZURA, ul. CENZURA. Wiek: CENZURA lat"

USER: "Osoba podejrzana to Andrzej Mazur. Adres: Gdańsk, ul. Długa 8. Wiek: 29 lat."
AI: "Osoba podejrzana to CENZURA. Adres: CENZURA, ul. CENZURA. Wiek: CENZURA lat."
`;

    constructor() {
        // Load environment variables from the global .env file
        const globalEnvPath = path.resolve(process.env.OPENAI_API_KEY || process.env.HOME || process.env.USERPROFILE || '', 'ai_devs/ai-devs-solutions/.env');
        config({ path: globalEnvPath });

        const apiKey = process.env.AI_DEVS_API_KEY;
        if (!apiKey) {
            throw new Error('AI_DEVS_API_KEY not found in environment variables');
        }
        this.apiKey = apiKey;
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY is not set');
        }
        this.llmService = new OpenAITextProcessingService(process.env.OPENAI_API_KEY);
    }

    private async censorData(text: string): Promise<string> {
        try {
            const response = await this.llmService.completion([
                { role: "system", content: this.censorPrompt },
                { role: "user", content: text }
            ]);

            const censoredText = response.choices[0]?.message?.content;
            if (!censoredText) {
                throw new Error('No response from OpenAI');
            }

            return censoredText.trim();
        } catch (error) {
            console.error('Error during censoring:', error);
            throw error;
        }
    }

    private async sendReport(censoredText: string): Promise<void> {
        try {
            const payload = {
                task: "CENZURA",
                apikey: this.apiKey,
                answer: censoredText
            };

            console.log('Sending report to API...');
            const response = await fetch(this.reportUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('API Response:', result);
        } catch (error) {
            console.error('Error sending report:', error instanceof Error ? error.message : 'Unknown error occurred');
            throw error;
        }
    }

    async downloadFile(): Promise<void> {
        try {
            const url = `${this.baseUrl}/${this.apiKey}/cenzura.txt`;
            console.log('Downloading file from:', url);

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const content = await response.text();
            console.log('Original content:', content);
            
            const censoredContent = await this.censorData(content);
            console.log('Censored content:', censoredContent);

            // Send the censored content to the API
            await this.sendReport(censoredContent);
        } catch (error) {
            console.error('Error:', error instanceof Error ? error.message : 'Unknown error occurred');
            throw error;
        }
    }
}

// Run the downloader if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const downloader = new S01E05Downloader();
    downloader.downloadFile().catch(console.error);
}
