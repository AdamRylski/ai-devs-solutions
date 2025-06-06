import * as path from 'path';
import express, { Request, Response } from 'express';
import { config } from 'dotenv';
import { OpenAITextProcessingService } from '../../common/src/openai/OpenAITextProcessingService.js';
import { env } from 'process';

const app = express();
const PORT = 54607;

// Middleware to parse JSON bodies
app.use(express.json());

interface DroneInstruction {
  instruction: string;
}

const SYSTEM_PROMPT: string = `
Jesteś asystentem, który analizuje opisy ruchu użytkownika po mapie 4x4. Mapa ma współrzędne od (0,0) w lewym górnym rogu do (3,3) w prawym dolnym.
Użytkownik zawsze zaczyna na polu (0,0). Jego opis to naturalny język, np. „jedno pole w prawo, potem na dół”. Na podstawie tego opisu:
Zinterpretuj sekwencję ruchów użytkownika.
Ustal końcową pozycję na mapie.
Zwróć krótki opis pola docelowego zgodnie z poniższą mapą zawartości.
Nie przekraczaj granic mapy. Jeśli użytkownik przekroczył granice mapy zwróć "start". 
Zwróć tylko nazwę pola docelowego (bez współrzędnych, bez komentarzy).
Mapa zawartości pól (wiersz, kolumna):
(0,0): znacznik start
(0,1): trawa
(0,2): drzewo
(0,3): dom
(1,0): trawa
(1,1): wiatrak
(1,2): trawa
(1,3): trawa
(2,0): trawa
(2,1): trawa
(2,2): skały
(2,3): dwa drzewa
(3,0): góry
(3,1): góry
(3,2): samochód
(3,3): jaskinia
Oczekiwany format odpowiedzi: tylko opis pola, np. wiatrak
`

const globalEnvPath = path.resolve(process.env.HOME || process.env.USERPROFILE || '', 'ai_devs/ai-devs-solutions/.env');
config({ path: globalEnvPath });

// POST endpoint for drone instructions
app.post('/drone', async (req: Request<{}, {}, DroneInstruction>, res: Response) => {
  try {
    const instruction = req.body;
    var fieldDescription: string = "";

    if (instruction.instruction == null || instruction.instruction == "") {
      fieldDescription = "punkt startowy";
    }

    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    // Log the request to console
    console.log(`${new Date().toISOString()} Received drone instruction: ${instruction.instruction}`);
    const openai = new OpenAITextProcessingService(process.env.OPENAI_API_KEY);

    const response = await openai.completion([
      {
        role: "system",
        content: SYSTEM_PROMPT
      },
      {
        role: "user",
        content: instruction.instruction
      }
    ])
    console.log(response)
    fieldDescription = response;

    // Send response back
    res.status(200).json({
      description: fieldDescription,
    });

  } catch (error) {
    console.error('Error processing drone instruction:', (error as Error).message);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Drone endpoint available at http://localhost:${PORT}/drone`);
});

export default app;