# Search intent cut-over corpus (temporary)

**Delete this whole directory in ISS-2377.** It exists only to prove **zero drift**: with the same
inputs, the refactored search URL handling (ISS-2291) produces the same outputs as production. The
tests that stay afterwards are the per-generation fixtures from ISS-2373.

## The idea

Values don't matter; scenarios do. A scenario is everything about a URL that can change how Norse
parses, rewrites or re-serialises it: the path, which parameters are present, repeated keys, encoding
damage, and the class of each value (empty, blank, edge or inner whitespace, URL-structural characters,
non-ascii, taxonomy codes, valid or malformed coords, and so on). The corpus holds **one URL per scenario
seen in production**. ISS-2371 then runs every scenario through every path in [BUILDERS.md](BUILDERS.md).

## What is here

| Path                        | What it is                                                         |
| --------------------------- | ------------------------------------------------------------------ |
| `corpus/<generation>.jsonl` | One synthetic URL per production scenario, one file per generation |
| `corpus/manifest.json`      | Source, rule and counts                                            |
| `BUILDERS.md`               | Every code path that builds or rewrites a search URL               |
| `tools/build_corpus.py`     | Builds `corpus/` from the private harvest                          |
| `tools/verify_corpus.py`    | Checks the corpus against the private harvest                      |

Each row: `scenario` (id), `tenant`, `path`, `query` (the raw query string), `generation`, `modifiers`,
and how many harvested URLs and page views fell in that scenario.

## Source

Umami (`umami-prod`, table `website_event`): `/search` page views for 90 days to 2026-10-17, 64
hostnames, 627,612 distinct URLs (excluding Next.js `_rsc` fetches). They fall into 10,046 scenarios.
587 scenarios were only ever seen in URLs that Umami cut off at 500 characters (ISS-2378), mostly
canonical AI and clarify URLs. They are left out here, and ISS-2371 covers them from writer output.

The raw harvest is private and is never committed.

## No typed text

Every free-text value (`query`, `query_label`, `location`, `filters` values, unknown parameter names and
values) is replaced by a synthetic value of the same class, containing `synthetic`. Kept as they are:
enumerated values (`query_type`, `sort`, `a`, …), taxonomy codes, ids, numbers, `Everywhere`, and short
junk tokens in token fields. Valid coordinates become `-122.3,47.6`. Values are rewritten in place inside
the raw query string, so encoding damage, repeated keys and the `&amp;` cascade are kept as received.

## Checks

```
python3 tools/verify_corpus.py <private-harvest-dir>
```

Exit 0 passes, 1 fails, 2 means it could not verify.

- **Coverage:** every production scenario is in the corpus exactly once.
- **Preservation:** each synthetic URL falls in the same scenario as its original, with generation and
  modifiers recomputed independently.
- **No typed text:** every free-text value carries the synthetic marker. A canary URL full of typed
  text comes out with none of it.

Each check has been shown to fail (2026-10-17): synthesis switched off gave 9,331 typed-text failures,
stand-ins without leading whitespace gave 136 preservation failures, and deleting or duplicating one
scenario gave one coverage failure each.
