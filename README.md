<div align="center">
  <img src="assets/logo.png" alt="Project Logo" width="200"/>
</div>

# Secure Deep Link Protocol (SDLP) - MVP Implementation

This repository contains the MVP implementation of the Secure Deep Link Protocol, a cryptographically signed deep link mechanism using Decentralized Identifiers (DIDs) for sender authentication and payload integrity verification.

## Overview

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

For details on the development environment, coding standards, and contribution guidelines, please see [docs/development.md](./docs/development.md).
