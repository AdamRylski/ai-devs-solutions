import * as fs from 'fs';
import { fileURLToPath } from 'url';
import * as path from 'path';
import { config } from 'dotenv';
import { CentralaApi } from '../../common/src/centrala/CentralaApi.js';
import { WebScraper } from '../../common/src/scrapper/WebScraper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const globalEnvPath = path.resolve(process.env.HOME || process.env.USERPROFILE || '', 'ai_devs/ai-devs-solutions/.env');
config({ path: globalEnvPath });


async function main() {
    if (!process.env.AI_DEVS_API_KEY) {
        throw new Error('AI_DEVS_API_KEY is not set');
    }

    if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is not set');
    }

    const centralaApi = new CentralaApi(process.env.AI_DEVS_API_KEY);
    const input = await centralaApi.downloadTaskInputWithApiKey("arxiv.txt")
    console.log(input)

    const scraper = new WebScraper(process.env.OPENAI_API_KEY);
    const outputPath = "/home/adam/ai_devs/ai-devs-solutions/solutions/s02e05/data/arxiv-audio-draft.json";
    
    const output = getScrappedData(outputPath, scraper);
    // console.log(output)
    
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
