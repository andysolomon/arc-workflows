// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/coverage/**',
      '**/*.tsbuildinfo',
      'pnpm-lock.yaml',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: ['**/*.test.ts', '**/*.test.tsx'],
    rules: {
      '@typescript-eslint/no-unused-expressions': 'off',
    },
  },
  {
    // JS/TS config files at the repo root — outside the project service
    files: ['*.config.js', '*.config.mjs', '*.config.ts', 'vitest.workspace.ts'],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: false,
        project: null,
      },
    },
  },
  prettier,
);
