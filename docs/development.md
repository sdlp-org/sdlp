# Development

This repository uses a unified code quality system across all TypeScript packages with consistent linting, formatting, and testing workflows.

## Prerequisites

- Node.js 18+
- [Just](https://just.systems/) command runner

## Code Quality Commands

The repository provides unified commands to maintain code quality across all packages:

```bash
# Run linting across all packages
just lint

# Format all code with Prettier
just format

# Run all tests
just test

# Run all quality checks (lint + format + test)
just check-all
```

## Package Structure

The repository contains the following TypeScript packages:

- **`specs/`** - Specifications, test vectors, and validation scripts
- **`implementations/ts/sdlp-sdk/`** - Core TypeScript SDK library
- **`implementations/ts/sdlp-cli/`** - Command-line interface tool
- **`implementations/ts/sdlp-electron-demo/`** - Electron demonstration application

## Configuration

All packages extend shared configurations:

- **ESLint**: `eslint.config.js` (root) - Strict TypeScript rules with security checks
- **Prettier**: `.prettierrc` (root) - Consistent code formatting
- **TypeScript**: `tsconfig.base.json` (root) - Shared compiler options

## Individual Package Commands

Each package also supports individual commands:

```bash
# In any package directory
npm run lint        # ESLint checking
npm run lint:fix    # Auto-fix ESLint issues
npm run format      # Prettier formatting
npm test           # Run tests
npm run build      # Build the package
```

## Adding New Packages

When adding new TypeScript packages:

1. Extend the root configurations in your `eslint.config.js` and `tsconfig.json`
2. Add the package to the `Justfile` recipes
3. Ensure consistent dependency versions across packages

# Contributing

This project follows a structured development approach with clear deliverables and test-driven development. See `llm_plan/phase1/tasks.md` for current progress and next steps.

All code must pass the quality checks (`just check-all`) before submission.

# License

[To be determined]
