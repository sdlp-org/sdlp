// Base ESLint configuration for SDLP repository
// Individual packages can extend this configuration with package-specific rules

export default [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'out/**',
      'build/**',
      'coverage/**',
      '*.d.ts',
      'vite.config.ts.timestamp-*',
      '.env*',
      '*.log',
      'package-lock.json',
      'yarn.lock',
      'pnpm-lock.yaml',
      '*.legacy.js',
      '*.old.js',
    ],
  },

  // Base configuration for JavaScript files
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      'prefer-const': 'error',
      'no-var': 'error',
      'no-debugger': 'error',
      'no-console': 'warn',
      'eqeqeq': ['error', 'always'],
      'curly': ['error', 'all'],
    },
  },

  // Override for test files
  {
    files: ['**/*.test.{js,ts}', '**/*.spec.{js,ts}', 'test/**/*.ts', 'tests/**/*.ts'],
    rules: {
      'no-console': 'off',
    },
  },

  // Override for config files
  {
    files: ['*.config.{js,ts,mjs,cjs}', 'eslint.config.js', 'vite.config.ts'],
    rules: {
      'no-console': 'off',
    },
  },

  // Override for scripts
  {
    files: ['scripts/**/*.ts'],
    rules: {
      'no-console': 'off',
    },
  },
];
