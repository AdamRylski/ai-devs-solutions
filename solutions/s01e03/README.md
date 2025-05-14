# S01E02 Solution

This is the solution for lesson 3 of the AI Devs course.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the project root with your API token:
```bash
cp ../../.env-example .env
# Then edit .env and add your API token
```

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