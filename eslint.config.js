import js from '@eslint/js';
import nextPlugin from '@next/eslint-plugin-next';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettierConfig from 'eslint-config-prettier';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import globals from 'globals';

/** @type {import('eslint').Linter.Config[]} */
const eslintConfig = [
  {
    ignores: [
      '.agents/**',
      '.claude/**',
      '.next/**',
      'dist/**',
      'coverage/**',
      'build/**',
      'playwright-report/**',
      'src/payload/migrations/**',
      'src/payload/payload-types.ts',
      'src/app/(payload)/admin/importMap.js',
      'src/app/(payload)/layout.tsx',
      'test-results/**',
      'docs/**',
      'public/**',
      'widget/**',
      'next-env.d.ts',
    ],
  },
  js.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
  nextPlugin.configs['core-web-vitals'],
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      '@typescript-eslint': tsPlugin,
      'react-hooks': reactHooksPlugin,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        sourceType: 'module',
        ecmaVersion: 'latest',
      },
    },
    rules: {
      'no-undef': 'off', // Handled by TypeScript
      'no-unused-vars': 'off', // Handled by TypeScript
      'no-restricted-imports': [
        'warn',
        {
          paths: [
            {
              name: 'react',
              importNames: ['default'],
              message:
                'Default React import is not needed in TSX. Remove it or use named imports.',
            },
          ],
        },
      ],
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          args: 'after-used',
          varsIgnorePattern: '^_',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
    },
  },
  {
    files: ['**/*.d.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      'no-unused-vars': 'off',
      'no-undef': 'off',
      'no-redeclare': 'off',
    },
  },
  prettierConfig,
];

export default eslintConfig;
