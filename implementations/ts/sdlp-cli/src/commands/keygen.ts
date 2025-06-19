import { writeFileSync } from 'node:fs';
import bs58 from 'bs58';
import { Command } from 'commander';
import { generateKeyPair, exportJWK, type JWK } from 'jose';

export const keygenCommand = new Command('keygen')
  .description('Generate a did:key and save the private key')
  .option(
    '-o, --out <file>',
    'Output file for the private key (JWK format)',
    'private.jwk'
  )
  .action(async options => {
    try {
      // Generate Ed25519 key pair
      const { privateKey, publicKey } = await generateKeyPair('EdDSA', {
        crv: 'Ed25519',
      });

      // Export as JWK
      const privateJWK = await exportJWK(privateKey);
      const publicJWK = await exportJWK(publicKey);

      // Generate the did:key identifier
      const didKey = generateDidKey(publicJWK);

      // Extract the key identifier (the part after 'did:key:')
      const keyIdentifier = didKey.replace('did:key:', '');
      const fullKeyId = `${didKey}#${keyIdentifier}`;

      // Save private key to file
      const keyData = {
        ...privateJWK,
        kid: fullKeyId,
        alg: 'EdDSA',
      };

      writeFileSync(options.out, JSON.stringify(keyData, null, 2));

      console.log(`✅ Key pair generated successfully!`);
      console.log(`📁 Private key saved to: ${options.out}`);
      console.log(`🔑 DID: ${didKey}`);
      console.log(`🔗 Key ID: ${fullKeyId}`);
    } catch (error) {
      console.error('❌ Error generating key pair:', error);
      process.exit(1);
    }
  });

/**
 * Generate a did:key identifier from a public JWK
 */
function generateDidKey(publicJWK: JWK): string {
  // For Ed25519 keys, we need to extract the x coordinate and encode it
  if (publicJWK.kty !== 'OKP' || publicJWK.crv !== 'Ed25519') {
    throw new Error('Only Ed25519 keys are supported for did:key generation');
  }

  const x = publicJWK.x as string;
  if (!x) {
    throw new Error('Invalid Ed25519 public key: missing x coordinate');
  }

  // Decode the base64url x coordinate
  const xBytes = base64urlDecode(x);

  // For Ed25519, the multicodec prefix is 0xed (237 in decimal) followed by 0x01
  const multicodecPrefix = new Uint8Array([0xed, 0x01]);
  const publicKeyBytes = new Uint8Array(
    multicodecPrefix.length + xBytes.length
  );
  publicKeyBytes.set(multicodecPrefix);
  publicKeyBytes.set(xBytes, multicodecPrefix.length);

  // Encode with base58btc
  const base58Key = bs58.encode(publicKeyBytes);

  return `did:key:z${base58Key}`;
}

/**
 * Base64URL decode
 */
function base64urlDecode(str: string): Uint8Array {
  // Replace base64url characters with base64
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  // Decode
  const buffer = Buffer.from(base64, 'base64');
  return new Uint8Array(buffer);
}
