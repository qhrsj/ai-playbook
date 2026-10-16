# -*- coding: utf-8 -*-
"""Pack the v6.58/P80 delivery zip: AI-Playbook-v6.58-P80-DELIVERY.zip
Same structure as prior releases: <top>/SOURCE tree + OPEN html + notes.
UTF-8 + LF preserved for text files; tools/probe scratch excluded."""
from pathlib import Path
import zipfile, hashlib

ROOT = Path(__file__).resolve().parents[2]      # D:/AIProject/提示词系统
SRC = ROOT / 'SOURCE'
TOP = 'AI-Playbook-v6.58-P80'
OUT = ROOT / f'{TOP}-DELIVERY.zip'

INCLUDE_DOCS_ROOT = ['DELIVERY-NOTES.md', 'START-HERE.md']
EXCLUDE_TOOLS = {'_probe_boot.cjs'}
EXCLUDE_REPORT_FILES = {'_probe_out.txt', '_probe_err.txt'}

def want(p: Path) -> bool:
    rel = p.relative_to(SRC).as_posix()
    if rel.startswith('dist/') or rel == 'dist/index.html':
        if rel != 'dist/index.html':
            return False
    if rel.startswith('tools/'):
        name = p.name
        if name in EXCLUDE_TOOLS or name.startswith('_probe'):
            return False
    if rel.startswith('reports/') and p.name in EXCLUDE_REPORT_FILES:
        return False
    return True

files = sorted(p for p in SRC.rglob('*') if p.is_file() and want(p))
# Historical gates retired in P80 must not ship in the report set — they no
# longer exist on disk anyway; nothing to filter here.
count = 0
with zipfile.ZipFile(OUT, 'w', zipfile.ZIP_DEFLATED) as z:
    for f in files:
        z.write(f, f'{TOP}/SOURCE/{f.relative_to(SRC).as_posix()}')
        count += 1
    for name in INCLUDE_DOCS_ROOT:
        z.write(ROOT / name, f'{TOP}/{name}')
        count += 1
    z.write(ROOT / f'OPEN-v6.58-P80.html', f'{TOP}/OPEN-v6.58-P80.html')
    count += 1
digest = hashlib.sha256(OUT.read_bytes()).hexdigest()
print('packed', count, 'entries ->', OUT.name, OUT.stat().st_size, 'bytes, sha256', digest)
