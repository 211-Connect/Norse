# Caching: Redis and per-feature memory caches

`withCache` (`src/utilities/withCache.ts`) puts a value in Redis (shared by
every instance) and/or in the instance's own memory, keyed by a typed
`CacheKey`. With about 40 requests/s spread over 10 instances, a memory hit
saves the Redis round trip on the hottest values. Redis keeps everything
else available to all instances.

## Memory caches: one LRU per feature

A key's **feature** is the part before its first `:`, e.g.
`search_results` in `search_results:<tenant>:<locale>:<hash>`. Each feature
has its own LRU with an entry limit and a size limit
(`MEMORY_CACHE_LIMITS`):

| Feature | Max entries | Max size | Kept for |
| --- | --- | --- | --- |
| `tenant` | 1,000 | 4 MB | 1 min |
| `tenant_basic_config` | 1,000 | 2 MB | 1 min |
| `resource_directory` | 500 | 24 MB | 1 min |
| `app_config` | 500 | 24 MB | 1 min |
| `search_config` | 500 | 8 MB | 1 min |
| `search_suggestions` | 2,000 | 8 MB | 1 min |
| `search_results` (common searches only) | 500 | 24 MB | 15 min |
| `region_area` | 200 | 16 MB | 1 min |
| anything else | 500 | 4 MB | 1 min |

Why per feature:

- **No crowding out.** A burst of one kind of value (e.g. bot searches)
  can't evict another (e.g. the tenant configs every page needs). Before,
  one shared 1,000-entry LRU held everything.
- **Bounded memory.** Sizes are counted as the length of the serialized
  value. All features together stay under about 120 MB per instance, even
  with large area shapes.
- **No single value can flush a feature.** A value bigger than a quarter of
  its feature's budget isn't kept in memory. It is still served, and still
  cached in Redis when the caller asked for that.

Shared rules for every memory entry:

- It is kept for **1 minute** (common search results: **15 minutes**),
  counted from when it was written in memory; reads don't extend it. Other
  instances' memory can't be cleared, so this bounds stale data. A value
  copied into memory from Redis can be up to the Redis TTL plus the memory
  TTL old (search results: 1 h 15 min).
- `clearMemoryCache()` clears every feature on the instance it runs on
  (Payload save hooks, the clear-cache endpoint).
- `memoryCacheStats()` returns the entries and bytes per feature.

## What is cached where

| Value | Redis | Memory | Why |
| --- | --- | --- | --- |
| Tenant, app config, resource directory, search config, suggestions, area shapes | yes | yes | read on almost every request, small set of keys |
| Search results, **common** searches | 1 h | 15 min | shared by many visitors |
| Search results, other searches | 1 h | no | too many distinct keys for memory |
| Map pins, geocoding | yes | no | |
| **Resources** (`/search/[id]`, `/details/original/[id]`, batch for favorites and printable directories) | **no** | **no** | almost every resource request is for a different id (bots crawl them one by one), so a cache only adds a Redis write and a round trip per request |

A **common search** (`isCommonSearch`,
`src/app/(app)/shared/lib/common-search.ts`) is:

- the first page of a category (`taxonomy`) search;
- with no filter values, location, coordinates, region or organization.

Within one request, React `cache()` still dedupes the resource a page and
its `generateMetadata` both read.

## Single flight

Concurrent misses for the same key in one instance share one fetch
(`createSingleFlight`, up to 30 s), so a burst on a cold key costs one
upstream call per instance. Resources aren't cached, so they don't get
this.
