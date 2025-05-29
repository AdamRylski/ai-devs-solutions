import * as path from 'path';
import { config } from 'dotenv';
import axios from 'axios';
import { OpenAITextProcessingService } from '../../common/src/openai/OpenAITextProcessingService.js';
import { ChatCompletionMessageParam } from 'openai/resources.js';
import { CentralaApi } from '../../common/src/centrala/CentralaApi.js';

const DATABASE_API_URL = 'https://c3ntrala.ag3nts.org/apidb';

interface DatabaseRequest {
  task: 'database';
  apikey: string;
  query: string;
}

interface DatabaseResponse {
  reply: Array<Record<string, string>>;
  error: string;
}

const prompt = `
You are a database expert. 
You are given a list of tables and their CREATE TABLE statements. 
Your task is to write a query to get the IDs of all active datacenters in which manager is currently inactive.
Return the query in a plain string format, no extra text, no new line characters, no sql keywords.
`;

/**
 * Executes a SQL query against the remote database
 * @param query SQL query to execute
 * @returns Promise with the query results
 * @throws Error if the API request fails or if API key is not set
 */
async function executeDatabaseQuery(query: string): Promise<DatabaseResponse> {
  if (!process.env.AI_DEVS_API_KEY) {
    throw new Error('AI_DEVS_API_KEY is not set');
  }

  const request: DatabaseRequest = {
    task: 'database',
    apikey: process.env.AI_DEVS_API_KEY,
    query,
  };

  try {
    const response = await axios.post<DatabaseResponse>(DATABASE_API_URL, request);
    return response.data;
  } catch (error) {
    const axiosError = error as Error;
    console.error('Error: ', axiosError);
    throw new Error(`Database query failed: ${axiosError.message}`);
  }
}

/**
 * Retrieves all tables from the database
 * @returns Promise with an array of table names
 */
async function getTableNames(): Promise<string[]> {
  const response = await executeDatabaseQuery('SHOW TABLES');
  return response.reply.map(row => Object.values(row)[0]);
}

/**
 * Gets the CREATE TABLE statement for a given table
 * @param tableName The name of the table
 * @returns Promise with the CREATE TABLE statement
 */
async function getTableSchema(tableName: string): Promise<string> {
  const response = await executeDatabaseQuery(`SHOW CREATE TABLE ${tableName}`);
  return Object.values(response.reply[0])[1];
}


const globalEnvPath = path.resolve(process.env.HOME || process.env.USERPROFILE || '', 'ai_devs/ai-devs-solutions/.env');
config({ path: globalEnvPath });

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set');
  }

  if (!process.env.AI_DEVS_API_KEY) {
    throw new Error('AI_DEVS_API_KEY is not set');
  }

  let tablesSchema = [];

  try {
    const tableNames = await getTableNames();
    console.log('Available tables:', tableNames);

    for (const tableName of tableNames) {
      console.log(`\nSchema for table ${tableName}:`);
      const schema = await getTableSchema(tableName);
      tablesSchema.push(schema);
      console.log(schema);
    }
  } catch (error) {
    console.error('Error:', error);
  }

  const gpt = new OpenAITextProcessingService(process.env.OPENAI_API_KEY);
  const tablesSchemaString = tablesSchema.join('\n');
      // 3. Send to OpenAI for processing
  const messages: ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: prompt
    },
    {
      role: "user",
      content: tablesSchemaString
    }
  ];

  // const tablesSchemaResponse = await gpt.completion(messages);
  // console.log("Final query:", tablesSchemaResponse.choices[0].message.content);

  const finalResult = await executeDatabaseQuery("select dc_id from datacenters d join users u on d.manager = u.id where d.is_active = 1 and u.is_active = 0");
  console.log("Final result: ", finalResult);
  const dcIds: number[] = finalResult.reply.map(row => parseInt(row.dc_id, 10));
  console.log("Extracted datacenter IDs:", dcIds);
  


  const centrala = new CentralaApi(process.env.AI_DEVS_API_KEY);
  const response = await centrala.sendAnswer("database", JSON.stringify(dcIds));
  console.log("Response: ", response);


  // //extra query
  // const extraQuery = "SELECT * FROM correct_order";
  // const extraQueryResponse = await executeDatabaseQuery(extraQuery);
  
  // console.log("Extra query response: ", extraQueryResponse);

}

main();