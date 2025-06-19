#!/usr/bin/env node

/**
 * SDLP Link Parser and Inspector
 *
 * Utility to parse and inspect SDLP links for debugging and development
 * Shows the decoded structure without verification
 *
 * Usage:
 *   tsx parse-sdlp-link.ts <sdlp-link>
 *   tsx parse-sdlp-link.ts --help
 *   npm run parse-link -- <sdlp-link>
 *   npm run parse-link -- --help
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { base64urlDecode } from './generate-test-vectors.js';
import type {
  SDLPLinkString,
  ParsedSDLPLink,
  JWSCompactSerialization,
  JWSProtectedHeader,
  SDLPCoreMetadata,
  SDLPTestVectorSuite,
} from '../src/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function parseSDLPLink(link: string): ParsedSDLPLink {
  try {
    // Step 1: Validate scheme
    if (!link.startsWith('sdlp://')) {
      throw new Error('Invalid scheme. Expected sdlp://');
    }

    // Step 2: Split into JWS and payload parts
    const content = link.substring(7); // Remove 'sdlp://'
    const dotIndex = content.indexOf('.');
    if (dotIndex === -1) {
      throw new Error('Invalid format. Expected JWS.payload');
    }

    const jwsPart = content.substring(0, dotIndex);
    const payloadPart = content.substring(dotIndex + 1);

    // Step 3: Decode JWS metadata
    const jwsDecoded = base64urlDecode(jwsPart);
    const jwsObject = JSON.parse(
      jwsDecoded.toString()
    ) as JWSCompactSerialization;

    // Step 4: Decode JWS components
    const protectedHeader = JSON.parse(
      base64urlDecode(jwsObject.protected).toString()
    ) as JWSProtectedHeader;
    const coreMetadata = JSON.parse(
      base64urlDecode(jwsObject.payload).toString()
    ) as SDLPCoreMetadata;

    // Step 5: Decode payload
    const payloadDecoded = base64urlDecode(payloadPart);

    // Step 6: Try to decode payload as text (might fail for binary)
    let payloadText: string | null = null;
    try {
      payloadText = payloadDecoded.toString('utf8');
    } catch {
      // Payload might be binary
    }

    return {
      valid: true,
      structure: {
        scheme: 'sdlp',
        jwsPart: {
          length: jwsPart.length,
          decoded: jwsObject,
        },
        payloadPart: {
          length: payloadPart.length,
          sizeBytes: payloadDecoded.length,
        },
      },
      jws: {
        protectedHeader,
        coreMetadata,
        signatureLength: jwsObject.signature.length,
      },
      payload: {
        raw: payloadDecoded,
        text: payloadText,
        encoding: coreMetadata.comp,
      },
      metadata: {
        version: coreMetadata.v,
        senderDid: coreMetadata.sid,
        payloadType: coreMetadata.type,
        compression: coreMetadata.comp,
        checksum: coreMetadata.chk,
        expiration: coreMetadata.exp
          ? new Date(coreMetadata.exp * 1000).toISOString()
          : null,
        notBefore: coreMetadata.nbf
          ? new Date(coreMetadata.nbf * 1000).toISOString()
          : null,
      },
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      structure: undefined,
    };
  }
}

export function formatParsedLink(parsed: ParsedSDLPLink): void {
  if (!parsed.valid) {
    console.log('❌ Invalid SDLP Link');
    console.log(`Error: ${parsed.error}`);
    return;
  }

  if (!parsed.structure || !parsed.jws || !parsed.payload || !parsed.metadata) {
    console.log('❌ Invalid parsed link structure');
    return;
  }

  console.log('✅ Valid SDLP Link Structure\n');

  // Link structure
  console.log('📋 Link Structure:');
  console.log(`  Scheme: ${parsed.structure.scheme}://`);
  console.log(`  JWS Part: ${parsed.structure.jwsPart.length} characters`);
  console.log(
    `  Payload Part: ${parsed.structure.payloadPart.length} characters`
  );
  console.log(
    `  Total Length: ${parsed.structure.jwsPart.length + parsed.structure.payloadPart.length + 8} characters\n`
  );

  // JWS Information
  console.log('🔐 JWS Information:');
  console.log(`  Algorithm: ${parsed.jws.protectedHeader.alg}`);
  console.log(`  Key ID: ${parsed.jws.protectedHeader.kid}`);
  console.log(`  Signature Length: ${parsed.jws.signatureLength} characters\n`);

  // Core Metadata
  console.log('📊 Core Metadata:');
  console.log(`  Protocol Version: ${parsed.metadata.version}`);
  console.log(`  Sender DID: ${parsed.metadata.senderDid}`);
  console.log(`  Payload Type: ${parsed.metadata.payloadType}`);
  console.log(`  Compression: ${parsed.metadata.compression}`);
  console.log(`  Checksum: ${parsed.metadata.checksum}`);
  if (parsed.metadata.expiration) {
    console.log(`  Expires: ${parsed.metadata.expiration}`);
  }
  if (parsed.metadata.notBefore) {
    console.log(`  Not Before: ${parsed.metadata.notBefore}`);
  }
  console.log();

  // Payload Information
  console.log('📦 Payload Information:');
  console.log(`  Size: ${parsed.payload.raw.length} bytes`);
  console.log(`  Encoding: ${parsed.payload.encoding}`);
  if (parsed.payload.text && parsed.payload.text.length < 200) {
    console.log(`  Content: "${parsed.payload.text}"`);
  } else if (parsed.payload.text) {
    console.log(`  Content: "${parsed.payload.text.substring(0, 100)}..."`);
  } else {
    console.log(`  Content: [Binary data]`);
  }
  console.log();

  // Warnings and notes
  console.log('⚠️  Notes:');
  console.log(
    '  - This parser only shows structure, it does NOT verify signatures'
  );
  console.log(
    '  - Use a proper SDLP verifier to validate authenticity and integrity'
  );
  if (parsed.metadata.expiration) {
    const now = new Date();
    const exp = new Date(parsed.metadata.expiration);
    if (exp < now) {
      console.log('  - ⚠️  Link appears to be expired');
    }
  }
}

function loadTestVector(): SDLPLinkString {
  try {
    const vectorsPath = path.join(__dirname, '..', 'mvp-test-vectors.json');
    const vectorsData = fs.readFileSync(vectorsPath, 'utf8');
    const vectors = JSON.parse(vectorsData) as SDLPTestVectorSuite;

    if (vectors.length === 0) {
      throw new Error('No test vectors found');
    }

    const firstVector = vectors[0];
    if (!firstVector) {
      throw new Error('No test vectors found in file');
    }
    return firstVector.link;
  } catch (error) {
    throw new Error(
      `Error loading test vectors: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log(`
SDLP Link Parser and Inspector

Usage:
  tsx parse-sdlp-link.ts <sdlp-link>
  tsx parse-sdlp-link.ts --test
  npm run parse-link -- <sdlp-link>
  npm run parse-link -- --test

Options:
  --test    Parse a test vector link
  --help    Show this help message

Examples:
  tsx parse-sdlp-link.ts "sdlp://eyJwcm90ZWN0ZWQi..."
  tsx parse-sdlp-link.ts --test
  npm run parse-link -- --test

Note:
  This tool only parses the link structure and does NOT verify
  cryptographic signatures. Use a proper SDLP verifier for validation.
`);
    process.exit(0);
  }

  let link: string;

  if (args[0] === '--test') {
    // Use a test vector
    try {
      link = loadTestVector();
      console.log('Using first test vector from mvp-test-vectors.json\n');
    } catch (error) {
      console.error(
        `Error loading test vectors: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      process.exit(1);
    }
  } else {
    const providedLink = args[0];
    if (!providedLink) {
      console.error('Error: SDLP link is required');
      process.exit(1);
    }
    link = providedLink;
  }

  const parsed = parseSDLPLink(link);
  formatParsedLink(parsed);
}
