/**
 * Browser-specific Brotli compression utilities
 * Uses brotli-wasm library
 */

import brotliPromise from 'brotli-wasm';

interface BrotliWasm {
  compress: (data: Uint8Array) => Uint8Array;
  decompress: (data: Uint8Array) => Uint8Array;
}

let brotliInstance: BrotliWasm | null = null;

async function getBrotli(): Promise<BrotliWasm> {
  // eslint-disable-next-line @typescript-eslint/require-await
  brotliInstance ??= await brotliPromise;
  return brotliInstance;
}

/**
 * Compress data using Brotli compression (Browser implementation)
 */
export async function compressBrotli(data: Uint8Array): Promise<Uint8Array> {
  const brotli = await getBrotli();
  return brotli.compress(data);
}

/**
 * Decompress Brotli-compressed data (Browser implementation)
 */
export async function decompressBrotli(compressedData: Uint8Array): Promise<Uint8Array> {
  const brotli = await getBrotli();
  return brotli.decompress(compressedData);
}
