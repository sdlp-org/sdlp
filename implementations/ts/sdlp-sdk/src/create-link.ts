/**
 * Create Link functionality for SDLP
 */

import { sha256 } from "@noble/hashes/sha256";
import { FlattenedSign, importJWK, type JWK } from "jose";
import type {
  CreateLinkParams as CreateLinkParameters,
  CoreMetadata,
  JWSProtectedHeader,
} from "./types.js";

/**
 * Creates and signs a Secure Deep Link
 */
export async function createLink(
  params: CreateLinkParameters,
): Promise<string> {
  const { payload, payloadType, signer, compress = "none", expiresIn } = params;

  // 1. Validate input
  if (!isValidDidUrl(signer.kid)) {
    throw new Error(`Invalid kid format: ${signer.kid}`);
  }

  // 2. Calculate SHA-256 checksum of the original payload
  const payloadHash = sha256(payload);
  const chk = Buffer.from(payloadHash).toString("hex");

  // 3. Compress the payload (for MVP, we only support 'none')
  let compressedPayload: Uint8Array;
  if (compress === "none") {
    compressedPayload = payload;
  } else {
    // TODO: Implement Brotli compression
    throw new Error("Brotli compression not yet implemented");
  }

  // 4. Base64URL encode the compressed payload
  const encodedPayload = base64urlEncode(compressedPayload);

  // 5. Extract sender DID from kid
  const sid = extractDidFromKid(signer.kid);

  // 6. Construct the Core Metadata
  const coreMetadata: CoreMetadata = {
    v: "SDL-1.0",
    sid,
    type: payloadType,
    comp: compress,
    chk,
  };

  // Add optional expiration
  if (expiresIn !== undefined) {
    coreMetadata.exp = Math.floor(Date.now() / 1000) + expiresIn;
  }

  // 7. Construct the JWS Protected Header
  const protectedHeader: JWSProtectedHeader = {
    alg: "EdDSA",
    kid: signer.kid,
  };

  // 8. Create and sign the JWS using Flattened JSON Serialization
  const jws = await new FlattenedSign(
    new TextEncoder().encode(JSON.stringify(coreMetadata)),
  )
    .setProtectedHeader(protectedHeader)
    .sign(await importPrivateKey(signer.privateKeyJwk));

  // 9. Base64URL encode the JWS object
  const encodedJws = base64urlEncode(
    new TextEncoder().encode(JSON.stringify(jws)),
  );

  // 10. Assemble the final SDLP link
  return `sdlp://${encodedJws}.${encodedPayload}`;
}

/**
 * Validates if a string is a valid DID URL
 */
function isValidDidUrl(kid: string): boolean {
  // Basic validation for DID URL format: did:method:identifier#fragment
  const didUrlPattern = /^did:[a-z0-9]+:[a-zA-Z0-9._-]+#[a-zA-Z0-9._-]+$/;
  return didUrlPattern.test(kid);
}

/**
 * Extracts the DID from a kid (key identifier) URL
 */
function extractDidFromKid(kid: string): string {
  const hashIndex = kid.indexOf("#");
  if (hashIndex === -1) {
    throw new Error(`Invalid kid format: ${kid}`);
  }
  return kid.substring(0, hashIndex);
}

/**
 * Base64URL encode a Uint8Array
 */
function base64urlEncode(data: Uint8Array): string {
  return Buffer.from(data)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

/**
 * Import a private key from JWK format for use with jose
 */
async function importPrivateKey(jwk: Record<string, unknown>) {
  return await importJWK(jwk as unknown as JWK, "EdDSA");
}
