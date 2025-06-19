// Base ESLint configuration for SDLP repository
// Individual packages can extend this configuration with package-specific rules

import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{js,mjs,cjs,ts}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      // Basic code quality rules
      'prefer-const': 'error',
      'no-var': 'error',
      'no-debugger': 'error',
      'no-console': 'warn',
      'eqeqeq': ['error', 'always'],
      'curly': ['error', 'all'],
    },
  },
  {
    files: ['**/*.test.{js,ts}', '**/*.spec.{js,ts}'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'out/**',
      'build/**',
      'coverage/**',
      '*.config.js',
      '*.config.ts',
    ],
  },
];
