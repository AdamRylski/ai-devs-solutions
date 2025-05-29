import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import type { ChatCompletion } from "openai/resources/chat/completions";
import { TokenizerService } from '../types.js';

export interface TokenizedRecord {
    fileName: string;
    titleInfo?: string; // np. z nazwy pliku
    content: string;
    tokens: string[];
    namedEntities: {
      persons: string[];
      places: string[];
      objects: string[];
      animals: string[];
    };
    relatedFacts: string; // uzupełniane później
  }

const prompt = `
Przeanalizuj poniższy obiekt JSON zawierający nazwę pliku i treść raportu w języku polskim. 
Wygeneruj obiekt JSON zawierający słowa występujące zarówno w nazwie pliku jak i w treści z podziałem na kategorie:
    - persons: imiona i nazwiska osób lub zawodów (np. "kierownik", "mechanik", 'Jan Kowalski'),
    - places: nazwy miejsc (np. miast, budynków, sektorów),
    - objects: przedmioty, technologie, urządzenia (np. "laser", "drukarka"),
    - animals: nazwy zwierząt (np. "pies", "kot") lub rodzajów (np. "zwierzyna leśna", "ryby")
Wszystkie słowa powinny być w mianowniku. Zachowaj format JSON, nie dodawaj wyjaśnień ani komentarzy.
`;

export class OpenAITokenizer implements TokenizerService {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  private extractUniqueTokens(text: string): string[] {
    // Split by whitespace and remove punctuation
    const words = text.toLowerCase()
      .split(/\s+/)
      .map(word => word.replace(/[.,!?;'"()\[\]{}]/g, ''))
      .filter(word => word.length > 0);
    
    // Convert to Set to get unique words and back to array
    return [...new Set(words)];
  }

  async tokenize(inputText: string, filename: string, model: string = "o4-mini"): Promise<TokenizedRecord> {
    const tokens = this.extractUniqueTokens(inputText);

    const input = {
      filename,
      content: inputText
    };

    const messages: ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: prompt
      },
      {
        role: 'user',
        content: JSON.stringify(input)
      }
    ];

    try {
      const completion: ChatCompletion = await this.openai.chat.completions.create({
        messages,
        model: model,
      });

      const cleanedContent = completion.choices[0].message.content?.replace(/```json\n|\n```/g, '')!;
      const namedEntities = JSON.parse(cleanedContent);

      return {
        fileName: filename,
        content: inputText,
        tokens,
        namedEntities: {
          persons: namedEntities.persons || [],
          places: namedEntities.places || [],
          objects: namedEntities.objects || [],
          animals: namedEntities.animals || []
        },
        relatedFacts: ''
      };
    } catch (error) {
      console.error('Error calling OpenAI:', error);
      throw error;
    }
  }
} 

