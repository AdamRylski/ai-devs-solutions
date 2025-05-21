import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import { OpenAIPictureAnalysisService } from '../../common/src/openai/OpenAIPictureAnalysisService.js';


// Initialize dotenv
config();

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directory containing your images
const dataDir = path.join(__dirname, '..', 'src/data');

// Interface for our image data
interface ImageData {
    filename: string;
    base64: string;
}

function loadImages(): ImageData[] {
    // Read all .png files from the data directory
    const files = fs.readdirSync(dataDir).filter(file => 
        file.toLowerCase().endsWith('.png')
    );

    // Convert each image to base64
    return files.map((file) => {
        const filePath = path.join(dataDir, file);
        const fileBuffer = fs.readFileSync(filePath);
        return {
            filename: file,
            base64: fileBuffer.toString('base64'),
        };
    });
}

const SYSTEM_PROMPT = `
Dopasuj poniższe fragmenty mapy do miasta w Polsce.
Wypisz elementy charakterystyczne dla każdego obrazu.
Jeden z obrazów może nie być związany z innym miastem, niż pozostałe.
W mieście znajdują się spichlerze i twierdze.
Zwróć uwagę na nazwy firm i innych miejsc szczególnych, które znajdują się na mapie.
Pomyśl przed udzieleniem odpowiedzi.
Odpowiedź zwięźle
Nie chodzi o Toruń ani Kraków.
Przeszukaj mapy, np google, by dopasować obrazy do miasta.
`;


async function main() {
    try {
        const images = loadImages();
        console.log(`Loaded ${images.length} images:`);
        images.forEach(img => {
            console.log(`- ${img.filename} (${img.base64.substring(0, 50)}...)`);
        });
        const visionService = new OpenAIPictureAnalysisService();
        // Debug: print env variable
        console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY);
        const allBase64s = images.map(img => img.base64);
        const result = await visionService.analyzeImage(allBase64s, SYSTEM_PROMPT, {
            model: "gpt-4o"
        });
        const text = result.choices?.[0]?.message?.content || "No text found";
        console.log(`Result for all images: ${text}`);
    } catch (error) {
        console.error('Error:', error instanceof Error ? error.message : String(error));
    }
}

main().catch(console.error);
