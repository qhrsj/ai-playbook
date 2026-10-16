# -*- coding: utf-8 -*-
import json, io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
d = json.load(open('src/data/combo-training.json', encoding='utf-8'))
for c in d['courses']:
    print(f"== {c['id']} | {c['title']} | group={c['group']} | fixture={c.get('fixture','default')} | steps={len(c['steps'])}")
    for i, s in enumerate(c['steps']):
        print(f"  {i:2d} [{s['type']:7s}] {s['instruction'][:46]}")
