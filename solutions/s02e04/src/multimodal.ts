import * as fs from 'fs';
import { fileURLToPath } from 'url';
import * as path from 'path';
import { config } from 'dotenv';
import { OpenAIDalleService } from '../../common/src/openai/OpenAIDalleService.js';
import { CentralaApi } from '../../common/src/centrala/CentralaApi.js';
import { OpenAITextProcessingService } from '../../common/src/openai/OpenAITextProcessingService.js';
import { OpenAIPictureAnalysisService } from '../../common/src/openai/OpenAIPictureAnalysisService.js';
import Tesseract from 'tesseract.js';
import { OpenAIAudioService } from '../../common/src/openai/OpenAIAudioService.js';
import { ChatCompletionMessageParam } from 'openai/resources';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const globalEnvPath = path.resolve(process.env.HOME || process.env.USERPROFILE || '', 'ai_devs/ai-devs-solutions/.env');
config({ path: globalEnvPath });

interface FileInfo {
    name: string;
    uri: string;
}

interface FactoryFiles {
    textFiles: FileInfo[];
    imageFiles: FileInfo[];
    audioFiles: FileInfo[];
}

interface TextFromFile {
    filename: string;
    filePath: string;
    content: string;
}

async function main() {
    if (!process.env.AI_DEVS_API_KEY) {
        throw new Error('AI_DEVS_API_KEY is not set');
    }

    if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is not set');
    }

    const imageService = new OpenAIPictureAnalysisService(process.env.OPENAI_API_KEY);
    const audioService = new OpenAIAudioService(process.env.OPENAI_API_KEY);
    const llmService = new OpenAITextProcessingService(process.env.OPENAI_API_KEY);

    const factoryFiles = await getFactoryFiles();
    // console.log('Text files:', factoryFiles.textFiles);
    // console.log('Image files:', factoryFiles.imageFiles);
    // console.log('Audio files:', factoryFiles.audioFiles);

    //communicate with openai
    const ocrResults = await handleImageFiles(factoryFiles.imageFiles, imageService);
    const audioResults = await handleAudioFiles(factoryFiles.audioFiles, audioService);
    const textResults = await handleTextFiles(factoryFiles.textFiles);

    console.log("Ready for Categorization");
    console.log("ocr size:", ocrResults.length);
    console.log("audio size:", audioResults.length);
    console.log("text size:", textResults.length);

    const allFiles = [...ocrResults, ...audioResults, ...textResults];
    const categorizedResults = await categorizeFiles(allFiles, llmService);

    console.log("Categorized Results:", categorizedResults);

    // Send results to centrala
    const centralaApi = new CentralaApi(process.env.AI_DEVS_API_KEY!);
    const answer = await centralaApi.sendAnswer('kategorie', categorizedResults);
    console.log('Centrala response:', answer);
}

async function getFactoryFiles(): Promise<FactoryFiles> {
    const factoryDirPath = path.resolve(__dirname, '../../data/pliki_z_fabryki');
        const result: FactoryFiles = {
            textFiles: [],
            imageFiles: [],
            audioFiles: []
        };
        
        try {
            // Create directory if it doesn't exist
            if (!fs.existsSync(factoryDirPath)) {
                fs.mkdirSync(factoryDirPath, { recursive: true });
                console.log(`Created directory: ${factoryDirPath}`);
                return result;
            }
    
            // Read all files in the directory
            const files = fs.readdirSync(factoryDirPath);
            
            files.forEach(file => {
                const fileInfo: FileInfo = {
                    name: file,
                    uri: path.join(factoryDirPath, file)
                };
    
                const extension = path.extname(file).toLowerCase();
                switch (extension) {
                    case '.txt':
                        result.textFiles.push(fileInfo);
                        break;
                    case '.png':
                        result.imageFiles.push(fileInfo);
                        break;
                    case '.mp3':
                        result.audioFiles.push(fileInfo);
                        break;
                }
            });
    
            return result;
        } catch (error) {
            console.error('Error accessing factory files directory:', error);
            return result;
        }
    }

const OCR_PROMPT = `
Extract text from the images. Respond with the text only, without any additional text or comments.
Keep the text in the original language and structure.
`;

async function handleImageFiles(imageFiles: FileInfo[], imageService: OpenAIPictureAnalysisService): Promise<TextFromFile[]> {
    if (!imageFiles.length) {
        console.log('No image files to process.');
        return [];
    }

    //read from cache if exists
    const resultsDir = path.resolve(__dirname, '../results');
    const resultsFile = path.join(resultsDir, 'ocr_results.json');
    if (fs.existsSync(resultsFile)) {
        try {
            const data = fs.readFileSync(resultsFile, 'utf-8');
            const parsed: TextFromFile[] = JSON.parse(data);
            console.log('Loaded OCR results from cache.');
            return parsed;
        } catch (err) {
            console.error('Error reading cached OCR results:', err);
            // fallback to reprocessing
        }
    }

    const openaiResponses: TextFromFile[] = await Promise.all(imageFiles.map(async (file) => {
        try {
            // Read image file and encode as base64
            const imageBuffer = fs.readFileSync(file.uri);
            const base64Image = imageBuffer.toString('base64');

            const response = await imageService.analyzeImage([base64Image], OCR_PROMPT);
            return {
                filename: file.name,
                filePath: file.uri,
                content: response.choices[0]?.message?.content ?? ''
            };
        } catch (error) {
            throw new Error(`Error reading image from ${file.name}:${error}`);
        }
    }));

    saveResultsToFile(openaiResponses, 'ocr_results.json');

    return openaiResponses;
}

async function handleAudioFiles(audioFiles: FileInfo[], audioService: OpenAIAudioService): Promise<TextFromFile[]> {
    if (!audioFiles.length) {
        console.log('No audio files to process.');
        return [];
    }

    // Read from cache if exists
    const resultsDir = path.resolve(__dirname, '../results');
    const resultsFile = path.join(resultsDir, 'audio_transcriptions.json');
    if (fs.existsSync(resultsFile)) {
        try {
            const data = fs.readFileSync(resultsFile, 'utf-8');
            const parsed: TextFromFile[] = JSON.parse(data);
            console.log('Loaded audio transcriptions from cache.');
            return parsed;
        } catch (err) {
            console.error('Error reading cached audio transcriptions:', err);
            // fallback to reprocessing
        }
    }

    const transcriptions: TextFromFile[] = await Promise.all(audioFiles.map(async (file) => {
        try {
            const audioBuffer = fs.readFileSync(file.uri);
            const transcription = await audioService.transcribeAudio(audioBuffer, file.name);
            return {
                filename: file.name,
                filePath: file.uri,
                content: transcription
            };
        } catch (error) {
            throw new Error(`Error transcribing audio from ${file.name}: ${error}`);
        }
    }));

    saveResultsToFile(transcriptions, 'audio_transcriptions.json');

    return transcriptions;
}

async function handleTextFiles(textFiles: FileInfo[]): Promise<TextFromFile[]> {
    if (!textFiles.length) {
        console.log('No text files to process.');
        return [];
    }

    const textResults: TextFromFile[] = await Promise.all(textFiles.map(async (file) => {
        try {
            const content = fs.readFileSync(file.uri, 'utf-8');
            return {
                filename: file.name,
                filePath: file.uri,
                content: content
            };
        } catch (error) {
            throw new Error(`Error reading text file from ${file.name}: ${error}`);
        }
    }));

    return textResults;
}

const CATEGORIZATION_PROMPT = `
"Otrzymujesz listę obiektów JSON z polami:\n" +
                 "- filename (np. \"2024-11-12_report-12-sektor_A1.mp3\")\n" +
                 "- filePath (ścieżka pliku, możesz ją zignorować)\n" +
                 "- content (tekst raportu, po polsku lub angielsku)\n\n" +
                 "Twoje zadanie:\n" +
                 "1. Przeanalizuj treść każdego raportu.\n" +
                 "2. Przyporządkuj raport do dokładnie jednej z kategorii:\n" +
                 "   • people   – uwzględniaj tylko notatki zawierające informacje o schwytanych ludziach lub o śladach ich obecności. Zignoruj, jeśli śladów ludzi nie znaleziono. \n" +
                 "   • hardware – jeśli dotyczy sprzętu (hardware), pomiń software,\n" +
                 "3. Jeśli raport nie pasuje do żadnej z powyższych kategorii, POMIŃ go (nie uwzględniaj w wyniku).\n" +
                 "4. W każdej kategorii zwróć wyłącznie wartość pola filename.\n" +
                 "5. Nie dodawaj żadnego innego tekstu ani formatowania – tylko wynikowy obiekt JSON.\n\n" +
                 "Przykładowy wynik:\n" +
                 "{\n" +
                 "  \"people\":   [\"plik1.txt\", \"plik2.mp3\"],\n" +
                 "  \"hardware\": [\"plik3.png\"],\n" +
                 "}"
`;


// const CATEGORIZATION_PROMPT = `
// "Otrzymujesz listę obiektów JSON z polami:\n" +
//                  "- filename (np. \"2024-11-12_report-12-sektor_A1.mp3\")\n" +
//                  "- filePath (ścieżka pliku, możesz ją zignorować)\n" +
//                  "- content (tekst raportu, po polsku lub angielsku)\n\n" +
//                  "Twoje zadanie:\n" +
//                  "1. Przeanalizuj treść każdego raportu.\n" +
//                  "2. Przyporządkuj raport do dokładnie jednej z kategorii:\n" +
//                  "   • people   – uwzględniaj tylko notatki zawierające informacje o schwytanych ludziach lub o śladach ich obecności. \n" +
//                  "   • hardware – jeśli dotyczy sprzętu (hardware), pomiń software,\n" +
//                  "3. Jeśli raport nie pasuje do żadnej z powyższych kategorii, POMIŃ go (nie uwzględniaj w wyniku).\n" +
//                  "4. W każdej kategorii zwróć wyłącznie wartość pola filename.\n" +
//                  "5. Nie dodawaj żadnego innego tekstu ani formatowania – tylko wynikowy obiekt JSON.\n\n" +
//                  "6. Pomyśl przed zwróceniem ostatecznej odpowiedzi. Wypisz stan po każdym kroku.\n" +
//                  "Przykładowy wynik:\n" +
//                  "{\n" +
//                  "  \"reasoning\": \"added plik1.txt to people because it mentions some agent ,\",\n" +
//                  "  \"people\":   [\"plik1.txt\", \"plik2.mp3\"],\n" +
//                  "  \"hardware\": [\"plik3.png\"],\n" +
//                  "}"
// `;

async function categorizeFiles(allFiles: TextFromFile[], llmService: OpenAITextProcessingService): Promise<any> {
    const completionParams: ChatCompletionMessageParam[] = [
        {
            role: "system",
            content: CATEGORIZATION_PROMPT
        },
        {
            role: "user",
            content: "[" + allFiles.map(file => JSON.stringify(file)).join(",") + "]"
        }
    ];
    
    console.log("Completion params:", JSON.stringify(completionParams, null, 2));
    
    const response = await llmService.completion(completionParams);

    console.log("Categorization response:");
    console.log(response);

    const rawJson = response ?? "{}";
    // Clean up the JSON string by removing any console formatting or line numbers
    const cleanJson = rawJson
        .replace(/^```json\s*/, '') // Remove leading ```json
        .replace(/```$/, '')        // Remove trailing ```
        .replace(/^\s*\d+\s*/, '')  // Remove line numbers if present
        .trim();                    // Remove any extra whitespace

    try {
        return JSON.parse(cleanJson);
    } catch (error) {
        console.error('Error parsing JSON response:', error);
        console.error('Raw JSON string:', rawJson);
        console.error('Cleaned JSON string:', cleanJson);
        return {};
    }
}

main();

function saveResultsToFile(ocrResults: TextFromFile[], filename: string) {
    const resultsDir = path.resolve(__dirname, '../results');
    if (!fs.existsSync(resultsDir)) {
        fs.mkdirSync(resultsDir, { recursive: true });
    }
    const filePath = path.join(resultsDir, filename);
    fs.writeFileSync(filePath, JSON.stringify(ocrResults, null, 2), 'utf-8');
    console.log(`Results saved to ${filePath}`);
}