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
| Rewrite           | `rewrite.ts`            | `rewriteSearchUrl`: lift the current URL, change it, serialize it (filter navigation, the coords redirect)                    |
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
- **Writers that edit the URL the visitor is on** (filter navigation, the coords redirect) lift it, change
  the intent and serialize it, through `rewriteSearchUrl` (`rewrite.ts`). A recognised plain key repeated
  in the URL, which the lift reads as nothing, is read as its first value, as `URLSearchParams.get` and the
  cookie middleware read it; a repeat the lift does read (`taxonomy`) and repeated pass-through keys are
  kept. No writer emits `key[n]` for a plain key (ISS-2409).
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

## Resolver

One XState machine, `searchResolverMachine` in `features/search/resolver/`, decides what the page does
with an intent. The server resolves it with a pure `initialTransition` before the search runs: no actor is
made and nothing is kept between requests. Prediction (ml-broker) runs outside the machine and comes back
as a `PREDICTION_RESOLVED` event, so the machine is tested without it. ISS-2294 moved today's deep-link
gate onto it unchanged.

| State                | Page action           | When                                                                                     |
| -------------------- | --------------------- | ---------------------------------------------------------------------------------------- |
| `resolving`          | none, transient       | tries the old gate's early returns in order                                              |
| `needs_prediction`   | `page:render-gate`    | a query needs classifying: on the server (gate cases B and D) or from the dialog's submit |
| `redirect_canonical` | `page:redirect`       | the prediction searches straight away: the canonical AI URL, with `a` for notify          |
| `redirect_clarify`   | `page:redirect`       | the prediction asks the user: the clarify URL                                            |
| `settled`, `idle`    | none, transient       | back to rest: clarify state left to show, or none                                        |
| `clarify_needs`      | `page:render-gate`    | clarify options are up: the dialog asks beside the results (any tenant, from the URL)    |
| `ready`              | `page:render-results` | everything else                                                                          |
| `location_required`  | `page:render-gate`    | the dialog's submit has no location and the location slot is a gate                      |
| `following_link`, `navigating_classic`, `navigating_ai` | `page:redirect` | the dialog's submit: a link topic, a search as typed, or a classified search |
| `skipping`, `confirmed` | `page:redirect`    | the clarify step's Skip, or Confirm after the re-rank                                    |
| `confirming`         | `page:render-gate`    | Confirm is waiting for the re-rank                                                       |

**The dialog runs on the same machine.** `useOnSearchSubmit` routes a submit with the same pure
transitions as the server, from `ready`: a link topic, the location policy, a search as typed, or a
prediction. `SearchDialog` runs an actor of the machine with `useMachine`, started from the page's
intent; its effects (navigation, the re-rank, the error toast) are supplied by `machine.provide()`.
Prediction and the re-rank run outside the machine and come back as events.

Every state the machine can rest in carries exactly one page-action tag, and a transient state carries
none; `tests/search-resolver.test.ts` walks every state node, nested ones included, to keep it that way.

**Policy.** Each slot is `gate` or `refine` per tenant (`resolver/policy.ts`), derived from existing
config: needs is `gate` on AI-classification tenants, location is `gate` where `requireUserLocation` is
on. Location gates only the dialog's submit (`location_required`); it never changes what the server
does.

```mermaid
stateDiagram-v2
  [*] --> resolving
  resolving --> settled: always [needsRefined]
  resolving --> settled: always [loopGuarded]
  resolving --> settled: always [canonicalAi]
  resolving --> settled: always [taxonomySearch]
  resolving --> settled: always [noQuery]
  resolving --> needs_prediction: always
  needs_prediction --> navigating_classic: PREDICTION_RESOLVED [fromDialog && predictionMissing]
  needs_prediction --> navigating_ai: PREDICTION_RESOLVED [fromDialog && directScenario]
  needs_prediction --> clarify_needs: PREDICTION_RESOLVED [fromDialog]
  needs_prediction --> settled: PREDICTION_RESOLVED [predictionMissing]
  needs_prediction --> redirect_canonical: PREDICTION_RESOLVED [directScenario]
  needs_prediction --> redirect_clarify: PREDICTION_RESOLVED
  needs_prediction --> idle: PREDICTION_SETTLED
  note right of needs_prediction: page:render-gate
  settled --> clarify_needs: always [clarifyStated]
  settled --> ready: always
  idle --> clarify_needs: always [clarifyShown]
  idle --> ready: always
  clarify_needs --> following_link: SUBMIT [linkTopic]
  clarify_needs --> location_required: SUBMIT [locationRequired]
  clarify_needs --> navigating_classic: SUBMIT [classicSubmit]
  clarify_needs --> needs_prediction: SUBMIT
  clarify_needs --> needs_prediction: PREDICTION_REQUESTED
  clarify_needs --> clarify_needs: OPTIONS_OFFERED
  clarify_needs --> ready: QUERY_EDITED
  clarify_needs --> skipping: SKIPPED
  clarify_needs --> confirming: CONFIRMED
  note right of clarify_needs: page:render-gate
  ready --> following_link: SUBMIT [linkTopic]
  ready --> location_required: SUBMIT [locationRequired]
  ready --> navigating_classic: SUBMIT [classicSubmit]
  ready --> needs_prediction: SUBMIT
  ready --> needs_prediction: PREDICTION_REQUESTED
  ready --> clarify_needs: OPTIONS_OFFERED
  note right of ready: page:render-results
  skipping --> idle: NAVIGATION_REFUSED
  skipping --> idle: NAVIGATION_SETTLED
  note right of skipping: page:redirect
  confirming --> idle: RERANK_RESOLVED [rerankFailed]
  confirming --> confirmed: RERANK_RESOLVED
  note right of confirming: page:render-gate
  confirmed --> idle: NAVIGATION_SETTLED
  note right of confirmed: page:redirect
  note right of following_link: page:redirect
  location_required --> following_link: SUBMIT [linkTopic]
  location_required --> location_required: SUBMIT [locationRequired]
  location_required --> navigating_classic: SUBMIT [classicSubmit]
  location_required --> needs_prediction: SUBMIT
  note right of location_required: page:render-gate
  note right of navigating_classic: page:redirect
  note right of navigating_ai: page:redirect
  note right of redirect_canonical: page:redirect
  note right of redirect_clarify: page:redirect
```

`always` transitions out of a state are tried top to bottom. The diagram is generated from the machine
(`node --import tsx tests/search-resolver-diagram.ts`), and a test fails when this copy differs.

## How to add a slot

1. **Declare it in `SEARCH_SLOTS`** (`slots.ts`) with its URL `keys`, a `decode` that returns
   `undefined` when the URL states nothing readable, and an `encode` that `decode` reads back. A slot
   missing either is a type error. Place it after `age`, so existing URLs keep their parameter order.
2. **Writer rules:** if writers must normalise the slot, add the rule to `applyWriterRules`, and nowhere
   else.
3. **Readers:** map it where it is consumed, in `toFindResourcesQuery` or in the resolver.
4. **Tests:**
   - add a fixture to `tests/search-intent-fixtures.ts` with its `canonical` URL. It fails until the
     slot is declared, because the key passes through instead;
   - every existing fixture already pins every slot, so a decoder that fills the slot when the URL says
     nothing fails them all (88 of them did when this guide was checked). The dummy-slot tests guard the
     lift itself: they fail if the lift ever fills a slot the URL did not state, whatever the slot;
   - if the slot changes which generation a URL is, update `generations.ts`, and the exactly-one test
     will say whether two generations now overlap.
5. **Run** `npm run test:unit`.
