import * as cheerio from 'cheerio';
import { ScrapedContent } from './index.js';
import { NodeHtmlMarkdown } from 'node-html-markdown';
import axios from 'axios';

export class WebScrapperMini {
  private readonly nhm: NodeHtmlMarkdown;

  constructor() {
    this.nhm = new NodeHtmlMarkdown({
      useLinkReferenceDefinitions: true,
      useInlineLinks: true
    });
  }

  private resolveUrl(relativeUrl: string, baseUrl: string): string {
    try {
      return new URL(relativeUrl).href;
    } catch {
      // If parsing as a URL fails, it's likely a relative URL
      return new URL(relativeUrl, baseUrl).href;
    }
  }

  async scrape(url: string): Promise<ScrapedContent> {
    try {
      const response = await axios.get<string>(url);
      const $ = cheerio.load(response.data);

      // Initialize the content structure
      const content: ScrapedContent = {
        url,
        markdown: '',
        images: [],
        audioTranscriptions: []
      };

      const htmlContent = $('body').html() || '';
      content.url = url;
      content.markdown = this.nhm.translate(htmlContent);

      return content;
    } catch (error) {
      console.error('Error scraping webpage: ' + url + ' ' + (error as Error).message);
      throw error;
    }
  }
}