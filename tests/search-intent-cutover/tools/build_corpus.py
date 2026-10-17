#!/usr/bin/env python3
"""Build the search-intent cut-over corpus (ISS-2370): one synthetic URL per scenario seen in production.

Temporary: this directory is deleted by ISS-2377 at cut-over.

    python3 build_corpus.py <harvest-dir> <out-dir>

The harvest (private, never committed) is every distinct /search URL from 90 days of Umami page views.
Each URL is reduced to a *scenario key*: everything about it that can change how Norse parses, routes,
rewrites or re-serialises it, and nothing else. One representative is kept per scenario, and every
free-text value in it is replaced by a synthetic value of the same class, so no typed text is kept.
"""
import hashlib, json, re, sys
from collections import defaultdict
from pathlib import Path
from urllib.parse import parse_qsl, quote, quote_plus, unquote_plus

# ---------------------------------------------------------------- vocabulary
SAFE_KEYS = {"query_type", "organization_id", "taxonomy", "sort", "page", "age", "a", "sllc",
             "ai_scenario", "ai_options", "pdid", "pdsid", "entry", "query_language", "distance", "hl", "_rsc"}
FREE_KEYS = {"query", "query_label", "location", "coords", "filters"}
KNOWN_KEYS = SAFE_KEYS | FREE_KEYS
TRACKING = re.compile(r"^(utm_.*|fbclid|gclid|gbraid|wbraid|msclkid|li_fat_id|ttclid|twclid|_gl|mc_cid|mc_eid|gad_source|gad_campaignid|srsltid)$")
ENUMS = {
    "query_type": {"text", "hybrid", "taxonomy", "keyword", "query", "name", "term", "taxo", "taxonom"},
    "sort": {"relevance", "distance", "name", "organization"},
    "a": {"low_info", "low_confidence"},
    "ai_scenario": {"search", "clarify_low_info", "clarify_multiple_labels",
                    "search_and_notify_low_info", "search_and_notify_low_confidence"},
    "sllc": {"1"},
    "entry": {"search_card", "topic_card"},
    "query_language": {"en", "es"},
}
EVERYWHERE = {"everywhere", "anywhere"}
# One taxonomy code (AIRS "BD-1800.2000-620", or numeric Open Eligibility). Unambiguous on purpose: an
# ambiguous "-?[\d.\-]*" backtracked exponentially on long code lists (seen 2026-10-16).
_CODE = r"(?:[A-Za-z]{1,2}(?:-[\d.*]*(?:-[\d.*]+)*)?|\d+)"
CODES = re.compile(rf"^\s*{_CODE}(?:\s*,\s*{_CODE})*\s*$")
NUM = r"-?\d+(?:\.\d+)?"
import string
# Punctuation that changes URL parsing, encoding or code detection is tracked mark by mark ("-" and "."
# decide whether "211-211" is a code); every other ascii mark only counts as "has other punctuation".
SPECIALS = "&=#?+%,{}\""                     # URL structure, comma splitting, JSON detection
MARK = "synthetic"
TOKEN_KEYS = set(ENUMS) | {"page", "age", "distance", "sort", "hl", "_rsc"}
TOKEN = re.compile(r"\s*[\w.\-]{0,40}\s*")       # a bare token in a token-valued field: junk, not typed prose

def base_key(k):
    return re.sub(r"\[.*$", "", re.sub(r"^(amp;)+", "", k))

def is_known_key(k):
    b = base_key(k)
    return b in KNOWN_KEYS or bool(TRACKING.match(b))

def tokens(q):
    for t in q.lstrip("?").split("&"):
        k, eq, v = t.partition("=")
        yield t, k, eq, v

# ---------------------------------------------------------------- value classes
def text_class(v):
    """Only what Norse's parsing, trimming and encoding act on: emptiness, edge and inner whitespace,
    URL-structural and JSON characters, leftover escapes, and whether non-ascii characters are present."""
    if v == "": return ("empty",)
    if v.strip() == "": return ("blank",)
    core = v.strip()
    return ("text",
            "lead" if v != v.lstrip() else "", "trail" if v != v.rstrip() else "",
            "inner" if " " in core else "",
            "".join(sorted(set(ch for ch in core if ch in SPECIALS))),
            "esc" if re.search(r"%[0-9A-Fa-f]{2}", core) else "",
            "nonascii" if any(not ch.isascii() for ch in core) else "")

# Norse's own taxonomy-query test (src/app/(app)/shared/lib/search-utils.ts, isTaxonomyQuery):
# every comma part, untrimmed, matches CODE_PATTERN, or the whole value is a JSON object.
NORSE_CODE = re.compile(r"^[a-zA-Z]{1,2}(-\d{1,4}([.-]\d{1,4}){0,3})?$", re.I)
def norse_is_taxonomy_query(v):
    if not v: return False
    if re.fullmatch(r"\{.*\}", v, re.S):
        try: return isinstance(json.loads(v), dict)
        except ValueError: return False
    return all(NORSE_CODE.match(part) for part in v.split(","))

def value_class(key, v):
    b = base_key(key)
    if b in ENUMS:
        if v.strip() in ENUMS[b]:
            return ("enum", v.strip(), "lead" if v != v.lstrip() else "", "trail" if v != v.rstrip() else "")
        return ("other",) + text_class(v)
    if b == "query" and norse_is_taxonomy_query(v):
        return ("json-object", "space" if " " in v else "") if v.lstrip().startswith("{") else ("codes",)
    if b == "location" and v.strip().lower() in EVERYWHERE: return ("everywhere", v)
    if b == "coords":
        if v.strip() == "": return text_class(v)
        m = re.fullmatch(rf"\s*({NUM})\s*,\s*({NUM})\s*", v)
        if not m: return ("coords-malformed",)
        x, y = float(m.group(1)), float(m.group(2))
        if x == 0 and y == 0: return ("coords-zero",)
        return ("coords-ok",) if -180 <= x <= 180 and -90 <= y <= 90 else ("coords-range",)
    if b == "distance":
        if re.fullmatch(rf"\s*{NUM}\s*", v): return ("number",)
        if re.fullmatch(rf"\s*{NUM}\s*,\s*{NUM}\s*", v): return ("pair",)
        return ("other",) + text_class(v)
    if b in ("page", "age"):
        return ("int",) if re.fullmatch(r"[1-9]\d{0,3}", v) else ("other",) + text_class(v)
    if b == "taxonomy":
        # Norse's parseCommaSeparatedValues: split on ",", trim, drop empties, de-duplicate. No validation.
        parts = v.split(",")
        kept = [p.strip() for p in parts if p.strip()]
        return ("taxonomy", "none" if not kept else "one" if len(kept) == 1 else "many",
                "padded" if any(p != p.strip() for p in parts) else "",
                "empty-part" if len(kept) < len(parts) else "",
                "dupes" if len(set(kept)) < len(kept) else "")
    if b in ("organization_id", "pdid", "pdsid", "ai_options"): return ("id",) if v.strip() else text_class(v)
    if b in SAFE_KEYS: return ("safe",) + text_class(v)
    return text_class(v)   # query, query_label, filters values, unknown parameters

def path_template(p):
    return re.sub(r"/(zh-Hans|zh-Hant|[a-z]{2}(?:-[A-Za-z]{2})?)(?=/)", "/<loc>", p)

def scenario_key(path, q, generation, modifiers):
    pairs = parse_qsl(q.lstrip("?"), keep_blank_values=True)
    known, unknown = defaultdict(list), []
    for k, v in pairs:
        (known[base_key(k)] if is_known_key(k) else unknown).append((k, v))
    params = {}
    for b, kvs in sorted(known.items()):
        if TRACKING.match(b): params["<tracking>"] = ("present",); continue
        if b == "filters":
            names = {re.sub(r"\[\d+\]$", "", k) for k, _ in kvs}
            params[b] = ("filters", "1" if len(names) == 1 else "2+",
                         "1" if len(kvs) == len(names) else "multi",
                         tuple(sorted({value_class(k, v) for k, v in kvs})))
        elif b == "ai_options":
            idx = {re.findall(r"\[(\d+)\]", k)[0] for k, _ in kvs if re.findall(r"\[(\d+)\]", k)}
            fields = tuple(sorted({re.sub(r"^ai_options\[\d+\]", "", k) for k, _ in kvs}))
            params[b] = ("ai_options", "1" if len(idx) == 1 else "2+", fields)
        else:
            classes = tuple(value_class(k, v) for k, v in kvs)
            params[b] = classes if len(classes) > 1 else classes[0]   # a repeated key is its own scenario
    return json.dumps({
        "path": path_template(path), "generation": generation, "modifiers": sorted(modifiers),
        "params": params,
        "unknown": sorted(text_class(k) + (("empty-value",) if v == "" else ()) for k, v in unknown),
        "amp": min(q.count("amp;"), 2), "pct25": "%25" in q,
        "space": ("+" in q) * 1 + ("%20" in q) * 2,
    }, sort_keys=True, default=list)

# ---------------------------------------------------------------- synthetic values
def synth_text(v, word, uniq=0):
    """A value of exactly v's text class: ascii letters from `word`, plus what the class needs."""
    cls = text_class(v)
    if cls[0] in ("empty", "blank"): return v
    _, lead, trail, inner, specials, esc, nonascii = cls
    core = word + ("abcdefghijklmnopqrstuvwxyz"[uniq % 26] * (1 + uniq // 26) if uniq else "")
    if inner: core += " text"
    if nonascii: core += "é"
    core += specials.replace("%", "")
    if esc: core += re.search(r"%[0-9A-Fa-f]{2}", v).group(0)
    elif "%" in specials: core += "%"
    lead_ws = v[: len(v) - len(v.lstrip())] if lead else ""
    trail_ws = v[len(v.rstrip()):] if trail else ""
    return lead_ws + core + trail_ws

def synth_value(key, v, n):
    b = base_key(key)
    cls = value_class(key, v)
    if cls[0] == "coords-ok": return "-122.3,47.6"
    if cls[0] == "coords-malformed": return "malformed-coords"
    if cls[0] == "coords-range": return "-300.0,95.0"
    if cls[0] == "coords-zero": return "0,0"
    if cls[0] == "json-object": return '{"q": "synthetic query"}' if cls[1] else '{"q":"syntheticquery"}'
    if cls[0] in ("enum", "codes", "everywhere", "taxonomy", "number", "pair", "int", "id") and b != "filters":
        return v                                   # not typed text: enums, codes, ids, numbers
    if cls[0] in ("empty", "blank"): return v
    if b in TOKEN_KEYS and TOKEN.fullmatch(v): return v       # junk token in a token field, not prose
    word = {"query": "syntheticquery", "query_label": "syntheticlabel", "location": "syntheticplace",
            "filters": "syntheticvalue"}.get(b, "synthetic" + re.sub(r"[^a-z]", "", b))
    return synth_text(v, word)

def encode_like(raw, new):
    """Encode `new` the way `raw` was encoded: + or %20 for spaces; a bare % stays bare if raw had no %25."""
    if "%20" in raw and "+" in raw:
        if new.count(" ") == 1: new = new.replace(" ", "  ", 1)   # room for one + and one %20
        enc = quote(new, safe="").replace("%20", "+", 1)
    elif "+" in raw or ("%20" not in raw and " " not in unquote_plus(raw)): enc = quote_plus(new, safe="")
    else: enc = quote(new, safe="")
    if "%25" not in raw: enc = enc.replace("%25", "%")
    return enc

def synthesise(q):
    out, names = [], {}
    for n, (t, k, eq, v) in enumerate(tokens(q)):
        dk = unquote_plus(k); nk = k
        if not is_known_key(dk):
            names.setdefault(dk, len(names) + 1)
            nk = encode_like(k, synth_text(dk, "syntheticparam", uniq=names[dk]))
        if not eq:
            out.append(nk); continue
        dv = unquote_plus(v)
        new = synth_value(dk, dv, n) if is_known_key(dk) else synth_text(dv, "syntheticvalue")
        out.append(f"{nk}={v if new == dv else encode_like(v, new)}")
    return "&".join(out)

# ---------------------------------------------------------------- build
def scenarios(classified):
    best, counts = {}, defaultdict(lambda: [0, 0])
    for line in open(classified):
        c = json.loads(line)
        if re.search(r"(^|&)_rsc=", c["url_query"]): continue
        key = scenario_key(c["url_path"], c["url_query"], c["generation"], c["modifiers"])
        counts[key][0] += 1; counts[key][1] += c["views"]
        cur = best.get(key)
        if cur is None or (not c["truncated"], c["views"]) > (not cur["truncated"], cur["views"]):
            best[key] = c
    return best, counts

def main(harvest, out):
    harvest, out = Path(harvest), Path(out)
    best, counts = scenarios(harvest / "classified.jsonl")
    rows, gaps = [], []
    for key, c in best.items():
        if c["truncated"]: gaps.append(key); continue
        rows.append({
            "scenario": hashlib.sha1(key.encode()).hexdigest()[:12],
            "tenant": c["tenant"], "path": c["url_path"], "query": synthesise(c["url_query"]),
            "generation": c["generation"], "modifiers": c["modifiers"],
            "urls_in_scenario": counts[key][0], "views_in_scenario": counts[key][1],
        })
    (out / "corpus").mkdir(parents=True, exist_ok=True)
    for f in (out / "corpus").glob("*.jsonl"): f.unlink()
    by_gen = defaultdict(list)
    for r in rows: by_gen[r["generation"]].append(r)
    for g, rs in sorted(by_gen.items()):
        with open(out / "corpus" / f"{g}.jsonl", "w") as f:
            for r in sorted(rs, key=lambda r: (-r["views_in_scenario"], r["scenario"])):
                f.write(json.dumps(r, ensure_ascii=False) + "\n")
    manifest = {"source": "Umami umami-prod website_event, /search page views, 90 days to 2026-10-17",
                "rule": "one synthetic URL per scenario; no typed text kept",
                "harvested_urls": sum(n for n, _ in counts.values()), "scenarios": len(best),
                "scenarios_in_corpus": len(rows), "scenarios_only_seen_truncated": len(gaps),
                "by_generation": {g: len(rs) for g, rs in sorted(by_gen.items())}}
    (out / "corpus" / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    (harvest / "scenario-gaps-truncated.jsonl").write_text("".join(k + "\n" for k in gaps))
    print(json.dumps(manifest, indent=2))

if __name__ == "__main__":
    main(*sys.argv[1:3])
