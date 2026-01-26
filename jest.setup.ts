import '@testing-library/jest-dom';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.test
config({ path: resolve(__dirname, '.env.test') });

// Global test utilities can be added here
