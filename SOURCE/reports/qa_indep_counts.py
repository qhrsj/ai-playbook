# -*- coding: utf-8 -*-
"""QA independent verification of combo-training.json numbers (v6.58/P80)."""
import json
import collections

d = json.load(open("src/data/combo-training.json", encoding="utf-8"))
print("top keys:", sorted(d.keys()))
courses = d.get("courses", [])
print("courses:", len(courses))
total_steps = 0
for c in courses:
    total_steps += len(c.get("steps", []))
print("total steps:", total_steps)

chains = d.get("chains", {})
if isinstance(chains, dict):
    print("chains:", len(chains))
    for cid, ch in chains.items():
        body = ch.get("steps", ch.get("indices", [])) if isinstance(ch, dict) else ch
        print("  chain", cid, "type:", type(ch).__name__, "len:", len(body) if hasattr(body, "__len__") else "?")
else:
    print("chains(list):", len(chains))

cm = d.get("chainMap", {})
print("chainMap entries:", len(cm))
assigned = collections.Counter()
ok = True
for cid, idxs in cm.items():
    course = next((c for c in courses if c.get("id") == cid), None)
    if course is None:
        print("!! chainMap course not found:", cid)
        ok = False
        continue
    n = len(course.get("steps", []))
    if sorted(idxs) != list(range(n)):
        print("!! chainMap not contiguous 0..n-1 for", cid, "n=", n, "idxs:", idxs[:6])
        ok = False
    for i in idxs:
        assigned[(cid, i)] += 1
overlap = {k: v for k, v in assigned.items() if v > 1}
print("overlapped assignments:", len(overlap))
print("assigned (course,step) pairs:", len(assigned), "of", total_steps, "| contiguous_ok:", ok)

tours = d.get("tours", [])
print("tours:", len(tours))
total_pts = 0
for t in tours:
    pts = t.get("points", t.get("steps", []))
    n = len(pts) if isinstance(pts, list) else pts
    total_pts += n
    print("  tour", t.get("id"), "points:", n)
print("tour total points:", total_pts)

cov = d.get("coverage", {})
print("coverage keys:", len(cov) if isinstance(cov, dict) else cov)
mp = d.get("map", {})
print("map keys:", sorted(mp.keys()) if isinstance(mp, dict) else type(mp).__name__)
if isinstance(mp, dict):
    fl = mp.get("flows", [])
    print("map.flows:", len(fl) if isinstance(fl, list) else type(fl).__name__)
    for f in (fl if isinstance(fl, list) else []):
        if isinstance(f, dict):
            print("  flow", f.get("id"), "entries:", len(f.get("items", f.get("entries", f.get("steps", [])))))

# cross-check with gate report
try:
    g = json.load(open("reports/tutorial-coverage-gate-results.json", encoding="utf-8"))
    print("--- gate report snapshot ---")
    print(json.dumps(g, ensure_ascii=False)[:1500])
except Exception as e:
    print("gate report read fail:", e)
