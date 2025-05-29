import * as path from 'path';
import { config } from 'dotenv';
import axios from 'axios';
import { OllamaTextProcessingService } from '../../common/src/ollama/OllamaTextProcessingService.js';
import { ChatCompletionMessageParam } from 'openai/resources.js';
import { CentralaApi } from '../../common/src/centrala/CentralaApi.js';
import { json } from 'stream/consumers';

  const peopleAPI = "https://c3ntrala.ag3nts.org/people"
  const placesAPI = "https://c3ntrala.ag3nts.org/places"

const promptMianownik = `
Podaj mianownik słowa.
Jeśli to imie i nazwisko, odpowiedz tylko imieniem w mianowniku (pomiń wszystkie znaki po spacji).
Jeśli to nazwa miasta, odpowiedz tylko nazwą miasta w mianowniku.
Odpowiedz tylko słowem w mianowniku, niczym więcej. 
Żadnych dodatkowych znaków.
`;

const promptZadanie = `
Wyodrębnij wszystkie imiona i nazwy miast z tekstu. 
Odpowiedź zwróć w postaci JSON zawierający dwie listy:
 * names - zawiera wszystkie imiona w tekście
 * places - zawiera wszystkie nazwy miast w tekście
 Wygeneruj sam JSON, nic więcej.
`;

interface PeopleAndPlaces {
  names: string[];
  places: string[];
}

async function normalizeText(text: string, ollama: OllamaTextProcessingService): Promise<string> {
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


async function getPeopleAndPlaces(textUrl: string, ollama: OllamaTextProcessingService): Promise<PeopleAndPlaces> {
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

async function queryApi(url: string, param: string, ollama: OllamaTextProcessingService): Promise<Array<string>> {

  const normalizedParam = await normalizeText(param, ollama);
  const response = await axios.post(url, {
    apikey: process.env.AI_DEVS_API_KEY,
    query: normalizedParam
  });

  if (response.status !== 200) {
    throw new Error(`Api error: ${response.status} ${response.statusText}`);
  }

  const responseData = response.data as String;
  return responseData.split(' ');
}

async function findBarbara(peopleAndPlaces: PeopleAndPlaces, ollama: OllamaTextProcessingService): Promise<string> {
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
        console.log(`Response: ${response}`);
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

        console.log(`Checking person: ${place}`);
        const response = await queryApi(placesAPI, place, ollama);
        console.log(`Response: ${response}`);
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
  const centrala = new CentralaApi(process.env.AI_DEVS_API_KEY);
  const peopleAndPlaces = await getPeopleAndPlaces(textUrl, ollama);

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