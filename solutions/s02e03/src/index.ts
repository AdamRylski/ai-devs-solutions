import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import { OpenAIDalleService } from '../../common/src/openai/OpenAIDalleService.js';
import { CentralaApi } from '../../common/src/centrala/CentralaApi.js';

interface TaskResponse {
    description: string;
}

// Load environment variables from the global .env file
const globalEnvPath = path.resolve(process.env.HOME || process.env.USERPROFILE || '', 'ai_devs/ai-devs-solutions/.env');
config({ path: globalEnvPath });

async function main() {
    if (!process.env.AI_DEVS_API_KEY) {
        throw new Error('AI_DEVS_API_KEY is not set');
    }

    if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is not set');
    }

    const centralaApi = new CentralaApi(process.env.AI_DEVS_API_KEY);

    try {
        const centralaResponse = await centralaApi.downloadTaskInputWithApiKey("robotid.json");
        const taskResponse: TaskResponse = JSON.parse(centralaResponse);
        console.log('Task response:', taskResponse);

        const dalleService = new OpenAIDalleService(process.env.OPENAI_API_KEY!);
        const url = await dalleService.pictureParameters(taskResponse.description, { size: "1024x1024", response_format: "url" });
        console.log('Generated image URL:', url);

        const answer = await centralaApi.sendAnswer("robotid", url);
        console.log('API answer response:', answer);
    } catch (error) {
        console.error('Error occurred:', error);
        if (error instanceof Error) {
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
        }
        throw error;
    }
}

main();
