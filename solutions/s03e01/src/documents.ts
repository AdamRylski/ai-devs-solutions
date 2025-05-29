import * as fs from 'fs';
import { fileURLToPath } from 'url';
import * as path from 'path';
import { config } from 'dotenv';
import { FileHandler } from '../../common/src/files/FileHandler.js';
import { OpenAITokenizer } from '../../common/src/openai/OpenAITokenizer.js';
import { OpenAITextProcessingService } from '../../common/src/openai/OpenAITextProcessingService.js';
import type { TokenizedRecord } from '../../common/src/openai/OpenAITokenizer.js';
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { CentralaApi } from '../../common/src/centrala/CentralaApi.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const globalEnvPath = path.resolve(process.env.HOME || process.env.USERPROFILE || '', 'ai_devs/ai-devs-solutions/.env');
config({ path: globalEnvPath });

// The list of files to process will be provided later
const reports: string[] = [
    '/home/adam/ai_devs/ai-devs-solutions/solutions/data/pliki_z_fabryki/2024-11-12_report-00-sektor_C4.txt',
    '/home/adam/ai_devs/ai-devs-solutions/solutions/data/pliki_z_fabryki/2024-11-12_report-01-sektor_A1.txt',
    '/home/adam/ai_devs/ai-devs-solutions/solutions/data/pliki_z_fabryki/2024-11-12_report-02-sektor_A3.txt',
    '/home/adam/ai_devs/ai-devs-solutions/solutions/data/pliki_z_fabryki/2024-11-12_report-03-sektor_A3.txt',
    '/home/adam/ai_devs/ai-devs-solutions/solutions/data/pliki_z_fabryki/2024-11-12_report-04-sektor_B2.txt',
    '/home/adam/ai_devs/ai-devs-solutions/solutions/data/pliki_z_fabryki/2024-11-12_report-05-sektor_C1.txt',
    '/home/adam/ai_devs/ai-devs-solutions/solutions/data/pliki_z_fabryki/2024-11-12_report-06-sektor_C2.txt',
    '/home/adam/ai_devs/ai-devs-solutions/solutions/data/pliki_z_fabryki/2024-11-12_report-07-sektor_C4.txt',
    '/home/adam/ai_devs/ai-devs-solutions/solutions/data/pliki_z_fabryki/2024-11-12_report-08-sektor_A1.txt',
    '/home/adam/ai_devs/ai-devs-solutions/solutions/data/pliki_z_fabryki/2024-11-12_report-09-sektor_C2.txt'
];

const facts: string[] = [
    '/home/adam/ai_devs/ai-devs-solutions/solutions/data/pliki_z_fabryki/facts/f01.txt',
    '/home/adam/ai_devs/ai-devs-solutions/solutions/data/pliki_z_fabryki/facts/f02.txt',
    '/home/adam/ai_devs/ai-devs-solutions/solutions/data/pliki_z_fabryki/facts/f03.txt',
    '/home/adam/ai_devs/ai-devs-solutions/solutions/data/pliki_z_fabryki/facts/f04.txt',
    '/home/adam/ai_devs/ai-devs-solutions/solutions/data/pliki_z_fabryki/facts/f05.txt',
    '/home/adam/ai_devs/ai-devs-solutions/solutions/data/pliki_z_fabryki/facts/f06.txt',
    '/home/adam/ai_devs/ai-devs-solutions/solutions/data/pliki_z_fabryki/facts/f07.txt',
    '/home/adam/ai_devs/ai-devs-solutions/solutions/data/pliki_z_fabryki/facts/f08.txt',
    '/home/adam/ai_devs/ai-devs-solutions/solutions/data/pliki_z_fabryki/facts/f09.txt'
];

// The list of files to process will be provided later
const tokenizedReportsPaths: string[] = [
    '/home/adam/ai_devs/ai-devs-solutions/solutions/s03e01/data/reports/2024-11-12_report-00-sektor_C4_tokenized.json',
    '/home/adam/ai_devs/ai-devs-solutions/solutions/s03e01/data/reports/2024-11-12_report-01-sektor_A1_tokenized.json',
    '/home/adam/ai_devs/ai-devs-solutions/solutions/s03e01/data/reports/2024-11-12_report-02-sektor_A3_tokenized.json',
    '/home/adam/ai_devs/ai-devs-solutions/solutions/s03e01/data/reports/2024-11-12_report-03-sektor_A3_tokenized.json',
    '/home/adam/ai_devs/ai-devs-solutions/solutions/s03e01/data/reports/2024-11-12_report-04-sektor_B2_tokenized.json',
    '/home/adam/ai_devs/ai-devs-solutions/solutions/s03e01/data/reports/2024-11-12_report-05-sektor_C1_tokenized.json',
    '/home/adam/ai_devs/ai-devs-solutions/solutions/s03e01/data/reports/2024-11-12_report-06-sektor_C2_tokenized.json',
    '/home/adam/ai_devs/ai-devs-solutions/solutions/s03e01/data/reports/2024-11-12_report-07-sektor_C4_tokenized.json',
    '/home/adam/ai_devs/ai-devs-solutions/solutions/s03e01/data/reports/2024-11-12_report-08-sektor_A1_tokenized.json',
    '/home/adam/ai_devs/ai-devs-solutions/solutions/s03e01/data/reports/2024-11-12_report-09-sektor_C2_tokenized.json'
];

const tokenizedFactsPaths: string[] = [
    '/home/adam/ai_devs/ai-devs-solutions/solutions/s03e01/data/facts/f01_tokenized.json',
    '/home/adam/ai_devs/ai-devs-solutions/solutions/s03e01/data/facts/f02_tokenized.json',
    '/home/adam/ai_devs/ai-devs-solutions/solutions/s03e01/data/facts/f03_tokenized.json',
    '/home/adam/ai_devs/ai-devs-solutions/solutions/s03e01/data/facts/f04_tokenized.json',
    '/home/adam/ai_devs/ai-devs-solutions/solutions/s03e01/data/facts/f05_tokenized.json',
    '/home/adam/ai_devs/ai-devs-solutions/solutions/s03e01/data/facts/f06_tokenized.json',
    '/home/adam/ai_devs/ai-devs-solutions/solutions/s03e01/data/facts/f07_tokenized.json',
    '/home/adam/ai_devs/ai-devs-solutions/solutions/s03e01/data/facts/f08_tokenized.json',
    '/home/adam/ai_devs/ai-devs-solutions/solutions/s03e01/data/facts/f09_tokenized.json'
];

async function processFiles(inputFiles: string[], outputDir: string, tokenizer: OpenAITokenizer): Promise<TokenizedRecord[]> {
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    var tokenizedRecords: TokenizedRecord[] = [];

    for (const filePath of inputFiles) {
        try {
            console.log('Processing file: ' + filePath);
            // Read the file content
            const content = FileHandler.read(filePath);
            
            // Process the file
            const tokenizedRecord = await tokenizer.tokenize(content, filePath);
            
            // Generate output filename
            const baseFileName = path.basename(filePath, path.extname(filePath));
            const outputPath = path.join(outputDir, `${baseFileName}_tokenized.json`);
            
            // Save the tokenized record
            FileHandler.write(outputPath, JSON.stringify(tokenizedRecord, null, 2));
            
            console.log(`Successfully processed and saved: ${outputPath}`);
            tokenizedRecords.push(tokenizedRecord);
        } catch (error) {
            console.error(`Error processing file ${filePath}:`, error);
        }
    }

    return tokenizedRecords;
}

const prompt = `
Dostajesz ztokenizowany raport oraz listę faktów.
Połącz raport z faktami i wygeneruj listę słów kluczy dla danego faktu.
W "faktach" mogą występować drobne różnice w pisowni nazwisk (np. "Kowaski" i "Kowalki"). System powinien rozpoznać, że to ta sama osoba.
Wykorzystaj także informacje z nazwy pliku raportu. 
Sektory oznaczone są literami np A, B. 
Podsektory mają oznaczenia np A1, A2.
Słowa kluczowe muszą być w języku polskim i w mianowniku.
Słowa powinny być oddzielone przecinkami (np. słowo1,słowo2,słowo3).
Lista powinna precyzyjnie opisywać raport, uwzględniając treść raportu, powiązane fakty oraz informacje z nazwy pliku.
Zwróć tylko listę słów kluczowych, bez dodatkowych informacji.
Najczęstszym łącznikiem będą osoby wymienione w raporcie i w faktach.
W jednym z raportów znajduje się ważna informacja o złapaniu nauczyciela, nie pomijaj jej.
Jeśli słowa kluczowe dotyczą osób, uwzględnij wszystkie informacje o nich w odpowiedzi.
`;

interface RecordToSend {
    fileName: string;
    titleInfo?: string; // np. z nazwy pliku
    namedEntities: {
      persons: string[];
      places: string[];
      objects: string[];
      animals: string[];
    };
}

interface ReportWithFacts {
    record: RecordToSend;
    facts: RecordToSend[];
}

export interface CentralaAnswer {
    [key: string]: string;
}

async function processReportWithFacts(report: TokenizedRecord, processedFacts: TokenizedRecord[], llmService: OpenAITextProcessingService): Promise<TokenizedRecord> {
  try {

    const recordToSend: RecordToSend = {
        fileName: report.fileName,
        titleInfo: report.titleInfo,
        namedEntities: report.namedEntities
    }

    const factsToSend: RecordToSend[] = processedFacts.map(fact => ({
        fileName: fact.fileName,
        titleInfo: fact.titleInfo,
        namedEntities: fact.namedEntities
    }));

    const reportWithFacts: ReportWithFacts = {
        record: recordToSend,
        facts: factsToSend
    }


    // 3. Send to OpenAI for processing
    const messages: ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: prompt
      },
      {
        role: "user",
        content: JSON.stringify(reportWithFacts)
      }
    ];

    const completion = await llmService.completion(messages);
    
    console.log("--------------------------------");
    console.log(completion.choices[0].message.content);
    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error('No content received from OpenAI');
    }
    report.relatedFacts = content;
    return report;

  } catch (error) {
    console.error('Error processing report with facts:', error);
    throw error;
  }
}

async function main() {
    const firstRun = false;

    if (!process.env.AI_DEVS_API_KEY) {
        throw new Error('AI_DEVS_API_KEY is not set');
    }

    if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is not set');
    }

    const tokenizer = new OpenAITokenizer(process.env.OPENAI_API_KEY);
    const llmService = new OpenAITextProcessingService(process.env.OPENAI_API_KEY);
    const centralaAPI = new CentralaApi(process.env.AI_DEVS_API_KEY);
    
    try {
        let processedReports: TokenizedRecord[] = [];
        let processedFacts: TokenizedRecord[] = [];

        if (firstRun) {
            processedReports = await processFiles(tokenizedReportsPaths, 'reportsDir', tokenizer);
            processedFacts = await processFiles(tokenizedFactsPaths, 'factsDir', tokenizer);
        } else {
            processedReports = tokenizedReportsPaths.map(reportPath => {
                const reportContent = FileHandler.read(reportPath);
                return JSON.parse(reportContent);
            });
            processedFacts = tokenizedFactsPaths.map(factPath => {
                const factContent = FileHandler.read(factPath);
                return JSON.parse(factContent);
            });
        }

        // Process all reports with facts and wait for all to complete
        const processedResults = await Promise.all(
            processedReports.map(report => processReportWithFacts(report, processedFacts, llmService))
        );

        // Create the answer object in the required format
        const answer: CentralaAnswer = processedResults.reduce((acc, report) => {
            const fileName = path.basename(report.fileName);
            acc[fileName] = report.relatedFacts || '';
            return acc;
        }, {} as CentralaAnswer);

        console.log('Final answer:', JSON.stringify(answer, null, 2));

        // Send to CentralaAPI
        const response = await centralaAPI.sendAnswer('dokumenty', JSON.stringify(answer, null, 2));
        console.log('Centrala response:', response);
        
    } catch (error) {
        console.error('Error during processing:', error);
    }
}

main();
