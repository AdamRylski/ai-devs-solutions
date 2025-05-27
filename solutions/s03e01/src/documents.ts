import * as fs from 'fs';
import { fileURLToPath } from 'url';
import * as path from 'path';
import { config } from 'dotenv';
import { FileHandler } from '../../common/src/files/FileHandler.js';
import { OpenAITokenizer } from '../../common/src/openai/OpenAITokenizer.js';

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



async function processFiles(inputFiles: string[], outputDir: string, tokenizer: OpenAITokenizer): Promise<void> {
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

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
        } catch (error) {
            console.error(`Error processing file ${filePath}:`, error);
        }
    }
}

async function main() {

    const reportsDir = path.join(__dirname, '../data/reports');
    const factsDir = path.join(__dirname, '../data/facts');

    if (!process.env.AI_DEVS_API_KEY) {
        throw new Error('AI_DEVS_API_KEY is not set');
    }

    if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is not set');
    }

    const tokenizer = new OpenAITokenizer(process.env.OPENAI_API_KEY);
    
    try {
        // await processFiles(reports, 'reportsDir', tokenizer);
        // await processFiles(facts, 'factsDir', tokenizer);

        

        console.log('Processing completed successfully!');
    } catch (error) {
        console.error('Error during processing:', error);
    }

    
}

main();
