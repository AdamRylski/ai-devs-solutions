class TaskResponse {
    task: string;
    apikey: string;
    answer: string;

    constructor(task: string, apikey: string, answer: string) {
        this.task = task;
        this.apikey = apikey;
        this.answer = answer;
    }
}

export class CentralaApi {
    private readonly apiKey: string;
    private readonly baseUrl: string;

    constructor(apiKey: string) {
        if (!apiKey) {
            throw new Error('API key is required');
        }
        this.apiKey = apiKey;
        this.baseUrl = "https://centrala.ag3nts.org/";
    }

    async downloadTaskInputWithoutApiKey(url: string): Promise<string> {
        try {
            const response = await this.downloadTaskInput(this.baseUrl + "/data/" + url)
    
            return response;
        } catch (error) {
            console.error('Error making GET request:', error);
            throw error;
        }
    }

    async downloadTaskInputWithApiKey(url: string): Promise<string> {
        try {
            const response = await this.downloadTaskInput(this.baseUrl + "/data/" + this.apiKey + "/" + url)
    
            return response;
        } catch (error) {
            console.error('Error making GET request:', error);
            throw error;
        }
    }

    async downloadTaskInput(url: string): Promise<string> {
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'text/html'
                }
            });
    
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
    
            return await response.text();
        } catch (error) {
            console.error('Error making GET request:', error);
            throw error;
        }
    }

    async sendAnswer(task: string, answer: string): Promise<string> {
        try {
            // Try to parse the answer if it's a JSON string
            let parsedAnswer = answer;
            try {
                parsedAnswer = JSON.parse(answer);
            } catch {
                // If parsing fails, use the original string
                parsedAnswer = answer;
            }

            const reportMsg = new TaskResponse(
                task,
                this.apiKey,
                parsedAnswer);

            console.log("Sending msg:" + JSON.stringify(reportMsg));
    
            const response = await fetch(this.baseUrl + "/report", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reportMsg),
            });
    
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
    
            const responseText = await response.text();
            console.log(responseText);
            return responseText;

        } catch (error) {
            console.error('Error sending answer:', error);
            throw error;
        }
    }
} 