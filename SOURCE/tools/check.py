from pathlib import Path
import hashlib,json,re,subprocess
from html.parser import HTMLParser
from build import ROOT,build,load,read

class Text(HTMLParser):
 def __init__(self):super().__init__();self.parts=[]
 def handle_data(self,s):self.parts.append(s)

release=load('src/data/release.json');version=release['version'];phase=release['phase']
output=build();html=output.read_text();script=max(re.findall(r'<script\b[^>]*>([\s\S]*?)</script>',html),key=len)
result=subprocess.run(['node','--check'],input=script,text=True,capture_output=True)
assert result.returncode==0,result.stderr
for kind in ['FEATURES','BUGS','INTERNALS','TIMELINE']:
 assert re.search(r'DEVLOG_'+kind+r'\.push\(\{phase:[\'"]'+phase+r'[\'"]',read('src/js/08-detail-presentation.js')),kind
assert "'v"+version+"':" in read('src/js/15-scratchpad-reading-boot.js')
# P80: the tour override (and its literal title) moved into combo-training.json;
# the version note now lives in the operation-map data.
tutorial_catalog=load('src/data/combo-training.json')
assert 'v'+version in json.dumps(tutorial_catalog.get('map',{}),ensure_ascii=False)
assert len(tutorial_catalog['tours'])==5 and len(tutorial_catalog['courses'])==33
assert 'v'+version+' · '+phase in html
assert not re.search(r'@@[A-Z_]+@@',html)
for f in ['README.md','DEVELOPMENT.md','CHANGELOG.md']:assert 'v'+version in read(f) and phase in read(f)
snapshots=list((ROOT/'reports/local-workspace-render-check').glob('*.html'));assert len(snapshots)==7
for p in snapshots:assert p.stat().st_size>100
baseline=load('reports/baseline-data-hashes.json')
for name,expected in baseline.items():
 value=load('src/data/'+name) if name!='cards' else [json.loads(p.read_text()) for p in sorted((ROOT/'src/data/cards').glob('*.json'))]
 digest=hashlib.sha256(json.dumps(value,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
 assert digest==expected,name
for p in ['src/vendor/xlsx.full.min.js','src/workers/import-parser.js','src/storage/playbook-database.js']:
 data=(ROOT/p).read_bytes()
 if p=='src/storage/playbook-database.js':
  guard=b'  if(window.__PB_TRAINING_CHILD__)return {available:false,workspace:null};\n'
  assert data.count(guard)==1
  data=data.replace(guard,b'')
 assert hashlib.sha256(data).hexdigest()==load('reports/baseline-engine-hashes.json')[p],p
print('Passed: application syntax, local workspace renders, original data and parser/database hashes, release/tutorial/devlog consistency')
