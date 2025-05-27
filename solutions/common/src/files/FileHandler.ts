import * as fs from 'node:fs';
import * as path from 'node:path';

export class FileHandler {
    /**
     * Writes text to a file. Throws an error if the file already exists.
     * @param filePath - The path to the file
     * @param content - The text content to write
     * @throws Error if the file already exists
     */
    public static write(filePath: string, content: string): void {
        // Ensure the directory exists
        const directory = path.dirname(filePath);
        if (!fs.existsSync(directory)) {
            fs.mkdirSync(directory, { recursive: true });
        }

        // Check if file exists
        if (fs.existsSync(filePath)) {
            throw new Error(`File already exists at path: ${filePath}`);
        }

        // Write the file
        fs.writeFileSync(filePath, content, 'utf8');
    }

    /**
     * Reads text content from a file
     * @param filePath - The path to the file
     * @returns The content of the file as a string
     * @throws Error if the file doesn't exist or can't be read
     */
    public static read(filePath: string): string {
        if (!fs.existsSync(filePath)) {
            throw new Error(`File does not exist at path: ${filePath}`);
        }

        return fs.readFileSync(filePath, 'utf8');
    }
}
