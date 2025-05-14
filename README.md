# AI Devs Solutions

This repository contains my solutions for the AI Devs course tasks. Each solution is a separate application that can be run independently.

## Project Structure

```
.
├── solutions/           # Directory containing all task solutions
│   ├── s01e01/        # Hello AI - Basic API integration
│   ├── s01e02/        # Inprompt - Task with context
│   ├── s01e03/        # JSON Processing - Math and AI questions
│   └── ...
├── common/             # Shared utilities and OpenAI integration
├── materials/          # Course materials and examples
├── package.json        # Root package.json with dev dependencies
└── tsconfig.json      # Base TypeScript configuration
```

## Current Solutions

### S01E01 - Hello AI
Basic integration with the AI Devs API, demonstrating how to:
- Authenticate with the API
- Get task details
- Send answers
- Handle API responses

### S01E02 - Inprompt
Task involving context-based question answering:
- Processing input data with context
- Filtering and organizing information
- Answering questions based on provided context

### S01E03 - JSON Processing
Advanced task combining mathematical processing and AI:
- Processing JSON data with mathematical questions
- Verifying and correcting calculations
- Using OpenAI for additional questions
- Sending processed data to the API

## Getting Started

1. Install root dependencies:
```bash
npm install
```

2. Set up environment variables in `.env` file:
```bash
AI_DEVS_API_KEY=your-api-key
OPENAI_API_KEY=your-openai-key
```

3. Navigate to a specific solution:
```bash
cd solutions/sXXeXX
```

4. Install solution-specific dependencies:
```bash
npm install
```

5. Run the solution:
```bash
npm start
```

## Development

- Each solution is independent and can be run separately
- Solutions can be converted to libraries later by publishing them
- Use `npm run dev` in solution directories for development with auto-reload
- The root `tsconfig.json` provides base configuration that solutions extend
- Common utilities and OpenAI integration are available in the `common` directory

## Notes

- Keep solution-specific dependencies in each solution's `package.json`
- Use the root `package.json` only for development tools
- Document each solution in its own README.md
- The `common` directory contains shared utilities and OpenAI integration
- All solutions use TypeScript and follow a consistent project structure
- Environment variables are managed through a global `.env` file
