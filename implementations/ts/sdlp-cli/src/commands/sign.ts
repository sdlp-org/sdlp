import { readFileSync } from 'node:fs';
import { Command } from 'commander';
import { createLink } from 'sdlp-sdk';
import type { Signer } from 'sdlp-sdk';

export const signCommand = new Command('sign')
    .description('Sign a payload file and create an SDLP link')
    .requiredOption('--payload-file <file>', 'Path to the payload file to sign')
    .requiredOption('--type <type>', 'MIME type of the payload (e.g., application/json, text/plain)')
    .option('--signer-key <file>', 'Path to the private key file (JWK format)')
    .option('--compression <comp>', 'Compression algorithm (br, gz, zstd, none)', 'br')
    .option('--expires <exp>', 'Expiration time (ISO 8601 format or seconds from now)')
    .option('--not-before <nbf>', 'Not before time (ISO 8601 format or seconds from now)')
    .action(async (options) => {
        try {
            // Read payload file
            const payload = readFileSync(options.payloadFile);

            // Load signer key
            const signer = await loadSigner(options.signerKey);

            // Parse expiration time
            const exp = options.expires ? parseTime(options.expires) : undefined;

            // Create the link
            const createLinkParameters: Parameters<typeof createLink>[0] = {
                payload,
                payloadType: options.type,
                signer,
                compress: options.compression === 'none' ? 'none' : 'br',
            };

            if (exp) {
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
 * Load a signer from a private key file or environment variable
 */
async function loadSigner(keyFile?: string): Promise<Signer> {
    let jwkData: string;

    if (keyFile) {
        // Load from file
        jwkData = readFileSync(keyFile, 'utf8');
    } else if (process.env.SDLP_SIGNER_KEY_JWK) {
        // Load from environment variable
        jwkData = process.env.SDLP_SIGNER_KEY_JWK;
    } else {
        throw new Error('No signer key provided. Use --signer-key <file> or set SDLP_SIGNER_KEY_JWK environment variable');
    }

    const jwk = JSON.parse(jwkData);

    // Validate required fields
    if (!jwk.kid) {
        throw new Error('Private key must have a "kid" field');
    }

    if (!jwk.alg) {
        throw new Error('Private key must have an "alg" field');
    }

    // Validate kid format
    const kid = jwk.kid as string;
    const kidParts = kid.split('#');
    if (kidParts.length !== 2) {
        throw new Error('Invalid kid format. Expected format: did:method:identifier#fragment');
    }

    return {
        kid,
        privateKeyJwk: jwk,
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

    throw new Error(`Invalid time format: ${timeString}. Use ISO 8601 format or seconds from now`);
} 
