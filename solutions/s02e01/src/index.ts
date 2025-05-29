import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { OpenAIAudioService, OpenAITextProcessingService, LlmTextProcessingService } from '../../common/src/openai/index.js';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { config } from 'dotenv';

const globalEnvPath = path.resolve(process.env.OPENAI_API_KEY || '', 'ai_devs/ai-devs-solutions/.env');
config({ path: globalEnvPath });

// Load environment variables
config();

interface LocationAnalysis {
    instytut: string;
    adres: string;
    ulica: string;
    wnioski: string;
}

interface TranscriptionData {
    personName: string;
    transcription: string;
    fileName: string;
    analysis?: LocationAnalysis;
}

const transcriptions: TranscriptionData[] = [];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');

const ANALYSIS_SYSTEM_PROMPT = `
Twoim zadaniem jest ustalenie, **na jakiej ulicy znajduje się konkretny instytut uczelni, w którym wykłada profesor Andrzej Maj**. Nie interesuje nas adres głównej siedziby uczelni, tylko konkretna lokalizacja instytutu, w którym pracuje profesor.

Poniżej znajdują się pełne transkrypcje nagrań z przesłuchań świadków oskarżonych o kontakty z profesorem. Każda transkrypcja jest oznaczona imieniem osoby, która zeznaje. Zeznania mogą być niespójne, wykluczać się nawzajem lub uzupełniać.

Przeanalizuj wszystkie transkrypcje **krok po kroku** i **wyciągnij logiczne wnioski**, łącząc wypowiedzi wszystkich świadków. Możesz myśleć na głos, żeby uporządkować fakty i dojść do najlepszego możliwego wniosku.

Na koniec, jeśli potrzebne, **użyj również swojej wiedzy na temat uczelni, na której wykłada profesor Andrzej Maj**, by ustalić możliwą nazwę ulicy, na której znajduje się jego instytut.

Na końcu odpowiedzi podaj nazwę ulicy i nazwę instytutu oraz wnioski w postaci JSON
{
 "instytut": "",
 "adres": "",
 "ulica": "",
 "wnioski": ""
}
`;


async function analyzeAllTranscriptions(transcriptions: TranscriptionData[], llmService: LlmTextProcessingService): Promise<LocationAnalysis> {
    const formattedTranscriptions = transcriptions
        .map(t => `=== Zeznanie ${t.personName} ===\n${t.transcription}\n`)
        .join('\n');

    const messages: ChatCompletionMessageParam[] = [
        {
            role: "system",
            content: ANALYSIS_SYSTEM_PROMPT
        },
        {
            role: "user",
            content: `Please analyze the following transcriptions according to the specified format:\n\n${formattedTranscriptions}`
        }
    ];

    try {
        const completion = await llmService.completion(messages);
        const analysis = completion;
        
        if (!analysis) {
            throw new Error('No analysis received from LLM');
        }

        // Extract JSON from the response
        const jsonMatch = analysis.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No JSON found in the analysis response');
        }

        const locationAnalysis: LocationAnalysis = JSON.parse(jsonMatch[0]);
        return locationAnalysis;
    } catch (error) {
        console.error('Error analyzing transcriptions:', error);
        throw error;
    }
}

async function sendReport(ulica: string): Promise<void> {
    const API_KEY = process.env.AI_DEVS_API_KEY;
    if (!API_KEY) {
        throw new Error('API_KEY environment variable is not set');
    }

    const reportData = {
        task: "mp3",
        apikey: API_KEY,
        answer: ulica
    };

    try {
        const response = await fetch('https://c3ntrala.ag3nts.org/report', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(reportData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Report sent successfully:', result);
    } catch (error) {
        console.error('Error sending report:', error);
        throw error;
    }
}

async function processAudioFiles() {
    try {
        // Check if directory exists
        if (!fs.existsSync(DATA_DIR)) {
            console.log('Data directory does not exist. Creating it...');
            fs.mkdirSync(DATA_DIR, { recursive: true });
            return;
        }

        // Read directory contents
        const files = fs.readdirSync(DATA_DIR);
        
        if (files.length === 0) {
            console.log('No files found in data directory.');
            return;
        }

        console.log('Processing audio files in data directory:');

        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY is not set');
        }
        const audioService = new OpenAIAudioService(process.env.OPENAI_API_KEY);
        const llmService = new OpenAITextProcessingService(process.env.OPENAI_API_KEY);

        // First phase: Transcribe all files
        for (const file of files) {
            const filePath = path.join(DATA_DIR, file);
            const stats = fs.statSync(filePath);
            
            // Skip if not a file or if it's not an audio file
            if (!stats.isFile() || !isAudioFile(file)) {
                console.log(`Skipping ${file} - not an audio file`);
                continue;
            }

            // Extract person name from filename (remove extension)
            const personName = path.parse(file).name;
            
            console.log(`Transcribing ${file} (${stats.size} bytes) for person: ${personName}...`);
            
            try {
                const audioData = fs.readFileSync(filePath);
                const transcription = await audioService.transcribeAudio(audioData, file);
                
                // Store the transcription data
                transcriptions.push({
                    personName,
                    transcription,
                    fileName: file
                });
                
                console.log(`Transcription completed for ${personName}`);
            } catch (error) {
                console.error(`Error processing ${file}:`, error);
            }
        }

        // Second phase: Analyze all transcriptions together
        if (transcriptions.length > 0) {
            console.log('\nAnalyzing all transcriptions together...');
            const analysis = await analyzeAllTranscriptions(transcriptions, llmService);
            
            // Update all transcriptions with the analysis
            transcriptions.forEach(t => t.analysis = analysis);
            
            console.log('\nAnalysis results:');
            console.log(`Instytut: ${analysis.instytut}`);
            console.log(`Adres: ${analysis.adres}`);
            console.log(`Ulica: ${analysis.ulica}`);
            console.log(`Wnioski: ${analysis.wnioski}`);

            // Send report with the street name
            await sendReport(analysis.ulica);
        }

        // Log summary of processed transcriptions
        console.log('\nProcessed transcriptions summary:');
        console.log(`Total transcriptions: ${transcriptions.length}`);
        transcriptions.forEach(t => {
            const analysis = t.analysis;
            if (analysis) {
                console.log(`- ${t.personName}:`);
                console.log(`  Instytut: ${analysis.instytut}`);
                console.log(`  Adres: ${analysis.adres}`);
                console.log(`  Ulica: ${analysis.ulica}`);
                console.log(`  Wnioski: ${analysis.wnioski}`);
            } else {
                console.log(`- ${t.personName}: No analysis available`);
            }
        });
    } catch (error) {
        console.error('Error processing audio files:', error);
    }
}

function isAudioFile(filename: string): boolean {
    const audioExtensions = ['.mp3', '.mp4', '.mpeg', '.mpga', '.m4a', '.wav', '.webm'];
    const ext = path.extname(filename).toLowerCase();
    return audioExtensions.includes(ext);
}

// Run the application
processAudioFiles();
