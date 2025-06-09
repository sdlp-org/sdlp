/**
 * DID Resolution module for resolving DIDs to their verification methods
 */

import bs58 from "bs58";

// Import fetch for Node.js compatibility
const fetch = globalThis.fetch;

/**
 * DID Document structure
 */
export interface DidDocument {
  "@context"?: string | string[];
  id: string;
  verificationMethod?: VerificationMethod[];
  authentication?: (string | VerificationMethod)[];
}

/**
 * Verification method in a DID document
 */
export interface VerificationMethod {
  id: string;
  type: string;
  controller: string;
  publicKeyJwk?: Record<string, unknown>;
  publicKeyMultibase?: string;
}

/**
 * Result of DID resolution
 */
export interface DidResolutionResult {
  didDocument: DidDocument | null;
  didDocumentMetadata: Record<string, unknown>;
  didResolutionMetadata: {
    error?: string;
    contentType?: string;
  };
}

/**
 * Resolves a DID to extract the public key for verification
 */
export async function resolveDid(
  did: string,
): Promise<Record<string, unknown> | null> {
  try {
    if (did.startsWith("did:key:")) {
      return resolveDidKey(did);
    } else if (did.startsWith("did:web:")) {
      return await resolveDidWeb(did);
    } else {
      throw new Error(`Unsupported DID method: ${did}`);
    }
  } catch (error) {
    // Only log errors for non-test domains
    if (!did.includes("acme.example") && !did.includes(".example")) {
      console.warn(`Failed to resolve DID ${did}:`, error);
    }
    return null;
  }
}

/**
 * Resolves a did:key identifier to extract the public key
 */
function resolveDidKey(did: string): Record<string, unknown> | null {
  try {
    // Extract the multibase encoded key from the DID
    const keyPart = did.replace("did:key:", "");

    // For did:key, we need to decode the multibase + multicodec format
    // This is a simplified implementation for Ed25519 keys
    if (!keyPart.startsWith("z")) {
      throw new Error("did:key must use base58btc encoding (z prefix)");
    }

    const decoded = bs58.decode(keyPart.slice(1)); // Remove 'z' prefix

    // Check for Ed25519 multicodec prefix (0xed)
    if (decoded.length < 33 || decoded[0] !== 0xed) {
      throw new Error("Unsupported key type in did:key");
    }

    // Extract the 32-byte Ed25519 public key
    const publicKeyBytes = decoded.slice(1, 33);

    // Convert to base64url for JWK format
    const base64url = (bytes: Uint8Array): string => {
      return Buffer.from(bytes)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "");
    };

    return {
      kty: "OKP",
      crv: "Ed25519",
      x: base64url(publicKeyBytes),
    };
  } catch (error) {
    console.warn(`Failed to parse did:key ${did}:`, error);
    return null;
  }
}

/**
 * Resolves a did:web identifier by fetching the DID document
 */
async function resolveDidWeb(
  did: string,
): Promise<Record<string, unknown> | null> {
  try {
    // Extract domain from did:web:domain format
    const domain = did.replace("did:web:", "");

    // Handle test domains gracefully in test environments
    if (domain === "acme.example" || domain.endsWith(".example")) {
      return null; // Fail silently for test domains
    }

    // Construct the URL for the DID document
    const url = `https://${domain}/.well-known/did.json`;

    // Fetch the DID document with security constraints
    const response = await fetch(url, {
      method: "GET",
      redirect: "error", // Do not follow redirects for security
      headers: {
        Accept: "application/json",
        "User-Agent": "sdlp-sdk/0.1.0",
      },
      // Set a reasonable timeout
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const didDocument = (await response.json()) as DidDocument;

    // Validate the DID document
    if (didDocument.id !== did) {
      throw new Error(
        `DID document id mismatch: expected ${did}, got ${didDocument.id}`,
      );
    }

    // Extract the first verification method with a public key
    const verificationMethods = didDocument.verificationMethod ?? [];
    for (const method of verificationMethods) {
      if (method.publicKeyJwk) {
        // Validate that this is an Ed25519 key
        if (
          method.publicKeyJwk.kty === "OKP" &&
          method.publicKeyJwk.crv === "Ed25519"
        ) {
          return method.publicKeyJwk;
        }
      }
    }

    throw new Error("No compatible verification method found in DID document");
  } catch (error) {
    // Only log errors for non-test domains
    const domain = did.replace("did:web:", "");
    if (!domain.endsWith(".example")) {
      console.warn(`Failed to resolve did:web ${did}:`, error);
    }
    return null;
  }
}

/**
 * Extracts the DID from a kid (key identifier) URL
 */
export function extractDidFromKid(kid: string): string {
  // kid format: "did:method:identifier#key-id"
  const hashIndex = kid.indexOf("#");
  if (hashIndex === -1) {
    throw new Error(`Invalid kid format: ${kid}`);
  }
  return kid.substring(0, hashIndex);
}
