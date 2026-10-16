/* ================================================================
   v5.9 · GLOBAL SCRATCHPAD + READING DISPLAY
================================================================ */
const SCRATCH_KEY='pb_global_scratch_v1',SCRATCH_ARCHIVE_KEY='pb_scratch_archive_v1',READING_KEY='pb_reading_display_v1';
const COUNT_VISIBILITY_KEY='pb_count_visibility_v1';
let SHOW_COUNTS=true,scratchActiveTab='saved';
try{SHOW_COUNTS=WorkspaceStore.getItem(COUNT_VISIBILITY_KEY)!=='hidden';}catch(e){}
function applyCountVisibility(){
 document.body.classList.toggle('counts-hidden',!SHOW_COUNTS);
 document.querySelectorAll('[data-count-visibility]').forEach(button=>{
   button.textContent=SHOW_COUNTS?'隐藏主页数字':'显示主页数字';
   button.title=button.textContent;
   button.setAttribute('aria-pressed',String(!SHOW_COUNTS));
 });
}
function setCountVisibility(show){
 SHOW_COUNTS=show;
 try{WorkspaceStore.setItem(COUNT_VISIBILITY_KEY,show?'shown':'hidden');}catch(e){notifyLocal('数量显示偏好本次有效；浏览器未允许保存设置。');}
 applyCountVisibility();updateScratchUI();updateWorkspaceBadge();
}
function selectScratchTab(tab,{focus=false}={}){
 scratchActiveTab=tab==='trash'?'trash':'saved';
 for(const name of ['saved','trash']){
   const active=name===scratchActiveTab,button=$(`[data-scratch-tab="${name}"]`),panel=$(`#scratch${name==='saved'?'Saved':'Trash'}Panel`);
   button?.classList.toggle('active',active);
   button?.setAttribute('aria-selected',String(active));
   if(button)button.tabIndex=active?0:-1;
   if(panel)panel.hidden=!active;
 }
 if(focus)$(`[data-scratch-tab="${scratchActiveTab}"]`)?.focus();
}
let GLOBAL_SCRATCH={text:'',updatedAt:'',manualAt:''};
try{
 const saved=JSON.parse(WorkspaceStore.getItem(SCRATCH_KEY)||'null');
 if(saved&&typeof saved==='object')GLOBAL_SCRATCH={text:String(saved.text||''),updatedAt:String(saved.updatedAt||''),manualAt:String(saved.manualAt||'')};
}catch(e){}
let SCRATCH_ARCHIVE=[];
try{
 const saved=JSON.parse(WorkspaceStore.getItem(SCRATCH_ARCHIVE_KEY)||'[]');
 if(Array.isArray(saved))SCRATCH_ARCHIVE=saved.filter(x=>x&&typeof x==='object'&&typeof x.text==='string').map(x=>({id:String(x.id||''),text:String(x.text||''),savedAt:String(x.savedAt||'')})).filter(x=>x.id&&x.text);
}catch(e){}
let READING_PREF={scale:100};
try{
 const saved=JSON.parse(WorkspaceStore.getItem(READING_KEY)||'null');
 const n=Math.round(Number(saved?.scale||100)/10)*10;
 if(Number.isFinite(n))READING_PREF.scale=Math.min(140,Math.max(90,n));
}catch(e){}

let scratchSaveTimer=0,scratchStorageOK=true;
function scratchClock(iso){
 if(!iso)return '';
 const d=new Date(iso);
 if(Number.isNaN(d.getTime()))return '';
 return d.toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'});
}
function updateScratchUI(state=''){
 const status=$('#scratchStatus'),len=$('#scratchLength'),nav=$('#navScratchBtn'),badge=$('#navScratchBadge');
 if(status){
   const t=scratchClock(GLOBAL_SCRATCH.updatedAt);
   status.textContent=state||(t?`草稿已自动保存 · ${t}`:'等待输入');
   status.classList.toggle('saved',/保存/.test(status.textContent));
 }
 if(len)len.textContent=`${GLOBAL_SCRATCH.text.length.toLocaleString()} 字`;
 if(nav){
   const hasDraft=GLOBAL_SCRATCH.text.trim().length>0,hasRecords=SCRATCH_ARCHIVE.length>0;
   nav.classList.toggle('has-note',hasDraft);nav.classList.toggle('has-records',hasRecords);
   nav.title=SHOW_COUNTS?(hasRecords?`随手记 · ${SCRATCH_ARCHIVE.length} 条已保存记录${hasDraft?' · 当前草稿 '+GLOBAL_SCRATCH.text.length+' 字':''}`:(hasDraft?`随手记 · 当前草稿 ${GLOBAL_SCRATCH.text.length} 字`:'打开随手记')):'打开随手记与已保存记录';
   if(badge){badge.hidden=!SHOW_COUNTS||!hasRecords;badge.textContent=SCRATCH_ARCHIVE.length>99?'99+':String(SCRATCH_ARCHIVE.length);}
 }
 document.querySelectorAll('[data-scratch-inline-state]').forEach(el=>{el.textContent=scratchStorageOK?'自动保存已开启 · 全局同步':'当前会话保留 · 浏览器未允许持久化';});
}
function scratchStamp(iso){
 const d=new Date(iso);if(Number.isNaN(d.getTime()))return '时间未知';
 return d.toLocaleString('zh-CN',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});
}
function scratchRecordTitle(text){
 const line=String(text||'').split(/\r?\n/).map(x=>x.trim()).find(Boolean)||'未命名随手记';
 return line.length>34?line.slice(0,34)+'…':line;
}
function persistScratchArchive(){
 try{WorkspaceStore.setItem(SCRATCH_ARCHIVE_KEY,JSON.stringify(SCRATCH_ARCHIVE));scratchStorageOK=true;return true;}
 catch(e){scratchStorageOK=false;notifyLocal('已保存记录无法写入浏览器本地存储，请先复制重要内容。');return false;}
}
function renderScratchArchive(){
 const list=$('#scratchRecordList'),count=$('#scratchSavedCount');
 if(count)count.textContent=String(SCRATCH_ARCHIVE.length);
 if(!list){renderScratchTrash();updateScratchUI();return;}
 if(!SCRATCH_ARCHIVE.length){
   list.innerHTML='<div class="scratch-record-empty">还没有主动保存的记录。<br>写下一段内容后点“保存为记录”，它会直接显示在这里。</div>';
   renderScratchTrash();updateScratchUI();return;
 }
 list.innerHTML=SCRATCH_ARCHIVE.map(r=>`<details class="scratch-record" data-record-id="${esc(r.id)}">
   <summary><span class="scratch-record-title"><b>${esc(scratchRecordTitle(r.text))}</b><span>${esc(scratchStamp(r.savedAt))} · ${r.text.length.toLocaleString()} 字</span></span></summary>
   <div class="scratch-record-body"><div class="scratch-record-text">${esc(r.text)}</div><div class="scratch-record-actions">
     <button type="button" data-scratch-load="${esc(r.id)}">继续编辑</button>
     <button type="button" data-scratch-copy-record="${esc(r.id)}">复制</button>
     <button class="danger" type="button" data-scratch-delete="${esc(r.id)}">删除</button>
   </div></div>
 </details>`).join('');
 renderScratchTrash();updateScratchUI();
}
function renderScratchTrash(){
 const list=$('#scratchTrashList'),count=$('#scratchTrashCount'),records=scratchTrash().filter(r=>r&&r.kind==='scratch'&&r.id);
 if(count)count.textContent=String(records.length);
 if(!list)return;
 list.innerHTML=records.length?records.map(r=>`<article class="scratch-record"><div class="scratch-record-body" style="padding-top:11px"><span class="scratch-record-title"><b>${esc(scratchRecordTitle(r.text))}</b><span>删除于 ${esc(scratchStamp(r.trashedAt))}</span></span><div class="scratch-record-text">${esc(r.text)}</div><div class="scratch-record-actions"><button type="button" data-scratch-trash-restore="${esc(r.id)}">恢复</button><button class="danger" type="button" data-scratch-trash-purge="${esc(r.id)}">永久删除</button></div></div></article>`).join(''):'<div class="scratch-record-empty">随手记回收站是空的。</div>';
}
function saveScratchRecord(){
 const text=GLOBAL_SCRATCH.text.trim();
 if(!text){notifyLocal('随手记还是空的，先写点内容再保存。');return;}
 const now=new Date().toISOString();
 const existingIndex=SCRATCH_ARCHIVE.findIndex(r=>r.text===text);
 if(existingIndex>=0){
   const old=SCRATCH_ARCHIVE.splice(existingIndex,1)[0];old.savedAt=now;SCRATCH_ARCHIVE.unshift(old);
   if(persistScratchArchive()){renderScratchArchive();updateScratchUI(`记录已更新 · ${scratchClock(now)}`);notifyLocal('这段内容已经保存过，已更新保存时间。');}
   return;
 }
 const rec={id:`sn_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,text,savedAt:now};
 SCRATCH_ARCHIVE.unshift(rec);
 if(!persistScratchArchive()){SCRATCH_ARCHIVE.shift();renderScratchArchive();return;}
 GLOBAL_SCRATCH.manualAt=now;persistScratch({manual:true,silent:true});renderScratchArchive();updateScratchUI(`已保存为记录 · ${scratchClock(now)}`);notifyLocal('已保存为站内随手记记录，可在本面板下方直接查看。');
}
function findScratchRecord(id){return SCRATCH_ARCHIVE.find(r=>r.id===id);}
function loadScratchRecord(id){
 const rec=findScratchRecord(id);if(!rec)return;
 if(GLOBAL_SCRATCH.text.trim()&&GLOBAL_SCRATCH.text!==rec.text&&!confirm('继续编辑这条已保存记录会替换当前草稿。当前草稿若要保留，请先“保存为记录”。仍要继续吗？'))return;
 GLOBAL_SCRATCH.text=rec.text;persistScratch({silent:true});syncScratchInputs();notifyLocal('已载入到当前草稿，可以继续编辑。');
 requestAnimationFrame(()=>$('#globalScratchText')?.focus({preventScroll:true}));
}
function deleteScratchRecord(id){
 const rec=findScratchRecord(id);if(!rec)return;
 if(!confirm(`将这条已保存随手记移入回收站？\n\n${scratchRecordTitle(rec.text)}`))return;
 moveScratchToTrash(id);
}

function syncScratchInputs(source=null){
 document.querySelectorAll('[data-global-scratch]').forEach(el=>{
   if(el!==source&&el.value!==GLOBAL_SCRATCH.text)el.value=GLOBAL_SCRATCH.text;
 });
 updateScratchUI();
}
function persistScratch({manual=false,silent=false}={}){
 GLOBAL_SCRATCH.updatedAt=new Date().toISOString();
 if(manual)GLOBAL_SCRATCH.manualAt=GLOBAL_SCRATCH.updatedAt;
 try{
   WorkspaceStore.setItem(SCRATCH_KEY,JSON.stringify(GLOBAL_SCRATCH));
   scratchStorageOK=true;
   updateScratchUI(manual?`已保存到当前浏览器 · ${scratchClock(GLOBAL_SCRATCH.updatedAt)}`:'');
   if(manual&&!silent)notifyLocal('随手记已保存到当前浏览器。');
   return true;
 }catch(e){
   scratchStorageOK=false;
   updateScratchUI('当前会话已保留 · 浏览器未允许持久化');
   if(!silent)notifyLocal('浏览器未允许持久化；随手记本次打开期间仍会保留。');
   return false;
 }
}
function queueScratchSave(){
 clearTimeout(scratchSaveTimer);
 updateScratchUI('正在自动保存…');
 scratchSaveTimer=setTimeout(()=>persistScratch({silent:true}),420);
}
function openScratchFlyout(){
 const box=$('#scratchFlyout'),read=$('#readingFlyout');
 if(read&&!adjustableDesktop())closeReadingFlyout();
 box.hidden=false;
 $('#contextScratchBtn')?.classList.add('active');
 $('#contextScratchBtn')?.setAttribute('aria-expanded','true');
 $('#navScratchBtn')?.classList.add('active');
 $('#navScratchBtn')?.setAttribute('aria-expanded','true');
 syncScratchInputs();renderScratchArchive();selectScratchTab(scratchActiveTab);
 requestAnimationFrame(()=>$('#globalScratchText')?.focus({preventScroll:true}));
}
function closeScratchFlyout(){
 const box=$('#scratchFlyout');if(!box)return;
 box.hidden=true;
 $('#contextScratchBtn')?.classList.remove('active');
 $('#contextScratchBtn')?.setAttribute('aria-expanded','false');
 $('#navScratchBtn')?.classList.remove('active');
 $('#navScratchBtn')?.setAttribute('aria-expanded','false');
}
function toggleScratchFlyout(){if(adjustableDesktop())openScratchFlyout();else ($('#scratchFlyout')?.hidden!==false)?openScratchFlyout():closeScratchFlyout();}

const READING_ORIGINAL_STYLES=new WeakMap();let globalReadingFrame=0,globalReadingDeferred=false,readingAppliedScale=100;
function readingTargets(){
 const roots=[...document.querySelectorAll('.nav,#home,#panel,.utilityView,.srcview,.context-flyout,body > footer,#helpPopover')];
 const targets=new Set();
 for(const root of roots)for(const el of root.querySelectorAll('h1,h2,h3,h4,h5,h6,p,li,dt,dd,div,span,b,strong,small,label,button,input,textarea,select,option,summary,pre,code,output,a,blockquote,td,th,caption,legend')){
  if(el.closest('svg,.window-resize-handle,.window-maximize,.close,.context-flyout-close,.panel-window-close,[aria-hidden="true"]'))continue;
  if(READING_ORIGINAL_STYLES.has(el)||el.matches('input,textarea,select')||[...el.childNodes].some(node=>node.nodeType===3&&node.textContent.trim()))targets.add(el);
 }
 return [...targets];
}
function readingInteractionBusy(){return !!document.body?.classList?.contains('window-interacting');}
function resumeGlobalReading(){if(globalReadingDeferred){globalReadingDeferred=false;queueGlobalReading();}}
function queueGlobalReading(){if(readingInteractionBusy()){globalReadingDeferred=true;return;}if(!globalReadingFrame)globalReadingFrame=requestAnimationFrame(()=>{globalReadingFrame=0;applyReadingPreferences()});}
function applyReadingPreferences(){
 if(readingInteractionBusy()){globalReadingDeferred=true;return;}
 const scale=READING_PREF.scale/100,targets=READING_PREF.scale!==100||readingAppliedScale!==100?readingTargets():[];
 // Restore original inline styles first so nested text never accumulates scale.
 for(const el of targets){
  let original=READING_ORIGINAL_STYLES.get(el);
  if(!original){original={fontSize:el.style.fontSize,lineHeight:el.style.lineHeight};READING_ORIGINAL_STYLES.set(el,original);}
  el.style.fontSize=original.fontSize;el.style.lineHeight=original.lineHeight;
 }
 const metrics=READING_PREF.scale===100?[]:targets.map(el=>{const cs=getComputedStyle(el),size=parseFloat(cs.fontSize),line=parseFloat(cs.lineHeight);return {el,size,line:Number.isFinite(line)?line:size*1.5};});
 if(READING_PREF.scale!==100)for(const {el,size,line} of metrics){
  if(!Number.isFinite(size)||size<=0)continue;
  el.style.fontSize=(size*scale).toFixed(2)+'px';el.style.lineHeight=(line*scale*(1+Math.max(0,READING_PREF.scale-100)/500)).toFixed(2)+'px';
 }
 readingAppliedScale=READING_PREF.scale;
 const value=$('#readingScaleValue'),range=$('#readingScale'),nav=$('#navReadValue'),applied=$('#readingApplied');
 if(value)value.textContent=READING_PREF.scale+'%';if(nav)nav.textContent=READING_PREF.scale+'%';
 if(range&&Number(range.value)!==READING_PREF.scale)range.value=String(READING_PREF.scale);
 if(applied)applied.textContent=`全局阅读：${READING_PREF.scale===100?'标准':READING_PREF.scale<100?'紧凑':'放大'} · ${READING_PREF.scale}%`;
 document.querySelectorAll('[data-reading-inline-value]').forEach(el=>el.textContent=READING_PREF.scale+'%');
 document.querySelectorAll('[data-read-preset]').forEach(btn=>btn.setAttribute('aria-pressed',String(Number(btn.dataset.readPreset)===READING_PREF.scale)));
 const sample=$('#readingSample');if(sample){sample.style.fontSize=(13*scale).toFixed(1)+'px';sample.style.lineHeight=(1.85*(1+Math.max(0,READING_PREF.scale-100)/500)).toFixed(2);}
}
function setReadingScale(value,{announce=false}={}){
 const n=Math.min(140,Math.max(90,Math.round(Number(value)/10)*10));
 READING_PREF.scale=Number.isFinite(n)?n:100;
 try{WorkspaceStore.setItem(READING_KEY,JSON.stringify(READING_PREF));}catch(e){}
 applyReadingPreferences();
 if(announce)notifyLocal(`阅读显示已调整为 ${READING_PREF.scale}%。提示词 内容不会改变。`);
}
function openReadingFlyout(){
 if(!adjustableDesktop())closeScratchFlyout();
 const box=$('#readingFlyout');box.hidden=false;
 $('#navReadingBtn')?.classList.add('active');
 $('#navReadingBtn')?.setAttribute('aria-expanded','true');
 applyReadingPreferences();
 requestAnimationFrame(()=>$('#readingScale')?.focus({preventScroll:true}));
}
function closeReadingFlyout(){
 const box=$('#readingFlyout');if(!box)return;
 box.hidden=true;
 $('#navReadingBtn')?.classList.remove('active');
 $('#navReadingBtn')?.setAttribute('aria-expanded','false');
}
function toggleReadingFlyout(){if(adjustableDesktop())openReadingFlyout();else ($('#readingFlyout')?.hidden!==false)?openReadingFlyout():closeReadingFlyout();}
function closeContextTools(){closeScratchFlyout();closeReadingFlyout();}

document.addEventListener('input',e=>{
 if(e.target.matches('[data-global-scratch]')){
   GLOBAL_SCRATCH.text=e.target.value;
   syncScratchInputs(e.target);
   if(activeCard&&e.target.id==='fieldNotes')draftFor(activeCard).notes=GLOBAL_SCRATCH.text;
   queueScratchSave();
 }
 if(e.target.id==='readingScale')setReadingScale(e.target.value);
});
document.addEventListener('click',e=>{
 if(e.target.closest('#contextScratchBtn,[data-scratch-open]')){toggleScratchFlyout();return;}
 if(e.target.closest('#contextReadBtn,[data-reading-open]')){toggleReadingFlyout();return;}
 if(e.target.closest('[data-scratch-close]')){closeScratchFlyout();return;}
 if(e.target.closest('[data-reading-close]')){closeReadingFlyout();return;}
 if(e.target.closest('[data-scratch-save]')){saveScratchRecord();return;}
 if(e.target.closest('[data-count-visibility]')){setCountVisibility(!SHOW_COUNTS);return;}
 const scratchTab=e.target.closest('[data-scratch-tab]');if(scratchTab){selectScratchTab(scratchTab.dataset.scratchTab);return;}
 if(e.target.closest('[data-scratch-copy]')){copyText(GLOBAL_SCRATCH.text,e.target.closest('button'),false,GLOBAL_SCRATCH.text?'当前草稿已复制。':'随手记还是空的。');return;}
 const loadRec=e.target.closest('[data-scratch-load]');if(loadRec){loadScratchRecord(loadRec.dataset.scratchLoad);return;}
 const copyRec=e.target.closest('[data-scratch-copy-record]');if(copyRec){const rec=findScratchRecord(copyRec.dataset.scratchCopyRecord);copyText(rec?.text||'',copyRec,false,rec?'已保存记录已复制。':'记录不存在。');return;}
 const delRec=e.target.closest('[data-scratch-delete]');if(delRec){deleteScratchRecord(delRec.dataset.scratchDelete);return;}
 if(e.target.closest('[data-scratch-clear]')){
   if(GLOBAL_SCRATCH.text&&!confirm('清空当前草稿？“已保存随手记”中的记录不会被删除。'))return;
   GLOBAL_SCRATCH.text='';persistScratch({manual:true,silent:true});syncScratchInputs();notifyLocal('当前草稿已清空；已保存记录仍保留。');return;
 }
 const preset=e.target.closest('[data-read-preset]');if(preset){setReadingScale(preset.dataset.readPreset,{announce:true});return;}
 if(!adjustableDesktop()&&!e.target.closest('#scratchFlyout,#readingFlyout,#contextHelpDock'))closeContextTools();
},false);
$('#scratchFlyout .scratch-library-tabs')?.addEventListener('keydown',e=>{
 if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
 e.preventDefault();
 const next=e.key==='Home'?'saved':e.key==='End'?'trash':(scratchActiveTab==='saved'?'trash':'saved');
 selectScratchTab(next,{focus:true});
});

const renderWorkspaceV59=renderWorkspace;
renderWorkspace=function(){
 renderWorkspaceV59();
 syncScratchInputs();
 queueGlobalReading();
};
const openUtilityV59=openUtility;
openUtility=function(id){
 openUtilityV59(id);
 queueGlobalReading();
};
const recordObservationV59=recordObservation;
recordObservation=function(){
 if(activeCard)draftFor(activeCard).notes=GLOBAL_SCRATCH.text;
 recordObservationV59();
};

const contextToolsOpenState=new WeakMap();
const contextToolsObserver=new MutationObserver(records=>{
 for(const {target} of records){const open=target.classList.contains('open');if(contextToolsOpenState.get(target)===open)continue;contextToolsOpenState.set(target,open);if(open){queueGlobalReading();syncScratchInputs();}}
});
['#needOverlay','#importOverlay','#devlogOverlay','#srcOverlay','#backdrop'].forEach(sel=>{
 const el=$(sel);if(el){contextToolsOpenState.set(el,el.classList.contains('open'));contextToolsObserver.observe(el,{attributes:true,attributeFilter:['class']});}
});

applyCountVisibility();syncScratchInputs();queueMicrotask(renderScratchArchive);
applyReadingPreferences();


// Contextual tours are release-aware: major user-facing features must be represented here.
const RELEASE_VERSION=RELEASE_MANIFEST.version,TOUR_VERSION=RELEASE_MANIFEST.tutorialVersion;
const TOUR_SYNC_POLICY='每次新增或显著调整用户可见功能，都必须同步更新 tourSteps；版本不一致时启动警告。';
const TUTORIAL_COVERAGE={
 'v6.2':['workspace-entry','lifecycle-create-edit','version-history-diff-restore'],
 'v6.3':['workspace-filter-sort-tags','candidate-promotion'],
 'v6.4':['candidate-curation'],
 'v6.5':['release-governance','prompt-trash'],
 'v6.6':['scratch-trash'],
 'v6.8':['release-package','source-integration'],
 'v6.9':['release-train','version-registry','dependency-conflict-order','whole-release-gate-rollback'],
 'v6.10':['bidirectional-scene-sync','entry-click-cue'],
 'v6.11':['entry-path-learning','devlog-traceability'],
 'v6.12':['chronological-devlog','triple-evidence-chain'],
 'v6.13':['post-0922-devlog-visibility','devlog-init-order'],
 'v6.14':['canonical-devlog-source','final-artifact-visibility'],
 'v6.15':['full-surface-devlog-sync','date-coverage-audit','devlog-event-completeness'],
 'v6.16':['release-channels','preview-to-stable','channel-gates','channel-rollback','deprecated-version'],
 'v6.17':['provenance-graph','audit-explorer','bidirectional-trace','audit-integrity'],
 'v6.18':['quality-observatory','quality-snapshot','release-regression','version-health'],
 'v6.19':['policy-engine','auto-review-block','policy-override','policy-audit'],
 'v6.20':['policy-orchestrator','dry-run','execution-plan','review-queue','block-remediation','execution-audit'],
 'v6.21':['human-review-queue','review-lifecycle','review-evidence','orchestrator-resume','unified-human-in-loop'],
 'v6.22':['remediation-engine','root-cause','fix-plan','re-check','resolved-no-autofix'],
 'v6.23':['release-control-center','governance-dashboard','quality-trend','open-reviews-blocks','stable-provenance-drilldown'],
 'v6.24':['governance-policy-profiles','policy-version','profile-approval','governance-floor','policy-rollback','evaluation-threshold-snapshot'],
 'v6.25':['governance-simulation','what-if','simulated-state','quality-delta','affected-assets','risk'],
 'v6.26':['release-intelligence','governance-insights','evidence-chain','recommendation-boundary','insight-drilldown','no-auto-action']
 ,'v6.27':['luzi-square-catalog','publisher-attribution','full-source-search','long-body-recovery','old-source-crosslink']
 ,'v6.28':['curated-home-expansion','category-completion','source-attribution-links','retired-card-archive','editorial-score-boundary']
 ,'v6.29':['persistent-workspace-tabs','mobile-tab-jump','active-tab-sync','workspace-scroll-reset']
 ,'v6.30':['workspace-help','everyday-nav','advanced-disclosure','lazy-governance-render','quality-token-cache','context-guidance']
 ,'v6.31':['creation-actions','workspace-scratch-entry','independent-home-libraries','home-pagination','source-category-sort-page-jump']
 ,'v6.32':['single-library-tabs','category-tab-state','inline-source-page','recent-open-by-id']
 ,'v6.33':['compact-home-search','draggable-windows','resizable-windows','bounded-mobile-layout']
 ,'v6.34':['theme-scene-clean-menus','context-tools-workbench-only']
 ,'v6.35':['eight-direction-resize','colored-drag-header','scrollable-flyout-body']
 ,'v6.36':['quiet-border-resize','full-width-workspace-card','responsive-action-row']
 ,'v6.37':['scratch-panel-trash','shared-scratch-delete','scratch-restore-purge']
 ,'v6.38':['shared-count-display','count-visibility-preference','scratch-list-tabs']
 ,'v6.39':['home-badges-only','independent-desktop-windows','live-window-sync']
 ,'v6.40':['file-only-import','home-global-reading','home-badge-toggle','window-layer-priority','maximize-restore','devlog-init-after-records']
 ,'v6.41':['reorder-top-actions','single-main-search','frame-coalesced-window-drag']
 ,'v6.42':['task-oriented-help','workspace-tab-purpose','dynamic-action-help','help-no-side-effects','scoped-help-decoration']
 ,'v6.43':['movable-help-choices','retained-help-position','compact-devlog','inline-log-date']
 ,'v6.44':['template-resize-drag-stability','template-inner-scroll','template-first-open-bounds']
 ,'v6.45':['excel-column-mapping','multi-prompt-splitting','paged-dedup-preview','atomic-batch-database','legacy-data-migration']
 ,'v6.46':['chinese-advanced-tools','chinese-governance-dialogs','legacy-chinese-status','compatible-governance-identifiers']
 ,'v6.54':['video-full-playback','video-right-controls','video-follow-camera','video-overview-camera','video-speed-dial','video-step-retry','backup-immediate-preview','backup-restore-comparison','backup-read-race-protection']
 ,'v6.53':['video-tutorial-playback','video-pause-resume','video-replay','video-progress-and-chapters','video-completion-exit','isolated-demo-playback','mobile-video-controls']
 ,'v6.52':['content-width-navbar-brand','wide-single-row-actions','animated-nav-reflow-drop','reduced-motion-respected','interaction-surface-controls','verified-auto-step-advance','ime-aware-input-validation','merge-ten-duplicate-observations','read-only-coach']
 ,'v6.51':['compact-workspace-helpers','ordered-navbar-grid','visible-mobile-labels','catalog-driven-course-menu','no-empty-course-headings','reserved-log-list-gutters','layout-tutorial-release-gate']
 ,'v6.50':['local-personal-workspace','remove-ten-publishing-tools','plain-prompt-checklist','backup-preview-cancel-confirm','daily-actions-simplified','preserve-old-data-no-startup-reset']
 ,'v6.49':['one-time-recoverable-workspace-reset','home-and-square-favorites','typed-favorite-open','favorite-remove','recent-delete','collections-real-action-course']
 ,'v6.48':['uniform-tutorial-label','module-purpose-briefing','sample-copy-cue','input-check-cue','non-overlapping-step-note','verified-change-observation','explicit-finish-exit','homepage-controls-introduction','real-filter-and-matcher-paths','all-source-interactions','maximized-responsive-tutorial','fixed-window-geometry']
 ,'v6.47':['real-atomic-controls','verified-step-results','isolated-training-storage','all-ten-advanced-drills','single-guided-solo','demonstration-no-credit','combo-release-workflow']
 ,'v6.55':['tutorial-hook-briefing','warm-step-success-feedback','completion-celebration','hint-on-demand-guided','non-blaming-failure-copy','progressive-briefing-disclosure','manual-second-person-prose']
 ,'v6.56':['static-camera-full-view','highlight-only-motion','annotation-near-highlight','docked-note-always-visible','realtime-action-budget','browser-playback-diagnosis']
 ,'v6.57':['single-skill-micro-courses','chain-slice-model','silent-prerequisite-replay','slice-integrity-gate','contiguous-chain-coverage','independent-lesson-briefing']
 ,'v6.58':['tutorial-three-layer-funnel','operation-map-page','scene-tour-scripts','tour-write-guard','video-mode-removed','demo-mode-removed','observe-migrated-to-tour','first-run-welcome','video-progress-purge','chainmap-replay']
 ,'v6.59':['user-paced-step-advance','combo-step-next-button','highlight-scroll-center','pw-more-card-panel','collect-split-two-lessons','flow-courses-chips','welcome-card-retired','tour-reposition-only']
 ,'v6.60':['skill-library-home-tab','skill-workspace-tab','skill-overlay-attributed','source-catalog-1612','dedup-by-uuid-merge','segmented-body-stitch','skill-baseline-hash']
 ,'v6.61':['per-tab-search','matcher-in-official-tab','category-tabs-full-width','skill-category-tabs','sort-select-retired','rename-prompt-square','workspace-skill-tab-removed']
};
function tutorialOpenWorkspace(tab='prompts'){
 if(!$('#personalWorkspaceOverlay')?.classList.contains('open'))openPersonalWorkspace();
 const b=document.querySelector(`[data-pw-tab="${tab}"]`);if(b)b.click();
}
/* P80: tour scripts are data-driven (combo-training.json.tours); 12-tour.js owns
   tourSteps(). The release-aware legacy override was removed with the video
   tutorial; the v6.58 coverage key above keeps the release/coverage invariant. */

if(RELEASE_VERSION!==TOUR_VERSION)console.warn('[AI Playbook] 教程版本未同步：',RELEASE_VERSION,TOUR_VERSION,TOUR_SYNC_POLICY);
function focusLayer(){return OverlayManager.focusRoot();}
document.addEventListener('keydown',e=>{
 const editing=document.activeElement?.matches('input,textarea,select,[contenteditable]');
 if(e.key==='Escape'){if(OverlayManager.closeTop()){e.preventDefault();return;}if(HELP_MODE)setHelpMode(false);else if(document.activeElement===$('#q'))$('#q').blur();e.preventDefault();return;}
 if(e.key==='?'&&!editing){e.preventDefault();setHelpMode(!HELP_MODE);return;}
 if(e.key==='/'&&!editing&&!activeCard){e.preventDefault();focusMainSearch();return;}
 if((e.key==='Enter'||e.key===' ')&&!editing&&!e.target.closest('button')){const el=e.target.closest('#home .card,#cats [data-cat]');if(el&&el.getAttribute('aria-disabled')!=='true'){e.preventDefault();el.click();return;}}
 if(['ArrowRight','ArrowLeft'].includes(e.key)&&!editing&&!tourActive){const current=e.target.closest('[role="tab"]');if(current){const tabs=[...current.parentElement.querySelectorAll('[role="tab"]')];const ix=tabs.indexOf(current);const next=tabs[(ix+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length];e.preventDefault();next.click();next.focus();return;}}
 if(e.key==='Tab'){const root=focusLayer();if(root){const focusable=[...root.querySelectorAll('button:not(:disabled),input,textarea,select,a[href],[tabindex]')].filter(el=>!el.closest('[hidden]')&&el.tabIndex>=0&&el.getClientRects().length);if(focusable.length){const first=focusable[0],last=focusable[focusable.length-1],cur=document.activeElement;if(e.shiftKey&&(cur===first||!root.contains(cur))){e.preventDefault();last.focus();}else if(!e.shiftKey&&(cur===last||!root.contains(cur)||cur===root)){e.preventDefault();first.focus();}}}}
 if(tourActive&&!editing){if(e.key==='ArrowRight')tourNext();if(e.key==='ArrowLeft'&&tourIdx>0)tourShow(tourIdx-1);}
});

function applyReleaseManifest(){
 document.documentElement.dataset.releaseVersion=RELEASE_MANIFEST.version;
 document.documentElement.dataset.workspaceSchema=String(RELEASE_MANIFEST.schemaVersion);
 const badge=$('#releaseBadge');if(badge)badge.textContent=`v${RELEASE_MANIFEST.version} · ${RELEASE_MANIFEST.phase}`;
 const schemaMeta=$('#workspaceSchemaMeta');if(schemaMeta){const h=WorkspaceStore.health();schemaMeta.textContent=`schema v${h.schemaVersion} · ${h.persistent?'本地持久化可用':'当前会话模式'}`;}
}
function runFoundationChecks(){
 const ids=DATA.filter(c=>!c.userImported).map(c=>c.id),unique=new Set(ids);
 const checks=[
  ['release/tutorial sync',RELEASE_MANIFEST.version===RELEASE_MANIFEST.tutorialVersion],
  ['retained themes',Object.keys(THEMES).length===RELEASE_MANIFEST.themeCount&&ACTIVE_THEME_IDS.every(k=>THEMES[k])],
  ['core card count',ids.length===RELEASE_MANIFEST.cards],
  ['core card id unique',unique.size===ids.length],
  ['source count',BASE_RAW_SOURCES===RELEASE_MANIFEST.sources],
  ['workspace schema',WorkspaceStore.health().schemaVersion===RELEASE_MANIFEST.schemaVersion]
 ];
 const failed=checks.filter(([,ok])=>!ok);
 if(failed.length)console.warn('[AI Playbook] Foundation checks failed:',failed.map(([name])=>name));
 else console.info(`[AI Playbook] v${RELEASE_MANIFEST.version} foundation checks: ${checks.length}/${checks.length} passed`,WorkspaceStore.health());
 return {version:RELEASE_MANIFEST.version,checks:checks.map(([name,ok])=>({name,ok})),workspace:WorkspaceStore.health()};
}
window.AI_PLAYBOOK_FOUNDATION={manifest:RELEASE_MANIFEST,workspace:WorkspaceStore,runChecks:runFoundationChecks};
applyReleaseManifest();
runFoundationChecks();

applyNow();

