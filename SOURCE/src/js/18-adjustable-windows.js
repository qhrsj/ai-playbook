/* P63 · Shared, frame-coalesced desktop movement and eight-way resizing. */
const ADJUSTABLE_SELECTOR='.utilityOverlay > .utilityView,.srcOverlay > .srcview,.context-flyout,#panel';
const ADJUSTABLE_EDGES={n:'上',ne:'右上',e:'右',se:'右下',s:'下',sw:'左下',w:'左',nw:'左上'};
function adjustableDesktop(){return !document.body.classList.contains('m-mode')&&window.innerWidth>760;}
function adjustableMin(view){const tutorial=view.classList.contains('combo-training-view');return {w:Math.min(view.classList.contains('context-flyout')?300:view.classList.contains('personal-workspace-dialog')?520:360,window.innerWidth-24),h:Math.min(tutorial?480:view.classList.contains('context-flyout')?220:view.classList.contains('personal-workspace-dialog')?420:240,window.innerHeight-(tutorial?32:24))};}
function adjustableClamp(value,low,high){return Math.max(low,Math.min(value,Math.max(low,high)));}
function ensureAdjustable(view){
 if(!view)return;
 if(!view.classList.contains('window-adjustable'))view.classList.add('window-adjustable');
 const head=view.querySelector(':scope > header,:scope > .context-flyout-head,:scope > .panel-window-head');
 if(head){head.tabIndex=0;head.title='拖动标题移动窗口；Alt + 方向键微调位置；双击标题空白处最大化或还原';}
 for(const [dir,label] of Object.entries(ADJUSTABLE_EDGES)){
  if(view.querySelector(`:scope > .window-resize-handle[data-resize-dir="${dir}"]`))continue;
  const handle=document.createElement('button');handle.type='button';handle.className='window-resize-handle resize-'+dir;handle.dataset.resizeDir=dir;
  handle.setAttribute('aria-label',`从${label}侧调整窗口大小；方向键微调`);handle.title=`从${label}侧拖动缩放`;view.appendChild(handle);
 }
}
document.querySelectorAll(ADJUSTABLE_SELECTOR).forEach(ensureAdjustable);
function adjustableKeepInView(view){
 if(view.classList.contains('window-draggable')){if(adjustableDesktop())floatingKeepInView(view);return;}
 if(view.classList.contains('window-maximized')){maximizeWindowFit(view);return;}
 if(!adjustableDesktop()||(!view.style.left&&view.id!=='panel')||!view.getClientRects().length)return;
 const r=view.getBoundingClientRect(),w=Math.min(r.width,window.innerWidth-16),h=Math.min(r.height,window.innerHeight-16);
 view.style.width=w+'px';view.style.height=h+'px';
 view.style.left=adjustableClamp(r.left,8,window.innerWidth-w-8)+'px';view.style.top=adjustableClamp(r.top,8,window.innerHeight-h-8)+'px';
}
// Only opening/closing a host changes its geometry; focus decoration does not.
document.querySelectorAll(ADJUSTABLE_SELECTOR).forEach(view=>{
 const host=view.classList.contains('context-flyout')?view:view.parentElement;
 if(!host)return;
 let open=view.classList.contains('context-flyout')?!view.hidden:host.classList.contains('open');
 new MutationObserver(()=>{
  const next=view.classList.contains('context-flyout')?!view.hidden:host.classList.contains('open');
  if(next===open)return;open=next;if(next)requestAnimationFrame(()=>adjustableKeepInView(view));
 }).observe(host,{attributes:true,attributeFilter:['class','hidden']});
});
const dynamicSourceView=document.getElementById('srcview');
if(dynamicSourceView)new MutationObserver(()=>ensureAdjustable(dynamicSourceView)).observe(dynamicSourceView,{childList:true});
function adjustablePlace(view){
 if(view.classList.contains('window-draggable'))view.style.animation='none';
 const rect=view.getBoundingClientRect(),min=adjustableMin(view),width=Math.min(rect.width,window.innerWidth-16),height=Math.min(rect.height,window.innerHeight-16);
 const left=adjustableClamp(rect.left,8,window.innerWidth-width-8),top=adjustableClamp(rect.top,8,window.innerHeight-height-8);
 if(view.classList.contains('window-draggable')){Object.assign(view.style,{position:'fixed',left:left+'px',top:top+'px',right:'auto',bottom:'auto',margin:'0',animation:'none'});return {left,top,width,height,min};}
 Object.assign(view.style,{position:'fixed',left:left+'px',top:top+'px',right:'auto',bottom:'auto',width:width+'px',height:height+'px',maxWidth:'none',maxHeight:'none',margin:'0',animation:'none'});
 return {left,top,width,height,min};
}
function adjustableResize(start,dir,dx,dy){
 let left=start.left,top=start.top,right=left+start.width,bottom=top+start.height;
 if(dir.includes('w'))left=adjustableClamp(left+dx,8,right-start.min.w);
 if(dir.includes('e'))right=adjustableClamp(right+dx,left+start.min.w,window.innerWidth-8);
 if(dir.includes('n'))top=adjustableClamp(top+dy,8,bottom-start.min.h);
 if(dir.includes('s'))bottom=adjustableClamp(bottom+dy,top+start.min.h,window.innerHeight-8);
 return {left,top,width:right-left,height:bottom-top};
}
function adjustableApply(view,rect){if(view.classList.contains('window-draggable')){Object.assign(view.style,{left:rect.left+'px',top:rect.top+'px'});return;}Object.assign(view.style,{left:rect.left+'px',top:rect.top+'px',width:rect.width+'px',height:rect.height+'px'});}
let adjustableGesture=null;
function adjustablePaint(){
 const g=adjustableGesture;if(!g||!g.pending)return;
 g.frame=0;const rect=g.pending;
 if(g.dir)adjustableApply(g.view,rect);
 else g.view.style.transform=`translate3d(${rect.left-g.start.left}px,${rect.top-g.start.top}px,0)`+(g.transform&&g.transform!=='none'?' '+g.transform:'');
}
function adjustableQueue(e){
 const g=adjustableGesture;if(!g||e.pointerId!=null&&e.pointerId!==g.pointerId)return;
 const dx=e.clientX-g.x,dy=e.clientY-g.y;
 g.pending=g.dir?adjustableResize(g.start,g.dir,dx,dy):{...g.start,left:adjustableClamp(g.start.left+dx,8,window.innerWidth-g.start.width-8),top:adjustableClamp(g.start.top+dy,8,window.innerHeight-g.start.height-8)};
 if(!g.frame)g.frame=requestAnimationFrame(adjustablePaint);
}
function adjustableEnd(e){
 const g=adjustableGesture;if(!g||e?.pointerId!=null&&e.pointerId!==g.pointerId)return;
 if(e?.type==='pointerup'&&Number.isFinite(e?.clientX)&&Number.isFinite(e?.clientY))adjustableQueue(e);
 if(g.frame)cancelAnimationFrame(g.frame);
 if(g.pending){adjustableApply(g.view,g.pending);if(g.view.classList.contains('window-draggable')&&(g.pending.left!==g.start.left||g.pending.top!==g.start.top))g.view.dataset.windowMoved='true';}
 g.view.style.transform=g.transform;
 g.view.classList.remove('is-moving');adjustableGesture=null;document.body.classList.remove('window-interacting');
 if(typeof resumeGlobalReading==='function')resumeGlobalReading();
}
document.addEventListener('pointerdown',e=>{
 if(!adjustableDesktop()||(e.pointerType==='mouse'&&e.button!==0)||adjustableGesture||document.body.classList.contains('window-interacting'))return;
 const view=e.target.closest('.window-adjustable,.window-draggable');if(!view||view.classList.contains('window-maximized'))return;
 const handle=e.target.closest('.window-resize-handle'),dir=handle?.dataset.resizeDir||'';
 if(handle&&handle.parentElement!==view)return;
 if(!dir){const header=e.target.closest('header,.context-flyout-head,.panel-window-head,.floating-window-head');if(!header||header.parentElement!==view||e.target.closest('button,input,textarea,select,a,[role="button"]'))return;}
 e.preventDefault();const start=adjustablePlace(view);
 adjustableGesture={view,dir,start,x:e.clientX,y:e.clientY,pointerId:e.pointerId,transform:view.style.transform||'',frame:0,pending:null};view.classList.add('is-moving');document.body.classList.add('window-interacting');
 e.target.setPointerCapture?.(e.pointerId);
});
document.addEventListener('pointermove',adjustableQueue,{passive:true});
document.addEventListener('pointerup',adjustableEnd);document.addEventListener('pointercancel',adjustableEnd);
document.addEventListener('lostpointercapture',adjustableEnd);
window.addEventListener('blur',()=>adjustableEnd());
document.addEventListener('keydown',e=>{
 if(!adjustableDesktop()||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;
 const dir=e.target.classList?.contains('window-resize-handle')?e.target.dataset.resizeDir:'';const header=e.target.matches?.('.window-adjustable > header,.window-adjustable > .context-flyout-head,.window-adjustable > .panel-window-head,.window-draggable > .floating-window-head');
 if(!dir&&!(header&&e.altKey))return;
 const view=e.target.closest('.window-adjustable,.window-draggable');if(!view||view.classList.contains('window-maximized'))return;const step=e.shiftKey?32:12,dx=e.key==='ArrowLeft'?-step:e.key==='ArrowRight'?step:0,dy=e.key==='ArrowUp'?-step:e.key==='ArrowDown'?step:0;
 if(dir&&((dx&&!/[we]/.test(dir))||(dy&&!/[ns]/.test(dir))))return;
 e.preventDefault();const r=adjustablePlace(view);
 if(dir)adjustableApply(view,adjustableResize(r,dir,dx,dy));
 else{if(view.classList.contains('window-draggable'))view.dataset.windowMoved='true';view.style.left=adjustableClamp(r.left+dx,8,window.innerWidth-r.width-8)+'px';view.style.top=adjustableClamp(r.top+dy,8,window.innerHeight-r.height-8)+'px';}
});
window.addEventListener('resize',()=>{adjustableEnd();document.querySelectorAll(ADJUSTABLE_SELECTOR).forEach(adjustableKeepInView)});

