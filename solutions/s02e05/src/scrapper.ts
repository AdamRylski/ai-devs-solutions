import * as fs from 'fs';
import { fileURLToPath } from 'url';
import * as path from 'path';
import { config } from 'dotenv';
import { CentralaApi } from '../../common/src/centrala/CentralaApi.js';
import { WebScraper } from '../../common/src/scrapper/WebScraper.js';
import { OpenAITextProcessingService } from '../../common/src/openai/OpenAITextProcessingService.js';
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const globalEnvPath = path.resolve(process.env.HOME || process.env.USERPROFILE || '', 'ai_devs/ai-devs-solutions/.env');
config({ path: globalEnvPath });

async function loadQuestions(filePath: string): Promise<any[]> {
    try {
        const questionsData = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(questionsData);
    } catch (error) {
        console.error('Error loading questions:', error);
        return [];
    }
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

interface Question {
    question_number: string;
    question: string;
}

async function processQuestionsWithLLM(
    llmService: OpenAITextProcessingService, 
    questions: Question[], 
    context: string
): Promise<Record<string, string>> {
    const systemPrompt = `
    Odpowiedz krótko na każde zadane pytanie na podstawie podanego kontekstu.
    Kontekst jest w języku polskim i angielskim.
    Kontekst zawiera artykuł, opis zdjęć oraz transkrypcję audio znajdujących się w artykule.
    Zapoznaj się z całym kontekstem przed udzieleniem odpowiedzi na pytania.
    Odpowiadaj jedynie w języku polskim.
    Jeśli nie możesz odpowiedź na pytanie, odpowiedz "Nie ma odpowiedzi na to pytanie w kontekście."
    Pomyśl przed odpowiedzią.
    W pytaniu 1 nie chodzi o śliwkę ani morele. Odpowiedź jest podana wprost w opisie zdjęcia.
    W pytaniu 4 nie chodzi o ciasto.

Odpowiedzi MUSI być w formacie JSON:
{
        "01": "krótka odpowiedź w 1 zdaniu",
        "02": "krótka odpowiedź w 1 zdaniu",
        "03": "krótka odpowiedź w 1 zdaniu",
}
        Gdzie 01 to identyfikator pytania (question_number) 

`;

    const formattedQuestions = JSON.stringify(questions)

    // console.log("---------------------------questions---------------------------")
    // console.log(formattedQuestions);
    // console.log("---------------------------sleeping---------------------------")
    // await sleep(20000000); // Sleep for 2 seconds

    const messages: ChatCompletionMessageParam[] = [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Context:\n${context}\n\nQuestions:\n${formattedQuestions}` }
    ];

    try {
        const response = await llmService.completion(messages, "gpt-4.1");
        const content = response.choices[0].message.content || "{}";
        
        try {
            return JSON.parse(content);
        } catch (parseError) {
            console.error('Error parsing LLM response as JSON:', parseError);
            return questions.reduce((acc, q) => ({
                ...acc,
                [q.question_number]: "Error parsing response"
            }), {});
        }
    } catch (error) {
        console.error('Error processing questions:', error);
        return questions.reduce((acc, q) => ({
            ...acc,
            [q.question_number]: "Error processing questions"
        }), {});
    }
}

async function main() {
    if (!process.env.AI_DEVS_API_KEY) {
        throw new Error('AI_DEVS_API_KEY is not set');
    }

    if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is not set');
    }

    const answersPath = path.join(__dirname, '../data/answers.json');
    
    // Check if answers.json exists
    if (fs.existsSync(answersPath)) {
        console.log('Found existing answers.json file');
        const answers = JSON.parse(fs.readFileSync(answersPath, 'utf-8'));
        
        // Send answers to centrala
        const centralaApi = new CentralaApi(process.env.AI_DEVS_API_KEY);

        console.log("Sending answers to centrala: " + JSON.stringify(answers));

        const response = await centralaApi.sendAnswer('arxiv', JSON.stringify(answers));
        console.log('Centrala response:', response);
        return;
    } else {
        const scraper = new WebScraper(process.env.OPENAI_API_KEY);
        const outputPath = "/home/adam/ai_devs/ai-devs-solutions/solutions/s02e05/data/arxiv-audio-draft.json";
        
        const scrappedData = await getScrappedData(outputPath, scraper);
        
        const questionsPath = path.join(__dirname, '../data/questions.json');
        const questions = await loadQuestions(questionsPath);
        
        const llmService = new OpenAITextProcessingService(process.env.OPENAI_API_KEY);
        
        // Convert scrapped data to string if it's not already
        const contextText = typeof scrappedData === 'string' ? scrappedData : JSON.stringify(scrappedData, null, 2);
        
        const answers = await processQuestionsWithLLM(llmService, questions, contextText);
        console.log('\nAnswers to questions:');
        console.log(JSON.stringify(answers, null, 2));

        // Save answers to a file
        fs.writeFileSync(answersPath, JSON.stringify(answers, null, 2));
        console.log(`\nAnswers saved to ${answersPath}`);

        // Send answers to centrala
        const centralaApi = new CentralaApi(process.env.AI_DEVS_API_KEY);
        const response = await centralaApi.sendAnswer('arxiv', JSON.stringify(answers));
        console.log('Centrala response:', response);
    }
}

main();

async function getScrappedData(outputPath: string, scraper: WebScraper) {
    
    if (fs.existsSync(outputPath)) {
        const output = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
        console.log('Using cached data from file');
        return output;
    } else {
        const output = await scraper.scrape("https://c3ntrala.ag3nts.org/dane/arxiv-draft.html", outputPath);
        console.log('Scraped new data');
        return output;
    }
}
