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
      'src/lib/api/generated/**',
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
    // The public app (NORSE_ROLE=app) has no database: app code reads CMS
    // data through `@/lib/cms`, never Payload directly. The ignored files are
    // the CMS side of features that live under (app): they run in the CMS
    // (Payload jobs, `/api/internal/*`). See docs/cms-app-separation-plan.md.
    files: [
      'src/app/(app)/**/*.{ts,tsx}',
      'src/app/robots.ts',
      'src/lib/**/*.{ts,tsx}',
      'src/middlewares/**/*.{ts,tsx}',
      'src/proxy.ts',
      'src/types/**/*.{ts,tsx}',
      'src/utils/**/*.{ts,tsx}',
    ],
    ignores: [
      'src/lib/cms/**',
      'src/app/(app)/shared/services/scheduled-pdf-delivery/**',
      'src/app/(app)/shared/services/translation-usage/translation-usage-store.ts',
      'src/app/(app)/shared/services/translation-usage/translation-usage-alert-email.ts',
      'src/app/(app)/shared/utils/buildAppConfig.ts',
      'src/app/(app)/shared/utils/buildSearchConfig.ts',
    ],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@/payload/getPayloadSingleton',
                '@/payload/payload-config',
                '@payload-config',
                '@/payload/collections/*/actions',
                '@/payload/collections/*/actions/*',
                '@/payload/services/*',
              ],
              allowTypeImports: true,
              message:
                'The public app has no database: read CMS data through @/lib/cms (docs/cms-app-separation-plan.md).',
            },
          ],
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
