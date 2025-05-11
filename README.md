# AI Devs Solutions

This repository contains my solutions for the AI Devs course tasks. Each solution is a separate application that can be run independently.

## Project Structure

```
.
├── solutions/           # Directory containing all task solutions
│   ├── task-01/        # Example solution structure
│   │   ├── src/        # Source code
│   │   ├── package.json # Solution-specific dependencies
│   │   ├── tsconfig.json # Extends root config
│   │   └── README.md   # Solution documentation
│   └── ...
├── common/             # Shared utilities (if needed)
├── package.json        # Root package.json with dev dependencies
└── tsconfig.json      # Base TypeScript configuration
```

## Getting Started

1. Install root dependencies:
```bash
npm install
```

2. Navigate to a specific solution:
```bash
cd solutions/task-XX
```

3. Install solution-specific dependencies:
```bash
npm install
```

4. Run the solution:
```bash
npm start
```

## Development

- Each solution is independent and can be run separately
- Solutions can be converted to libraries later by publishing them
- Use `npm run dev` in solution directories for development with auto-reload
- The root `tsconfig.json` provides base configuration that solutions extend

## Notes

- Keep solution-specific dependencies in each solution's `package.json`
- Use the root `package.json` only for development tools
- Document each solution in its own README.md
- Consider using the `common` directory for shared utilities if needed
