# -*- coding: utf-8 -*-
"""QA independent verification #2 — correct schema v3 semantics.

chainMap[i] = chain index of course step i; base must equal chainMap[0];
union of chainMap arrays per chain must equal all non-observe indices
(seamless, ordered, no overlap); sliced steps byte-identical to chain.
"""
import json
import re
import collections

d = json.load(open("src/data/combo-training.json", encoding="utf-8"))
courses = d["courses"]
chains = d["chains"]
problems = []

print("schema:", d.get("schema"))
print("version/phase:", d.get("version"), d.get("phase"))
print("courses:", len(courses), "| total steps:", sum(len(c["steps"]) for c in courses))
print("chains:", len(chains), "| chain entries:", sum(len(v) for v in chains.values()))
obs_total = sum(1 for v in chains.values() for s in v if s.get("type") == "observe")
print("observe entries in chains:", obs_total)

per_chain = collections.defaultdict(list)
for c in courses:
    cid = c["id"]
    steps = c["steps"]
    if not c.get("from"):
        if c.get("chainMap") or c.get("base") is not None:
            problems.append(f"{cid}: standalone course has chainMap/base")
        continue
    frm = c["from"]
    chain = chains.get(frm)
    if not chain:
        problems.append(f"{cid}: missing chain {frm}")
        continue
    cm = c.get("chainMap")
    if not isinstance(cm, list) or len(cm) != len(steps):
        problems.append(f"{cid}: chainMap len != steps len")
        continue
    if c.get("base") != cm[0]:
        problems.append(f"{cid}: base {c.get('base')} != chainMap[0] {cm[0]}")
    for i, idx in enumerate(cm):
        if not (0 <= idx < len(chain)):
            problems.append(f"{cid} step{i}: chain idx {idx} out of range (len {len(chain)})")
            continue
        st = chain[idx]
        cs = steps[i]
        if st.get("type") == "observe":
            problems.append(f"{cid} step{i}: chain idx {idx} is observe")
        if not (cs.get("instruction") == st.get("instruction")
                and cs.get("check") == st.get("check")
                and cs.get("target") == st.get("target")):
            problems.append(f"{cid} step{i}: slice not byte-identical to chain[{idx}]")
        per_chain[frm].append((idx, cid, i))

print("--- per-chain seamless coverage ---")
for src, chain in chains.items():
    expected = [i for i, s in enumerate(chain) if s.get("type") != "observe"]
    got = sorted(x[0] for x in per_chain.get(src, []))
    status = "OK" if got == expected else "FAIL"
    if status == "FAIL":
        problems.append(f"chain {src}: coverage mismatch expected {expected} got {got}")
    dup = [k for k, v in collections.Counter(got).items() if v > 1]
    if dup:
        problems.append(f"chain {src}: duplicated chainMap targets {dup}")
    print(f"chain {src}: len={len(chain)} expected_action={len(expected)} covered={len(got)} -> {status}")

# observe step ids
observe_ids = sorted(s["id"] for v in chains.values() for s in v if s.get("type") == "observe")
print("observe ids:", len(observe_ids))

# tours: migrated points must equal observe ids
tours = d.get("tours", [])
print("tours:", len(tours), "total steps:", sum(len(t.get("steps", [])) for t in tours))
migrated = sorted(s["src"] for t in tours for s in t.get("steps", []) if s.get("origin") == "migrated")
print("migrated tour points:", len(migrated), "| equals observe ids:", migrated == observe_ids)
if migrated != observe_ids:
    problems.append("tour migrated points != chain observe ids")
authored = sum(1 for t in tours for s in t.get("steps", []) if s.get("origin") == "authored")
print("authored tour points:", authored)

# map flows
flows = d["map"]["flows"]
print("map.flows:", len(flows), [f["id"] for f in flows])

# TUTORIAL_COVERAGE keys (in 08-detail-presentation.js / 15-scratchpad-reading-boot.js)
js08 = open("src/js/08-detail-presentation.js", encoding="utf-8").read()
m = re.search(r"TUTORIAL_COVERAGE\s*=\s*\{", js08)
if m:
    # crude: count occurrences of version keys like 'v6.58': {
    seg = js08[m.end():m.end() + 20000]
    keys = re.findall(r"'(v[\d.]+)':\s*\{", seg)
    print("TUTORIAL_COVERAGE version keys (08):", keys[-6:], "count:", len(keys))
    v658 = re.search(r"'v6\.58':\s*\{", js08)
    if v658:
        # count leaf keys until matching close — count "label" or step entries
        seg2 = js08[v658.start():]
        # find the closing of this object: count braces
        depth = 0
        endpos = 0
        for i, ch in enumerate(seg2):
            if ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    endpos = i
                    break
        body = seg2[:endpos]
        leafs = re.findall(r"'([^']+)':\s*\[", body)
        print("v6.58 coverage leaf keys:", len(leafs))

# coverage gate report
g = json.load(open("reports/tutorial-coverage-gate-results.json", encoding="utf-8"))
print("gate coverageKeys:", g.get("coverageKeys"))

print("=" * 40)
print("PROBLEMS:", len(problems))
for p in problems:
    print("  !!", p)
