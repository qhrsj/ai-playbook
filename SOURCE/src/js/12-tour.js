/* ================================================================
   TOUR — P80: multi-script scene tours driven by combo-training.json.tours.
   Layer 2 of the three-layer funnel. The user advances every step; during an
   active tour only WRITE operations are intercepted (tourGuard), while
   scrolling, hovering and reading stay unrestricted.
================================================================ */
let tourIdx=-1, tourActive=false, tourScriptId=null;
/* The tour engine loads after 24-combo-training.js in build order, but every
   access below happens at runtime, when COMBO_CATALOG is defined. */
function tourScript(id){const tours=COMBO_CATALOG.tours||[];return tours.find(t=>t.id===id)||tours[0]||{id:'S0',title:'界面总览',steps:[]};}
function tourSteps(){return tourScript(tourScriptId).steps.map(s=>({...s}));}
let tourTransitionToken=0;
function tutorialResetScene(step){
 /* P80 fix: when the next step targets workspace content and the workspace is
    already open, keep it open — closing it here made S3/S4 highlight hidden
    elements and re-entry clicks land on a closed overlay. */
 const keep=step&&$('#personalWorkspaceOverlay')?.classList.contains('open')&&[step.sel,step.entrySel].some(s=>typeof s==='string'&&/data-pw-|data-workspace-|personalWorkspace/.test(s));
 if(!keep){try{if($('#personalWorkspaceOverlay')?.classList.contains('open'))closePersonalWorkspace()}catch(e){}}
 /* P80 fix: a step with open:true reopens the card modal right after this —
    closing it here first caused the open/close flicker loop (user report). */
 if(!step.open){try{if($('#backdrop')?.classList.contains('open'))closeModal()}catch(e){}}
 document.querySelectorAll('.utilityOverlay.open').forEach(x=>{if(x.id!=='personalWorkspaceOverlay'){x.classList.remove('open');x.setAttribute('aria-hidden','true')}});
}
function tutorialCue(el,label='点击这里进入'){
 if(!el)return;const cue=document.getElementById('tourCue');cue.textContent=label;const r=el.getBoundingClientRect();cue.style.display='block';cue.style.left=Math.min(Math.max(10,r.left+r.width/2-54),window.innerWidth-118)+'px';cue.style.top=Math.max(8,r.top-38)+'px';el.classList.add('tour-entry-pulse');setTimeout(()=>el.classList.remove('tour-entry-pulse'),720)
}
function tutorialPrepare(step,direction,done){
 tutorialResetScene(step);
 if(step.close)try{closeModal()}catch(e){}
 if(step.open){/* P80 fix: the home grid is #home now; the old #grid hook silently opened nothing.
    Re-shows are idempotent — reopening the same card every prepare caused the flicker loop. */
  const first=document.querySelector('#grid .card')||document.querySelector('#home .card');if(first){const target=first.dataset.id;const need=!(activeCard&&activeCard.id===target);tutorialCue(first,'点击卡片进入');setTimeout(()=>{try{if(need)openCard(target);}catch(e){console.warn('[Tutorial] card open failed',e)}},direction==='jump'?0:520)}}
 /* P80 fix: a workbench pane switch after the card opens (declarative, JSON-safe).
    The selector is resolved INSIDE the timeout — the card/pane must exist first. */
 if(step.beforeView){setTimeout(()=>{try{const vb=document.querySelector('#panel [data-view="'+step.beforeView+'"]');if(vb)vb.click();else console.warn('[Tutorial] beforeView target missing: '+step.beforeView);}catch(e){console.warn('[Tutorial] view switch failed',e)}},direction==='jump'?0:520)}
 if(step.entrySel){const entry=document.querySelector(step.entrySel);if(entry){tutorialCue(entry,step.entryLabel||'点击这里进入');setTimeout(()=>{try{step.enter?step.enter(entry):entry.click()}catch(e){console.warn('[Tutorial] entry action failed',e)}},direction==='jump'?0:520)}}
 const delay=(step.open||step.entrySel)&&direction!=='jump'?600:0;
 setTimeout(()=>{if(typeof step.before==='function'){try{step.before()}catch(e){console.warn('[Tutorial] step preparation failed',e)}}done()},delay)
}
/* P80 write-guard: active only while a tour runs, capture phase, trusted
   events only, tour bubble (#tourTip) exempt. Programmatic clicks (the
   tutorialPrepare entry.click() is not isTrusted) pass untouched, so the
   engine can still open/close surfaces for a step. */
function tourGuard(e){
 if(!tourActive||!e.isTrusted)return;
 const t=e.target;if(!t||typeof t.closest!=='function')return;
 if(t.closest('#tourTip'))return;
 const printable=e.type==='keydown'&&e.key&&e.key.length===1&&!e.ctrlKey&&!e.metaKey&&!e.altKey;
 const isWrite=e.type==='click'||e.type==='input'||e.type==='change'||e.type==='submit'||(e.type==='keydown'&&(e.key==='Enter'||e.key===' '||printable));
 if(!isWrite)return;
 if(e.type==='keydown'&&!t.closest('button,input,textarea,select,a,summary,[role="button"],label,[contenteditable]'))return;
 if(t.closest('button,input,textarea,select,a,summary,[role="button"],label,[contenteditable],form')){e.preventDefault();e.stopImmediatePropagation();}
}
['click','input','change','keydown','submit'].forEach(type=>document.addEventListener(type,tourGuard,true));
function tourShow(i,direction='jump'){
 const steps=tourSteps(),step=steps[i];if(!step)return tourEnd();tourIdx=i;tourActive=true;const token=++tourTransitionToken;
 tutorialPrepare(step,direction,()=>{if(token!==tourTransitionToken||!tourActive)return;const el=document.querySelector(step.sel);if(!el){if(i<steps.length-1)return tourShow(i+1,'forward');return tourEnd()}
 el.scrollIntoView({block:'center',behavior:'instant'});
 const place=()=>tourPlace(el,steps);
 place();requestAnimationFrame(place)
})
}
/* P80 fix: scroll/resize only REPOSITION the bubble — a full tourShow re-ran
   tutorialPrepare (close+reopen the modal), which caused the flicker loop and
   the stuck keys. Repositioning never scrolls, so the loop is broken. */
function tourReposition(){
 if(!tourActive||tourIdx<0)return;const steps=tourSteps(),step=steps[tourIdx];if(!step)return;
 const el=document.querySelector(step.sel);if(!el)return;tourPlace(el,steps);
}
function tourPlace(el,steps){
 const step=steps[tourIdx];if(!step)return;
 const tip=document.getElementById('tourTip');
 /* P81b: rebuild the bubble markup ONLY when the step changes — the scroll
    handler re-places on every scroll, and a rebuild between mousedown and
    mouseup swallowed real clicks on 下一步 (user report: stuck). */
 const sig='#'+tourIdx+'#';
 if(tip.dataset.sig!==sig){tip.dataset.sig=sig;tip.innerHTML=`<div class="tstep">${String(tourIdx+1).padStart(2,'0')} / ${String(steps.length).padStart(2,'0')}</div><div class="ttitle">${THEMES[APP_STATE.theme].em} ${esc(step.title)}</div><div class="tdesc">${esc(step.desc)}</div><div class="tbtns"><button class="tskip">跳过</button>${tourIdx>0?'<button class="tprev">← 上一步</button>':''}<button class="tnext">${step.last||tourIdx===steps.length-1?L('done'):'下一步 →'}</button></div>`; tip.querySelector('.tskip').onclick=()=>tourEnd();const pv=tip.querySelector('.tprev');if(pv)pv.onclick=()=>tourShow(tourIdx-1,'backward');tip.querySelector('.tnext').onclick=()=>step.last||tourIdx===steps.length-1?tourEnd(true):tourShow(tourIdx+1,'forward');}
 const r=el.getBoundingClientRect(),spot=document.getElementById('tourSpot');spot.style.display='block';spot.style.left=(r.left-7)+'px';spot.style.top=(r.top-7)+'px';spot.style.width=(r.width+14)+'px';spot.style.height=(r.height+14)+'px';tip.style.display='block';const below=r.bottom+16+210<window.innerHeight;tip.style.top=below?(r.bottom+16)+'px':Math.max(12,r.top-226)+'px';tip.style.left=Math.min(Math.max(14,r.left),window.innerWidth-346)+'px';
}
/* P80 entry point: start a named tour script (S0..S4) from the operation map. */
function tourStart(scriptId){tourScriptId=scriptId;tourIdx=-1;tourShow(0,'jump');}
function tourNext(){ if(tourIdx>=tourSteps().length-1) tourEnd(true); else tourShow(tourIdx+1,'forward'); }
function tourEnd(completed=false){
  const script=tourScript(tourScriptId);
  tourActive=false; tourIdx=-1;
  if(completed)try{WorkspaceStore.markTutorialComplete();}catch(e){}
  const s=document.getElementById('tourSpot'), t=document.getElementById('tourTip');
  if(s) s.style.display='none'; if(t) t.style.display='none'; const c=document.getElementById('tourCue');if(c)c.style.display='none';document.querySelectorAll('.tour-entry-pulse').forEach(x=>x.classList.remove('tour-entry-pulse'));
  if($('#backdrop').classList.contains('open')) closeModal();
  const toast=$('#toast'); toast.textContent=completed?(script.doneToast||L('doneToast')):(script.entryNote?'已退出「'+script.title+'」导览，随时可以再进。':L('doneToast'));
  toast.classList.add('show'); setTimeout(()=>toast.classList.remove('show'),2200);
}
const spotDiv=document.createElement('div'); spotDiv.className='tourSpot'; spotDiv.id='tourSpot'; spotDiv.style.display='none';
const tipDiv=document.createElement('div'); tipDiv.className='tourTip'; tipDiv.id='tourTip'; tipDiv.style.display='none';
document.body.appendChild(spotDiv); document.body.appendChild(tipDiv); const cueDiv=document.createElement('div');cueDiv.id='tourCue';cueDiv.className='tourCue';cueDiv.style.display='none';document.body.appendChild(cueDiv);
/* P80 (D5): #tourBtn now opens the layer-1 operation map (25-onboarding.js),
   not the sandbox courses. */
document.getElementById('tourBtn').addEventListener('click',()=>{if(window.AI_PLAYBOOK_ONBOARDING?.openMap)window.AI_PLAYBOOK_ONBOARDING.openMap();else openComboTraining();});
/* P80 fix: reposition-only on scroll/resize — a full tourShow here re-ran
   tutorialPrepare and re-entered the step, causing flicker and stuck keys. */
function tourRepositionSoon(){if(!tourActive)return;clearTimeout(window.__tourRepo);window.__tourRepo=setTimeout(tourReposition,120);}
addEventListener('resize',tourRepositionSoon);
addEventListener('scroll',tourRepositionSoon,true);

/* Keyboard handling is defined with the workspace controls. */

/* 启动 */
