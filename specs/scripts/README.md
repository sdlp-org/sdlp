# SDLP Utility Scripts

This directory contains **TypeScript utility scripts** for working with the Secure Deep Link Protocol (SDLP) during development and testing. All scripts are strongly typed with comprehensive type safety.

## Scripts

### 🔑 `generate-did-key.ts`

Generate `did:key` identifiers from Ed25519 public keys with full TypeScript type safety.

```bash
# Generate from a base64url public key
tsx generate-did-key.ts OIsG7Oa7G0B-lM2zT2I-6A0jSSG6sc2B68v2sODvM-s

# Test with fixture key
tsx generate-did-key.ts --test

# Using npm script (recommended)
npm run generate-did-key -- --test
```

### 🧪 `generate-test-vectors.ts`

Generate comprehensive SDLP test vectors for library testing with strict typing.

```bash
# Generate to default location (../mvp-test-vectors.json)
tsx generate-test-vectors.ts

# Generate to custom file
tsx generate-test-vectors.ts --output my-vectors.json

# Using npm script (recommended)
npm run generate-vectors
```

### 🔍 `parse-sdlp-link.ts`

Parse and inspect SDLP links without verification (development utility) with type-safe parsing.

```bash
# Parse a specific link
tsx parse-sdlp-link.ts "sdlp://eyJwcm90ZWN0ZWQi..."

# Parse first test vector
tsx parse-sdlp-link.ts --test

# Using npm script (recommended)
npm run parse-link -- --test
```

## Features

### 🔧 Modern TypeScript Stack

- **Vite**: Fast build tool and dev server
- **Vitest**: Modern testing framework with TypeScript support
- **ESLint**: Strict TypeScript linting with security rules
- **Prettier**: Consistent code formatting
- **tsx**: Fast TypeScript execution

### 🛡️ Type Safety

All scripts feature:

- Strict TypeScript configuration with `exactOptionalPropertyTypes`
- Comprehensive type definitions for SDLP protocol
- Template literal types for DID identifiers and SDLP links
- Readonly interfaces to prevent mutations
- Exhaustive error handling with typed error unions

### 📦 Proper Dependencies

All scripts use the installed dependencies:

- `@noble/hashes` for secure SHA-256 hashing
- `bs58` for proper base58 encoding (replaced incompatible `base58`)
- TypeScript native crypto and fs modules

### 🖥️ CLI Interfaces

Each script provides:

- Help documentation (`--help`)
- Clear error messages with TypeScript error types
- Proper exit codes
- Colorized output with emojis
- Type-safe argument parsing

### 🔗 Modular Design

Scripts export strongly-typed functions for reuse:

```typescript
import { generateDidKey } from './scripts/generate-did-key.js'
import { createSDLPLink, type SDLPSigner } from './scripts/generate-test-vectors.js'
import { parseSDLPLink, type ParsedSDLPLink } from './scripts/parse-sdlp-link.js'
```

## NPM Scripts

### 🚀 Development Commands

```bash
npm run build              # Build TypeScript for production
npm run dev               # Start Vite dev server
npm run typecheck         # Run TypeScript type checking
npm run test:watch        # Run tests in watch mode
npm run test              # Run tests once
npm run test:coverage     # Run tests with coverage report
```

### 🛠️ Utility Scripts

```bash
npm run generate-vectors  # Generate test vectors (TypeScript)
npm run generate-did-key  # Generate DID keys (TypeScript)
npm run parse-link        # Parse SDLP links (TypeScript)
npm run help             # Show available scripts
```

### 📏 Code Quality

```bash
npm run lint             # Lint TypeScript code
npm run format           # Format code with Prettier
```

## Security Notes

⚠️ **Important**: These scripts are for development and testing only.

- Test vectors use hardcoded keys (safe for testing)
- The parser script does NOT verify cryptographic signatures
- Use proper SDLP verification libraries for production use

## Dependencies

### Runtime Dependencies

- `@noble/hashes`: ^1.8.0 - Secure hashing algorithms
- `bs58`: ^6.0.0 - Base58 encoding/decoding

### Development Dependencies

- `typescript`: Latest - Type safety and modern JavaScript features
- `vite`: Latest - Fast build tool and dev server
- `vitest`: Latest - Modern testing framework
- `tsx`: Latest - Fast TypeScript execution
- `eslint` + `@typescript-eslint/*`: Strict linting
- `prettier`: Code formatting
- `@vitest/coverage-v8`: Test coverage reporting

## Integration

These scripts are designed to work with:

- Test fixtures in `../test-fixtures/`
- Generated test vectors in `../mvp-test-vectors.json`
- The SDLP specification in `../sdlp-v0.1-draft.md`
