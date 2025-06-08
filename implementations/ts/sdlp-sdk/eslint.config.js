import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import importPlugin from "eslint-plugin-import";
import securityPlugin from "eslint-plugin-security";
import unicornPlugin from "eslint-plugin-unicorn";

export default [
  {
    ignores: [
      "dist/",
      "build/",
      "node_modules/",
      "coverage/",
      "*.d.ts",
      "vite.config.ts.timestamp-*",
      ".env*",
      "*.log",
      "package-lock.json",
      "yarn.lock",
      "pnpm-lock.yaml",
      "*.legacy.js",
      "*.old.js",
    ],
  },

  // Base configuration for all TypeScript files
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        project: "./tsconfig.json",
      },
      globals: {
        console: "readonly",
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      import: importPlugin,
      security: securityPlugin,
      unicorn: unicornPlugin,
    },
    rules: {
      // ESLint recommended rules
      ...js.configs.recommended.rules,

      // ===========================
      // TypeScript Specific Rules
      // ===========================
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/explicit-function-return-type": [
        "error",
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
          allowHigherOrderFunctions: true,
        },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/prefer-readonly": "error",
      "@typescript-eslint/prefer-as-const": "error",
      "@typescript-eslint/prefer-nullish-coalescing": "error",
      "@typescript-eslint/prefer-optional-chain": "error",
      "@typescript-eslint/strict-boolean-expressions": "error",
      "@typescript-eslint/switch-exhaustiveness-check": "error",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports",
          disallowTypeAnnotations: false,
        },
      ],
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/no-unnecessary-type-assertion": "error",
      "@typescript-eslint/no-unsafe-assignment": "error",
      "@typescript-eslint/no-unsafe-call": "error",
      "@typescript-eslint/no-unsafe-member-access": "error",
      "@typescript-eslint/no-unsafe-return": "error",
      "@typescript-eslint/restrict-template-expressions": "error",

      // ===========================
      // General Code Quality Rules
      // ===========================
      "no-console": "off", // Allow console in CLI scripts
      "prefer-const": "error",
      "no-var": "error",
      eqeqeq: ["error", "always"],
      curly: ["error", "all"],
      "no-throw-literal": "error",
      "prefer-template": "error",
      "no-useless-concat": "error",
      "array-callback-return": "error",
      "no-loop-func": "error",
      "no-promise-executor-return": "error",
      "require-atomic-updates": "error",

      // ===========================
      // Import/Export Rules
      // ===========================
      "no-duplicate-imports": "error",
      "import/no-unresolved": "off", // TypeScript handles this
      "import/order": [
        "error",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
            "type",
          ],
          "newlines-between": "never",
          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
        },
      ],

      // ===========================
      // Security Rules
      // ===========================
      "security/detect-object-injection": "error",
      "security/detect-non-literal-regexp": "error",
      "security/detect-unsafe-regex": "error",
      "security/detect-buffer-noassert": "error",
      "security/detect-child-process": "warn", // We might need this for CLI
      "security/detect-disable-mustache-escape": "error",
      "security/detect-eval-with-expression": "error",
      "security/detect-no-csrf-before-method-override": "error",
      "security/detect-non-literal-fs-filename": "warn", // We need fs operations
      "security/detect-non-literal-require": "error",
      "security/detect-possible-timing-attacks": "error",
      "security/detect-pseudoRandomBytes": "error",

      // ===========================
      // Unicorn Rules (Modern JS/TS best practices)
      // ===========================
      "unicorn/filename-case": [
        "error",
        {
          cases: {
            kebabCase: true,
            camelCase: true,
          },
        },
      ],
      "unicorn/prevent-abbreviations": [
        "error",
        {
          allowList: {
            args: true,
            env: true,
            tmp: true,
            dir: true,
            pkg: true,
            src: true,
            dest: true,
            req: true,
            res: true,
            err: true,
            str: true,
            num: true,
            obj: true,
            arr: true,
            fn: true,
            cb: true,
            ctx: true,
            opts: true,
            config: true,
            params: true,
            props: true,
          },
        },
      ],
      "unicorn/no-null": "off", // We use null in types
      "unicorn/prefer-module": "off", // We need CommonJS for config files
      "unicorn/prefer-top-level-await": "off", // Not always appropriate
      "unicorn/import-style": "off", // Too opinionated for our use case
      "unicorn/no-process-exit": "off", // We need process.exit in CLI scripts
      "unicorn/prefer-node-protocol": "error",
      "unicorn/prefer-ternary": "error",
      "unicorn/consistent-destructuring": "error",
      "unicorn/no-useless-undefined": "error",
      "unicorn/prefer-default-parameters": "error",
      "unicorn/prefer-includes": "error",
      "unicorn/prefer-string-starts-ends-with": "error",
      "unicorn/prefer-array-some": "error",
      "unicorn/no-for-loop": "error",
      "unicorn/explicit-length-check": "error",
    },
  },

  // Override for test files
  {
    files: ["test/**/*.ts", "**/*.test.ts", "**/*.spec.ts"],
    rules: {
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/strict-boolean-expressions": "off",
      "security/detect-object-injection": "off",
      "unicorn/consistent-function-scoping": "off",
      "unicorn/no-useless-undefined": "off",
    },
  },

  // Override for config files
  {
    files: ["*.config.{js,ts,mjs,cjs}", "eslint.config.js", "vite.config.ts"],
    rules: {
      "unicorn/prefer-module": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "import/no-default-export": "off",
      "@typescript-eslint/explicit-function-return-type": "off",
    },
  },

  // Override for CLI scripts
  {
    files: ["scripts/**/*.ts"],
    rules: {
      "no-console": "off",
      "unicorn/no-process-exit": "off",
      "security/detect-child-process": "off",
      "security/detect-non-literal-fs-filename": "off",
      "@typescript-eslint/strict-boolean-expressions": "off",
    },
  },
];
