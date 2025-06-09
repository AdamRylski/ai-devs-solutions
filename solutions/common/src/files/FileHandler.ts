import * as fs from 'node:fs';
import * as path from 'node:path';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

export interface FileData {
    fileName: string;
    content: string;
  }

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

        /**
     * Reads text content from a file
     * @param filePath - The path to the file
     * @returns The content of the file as a string
     * @throws Error if the file doesn't exist or can't be read
     */
    public static readLines(filePath: string): string[] {
        if (!fs.existsSync(filePath)) {
            throw new Error(`File does not exist at path: ${filePath}`);
        }

        return fs.readFileSync(filePath, 'utf8').split(/\r?\n|\r/);;
    }

    static async readFilesFromFolder(folderPath: string): Promise<FileData[]> {
        try {
          // Read all items in the directory
          const items = await readdir(folderPath, { withFileTypes: true });
          
          // Filter only files (exclude directories)
          const files = items
            .filter(item => item.isFile())
            .map(item => item.name);
          
          // Read content of each file
          const fileDataPromises = files.map(async (fileName): Promise<FileData> => {
            const filePath = join(folderPath, fileName);
            const content = await readFile(filePath, 'utf-8');
            
            return {
              fileName,
              content
            };
          });
          
          // Wait for all files to be read
          const fileDataList = await Promise.all(fileDataPromises);
          
          return fileDataList;
        } catch (error) {
          throw new Error(`Failed to read files from folder: ${error}`);
        }
      }
}
