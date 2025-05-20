# S02E01 Solution - Personal Data Processing

This is the solution for lesson 1 of Season 2 of the AI Devs course. The task involves processing and analyzing personal data from a text file.

## Task Description

The solution:
1. Reads a text file containing personal data in Polish
2. Processes and analyzes the personal information
3. Sends the processed data to the AI Devs API

## Setup

1. Install dependencies:
```bash
npm install
```

2. The solution uses the global `.env` file from the root directory (`~/ai_devs/ai-devs-solutions/.env`) which should contain:
   - `AI_DEVS_API_KEY` - Your AI Devs API key

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
  - `types.ts` - TypeScript type definitions
  - `data/` - Data directory for input files
- `dist/` - Compiled JavaScript output (generated after build)
- `package.json` - Project configuration and dependencies
- `tsconfig.json` - TypeScript configuration
- `downloaded_file.txt` - Input file containing personal data

## Data Processing

The solution processes the input text file in the following way:
1. Reads and parses the text file containing personal data
2. Extracts relevant information from the text
3. Processes the data according to the task requirements
4. Sends the processed data to the AI Devs API endpoint

## Input Data Format

The input file contains personal data in Polish, for example:
```
Dane personalne podejrzanego: Wojciech Górski. Przebywa w Lublinie, ul. Akacjowa 7. Wiek: 27 lat.
```

## Output Format

The processed data will be sent to the API in a format specified by the AI Devs task requirements. The exact format will be determined based on the task specifications. 