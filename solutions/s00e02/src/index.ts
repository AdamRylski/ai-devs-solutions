import { sendAnswer, downloadData } from '../../common/src/poligon-api-integration.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const solutionDir = path.resolve(__dirname, '..');
const rootDir = path.resolve(solutionDir, '../..');

// Load environment variables from root directory first
const rootEnvPath = path.join(rootDir, '.env');
console.log('Loading root .env from:', rootEnvPath);
dotenv.config({ path: rootEnvPath });

// Then load solution-specific env (if exists)
const solutionEnvPath = path.join(solutionDir, '.env');
console.log('Loading solution .env from:', solutionEnvPath);
dotenv.config({ path: solutionEnvPath });

// Log loaded environment variables (without sensitive data)
console.log('Environment variables loaded:', {
    POLIGON_URL: process.env.POLIGON_URL ? 'set' : 'not set',
    TASK: process.env.TASK ? 'set' : 'not set',
    POLIGON_API_KEY: process.env.POLIGON_API_KEY ? 'set' : 'not set',
    DATA_ENDPOINT: process.env.DATA_ENDPOINT ? 'set' : 'not set'
});

async function main() {
    try {
        const poligonUrl = process.env.POLIGON_URL;
        const task = process.env.TASK;
        const apikey = process.env.POLIGON_API_KEY;
        const dataEndpoint = process.env.DATA_ENDPOINT;

        if (!poligonUrl || !task || !apikey || !dataEndpoint) {
            throw new Error('POLIGON_URL, TASK, POLIGON_API_KEY and DATA_ENDPOINT must be set in .env files');
        }

        console.log('Downloading data from:', dataEndpoint);
        const data = await downloadData(dataEndpoint);
        const lines = data.split('\n').filter(line => line.trim());
        console.log('Downloaded data:', lines);

        console.log('Sending answer...');
        const result = await sendAnswer(lines, { poligonUrl, task, apikey });
        console.log('Server response:', result);
    } catch (error) {
        console.error('Application error:', error);
        process.exit(1);
    }
}

// Run the application
main(); 