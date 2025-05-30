import axios from 'axios';

interface DatabaseRequest {
    task: 'database';
    apikey: string;
    query: string;
}
  
interface DatabaseResponse<T = Record<string, string>> {
    reply: Array<T>;
    error: string;
}

export class SqlApiConnector {
    private readonly apiKey: string;
    private readonly databaseApiUrl: string;

    constructor(apiKey: string, databaseApiUrl: string) {
        this.apiKey = apiKey
        this.databaseApiUrl = databaseApiUrl
    }

    async executeDatabaseQuery<T = Record<string, string>>(query: string): Promise<DatabaseResponse<T>> {
        if (!process.env.AI_DEVS_API_KEY) {
          throw new Error('AI_DEVS_API_KEY is not set');
        }
      
        const request: DatabaseRequest = {
          task: 'database',
          apikey: this.apiKey,
          query,
        };
      
        try {
          const response = await axios.post<DatabaseResponse<T>>(this.databaseApiUrl, request);
          return response.data;
        } catch (error) {
          const axiosError = error as Error;
          console.error('Error: ', axiosError);
          throw new Error(`Database query failed: ${axiosError.message}`);
        }
    }
}

