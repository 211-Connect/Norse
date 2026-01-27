import '@testing-library/jest-dom';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.test
config({ path: resolve(__dirname, '.env.test') });

// Global test utilities can be added here

// Clean up Redis connections after all tests complete
// This prevents Jest from hanging due to open handles
afterAll(async () => {
  // Import lazily to avoid circular dependencies
  const {
    cacheService,
    translationCacheService,
    geoDataCacheService,
  } = await import('./src/cacheService');

  await Promise.all([
    cacheService.disconnect(),
    translationCacheService.disconnect(),
    geoDataCacheService.disconnect(),
  ]);
});
