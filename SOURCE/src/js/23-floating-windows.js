/* P65: help and choice surfaces share the frame-coalesced movement controller.
   They move from their title bars, keep content-driven height, and sit above work windows. */
const FLOATING_WINDOW_SELECTOR='#helpPopover,#themeMenu,#sceneMenu,#sheetBody';
function floatingWindowHost(view){return view?.id==='sheetBody'?document.getElementById('themeSheet'):view;}
function floatingWindowOpen(view){
 if(!view)return false;
 if(view.id==='themeMenu')return view.classList.contains('open');
 if(view.id==='sheetBody')return floatingWindowHost(view)?.classList.contains('open');
 return !view.hidden;
}
function prepareFloatingWindow(view){
 if(!view)return;view.classList.add('window-draggable');view.style.animation='none';
 const head=view.querySelector(':scope > .floating-window-head');
 if(head){head.tabIndex=0;head.title='拖动标题移动窗口；Alt + 方向键微调位置';}
}
function floatingKeepInView(view){
 if(!adjustableDesktop()||!floatingWindowOpen(view)||!view.getClientRects().length)return;
 const r=view.getBoundingClientRect(),w=Math.min(r.width,window.innerWidth-16),h=Math.min(r.height,window.innerHeight-16);
 // Position only: a new help explanation or a different theme can change the natural height.
 view.style.left=adjustableClamp(r.left,8,window.innerWidth-w-8)+'px';
 view.style.top=adjustableClamp(r.top,8,window.innerHeight-h-8)+'px';
 view.style.right='auto';view.style.bottom='auto';
}
let floatingWindowOrder=11500;
function focusFloatingWindow(view){
 if(!adjustableDesktop()||!floatingWindowOpen(view))return;
 const host=floatingWindowHost(view);if(host.classList.contains('floating-active-window'))return;
 if(floatingWindowOrder>=12020){
  const open=[...document.querySelectorAll(FLOATING_WINDOW_SELECTOR)].filter(floatingWindowOpen).sort((a,b)=>Number(floatingWindowHost(a).style.zIndex||0)-Number(floatingWindowHost(b).style.zIndex||0));
  floatingWindowOrder=11500;open.forEach(v=>floatingWindowHost(v).style.zIndex=String(++floatingWindowOrder));
 }
 document.querySelectorAll('.floating-active-window').forEach(v=>v.classList.remove('floating-active-window'));
 host.style.zIndex=String(++floatingWindowOrder);host.classList.add('floating-active-window');
}
for(const view of document.querySelectorAll(FLOATING_WINDOW_SELECTOR)){
 prepareFloatingWindow(view);let open=floatingWindowOpen(view);
 const host=floatingWindowHost(view);
 new MutationObserver(()=>{
  const next=floatingWindowOpen(view);if(next===open)return;open=next;
  if(next){focusFloatingWindow(view);requestAnimationFrame(()=>floatingKeepInView(view));}
  else host.classList.remove('floating-active-window');
 }).observe(host,{attributes:true,attributeFilter:['class','hidden']});
}
document.addEventListener('pointerdown',e=>focusFloatingWindow(e.target.closest(FLOATING_WINDOW_SELECTOR)),true);
document.addEventListener('focusin',e=>focusFloatingWindow(e.target.closest(FLOATING_WINDOW_SELECTOR)),true);
window.addEventListener('resize',()=>document.querySelectorAll(FLOATING_WINDOW_SELECTOR).forEach(floatingKeepInView));
// Escape/Tab must use the same front-to-back order as the visible windows.
const _p65WindowTop=OverlayManager.top;
OverlayManager.top=function(){
 if(!adjustableDesktop())return _p65WindowTop.call(this);
 const open=this.entries().filter(x=>{try{return x.open();}catch(e){return false;}});
 return open.sort((a,b)=>{
  const layer=entry=>{if(entry.name==='tour')return 12021;const root=entry.root();const host=windowHost(root)||root;return Number(host?.style.zIndex)||Number(root?.matches?.('#themeMenu,#sceneMenu,#themeSheet,#helpPopover')?11500:0);};
  return layer(b)-layer(a);
 })[0]||null;
};

