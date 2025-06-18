import { Command } from 'commander';
import { verifyLink } from 'sdlp-sdk';

export const verifyCommand = new Command('verify')
    .description('Verify an SDLP link and output the payload')
    .argument('[link]', 'SDLP link to verify (if not provided, reads from stdin)')
    .option('--json', 'Output verification result in JSON format')
    .option('--max-payload-size <size>', 'Maximum payload size in bytes', '1048576') // 1MB default
    .action(async (link: string | undefined, options: { json?: boolean; maxPayloadSize: string }) => {
        try {
            let linkToVerify = typeof link === 'string' && link.length > 0 ? link : await readStdin();

            // Clean up the link (ensure it has sdlp:// prefix, trim whitespace)
            linkToVerify = linkToVerify.trim();
            if (!linkToVerify.startsWith('sdlp://')) {
                linkToVerify = `sdlp://${linkToVerify}`;
            }

            // Verify the link
            const result = await verifyLink(linkToVerify, {
                maxPayloadSize: parseInt(options.maxPayloadSize, 10),
            });

            if (typeof options.json === 'boolean' && options.json) {
                // JSON output for machine consumption
                if (result.valid) {
                    console.log(JSON.stringify({
                        valid: true,
                        sender: result.sender,
                        contentType: result.metadata.type || 'application/octet-stream',
                        payloadSize: result.payload.length,
                        metadata: result.metadata,
                    }));

                    // Write payload to stdout as text (assuming it's text-based for JSON output)
                    console.log(new TextDecoder().decode(result.payload));
                } else {
                    console.log(JSON.stringify({
                        valid: false,
                        error: {
                            name: result.error.name,
                            message: result.error.message,
                            code: result.error.code,
                        },
                    }));
                    process.exit(1);
                }
            } else {
                // Human-readable output
                if (result.valid) {
                    console.error(`✅ Link verified successfully!`);
                    console.error(`👤 Sender: ${result.sender}`);
                    console.error(`📄 Content Type: ${result.metadata.type ?? 'application/octet-stream'}`);
                    console.error(`📊 Payload Size: ${result.payload.length} bytes`);

                    if (typeof result.metadata.exp === 'number') {
                        const expDate = new Date(result.metadata.exp * 1000);
                        console.error(`⏰ Expires: ${expDate.toISOString()}`);
                    }

                    if (typeof result.metadata.nbf === 'number') {
                        const nbfDate = new Date(result.metadata.nbf * 1000);
                        console.error(`🕐 Not Before: ${nbfDate.toISOString()}`);
                    }

                    if (typeof result.metadata.comp === 'string' && result.metadata.comp !== 'none') {
                        console.error(`🗜️  Compression: ${result.metadata.comp}`);
                    }

                    console.error(''); // Empty line before payload
                    console.error('--- Payload ---');

                    // Write payload to stdout
                    process.stdout.write(result.payload);
                } else {
                    console.error(`❌ Link verification failed:`);
                    console.error(`Error: ${result.error.message}`);

                    if (typeof result.error.code === 'string') {
                        console.error(`Code: ${result.error.code}`);
                    }

                    process.exit(1);
                }
            }

        } catch (error) {
            if (typeof options.json === 'boolean' && options.json) {
                console.log(JSON.stringify({
                    valid: false,
                    error: {
                        name: 'UnexpectedError',
                        message: String(error),
                    },
                }));
            } else {
                console.error('❌ Unexpected error:', error);
            }
            process.exit(1);
        }
    });

/**
 * Read all data from stdin
 */
function readStdin(): Promise<string> {
    return new Promise((resolve, reject) => {
        let data = '';

        process.stdin.setEncoding('utf8');

        process.stdin.on('data', (chunk) => {
            data += chunk;
        });

        process.stdin.on('end', () => {
            resolve(data.trim());
        });

        process.stdin.on('error', (error) => {
            reject(error);
        });
    });
}
