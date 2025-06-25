import { readFileSync } from 'node:fs';
import { Command } from 'commander';
import { type JWK } from 'jose';
import { createLink, type Signer } from 'sdlp-sdk';

interface Jwk {
  kid: string;
  alg: string;
  [key: string]: unknown;
}

interface DIDDocument {
  id: string;
  verificationMethod: Array<{
    id: string;
    type: string;
    controller: string;
    publicKeyJwk: JWK;
  }>;
}

export const signCommand = new Command('sign')
  .description('Sign a payload file and create an SDLP link')
  .requiredOption('--payload-file <file>', 'Path to the payload file to sign')
  .requiredOption(
    '--type <type>',
    'MIME type of the payload (e.g., application/json, text/plain)'
  )
  .option('--signer-key <file>', 'Path to the private key file (JWK format)')
  .option(
    '--did-document <file>',
    'Path to the DID document file (JSON format)'
  )
  .option('--kid <kid>', 'Key ID from the DID document to use for signing')
  .option(
    '--key <file>',
    'Path to the private key file (JWK format) when using DID document'
  )
  .option(
    '--compression <comp>',
    'Compression algorithm (br, gz, zstd, none)',
    'br'
  )
  .option(
    '--expires <exp>',
    'Expiration time (ISO 8601 format or seconds from now)'
  )
  .option(
    '--not-before <nbf>',
    'Not before time (ISO 8601 format or seconds from now)'
  )
  .action(async options => {
    try {
      // Read payload file
      const payload = readFileSync(options.payloadFile);

      // Load signer key using either traditional or DID-centric workflow
      const signer = await loadSigner(
        options.signerKey,
        options.didDocument,
        options.kid,
        options.key
      );

      // Parse expiration time
      const exp =
        typeof options.expires === 'string' && options.expires.length > 0
          ? parseTime(options.expires)
          : undefined;

      // Create the link
      const createLinkParameters: Parameters<typeof createLink>[0] = {
        payload,
        payloadType: options.type,
        signer,
        compress: options.compression === 'none' ? 'none' : 'br',
      };

      if (typeof exp === 'number') {
        createLinkParameters.expiresIn = exp - Math.floor(Date.now() / 1000);
      }

      const link = await createLink(createLinkParameters);

      // Output the link
      console.log(link);
    } catch (error) {
      console.error('❌ Error creating link:', error);
      process.exit(1);
    }
  });

/**
 * Load a signer from a private key file or environment variable, or from DID document
 */
async function loadSigner(
  keyFile?: string,
  didDocumentFile?: string,
  keyId?: string,
  privateKeyFile?: string
): Promise<Signer> {
  // Check if using DID-centric workflow
  if (
    didDocumentFile !== undefined &&
    didDocumentFile !== '' &&
    keyId !== undefined &&
    keyId !== '' &&
    privateKeyFile !== undefined &&
    privateKeyFile !== ''
  ) {
    return await loadSignerFromDIDDocument(
      didDocumentFile,
      keyId,
      privateKeyFile
    );
  }

  // Traditional workflow
  let jwkData: string | undefined;

  if (typeof keyFile === 'string' && keyFile.length > 0) {
    // Load from file
    jwkData = readFileSync(keyFile, 'utf8');
  } else if (
    typeof process.env.SDLP_SIGNER_KEY_JWK === 'string' &&
    process.env.SDLP_SIGNER_KEY_JWK.length > 0
  ) {
    // Load from environment variable
    jwkData = process.env.SDLP_SIGNER_KEY_JWK;
  } else {
    throw new Error(
      'No signer key provided. Use --signer-key <file> or set SDLP_SIGNER_KEY_JWK environment variable, or use DID-centric workflow with --did-document, --kid, and --key'
    );
  }

  const jwk = JSON.parse(jwkData) as Jwk;

  // Validate required fields
  if (typeof jwk.kid !== 'string' || jwk.kid.length === 0) {
    throw new Error('Private key must have a "kid" field');
  }

  if (typeof jwk.alg !== 'string' || jwk.alg.length === 0) {
    throw new Error('Private key must have an "alg" field');
  }

  // Validate kid format
  const kid = jwk.kid;
  const kidParts = kid.split('#');
  if (kidParts.length !== 2) {
    throw new Error(
      'Invalid kid format. Expected format: did:method:identifier#fragment'
    );
  }

  return {
    kid,
    privateKeyJwk: jwk,
  };
}

/**
 * Load a signer from a DID document and private key file
 */
async function loadSignerFromDIDDocument(
  didDocumentFile: string,
  keyId: string,
  privateKeyFile: string
): Promise<Signer> {
  // Load DID document
  const didDocumentContent = readFileSync(didDocumentFile, 'utf8');
  const didDocument = JSON.parse(didDocumentContent) as DIDDocument;

  // Load private key
  const privateKeyContent = readFileSync(privateKeyFile, 'utf8');
  const privateKeyJwk = JSON.parse(privateKeyContent) as JWK;

  // Find the verification method with the specified key ID
  const verificationMethod = didDocument.verificationMethod.find(
    vm => vm.id === keyId
  );

  if (!verificationMethod) {
    throw new Error(`Key ID "${keyId}" not found in DID document`);
  }

  // Validate that the public key in the DID document matches the private key
  const publicKeyFromDID = verificationMethod.publicKeyJwk;

  if (
    publicKeyFromDID.kty !== privateKeyJwk.kty ||
    publicKeyFromDID.crv !== privateKeyJwk.crv ||
    publicKeyFromDID.x !== privateKeyJwk.x
  ) {
    throw new Error(
      'Private key does not correspond to the public key in the DID document'
    );
  }

  // Create the signer with the DID as the sid
  return {
    kid: keyId,
    privateKeyJwk: {
      ...privateKeyJwk,
      kid: keyId,
      alg: 'EdDSA',
    },
  };
}

/**
 * Parse time string (ISO 8601 or seconds from now)
 */
function parseTime(timeString: string): number {
  // Try to parse as ISO 8601 first
  const isoTime = new Date(timeString);
  if (!isNaN(isoTime.getTime())) {
    return Math.floor(isoTime.getTime() / 1000);
  }

  // Try to parse as seconds from now
  const seconds = parseInt(timeString, 10);
  if (!isNaN(seconds)) {
    return Math.floor(Date.now() / 1000) + seconds;
  }

  throw new Error(
    `Invalid time format: ${timeString}. Use ISO 8601 format or seconds from now`
  );
}
