#!/usr/bin/env node

/**
 * SDLP Test Vector Validator
 *
 * Validates that test vectors conform to the SDLP specification.
 * Ensures proper format, required fields, and consistency with fixtures.
 *
 * Usage:
 *   tsx validate-test-vectors.ts [--file <path>]
 *   npm run validate-test-vectors
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

interface TestVector {
    description: string
    link: string
    expected: {
        valid: boolean
        payload?: string | null
        payloadType?: string | null
        senderDid?: string | null
        error?: string | null
    }
}

interface ValidationResult {
    valid: boolean
    errors: string[]
    warnings: string[]
}

interface ParsedSDLPLink {
    jwsPart: string
    payloadPart: string
    jws?: {
        protected: any
        payload: any
        signature: string
    }
    metadata?: {
        v: string
        sid: string
        type: string
        comp: string
        chk: string
        exp?: number
        nbf?: number
    }
    protectedHeader?: {
        alg: string
        kid: string
    }
}

function base64urlDecode(str: string): Buffer {
    // Add padding if needed
    const padded = str + '='.repeat((4 - (str.length % 4)) % 4)
    // Convert base64url to base64
    const base64 = padded.replace(/-/g, '+').replace(/_/g, '/')
    return Buffer.from(base64, 'base64')
}

/**
 * Parse an SDLP link to extract its components
 */
function parseSDLPLink(link: string): ParsedSDLPLink | null {
    try {
        if (!link.startsWith('sdlp://')) {
            return null
        }

        const content = link.slice(7) // Remove 'sdlp://' prefix
        const dotIndex = content.lastIndexOf('.')

        if (dotIndex === -1) {
            return null
        }

        const jwsPart = content.slice(0, dotIndex)
        const payloadPart = content.slice(dotIndex + 1)

        // Decode and parse JWS
        const jwsJson = base64urlDecode(jwsPart)
        const jws = JSON.parse(new TextDecoder().decode(jwsJson))

        // Decode protected header
        const protectedHeaderJson = base64urlDecode(jws.protected)
        const protectedHeader = JSON.parse(new TextDecoder().decode(protectedHeaderJson))

        // Decode metadata payload
        const metadataJson = base64urlDecode(jws.payload)
        const metadata = JSON.parse(new TextDecoder().decode(metadataJson))

        return {
            jwsPart,
            payloadPart,
            jws,
            metadata,
            protectedHeader
        }
    } catch {
        return null
    }
}

/**
 * Validate a single test vector
 */
function validateTestVector(vector: TestVector, index: number): ValidationResult {
    const result: ValidationResult = { valid: true, errors: [], warnings: [] }
    const prefix = `Vector ${index + 1} (${vector.description})`

    // 1. Validate structure
    if (!vector.description || typeof vector.description !== 'string') {
        result.errors.push(`${prefix}: Missing or invalid description`)
        result.valid = false
    }

    if (!vector.link || typeof vector.link !== 'string') {
        result.errors.push(`${prefix}: Missing or invalid link`)
        result.valid = false
    }

    if (!vector.expected || typeof vector.expected !== 'object') {
        result.errors.push(`${prefix}: Missing or invalid expected result`)
        result.valid = false
    }

    if (typeof vector.expected.valid !== 'boolean') {
        result.errors.push(`${prefix}: expected.valid must be boolean`)
        result.valid = false
    }

    // 2. Validate SDLP link format
    if (!vector.link.startsWith('sdlp://')) {
        result.errors.push(`${prefix}: Link must start with 'sdlp://'`)
        result.valid = false
    }

    // 3. Parse and validate SDLP structure
    const parsed = parseSDLPLink(vector.link)
    if (!parsed) {
        result.errors.push(`${prefix}: Failed to parse SDLP link`)
        result.valid = false
        return result
    }

    // 4. Validate JWS structure
    if (!parsed.jws?.protected || !parsed.jws?.payload || !parsed.jws?.signature) {
        result.errors.push(`${prefix}: JWS must have protected, payload, and signature`)
        result.valid = false
    }

    // 5. Validate protected header
    if (parsed.protectedHeader) {
        if (parsed.protectedHeader.alg !== 'EdDSA') {
            result.errors.push(`${prefix}: Algorithm must be 'EdDSA', got '${parsed.protectedHeader.alg}'`)
            result.valid = false
        }

        if (!parsed.protectedHeader.kid || !parsed.protectedHeader.kid.startsWith('did:')) {
            result.errors.push(`${prefix}: kid must be a valid DID URL`)
            result.valid = false
        }
    }

    // 6. Validate core metadata
    if (parsed.metadata) {
        if (parsed.metadata.v !== 'SDL-1.0') {
            result.errors.push(`${prefix}: Version must be 'SDL-1.0', got '${parsed.metadata.v}'`)
            result.valid = false
        }

        if (!parsed.metadata.sid || !parsed.metadata.sid.startsWith('did:')) {
            result.errors.push(`${prefix}: sid must be a valid DID`)
            result.valid = false
        }

        if (!parsed.metadata.type || typeof parsed.metadata.type !== 'string') {
            result.errors.push(`${prefix}: type must be a valid MIME type`)
            result.valid = false
        }

        if (!['none', 'br', 'gz', 'zstd'].includes(parsed.metadata.comp)) {
            result.errors.push(`${prefix}: comp must be 'none', 'br', 'gz', or 'zstd'`)
            result.valid = false
        }

        if (!parsed.metadata.chk || !/^[a-f0-9]{64}$/.test(parsed.metadata.chk)) {
            result.errors.push(`${prefix}: chk must be a 64-character hex string`)
            result.valid = false
        }

        // Validate kid matches sid domain
        if (parsed.protectedHeader?.kid && parsed.metadata.sid) {
            const kidDid = parsed.protectedHeader.kid.split('#')[0]
            if (kidDid !== parsed.metadata.sid) {
                result.errors.push(`${prefix}: kid DID must match sid`)
                result.valid = false
            }
        }
    }

    // 7. Validate expected results consistency
    if (vector.expected.valid) {
        // For valid vectors, check required fields
        if (vector.expected.payload === null || vector.expected.payload === undefined) {
            result.warnings.push(`${prefix}: Valid vector should specify expected payload`)
        }

        if (!vector.expected.payloadType) {
            result.warnings.push(`${prefix}: Valid vector should specify expected payloadType`)
        }

        if (!vector.expected.senderDid) {
            result.warnings.push(`${prefix}: Valid vector should specify expected senderDid`)
        }

        if (vector.expected.error !== null && vector.expected.error !== undefined) {
            result.warnings.push(`${prefix}: Valid vector should not specify error`)
        }

        // Check consistency with parsed metadata
        if (parsed.metadata && vector.expected.senderDid !== parsed.metadata.sid) {
            result.errors.push(`${prefix}: expected.senderDid doesn't match metadata.sid`)
            result.valid = false
        }

        if (parsed.metadata && vector.expected.payloadType !== parsed.metadata.type) {
            result.errors.push(`${prefix}: expected.payloadType doesn't match metadata.type`)
            result.valid = false
        }

    } else {
        // For invalid vectors, check error is specified
        if (!vector.expected.error) {
            result.errors.push(`${prefix}: Invalid vector must specify expected error`)
            result.valid = false
        }

        const validErrors = [
            'INVALID_LINK_FORMAT',
            'DID_RESOLUTION_FAILED',
            'INVALID_SIGNATURE',
            'PAYLOAD_CHECKSUM_MISMATCH',
            'LINK_EXPIRED',
            'UNSUPPORTED_COMPRESSION'
        ]

        if (vector.expected.error && !validErrors.includes(vector.expected.error)) {
            result.errors.push(`${prefix}: error must be one of: ${validErrors.join(', ')}`)
            result.valid = false
        }

        // Invalid vectors should have null values for other fields
        if (vector.expected.payload !== null) {
            result.warnings.push(`${prefix}: Invalid vector should have payload: null`)
        }

        if (vector.expected.payloadType !== null) {
            result.warnings.push(`${prefix}: Invalid vector should have payloadType: null`)
        }

        if (vector.expected.senderDid !== null) {
            result.warnings.push(`${prefix}: Invalid vector should have senderDid: null`)
        }
    }

    return result
}

/**
 * Validate all test vectors
 */
function validateTestVectors(filePath?: string): ValidationResult {
    const testVectorsPath = filePath || path.join(__dirname, '..', 'mvp-test-vectors.json')

    if (!fs.existsSync(testVectorsPath)) {
        return {
            valid: false,
            errors: [`Test vectors file not found: ${testVectorsPath}`],
            warnings: []
        }
    }

    let vectors: TestVector[]
    try {
        const vectorsData = fs.readFileSync(testVectorsPath, 'utf8')
        vectors = JSON.parse(vectorsData) as TestVector[]
    } catch (error) {
        return {
            valid: false,
            errors: [`Failed to parse test vectors: ${error instanceof Error ? error.message : 'Unknown error'}`],
            warnings: []
        }
    }

    if (!Array.isArray(vectors)) {
        return {
            valid: false,
            errors: ['Test vectors must be an array'],
            warnings: []
        }
    }

    if (vectors.length === 0) {
        return {
            valid: false,
            errors: ['Test vectors array cannot be empty'],
            warnings: []
        }
    }

    const result: ValidationResult = { valid: true, errors: [], warnings: [] }

    // Validate each vector
    for (let i = 0; i < vectors.length; i++) {
        const vectorResult = validateTestVector(vectors[i], i)
        result.errors.push(...vectorResult.errors)
        result.warnings.push(...vectorResult.warnings)
        if (!vectorResult.valid) result.valid = false
    }

    // Check for required test cases
    const descriptions = vectors.map(v => v.description.toLowerCase())
    const requiredCases = [
        'happy path',
        'invalid signature',
        'payload tampering',
        'expired'
    ]

    for (const requiredCase of requiredCases) {
        const hasCase = descriptions.some(desc => desc.includes(requiredCase))
        if (!hasCase) {
            result.warnings.push(`Missing recommended test case: ${requiredCase}`)
        }
    }

    return result
}

// CLI interface
function main(): void {
    const args = process.argv.slice(2)
    let filePath: string | undefined

    // Parse arguments
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--file' && args[i + 1]) {
            filePath = args[i + 1]
            i++ // Skip next arg
        } else if (args[i] === '--help') {
            console.log('SDLP Test Vector Validator')
            console.log('')
            console.log('Usage:')
            console.log('  tsx validate-test-vectors.ts [--file <path>]')
            console.log('  npm run validate-test-vectors')
            console.log('')
            console.log('Options:')
            console.log('  --file <path>  Path to test vectors file (default: ../mvp-test-vectors.json)')
            console.log('  --help         Show this help')
            process.exit(0)
        }
    }

    console.log('🧪 Validating SDLP test vectors...\n')

    const result = validateTestVectors(filePath)

    if (result.valid) {
        console.log('✅ All test vectors are valid!')

        if (result.warnings.length > 0) {
            console.log('\n⚠️  Warnings:')
            for (const warning of result.warnings) {
                console.log(`   • ${warning}`)
            }
        }

        process.exit(0)
    } else {
        console.log('❌ Test vector validation failed!')
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

        console.log('\n💡 Fix these issues or regenerate test vectors.')
        process.exit(1)
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main()
}

export { validateTestVectors, validateTestVector, parseSDLPLink } 
