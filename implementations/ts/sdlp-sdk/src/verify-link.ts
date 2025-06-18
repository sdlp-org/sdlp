/**
 * Verification functionality for SDLP v1.0
 */

import { sha256 } from "@noble/hashes/sha256";
import { Resolver } from "did-resolver";
import { importJWK, type JWK, flattenedVerify } from "jose";
import { getResolver as getKeyResolver } from "key-did-resolver";
import { getResolver as getWebResolver } from "web-did-resolver";
import {
  SdlpError,
  DIDMismatchError,
  InvalidJWSFormatError,
  InvalidSignatureError,
  PayloadChecksumMismatchError,
  LinkExpiredError,
  LinkNotYetValidError,
  UnsupportedCompressionError,
  DIDResolutionError,
  InvalidLinkFormatError,
  type VerificationResult,
  type VerifyOptions,
  type CoreMetadata,
  type JWSProtectedHeader,
  type DIDDocument,
} from "./types.js";

/**
 * Interface for JWS Flattened JSON Serialization
 */
interface JWSFlattenedFormat {
  protected: string;
  payload: string;
  signature: string;
}

/**
 * Default DID resolver instance with key and web method support
 */
const createDefaultResolver = (): Resolver => {
  return new Resolver({
    ...getKeyResolver(),
    ...getWebResolver(),
  });
};

/**
 * Extracts the base DID from a kid (key identifier) URL
 * @param kid - The key identifier URL (e.g., "did:web:example.com#key-1")
 * @returns The base DID (e.g., "did:web:example.com")
 */
function extractDidFromKid(kid: string): string {
  const hashIndex = kid.indexOf("#");
  if (hashIndex === -1) {
    throw new Error(`Invalid kid format: ${kid}`);
  }
  return kid.substring(0, hashIndex);
}

/**
 * Verifies a Secure Deep Link according to SDLP v1.0 specification.
 * 
 * This function performs comprehensive verification of an SDLP link including:
 * - Link format validation and parsing
 * - JWS signature verification using the sender's public key
 * - DID resolution and key validation
 * - Payload integrity verification (checksum)
 * - Time bounds validation (expiration and not-before)
 * - Payload decompression and size limits
 * 
 * @param link - The SDLP link string to verify (e.g., "sdlp://...")
 * @param options - Verification options and configuration
 * @param options.resolver - Custom DID resolver (defaults to did:key and did:web support)
 * @param options.allowedAlgorithms - Allowed signature algorithms (defaults to ['EdDSA'])
 * @param options.maxPayloadSize - Maximum decompressed payload size in bytes (defaults to 10MB)
 * 
 * @returns A promise that resolves to a VerificationResult discriminated union:
 *   - On success: `{ valid: true, sender, payload, metadata, didDocument? }`
 *   - On failure: `{ valid: false, error }`
 * 
 * @example
 * ```typescript
 * import { verifyLink } from '@sdlp/sdk';
 * 
 * const result = await verifyLink('sdlp://eyJ0eXAiOiJKV1QiLCJhbGciOiJFZERTQSJ9...');
 * 
 * if (result.valid) {
 *   console.log('Verified sender:', result.sender);
 *   console.log('Payload:', new TextDecoder().decode(result.payload));
 *   console.log('Content type:', result.metadata.type);
 * } else {
 *   console.error('Verification failed:', result.error.message);
 *   console.error('Error code:', result.error.code);
 * }
 * ```
 */
export async function verifyLink(
  link: string,
  options: VerifyOptions = {},
): Promise<VerificationResult> {
  try {
    // Extract options with defaults
    const {
      resolver = createDefaultResolver(),
      allowedAlgorithms = ['EdDSA'],
      maxPayloadSize = 10 * 1024 * 1024, // 10MB default
    } = options;

    // 1. Parse the SDLP link format - split by first '.' separator
    const parseResult = parseSDLPLink(link);
    if (!parseResult) {
      return {
        valid: false,
        error: new InvalidLinkFormatError("Invalid SDLP link format - missing scheme or dot separator"),
      };
    }

    const { jwsToken, encodedPayload } = parseResult;

    // 2. Decode and parse the JWS Flattened JSON Serialization format
    let coreMetadata: CoreMetadata;
    let protectedHeader: JWSProtectedHeader;
    let jwsObject: JWSFlattenedFormat;

    try {
      // Decode the JWS object (must be Flattened JSON Serialization)
      const jwsJson = base64urlDecode(jwsToken);
      const jwsString = new TextDecoder().decode(jwsJson);
      jwsObject = JSON.parse(jwsString) as JWSFlattenedFormat;

      // Validate JWS structure
      if (
        typeof jwsObject.protected !== 'string' || jwsObject.protected.length === 0 ||
        typeof jwsObject.payload !== 'string' || jwsObject.payload.length === 0 ||
        typeof jwsObject.signature !== 'string' || jwsObject.signature.length === 0
      ) {
        return {
          valid: false,
          error: new InvalidJWSFormatError("Missing required JWS fields (protected, payload, signature)"),
        };
      }

      // Decode the protected header
      const headerJson = base64urlDecode(jwsObject.protected);
      protectedHeader = JSON.parse(
        new TextDecoder().decode(headerJson),
      ) as JWSProtectedHeader;

  // Validate algorithm is in allowed list
  if (typeof protectedHeader.alg !== 'string' || !allowedAlgorithms.includes(protectedHeader.alg)) {
    return {
      valid: false,
      error: new InvalidSignatureError(`Algorithm '${protectedHeader.alg ?? 'undefined'}' is not in allowed list: ${allowedAlgorithms.join(', ')}`),
    };
  }

      // Decode the payload (core metadata)
      const payloadJson = base64urlDecode(jwsObject.payload);
      coreMetadata = JSON.parse(
        new TextDecoder().decode(payloadJson),
      ) as CoreMetadata;
    } catch (error) {
      if (error instanceof SdlpError) {
        return {
          valid: false,
          error,
        };
      }
      return {
        valid: false,
        error: new InvalidJWSFormatError(`Failed to parse JWS: ${error instanceof Error ? error.message : "Unknown error"}`),
      };
    }

    // 3. Validate time bounds
    const now = Math.floor(Date.now() / 1000);
    if (typeof coreMetadata.exp === "number" && now > coreMetadata.exp) {
      return {
        valid: false,
        error: new LinkExpiredError(coreMetadata.exp),
      };
    }

    if (typeof coreMetadata.nbf === "number" && now < coreMetadata.nbf) {
      return {
        valid: false,
        error: new LinkNotYetValidError(coreMetadata.nbf),
      };
    }

    // 4. DID Resolution and Validation
    // Extract base DID from kid (everything before the '#')
    const kidBaseDid = extractDidFromKid(protectedHeader.kid);

    // Validate that the base DID of kid matches the sid
    if (kidBaseDid !== coreMetadata.sid) {
      return {
        valid: false,
        error: new DIDMismatchError(coreMetadata.sid, kidBaseDid),
      };
    }

    // Resolve the DID document
    let didDocument: DIDDocument;
    try {
      const result = await resolver.resolve(coreMetadata.sid);
      if (!result.didDocument) {
        return {
          valid: false,
          error: new DIDResolutionError(coreMetadata.sid, result.didResolutionMetadata.error ?? "No DID document returned"),
        };
      }
      didDocument = result.didDocument;
    } catch (error) {
      return {
        valid: false,
        error: new DIDResolutionError(coreMetadata.sid, error instanceof Error ? error.message : "Unknown error"),
      };
    }

    // Find the verification method specified by kid
    const keyId = protectedHeader.kid;
    const verificationMethod = didDocument.verificationMethod?.find(vm => vm.id === keyId);
    if (!verificationMethod) {
      return {
        valid: false,
        error: new DIDResolutionError(coreMetadata.sid, `Key '${keyId}' not found in DID document`),
      };
    }

    // Extract public key
    let publicKey: Record<string, unknown>;
    if (verificationMethod.publicKeyJwk) {
      publicKey = verificationMethod.publicKeyJwk;
    } else if (verificationMethod.publicKeyBase58 && verificationMethod.type === "Ed25519VerificationKey2018") {
      // Convert publicKeyBase58 to JWK format for Ed25519 keys
      const base58Key = verificationMethod.publicKeyBase58;
      try {
        // Decode base58 to get the raw public key bytes
        const bs58 = await import("bs58");
        const keyBytes = bs58.default.decode(base58Key);

        // Convert to base64url for JWK format
        const base64url = Buffer.from(keyBytes)
          .toString("base64")
          .replace(/\+/g, "-")
          .replace(/\//g, "_")
          .replace(/=/g, "");

        publicKey = {
          kty: "OKP",
          crv: "Ed25519",
          x: base64url,
        };
      } catch (error) {
        return {
          valid: false,
          error: new DIDResolutionError(coreMetadata.sid, `Failed to convert publicKeyBase58 to JWK: ${error instanceof Error ? error.message : "Unknown error"}`),
        };
      }
    } else {
      return {
        valid: false,
        error: new DIDResolutionError(coreMetadata.sid, `Verification method '${keyId}' does not contain publicKeyJwk or supported publicKeyBase58`),
      };
    }

    // 5. Payload decompression and integrity check (check this before signature to detect tampering)
    let originalPayload: Uint8Array;

    try {
      // Decode the payload
      const compressedPayload = base64urlDecode(encodedPayload);

      // Decompress based on compression algorithm
      if (coreMetadata.comp === "none") {
        originalPayload = compressedPayload;
      } else if (coreMetadata.comp === "br") {
        // Brotli decompression using cross-platform utility
        const { decompressBrotli } = await import("./compression.js");
        originalPayload = await decompressBrotli(compressedPayload);
      } else {
        return {
          valid: false,
          error: new UnsupportedCompressionError(String(coreMetadata.comp)),
        };
      }

      // Check payload size limits
      if (originalPayload.length > maxPayloadSize) {
        return {
          valid: false,
          error: new InvalidLinkFormatError(`Decompressed payload size (${originalPayload.length}) exceeds maximum allowed size (${maxPayloadSize})`),
        };
      }
    } catch (error) {
      if (error instanceof SdlpError) {
        return {
          valid: false,
          error,
        };
      }
      return {
        valid: false,
        error: new InvalidLinkFormatError(`Failed to decode/decompress payload: ${error instanceof Error ? error.message : "Unknown error"}`),
      };
    }

    // 6. Checksum verification (check before signature to detect payload tampering)
    const calculatedHash = sha256(originalPayload);
    const calculatedChk = Buffer.from(calculatedHash).toString("hex");

    if (calculatedChk !== coreMetadata.chk) {
      return {
        valid: false,
        error: new PayloadChecksumMismatchError(coreMetadata.chk, calculatedChk),
      };
    }

    // 7. JWS Verification (signature check last, after payload validation)
    try {
      const cryptoKey = await importJWK(publicKey as unknown as JWK, protectedHeader.alg);

      // Verify the Flattened JSON Serialization JWS directly
      await flattenedVerify(jwsObject, cryptoKey);
    } catch (error) {
      return {
        valid: false,
        error: new InvalidSignatureError(error instanceof Error ? error.message : "Unknown error"),
      };
    }

    // 8. Return successful verification result
    return {
      valid: true,
      sender: coreMetadata.sid,
      payload: originalPayload,
      metadata: coreMetadata,
      didDocument,
    };
  } catch (error) {
    return {
      valid: false,
      error: new InvalidLinkFormatError(`Unexpected error: ${error instanceof Error ? error.message : "Unknown error"}`),
    };
  }
}

/**
 * Parse an SDLP link into its components
 * Must split by exactly one '.' delimiter as specified in the v1.0 specification
 * Enforces strict two-part structure to prevent security vulnerabilities
 */
function parseSDLPLink(
  link: string,
): { jwsToken: string; encodedPayload: string } | null {
  // Expected format: sdlp://<jws>.<payload>
  if (!link.startsWith("sdlp://")) {
    return null;
  }

  const content = link.slice(7); // Remove 'sdlp://' prefix
  const parts = content.split('.');

  // A valid link MUST consist of exactly two parts
  if (parts.length !== 2) {
    return null;
  }

  const jwsToken = parts[0];
  const encodedPayload = parts[1];

  // Both parts must be non-empty and defined
  if (
    typeof jwsToken !== 'string' || jwsToken.length === 0 ||
    typeof encodedPayload !== 'string' || encodedPayload.length === 0
  ) {
    return null;
  }

  // Additionally, ensure the payload contains only valid Base64URL characters
  const base64UrlRegex = /^[a-zA-Z0-9_-]+$/;
  if (!base64UrlRegex.test(encodedPayload)) {
    return null;
  }

  return { jwsToken, encodedPayload };
}

/**
 * Base64URL decode a string to Uint8Array
 * Strict implementation that validates the input is properly formed Base64URL
 */
function base64urlDecode(data: string): Uint8Array {
  // Validate that the input contains only valid Base64URL characters
  const base64UrlRegex = /^[a-zA-Z0-9_-]*$/;
  if (!base64UrlRegex.test(data)) {
    throw new Error("Invalid Base64URL characters");
  }

  // Add padding if needed
  const padded = data + "=".repeat((4 - (data.length % 4)) % 4);
  // Convert base64url to base64
  const base64 = padded.replace(/-/g, "+").replace(/_/g, "/");
  
  // Use a more strict approach to validate the Base64 data
  try {
    const buffer = Buffer.from(base64, "base64");
    // Verify that the decoded data, when re-encoded, matches the original
    const reencoded = buffer.toString("base64");
    if (reencoded !== base64) {
      throw new Error("Invalid Base64URL data");
    }
    return new Uint8Array(buffer);
  } catch (error) {
    throw new Error(`Failed to decode Base64URL: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
