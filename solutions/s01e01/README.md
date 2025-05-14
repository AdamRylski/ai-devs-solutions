# S01E01 Solution - Hello AI

This is the solution for lesson 1 of the AI Devs course. The task involves basic integration with the AI Devs API.

## Task Description

The solution demonstrates:
1. Authentication with the AI Devs API
2. Getting task details
3. Sending answers
4. Handling API responses

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
2. Implements basic error handling
3. Follows TypeScript best practices
4. Uses environment variables for configuration

## API Integration

The solution interacts with the AI Devs API endpoints:
- Authentication
- Task retrieval
- Answer submission

For more details about the API, see the course materials in `materials/s01e01/`. 