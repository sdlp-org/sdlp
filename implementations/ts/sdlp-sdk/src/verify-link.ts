/**
 * Verification functionality for SDLP
 */

import { sha256 } from "@noble/hashes/sha256";
import { importJWK, type JWK } from "jose";
import { resolveDid, extractDidFromKid } from "./did-resolver.js";
import type {
  VerificationResult,
  CoreMetadata,
  JWSProtectedHeader,
} from "./types.js";

type VerificationResultUnion = VerificationResult;

/**
 * Interface for JWS Flattened JSON Serialization
 */
interface JWSFlattenedFormat {
  protected: string;
  payload: string;
  signature: string;
}

/**
 * Verifies a Secure Deep Link
 */
export async function verifyLink(
  link: string,
): Promise<VerificationResultUnion> {
  try {
    // 1. Parse the SDLP link format
    const parseResult = parseSDLPLink(link);
    if (!parseResult) {
      return {
        valid: false,
        error: "INVALID_LINK_FORMAT",
        details: "Invalid SDLP link format",
      };
    }

    const { jwsToken, encodedPayload } = parseResult;

    // 2. Decode and parse the JWS to extract metadata
    let coreMetadata: CoreMetadata;
    let protectedHeader: JWSProtectedHeader;
    let jwsObject: JWSFlattenedFormat;

    try {
      // Decode the JWS object (Flattened JSON Serialization)
      const jwsJson = base64urlDecode(jwsToken);
      jwsObject = JSON.parse(
        new TextDecoder().decode(jwsJson),
      ) as JWSFlattenedFormat;

      // Decode the protected header
      const headerJson = base64urlDecode(jwsObject.protected);
      protectedHeader = JSON.parse(
        new TextDecoder().decode(headerJson),
      ) as JWSProtectedHeader;

      // Decode the payload (core metadata)
      const payloadJson = base64urlDecode(jwsObject.payload);
      coreMetadata = JSON.parse(
        new TextDecoder().decode(payloadJson),
      ) as CoreMetadata;
    } catch (error) {
      return {
        valid: false,
        error: "INVALID_LINK_FORMAT",
        details: `Failed to parse JWS: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }

    // 3. Validate time bounds
    const now = Math.floor(Date.now() / 1000);
    if (typeof coreMetadata.exp === "number" && now > coreMetadata.exp) {
      return {
        valid: false,
        error: "LINK_EXPIRED",
        details: `Link expired at ${new Date(coreMetadata.exp * 1000).toISOString()}`,
      };
    }

    if (typeof coreMetadata.nbf === "number" && now < coreMetadata.nbf) {
      return {
        valid: false,
        error: "LINK_EXPIRED",
        details: `Link not valid before ${new Date(coreMetadata.nbf * 1000).toISOString()}`,
      };
    }

    // 4. DID Resolution
    const signerDid = extractDidFromKid(protectedHeader.kid);

    // Validate that the kid DID matches the sid
    if (signerDid !== coreMetadata.sid) {
      return {
        valid: false,
        error: "INVALID_SIGNATURE",
        details: `Kid DID (${signerDid}) does not match sid (${coreMetadata.sid})`,
      };
    }

    const publicKey = await resolveDid(signerDid);
    if (!publicKey) {
      return {
        valid: false,
        error: "DID_RESOLUTION_FAILED",
        details: `Failed to resolve DID: ${signerDid}`,
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
        // TODO: Implement Brotli decompression
        return {
          valid: false,
          error: "UNSUPPORTED_COMPRESSION",
          details: "Brotli compression not yet implemented",
        };
      } else {
        return {
          valid: false,
          error: "UNSUPPORTED_COMPRESSION",
          details: `Unsupported compression algorithm: ${String(coreMetadata.comp)}`,
        };
      }
    } catch (error) {
      return {
        valid: false,
        error: "INVALID_LINK_FORMAT",
        details: `Failed to decode payload: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }

    // 6. Checksum verification (check before signature to detect payload tampering)
    const calculatedHash = sha256(originalPayload);
    const calculatedChk = Buffer.from(calculatedHash).toString("hex");

    if (calculatedChk !== coreMetadata.chk) {
      return {
        valid: false,
        error: "PAYLOAD_CHECKSUM_MISMATCH",
        details: `Expected checksum ${coreMetadata.chk}, got ${calculatedChk}`,
      };
    }

    // 7. JWS Verification (signature check last, after payload validation)
    try {
      const cryptoKey = await importJWK(publicKey as unknown as JWK, "EdDSA");

      // Verify the Flattened JSON Serialization JWS directly
      const jose = await import("jose");
      await jose.flattenedVerify(jwsObject, cryptoKey);
    } catch (error) {
      return {
        valid: false,
        error: "INVALID_SIGNATURE",
        details: `JWS verification failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }

    // 8. Return successful verification result
    return {
      valid: true,
      payload: originalPayload,
      payloadType: coreMetadata.type,
      metadata: {
        signerDid: coreMetadata.sid,
        keyId: protectedHeader.kid,
        version: coreMetadata.v,
        expiration: coreMetadata.exp ?? undefined,
        notBefore: coreMetadata.nbf ?? undefined,
      },
    };
  } catch (error) {
    return {
      valid: false,
      error: "INVALID_LINK_FORMAT",
      details: `Unexpected error: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Parse an SDLP link into its components
 */
function parseSDLPLink(
  link: string,
): { jwsToken: string; encodedPayload: string } | null {
  // Expected format: sdlp://<jws>.<payload>
  if (!link.startsWith("sdlp://")) {
    return null;
  }

  const content = link.slice(7); // Remove 'sdlp://' prefix
  const dotIndex = content.lastIndexOf("."); // Find the last dot to split JWS and payload

  if (dotIndex === -1) {
    return null;
  }

  const jwsToken = content.slice(0, dotIndex);
  const encodedPayload = content.slice(dotIndex + 1);

  if (!jwsToken || !encodedPayload) {
    return null;
  }

  return { jwsToken, encodedPayload };
}

/**
 * Base64URL decode a string to Uint8Array
 */
function base64urlDecode(data: string): Uint8Array {
  // Add padding if needed
  const padded = data + "=".repeat((4 - (data.length % 4)) % 4);
  // Convert base64url to base64
  const base64 = padded.replace(/-/g, "+").replace(/_/g, "/");
  return new Uint8Array(Buffer.from(base64, "base64"));
}
