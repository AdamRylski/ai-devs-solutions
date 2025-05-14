# S01E02 Solution - Inprompt

This is the solution for lesson 2 of the AI Devs course. The task involves processing input data with context and answering questions based on that context.

## Task Description

The solution:
1. Receives input data containing information and questions
2. Filters and organizes the information based on context
3. Answers questions using the filtered information
4. Sends the answers to the AI Devs API

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
- `dist/` - Compiled JavaScript output (generated after build)
- `package.json` - Project configuration and dependencies
- `tsconfig.json` - TypeScript configuration

## Implementation Details

The solution:
1. Uses the common package for API integration
2. Implements context-based filtering
3. Processes questions using filtered information
4. Handles API communication and error cases

## Data Processing

The solution processes data in the following way:
1. Receives input data with information and questions
2. Identifies the context from the questions
3. Filters information relevant to the context
4. Uses filtered information to answer questions
5. Sends answers to the API

For more details about the task, see the course materials in `materials/s01e02/`. 