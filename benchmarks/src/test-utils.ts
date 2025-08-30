/* eslint-disable unicorn/prevent-abbreviations */
import type { Signer } from '../../../implementations/ts/sdlp-sdk/dist/src/types';

export function generateTestKey(): Signer {
  // For benchmarking, we'll use a deterministic key to ensure consistency
  const privateKey = {
    kty: 'OKP',
    crv: 'Ed25519',
    x: 'XI0CXm4X9R5JtQ_P8TbTF-zlXlTYCQSE_5W2FxT5Aic',
    d: 'PwNrwDyAhz3HLLOq0HY6O3d0HpP9e8JHQJ9V7WhLMZA',
    use: 'sig',
    alg: 'EdDSA',
  };

  return {
    privateKey,
    did: 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK',
  };
}

// Simplified for now - generateKeyPair export method has issues
// export async function generateFreshTestKey(): Promise<Signer> {
//   const keyPair = await generateKeyPair('EdDSA', { crv: 'Ed25519' });
//   const privateKey = await keyPair.privateKey.export({ format: 'jwk' });
//
//   // Create a did:key from the public key
//   const publicKey = await keyPair.publicKey.export({ format: 'jwk' });
//   const did = `did:key:z${Buffer.from(JSON.stringify(publicKey)).toString('base64url')}`;
//
//   return {
//     privateKey,
//     did,
//   };
// }

export function formatDuration(ms: number): string {
  if (ms < 1) {
    return `${(ms * 1000).toFixed(2)}µs`;
  }
  if (ms < 1000) {
    return `${ms.toFixed(2)}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes}B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)}KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export function formatRate(ratePerSecond: number): string {
  if (ratePerSecond > 1000) {
    return `${(ratePerSecond / 1000).toFixed(1)}K ops/sec`;
  }
  return `${Math.round(ratePerSecond)} ops/sec`;
}

export function calculatePercentiles(times: number[]): {
  p50: number;
  p95: number;
  p99: number;
} {
  const sorted = times.sort((a, b) => a - b);
  const length = sorted.length;

  return {
    p50: sorted[Math.floor(length * 0.5)] ?? 0,
    p95: sorted[Math.floor(length * 0.95)] ?? 0,
    p99: sorted[Math.floor(length * 0.99)] ?? 0,
  };
}

export function generateUrlLengthTests(): Array<{
  targetLength: number;
  description: string;
}> {
  return [
    { targetLength: 2000, description: 'QR Code optimized (2KB)' },
    { targetLength: 8192, description: 'Browser address bar (8KB)' },
    { targetLength: 32768, description: 'HTTP header limit (32KB)' },
  ];
}
