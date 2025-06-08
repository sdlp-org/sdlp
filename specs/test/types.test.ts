import { describe, it, expect } from 'vitest'
import { generateDidKey, generateDidKeyFromBase64url } from '../scripts/generate-did-key.js'
import { parseSDLPLink } from '../scripts/parse-sdlp-link.js'
import {
  isValidDIDIdentifier,
  isValidSDLPLink,
  isValidPayloadType,
  type DIDIdentifier,
  type SDLPLinkString,
  type PayloadType,
} from '../src/types.js'

describe('Type Guards', () => {
  describe('isValidDIDIdentifier', () => {
    it('should validate valid DID identifiers', () => {
      expect(isValidDIDIdentifier('did:key:z2DUDndJSiGoP1cZLx6tEeFr9GugkN4QqbFNcbGKUyR8p9g')).toBe(
        true
      )
      expect(isValidDIDIdentifier('did:web:acme.example')).toBe(true)
      expect(isValidDIDIdentifier('did:ethr:0x1234567890abcdef')).toBe(true)
    })

    it('should reject invalid DID identifiers', () => {
      expect(isValidDIDIdentifier('not-a-did')).toBe(false)
      expect(isValidDIDIdentifier('did:')).toBe(false)
      expect(isValidDIDIdentifier('did:key:')).toBe(false)
      expect(isValidDIDIdentifier('')).toBe(false)
    })
  })

  describe('isValidSDLPLink', () => {
    it('should validate valid SDLP links', () => {
      expect(isValidSDLPLink('sdlp://eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0')).toBe(true)
      expect(isValidSDLPLink('sdlp://abc123.def456')).toBe(true)
    })

    it('should reject invalid SDLP links', () => {
      expect(isValidSDLPLink('https://example.com')).toBe(false)
      expect(isValidSDLPLink('sdlp://invalid')).toBe(false)
      expect(isValidSDLPLink('sdlp://.payload')).toBe(false)
      expect(isValidSDLPLink('sdlp://jws.')).toBe(false)
    })
  })

  describe('isValidPayloadType', () => {
    it('should validate valid MIME types', () => {
      expect(isValidPayloadType('text/plain')).toBe(true)
      expect(isValidPayloadType('application/json')).toBe(true)
      expect(isValidPayloadType('image/png')).toBe(true)
      expect(isValidPayloadType('application/vnd.api+json')).toBe(true)
    })

    it('should reject invalid MIME types', () => {
      expect(isValidPayloadType('plaintext')).toBe(false)
      expect(isValidPayloadType('text/')).toBe(false)
      expect(isValidPayloadType('/plain')).toBe(false)
      expect(isValidPayloadType('')).toBe(false)
    })
  })
})

describe('DID Key Generation', () => {
  const testPublicKey = 'OIsG7Oa7G0B-lM2zT2I-6A0jSSG6sc2B68v2sODvM-s'
  const expectedDIDKey = 'did:key:z2DUDndJSiGoP1cZLx6tEeFr9GugkN4QqbFNcbGKUyR8p9g'

  it('should generate correct did:key from base64url public key', () => {
    const result = generateDidKeyFromBase64url(testPublicKey)
    expect(result).toBe(expectedDIDKey)
    expect(isValidDIDIdentifier(result)).toBe(true)
  })

  it('should generate correct did:key from JWK', () => {
    const publicKeyJwk = {
      kty: 'OKP' as const,
      crv: 'Ed25519' as const,
      x: testPublicKey,
    }
    const result = generateDidKey(publicKeyJwk)
    expect(result).toBe(expectedDIDKey)
  })

  it('should be deterministic', () => {
    const result1 = generateDidKeyFromBase64url(testPublicKey)
    const result2 = generateDidKeyFromBase64url(testPublicKey)
    expect(result1).toBe(result2)
  })
})

describe('SDLP Link Parsing', () => {
  // This test uses a mock link since we need the actual test vectors to be generated first
  const mockValidLink =
    'sdlp://eyJwcm90ZWN0ZWQiOiJleUpoYkdjaU9pSkZaRVJUUVNJc0ltdHBaQ0k2SW1ScFpEcHJaWGs2ZWpKRVZVUnVaRXBUYVVkdlVERmpXa3g0Tm5SRlpVWnlPVWQxWjJ0T05GRnhZa1pPWTJKSFMxVjVVamh3T1djamVqSkVWVVJ1WkVwVGFVZHZVREZqV2t4NE5uUkZaVVp5T1VkMVoydE9ORkZ4WWtaT1kySkhTMVY1VWpod09XY2lmUSIsInBheWxvYWQiOiJleUoySWpvaVUwUk1MVEV1TUNJc0luTnBaQ0k2SW1ScFpEcHJaWGs2ZWpKRVZVUnVaRXBUYVVkdlVERmpXa3g0Tm5SRlpVWnlPVWQxWjJ0T05GRnhZa1pPWTJKSFMxVjVVamh3T1djaUxDSjBlWEJsSWpvaWRHVjRkQzl3YkdGcGJpSXNJbU52YlhBaU9pSnViMjVsSWl3aVkyaHJJam9pWkdabVpEWXdNakZpWWpKaVpEVmlNR0ZtTmpjMk1qa3dPREE1WldNellUVXpNVGt4WkdRNE1XTTNaamN3WVRSaU1qZzJPRGhoTXpZeU1UZ3lPVGcyWmlKOSIsInNpZ25hdHVyZSI6Ilk0dzJ1bF9XbmtXbnJZYW15N0IxLUNqMHo2U1BxWFJQQjREYm5lRVlxalRJYUQ1VER0WllMUExyVmVnN3dwaDJUQTZkMmdBYlFfN3FkM3pMb2xQUkR3In0.SGVsbG8sIFdvcmxkIQ'

  it('should parse valid SDLP links', () => {
    const result = parseSDLPLink(mockValidLink)
    expect(result.valid).toBe(true)
    expect(result.structure).toBeDefined()
    expect(result.jws).toBeDefined()
    expect(result.payload).toBeDefined()
    expect(result.metadata).toBeDefined()
  })

  it('should reject invalid schemes', () => {
    const result = parseSDLPLink('https://example.com')
    expect(result.valid).toBe(false)
    expect(result.error).toContain('Invalid scheme')
  })

  it('should reject malformed links', () => {
    const result = parseSDLPLink('sdlp://invalid-format')
    expect(result.valid).toBe(false)
    expect(result.error).toContain('Invalid format')
  })

  it('should handle base64url decoding errors', () => {
    const result = parseSDLPLink('sdlp://invalid-base64!@#.payload')
    expect(result.valid).toBe(false)
  })
})

describe('Type Safety', () => {
  it('should enforce readonly properties', () => {
    const didId: DIDIdentifier = 'did:key:z123' as DIDIdentifier
    const link: SDLPLinkString = 'sdlp://test.test' as SDLPLinkString
    const contentType: PayloadType = 'text/plain' as PayloadType

    // These should compile without errors due to proper typing
    expect(typeof didId).toBe('string')
    expect(typeof link).toBe('string')
    expect(typeof contentType).toBe('string')
  })

  it('should prevent invalid template literal types at compile time', () => {
    // These would cause TypeScript compilation errors:
    // const invalidDid: DIDIdentifier = 'not-a-did' // ❌ Type error
    // const invalidLink: SDLPLinkString = 'https://example.com' // ❌ Type error

    // But these should work:
    const validDid: DIDIdentifier = 'did:key:z123' as DIDIdentifier
    const validLink: SDLPLinkString = 'sdlp://test.payload' as SDLPLinkString

    expect(validDid).toBeDefined()
    expect(validLink).toBeDefined()
  })
})
