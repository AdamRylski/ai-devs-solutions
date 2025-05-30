import * as path from 'path';
import { config } from 'dotenv';
import axios from 'axios';
import { OllamaTextProcessingService } from '../../common/src/ollama/OllamaTextProcessingService.js';
import { ChatCompletionMessageParam } from 'openai/resources.js';
import { CentralaApi } from '../../common/src/centrala/CentralaApi.js';
import { json } from 'stream/consumers';
import { OpenAITextProcessingService } from '../../common/src/openai/OpenAITextProcessingService.js';
import { LlmTextProcessingService } from '../../common/src/types.js';

  const peopleAPI = "https://c3ntrala.ag3nts.org/people"
  const placesAPI = "https://c3ntrala.ag3nts.org/places"

const promptMianownik = `
Podaj mianownik słowa bez polskich znaków.
Jeśli to imie i nazwisko, odpowiedz tylko imieniem w mianowniku.
Jeśli to nazwa miasta, odpowiedz tylko nazwą miasta w mianowniku.
Odpowiedz tylko słowem w mianowniku, niczym więcej. 
Żadnych dodatkowych znaków.
`;

const promptZadanie = `
Wyodrębnij wszystkie imiona i nazwy miast z tekstu. 
Odpowiedź zwróć w postaci JSON dwa sety unikalnych imion i miast:
 * names - zawiera wszystkie imiona w tekście (bez nazwisk)
 * places - zawiera wszystkie nazwy miast w tekście
Imiona i nazwiska powinny być w mianowniku.
Jeśli imie lub nazwa miasta zawiera polskie znaki, zamień je na odpowiednie litery bez polskich znaków.
Wygeneruj sam JSON, nic więcej.
`;

interface PeopleAndPlaces {
  names: string[];
  places: string[];
}

async function normalizeText(text: string, ollama: LlmTextProcessingService): Promise<string> {
  const response = await ollama.completion([
    {
      role: "system", 
      content: promptMianownik
    },
    {
      role: "user", 
      content: text as string
    }
  ]);

  console.log(`Normalized text: ${response}`);
  return response;
}

const globalEnvPath = path.resolve(process.env.HOME || process.env.USERPROFILE || '', 'ai_devs/ai-devs-solutions/.env');
config({ path: globalEnvPath });


async function getPeopleAndPlaces(textUrl: string, ollama: LlmTextProcessingService): Promise<PeopleAndPlaces> {
  const text = (await axios.get(textUrl)).data;
  const peopleAndPlaces = await ollama.completion([
    {
      role: "system", 
      content: promptZadanie
    },
    {
      role: "user", 
      content: text as string
    }
  ]);
  peopleAndPlaces.replace("json", '')
  return JSON.parse(peopleAndPlaces) as PeopleAndPlaces;
}

async function queryApi(url: string, param: string, ollama: LlmTextProcessingService): Promise<Array<string>> {
  const response = await axios.post(url, {
    apikey: process.env.AI_DEVS_API_KEY,
    query: param
  });

  if (response.status !== 200) {
    throw new Error(`Api error: ${response.status} ${response.statusText}`);
  }

  interface ApiResponse {
    message: string;
    param: string;
  }

  console.log(`Response: ${(response.data as ApiResponse).message}`);
  return (response.data as ApiResponse).message.split(' ');
}

async function findBarbara(peopleAndPlaces: PeopleAndPlaces, ollama: LlmTextProcessingService): Promise<string> {
  const peopleQueue = new Set(peopleAndPlaces.names);
  const placesQueue = new Set(peopleAndPlaces.places);
  const visitedPeople = new Set<string>();
  const visitedPlaces = new Set<string>();
  
  let barbaraLocation = "";

  while (peopleQueue.size > 0 || placesQueue.size > 0) {
    if (barbaraLocation !== "") {
      break;
    }

    // Process people
    for (const person of Array.from(peopleQueue)) {
      peopleQueue.delete(person);
      if (!visitedPeople.has(person)) {
        visitedPeople.add(person);

        console.log(`Checking person: ${person}`);
        const response = await queryApi(peopleAPI, person, ollama);
        response.forEach(place => {
          if (!visitedPlaces.has(place)) {
            placesQueue.add(place);
          }
        });
      } else {
        console.log(`Already checked person: ${person}`);
      }

    }

    for (const place of Array.from(placesQueue)) {
      placesQueue.delete(place);
      if (!visitedPlaces.has(place)) {
        visitedPlaces.add(place);

        console.log(`Checking place: ${place}`);
        const response = await queryApi(placesAPI, place, ollama);
        response.forEach(person => {
          if (!visitedPeople.has(person)) {
            visitedPeople.add(person);
          }
          if (person === "Barbara") {
            barbaraLocation = place;
          }
        });
      } else {
        console.log(`Already checked place: ${place}`);
      }
    }
  }

  return barbaraLocation;
}

async function main() {

  const textUrl = "https://c3ntrala.ag3nts.org/dane/barbara.txt"

  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set');
  }

  if (!process.env.AI_DEVS_API_KEY) {
    throw new Error('AI_DEVS_API_KEY is not set');
  }
  const ollama = new OllamaTextProcessingService();
  const gpt = new OpenAITextProcessingService(process.env.OPENAI_API_KEY);
  const centrala = new CentralaApi(process.env.AI_DEVS_API_KEY);
  const peopleAndPlaces = await getPeopleAndPlaces(textUrl, gpt);

  peopleAndPlaces.names = peopleAndPlaces.names.filter(name => name !== "Barbara");
  console.log(peopleAndPlaces);

  // const text = await queryApi<PlacesApiResponse>(placesAPI, "Warszawa");
  // console.log(text);

  const barbaraLocation = await findBarbara(peopleAndPlaces, ollama);
  
  if (barbaraLocation) {
    console.log(`Found Barbara in: ${barbaraLocation}`);
  } else {
    console.log('Could not find Barbara');
  }

  const response = await centrala.sendAnswer("loop", barbaraLocation || "");
  console.log(response);
}

main();