# -*- coding: utf-8 -*-
"""Inspect chainMap/coverage/observe structure in combo-training.json + JS."""
import json
import re
import collections

d = json.load(open("src/data/combo-training.json", encoding="utf-8"))
courses = d["courses"]
chains = d["chains"]

c0 = courses[0]
print("course keys:", sorted(c0.keys()))
s0 = c0["steps"][0]
print("step keys:", sorted(s0.keys()))

# find chainMap-like: maybe per-course 'chain'/'chains' field
for key in ("chain", "chains", "chainMap", "chainIndices"):
    if key in c0:
        print("course has", key, ":", c0[key] if not isinstance(c0[key], list) else c0[key][:8])

# chain entries structure
home = chains["home"]
print("chain entry sample:", json.dumps(home[0], ensure_ascii=False)[:300])

# count observe across chains
observe_total = 0
chain_entry_total = 0
for cid, ch in chains.items():
    obs = sum(1 for e in ch if isinstance(e, dict) and e.get("type") == "observe")
    observe_total += obs
    chain_entry_total += len(ch)
print("chain entries total:", chain_entry_total, "| observe entries:", observe_total)

# chainMap: maybe key 'chainMap' in json with different name; search raw text
raw = open("src/data/combo-training.json", encoding="utf-8").read()
for kw in ("chainMap", "coverage", "observe"):
    print(kw, "occurrences in json:", raw.count(kw))

# coverage in 24-combo-training.js
js = open("src/js/24-combo-training.js", encoding="utf-8").read()
m = re.search(r"TUTORIAL_COVERAGE\s*=\s*\{", js)
print("TUTORIAL_COVERAGE in 24js:", bool(m))
if m:
    # count keys at version level
    seg = js[m.start():m.start() + 400]
    print(seg[:300].replace("\n", " | "))

# chainMap in JS
m2 = re.search(r"chainMap", js)
print("chainMap occurrences in 24js:", js.count("chainMap"))

# count coverage keys: parse TUTORIAL_COVERAGE via node instead
