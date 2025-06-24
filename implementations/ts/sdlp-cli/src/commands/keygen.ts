import { writeFileSync, readFileSync } from 'node:fs';
import { stdin } from 'node:process';
import bs58 from 'bs58';
import { Command } from 'commander';
import { generateKeyPair, exportJWK, importPKCS8, type JWK } from 'jose';

export const keygenCommand = new Command('keygen')
  .description(
    'Generate a did:key and save the private key, optionally from a PEM file'
  )
  .option(
    '-o, --out <file>',
    'Output file for the private key (JWK format)',
    'private.jwk'
  )
  .option(
    '--from-pem [file]',
    'Path to a PEM file to convert to a JWK, or read from stdin if no file specified'
  )
  .option(
    '--did-web <domain>',
    'Generate did:web identity for the specified domain (e.g., pre.ms)'
  )
  .action(async options => {
    try {
      let privateJWK: JWK;
      let publicJWK: JWK;

      if (options.fromPem !== undefined) {
        // Import from PEM file or stdin
        const pemContent: string =
          options.fromPem === true
            ? await readStdin() // Read from stdin when --from-pem is used without a file argument
            : readFileSync(options.fromPem, 'utf-8'); // Read from specified file
        const privateKey = await importPKCS8(pemContent, 'EdDSA');

        // Export private key to JWK
        privateJWK = await exportJWK(privateKey);

        // Create public JWK by removing private components
        if (
          privateJWK.kty === undefined ||
          privateJWK.crv === undefined ||
          privateJWK.x === undefined ||
          privateJWK.kty === null ||
          privateJWK.crv === null ||
          privateJWK.x === null ||
          privateJWK.kty === '' ||
          privateJWK.crv === '' ||
          privateJWK.x === ''
        ) {
          throw new Error('Invalid private key: missing required components');
        }
        publicJWK = {
          kty: privateJWK.kty,
          crv: privateJWK.crv,
          x: privateJWK.x,
        };
      } else {
        // Generate new Ed25519 key pair
        const { privateKey, publicKey } = await generateKeyPair('EdDSA', {
          crv: 'Ed25519',
        });

        // Export as JWK
        privateJWK = await exportJWK(privateKey);
        publicJWK = await exportJWK(publicKey);
      }

      let didIdentifier: string;
      let keyId: string;

      if (options.didWeb !== undefined) {
        // Generate did:web identity
        didIdentifier = `did:web:${options.didWeb}`;
        keyId = `${didIdentifier}#owner`;
      } else {
        // Generate did:key identity
        didIdentifier = generateDidKey(publicJWK);
        const keyIdentifier = didIdentifier.replace('did:key:', '');
        keyId = `${didIdentifier}#${keyIdentifier}`;
      }

      // Save private key to file
      const keyData = {
        ...privateJWK,
        kid: keyId,
        alg: 'EdDSA',
      };

      writeFileSync(options.out, JSON.stringify(keyData, null, 2));

      const action = options.fromPem !== undefined ? 'converted' : 'generated';
      console.log(`✅ Key pair ${action} successfully!`);
      console.log(`📁 Private key saved to: ${options.out}`);
      console.log(`🔑 DID: ${didIdentifier}`);
      console.log(`🔗 Key ID: ${keyId}`);

      // Security recommendations
      console.log('');
      console.log('🔒 SECURITY RECOMMENDATION:');
      console.log(
        '- This file contains your private key. Protect it like a password.'
      );
      console.log(
        '- For production use, consider storing keys in a secure vault (e.g., HashiCorp Vault, AWS KMS) or a hardware security module (HSM).'
      );
      console.log('- Do not commit private keys to version control.');

      // If did:web, also generate the DID document
      if (options.didWeb !== undefined) {
        const didDocumentPath = options.out.replace(
          '.jwk',
          '-did-document.json'
        );
        const didDocument = {
          '@context': [
            'https://www.w3.org/ns/did/v1',
            'https://w3id.org/security/suites/ed25519-2020/v1',
          ],
          id: didIdentifier,
          verificationMethod: [
            {
              id: keyId,
              type: 'Ed25519VerificationKey2020',
              controller: didIdentifier,
              publicKeyJwk: publicJWK,
            },
          ],
          authentication: ['#owner'],
          assertionMethod: ['#owner'],
        };

        writeFileSync(didDocumentPath, JSON.stringify(didDocument, null, 2));
        console.log(`📄 DID document saved to: ${didDocumentPath}`);
        console.log(
          `🌐 Publish this at: https://${options.didWeb}/.well-known/did.json`
        );
      }
    } catch (error) {
      const action =
        options.fromPem !== undefined ? 'converting' : 'generating';
      console.error(`❌ Error ${action} key pair:`, error);
      process.exit(1);
    }
  });

/**
 * Read content from stdin
 */
async function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    stdin.setEncoding('utf8');

    stdin.on('readable', () => {
      const chunk = stdin.read();
      if (chunk !== null) {
        data += chunk;
      }
    });

    stdin.on('end', () => {
      resolve(data.trim());
    });

    stdin.on('error', error => {
      reject(error);
    });
  });
}

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
