import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { LlmTextProcessingService, OpenAITextProcessingService } from '../../common/src/openai/index.js';
import { config } from 'dotenv';
import fetch from 'node-fetch';

// Load environment variables from the global .env file
const globalEnvPath = path.resolve(process.env.OPENAI_API_KEY || process.env.HOME || process.env.USERPROFILE || '', 'ai_devs/ai-devs-solutions/.env');
config({ path: globalEnvPath });

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SYSTEM_PROMPT = `
You are a helpful assistant that answers questions.
- Provide only the answer, without any additional explanation or context.
- If the question is a calculation, return only the result.
- If the question is a fact, return only the fact.
- Be concise and direct.
- CRITICAL use english for all convesations
- CRITICAL IT IS FORBIDDEN TO response in any other language than english.
- If the question is in another language respond in english.
`;

// Interfaces to type our data
interface TestQuestion {
    question: string;
    answer: number;
    test?: {
        q: string;
        a: string;
    };
}

interface TestData {
    apikey: string;
    description: string;
    copyright: string;
    'test-data': TestQuestion[];
}

interface AnswerFormat {
    task: string;
    apikey: string;
    answer: TestData;
}

// Function to read and parse the JSON file
function readTestData(): TestData {
    const filePath = path.join(__dirname, '..', 'src', 'data', 's01e03.json');
    const rawData = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(rawData) as TestData;
    
    // Replace the placeholder API key with the actual one
    if (data.apikey === '%PUT-YOUR-API-KEY-HERE%' && process.env.AI_DEVS_API_KEY) {
        data.apikey = process.env.AI_DEVS_API_KEY;
    }
    
    return data;
}

// Function to evaluate a mathematical expression
function evaluateMathExpression(expression: string): number {
    // Split the expression into numbers and operator
    const [num1, operator, num2] = expression.split(' ');
    const a = parseInt(num1);
    const b = parseInt(num2);
    
    switch(operator) {
        case '+':
            return a + b;
        case '-':
            return a - b;
        case '*':
            return a * b;
        case '/':
            return a / b;
        default:
            throw new Error(`Unsupported operator: ${operator}`);
    }
}

interface TestQuestionProcessor {
    processQuestion(question: TestQuestion): void;
    getResults(): AnswerFormat;
}

class TestDataProcessor implements TestQuestionProcessor {
    private llmService: LlmTextProcessingService;
    private originalData: TestData;

    constructor(originalData: TestData) {

        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY is not set');
        }

        this.llmService = new OpenAITextProcessingService(process.env.OPENAI_API_KEY);
        this.originalData = originalData;
    }

    async processQuestion(question: TestQuestion): Promise<void> {
        const calculatedAnswer = evaluateMathExpression(question.question);
        
        if (calculatedAnswer !== question.answer) {
            console.warn(`\nWarning - Incorrect answer found:`);
            console.warn(`Question: ${question.question}`);
            console.warn(`Old answer: ${question.answer}`);
            console.warn(`New answer: ${calculatedAnswer}`);
            question.answer = calculatedAnswer;
        }

        if (question.test) {
            try {
                const response = await this.llmService.completion([
                    { role: "system", content: SYSTEM_PROMPT },
                    { role: "user", content: question.test.q }
                ]);
                const answer = response;
                if (answer) {
                    console.log(`\nAdditional question: ${question.test.q}`);
                    console.log(`AI answer: ${answer}`);
                    question.test.a = answer;
                }
            } catch (error) {
                console.error(`Error processing additional question: ${question.test.q}`, error);
            }
        }
    }

    getResults(): AnswerFormat {
        return {
            task: "JSON",
            apikey: this.originalData.apikey,
            answer: this.originalData
        };
    }
}

// Function to process all test questions using a processor
async function processAllTestQuestions(testData: TestData, processor: TestQuestionProcessor) {
    for (const question of testData['test-data']) {
        await processor.processQuestion(question);
    }
    return processor.getResults();
}

// Function to save the processed data
async function saveProcessedData(data: AnswerFormat) {
    const outputPath = path.join(__dirname, '..', 'processed_data.json');
    await fs.promises.writeFile(outputPath, JSON.stringify(data, null, 2));
    console.log(`\nProcessed data saved to: ${outputPath}`);
}

// Function to send the processed data to the API
async function sendToApi(data: AnswerFormat): Promise<void> {
    try {
        const response = await fetch('https://c3ntrala.ag3nts.org/report', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('\nAPI Response:', result);
    } catch (error) {
        console.error('Error sending data to API:', error);
        throw error;
    }
}

// Main function to process the data
async function main() {
    try {
        const testData = readTestData();
        console.log('Description:', testData.description);
        console.log('Copyright:', testData.copyright);
        
        // Create processor and process all questions
        const processor = new TestDataProcessor(testData);
        const processedData = await processAllTestQuestions(testData, processor);
        
        // Save the processed data
        await saveProcessedData(processedData);
        
        // Send the processed data to the API
        console.log('\nSending data to API...');
        await sendToApi(processedData);
        
    } catch (error) {
        console.error('Error reading or parsing the file:', error);
    }
}

// Run the main function
main().catch(console.error);
