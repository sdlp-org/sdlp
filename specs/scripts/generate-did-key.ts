#!/usr/bin/env node

/**
 * DID Key Generator
 *
 * Utility script to generate did:key identifiers from Ed25519 public keys
 * Based on the did:key specification: https://w3c-ccg.github.io/did-key-spec/
 *
 * Usage:
 *   tsx generate-did-key.ts <base64url-public-key>
 *   tsx generate-did-key.ts --help
 *   npm run generate-did-key -- <base64url-public-key>
 *   npm run generate-did-key -- --help
 */

import bs58 from 'bs58'
import type { Ed25519PublicKeyJWK, DIDKeyIdentifier } from '../src/types.js'

function base64urlToBytes(base64url: string): Uint8Array {
  // Convert base64url to base64
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/')
  // Add padding if needed
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
  // Convert to bytes
  return new Uint8Array(Buffer.from(padded, 'base64'))
}

export function generateDidKey(publicKeyJwk: Ed25519PublicKeyJWK): DIDKeyIdentifier {
  // Extract the x coordinate (public key bytes) from JWK
  const publicKeyBytes = base64urlToBytes(publicKeyJwk.x)

  // Ed25519 multicodec prefix is 0xed (237 decimal)
  const multicodecPrefix = new Uint8Array([0xed])

  // Combine multicodec prefix with public key bytes
  const combined = new Uint8Array(multicodecPrefix.length + publicKeyBytes.length)
  combined.set(multicodecPrefix, 0)
  combined.set(publicKeyBytes, multicodecPrefix.length)

  // Encode with base58-btc and add 'z' prefix for multibase
  const base58Encoded = bs58.encode(Buffer.from(combined))
  const multibaseEncoded = `z${base58Encoded}`

  return `did:key:${multibaseEncoded}`
}

export function generateDidKeyFromBase64url(base64urlKey: string): DIDKeyIdentifier {
  const publicKeyJwk: Ed25519PublicKeyJWK = {
    kty: 'OKP',
    crv: 'Ed25519',
    x: base64urlKey,
  }

  return generateDidKey(publicKeyJwk)
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2)

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log(`
DID Key Generator

Usage:
  tsx generate-did-key.ts <base64url-public-key>
  tsx generate-did-key.ts --test
  npm run generate-did-key -- <base64url-public-key>
  npm run generate-did-key -- --test

Examples:
  tsx generate-did-key.ts OIsG7Oa7G0B-lM2zT2I-6A0jSSG6sc2B68v2sODvM-s
  npm run generate-did-key -- --test
  
Options:
  --test    Run with test key from fixtures
  --help    Show this help message
`)
    process.exit(0)
  }

  if (args[0] === '--test') {
    // Use the test key from fixtures
    const testKey = 'OIsG7Oa7G0B-lM2zT2I-6A0jSSG6sc2B68v2sODvM-s'
    const didKey = generateDidKeyFromBase64url(testKey)
    console.log(`Test DID Key: ${didKey}`)
  } else {
    const base64urlKey = args[0]
    if (!base64urlKey) {
      console.error('Error: base64url public key is required')
      process.exit(1)
    }

    try {
      const didKey = generateDidKeyFromBase64url(base64urlKey)
      console.log(didKey)
    } catch (error) {
      console.error(
        'Error generating DID key:',
        error instanceof Error ? error.message : 'Unknown error'
      )
      process.exit(1)
    }
  }
}
