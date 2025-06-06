import * as path from 'path';
import { config } from 'dotenv';
import axios from 'axios';
import { OpenAITextProcessingService } from '../../common/src/openai/OpenAITextProcessingService.js';
import { OpenAIPictureAnalysisService } from '../../common/src/openai/OpenAIPictureAnalysisService.js';
import { CentralaApi } from '../../common/src/centrala/CentralaApi.js';
import { WebScrapperMini } from '../../common/src/scrapper/WebScrapperMini.js';
import { env } from 'process';
import { PdfParser } from '../../common/src/files/PdfParser.js';

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

const gptImagePrompt = `
Odczytaj tekst z całego obrazka.
Tekst jest w języku Polskim i jest napisany odręcznie..
Odczytane fragmenty zwróć w postaci jsona zawierającego tablicę odczytanych fragmentów (jako stringi).
`

const gptPrompt = `
Analizujesz zapiski z dziennika. Dziennik zawiera odniesienia do faktów ale też historii nieprawdziwych.
Zapoznaj się dokładnie z treścią wszystkich zapisków.
Jeśli zapiski odnoszą się do tekstów zewnętrznych, np biblijnych, zapoznaj się również ze wskazanymi fragmentami.
Szukasz odpowiedzi na następujace pytanie:
%s
Odpowiadaj w postaci json
{
    "content": "zwięzła odpowiedź na pytanie"
}
Odpowiadaj jednym zdaniem, krótko i na temat, bez dodatkowych komentarzy i wyjaśnień.
hint: przy odpowiedzi na pytanie 01 uwzględnij wszystkie fakty podane w tekście, w szczególności odwołania do wydarzeń
hint: w pytaniu 4 Rafał odwołuje się względnie do daty spotkania. Należy ją wywnioskować na podstawie całego tekstu.
`

const questionsMap = new Map<string, string>([
    ["01", "Do którego roku przeniósł się Rafał"],
    ["02", "Kto wpadł na pomysł, aby Rafał przeniósł się w czasie?"],
    ["03", "Gdzie znalazł schronienie Rafał? Nazwij krótko to miejsce"],
    ["04", "Którego dnia Rafał ma spotkanie z Andrzejem? (format: YYYY-MM-DD)"],
    ["05", "Gdzie się chce dostać Rafał po spotkaniu z Andrzejem?"]
]);


const globalEnvPath = path.resolve(process.env.HOME || process.env.USERPROFILE || '', 'ai_devs/ai-devs-solutions/.env');
config({ path: globalEnvPath });

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
    const answers: Answer[] = []
    const pdfFilePath = "/home/adam/ai_devs/ai-devs-solutions/solutions/s04e05/data/notatnik-rafala.pdf"
    const pdfParser = new PdfParser()
    const pdfFileContent = await pdfParser.parsePdf(pdfFilePath)

    const lastPage = await pdfParser.scanPageWithOcr(pdfFilePath, 19)
    // const lastPageContent = await gptImage.analyzeImage(lastPage, gptImagePrompt)
    const lastPageContent = `
    {
    "fragments": [
        "Wszystko zostało zaplanowane. Jestem gotowy, a Andrzej przyjdzie tutaj uśmiechnięty.",
        "Barbara mówi, że dobrze robię i mam się nie poddawać.",
        "Władza robotów w 2238 nie nastąpi, a sztuczna inteligencja będzie tylko narzędziem w rękach ludzi, a nie na odwrót.",\
        "To jest ważne. Wszystko m isię miesza, ale Barbara obiecała, że po wykonaniu zadania wykonamy skok do czasów, gdzie moje schorzenie jest w pełni uleczalne.",
        "Wróci moja dawna osobowość. Wróci normalność i wróci ład w mojej głowie. To wszystko jest na wyciągnięcie ręki, muszę tylko poczekac na Andrzeja a później użyć jego samochodu",
        "Dostać się do Lubawy koło Grudziądza. Nie jest to daleko. Andrzejek będzie miał dosyć dużo paliwa. Tankowanie nie wchodzi w grę, bo nie mam kasy."
        ]
    }
    `
    console.log("PDF info: " + pdfFileContent.info)
    console.log("PDF metadata: " + pdfFileContent.metadata)
    console.log("PDF numpages: " + pdfFileContent.numpages)
    console.log("PDF numrender: " + pdfFileContent.numrender)
    console.log("PDF text: " + pdfFileContent.text)
    // console.log("PDF ocr: " + lastPageContent.choices[0]?.message?.content || 'No description available');
    console.log("PDF ocr: " + lastPageContent)

    const wholeText = pdfFileContent.text + lastPageContent

    for (const question of questionsMap) {
        try {
            console.log(question[0] + " " + question[1])

            const finalPrompt = gptPrompt.replace(/%s/g, () => question[0] + " " + question[1])
                const response = await gpt.completion([
                    {
                        role: "system",
                        content: finalPrompt
                    },
                    {
                        role: "user",
                        content: wholeText
                    }
                ])
                console.log(response)
                const modelAnswer: ModelAnswer = JSON.parse(response)
                answers.push(new Answer(question[0], question[1], modelAnswer.content))
        } catch (error) {
            const mappedError = error as Error
            console.log(`Question ${question[0]} error: ${mappedError.message}`)
        }
    }

    console.log("--------------- All answers ---------------")
    console.log(JSON.stringify(answers))

    const centrala = new CentralaApi(process.env.AI_DEVS_API_KEY)
    const response = centrala.sendAnswer("notes", JSON.stringify({
        "01": answers[0].answer,
        "02": answers[1].answer,
        "03": answers[2].answer,
        "04": answers[3].answer,
        "05": answers[4].answer
    }))

    console.log("Centrala response: " + response)
}

main();