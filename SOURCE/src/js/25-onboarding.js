/* ================================================================
   P80 · ONBOARDING — layer-1 operation map.
   Loads AFTER 24-combo-training.js (uses comboOpenCourse /
   comboPurgeVideoProgress) and exposes window.AI_PLAYBOOK_ONBOARDING.
   Static page, zero dependencies, data driven by combo-training.json.map.
   P80.1: the first-run welcome card is fully retired (user report
   2026-10-15) — the operation map alone carries first-run guidance. The
   WorkspaceStore welcome()/setWelcome() API remains for backup
   compatibility; nothing renders the card anymore.
================================================================ */
function tutorialMapData(){return COMBO_CATALOG.map||{flows:[]};}
function renderTutorialMap(){
 const host=$('#tutorialMapBody'),map=tutorialMapData();if(!host)return;
 const sub=$('#tutorialMapSub');if(sub)sub.textContent=`v${RELEASE_MANIFEST.version} · ${RELEASE_MANIFEST.phase} · 看地图 → 跟导览 → 亲手练`;
 host.innerHTML=`<p class="tutorial-map-tagline">${esc(map.tagline||'')}</p>`+
  (map.headerTour?`<div class="tutorial-map-overview"><button class="w-btn primary tutorial-map-overview-btn" type="button" data-map-tour="${esc(map.headerTour)}">${esc(map.headerTourLabel||'界面总览导览')}</button><span class="tutorial-map-overview-hint">约 1 分钟 · 只看不改 · 你点「下一步」推进</span></div>`:'')+
  (map.flows||[]).map(f=>`<section class="tutorial-flow" data-flow="${esc(f.id)}">
   <div class="tutorial-flow-head"><h3>${esc(f.title)}</h3><p>${esc(f.intro||'')}</p></div>
   <ol class="tutorial-flow-steps">${(f.steps||[]).map(s=>`<li><b>${esc(s.label)}</b><span>${esc(s.detail)}</span></li>`).join('')}</ol>
   <div class="tutorial-flow-actions"><button class="w-btn small" type="button" data-map-tour="${esc(f.tour)}">跟导览看一遍</button><button class="w-btn small primary" type="button" data-map-course="${esc(f.course)}">亲手练：从第 1 招开始</button></div>
   <ol class="tutorial-flow-courses">${(f.courses||[]).map(id=>{const c=(COMBO_CATALOG.courses||[]).find(x=>x.id===id);if(!c)return '';const done=isCourseDone(c);return `<li><button class="w-btn small${done?' is-done':''}" type="button" data-map-course="${esc(id)}" title="${esc(c.goal||'')}">${done?'✓ ':''}${esc(c.title)}</button></li>`;}).join('')}</ol>
  </section>`).join('')+
  `<p class="tutorial-map-help">${esc(map.helpNote||'')}</p>`;
}
/* A flow teaches every listed lesson — the chips expose them all so nothing
   is skipped (user report 2026-10-15). */
function isCourseDone(c){
 try{const p=comboReadProgress();const r=p[c.id+':guided']||p[c.id+':solo'];return !!(r&&r.revision===c.revision);}catch(e){return false;}
}
function openTutorialMap(){
 renderTutorialMap();
 const overlay=$('#tutorialMapOverlay');if(!overlay)return;
 overlay.classList.add('open');overlay.setAttribute('aria-hidden','false');syncBodyLock();
 requestAnimationFrame(()=>$('#tutorialMapClose')?.focus({preventScroll:true}));
}
function closeTutorialMap(){
 const overlay=$('#tutorialMapOverlay');if(!overlay||!overlay.classList.contains('open'))return;
 overlay.classList.remove('open');overlay.setAttribute('aria-hidden','true');syncBodyLock();
}
$('#tutorialMapClose')?.addEventListener('click',closeTutorialMap);
$('#tutorialMapOverlay')?.addEventListener('click',e=>{if(e.target.id==='tutorialMapOverlay')closeTutorialMap();});
$('#tutorialMapOverlay')?.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();closeTutorialMap();}});
/* Flow buttons: jump to the layer-2 tour or the layer-3 course. */
document.addEventListener('click',e=>{
 const tourBtn=e.target.closest?.('[data-map-tour]');
 if(tourBtn){const id=tourBtn.dataset.mapTour;closeTutorialMap();if(typeof tourStart==='function')tourStart(id);return;}
 const courseBtn=e.target.closest?.('[data-map-course]');
 if(courseBtn){comboOpenCourse(courseBtn.dataset.mapCourse,'guided');return;}
},false);
/* P80 (裁决③): purge the retired ':video' watch-progress keys exactly once
   per boot; comboReadProgress ignores them as a second line of defence. */
function tutorialPurgeVideoProgress(){try{window.AI_PLAYBOOK_COMBO?.purgeVideoProgress?.();}catch(e){}}
tutorialPurgeVideoProgress();
window.AI_PLAYBOOK_ONBOARDING={openMap:openTutorialMap,closeMap:closeTutorialMap};
