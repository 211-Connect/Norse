# Tenant Norse API key

Per-tenant API key used to authenticate requests from the Norse web app to
internal Norse API endpoints.

## Where it is configured

In the Payload admin, go to **Tenants > API Settings** and set the
**API Key** field. The field is only visible/editable by super-admins.

The API key is not localized; it is a single credential per tenant.

## How it is stored and cached

- Stored on the `Tenant` document in the `api.apiKey` field.
- Cached under the Redis/memory key `tenant_api_key:${tenantId}` via
  `src/utilities/withCache.ts` (both Redis and in-process memory enabled).
- The cache is invalidated automatically when a tenant is updated because
  `src/payload/collections/Tenants/hooks/revalidateCache.ts` deletes
  `tenant_api_key:${doc.id}` and `clearMemoryCache()` flushes the in-process
  LRU cache.

## Where it is used

The key is sent on every request made through the generated SDK clients in
`src/lib/api/clients.ts`:

- `analyticsApiClient`
- `favoriteListApiClient`
- `geocodingApiClient`
- `printableDirectoriesApiClient`
- `printableDirectoriesPublicApiClient`
- `searchApiClient`
- `suggestionApiClient`
- `taxonomyScorecardApiClient`

The global internal API key (`x-internal-api-key`) is **not** sent by these
clients. Instead, each call site resolves the tenant and its key first, then
sends the header:

```http
x-tenant-api-key: ${tenantApiKey}
```

The helper lives in `src/lib/api/getTenantApiKey.ts`:

- `getTenantApiKey(tenantId)` — returns the cached key or throws if none is
  configured.
- `getTenantApiKeyHeaders(tenantId)` — returns
  `{ 'x-tenant-api-key': apiKey }`.

## Fail-fast behavior

If a call site has no tenant id, or the resolved tenant has no `api.apiKey`,
the helper throws before the request is sent. This matches the existing
"Norse API tenant requirement" rule: there must be a tenant context for every
Norse API request. The geocoding and printable-directory call sites have been
tightened so `tenantId` is typed as `string` (not optional) whenever the
generated client is invoked.

## Bulk backfill endpoint

A utility endpoint is registered at:

```
POST /api/payload/tenants/bulk-set-api-keys
```

Authentication is via the shared internal API key header:

```http
x-internal-api-key: ${process.env.INTERNAL_API_KEY}
```

Request body:

```json
{
  "apiKeys": [
    { "tenantId": "tenant-a", "apiKey": "secret-a" },
    { "tenantId": "tenant-b", "apiKey": "secret-b" }
  ]
}
```

The endpoint validates the secret, then updates each tenant via
`payload.update`, which triggers the normal `afterChange` cache invalidation.
The response summarizes `updated` and `failed` tenant ids.

## Out of scope

Hand-rolled `fetch()` calls — for example in `resource-service.ts`,
`search-service.ts`, most favorites server actions (all except
`getFavoriteList.ts`), `shortUrl/*`, and `src/app/(app)/api/resource-titles/route.ts`
— still use the global `INTERNAL_API_KEY` as `x-api-key`. Those call sites
were intentionally left unchanged in this feature.
