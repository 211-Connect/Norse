#!/usr/bin/env python3
"""Checks the scenario corpus against the private harvest it came from (ISS-2370).

    python3 verify_corpus.py <harvest-dir> [<corpus-dir>]

Exit 0 = all checks passed, 1 = a check failed, 2 = could not verify (missing input, nothing compared).
Temporary: deleted with this directory by ISS-2377.

Checks:
  coverage      every scenario seen in production (not only-truncated, not _rsc) is in the corpus exactly once
  preservation  each synthetic URL falls in the same scenario as its original, with generation and
                modifiers recomputed here, independently of the harvest's labels
  no typed text every free-text value and unknown parameter name in the corpus is synthetic
"""
import json, re, sys
from collections import Counter
from pathlib import Path
from urllib.parse import parse_qsl

sys.path.insert(0, str(Path(__file__).parent))
import build_corpus as B

# Independent copy of the harvest's generation/modifier classifier (ISS-2370 harvest script), including
# its own tracking list, which is narrower than the builder's: copying the builder's would hide a mismatch.
HARVEST_TRACKING = re.compile(r"^(utm_.*|fbclid|gclid|gbraid|wbraid|msclkid|li_fat_id|ttclid|twclid|_gl|mc_cid|mc_eid)$")

def classify(q):
    pairs = parse_qsl(q.lstrip("?"), keep_blank_values=True)
    keys = {re.sub(r"\[.*$", "", k) for k, _ in pairs}
    vals = {}
    for k, v in pairs: vals.setdefault(re.sub(r"\[.*$", "", k), []).append(v.strip())
    first = lambda k: (vals.get(k) or [""])[0]
    has = lambda k: any(vals.get(k, []))
    qt = first("query_type")
    if "ai_scenario" in keys or "ai_options" in keys: gen = "clarify"
    elif first("a") in ("low_info", "low_confidence"): gen = "ai_notify"
    elif qt == "hybrid": gen = "canonical_ai" if has("taxonomy") else "hybrid_no_taxonomy"
    elif qt == "taxonomy": gen = "taxonomy_card"
    elif qt in ("", "text") and has("query"): gen = "classic_text"
    elif not has("query") and not has("taxonomy") and has("organization_id"): gen = "organization_link"
    elif not has("query") and not has("taxonomy"): gen = "no_query"
    else: gen = "other"
    known = {"query", "query_label", "query_type", "organization_id", "location", "coords", "distance", "taxonomy",
             "filters", "sort", "page", "age", "a", "sllc", "ai_scenario", "ai_options", "pdid", "pdsid"}
    mods = []
    if has("location") and not has("coords"): mods.append("location_no_coords")
    if "pdid" in keys or "pdsid" in keys: mods.append("printable_directory")
    for k in ("filters", "organization_id", "sort", "page", "age", "distance", "coords", "sllc", "query_label"):
        if k in keys: mods.append(k)
    if any(k not in known and not HARVEST_TRACKING.match(k) for k in keys): mods.append("unknown_keys")
    return gen, mods

def is_synthetic(v):
    """Independent of the builder's synthesis: synthetic text always carries the marker."""
    return v.strip() == "" or B.MARK in v

def leaks(q):
    """Free text left in a corpus URL: a prose value or unknown parameter name that isn't synthetic."""
    n = 0
    for k, v in parse_qsl(q.lstrip("?"), keep_blank_values=True):
        if not B.is_known_key(k) and not is_synthetic(k): n += 1
        b = B.base_key(k)
        if B.is_known_key(k) and b in B.TOKEN_KEYS and B.TOKEN.fullmatch(v): continue
        cls = B.value_class(k, v) if B.is_known_key(k) else B.text_class(v)
        if cls[0] in ("text", "other", "safe") and not is_synthetic(v): n += 1
        if cls[0] == "coords-ok" and v != "-122.3,47.6": n += 1
    return n

def main(harvest, corpus=None):
    harvest = Path(harvest); corpus = Path(corpus or Path(__file__).parent.parent / "corpus")
    if not (harvest / "classified.jsonl").exists() or not list(corpus.glob("*.jsonl")):
        print("could not verify: harvest or corpus missing"); return 2
    import hashlib
    expected = {}
    for line in open(harvest / "classified.jsonl"):
        c = json.loads(line)
        if re.search(r"(^|&)_rsc=", c["url_query"]): continue
        k = B.scenario_key(c["url_path"], c["url_query"], c["generation"], c["modifiers"])
        expected.setdefault(hashlib.sha1(k.encode()).hexdigest()[:12], [k, False])[1] |= not c["truncated"]
    expected = {sid: k for sid, (k, has_whole) in expected.items() if has_whole}
    rows = [json.loads(l) for f in sorted(corpus.glob("*.jsonl")) for l in open(f)]
    if not rows or not expected:
        print("could not verify: nothing to compare"); return 2

    fails = Counter()
    seen = Counter()
    for r in rows:
        if r["scenario"] not in expected: fails["coverage: scenario in corpus not seen in production"] += 1; continue
        original_key = expected[r["scenario"]]
        gen, mods = classify(r["query"])
        if gen != r["generation"]: fails["preservation: generation changed"] += 1
        if sorted(mods) != sorted(r["modifiers"]): fails["preservation: modifiers changed"] += 1
        new_key = B.scenario_key(r["path"], r["query"], gen, mods)
        if json.loads(new_key) != json.loads(original_key): fails["preservation: scenario changed"] += 1
        seen[r["scenario"]] += 1
        if leaks(r["query"]): fails["no typed text: free text not synthetic"] += 1
    exp_n, got_n = set(expected), set(seen)
    missing, extra = exp_n - got_n, set()
    dupes = sum(1 for n in seen.values() if n > 1)
    if missing: fails["coverage: scenario missing from corpus"] += len(missing)
    if extra: fails["coverage: scenario in corpus not seen in production"] += len(extra)
    if dupes: fails["coverage: scenario present more than once"] += dupes

    # Canary: a URL full of typed text must come out with none of it.
    canary = "query=zq%20canary%20maple&location=742%20Evergreen%20Terrace&query_label=Jane%20Doe&zz%20note=hi&query_type=text"
    out = B.synthesise(canary)
    canary_ok = not any(w in out.lower() for w in ("canary", "evergreen", "jane", "doe", "note", "maple")) and leaks(out) == 0

    print(f"scenarios expected: {len(exp_n):,} | rows in corpus: {len(rows):,}")
    print(f"failures: {sum(fails.values()):,}" + "".join(f"\n  {n:>6,}  {f}" for f, n in fails.most_common()))
    print(f"canary (typed text in every field) fully synthesised: {canary_ok}")
    ok = not fails and canary_ok
    print("RESULT:", "pass" if ok else "FAIL")
    return 0 if ok else 1

if __name__ == "__main__":
    sys.exit(main(*sys.argv[1:3]))
