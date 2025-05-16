# S01E03 Solution - JSON Processing

This is the solution for lesson 3 of the AI Devs course. The task involves processing a JSON file containing mathematical questions and additional test questions, then sending the processed data to an API.

## Task Description

The solution:
1. Reads a JSON file containing mathematical questions and answers
2. Verifies and corrects mathematical calculations
3. Processes additional test questions using OpenAI
4. Sends the processed data to the AI Devs API

## Setup

1. Install dependencies:
```bash
npm install
```

2. The solution uses the global `.env` file from the root directory (`~/ai_devs/ai-devs-solutions/.env`) which should contain:
   - `AI_DEVS_API_KEY` - Your AI Devs API key
   - `OPENAI_API_KEY` - Your OpenAI API key

## Development

- Run in development mode:
```bash
npm run dev
```

- Build the project:
```bash
npm run build
```

- Run the built version:
```bash
npm start
```

## Project Structure

- `src/` - Source code directory
  - `index.ts` - Main application entry point
  - `data/` - Input data directory
    - `s01e03.json` - Input JSON file with questions and answers
- `dist/` - Compiled JavaScript output (generated after build)
- `package.json` - Project configuration and dependencies
- `tsconfig.json` - TypeScript configuration

## Data Processing

The solution processes the input JSON file in the following way:
1. Reads and parses the JSON file
2. For each mathematical question:
   - Calculates the correct answer
   - Updates incorrect answers and logs warnings
3. For questions with additional tests:
   - Sends the question to OpenAI
   - Updates the answer with AI's response
4. Sends the processed data to the AI Devs API endpoint

## Output Format

The processed data is sent to the API in the following format:
```json
{
  "task": "JSON",
  "apikey": "your-api-key",
  "answer": {
    "apikey": "your-api-key",
    "description": "This is simple calibration data used for testing purposes. Do not use it in production environment!",
    "copyright": "Copyright (C) 2238 by BanAN Technologies Inc.",
    "test-data": [
      {
        "question": "45 + 86",
        "answer": 131
      },
      {
        "question": "97 + 34",
        "answer": 131,
        "test": {
          "q": "What is the capital city of Poland?",
          "a": "Warsaw"
        }
      }
    ]
  }
}
``` 