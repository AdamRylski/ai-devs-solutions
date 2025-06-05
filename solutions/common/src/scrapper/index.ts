
export interface ScrapedContent {
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