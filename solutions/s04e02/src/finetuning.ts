import * as path from 'path';
import { config } from 'dotenv';
import axios from 'axios';
import { OpenAITextProcessingService } from '../../common/src/openai/OpenAITextProcessingService.js';
import { OpenAIPictureAnalysisService } from '../../common/src/openai/OpenAIPictureAnalysisService.js';
import { CentralaApi } from '../../common/src/centrala/CentralaApi.js';
import { FileHandler } from '../../common/src/files/FileHandler.js';


const globalEnvPath = path.resolve(process.env.HOME || process.env.USERPROFILE || '', 'ai_devs/ai-devs-solutions/.env');
config({ path: globalEnvPath });

class FineTuneTrainDataModel {
    messages: FineTuneTrainDataEntry[];
    
    constructor(messages: FineTuneTrainDataEntry[]) {
        this.messages = messages;
    }
}

class FineTuneTrainDataEntry{
    role: string;
    content: string;
    
    constructor(role: string, content: string) {
        this.role = role;
        this.content = content;
    }
}

async function mapFileToTrainData(file: string, isCorrect: string): Promise<FineTuneTrainDataModel[]> {
    const lines: string[] = FileHandler.readLines(file);
    const trainData: FineTuneTrainDataModel[] = [];
    const system: FineTuneTrainDataEntry = new FineTuneTrainDataEntry("system", "validate data")
    const assistant: FineTuneTrainDataEntry = new FineTuneTrainDataEntry("assistant", isCorrect)


    for (const line of lines) {
        const user: FineTuneTrainDataEntry = new FineTuneTrainDataEntry("user", line);
        const messages: FineTuneTrainDataEntry[] = [system, user, assistant];
        trainData.push(new FineTuneTrainDataModel(messages));
    }
    return trainData;
}

async function main() {

    const correctDataFile = "/home/adam/ai_devs/ai-devs-solutions/solutions/s04e02/data/correct.txt";
    const incorrectDataFile = "/home/adam/ai_devs/ai-devs-solutions/solutions/s04e02/data/incorect.txt";
    const finetuneTrainingDataFile = "/home/adam/ai_devs/ai-devs-solutions/solutions/s04e02/data/trainingData.txt";
    const verifyDataFile = "/home/adam/ai_devs/ai-devs-solutions/solutions/s04e02/data/verify.txt";

    if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is not set');
    }

    if (!process.env.AI_DEVS_API_KEY) {
        throw new Error('AI_DEVS_API_KEY is not set');
    }
    
    // const trainData: FineTuneTrainDataModel[] = [];
    // trainData.push(...await mapFileToTrainData(correctDataFile, "1"));
    // trainData.push(...await mapFileToTrainData(incorrectDataFile, "0"))

    // const linesToWrite: string[] = []

    // for (const trainRecord of trainData) {
    //     linesToWrite.push(JSON.stringify(trainRecord))
    // }

    // FileHandler.write(finetuneTrainingDataFile, linesToWrite.join("\n"));

    const gpt = new OpenAITextProcessingService(process.env.OPENAI_API_KEY)
    const model = "ft:gpt-4o-mini-2024-07-18:personal:s04e02-v2:BepaFEnk"

    const lines = FileHandler.readLines(verifyDataFile)
    const correctRows: string[] = []
    for (const line of lines) {
        const elements = line.split('=')
        console.log("Found elements: " + elements + ", size: " + elements.length)
        const operationAnalysis = await gpt.completion([
        {
            role: "system",
            content: "validate data"
        },
        {
            role: "user",
            content: elements[1]
        }
        ], model);
        console.log("Row " + elements[0] + " result: " + operationAnalysis)
        if (operationAnalysis === "1") {
            correctRows.push(elements[0])
        }
    }

    const centralaAPI = new CentralaApi(process.env.AI_DEVS_API_KEY)
    const centralaResponse = centralaAPI.sendAnswer("research", JSON.stringify(correctRows))
    console.log("Centrala Response:")
    console.log(centralaResponse)
}

main();