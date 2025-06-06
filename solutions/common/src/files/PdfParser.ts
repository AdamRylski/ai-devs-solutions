import { readFile } from 'fs/promises';
import PdfParse from 'pdf-parse';
import pdfParse from 'pdf-parse';
import { fromPath } from 'pdf2pic';
import { createWorker } from 'tesseract.js';
import { join } from 'path';
import { tmpdir } from 'os';

/**
 * Class responsible for parsing PDF files and extracting their content
 */
export class PdfParser {
  /**
   * Parses a PDF file and returns its content as text
   * @param filePath - The path to the PDF file
   * @returns Promise containing the parsed text content of the PDF
   * @throws Error if file cannot be read or parsed
   */
  public async parsePdf(filePath: string): Promise<PdfParse.Result> {
    try {
      const dataBuffer: Buffer = await readFile(filePath);
      const pdfData = await pdfParse(dataBuffer);
      return pdfData;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to parse PDF file: ${errorMessage}`);
    }
  }

  /**
 * Converts a specific page of a PDF document to base64 image
 * @param filePath - The path to the PDF file
 * @param pageNumber - The page number to convert (1-based index)
 * @returns Promise containing the base64 encoded image of the specified page
 * @throws Error if file cannot be read or converted
 */
  public async scanPageWithOcr(filePath: string, pageNumber: number): Promise<string[]> {
    try {
      // Convert PDF page to image
      const convert = fromPath(filePath, {
        density: 300,
        saveFilename: 'page',
        savePath: tmpdir(),
        format: 'png',
        width: 2480,
        height: 3508
      });

      // Convert specific page - returns WriteImageResponse object, not array
      const pageToConvertAsImage = pageNumber;
      const imageResponse = await convert(pageToConvertAsImage);

      // Extract the path from the response object and validate it
      const imagePath = imageResponse.path;
      if (!imagePath) {
        throw new Error(`Failed to convert PDF page ${pageNumber} to image - no path returned`);
      }

      // Read the image file and convert to base64
      const imageBuffer = await readFile(imagePath);
      const base64Image = imageBuffer.toString('base64');

      return [base64Image];
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to convert PDF page to base64: ${errorMessage}`);
    }
  }

}
