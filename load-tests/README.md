# Load Testing with k6

This directory contains k6 load tests for the Norse application.

## Prerequisites

Install k6:

**macOS:**

```bash
brew install k6
```

**Linux:**

```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

**Windows:**

```bash
choco install k6
```

Or download from: https://k6.io/docs/get-started/installation/

## Test Structure

```
load-tests/
├── load-test.js           # Main test script
├── data/
│   ├── queries.js         # Search query test data
│   └── resource-ids.js    # Resource UUID test data
└── README.md              # This file
```

## Configuration

### Adding Test Data

Before running tests, populate the data files:

**`data/queries.js`** - Add your taxonomy queries:

```javascript
export const queries = [
  {
    query: 'BD-1800.1500,BD-1800.2000',
    label: 'Food',
    type: 'taxonomy',
  },
  // Add more...
];
```

**`data/resource-ids.js`** - Add resource UUIDs:

```javascript
export const resourceIds = [
  'a226de3b-c6b7-5039-8312-8a0ddfddac40',
  'another-uuid-here',
  // Add more...
];
```

### Test Scenarios

The test simulates real user behavior with this distribution:

- **20%** Landing page (`/`)
- **50%** Search pages (`/search?query=...`)
- **30%** Resource pages (`/search/{uuid}`)

### Load Profile

Default configuration (edit `options.stages` in `load-test.js`):

1. Ramp up to 10 users over 30s
2. Maintain 10 users for 1m
3. Ramp up to 20 users over 30s
4. Maintain 20 users for 1m
5. Ramp down to 0 over 30s

**Total duration:** ~3.5 minutes

## Running Tests

### Basic Test (Default)

```bash
k6 run load-test.js
```

### Custom Base URL

```bash
k6 run --env BASE_URL=http://localhost:3000 load-test.js
```

### Quick Smoke Test

```bash
k6 run --vus 1 --duration 30s load-test.js
```

### Stress Test

```bash
k6 run --vus 50 --duration 2m load-test.js
```

### With HTML Report

```bash
k6 run --out json=results.json load-test.js
```

## Metrics Tracked

### Standard k6 Metrics

- `http_req_duration` - Request duration
- `http_req_failed` - Failed requests
- `http_reqs` - Total requests
- `vus` - Virtual users

### Custom Metrics

- `cache_hits` - Number of cache hits detected
- `cache_misses` - Number of cache misses detected
- `landing_page_duration` - Landing page response time
- `search_page_duration` - Search page response time
- `resource_page_duration` - Resource page response time
- `error_rate` - Custom error rate

### Cache Detection

The test checks for cache status using multiple methods:

1. `X-Cache` header (HIT/MISS)
2. `Cache-Status` header
3. `CF-Cache-Status` header (Cloudflare)
4. `Age` header (presence indicates cached response)

Make sure your application returns appropriate cache headers for accurate tracking.

## Understanding Results

### Sample Output

```
✓ landing page: status is 200
✓ search page: status is 200
✓ resource page: status is 200

cache_hits..................: 1234
cache_misses................: 567
landing_page_duration.......: avg=150ms p(95)=250ms
search_page_duration........: avg=300ms p(95)=500ms
resource_page_duration......: avg=200ms p(95)=350ms
http_req_duration...........: avg=225ms p(95)=400ms
```

### Thresholds

Tests will fail if:

- 95th percentile response time > 2000ms
- Error rate > 10%

## Tips

1. **Populate data files** with realistic queries and UUIDs from your database
2. **Run locally first** to establish baseline metrics
3. **Monitor server resources** during tests (CPU, memory, database connections)
4. **Adjust load profile** based on expected production traffic
5. **Check cache headers** in your application to ensure proper cache tracking

## Adding Cache Headers to Your Application

If you're using Next.js, you can add cache headers in your responses:

```javascript
// In your API route or page
export async function GET(request) {
  const response = new Response(data);
  response.headers.set('X-Cache', isFromCache ? 'HIT' : 'MISS');
  return response;
}
```

Or with middleware:

```javascript
export function middleware(request) {
  const response = NextResponse.next();
  response.headers.set('X-Cache', 'HIT'); // or 'MISS'
  return response;
}
```

## Troubleshooting

**Issue:** No cache status detected

- **Solution:** Add cache headers to your application responses

**Issue:** High error rate

- **Solution:** Check server logs, reduce load, or increase server capacity

**Issue:** Tests not running

- **Solution:** Ensure k6 is installed and data files are populated

## Next Steps

1. Populate `data/queries.js` and `data/resource-ids.js` with real data
2. Run a smoke test to verify everything works
3. Adjust load profile to match your needs
4. Run full load test and analyze results
5. Iterate on performance improvements
