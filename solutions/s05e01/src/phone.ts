import * as path from 'path';
import { config } from 'dotenv';
import axios from 'axios';
import { OpenAITextProcessingService } from '../../common/src/openai/OpenAITextProcessingService.js';
import { OpenAIPictureAnalysisService } from '../../common/src/openai/OpenAIPictureAnalysisService.js';
import { CentralaApi, Question } from '../../common/src/centrala/CentralaApi.js';
import { WebScrapperMini } from '../../common/src/scrapper/WebScrapperMini.js';
import { env } from 'process';
import { PdfParser } from '../../common/src/files/PdfParser.js';
import { json } from 'stream/consumers';
import { FileHandler, FileData } from '../../common/src/files/FileHandler.js';
import OpenAI from 'openai';

const globalEnvPath = path.resolve(process.env.HOME || process.env.USERPROFILE || '', 'ai_devs/ai-devs-solutions/.env');
config({ path: globalEnvPath });

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

 interface ModelAnswer{
    answer: string
}


const promptTemplate = `
Dokładnie Przenalizuj rozmowy telefoniczne oraz znane fakty i na ich podstawie odpowiedz na pytania.
Odpowiedzi mogą nie być podane wprost, należy je wydedukować na podstawie faktów i analizy przeprowadzonych rozmów.
Odpowiadaj w języku polskim.

Ustal Imiona uczestników danej rozmowy telefonicznej przed udzieleniem odpowiedzi na pytanie.
Sprawdź, czy któraś z poprzednich odpowiedzi nie zawiera wskazówki.
W każdej rozmowie uczestniczą tylko dwie osoby, które wypowiadają się naprzemiennie. 
Imiona rozmówców są unikalne, jeśli Stefan pojawia się w pierwszej i piątej rozmowie, to jest to ten sam Stefan.
Pomyśl przed udzieleniem odpowiedzi

Treść rozmowy
%r

Odpowiedzi na poprzednie pytania:
%p

Fakty:
%f

Podpowiedzi: 
- WAŻNE Odpowiadaj krótko i na temat, bez dodatkowych wyjaśnień.
- WAŻNE Barbara nie kłamie
- WAŻNE Samuel kłamie
- WAŻNE nie chodzi o endpoint https://rafal.ag3nts.org/510bc
- WAŻNE hasła nie dostarczył Witek ani Samuel

Odpowiadaj używając JSONa w formacie:
{
    "answer": "Precyzyjna odpowiedź na pytanie"
}
`


const phoneCallPrompt = `
Zapoznaj się z transkrypcją rozmów. 
Wszystkie pośrednio lub bezpośrednio dotyczą Rafała. 
Fragmenty rozmów są poszatkowane. 
Wiemy, że wszystkich rozmów było 5. 
Wiemy także z logów, jakim zdaniem rozpoczyna i kończy się każda rozmowa.
Przypisz odpowiednie fragmenty rozmów do rozmów.
Fragmenty uporządkowane w odpowiedniej kolejności umieść w tablicy fragments.
Rozmowy muszą tworzyć logiczną całość.
Każdego fragmentu musisz użyć tylko raz.
W każdej rozmowie uczestniczą tylko dwie osoby, które wypowiadają się naprzemiennie. 
Imiona rozmówców są unikalne, więc jeśli np. Stefan pojawia się w pierwszej i piątej rozmowie, to jest to ten sam Stefan.
Pamiętaj o dołączeniu fragmentów rozpoczynających i kończących rozmowę do odpowiedzi.
Pomyśl przed udzieleniem odpowiedzi.
Odpowiedz w postaci JSON
{
  rozmowa1: {
    fragments: []
    length: 25
  },
  rozmowa2: {
    fragments: []
    length: 7
  }
}
`

const phoneCallAnalysisPath = "/home/adam/ai_devs/ai-devs-solutions/solutions/s05e01/data/phoneCallAnalysis.json"
const factsPath = "/home/adam/ai_devs/ai-devs-solutions/solutions/data/pliki_z_fabryki/facts_summarized/"

async function main() {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is not set');
    }

    if (!process.env.AI_DEVS_API_KEY) {
        throw new Error('AI_DEVS_API_KEY is not set');
    }

    //pobieranie pytań
    // const questionsJson =  (await axios.get(`https://c3ntrala.ag3nts.org/data/${process.env.AI_DEVS_API_KEY}/softo.json`)).data;
    const gpt = new OpenAITextProcessingService(process.env.OPENAI_API_KEY)
    const gptImage = new OpenAIPictureAnalysisService(process.env.OPENAI_API_KEY)
    const centrala = new CentralaApi(process.env.AI_DEVS_API_KEY)
    const phoneCallTranscript = JSON.parse(await centrala.downloadTaskInputWithApiKey("phone.json"))

    //analyze phone call transcript
    const preparedPhoneCall = await preparePhoneCall(false, gpt, phoneCallTranscript);
    const facts: FileData[] = await loadFacts()
    const questions2: Question[] = await centrala.fetchQuestions("phone_questions.json")

    const questions: Question[] = []

    const answers: Answer[] = [];
    const centralaAnswerMap: Map<string, string> = new Map()
    
    for (const question of questions) {
        console.log(`Answering question ${question.id} - ${question.question}`)
        const finalPrompt = promptTemplate
                                .replace(/%r/g, () => JSON.stringify(preparedPhoneCall))
                                .replace(/%p/g, () => JSON.stringify(answers))
                                .replace(/%f/g, () => JSON.stringify(facts))

        const llmAnswer = await gpt.completionJson([
            {
                role: "system",
                content: finalPrompt
            },
            {
                role: "user",
                content: question.question
            }
        ], "gpt-4o");

        const mappedAnswer: ModelAnswer = llmAnswer
        console.log(`Generated answer: ${mappedAnswer.answer}`)
        answers.push(
            new Answer(question.id, question.question, mappedAnswer.answer)
        )
    }

    for (const answer of answers) {
        console.log(`${answer.id} - ${answer.answer}`)
        centralaAnswerMap.set(answer.id, answer.answer)
    }

    console.log(">>>>>>>>>>>>>>>><<<<<<<<<<<<<<<")
    console.log(JSON.stringify(centralaAnswerMap))

    
    const centralaResponse = centrala.sendAnswer("phone", JSON.stringify(centralaAnswerMap))
    console.log(`Centrala response ${centralaResponse}`)
}

main();

async function loadFacts(): Promise<FileData[]> {
    return FileHandler.readFilesFromFolder(factsPath)
}

async function preparePhoneCall(firstRun: boolean = true, gpt: OpenAITextProcessingService, phoneCallTranscript: any): Promise<any> {

    if (firstRun) {
        const phoneCallAnalysis = await gpt.completionJson([
            {
                role: "system",
                content: phoneCallPrompt
            },
            {
                role: "user",
                content: JSON.stringify(phoneCallTranscript)
            }
        ], "gpt-4o");
        
        console.log(`Dumping prepared phone call data to file ${phoneCallAnalysisPath} to save some tokens later`)
        FileHandler.write(phoneCallAnalysisPath, JSON.stringify(phoneCallAnalysis));
        return phoneCallAnalysis;
    } else {
        console.log("Using predefined phone call to save some tokens: " + phoneCallAnalysisPath)
        return FileHandler.read(phoneCallAnalysisPath);
    }
}
