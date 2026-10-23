# Search intent

A search URL is read once into a typed **search intent** plus an **envelope**. A URL is written from an intent only by the
**serializer**. Code lives in `src/app/(app)/features/search/intent/`.

```
URL ──lift──▶ intent + envelope ──▶ page, deep-link gate, search request
writer args ──▶ intent ──applyWriterRules──▶ serializeSearch ──▶ /search URL
```

## The pieces

| Piece             | File                    | What it is                                                                                                                   |
| ----------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Slot declarations | `slots.ts`              | `SEARCH_SLOTS`: each slot's URL keys, `decode` and `encode`, in URL parameter order                                          |
| Intent            | `slot.ts`, `slots.ts`   | One `Slot<T>` per declaration: `{stated:false}` or `{stated:true, value}`                                                    |
| Envelope          | `envelope.ts`           | How the URL came to be, not what is searched: `sllc`, `a`, `page`, `pdid`, `pdsid`, `pdsrcid`, `entry`, and unrecognised pairs in order |
| Lift              | `lift.ts`               | `liftSearchParams` / `liftQueryString`: URL to intent and envelope, plus its generation                                      |
| Generations       | `generations.ts`        | The 8 URL shapes Norse has written, classified by shape                                                                      |
| Serializer        | `serialize.ts`          | `serializeSearch` (lossless) and `applyWriterRules` (the URL rules)                                                          |
| Adapter           | `legacy.ts`             | `toFindResourcesQuery`: the intent in the shape the search service and the deep-link gate take                               |

## Rules

- **Unknown is not empty.** A slot is unstated only where the URL says nothing readable (absent, repeated
  or bracketed plain keys, `age=abc`). Empty and `Everywhere` are stated.
- **The lift is pure.** It reads only the query string: no tenant config, no defaults, no lookups.
  Defaults belong to the resolver (ISS-2294).
- **Writing back is lossless.** `serializeSearch(lift(url))` lifts back to the same intent. The one
  listed exception is an unbalanced filter bracket that `qs` cannot write back.
- **Only writers apply the URL rules**, and only through `applyWriterRules`:
  - `query_type` is always written: `taxonomy` when stated or when the query looks like codes,
    otherwise the tenant's engine type;
  - query, label, organization, location and distance are trimmed, and empty values are dropped;
  - taxonomy codes are split, trimmed and de-duplicated;
  - "Everywhere" means no location; coords are written only as a pair; distance only with a location
    or coords;
  - a new search starts on page 1.
- **Hand-built `/search` URLs** live only in `features/search/utils/handBuiltSearchLinks.ts`, each
  pinned by a fixture. `tests/search-url-writers.test.ts` fails on any other one.

## Generations

| Generation           | Shape                                                              |
| -------------------- | ------------------------------------------------------------------ |
| `classic_text`       | a query, and `query_type` absent, `text` or anything unrecognised |
| `taxonomy_card`      | `query_type=taxonomy`                                              |
| `hybrid_no_taxonomy` | `query_type=hybrid` with no taxonomy                               |
| `canonical_ai`       | `query_type=hybrid` with taxonomy                                  |
| `ai_notify`          | `a=low_info` or `a=low_confidence`                                 |
| `clarify`            | `ai_scenario` or `ai_options`                                      |
| `organization_link`  | an `organization_id` with no query                                 |
| `no_query`           | none of the above                                                  |

Exactly one generation matches every URL; a test fails if that ever stops being true. Modifiers are
reported beside the generation: location without coords, printable directory, filters, sort, page, age,
distance, coords.

## Deep-link gate (until ISS-2294)

The gate runs only on AI-classification tenants, and is skipped when `sllc=1`:

- **hybrid with taxonomy, or `query_type=taxonomy`:** search as is;
- **any other query:** classify it, then redirect to the canonical AI URL, or to the clarify URL.

The redirect is written by `buildSearchUrl`, which goes through the serializer.

`docs/ai-search-legacy-link-flow.md` describes the gate in full until ISS-2377 replaces it with this
document.

## How to add a slot

1. **Declare it in `SEARCH_SLOTS`** (`slots.ts`) with its URL `keys`, a `decode` that returns
   `undefined` when the URL states nothing readable, and an `encode` that `decode` reads back. A slot
   missing either is a type error. Place it after `age`, so existing URLs keep their parameter order.
2. **Writer rules:** if writers must normalise the slot, add the rule to `applyWriterRules`, and nowhere
   else.
3. **Readers:** map it where it is consumed, in `toFindResourcesQuery` or in the resolver.
4. **Tests:**
   - add a fixture to `tests/search-intent-fixtures.ts` with its `canonical` URL;
   - the dummy-slot tests already prove every older URL lifts it unstated and writes nothing for it;
   - if the slot changes which generation a URL is, update `generations.ts`, and the exactly-one test
     will say whether two generations now overlap.
5. **Run** `npm run test:unit`.
