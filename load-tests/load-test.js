/* eslint-disable import/no-anonymous-default-export */
import http from 'k6/http';
import { check } from 'k6';
import { Counter, Trend, Rate } from 'k6/metrics';

// Import test data
import { queries } from './data/queries.js';
import { resourceIds } from './data/resource-ids.js';

// Custom metrics
const cacheHits = new Counter('cache_hits');
const cacheMisses = new Counter('cache_misses');
const landingPageDuration = new Trend('landing_page_duration');
const searchPageDuration = new Trend('search_page_duration');
const resourcePageDuration = new Trend('resource_page_duration');
const errorRate = new Rate('error_rate');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 }, // Ramp up to 10 users
    { duration: '1m', target: 10 }, // Stay at 10 users
    { duration: '30s', target: 20 }, // Ramp up to 20 users
    { duration: '1m', target: 20 }, // Stay at 20 users
    { duration: '30s', target: 0 }, // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests should be below 2s
    http_req_failed: ['rate<0.1'], // Error rate should be below 10%
    error_rate: ['rate<0.1'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

/**
 * Check cache status from response headers
 */
function checkCacheStatus(response, url) {
  // Common cache headers to check
  const cacheHeader =
    response.headers['X-Cache'] ||
    response.headers['x-cache'] ||
    response.headers['Cache-Status'] ||
    response.headers['cache-status'] ||
    response.headers['CF-Cache-Status'] ||
    response.headers['Cf-Cache-Status'] ||
    response.headers['cf-cache-status'];

  if (cacheHeader) {
    const headerLower = cacheHeader.toLowerCase();
    if (headerLower.includes('hit')) {
      cacheHits.add(1);
      return 'HIT';
    } else if (headerLower.includes('miss')) {
      cacheMisses.add(1);
      return 'MISS';
    }
  }

  // Check Age header (presence suggests cached response)
  const ageHeader = response.headers['Age'] || response.headers['age'];
  if (ageHeader && parseInt(ageHeader) > 0) {
    cacheHits.add(1);
    return 'HIT';
  }

  // No definitive cache info
  return 'UNKNOWN';
}

/**
 * Test landing page
 */
function testLandingPage() {
  const response = http.get(`${BASE_URL}/`);

  const checkResult = check(response, {
    'landing page: status is 200': (r) => r.status === 200,
    'landing page: body is not empty': (r) => r.body.length > 0,
  });

  if (!checkResult) {
    errorRate.add(1);
  } else {
    errorRate.add(0);
  }

  const cacheStatus = checkCacheStatus(response, `${BASE_URL}/`);
  landingPageDuration.add(response.timings.duration);

  return {
    status: response.status,
    duration: response.timings.duration,
    cache: cacheStatus,
  };
}

/**
 * Test search page with query
 */
function testSearchPage() {
  const queryData = queries[Math.floor(Math.random() * queries.length)];
  const url = `${BASE_URL}/search?query=${encodeURIComponent(queryData.query)}&query_label=${encodeURIComponent(queryData.label)}&query_type=${queryData.type}`;

  const response = http.get(url);

  const checkResult = check(response, {
    'search page: status is 200': (r) => r.status === 200,
    'search page: body is not empty': (r) => r.body.length > 0,
  });

  if (!checkResult) {
    errorRate.add(1);
  } else {
    errorRate.add(0);
  }

  const cacheStatus = checkCacheStatus(response, url);
  searchPageDuration.add(response.timings.duration);

  return {
    status: response.status,
    duration: response.timings.duration,
    cache: cacheStatus,
    query: queryData.label,
  };
}

/**
 * Test single resource page
 */
function testResourcePage() {
  const resourceId =
    resourceIds[Math.floor(Math.random() * resourceIds.length)];
  const url = `${BASE_URL}/search/${resourceId}`;

  const response = http.get(url);

  const checkResult = check(response, {
    'resource page: status is 200': (r) => r.status === 200,
    'resource page: body is not empty': (r) => r.body.length > 0,
  });

  if (!checkResult) {
    errorRate.add(1);
  } else {
    errorRate.add(0);
  }

  const cacheStatus = checkCacheStatus(response, url);
  resourcePageDuration.add(response.timings.duration);

  return {
    status: response.status,
    duration: response.timings.duration,
    cache: cacheStatus,
    id: resourceId,
  };
}

/**
 * Main test scenario
 */
export default function () {
  // Randomly choose which page to test (simulate real user behavior)
  const rand = Math.random();

  if (rand < 0.1) {
    // 10% landing page
    const result = testLandingPage();
    console.log(
      `[Landing] Status: ${result.status}, Duration: ${result.duration.toFixed(2)}ms, Cache: ${result.cache}`,
    );
  } else if (rand < 1) {
    // 40% search pages
    const result = testSearchPage();
    console.log(
      `[Search] Query: ${result.query}, Status: ${result.status}, Duration: ${result.duration.toFixed(2)}ms, Cache: ${result.cache}`,
    );
  } else {
    // 50% resource pages
    const result = testResourcePage();
    console.log(
      `[Resource] ID: ${result.id}, Status: ${result.status}, Duration: ${result.duration.toFixed(2)}ms, Cache: ${result.cache}`,
    );
  }
}

/**
 * Setup function - runs once before the test
 */
export function setup() {
  console.log(`Starting load test against: ${BASE_URL}`);
  console.log(`Test queries: ${queries.length}`);
  console.log(`Test resource IDs: ${resourceIds.length}`);
}

/**
 * Teardown function - runs once after the test
 */
export function teardown(data) {
  console.log('Load test completed');
}
