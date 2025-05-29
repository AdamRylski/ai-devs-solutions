import { QdrantClient } from '@qdrant/js-client-rest';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as glob from 'glob';
import { OpenAIEmbedder } from '../../common/src/openai/OpenAIEmbedder.js';
import { config } from 'dotenv';

const COLLECTION_NAME = 'factory_reports';
const REPORTS_DIR = '/home/adam/ai_devs/ai-devs-solutions/solutions/data/pliki_z_fabryki/do-not-share';

const globalEnvPath = path.resolve(process.env.HOME || process.env.USERPROFILE || '', 'ai_devs/ai-devs-solutions/.env');
config({ path: globalEnvPath });

interface ReportPayload {
  date: string;
  filename: string;
  content: string;
}

async function extractDateFromFilename(filename: string): Promise<string> {
  const match = filename.match(/(\d{4})_(\d{2})_(\d{2})/);
  if (!match) {
    throw new Error(`Invalid filename format: ${filename}`);
  }
  const [_, year, month, day] = match;
  return `${year}-${month}-${day}`;
}

async function searchReports(question: string, embedder: OpenAIEmbedder): Promise<void> {
  try {
    const client = new QdrantClient({ url: 'http://localhost:6333' });
    
    // Generate embedding for the question
    console.log('Generating embedding for question:', question);
    const questionEmbedding = await embedder.generateEmbedding(question);
    // Search for the most similar report
    const searchResults = await client.search(COLLECTION_NAME, {
      vector: questionEmbedding,
      limit: 1,
      with_payload: true
    });

    if (searchResults.length > 0) {
      const bestMatch = searchResults[0];
      if (bestMatch.payload) {
        console.log('Found matching report from date:', bestMatch.payload.date);
        console.log('Score:', bestMatch.score);
        console.log('Content:', bestMatch.payload.content);
      }
    } else {
      console.log('No matching reports found');
    }

  } catch (error) {
    console.error('Search error:', error);
  }
}

async function indexReports(embedder: OpenAIEmbedder) {
  try {
    // Initialize Qdrant client
    const client = new QdrantClient({ url: 'http://localhost:6333' });

    // Check if collection exists
    const collections = await client.getCollections();
    const collectionExists = collections.collections.some(
      (collection) => collection.name === COLLECTION_NAME
    );

    // Create collection if it doesn't exist
    if (!collectionExists) {
      await client.createCollection(COLLECTION_NAME, {
        vectors: {
          size: 3072,
          distance: 'Cosine',
        },
      });
      console.log(`Collection ${COLLECTION_NAME} created successfully`);
    }

    // Get all report files
    const files = glob.sync('*.txt', { cwd: REPORTS_DIR });

    // Process each report
    for (const [index, file] of files.entries()) {
      const filePath = path.join(REPORTS_DIR, file);
      const content = await fs.readFile(filePath, 'utf-8');
      const date = await extractDateFromFilename(file);
      
      // Generate embedding
      const embedding = await embedder.generateEmbedding(content);

      // Store in Qdrant
      await client.upsert(COLLECTION_NAME, {
        points: [
          {
            id: index,
            vector: embedding,
            payload: {
              date,
              filename: file,
              content
            }
          }
        ]
      });

      console.log(`Indexed report: ${file}`);
    }

    console.log('All reports have been successfully indexed');

  } catch (error) {
    console.error('Error:', error);
  }
}

async function main() {

  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set');
  }

  if (!process.env.AI_DEVS_API_KEY) {
    throw new Error('AI_DEVS_API_KEY is not set');
  }

  try {

    const embedder = new OpenAIEmbedder(process.env.OPENAI_API_KEY!);

    const firstRun = true;

    if (firstRun) {
      await indexReports(embedder);
    }

    const question = "W raporcie, z którego dnia znajduje się wzmianka o kradzieży prototypu broni?";
    await searchReports(question, embedder);

  } catch (error) {
    console.error('Error in main:', error);
    process.exit(1);
  }
}

main();