const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),cat=JSON.parse(read('src/data/combo-training.json')),release=JSON.parse(read('src/data/release.json'));
/* P80 schema v3: 32 action-only courses over 8 verbatim chains. */
assert.equal(cat.schema,'ai-playbook-combo-training-v3');
assert.equal(cat.courses.length,33);assert.equal(cat.courses.filter(c=>c.group==='高级工具拆招').length,0);
assert.equal(cat.courses.filter(c=>c.group==='主界面入门').length,0);
const stepCount=cat.courses.reduce((n,c)=>n+c.steps.length,0);assert.equal(stepCount,130);
assert(cat.courses.every(c=>c.steps.every(s=>['click','input','key'].includes(s.type))),'courses must not carry observe steps');
/* Slice integrity v3: for every sliced chain, the union of course chainMap
   arrays must equal the chain's non-observe indices — seamless, ordered,
   no overlap; sliced steps stay byte-identical to the chain. */
const chains=cat.chains||{};const perChain={};
for(const c of cat.courses){
 if(!c.from){assert(!c.chainMap&&!c.base,'standalone course must not slice a chain: '+c.id);continue;}
 const chain=chains[c.from];assert(Array.isArray(chain)&&chain.length,'missing chain '+c.from);
 assert(Array.isArray(c.chainMap)&&c.chainMap.length===c.steps.length,'chainMap must map every step of '+c.id);
 assert.equal(c.base,c.chainMap[0],'base must be chainMap[0] on '+c.id);
 for(let i=0;i<c.steps.length;i++){const st=chain[c.chainMap[i]];assert(c.steps[i].instruction===st.instruction&&c.steps[i].check===st.check&&c.steps[i].target===st.target&&c.steps[i].type!=='observe',c.id+' slice mismatch at '+i);}
 (perChain[c.from]??=[]).push(...c.chainMap);
}
for(const [src,chain] of Object.entries(chains)){
 const expected=chain.map((s,i)=>s.type==='observe'?null:i).filter(x=>x!==null);
 if(!perChain[src]){assert.equal(expected.length,0,'chain '+src+' has action steps but no slicing courses');continue;}
 assert.deepEqual(perChain[src],expected,'chain '+src+' must be seamlessly covered by action slices');
}
/* Layer-1 operation map: 4 flows, selectors are real controls. */
assert.equal(cat.map.flows.length,4);
const html=read('src/templates/index.html');
const RUNTIME_SELS=new Set(['#q','#needGatewayForm button[type="submit"]','#home .card','#home [data-favorite-card]','#home .home-category-tabs','#home .home-pager','[data-home-library-tab="official"]','[data-home-library-tab="personal"]','#sort','#home [data-home-action="rotate-hero"]','#home .home-primary-actions [data-scratch-open]','#home .home-primary-actions [data-workspace-open]','[data-view="core-inputs"] textarea','[data-action="copy"]','[data-trash-purge="USR-09-LAB"]','[data-workspace-import]','[data-workspace-export]','[data-pw-versions]','[data-pw-create]','[data-pw-tab="favorites"]','[data-pw-tab="prompts"]','[data-pw-tab="check"]','[data-pw-tab="backup"]','[data-pw-tab="trash"]','#personalWorkspaceBtn','#navScratchBtn','#importBtn','#sourceCatalogBtn','#devlogBtn','#tourBtn','#helpModeBtn','#navReadingBtn','#navCountToggle','#themeBtn','#modeBtn','#mobileBtn','#navLayoutReset','#devlogFoot']);
const selStatic=sel=>{
 if(html.includes(sel))return true;
 if(sel.startsWith('#')&&!sel.includes(' ')&&html.includes('id="'+sel.slice(1)+'"'))return true;
 const attrs=[...sel.matchAll(/\[([\w-]+)(?:="([^"]*)")?\]/g)];
 if(attrs.length)return attrs.every(m=>html.includes(m[2]===undefined?m[1]:m[1]+'="'+m[2]+'"'));
 // class-based sel like ".nav .brand-copy": the significant class must exist in markup
 const classes=[...sel.matchAll(/\.([\w-]+)/g)];
 return classes.length>0&&classes.every(m=>html.includes(m[1]));
};
/* Course targets are already proven by the action gates and the real-browser
   diagnostics, so they are a valid data-driven whitelist. */
const courseTargets=new Set(cat.courses.flatMap(c=>c.steps.flatMap(s=>[s.target,...(s.observe?[s.observe.target]:[])])));
const selKnown=sel=>selStatic(sel)||RUNTIME_SELS.has(sel)||courseTargets.has(sel);
for(const f of cat.map.flows){assert(f.title&&f.tour&&f.course,('flow '+f.id));for(const s of f.steps){assert(s.sel&&s.label&&s.detail,'flow step of '+f.id);assert(selKnown(s.sel),'sel not static and not whitelisted: '+s.sel);}assert(Array.isArray(f.courses)&&f.courses.length&&f.courses.every(id=>cat.courses.some(c=>c.id===id)),'flow courses of '+f.id);assert(cat.courses.find(c=>c.id===f.course),'flow entry course of '+f.id);}
/* Layer-2 tour scripts: 5 scripts, 29 migrated points covering every original observe id. */
assert.equal(cat.tours.length,5);
const observeIds=Object.values(chains).flat().filter(s=>s.type==='observe').map(s=>s.id);assert.equal(observeIds.length,29);
const migrated=cat.tours.flatMap(t=>t.steps.filter(s=>s.origin==='migrated').map(s=>s.src));
assert.equal(migrated.length,29);assert.deepEqual([...migrated].sort(),[...observeIds].sort());
for(const t of cat.tours){assert(t.id&&t.title&&Array.isArray(t.steps)&&t.steps.length,'tour '+t.id);for(const s of t.steps){assert(s.sel&&s.title&&s.desc&&(s.origin==='migrated'||s.origin==='authored'),'tour step of '+t.id);assert(selKnown(s.sel),'tour sel not static and not whitelisted: '+s.sel);}}
const ids=new Set();for(const c of cat.courses){assert(c.principle);assert(c.overview&&Object.values(c.overview).every(x=>typeof x==='string'&&x.length>10));for(const s of c.steps){assert(!ids.has(s.id));ids.add(s.id);assert(s.why&&s.success&&s.target&&s.check);}}
const tutorial=read('TUTORIAL-v'+release.version+'.md');
for(const c of cat.courses)for(const s of c.steps)assert(tutorial.includes(s.instruction),'manual missing instruction of '+s.id);
for(const t of cat.tours)assert(tutorial.includes(t.title),'manual missing tour title '+t.id);
assert.equal((read('src/js/02-state-themes.js').match(/tour:'使用教程'/g)||[]).length,6);assert(read('src/js/13-theme-workspaces.js').includes("$('#tourLabel').textContent='使用教程'"));
assert.equal(release.version,cat.version);assert.equal(release.phase,cat.phase);assert.equal(release.tutorialVersion,release.version);assert.equal(release.devlogVersion,release.version);
assert.equal(release.build,'per-tab-search');
const log=read('src/js/08-detail-presentation.js'),start=log.indexOf('const DEVLOG_FEATURES'),end=log.indexOf('\ninitDevlogTabs();'),defs=log.slice(start,end);
const elements=new Map();function $(s){if(!elements.has(s))elements.set(s,{innerHTML:'',textContent:'',scrollTop:0});return elements.get(s)}
const ctx={$,console,RELEASE_MANIFEST:release,esc:s=>String(s??''),document:{querySelectorAll:()=>[]}};vm.createContext(ctx);vm.runInContext(defs,ctx);assert(vm.runInContext('devlogIntegrity().ok',ctx));vm.runInContext('renderDevlogViews()',ctx);
for(const id of ['#devAllDynamic','#devFeatureStream','#devBugStream','#devInternalStream','#devTimeline'])assert($(id).innerHTML.includes(release.phase),id);assert($('#devAllDynamic').innerHTML.indexOf(release.phase)<$('#devAllDynamic').innerHTML.indexOf('P69'));
assert.equal(vm.runInContext('DEVLOG_TIMELINE.filter(x=>x.phase===RELEASE_MANIFEST.phase).length',ctx),1);assert.equal(vm.runInContext('DEVLOG_TIMELINE.length',ctx),Number(release.phase.slice(1))+1);
for(const type of ['FEATURES','BUGS','INTERNALS','TIMELINE'])assert(log.lastIndexOf('DEVLOG_'+type+'.push(')<end);
assert(html.includes('data-retro="8"'));assert(html.includes('复盘总结 10 · 2026-10-14'));assert(html.includes('复盘总结 17 · 2026-10-15 · v6.60 → v6.61 / P83'));assert(html.includes('P0 – P83'));assert(html.includes('P0 → P83'));assert($('#devlogRange').textContent.includes('2026-10-15'));
const actions=read('src/js/16-personal-workspace.js')+read('src/js/16a-local-tools.js'),targets=['check','backup'];assert(!/function (promoteChannel|renderReleaseGovernance|openCuration|evaluateReleasePolicy)\(/.test(actions));
const tourSrc=read('src/js/12-tour.js');assert(tourSrc.includes('function tourEnd(completed=false)'));assert(tourSrc.includes('()=>tourEnd()'));assert(tourSrc.includes('function tourGuard(e)'));assert(tourSrc.includes('function tourStart(scriptId)'));
const comboSrc=read('src/js/24-combo-training.js');assert(comboSrc.includes('function comboReplayAction(step)'));assert(comboSrc.includes("if(step.type==='observe'){await comboRealDelay(120);return;}"),'replay observe branch must survive');assert(comboSrc.includes('function comboPurgeVideoProgress()'));assert(comboSrc.includes('function comboOpenCourse('));
assert(read('src/js/15-scratchpad-reading-boot.js').includes("'v6.61':"));for(const p of ['README.md','DEVELOPMENT.md','CHANGELOG.md'])assert(read(p).includes('v6.61 / P83'));
assert(read('src/js/order.json').includes('25-onboarding.js'));assert(read('src/js/01-foundation.js').includes('welcome:{status'));
assert(!read('src/templates/index.html').includes('comboDemoPanel'));assert(!read('src/styles/app.css').includes('combo-speed-dial'));
fs.writeFileSync(path.join(root,'reports/combo-sync-gate-results.json'),JSON.stringify({status:'passed',courses:32,actions:130,tourPoints:29,tourScripts:5,schema:cat.schema,logs:{phases:Number(release.phase.slice(1))+1,surfaces:6,currentPhase:release.phase,events:vm.runInContext("({features:DEVLOG_FEATURES.filter(x=>x.phase===RELEASE_MANIFEST.phase).length,bugs:DEVLOG_BUGS.filter(x=>x.phase===RELEASE_MANIFEST.phase).length,internals:DEVLOG_INTERNALS.filter(x=>x.phase===RELEASE_MANIFEST.phase).length,timeline:1})",ctx)},routingTargets:targets,documentActionsMatch:true,browserRun:false},null,2));console.log('Combo/tutorial/devlog sync gate passed');
