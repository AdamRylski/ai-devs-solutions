import { OpenAIPictureAnalysisService } from '../openai/OpenAIPictureAnalysisService.js';
import { OpenAIAudioService } from '../openai/OpenAIAudioService.js';
import * as cheerio from 'cheerio';
import axios from 'axios';
import * as fs from 'fs/promises';
import * as path from 'path';
import TurndownService from 'turndown';

interface ScrapedContent {
  url: string;
  markdown: string;
  images: Array<{
    url: string;
    description: string;
    caption?: string;
  }>;
  audioTranscriptions: Array<{
    url: string;
    transcription: string;
  }>;
}

export class WebScraper {
  private pictureAnalysisService: OpenAIPictureAnalysisService;
  private audioService: OpenAIAudioService;
  private turndownService: TurndownService;
  private baseUrl: string;

  constructor(openaiApiKey: string) {
    this.pictureAnalysisService = new OpenAIPictureAnalysisService(openaiApiKey);
    this.audioService = new OpenAIAudioService(openaiApiKey);
    this.turndownService = new TurndownService();
    this.baseUrl = '';
  }

  private resolveUrl(relativeUrl: string): string {
    try {
      return new URL(relativeUrl).href;
    } catch {
      // If parsing as a URL fails, it's likely a relative URL
      return new URL(relativeUrl, this.baseUrl).href;
    }
  }

  async scrape(url: string, outputPath: string): Promise<void> {
    try {
      this.baseUrl = url;
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);

      // Initialize the content structure
      const content: ScrapedContent = {
        url,
        markdown: '',
        images: [],
        audioTranscriptions: []
      };

      // Convert HTML to Markdown
      const htmlContent = $('body').html() || '';
      content.markdown = this.turndownService.turndown(htmlContent);

      // Process images
      // const images = $('img').toArray();
      // for (const img of images) {
      //   const imgUrl = $(img).attr('src');
      //   console.log("imgUrl: ", imgUrl)
      //   if (imgUrl) {
      //     try {
      //       const absoluteUrl = this.resolveUrl(imgUrl);
      //       const imageResponse = await axios.get(absoluteUrl, { responseType: 'arraybuffer' });
      //       const base64Image = Buffer.from(imageResponse.data).toString('base64');
            
      //       // Find the associated caption
      //       let caption: string | undefined;
      //       const parentFigure = $(img).closest('figure');
      //       if (parentFigure.length > 0) {
      //         const figcaption = parentFigure.find('figcaption');
      //         if (figcaption.length > 0) {
      //           caption = figcaption.html()?.replace(/<br\s*\/?>/gi, '\n') || undefined;
      //         }
      //       } else {
      //         // Check for adjacent figcaption if img is not in a figure
      //         const nextFigcaption = $(img).next('figcaption');
      //         if (nextFigcaption.length > 0) {
      //           caption = nextFigcaption.html()?.replace(/<br\s*\/?>/gi, '\n') || undefined;
      //         }
      //       }

      //       let description: string;
      //       if (caption == null || caption == undefined || caption == '') {
      //         description = await this.analyzeImage(base64Image);
      //       } else {
      //         description = await this.analyzeImageWithCaption(base64Image, caption);
      //       }

      //       content.images.push({
      //         url: absoluteUrl,
      //         description,
      //         caption: caption ? caption.trim() : undefined
      //       });
      //     } catch (error) {
      //       console.error(`Failed to process image ${imgUrl}:`, error);
      //     }
      //   }
      // }

      // Process audio files
      const audioElements = $('audio source, a[href$=".mp3"], a[href$=".wav"], a[href$=".m4a"]').toArray();
      for (const audio of audioElements) {
        const audioUrl = $(audio).attr('src') || $(audio).attr('href');
        if (audioUrl) {
          try {
            const absoluteUrl = this.resolveUrl(audioUrl);
            const audioResponse = await axios.get(absoluteUrl, { responseType: 'arraybuffer' });
            const audioBuffer = Buffer.from(audioResponse.data);
            
            const fileName = path.basename(audioUrl);
            const transcription = await this.audioService.transcribeAudio(audioBuffer, fileName);
            
            content.audioTranscriptions.push({
              url: audioUrl,
              transcription
            });
          } catch (error) {
            console.error(`Failed to process audio ${audioUrl}:`, error);
          }
        }
      }

      // Save the structured content to JSON file
      await this.saveContent(content, outputPath);
      
    } catch (error) {
      console.error('Scraping failed:', error);
      throw error;
    }
  }

  private async analyzeImageWithCaption(base64Image: string, caption: string): Promise<string> {
    try {
      const response = await this.pictureAnalysisService.analyzeImage(
        [base64Image],
        `Please describe this image in detail. This file had a caption that might help you understand the image: ${caption}`,
        {
          model: 'gpt-4o',
          maxTokens: 300,
          temperature: 0.7
        }
      );
      
      return response.choices[0]?.message?.content || 'No description available';
    } catch (error) {
      console.error('Failed to analyze image:', error);
      return 'Failed to analyze image';
    }
  }

  private async analyzeImage(base64Image: string): Promise<string> {
    try {
      const response = await this.pictureAnalysisService.analyzeImage(
        [base64Image],
        'Please describe this image in detail.',
        {
          model: 'gpt-4o',
          maxTokens: 300,
          temperature: 0.7
        }
      );
      
      return response.choices[0]?.message?.content || 'No description available';
    } catch (error) {
      console.error('Failed to analyze image:', error);
      return 'Failed to analyze image';
    }
  }

  private async saveContent(content: ScrapedContent, outputPath: string): Promise<void> {
    try {
      const jsonContent = JSON.stringify(content, null, 2);
      await fs.writeFile(outputPath, jsonContent, 'utf-8');
    } catch (error) {
      console.error('Failed to save content:', error);
      throw error;
    }
  }
}
