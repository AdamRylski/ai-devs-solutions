import * as path from 'path';
import { config } from 'dotenv';
import axios from 'axios';
import { OpenAITextProcessingService } from '../../common/src/openai/OpenAITextProcessingService.js';
import { OpenAIPictureAnalysisService } from '../../common/src/openai/OpenAIPictureAnalysisService.js';
import { CentralaApi } from '../../common/src/centrala/CentralaApi.js';


const gptPrompt = `
Na podstawie poniższych opisów zdjęć stwórz spójny, szczegółowy opis Barbary. \
Nie na każdym zdjęciu znajduje się Barbara, na niektórych znajduje się grupa osób. \
Musisz rozpoznać, która z postaci to Barbara.
Uwzględnij cechy twarzy (kształt twarzy, nosa, ust, oczu, brwi), fryzurę i kolor włosów, kolor skóry, typ sylwetki, strój, \
postawę ciała oraz ewentualne znaki szczególne (np. blizny, pieprzyki, tatuaże, okulary itp.). \
Opis ma być wystarczająco szczegółowy, by na jego podstawie dało się wygenerować realistyczny portret tej osoby. \
Nie dodawaj informacji, których nie ma w opisach. \
Jeśli jakaś cecha nie jest opisana, pomiń ją. \
Opisz osobę w formie neutralnej i obiektywnej, bez ocen czy interpretacji. \
Opis musi być w języku polskim.
`

class CentralaRequest {

    task: string;
    apikey: string;
    answer: string;

    constructor(task: string, apikey: string, answer: string) {
        this.task = task;
        this.apikey = apikey;
        this.answer = answer;
    }

}

class CentralaResponse {
    code: number;
    message: string;

    constructor(code: number, message: string) {
        this.code = code;
        this.message = message;
    }
}

class PhotoDescription {
    filename: string;
    description: string;

    constructor(filename: string, description: string) {
        this.filename = filename;
        this.description = description;
    }
}

enum allowedOperations {
    REPAIR,
    DARKEN,
    BRIGHTEN
}

const task = "photos";
const startCommand = "START";

const globalEnvPath = path.resolve(process.env.HOME || process.env.USERPROFILE || '', 'ai_devs/ai-devs-solutions/.env');
config({ path: globalEnvPath });
const DATABASE_API_URL = 'https://c3ntrala.ag3nts.org/apidb';




async function main() {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is not set');
    }

    if (!process.env.AI_DEVS_API_KEY) {
        throw new Error('AI_DEVS_API_KEY is not set');
    }

    const centralaAPI = new CentralaApi(process.env.AI_DEVS_API_KEY);
    const textProcessingService = new OpenAITextProcessingService(process.env.OPENAI_API_KEY);
    const imageProcessingService = new OpenAIPictureAnalysisService(process.env.OPENAI_API_KEY);
    const initialCommand = new CentralaRequest(task, process.env.AI_DEVS_API_KEY, startCommand);

    const response = await centralaAPI.sendAnswer(initialCommand.task, initialCommand.answer);
    console.log(response);
    
    const data = JSON.parse(response);
    const mappedResponse = new CentralaResponse(data.code, data.message);




    if (mappedResponse.code === 0) {
        console.log("Successfully started the task");
    } else {
        console.log("Failed to start the task");
        return;
    }

    // Extract filenames from the response message
    const photoFilenames: string[] = mappedResponse.message.match(/IMG_\d+\.PNG/g) || [];
    if (photoFilenames.length === 0) {
        console.log("No photo filenames found in the response");
        return;
    }

    
    // const photoDescriptions: PhotoDescription[] = [];

    // // Process each photo
    // for (const filename of photoFilenames) {
    //     let currentFilename = filename;
    //     let isPhotoImproved = true;


    //     while (isPhotoImproved) {
    //         // Get the current photo data
    //         // const photoResponse = await centralaAPI.downloadTaskInputWithApiKey(currentFilename);
    //         // const photoBase64 = photoResponse;
    //         const photoUrl = `https://centrala.ag3nts.org/dane/barbara/${currentFilename}`;

    //         // Analyze the photo using OpenAI Vision
    //         const imageAnalysis = await imageProcessingService.analyzeImageUrl(
    //             photoUrl,
    //             "Analyze photo under this url and describe its quality, focusing on brightness, clarity, and overall appearance. Be specific about any issues with exposure (too dark/bright) or if it needs repair."
    //         );

    //         const imageDescription = imageAnalysis.output_text;
    //         console.log("Image " + currentFilename + " description: " + imageDescription);

    //         // Determine required operation based on the analysis
    //         const operationAnalysis = await textProcessingService.completion([
    //             {
    //                 role: "system",
    //                 content: "You are a photo quality expert. Based on the photo description, determine if any improvements are needed. Return ONLY ONE of these exact words: REPAIR (if the image needs fixing), DARKEN (if it's too bright), BRIGHTEN (if it's too dark), or NONE (if no improvements needed)."
    //             },
    //             {
    //                 role: "user",
    //                 content: imageDescription || ""
    //             }
    //         ]);

    //         const operation = operationAnalysis.trim().toUpperCase();
    //         console.log("Operation for " + currentFilename + " is: " + operation);
        
    //         if (operation === "NONE") {
    //             console.log(`Photo ${currentFilename} is already optimal`);
    //             console.log("--------------------------------");

    //             const finalImageAnalysis = await imageProcessingService.analyzeImageUrl(
    //                 photoUrl,
    //                 "TODO FIX ME"asdasd!@#!@# << prompt do opisu osób na zdjęciu
    //             );

    //             console.log("Final image analysis: " + finalImageAnalysis.output_text);
    //             photoDescriptions.push(new PhotoDescription(currentFilename, imageAnalysis.output_text));
    //             isPhotoImproved = false;
    //             continue;
    //         }

    //         if (!Object.keys(allowedOperations).includes(operation)) {
    //             console.log(`Invalid operation suggested: ${operation}`);
    //             isPhotoImproved = false;
    //             continue;
    //         }

    //         // Send the operation command to the API
    //         const operationCommand = new CentralaRequest(
    //             task,
    //             process.env.AI_DEVS_API_KEY || "",
    //             `${operation} ${currentFilename}`
    //         );

    //         const operationResponse = await centralaAPI.sendAnswer(
    //             operationCommand.task,
    //             operationCommand.answer
    //         );

    //         const operationData = JSON.parse(operationResponse);
    //         const operationResult = new CentralaResponse(
    //             operationData.code,
    //             operationData.message
    //         );

    //         console.log("Operation " + currentFilename + " result: " + operationResult);

    //         if (operationResult.code !== 0) {
    //             console.log(`Operation failed: ${operationResult.message}`);
    //             isPhotoImproved = false;
    //             continue;
    //         }

    //         // Extract the new filename from the response
    //         const newFilename = operationResult.message.match(/IMG_\d+(?:_[A-Z0-9]+)?\.PNG/)?.[0];
    //         if (!newFilename) {
    //             console.log("Could not extract new filename from response");
    //             isPhotoImproved = false;
    //             continue;
    //         }

    //         console.log(`Successfully applied ${operation} to ${currentFilename}, new file: ${newFilename}`);
    //         currentFilename = newFilename;
    //     }
    // }

    // console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>><<<<<<<<<<<<<<<<<<<<<<<<<<<");
    // console.log("Photo descriptions: " + JSON.stringify(photoDescriptions));


    const fileURLs: string[] = [];
    fileURLs.push(
        "https://centrala.ag3nts.org/dane/barbara/IMG_559_NRR7.PNG",
        "https://centrala.ag3nts.org/dane/barbara/IMG_1410_FXER.PNG",
        "https://centrala.ag3nts.org/dane/barbara/IMG_1443_FT12.PNG",
        "https://centrala.ag3nts.org/dane/barbara/IMG_1444.PNG",
    );

    const photoDescriptions: PhotoDescription[] = [];

    for (const fileURL of fileURLs) {

        const imageAnalysis = await imageProcessingService.analyzeImageUrl(
            fileURL,
            "Opisz zdjęcie w formie neutralnej i obiektywnej, bez ocen czy interpretacji. Zwróć uwagę szczególnie na osoby znajdujące się na zdjęciach i ich cechy szczególne."
        );
        console.log("Image " + fileURL + " description: " + imageAnalysis.output_text);
        photoDescriptions.push(new PhotoDescription(fileURL, imageAnalysis.output_text));
    }

    console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>><<<<<<<<<<<<<<<<<<<<<<<<<<<");
    const barbaraDescription = await textProcessingService.completion([
        {
            role: "system",
            content: gptPrompt
        },
        {
            role: "user",
            content: JSON.stringify(photoDescriptions)
        }
    ], "gpt-4");

    console.log("Barbara description: " + barbaraDescription);

}

main();