/* v6.39 · Desktop windows and same-page data propagation.
   Each surface owns one DOM instance and can be moved, resized and focused independently.
   Mobile retains the original full-screen navigation. */
/* Existing modal helpers use the same desktop focus and scroll policy. */
OverlayManager.top=function(){const open=this.entries().filter(x=>{try{return x.open()}catch(e){return false}});if(!adjustableDesktop())return open[0]||null;return open.sort((a,b)=>(Number(windowHost(b.root())?.style.zIndex)||0)-(Number(windowHost(a.root())?.style.zIndex)||0))[0]||null};
OverlayManager.syncBodyLock=function(){document.body.style.overflow=adjustableDesktop()?'':modalLayersOpen()?'hidden':''};
const _p61OpenWorkspaceCard=openWorkspaceCard;
openWorkspaceCard=function(id){if(!adjustableDesktop())return _p61OpenWorkspaceCard(id);const card=DATA.find(x=>x.id===id);if(!card){notifyLocal('这张模板已不在当前库中。');return}openCard(card.id)};
const _p61OpenPersonalWorkspace=openPersonalWorkspace;
openPersonalWorkspace=function(tab='prompts'){if(adjustableDesktop()&&$('#personalWorkspaceOverlay').classList.contains('open')){if(personalWorkspaceTab!==tab){personalWorkspaceTab=LOCAL_WORKSPACE_TABS.has(tab)?tab:'prompts';personalWorkspaceQuery='';$('#personalWorkspaceSearch').value='';}renderPersonalWorkspace();focusDesktopWindow($('#personalWorkspaceOverlay'));return}_p61OpenPersonalWorkspace(tab)};
const DESKTOP_WINDOW_SELECTOR='.utilityOverlay,.srcOverlay,#backdrop,#scratchFlyout,#readingFlyout';
let desktopWindowOrder=1100;
function desktopWindowOpen(host){return host.matches('.context-flyout')?!host.hidden:host.classList.contains('open')}
function focusDesktopWindow(host){
 if(!adjustableDesktop()||!host)return;
 if(!desktopWindowOpen(host)){host.classList.remove('desktop-active-window');return;}
 if(host.classList.contains('desktop-active-window'))return;
 if(desktopWindowOrder>10000){
  const open=[...document.querySelectorAll(DESKTOP_WINDOW_SELECTOR)].filter(desktopWindowOpen).sort((a,b)=>(Number(a.style.zIndex)||0)-(Number(b.style.zIndex)||0));
  desktopWindowOrder=1100;open.forEach(el=>el.style.zIndex=String(++desktopWindowOrder));
 }
 document.querySelectorAll('.desktop-active-window').forEach(el=>el.classList.remove('desktop-active-window'));
 host.style.zIndex=String(++desktopWindowOrder);
 host.classList.add('desktop-active-window');
}
function windowHost(target){return target?.closest(DESKTOP_WINDOW_SELECTOR)}
const windowWasOpen=new WeakMap();
for(const host of document.querySelectorAll(DESKTOP_WINDOW_SELECTOR)){
 windowWasOpen.set(host,desktopWindowOpen(host));
 new MutationObserver(()=>{
  const open=desktopWindowOpen(host),was=windowWasOpen.get(host);
  if(open===was)return;
  windowWasOpen.set(host,open);
  if(open)focusDesktopWindow(host);
  else host.classList.remove('desktop-active-window');
 }).observe(host,{attributes:true,attributeFilter:['class','hidden']});
}
document.addEventListener('pointerdown',e=>focusDesktopWindow(windowHost(e.target)),true);
document.addEventListener('focusin',e=>focusDesktopWindow(windowHost(e.target)),true);
document.addEventListener('click',e=>{if(e.target.closest('[data-panel-close]'))closeModal()});
/* Reopening a visible surface raises it instead of leaving it behind another. */
document.addEventListener('click',e=>{
 const target=e.target.closest('#devlogBtn,#devlogFoot,#sourceCatalogBtn,#needBtn,#importBtn,#personalWorkspaceBtn,[data-workspace-open],[data-scratch-open],[data-reading-open]');
 if(!target||!adjustableDesktop())return;
 const selector=target.matches('#devlogBtn,#devlogFoot')?'#devlogOverlay':target.matches('#sourceCatalogBtn')?'#sourceCatalogOverlay':target.matches('#needBtn')?'#needOverlay':target.matches('#importBtn')?'#importOverlay':target.matches('[data-scratch-open]')?'#scratchFlyout':target.matches('[data-reading-open]')?'#readingFlyout':'#personalWorkspaceOverlay';
 queueMicrotask(()=>focusDesktopWindow($(selector)));
});
function syncDesktopWindowMode(){
 for(const host of document.querySelectorAll(DESKTOP_WINDOW_SELECTOR)){
  if(!adjustableDesktop()){host.style.zIndex='';host.classList.remove('desktop-active-window')}
  host.querySelectorAll('[role="dialog"]').forEach(dialog=>dialog.setAttribute('aria-modal',String(!adjustableDesktop())));
  if(host.matches('[role="dialog"]'))host.setAttribute('aria-modal',String(!adjustableDesktop()));
 }
 if(adjustableDesktop())document.querySelectorAll(DESKTOP_WINDOW_SELECTOR).forEach(host=>{if(desktopWindowOpen(host)&&!host.style.zIndex)focusDesktopWindow(host)});
 syncBodyLock();
}
window.addEventListener('resize',syncDesktopWindowMode);


/* The card pane has the same resize handles as the other desktop windows. */
const cardWindow=document.getElementById('panel');
function prepareCardWindow(){
 if(!activeCard)return;
 ensureAdjustable(cardWindow);
 cardWindow.setAttribute('aria-modal',String(!adjustableDesktop()));
 cardWindow.querySelector('.panel-window-head')?.setAttribute('title','拖动标题移动模板窗口；双击空白处最大化或还原；Alt + 方向键微调');
}
new MutationObserver(prepareCardWindow).observe(cardWindow,{childList:true});
let cardMove=null;/* Compatibility with maximize; all dragging now uses the shared controller. */

/* Persisted changes notify every open view. A microtask coalesces multiple writes
   within one delete, restore or save action and avoids redraws while typing. */
const pendingWindowChanges=new Set();let windowFlushQueued=false;
function notifyWindowDataChange(kind){
 pendingWindowChanges.add(kind);
 if(windowFlushQueued)return;
 windowFlushQueued=true;
 queueMicrotask(()=>{
  windowFlushQueued=false;
  const kinds=new Set(pendingWindowChanges);pendingWindowChanges.clear();
  if(kinds.has('scratch')){
   renderScratchArchive();
   if($('#personalWorkspaceOverlay').classList.contains('open') && ['scratch','trash'].includes(personalWorkspaceTab))renderPersonalWorkspace();
  }
  if(kinds.has('personal')){
   if(typeof refreshFileImportDuplicates==='function')refreshFileImportDuplicates();
   updateWorkspaceBadge();
   if($('#personalWorkspaceOverlay').classList.contains('open'))renderPersonalWorkspace();
   if(activeCard?.userImported && DATA.some(c=>c.id===activeCard.id)){
    activeCard=DATA.find(c=>c.id===activeCard.id);renderWorkspace();
   }
  }
  if(kinds.has('lists')&&$('#personalWorkspaceOverlay').classList.contains('open'))renderPersonalWorkspace();
 });
}
const _windowPersistArchive=persistScratchArchive;
persistScratchArchive=function(...args){const ok=_windowPersistArchive(...args);if(ok)notifyWindowDataChange('scratch');return ok};
const _windowPwWrite=pwWrite;
pwWrite=function(key,value){const ok=_windowPwWrite(key,value);if(ok){
 if(key===SCRATCH_TRASH_KEY)notifyWindowDataChange('scratch');
 else notifyWindowDataChange('lists');
}return ok};
const _windowSaveUserRecords=saveUserRecords;
saveUserRecords=function(...args){const ok=_windowSaveUserRecords(...args);if(ok)notifyWindowDataChange('personal');return ok};

/* The stored preference controls only the two home navigation badges. */
applyCountVisibility();
syncDesktopWindowMode();

