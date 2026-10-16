# -*- coding: utf-8 -*-
"""P82: merge the refreshed Luzi Square exports into the app data.
- 炉子广场-文本提示词.xlsx (1614 rows) → src/data/source-catalog.json (dedup by 广场条目ID;
  existing entries are refreshed in place keeping their seq; new UUIDs appended).
- 炉子广场-Skill全量.xlsx (3285 rows) → src/data/skill-catalog.json (new catalog).
Segmented 超长正文 sheets are stitched back by 序号. Attribution (署名作者/署名来源/
作者主页) is preserved verbatim."""
import io, sys, json, re
from pathlib import Path
from openpyxl import load_workbook
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
ROOT = Path(__file__).resolve().parents[1]
SRC = Path(r'D:\AIProject\炉子安装内容')

def cell(v):
    if v is None: return ''
    s = str(v)
    return s.replace('\r\n', '\n').replace('\r', '\n').strip()

def sheet_rows(path, sheet):
    wb = load_workbook(path, read_only=True, data_only=True)
    ws = wb[sheet]
    rows = list(ws.iter_rows(values_only=True))
    wb.close()
    header = [cell(h) for h in rows[0]]
    out = []
    for r in rows[1:]:
        if all(v is None for v in r): continue
        out.append({header[i]: cell(v) for i, v in enumerate(r) if i < len(header)})
    return out

def stitch(main_rows, seg_rows, seq_key, seg_key, body_key, main_body_key):
    """Append 超长正文 segments (ordered) to the main row body when they carry more text."""
    segs = {}
    for r in seg_rows:
        key = r.get(seq_key, '')
        part = r.get(seg_key, '') or '1'
        m = re.match(r'\s*(\d+)', part)
        order = int(m.group(1)) if m else 1
        segs.setdefault(key, []).append((order, r.get(body_key, '')))
    for key in segs:
        segs[key] = ''.join(t for _, t in sorted(segs[key], key=lambda x: x[0]))
    stitched = 0
    for r in main_rows:
        key = r.get(seq_key, '')
        if key in segs:
            combined = segs[key]
            if len(combined) > len(r.get(main_body_key, '') or ''):
                r[main_body_key] = combined
                stitched += 1
    return stitched

def norm_body(s): return re.sub(r'\s+', '', s or '')

# ---------- 1. text prompts ----------
xlsx = SRC / '炉子广场-文本提示词.xlsx'
rows = sheet_rows(xlsx, '提示词清单')
stitched = stitch(rows, sheet_rows(xlsx, '超长正文'), '序号', '分段', '正文片段', '提示词全文')
print('text rows:', len(rows), 'stitched:', stitched)

catalog = json.loads((ROOT / 'src/data/source-catalog.json').read_text(encoding='utf-8'))
by_id = {e['id']: e for e in catalog}
body_index = {norm_body(e['text']): e for e in catalog}
existing_ids = {e['id'] for e in catalog}

updated, added, dup_body_skipped = 0, 0, 0
next_seq = len(catalog) + 1
for r in rows:
    entry = {
        'title': r.get('标题', ''),
        'publisher': r.get('署名作者', '') or '未标注',
        'publisherKind': r.get('署名来源', '') or '未标注',
        'publisherPage': r.get('作者主页', ''),
        'route': r.get('原创路由', ''),
        'originalAuthor': r.get('原始出处作者', ''),
        'inspiration': r.get('灵感来源', ''),
        'summary': r.get('摘要', ''),
        'tags': r.get('发布标签', ''),
        'tools': r.get('关联工具', ''),
        'model': r.get('模型', ''),
        'text': r.get('提示词全文', ''),
        'authorNote': r.get('作者说明', ''),
        'sourceVersion': r.get('来源版本', ''),
        'publishedAt': r.get('发布时间', ''),
        'note': r.get('备注', ''),
    }
    uid = r.get('广场条目ID', '')
    target = by_id.get(uid) if uid else None
    if target is None and uid:
        body_key = norm_body(entry['text'])
        target = body_index.get(body_key) if body_key else None
        if target is not None: dup_body_skipped += 1
    if target is not None:
        changed = any(target.get(k, '') != v for k, v in entry.items() if k != 'title' or v)
        for k, v in entry.items(): target[k] = v
        target.setdefault('relatedCards', []); target.setdefault('duplicateSeqs', [])
        if changed: updated += 1
    else:
        if uid and uid in existing_ids: continue
        entry['id'] = uid or ('legacy-' + str(next_seq))
        while any(e['id'] == entry['id'] for e in catalog): entry['id'] += '-x'
        entry['seq'] = next_seq; next_seq += 1
        entry['relatedCards'] = []; entry['duplicateSeqs'] = []
        catalog.append(entry); by_id[entry['id']] = entry
        body_index[norm_body(entry['text'])] = entry
        existing_ids.add(entry['id'])
        added += 1

catalog.sort(key=lambda e: e['seq'])
for i, e in enumerate(catalog): e['seq'] = i + 1
seen = set(); assert all(e['id'] not in seen and not seen.add(e['id']) for e in catalog)
(ROOT / 'src/data/source-catalog.json').write_text(json.dumps(catalog, ensure_ascii=False, separators=(',', ':')), encoding='utf-8', newline='\n')
print('source-catalog:', len(catalog), 'entries | refreshed:', updated, '| added:', added, '| body-dedup:', dup_body_skipped)

# ---------- 2. skills ----------
xlsx = SRC / '炉子广场-Skill全量.xlsx'
srows = sheet_rows(xlsx, 'Skill清单')
sstitched = stitch(srows, sheet_rows(xlsx, '超长正文'), '序号', '分段', '正文片段', '正文全文')
print('skill rows:', len(srows), 'stitched:', sstitched)

skills = []
seen_ids = set(); seen_bodies = set(); dropped = 0
for r in srows:
    uid = r.get('广场条目ID', '')
    text = r.get('正文全文', '')
    body_key = norm_body(text)
    if not text or not uid or uid in seen_ids or body_key in seen_bodies:
        dropped += 1; continue
    seen_ids.add(uid); seen_bodies.add(body_key)
    skills.append({
        'id': uid,
        'skillName': r.get('Skill 名称', ''),
        'nameZh': r.get('中文名', ''),
        'title': r.get('中文名', '') or r.get('Skill 名称', ''),
        'publisher': r.get('署名作者', '') or '未标注',
        'publisherKind': r.get('署名来源', '') or '未标注',
        'publisherPage': r.get('作者主页', ''),
        'route': r.get('原创路由', ''),
        'summary': r.get('摘要', ''),
        'desc': r.get('Skill 描述', ''),
        'entryFile': r.get('入口文件', ''),
        'fileCount': r.get('文件数', ''),
        'sizeKB': r.get('总大小(KB)', ''),
        'text': text,
        'tags': r.get('发布标签', ''),
        'scenes': r.get('场景', ''),
        'tools': r.get('关联工具', ''),
    })
for i, s in enumerate(skills): s['seq'] = i + 1
(ROOT / 'src/data/skill-catalog.json').write_text(json.dumps(skills, ensure_ascii=False, separators=(',', ':')), encoding='utf-8', newline='\n')
print('skill-catalog:', len(skills), 'entries | dropped(dupe/empty):', dropped)
