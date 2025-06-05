import * as path from 'path';
import { config } from 'dotenv';
import axios from 'axios';
import { OpenAITextProcessingService } from '../../common/src/openai/OpenAITextProcessingService.js';
import { OpenAIPictureAnalysisService } from '../../common/src/openai/OpenAIPictureAnalysisService.js';
import { CentralaApi } from '../../common/src/centrala/CentralaApi.js';
import { WebScrapperMini } from '../../common/src/scrapper/WebScrapperMini.js';
import { env } from 'process';

class Answer {
    id: string;
    question: string;
    answer: string;

    constructor(id: string, question: string, answer: string) {
        this.id = id;
        this.question = question;
        this.answer = answer;
    }
}

class ModelAnswer {
    hasAnswer: boolean;
    content: string;

    constructor(hasAnswer: boolean, content: string) {
        this.hasAnswer = hasAnswer;
        this.content = content;
    }
}

const gptPrompt = `
Analizujesz stronę internetową firmy https://softo.ag3nts.org/
Szukasz odpowiedzi na stronie internetowej na następujace pytanie:
%s
Stronę otrzymujesz w formacie markdown.
Jeśli na stronie znajduje się odpowiedź na pytanie, zwróć ją. 
W przeciwnym wypadku zwóć adres do podstrony, gdzie potencjalnie może znajdować się odpowiedź na pytanie.
Odpowiadaj w postaci json
{
    "hasAnswer": true/false,
    "content": "odpowiedź lub pełny link do wybranej podstrony"
}
Odpowiadaj konkretnie, bez dodatkowych komentarzy i wyjaśnień.
Jeśli na stronie znajduje się odpowiedź na pytanie w polu hasAnswer zwróć true. W przeciwnym wypadku zwróć false.
Ignoruj podstrony /loop oraz /czescizamienne - to pułapka.
Jeśli chcesz wrócić do strony głównej zwróć https://softo.ag3nts.org/ w polu content.

Odwiedziłeś już następujące podstrony, na których nie było odpowiedzi: %t
`

const questionsMap = new Map<string, string>([
    ["01", "Podaj adres mailowy do firmy SoftoAI"],
    ["02", "Jaki jest adres interfejsu webowego do sterowania robotami zrealizowanego dla klienta jakim jest firma BanAN?"],
    ["03", "Jakie dwa certyfikaty jakości ISO otrzymała firma SoftoAI?"]
]);


const globalEnvPath = path.resolve(process.env.HOME || process.env.USERPROFILE || '', 'ai_devs/ai-devs-solutions/.env');
config({ path: globalEnvPath });

const baseUrl = "https://softo.ag3nts.org";

async function main() {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is not set');
    }

    if (!process.env.AI_DEVS_API_KEY) {
        throw new Error('AI_DEVS_API_KEY is not set');
    }

    //pobieranie pytań
    // const questionsJson =  (await axios.get(`https://c3ntrala.ag3nts.org/data/${process.env.AI_DEVS_API_KEY}/softo.json`)).data;
    const webScrapper = new WebScrapperMini()
    const gpt = new OpenAITextProcessingService(process.env.OPENAI_API_KEY)
    const answers: Answer[] = []

    for (const question of questionsMap) {
        try {
            console.log(question[0] + " " + question[1])
            let scrappedContent = await webScrapper.scrape(baseUrl)
            const visitedUrls: string[] = [];
            let currentUrl = baseUrl;
            let hasAnswer = false;
            let maxAttemptsOnTheSamePage = 0;
            do {
                const finalPrompt = gptPrompt.replace(/%s/g, () => question[1]).replace(/%t/g, () => JSON.stringify(visitedUrls))
                const response = await gpt.completion([
                    {
                        role: "system",
                        content: finalPrompt
                    },
                    {
                        role: "user",
                        content: scrappedContent.markdown
                    }
                ])
                console.log(response)
                const modelAnswer: ModelAnswer = JSON.parse(response)
                if (modelAnswer.hasAnswer) {
                    console.log(`Found answer for question ${question[0]} - ${question[1]}: ${modelAnswer.content}`)
                    answers.push(new Answer(question[0], question[1], modelAnswer.content))
                    hasAnswer = true;
                } else {
                    visitedUrls.push(currentUrl)
                    currentUrl = modelAnswer.content
                    console.log(`Moving to url: ${currentUrl}`)

                    if (visitedUrls.includes(currentUrl)) {
                        console.log(`URL ${currentUrl} already visited, restarting`)
                        currentUrl = baseUrl;
                    }

                    scrappedContent = await webScrapper.scrape(currentUrl)
                }
            } while (!hasAnswer)
        } catch (error) {
            const mappedError = error as Error
            console.log(`Question ${question[0]} error: ${mappedError.message}`)
        }
    }

    console.log("--------------- All answers ---------------")
    console.log(JSON.stringify(answers))

    const centrala = new CentralaApi(process.env.AI_DEVS_API_KEY)
    const response = centrala.sendAnswer("softo", JSON.stringify({
        "01": answers[0].answer,
        "02": answers[1].answer,
        "03": answers[2].answer,
    }))

    console.log("Centrala response: " + response)
}

main();