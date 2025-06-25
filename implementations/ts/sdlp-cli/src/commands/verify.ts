import { TextDecoder } from 'node:util';
import { Command } from 'commander';
import { verifyLink } from 'sdlp-sdk';

export const verifyCommand = new Command('verify')
  .description('Verify an SDLP link and output the payload')
  .argument('[link]', 'SDLP link to verify (if not provided, reads from stdin)')
  .option('--json', 'Output verification result in JSON format')
  .option(
    '--max-payload-size <size>',
    'Maximum payload size in bytes',
    '1048576'
  ) // 1MB default
  .action(
    async (
      link: string | undefined,
      options: { json?: boolean; maxPayloadSize: string }
    ) => {
      try {
        let linkToVerify =
          typeof link === 'string' && link.length > 0
            ? link
            : await readStdin();

        // Clean up the link (ensure it has sdlp:// prefix, trim whitespace)
        linkToVerify = linkToVerify.trim();
        if (!linkToVerify.startsWith('sdlp://')) {
          linkToVerify = `sdlp://${linkToVerify}`;
        }

        // Verify the link
        const result = await verifyLink(linkToVerify, {
          maxPayloadSize: parseInt(options.maxPayloadSize, 10),
        });

        if (options.json === true) {
          // JSON output for machine consumption
          if (result.valid === true) {
            console.log(
              JSON.stringify({
                valid: true,
                sender: result.sender,
                contentType: result.metadata.type ?? 'application/octet-stream',
                payloadSize: result.payload.length,
                metadata: result.metadata,
              })
            );

            // Write payload to stdout as text (assuming it's text-based for JSON output)
            console.log(new TextDecoder().decode(result.payload));
          } else {
            console.log(
              JSON.stringify({
                valid: false,
                error: {
                  name: result.error.name,
                  message: result.error.message,
                  code: result.error.code,
                },
              })
            );
            process.exit(1);
          }
        } else {
          // Human-readable output
          if (result.valid === true) {
            console.error(`✅ Link verified successfully!`);
            console.error(`👤 Sender: ${result.sender}`);
            console.error(
              `📄 Content Type: ${result.metadata.type ?? 'application/octet-stream'}`
            );
            console.error(`📊 Payload Size: ${result.payload.length} bytes`);

            if (typeof result.metadata.exp === 'number') {
              const expDate = new Date(result.metadata.exp * 1000);
              console.error(`⏰ Expires: ${expDate.toISOString()}`);
            }

            if (typeof result.metadata.nbf === 'number') {
              const nbfDate = new Date(result.metadata.nbf * 1000);
              console.error(`🕐 Not Before: ${nbfDate.toISOString()}`);
            }

            if (
              typeof result.metadata.comp === 'string' &&
              result.metadata.comp !== 'none'
            ) {
              console.error(`🗜️  Compression: ${result.metadata.comp}`);
            }

            console.error(''); // Empty line before payload
            console.error('--- Payload ---');

            // Write payload to stdout
            process.stdout.write(result.payload);
          } else {
            console.error(`❌ Link verification failed:`);

            // Provide specific error messages based on standardized error codes
            switch (result.error.code) {
              case 'E_INVALID_STRUCTURE':
                console.error(
                  `🔧 Invalid Link Format: The link structure is malformed or corrupted.`
                );
                break;
              case 'E_SIGNATURE_VERIFICATION_FAILED':
                console.error(
                  `🔐 Signature Invalid: The cryptographic signature could not be verified. This link may have been tampered with.`
                );
                break;
              case 'E_KEY_NOT_FOUND':
                console.error(
                  `🔑 Key Not Found: The signing key specified in the link could not be located in the sender's DID document.`
                );
                break;
              case 'E_DID_RESOLUTION_FAILED':
                console.error(
                  `🌐 Identity Resolution Failed: Could not resolve the sender's decentralized identifier (DID).`
                );
                break;
              case 'E_DID_MISMATCH':
                console.error(
                  `⚠️  Identity Mismatch: The sender DID and key identifier do not match. This indicates a security issue.`
                );
                break;
              case 'E_PAYLOAD_DECOMPRESSION_FAILED':
                console.error(
                  `📦 Decompression Failed: Could not decompress the payload data.`
                );
                break;
              case 'E_PAYLOAD_INTEGRITY_FAILED':
                console.error(
                  `🛡️  Payload Tampered: The payload integrity check failed. The content has been modified.`
                );
                break;
              case 'E_TIME_BOUNDS_VIOLATED':
                console.error(
                  `⏰ Time Violation: The link has expired or is not yet valid.`
                );
                break;
              case 'E_REPLAY_DETECTED':
                console.error(
                  `🔄 Replay Detected: This link has already been processed before.`
                );
                break;
              default:
                console.error(`Error: ${result.error.message}`);
            }

            console.error(`Code: ${result.error.code}`);

            // Show additional context if available (check if the error has context property)
            if (
              'context' in result.error &&
              result.error.context !== null &&
              result.error.context !== undefined
            ) {
              console.error(
                `Context:`,
                JSON.stringify(result.error.context, null, 2)
              );
            }

            process.exit(1);
          }
        }
      } catch (error) {
        if (options.json === true) {
          console.log(
            JSON.stringify({
              valid: false,
              error: {
                name: 'UnexpectedError',
                message: String(error),
              },
            })
          );
        } else {
          console.error('❌ Unexpected error:', error);
        }
        process.exit(1);
      }
    }
  );

/**
 * Read all data from stdin
 */
function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';

    process.stdin.setEncoding('utf8');

    process.stdin.on('data', chunk => {
      data += chunk;
    });

    process.stdin.on('end', () => {
      resolve(data.trim());
    });

    process.stdin.on('error', error => {
      reject(error);
    });
  });
}
