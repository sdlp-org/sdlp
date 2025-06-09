#!/usr/bin/env node

/**
 * SDLP Test Fixture Validator
 *
 * Validates that test fixtures are cryptographically valid and consistent.
 * This script prevents the key mismatch issues that occurred during implementation.
 *
 * Usage:
 *   tsx validate-fixtures.ts
 *   npm run validate-fixtures
 */

import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import bs58 from 'bs58'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

interface TestKeyFixtures {
    description: string
    ed25519_private_key_jwk: {
        kty: string
        crv: string
        d: string
        x: string
    }
    ed25519_public_key_jwk: {
        kty: string
        crv: string
        x: string
    }
    did_key_identifier: string
    did_web_identifier: string
}

interface ValidationResult {
    valid: boolean
    errors: string[]
    warnings: string[]
}

function base64urlDecode(str: string): Buffer {
    // Add padding if needed
    const padded = str + '='.repeat((4 - (str.length % 4)) % 4)
    // Convert base64url to base64
    const base64 = padded.replace(/-/g, '+').replace(/_/g, '/')
    return Buffer.from(base64, 'base64')
}

function base64urlEncode(buffer: Buffer | Uint8Array): string {
    return Buffer.from(buffer)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '')
}

/**
 * Validates that a private key JWK and public key JWK are a valid pair
 */
function validateKeyPair(privateKeyJwk: any, publicKeyJwk: any): ValidationResult {
    const result: ValidationResult = { valid: true, errors: [], warnings: [] }

    try {
        // 1. Validate JWK structure
        if (privateKeyJwk.kty !== 'OKP' || privateKeyJwk.crv !== 'Ed25519') {
            result.errors.push('Private key must be OKP/Ed25519')
            result.valid = false
        }

        if (publicKeyJwk.kty !== 'OKP' || publicKeyJwk.crv !== 'Ed25519') {
            result.errors.push('Public key must be OKP/Ed25519')
            result.valid = false
        }

        if (!privateKeyJwk.d || !privateKeyJwk.x) {
            result.errors.push('Private key must have both d and x parameters')
            result.valid = false
        }

        if (!publicKeyJwk.x) {
            result.errors.push('Public key must have x parameter')
            result.valid = false
        }

        // 2. Validate that public key components match
        if (privateKeyJwk.x !== publicKeyJwk.x) {
            result.errors.push('Public key components (x) do not match between private and public JWKs')
            result.valid = false
        }

        // 3. Cryptographically validate the key pair
        const privateKeyBytes = base64urlDecode(privateKeyJwk.d)
        const publicKeyFromPrivate = base64urlDecode(privateKeyJwk.x)

        // Create Ed25519 key pair from private key to verify it derives the correct public key
        const privateKeyDer = Buffer.concat([
            Buffer.from([
                0x30, 0x2e, 0x02, 0x01, 0x00, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70, 0x04, 0x22, 0x04,
                0x20,
            ]),
            privateKeyBytes,
        ])

        const privateKey = crypto.createPrivateKey({
            key: privateKeyDer,
            format: 'der',
            type: 'pkcs8',
        })

        const publicKey = crypto.createPublicKey(privateKey)
        const derivedPublicKeyDer = publicKey.export({ format: 'der', type: 'spki' })

        // Extract the 32-byte public key from the DER format
        // Ed25519 public key is the last 32 bytes of the DER structure
        const derivedPublicKeyBytes = derivedPublicKeyDer.slice(-32)

        if (!derivedPublicKeyBytes.equals(publicKeyFromPrivate)) {
            result.errors.push(
                `Private key does not derive the specified public key. ` +
                `Expected: ${base64urlEncode(derivedPublicKeyBytes)}, ` +
                `Got: ${privateKeyJwk.x}`
            )
            result.valid = false
        }

        // 4. Test the key pair with a signature
        const testMessage = Buffer.from('test-signature-validation')
        const signature = crypto.sign(null, testMessage, privateKey)

        const verificationResult = crypto.verify(null, testMessage, publicKey, signature)
        if (!verificationResult) {
            result.errors.push('Key pair failed signature verification test')
            result.valid = false
        }

    } catch (error) {
        result.errors.push(`Cryptographic validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
        result.valid = false
    }

    return result
}

/**
 * Validates that a DID key identifier matches the public key
 */
function validateDidKey(didKey: string, publicKeyJwk: any): ValidationResult {
    const result: ValidationResult = { valid: true, errors: [], warnings: [] }

    try {
        if (!didKey.startsWith('did:key:z')) {
            result.errors.push('DID key must start with "did:key:z"')
            result.valid = false
            return result
        }

        // Extract the multibase part
        const multibaseKey = didKey.replace('did:key:', '')
        if (!multibaseKey.startsWith('z')) {
            result.errors.push('DID key must use base58btc encoding (z prefix)')
            result.valid = false
            return result
        }

        // Decode the multibase + multicodec
        const decoded = bs58.decode(multibaseKey.slice(1)) // Remove 'z' prefix

        // Check for Ed25519 multicodec prefix (0xed)
        if (decoded.length < 33 || decoded[0] !== 0xed) {
            result.errors.push('DID key must be Ed25519 with correct multicodec prefix (0xed)')
            result.valid = false
            return result
        }

        // Extract the 32-byte public key
        const publicKeyBytes = decoded.slice(1, 33)
        const expectedPublicKeyB64url = base64urlEncode(publicKeyBytes)

        if (expectedPublicKeyB64url !== publicKeyJwk.x) {
            result.errors.push(
                `DID key does not match public key. ` +
                `DID derived: ${expectedPublicKeyB64url}, ` +
                `JWK: ${publicKeyJwk.x}`
            )
            result.valid = false
        }

    } catch (error) {
        result.errors.push(`DID key validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
        result.valid = false
    }

    return result
}

/**
 * Main validation function
 */
function validateTestFixtures(): ValidationResult {
    const fixturesPath = path.join(__dirname, '..', 'test-fixtures', 'keys.json')

    if (!fs.existsSync(fixturesPath)) {
        return {
            valid: false,
            errors: [`Test fixtures file not found: ${fixturesPath}`],
            warnings: []
        }
    }

    let fixtures: TestKeyFixtures
    try {
        const fixturesData = fs.readFileSync(fixturesPath, 'utf8')
        fixtures = JSON.parse(fixturesData) as TestKeyFixtures
    } catch (error) {
        return {
            valid: false,
            errors: [`Failed to parse test fixtures: ${error instanceof Error ? error.message : 'Unknown error'}`],
            warnings: []
        }
    }

    const result: ValidationResult = { valid: true, errors: [], warnings: [] }

    // Validate key pair
    const keyPairResult = validateKeyPair(fixtures.ed25519_private_key_jwk, fixtures.ed25519_public_key_jwk)
    result.errors.push(...keyPairResult.errors)
    result.warnings.push(...keyPairResult.warnings)
    if (!keyPairResult.valid) result.valid = false

    // Validate DID key
    const didKeyResult = validateDidKey(fixtures.did_key_identifier, fixtures.ed25519_public_key_jwk)
    result.errors.push(...didKeyResult.errors)
    result.warnings.push(...didKeyResult.warnings)
    if (!didKeyResult.valid) result.valid = false

    // Validate DID web format
    if (!fixtures.did_web_identifier.startsWith('did:web:')) {
        result.errors.push('DID web identifier must start with "did:web:"')
        result.valid = false
    }

    return result
}

// CLI interface
function main(): void {
    console.log('🔍 Validating SDLP test fixtures...\n')

    const result = validateTestFixtures()

    if (result.valid) {
        console.log('✅ All test fixtures are valid!')

        if (result.warnings.length > 0) {
            console.log('\n⚠️  Warnings:')
            for (const warning of result.warnings) {
                console.log(`   • ${warning}`)
            }
        }

        process.exit(0)
    } else {
        console.log('❌ Test fixture validation failed!')
        console.log('\n🚨 Errors:')
        for (const error of result.errors) {
            console.log(`   • ${error}`)
        }

        if (result.warnings.length > 0) {
            console.log('\n⚠️  Warnings:')
            for (const warning of result.warnings) {
                console.log(`   • ${warning}`)
            }
        }

        console.log('\n💡 Fix these issues before generating test vectors.')
        process.exit(1)
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main()
}

export { validateTestFixtures, validateKeyPair, validateDidKey } 
