# Agents

See [e2e/AGENTS.md](/e2e/AGENTS.md) for Playwright e2e test conventions (waiting rules, selectors, helper module map).

## Payload Feature Workflow

When working on a Payload feature, follow this workflow:

1. Open the Payload dashboard first and decide where the new config or field should live in the admin UI. Place it where a content manager would naturally expect to find it.
2. Find the corresponding Payload config in code. For search-related settings, this often means [src/payload/collections/ResourceDirectories/tabs/search.ts](/Users/davidbotos/Desktop/9-BearHug_Product/9-NorseRepos/Norse/src/payload/collections/ResourceDirectories/tabs/search.ts).
3. Add the new field to the Payload config.
4. Decide whether the field should be localized. If the value is user-facing copy, it will often need `localized: true`.
5. If the field is a localized search text, add it to `SEARCH_TEXT_FIELDS` in [src/payload/jobs/translate.ts](/Users/davidbotos/Desktop/9-BearHug_Product/9-NorseRepos/Norse/src/payload/jobs/translate.ts) so automatic translation continues to work.
6. Create the Payload migration and regenerate types after the schema change. Use `npm run create-migration -- <name>` and then regenerate types.
7. Prefer additive, backward-compatible changes. Do not push destructive migrations directly unless there is a clear, intentional reason and the change has been reviewed with backward compatibility in mind.

For simple extensions, expect the work to include both the admin schema change and the generated migration/types so deployed environments can boot cleanly and apply `payload migrate` successfully.

## OpenAPI SDK Workflow

For internal API integrations, treat OpenAPI as source of truth and use generated SDK clients.

1. Generate SDK with `npm run generate:api-sdk`.
2. Use shared clients from `src/lib/api/clients.ts` instead of creating ad-hoc SDK instances in feature files.
3. Prefer generated DTOs from `src/lib/api/generated/data-contracts.ts` for API contracts.
4. Remove duplicate hand-written API request/response types when the generated type already exists.
5. Keep app-specific UI/domain types when they represent transformed view models (not raw API contracts).
6. If API behavior and generated types diverge, update the OpenAPI spec first, then regenerate.

## Norse API tenant requirement

Every Norse API request must include a tenant id (`x-tenant-id` / `tenant_id`).
Tenant defines the data blend; no-tenant requests are invalid.
Fail fast in the service that calls Norse API — do not invent shared cache keys
or send anonymous requests.
