<div align="center">
  <img src="assets/logo.png" alt="Project Logo" width="200"/>
</div>

# Secure Deep Link Protocol (SDLP)

A cryptographically signed deep link protocol using Decentralized Identifiers (DIDs) for sender authentication and payload integrity verification.

## Overview

SDLP enables secure, verifiable deep links that can be trusted across applications and platforms. Each link is cryptographically signed by its creator and can be independently verified without requiring a central authority.

### Protocol Format

SDLP links follow this structure:
```
sdlp://<base64url_jws_metadata>.<base64url_compressed_payload>
```

The JWS metadata contains:
- **Protected Header**: Algorithm (`EdDSA`) and Key ID (`did:...#key-id`)
- **Payload**: Core metadata with sender DID, payload type, compression, checksum, and optional expiration
- **Signature**: EdDSA signature over the metadata

### Security Features

- **Authenticity**: Cryptographic signatures using EdDSA with Ed25519 keys
- **Integrity**: SHA-256 checksums prevent payload tampering
- **Identity**: Decentralized Identifiers (DIDs) for sender verification
- **Expiration**: Optional time-bounds for link validity
- **Compression**: Efficient payload encoding with Brotli support

## Packages

This repository contains multiple TypeScript packages:

- **[`sdlp-sdk`](implementations/ts/sdlp-sdk/)** - Core TypeScript library for creating and verifying SDLP links
- **[`sdlp-cli`](implementations/ts/sdlp-cli/)** - Command-line interface for key generation, signing, and verification
- **[`sdlp-demo`](implementations/ts/sdlp-electron-demo/)** - Electron demonstration application

## Quick Start

```bash
# Install and build all packages
npm install
just check-all

# Run the interactive demo application
just local-demo

# Generate a key pair
cd implementations/ts/sdlp-cli
npm run build
node dist/src/index.js keygen --output my-key.jwk

# Sign a payload
echo "Hello, SDLP!" > message.txt
node dist/src/index.js sign --payload message.txt --signer my-key.jwk

# Verify a link
node dist/src/index.js verify <sdlp-link>
```

## Specifications

The protocol specification and test vectors are available in the [`specs/`](specs/) directory:

- **[SDLP v0.1 Draft](specs/sdlp-v0.1-draft.md)** - Complete protocol specification
- **[Test Vectors](specs/mvp-test-vectors.json)** - Reference implementation test cases
- **[Validation Scripts](specs/scripts/)** - Protocol validation utilities

## Development

For development setup, coding standards, and contribution guidelines, see [docs/development.md](./docs/development.md).
