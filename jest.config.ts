import type { Config } from 'jest';
import nextJest from 'next/jest';

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
});

// Custom Jest configuration
const config: Config = {
  // Use jsdom for browser environment
  testEnvironment: 'jest-environment-jsdom',

  // Setup files after environment
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],

  // Module paths (match tsconfig paths)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  // Test match patterns
  testMatch: [
    '**/__tests__/**/*.test.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/_*.{js,jsx,ts,tsx}', // Exclude Next.js internal files
    '!src/app/**/layout.tsx',
    '!src/app/**/page.tsx',
  ],

  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/public/',
    '/coverage/',
  ],

  // Coverage thresholds (optional, adjust as needed)
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },

  // Transform files
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
  ],

  // Verbose output
  verbose: true,
};

// Export config with Next.js handling
export default createJestConfig(config);
