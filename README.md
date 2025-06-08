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

## Contributing

This project follows a structured development approach with clear deliverables and test-driven development. See `llm_plan/phase1/tasks.md` for current progress and next steps.

## License

[To be determined]
