from pathlib import Path
import json, re

ROOT=Path(__file__).resolve().parents[1]

def read(path):return (ROOT/path).read_text(encoding='utf-8')
def load(path):return json.loads(read(path))
def wire(value,ascii=False):return json.dumps(value,ensure_ascii=ascii,separators=(',',':')).replace('</','<\\/')
def build():
 cards=[json.loads(p.read_text()) for p in sorted((ROOT/'src/data/cards').glob('*.json'))]
 cats=load('src/data/categories.json');release=load('src/data/release.json');sources=load('src/data/source-catalog.json');skills=load('src/data/skill-catalog.json')
 assert len(cards)==len({c['id'] for c in cards})==release['cards']
 assert all(c['catId'] in cats and c['name'] and c['tpl'] for c in cards)
 assert len(sources)==len({s['id'] for s in sources})
 assert len(skills)==len({s['id'] for s in skills})
 assert release['version']==release['tutorialVersion']==release['devlogVersion']
 values={'CATS':cats,'DATA':cards,'RELEASE_MANIFEST':release,'SOURCE_CATALOG':sources,'SKILL_CATALOG':skills,'RETIRED_CARDS':load('src/data/retired-cards.json'),'XLSX_VENDOR_SOURCE':read('src/vendor/xlsx.full.min.js'),'IMPORT_WORKER_SOURCE':read('src/workers/import-parser.js')}
 data=read('src/templates/data.js')
 for key,value in values.items():data=data.replace('@@'+key+'@@',wire(value,key=='XLSX_VENDOR_SOURCE'))
 runtime=''.join(read('src/js/'+name) for name in load('src/js/order.json'))
 runtime=runtime.replace('@@GOVERNANCE_TEXT_GLOSSARY@@',wire(load('src/data/governance-language.json')))
 training=load('src/data/combo-training.json')
 assert training['version']==release['version'] and training['phase']==release['phase']
 runtime=runtime.replace('@@COMBO_CATALOG@@',wire(training))
 script=read('src/storage/playbook-database.js')+read('src/boot/start.js')+data+runtime+read('src/boot/error.js')
 html=read('src/templates/index.html').replace('@@PLAYBOOK_SCRIPT@@',script).replace('@@PLAYBOOK_STYLE@@',read('src/styles/app.css'))
 assert not re.search(r'@@[A-Z_]+@@',html)
 # Reproducible output on every platform: a lone-LF, UTF-8 byte stream.
 # Source files may be checked out with CRLF; normalise before writing so the
 # build never depends on the checkout's line endings.
 html=html.replace('\r\n','\n').replace('\r','\n')
 assert '\r' not in html
 output=ROOT/'dist/index.html';output.parent.mkdir(exist_ok=True);output.write_text(html,encoding='utf-8',newline='\n')
 print(f'Built {release["version"]}/{release["phase"]}: {len(cards)} cards, {len(sources)} source entries, {len(skills)} skills, {len(html.encode())} bytes')
 return output

if __name__=='__main__':build()
