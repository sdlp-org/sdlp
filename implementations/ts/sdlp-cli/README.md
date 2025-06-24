<div align="center">
  <img src="../../../assets/logo.png" alt="Project Logo" width="200"/>
</div>

# SDLP CLI

A command-line interface for the Secure Deep Link Protocol (SDLP) v1.0.

## Overview

The SDLP CLI provides tools for generating cryptographic keys, creating signed deep links, and verifying SDLP links according to the SDLP v1.0 specification. It supports DID-based identity management and various compression algorithms.

## Installation

### From Source

```bash
# Clone the repository and navigate to the CLI directory
cd implementations/ts/sdlp-cli

# Install dependencies
npm install

# Build the CLI
npm run build

# Run the CLI
node dist/index.js --help
```

### Global Installation

```bash
# Install globally (after building)
npm link

# Use globally
sdlp --help
```

## Quick Start

### 1. Generate a Key Pair

```bash
# Generate a new did:key identity and save the private key
sdlp keygen --out my-key.jwk
```

### 2. Sign a Payload

```bash
# Create a payload file
echo '{"message": "Hello, SDLP!", "timestamp": "2025-06-15T15:00:00Z"}' > payload.json

# Sign the payload to create an SDLP link
sdlp sign --payload-file payload.json --type application/json --signer-key my-key.jwk
```

### 3. Verify a Link

```bash
# Verify an SDLP link (from stdin)
echo "sdlp://eyJ..." | sdlp verify

# Verify with JSON output
echo "sdlp://eyJ..." | sdlp verify --json

# Verify a link passed as argument
sdlp verify "sdlp://eyJ..."
```

## Commands

### `keygen`

Generate a new DID:key identity and save the private key, or convert an existing PEM key to JWK format.

```bash
sdlp keygen [options]
```

**Options:**

- `-o, --out <file>` - Output file for the private key (JWK format) (default: "private.jwk")
- `--from-pem [file]` - Path to a PEM file to convert to a JWK, or read from stdin if no file specified
- `--did-web <domain>` - Generate did:web identity for the specified domain (e.g., pre.ms)

**Output:**

- Creates a JWK file containing the private key
- Displays the generated DID:key identifier
- The DID can be shared publicly; keep the private key secure

**Examples:**

```bash
# Generate a new key pair
$ sdlp keygen --out alice-key.jwk
✅ Key pair generated successfully!
📁 Private key saved to: alice-key.jwk
🔑 DID: did:key:z6MkkKU8EXYUHfV4eGmU2EWn4qr57Q5ZEU8bWRZ94BwySX74

# Convert an existing PEM key to JWK format
$ sdlp keygen --from-pem my-key.pem --out converted-key.jwk
✅ Key pair converted successfully!
📁 Private key saved to: converted-key.jwk
🔑 DID: did:key:z6MkkKU8EXYUHfV4eGmU2EWn4qr57Q5ZEU8bWRZ94BwySX74
```

**PEM Key Requirements:**

- The PEM file must contain an Ed25519 private key in PKCS#8 format
- The key should be generated using standard cryptographic tools
- Only Ed25519 keys are supported for DID:key generation

**Example PEM Key Generation:**

```bash
# Generate Ed25519 key pair using OpenSSL
openssl genpkey -algorithm Ed25519 -out private-key.pem

# Convert to JWK format using SDLP CLI
sdlp keygen --from-pem private-key.pem --out my-key.jwk

# Convert from stdin (useful with password managers like 1Password)
op item --vault=Private get "pre.ms" --fields "label=private key" --format=json | jq -r '.value' | sdlp keygen --from-pem --out my-key.jwk

# Or pipe any PEM content directly
cat my-key.pem | sdlp keygen --from-pem --out converted-key.jwk

# Generate did:web identity with automatic DID document creation
$ op item get "pre.ms" | jq -r '.value' | sdlp keygen --from-pem --did-web pre.ms --out my-web-key.jwk
✅ Key pair converted successfully!
📁 Private key saved to: my-web-key.jwk
🔑 DID: did:web:pre.ms
🔗 Key ID: did:web:pre.ms#owner
📄 DID document saved to: my-web-key-did-document.json
🌐 Publish this at: https://pre.ms/.well-known/did.json
```

**did:web Identity Setup:**

When using `--did-web`, the CLI generates both:

1. **Private key (JWK)** - Keep this secure for signing
2. **DID document** - Publish this at `https://yourdomain/.well-known/did.json`

The DID document contains your public key and must be accessible via HTTPS for verification to work.

### `sign`

Sign a payload file and create an SDLP link.

```bash
sdlp sign --payload-file <file> --type <mime-type> [options]
```

**Required Options:**

- `--payload-file <file>` - Path to the payload file to sign
- `--type <type>` - MIME type of the payload (e.g., application/json, text/plain)

**Optional Options:**

- `--signer-key <file>` - Path to the private key file (JWK format)
- `--compression <comp>` - Compression algorithm: br, gz, zstd, none (default: "br")
- `--expires <exp>` - Expiration time (ISO 8601 format or seconds from now)
- `--not-before <nbf>` - Not before time (ISO 8601 format or seconds from now)

**Output:**

- Prints the SDLP link to stdout

**Examples:**

```bash
# Basic signing
$ sdlp sign --payload-file data.json --type application/json --signer-key key.jwk
sdlp://eyJzaWduYXR1cmUiOiJEUW9EdDhkMk5pSmhwa0VHMXF0SVZQTndXNHFLalR2REIwSWJPdEpuc3laQ24yd19vUWdjR2Fka...

# With compression disabled
$ sdlp sign --payload-file data.json --type application/json --signer-key key.jwk --compression none

# With expiration (1 hour from now)
$ sdlp sign --payload-file data.json --type application/json --signer-key key.jwk --expires 3600

# With specific expiration date
$ sdlp sign --payload-file data.json --type application/json --signer-key key.jwk --expires "2025-12-31T23:59:59Z"
```

### `verify`

Verify an SDLP link and output the payload.

```bash
sdlp verify [link] [options]
```

**Arguments:**

- `[link]` - SDLP link to verify (if not provided, reads from stdin)

**Options:**

- `--json` - Output verification result in JSON format
- `--max-payload-size <size>` - Maximum payload size in bytes (default: 1048576 = 1MB)

**Output:**

- On success: Verification details (to stderr) and payload (to stdout)
- On failure: Error message (to stderr) and exit code 1

**Examples:**

```bash
# Verify from stdin (human-readable output)
$ echo "sdlp://eyJ..." | sdlp verify
✅ Link verified successfully!
👤 Sender: did:key:z6MkkKU8EXYUHfV4eGmU2EWn4qr57Q5ZEU8bWRZ94BwySX74
📄 Content Type: application/json
📊 Payload Size: 66 bytes
🗜️  Compression: br

--- Payload ---
{"message": "Hello, SDLP!", "timestamp": "2025-06-15T15:00:00Z"}

# Verify with JSON output
$ echo "sdlp://eyJ..." | sdlp verify --json
{
  "valid": true,
  "sender": "did:key:z6MkkKU8EXYUHfV4eGmU2EWn4qr57Q5ZEU8bWRZ94BwySX74",
  "contentType": "application/json",
  "payloadSize": 66,
  "metadata": {
    "v": "SDL-1.0",
    "sid": "did:key:z6MkkKU8EXYUHfV4eGmU2EWn4qr57Q5ZEU8bWRZ94BwySX74",
    "type": "application/json",
    "comp": "br",
    "chk": "a59b832048a69a49c1a681495706831b2b0d0dd22b6df50a4d2ea44fe90a6"
  }
}
{"message": "Hello, SDLP!", "timestamp": "2025-06-15T15:00:00Z"}

# Verify link passed as argument
$ sdlp verify "sdlp://eyJ..."

# Verify with payload size limit
$ sdlp verify --max-payload-size 1024 "sdlp://eyJ..."
```

## Error Handling

The CLI provides clear error messages for common issues:

### Key Generation Errors

```bash
$ sdlp keygen --out /invalid/path/key.jwk
❌ Error generating key pair:
Error: ENOENT: no such file or directory, open '/invalid/path/key.jwk'
```

### Signing Errors

```bash
$ sdlp sign --payload-file missing.json --type application/json --signer-key key.jwk
❌ Error creating link:
Error: ENOENT: no such file or directory, open 'missing.json'
```

### Verification Errors

```bash
$ echo "invalid-link" | sdlp verify
❌ Link verification failed:
Error: Invalid link format: Invalid SDLP link format - missing scheme or dot separator
Code: INVALID_LINK_FORMAT
```

## File Formats

### Private Key File (JWK)

The private key file is stored in JSON Web Key (JWK) format:

```json
{
  "kty": "OKP",
  "crv": "Ed25519",
  "x": "base64url-encoded-public-key",
  "d": "base64url-encoded-private-key",
  "kid": "did:key:z6MkkKU8EXYUHfV4eGmU2EWn4qr57Q5ZEU8bWRZ94BwySX74#key-1",
  "alg": "EdDSA"
}
```

**Important Security Notes:**

- Keep the private key file secure and never share it
- The `kid` field contains the full DID URL with key identifier
- The DID portion (before #) can be shared publicly
- Back up your private keys securely

### SDLP Link Format

SDLP links follow this format:

```
sdlp://<base64url-encoded-jws-metadata>.<base64url-encoded-payload>
```

- **Scheme**: `sdlp://` (or custom application schemes)
- **JWS Metadata**: Contains signature, sender DID, payload metadata
- **Payload**: Compressed (or uncompressed) actual data

## Compression

The CLI supports multiple compression algorithms:

- **br** (Brotli) - Default, best compression ratio
- **gz** (Gzip) - Widely supported, good compression
- **zstd** (Zstandard) - Fast compression/decompression
- **none** - No compression

Choose compression based on your needs:

- Use `br` for maximum space efficiency
- Use `none` for small payloads or debugging
- Use `gz` for maximum compatibility

## DID Support

The CLI supports the following DID methods:

### did:key

- **Format**: `did:key:z<base58-encoded-public-key>`
- **Usage**: Self-sovereign, cryptographically derived identities
- **Security**: No external dependencies, keys are the identity

### did:web (verification only)

- **Format**: `did:web:domain.com`
- **Usage**: Domain-based identities with web-hosted DID documents
- **Security**: Relies on HTTPS and domain control

## Integration Examples

### Shell Scripting

```bash
#!/bin/bash

# Generate a key pair
sdlp keygen --out sender-key.jwk
echo "Generated key for sender"

# Create and sign a message
echo '{"message": "Hello from script!", "timestamp": "'$(date -Iseconds)'"}' > message.json
LINK=$(sdlp sign --payload-file message.json --type application/json --signer-key sender-key.jwk)
echo "Created link: $LINK"

# Verify the link
echo "$LINK" | sdlp verify --json > result.json
echo "Verification result saved to result.json"

# Clean up
rm sender-key.jwk message.json
```

### CI/CD Pipeline

```yaml
# Example GitHub Actions step
- name: Sign deployment manifest
  run: |
    echo '${{ toJson(github.event) }}' > deployment.json
    sdlp sign \
      --payload-file deployment.json \
      --type application/json \
      --signer-key ${{ secrets.SDLP_PRIVATE_KEY_FILE }} \
      --expires 86400 \
    > signed-manifest.sdlp
```

### Node.js Integration

```javascript
// Using CLI from Node.js
import { execSync } from 'child_process';

// Sign a payload
const payload = JSON.stringify({ data: 'example' });
require('fs').writeFileSync('temp-payload.json', payload);

const link = execSync(
  'sdlp sign --payload-file temp-payload.json --type application/json --signer-key key.jwk',
  { encoding: 'utf8' }
).trim();

// Verify the link
const result = execSync(`echo "${link}" | sdlp verify --json`, {
  encoding: 'utf8',
});
const verification = JSON.parse(result.split('\n')[0]);

console.log('Verified:', verification.valid);
console.log('Sender:', verification.sender);
```

## Troubleshooting

### Common Issues

**1. Permission denied when writing key file**

```bash
$ sdlp keygen --out /etc/my-key.jwk
❌ Error generating key pair: Error: EACCES: permission denied
```

_Solution_: Choose a writable directory or run with appropriate permissions.

**2. Invalid MIME type**

```bash
$ sdlp sign --payload-file data.txt --type invalid/type --signer-key key.jwk
```

_Solution_: Use standard MIME types like `text/plain`, `application/json`, etc.

**3. Link verification fails**

```bash
$ echo "corrupted-link" | sdlp verify
❌ Link verification failed: Error: Invalid link format
```

_Solution_: Ensure the link is complete and uncorrupted.

**4. DID resolution timeout**

```bash
$ echo "sdlp://..." | sdlp verify
❌ Link verification failed: Error: DID resolution timeout
```

_Solution_: Check network connectivity for did:web identities.

### Debug Mode

For debugging, you can:

1. Use `--json` output for machine-readable results
2. Check exit codes: 0 = success, 1 = error
3. Examine stderr for detailed error messages
4. Test with `--compression none` to inspect raw payloads

### Performance Considerations

- **Key Generation**: Fast, no network required
- **Signing**: Fast, depends on payload size and compression
- **Verification**: May require network for did:web resolution
- **Payload Limits**: Default 1MB limit, configurable with `--max-payload-size`

## Development

### Building from Source

```bash
# Install dependencies
npm install

# Build the CLI
npm run build

# Run tests
npm test

# Run linting
npm run lint

# Format code
npm run format
```

### Testing

The CLI includes comprehensive tests:

- Unit tests for argument parsing and command logic
- End-to-end tests for complete workflows
- Error handling and edge case tests

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

## Security Considerations

1. **Private Key Security**: Never commit private keys to version control
2. **Network Security**: did:web resolution relies on HTTPS security
3. **Payload Validation**: Always validate payloads before processing
4. **Size Limits**: Use `--max-payload-size` to prevent resource exhaustion
5. **Expiration**: Use `--expires` for time-limited links
6. **Verification**: Always verify links before trusting content

## Specifications

This CLI implements:

- [SDLP v1.0 Specification](../../../specs/sdlp-v0.1-draft.md)
- [RFC 7515 - JSON Web Signature (JWS)](https://tools.ietf.org/html/rfc7515)
- [W3C Decentralized Identifiers (DIDs) v1.0](https://www.w3.org/TR/did-core/)
- [DID Key Method Specification](https://w3c-ccg.github.io/did-method-key/)

## License

This CLI is part of the SDLP reference implementation.
