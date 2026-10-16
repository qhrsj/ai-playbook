# -*- coding: utf-8 -*-
"""Regenerate reports/baseline-data-hashes.json (canonical sha256 per data file).
Run after any intentional change to src/data datasets. skill-catalog.json included."""
import json, hashlib
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
def canon(v): return hashlib.sha256(json.dumps(v, ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode()).hexdigest()
base = {}
base['categories.json'] = canon(json.loads((ROOT/'src/data/categories.json').read_text(encoding='utf-8')))
base['source-catalog.json'] = canon(json.loads((ROOT/'src/data/source-catalog.json').read_text(encoding='utf-8')))
base['skill-catalog.json'] = canon(json.loads((ROOT/'src/data/skill-catalog.json').read_text(encoding='utf-8')))
base['retired-cards.json'] = canon(json.loads((ROOT/'src/data/retired-cards.json').read_text(encoding='utf-8')))
cards = [json.loads(p.read_text()) for p in sorted((ROOT/'src/data/cards').glob('*.json'))]
base['cards'] = canon(cards)
(ROOT/'reports/baseline-data-hashes.json').write_text(json.dumps(base, ensure_ascii=False, sort_keys=True, indent=1)+'\n', encoding='utf-8', newline='\n')
print('baseline regenerated:', sorted(base))
