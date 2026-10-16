/* Production menu and navigation handlers, plus scoped CSS cascade checks.
   This is a DOM adapter/static-rule gate, not a browser screenshot test. */
const fs=require('fs'),path=require('path'),assert=require('assert');
const {make,Evt,catalog,read}=require('./combo_action_gate.cjs');
const root=path.resolve(__dirname,'..'),release=JSON.parse(read('src/data/release.json'));
const h=make(catalog.courses[0]),{doc,run}=h;
const source=read('src/js/24-combo-training.js');
const handlers=source.slice(source.indexOf(" $('#comboClose').addEventListener"),source.indexOf("\n $('#comboBriefStart').addEventListener"));run(handlers);
function renderMenu(){run('comboRenderMenu()');return doc.querySelector('#comboCourseMenu');}
let menu=renderMenu();const expected=catalog.courses.map(c=>c.id);
assert.deepEqual(menu.querySelectorAll('[data-combo-course]').map(b=>b.dataset.comboCourse),expected);
assert.deepEqual(doc.querySelector('#comboCourseSelect').options.map(o=>o.value),expected);
assert.equal(menu.querySelectorAll('.combo-course-group').length,2);
for(const section of menu.querySelectorAll('.combo-course-group'))assert(section.querySelectorAll('[data-combo-course]').length);
assert(!/undefined|null|高级工具拆招|整套连贯练习|主界面入门/.test(menu.textContent));
for(const c of catalog.courses){
 assert(c.goal&&c.group&&c.steps.length,c.id);
 assert(read(`TUTORIAL-v${release.version}.md`).includes(c.title));
 const card=menu.querySelector(`[data-combo-course="${c.id}"]`);assert(card.textContent.includes(c.goal));
 card.dispatchEvent(new Evt('click',{isTrusted:true}));assert(!doc.querySelector('#comboBriefingSection').hidden);
 assert.equal(doc.querySelector('#comboBriefTitle').textContent,c.title);
 assert.equal(doc.querySelector('#comboBriefPurpose').textContent,c.overview.purpose);
 doc.querySelector('#comboBriefBack').click();assert(!doc.querySelector('#comboMenuSection').hidden);
}
// Removing the final course of a group must remove the heading as well.
run('this.savedCourses=COMBO_CATALOG.courses;COMBO_CATALOG.courses=savedCourses.filter(c=>c.group!=="检查、整理与备份")');
menu=renderMenu();assert.equal(menu.querySelectorAll('.combo-course-group').length,1);assert(!menu.textContent.includes('检查、整理与备份'));
run('COMBO_CATALOG.courses=[{id:"empty",title:"空模块",group:"空分组",steps:[]}]');
menu=renderMenu();assert.equal(menu.querySelectorAll('.combo-course-group').length,0);assert(menu.textContent.includes('暂无可用'));
assert(doc.querySelector('#comboBegin').disabled&&doc.querySelector('#comboCourseSelect').disabled&&doc.querySelector('#comboSingleSelect').disabled);
run('COMBO_CATALOG.courses=savedCourses');renderMenu();assert(!doc.querySelector('#comboBegin').disabled);
// Old catalogs without goal still explain the actual learning result.
run('COMBO_CATALOG.courses=[{...savedCourses[6],goal:"",group:"检查 <script>"}]');menu=renderMenu();
assert(menu.textContent.includes(catalog.courses[6].overview.result));assert(!menu.querySelector('script'));
run('COMBO_CATALOG.courses=savedCourses');renderMenu();

// Keep the twelve actual button identities and exercise the unchanged production
// sorting handler in its new row-major grid, including saved order and reset.
const nav=doc.querySelector('.navbtns'),original=nav.children.map(b=>b.id);
assert.equal(original.length,12);assert.equal(new Set(original).size,12);
assert.deepEqual(doc.querySelectorAll('[data-pw-tab]').map(b=>b.dataset.pwTab),['prompts','favorites','recent','scratch','trash','check','backup']);
const proto=Object.getPrototypeOf(nav);
Object.defineProperty(proto,'nextElementSibling',{get(){const list=this.parentElement?.children||[];return list[list.indexOf(this)+1]||null;},configurable:true});
nav.querySelectorAll=function(s){return s===':scope > .nbtn[id]'?this.children.filter(b=>b.matches('.nbtn[id]')):proto.querySelectorAll.call(this,s)};
nav.insertBefore=function(el,next){el.remove();const i=next?this.childNodes.indexOf(next):this.childNodes.length;assert(i>=0);this.childNodes.splice(i,0,el);el.parentNode=this;return el;};
proto.cloneNode=function(deep){const clone=doc.createElement(this.tagName.toLowerCase());for(const [k,v] of Object.entries(this.attrs))clone.setAttribute(k,v);if(deep)clone.innerHTML=this.innerHTML;return clone;};
h.ctx.performance={now:()=>0};h.ctx.cancelAnimationFrame=clearTimeout;h.ctx.HELP_MODE=false;
run(read('src/js/22-navigation-order.js'));
doc.querySelector('#sourceCatalogBtn').dispatchEvent(new Evt('keydown',{isTrusted:true,altKey:true,key:'Home'}));
assert.equal(run('currentNavOrder()[0]'),'sourceCatalogBtn');assert.equal(doc.activeElement.id,'sourceCatalogBtn');
assert.equal(run('JSON.parse(WorkspaceStore.getItem(NAV_ORDER_KEY))[0]'),'sourceCatalogBtn');
doc.querySelector('#navLayoutReset').click();assert.deepEqual(Array.from(run('currentNavOrder()')),original);
// Actual pointer flow reorders at the second-row edge and cancels on resize.
for(const b of nav.children)b.getBoundingClientRect=()=>{const i=nav.children.indexOf(b),left=(i%6)*140,top=Math.floor(i/6)*43;return {left,top,width:133,height:36,right:left+133,bottom:top+36}};
const button=nav.children[0];button.dispatchEvent(new Evt('pointerdown',{isTrusted:true,button:0,pointerId:1,clientX:30,clientY:18}));
doc.fire(new Evt('pointermove',{isTrusted:true,pointerId:1,clientX:830,clientY:62}),false);run('paintNavArrange()');
doc.fire(new Evt('pointerup',{isTrusted:true,pointerId:1,clientX:830,clientY:62}),false);
assert.equal(run('currentNavOrder().at(-1)'),original[0]);assert.equal(run('JSON.parse(WorkspaceStore.getItem(NAV_ORDER_KEY)).at(-1)'),original[0]);
doc.querySelector('#navLayoutReset').click();const before=Array.from(run('currentNavOrder()'));
nav.children[0].dispatchEvent(new Evt('pointerdown',{isTrusted:true,button:0,pointerId:2,clientX:30,clientY:18}));
doc.fire(new Evt('pointermove',{isTrusted:true,pointerId:2,clientX:400,clientY:62}),false);run('paintNavArrange()');
h.win.fire(new Evt('resize'),false);assert.deepEqual(Array.from(run('currentNavOrder()')),before);

// Parse authored CSS, preserving media scopes, specificity and !important.
// Unsupported dynamic/structural pseudo-selectors are excluded from the normal
// state assertions. These checks do not compute glyph or viewport geometry.
function split(s,delim=','){const out=[];let depth=0,quote='',part='';for(const c of s){if(quote){part+=c;if(c===quote)quote='';continue;}if(c==='"'||c==="'"){quote=c;part+=c;continue;}if(c==='('||c==='[')depth++;if(c===')'||c===']')depth--;if(c===delim&&depth===0){out.push(part.trim());part='';}else part+=c;}if(part.trim())out.push(part.trim());return out;}
function where(s){const m=/:where\(/.exec(s);if(!m)return [s];let i=m.index+7,d=1;for(;i<s.length&&d;i++){if(s[i]==='(')d++;if(s[i]===')')d--;}return split(s.slice(m.index+7,i-1)).flatMap(x=>where(s.slice(0,m.index)+x+s.slice(i)));}
function specificity(s){s=s.replace(/:where\([^)]*\)/g,'').replace(/:not\(([^)]*)\)/g,'$1');const attrs=s.match(/\[[^\]]*\]/g)||[];s=s.replace(/\[[^\]]*\]/g,'');const ids=(s.match(/#[\w-]+/g)||[]).length,classes=(s.match(/\.[\w-]+/g)||[]).length+attrs.length;const rest=s.replace(/#[\w-]+|\.[\w-]+/g,'');return ids*10000+classes*100+(rest.match(/\b[a-z][\w-]*\b/gi)||[]).length;}
function rules(css,width,height){const out=[];css=css.replace(/\/\*[\s\S]*?\*\//g,'');function scan(txt,enabled=true){let p=0;while(p<txt.length){const open=txt.indexOf('{',p);if(open<0)break;const head=txt.slice(p,open).trim();let d=1,i=open+1,q='';for(;i<txt.length&&d;i++){const c=txt[i];if(q){if(c===q&&txt[i-1]!=='\\')q='';continue;}if(c==='"'||c==="'"){q=c;continue;}if(c==='{')d++;if(c==='}')d--;}assert.equal(d,0,'unclosed CSS block');const body=txt.slice(open+1,i-1);if(head.startsWith('@media')){const fits=[...head.matchAll(/(min|max)-(width|height):\s*(\d+)px/g)].every(m=>{const value=m[2]==='width'?width:height;return m[1]==='min'?value>=+m[3]:value<=+m[3]});scan(body,enabled&&fits&&!/prefers-reduced-motion/.test(head));}else if(!head.startsWith('@')&&enabled)for(const selector of split(head))out.push({selector,body});p=i;}}scan(css);return out;}
function computed(css,width,el,prop){let best={rank:-1,order:-1,value:''};for(const [i,r] of rules(css,width,900).entries()){
 const selectors=where(r.selector).map(s=>s.replace(/:root/g,'html'));if(selectors.every(s=>/:/.test(s.replace(/:not\([^)]*\)/g,''))))continue;
 if(!selectors.some(s=>!/:/.test(s.replace(/:not\([^)]*\)/g,''))&&el.matches(s.replace(/\s*>\s*/g,' > '))))continue;
 for(const [j,decl] of split(r.body,';').entries()){const m=/^([\w-]+)\s*:\s*(.+)$/s.exec(decl);if(!m)continue;let value=m[2].replace(/!important\s*$/,'').trim();const important=/!important\s*$/.test(m[2]);let key=m[1];
  if(prop==='padding-inline-start'&&(key==='padding'||key==='padding-left')){if(key==='padding'){const p=value.split(/\s+/);value=p[3]||p[1]||p[0];}key=prop;}
  if(key!==prop)continue;const rank=(important?1000000:0)+specificity(r.selector),order=i*1000+j;if(rank>best.rank||rank===best.rank&&order>best.order)best={rank,order,value};
 }
}return best.value;}
const css=read('src/styles/app.css'),themes=['nebula','arcane','eastern','synlife','museum','aurora'],widths=[320,390,520,620,760,900,1240,1280,1792];let checks=0;
const log=doc.querySelector('.devlog'),ol=log.querySelector('ol'),ul=log.querySelector('ul');assert(ol&&ul);assert(ol.children.length>=10,'historical numbered list retained');
for(const theme of themes)for(const mobile of [false,true])for(const width of widths){doc.body.setAttribute('data-theme',theme);doc.body.classList.toggle('m-mode',mobile);
 assert.equal(computed(css,width,nav,'display'),'grid');const cols=width<=520?3:width<=760||mobile?4:width>=1480?12:6;
 assert.equal(computed(css,width,nav,'grid-template-columns'),`repeat(${cols},minmax(0,1fr))`);
 const inside=doc.querySelector('.nav-in');assert.equal(computed(css,width,inside,'grid-template-areas'),width<=900||mobile?'"brand reset" "actions actions"':'"brand actions reset"');if(width>900&&!mobile)assert.equal(computed(css,width,inside,'grid-template-columns'),'fit-content(240px) minmax(0,1fr) 30px');
 for(const b of nav.children){assert.equal(computed(css,width,b,'width'),'100%');assert.equal(computed(css,width,b,'min-height'),width<=760||mobile?'44px':'32px');for(const span of b.querySelectorAll('span'))assert.notEqual(computed(css,width,span,'display'),'none',`${theme}/${width}: ${b.id} label`);}
 assert.equal(computed(css,width,doc.querySelector('#logoSub'),'display'),'block');assert.equal(computed(css,width,doc.querySelector('#releaseBadge'),'display'),'inline-block');
 for(const key of ['check','backup']){const b=doc.querySelector(`[data-pw-tab="${key}"]`);assert.equal(computed(css,width,b,'min-height'),width<=760?'44px':'32px');assert.equal(computed(css,width,b,'padding'),width<=760?'8px 11px':'6px 10px');assert.equal(computed(css,width,b,'flex'),'none');}
 for(const list of [ol,ul]){assert.equal(computed(css,width,list,'padding-inline-start'),'2.2em');assert.equal(computed(css,width,list,'list-style-position'),'outside');}
 checks++;
}
// Demonstrate the old ordered-list defect is caught, rather than merely testing
// the new declaration against itself.
const oldCSS=css.slice(0,css.indexOf('/* P73:'));assert.notEqual(computed(oldCSS,1280,ol,'padding-inline-start'),'2.2em');
assert.equal((read('src/templates/index.html').match(/id="(?:navScratchBtn|importBtn|sourceCatalogBtn|personalWorkspaceBtn|devlogBtn|tourBtn|helpModeBtn|navReadingBtn|navCountToggle|themeBtn|modeBtn|mobileBtn)"/g)||[]).length,12);
assert(read('src/templates/index.html').includes(`<title>AI 提示词母模板库 · AI Playbook · v${release.version}</title>`));
fs.writeFileSync(path.join(root,'reports/layout-tutorial-gate-results.json'),JSON.stringify({status:'passed',version:release.version,phase:release.phase,courses:32,nonemptyGroups:2,menuCardsAndOptionsMatch:true,removedGroupAndEmptyCatalog:true,missingGoalFallback:true,navButtons:12,keyboardPointerSavedResetAndCancel:true,workspaceRoutes:7,themes,widths,cssProfiles:checks,logTenItemListPreserved:true,oldCSSNegative:true,browserRun:false,limitation:'Production handlers run against a DOM adapter; CSS cascade checks do not compute glyph/viewport layout or replace browser screenshots.'},null,2));
console.log('Layout/tutorial gate passed: '+catalog.courses.length+' cards, 2 nonempty groups, nav sorting and '+checks+' CSS profiles');
