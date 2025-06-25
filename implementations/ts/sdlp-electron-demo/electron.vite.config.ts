import { resolve } from 'path';
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer'),
        // Force browser-specific compression module for renderer
        'sdlp-sdk/compression': resolve(
          '../sdlp-sdk/dist/src/compression.browser.js'
        ),
      },
      conditions: ['browser', 'import', 'module', 'default'],
    },
    plugins: [react()],
    build: {
      rollupOptions: {
        external: [
          // Exclude Node.js specific modules from browser bundle
          'node:util',
          'node:zlib',
        ],
      },
    },
  },
});
