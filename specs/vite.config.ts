import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: {
        'generate-did-key': resolve(__dirname, 'scripts/generate-did-key.ts'),
        'generate-test-vectors': resolve(
          __dirname,
          'scripts/generate-test-vectors.ts'
        ),
        'parse-sdlp-link': resolve(__dirname, 'scripts/parse-sdlp-link.ts'),
      },
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: ['crypto', 'fs', 'path', '@noble/hashes/sha256', 'bs58'],
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.{test,spec}.{js,ts}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'test/', 'dist/', '**/*.d.ts'],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@scripts': resolve(__dirname, './scripts'),
      '@test': resolve(__dirname, './test'),
    },
  },
});
