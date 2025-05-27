import path from 'path';
// Get the root directory path
const rootDir = path.resolve(__dirname);

/**
 * Sends answer to the AI Devs API
 * @param answer - Array of strings to send as answer
 * @param config - Configuration object with required environment variables
 * @returns Promise with the server response
 */
export const sendAnswer = async (answer: string[], config: { poligonUrl: string; task: string; apikey: string }): Promise<any> => {
    try {
        const { poligonUrl, task, apikey } = config;

        const data = {
            task,
            apikey,
            answer
        };

        const response = await fetch(poligonUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error sending answer:', error);
        throw error;
    }
};

/**
 * Downloads data from the AI Devs API
 * @param url - URL to download data from
 * @returns Promise with the downloaded text
 */
export const downloadData = async (url: string): Promise<string> => {
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'text/plain'
            }
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.text();
    } catch (error) {
        console.error('Error downloading data:', error);
        throw error;
    }
}; 