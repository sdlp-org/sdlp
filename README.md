# Secure Deep Link Protocol (SDLP) - MVP Implementation

This repository contains the MVP implementation of the Secure Deep Link Protocol, a cryptographically signed deep link mechanism using Decentralized Identifiers (DIDs) for sender authentication and payload integrity verification.

## Project Status

### ✅ Phase 1: MVP Development & Demonstration

#### Deliverable 1.1: Draft Specification & Core Test Vectors - COMPLETED
- **Specification**: `specs/sdlp-v0.1-draft.md` - Frozen MVP specification
- **Test Identities**: `specs/test-fixtures/` - Ed25519 key pairs and DID documents
- **Test Vectors**: `specs/mvp-test-vectors.json` - 5 comprehensive test cases covering:
  - Happy path with `did:key`
  - Happy path with `did:web`
  - Invalid signature detection
  - Payload tampering detection
  - Expired link handling

#### Next: Deliverable 1.2: MVP Reference Library (TypeScript)
- Location: `implementations/js/sdlp-sdk`
- Core functions: `createLink()` and `verifyLink()`
- DID resolution for `did:key` and `did:web`
- Comprehensive test suite using generated test vectors

#### Next: Deliverable 1.3: Demo Application (Electron)
- Location: `demo/electron-app`
- Interactive verification UI
- Trust status indicators
- Safe payload inspection

## Quick Start

### Test Vectors
The test vectors demonstrate the complete SDLP protocol:

```bash
# View the test vectors
cat specs/mvp-test-vectors.json

# Generate new test vectors (if needed)
node specs/test-fixtures/generate-test-vectors.js
```

### Protocol Overview
SDLP links follow this format:
```
sdlp://<base64url_jws_metadata>.<base64url_compressed_payload>
```

Where the JWS metadata contains:
- **Protected Header**: Algorithm (`EdDSA`) and Key ID (`did:...#key-id`)
- **Payload**: Core metadata with sender DID, payload type, compression, checksum, and optional expiration
- **Signature**: EdDSA signature over the metadata

## Security Features

- **Authenticity**: Cryptographic signatures using EdDSA with Ed25519 keys
- **Integrity**: SHA-256 checksums prevent payload tampering
- **Identity**: Decentralized Identifiers (DIDs) for sender verification
- **Expiration**: Optional time-bounds for link validity
- **Compression**: Efficient payload encoding (Brotli support planned)

## Repository Structure

```
├── specs/                          # Specifications and test data
│   ├── sdlp-v0.1-draft.md         # Frozen MVP specification
│   ├── mvp-test-vectors.json       # Core test vectors
│   └── test-fixtures/              # Test identities and utilities
├── implementations/js/sdlp-sdk/    # TypeScript reference library (next)
├── demo/electron-app/              # Demo application (next)
├── llm_plan/                       # Project planning and tasks
└── protocol/                       # Original protocol proposal
```

## Development

This repository uses a unified code quality system across all TypeScript packages with consistent linting, formatting, and testing workflows.

### Prerequisites

- Node.js 18+
- [Just](https://just.systems/) command runner

### Code Quality Commands

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

### Package Structure

The repository contains the following TypeScript packages:

- **`specs/`** - Specifications, test vectors, and validation scripts
- **`implementations/ts/sdlp-sdk/`** - Core TypeScript SDK library
- **`implementations/ts/sdlp-cli/`** - Command-line interface tool
- **`implementations/ts/sdlp-electron-demo/`** - Electron demonstration application

### Configuration

All packages extend shared configurations:

- **ESLint**: `eslint.config.js` (root) - Strict TypeScript rules with security checks
- **Prettier**: `.prettierrc` (root) - Consistent code formatting
- **TypeScript**: `tsconfig.base.json` (root) - Shared compiler options

### Individual Package Commands

Each package also supports individual commands:

```bash
# In any package directory
npm run lint        # ESLint checking
npm run lint:fix    # Auto-fix ESLint issues
npm run format      # Prettier formatting
npm test           # Run tests
npm run build      # Build the package
```

### Adding New Packages

When adding new TypeScript packages:

1. Extend the root configurations in your `eslint.config.js` and `tsconfig.json`
2. Add the package to the `Justfile` recipes
3. Ensure consistent dependency versions across packages

## Contributing

This project follows a structured development approach with clear deliverables and test-driven development. See `llm_plan/phase1/tasks.md` for current progress and next steps.

All code must pass the quality checks (`just check-all`) before submission.

## License

[To be determined]
