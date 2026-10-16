/* P63 · Reorder the existing top actions with pointer or keyboard; preserve button identities. */
const NAV_ORDER_KEY='pb_nav_order_v1',navActions=document.querySelector('.navbtns');
const DEFAULT_NAV_ORDER=[...navActions.querySelectorAll(':scope > .nbtn[id]')].map(button=>button.id);
let navArrangeGesture=null,navSuppressClickUntil=0,navSuppressClickId='',navDropCleanup=null;
const NAV_MOTIONS=new Map();
function normalizeNavOrder(order){const known=new Set(DEFAULT_NAV_ORDER);return [...new Set([...(Array.isArray(order)?order:[]).filter(id=>known.has(id)),...DEFAULT_NAV_ORDER])];}
function currentNavOrder(){return [...navActions.querySelectorAll(':scope > .nbtn[id]')].map(button=>button.id);}
function applyNavOrder(order){normalizeNavOrder(order).forEach(id=>navActions.appendChild(document.getElementById(id)));}
function saveNavOrder(){try{WorkspaceStore.setItem(NAV_ORDER_KEY,JSON.stringify(currentNavOrder()));}catch(e){notifyLocal('布局已调整；浏览器未允许保存，刷新后可能恢复默认顺序。');}}
function navReduceMotion(){return matchMedia('(prefers-reduced-motion: reduce)').matches;}
function navReflow(change){
 const buttons=[...navActions.querySelectorAll(':scope > .nbtn[id]')],before=new Map(buttons.map(b=>[b,b.getBoundingClientRect()]));
 for(const motion of NAV_MOTIONS.values())motion.cancel();NAV_MOTIONS.clear();change();
 const after=new Map(buttons.map(b=>[b,b.getBoundingClientRect()]));if(navArrangeGesture)navArrangeGesture.layoutRects=after;
 if(navReduceMotion())return;
 for(const b of buttons){if(b===navArrangeGesture?.button||typeof b.animate!=='function')continue;const a=before.get(b),z=after.get(b),dx=a.left-z.left,dy=a.top-z.top;if(Math.abs(dx)+Math.abs(dy)<1)continue;
  const motion=b.animate([{transform:`translate(${dx}px,${dy}px)`},{transform:'translate(0,0)'}],{duration:180,easing:'cubic-bezier(.2,.8,.2,1)'});NAV_MOTIONS.set(b,motion);
  motion.finished.then(()=>{if(NAV_MOTIONS.get(b)===motion)NAV_MOTIONS.delete(b);}).catch(()=>{});
 }
}
function navArrangeIndex(rects,x,y){
 if(!rects.length)return 0;
 if(y<Math.min(...rects.map(rect=>rect.top)))return 0;
 if(y>Math.max(...rects.map(rect=>rect.bottom)))return rects.length;
 // Select the row first. A far-right pointer must not jump to an earlier row.
 const vertical=rects.map(rect=>y<rect.top?rect.top-y:y>rect.bottom?y-rect.bottom:0),nearest=Math.min(...vertical);
 const row=rects.map((rect,index)=>({rect,index})).filter(({index})=>vertical[index]===nearest);
 for(const {rect,index} of row)if(x<(rect.left+rect.right)/2)return index;
 return row.at(-1).index+1;
}
function paintNavArrange(){
 const g=navArrangeGesture;if(!g?.dragging)return;g.frame=0;
 g.ghost.style.transform=`translate3d(${g.x-g.offsetX}px,${g.y-g.offsetY}px,0) scale(${navReduceMotion()?1:1.025})`;
 const others=[...navActions.querySelectorAll(':scope > .nbtn[id]')].filter(button=>button!==g.button);
 const index=navArrangeIndex(others.map(button=>g.layoutRects?.get(button)||button.getBoundingClientRect()),g.x,g.y),next=others[index]||null;
 if(g.button.nextElementSibling!==next&&(!g.lastSwap||Math.hypot(g.x-g.lastSwap.x,g.y-g.lastSwap.y)>=8)){
  navReflow(()=>navActions.insertBefore(g.button,next));g.lastSwap={x:g.x,y:g.y};
 }
}
function startNavArrange(g){
 if(navDropCleanup)navDropCleanup();
 const rect=g.button.getBoundingClientRect();g.dragging=true;g.offsetX=g.startX-rect.left;g.offsetY=g.startY-rect.top;
 document.body.classList.add('window-interacting','nav-arranging');g.button.classList.add('nav-drag-source');
 g.ghost=g.button.cloneNode(true);g.ghost.removeAttribute('id');g.ghost.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));
 g.ghost.classList.remove('nav-drag-source','helpable','help-hot');g.ghost.classList.add('nav-drag-ghost');g.ghost.setAttribute('aria-hidden','true');
 const appearance=getComputedStyle(g.button);Object.assign(g.ghost.style,{width:rect.width+'px',height:rect.height+'px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:appearance.fontSize,lineHeight:appearance.lineHeight,fontFamily:appearance.fontFamily,padding:appearance.padding,borderRadius:appearance.borderRadius,gap:appearance.gap,letterSpacing:appearance.letterSpacing});document.body.appendChild(g.ghost);
 g.layoutRects=new Map([...navActions.querySelectorAll(':scope > .nbtn[id]')].map(b=>[b,b.getBoundingClientRect()]));
 navActions.setPointerCapture?.(g.pointerId);
}
function finishNavArrange({cancel=false}={}){
 const g=navArrangeGesture;if(!g)return;
 if(g.frame)cancelAnimationFrame(g.frame);
 if(g.dragging){
  if(!cancel)paintNavArrange();
  if(cancel)navReflow(()=>applyNavOrder(g.original));else if(currentNavOrder().join('|')!==g.original.join('|'))saveNavOrder();
  const cleanup=()=>{if(g.dropCleaned)return;g.dropCleaned=true;g.dropMotion?.cancel();g.ghost.remove();g.button.classList.remove('nav-drag-source');if(navDropCleanup===cleanup)navDropCleanup=null;};
  if(!cancel&&!navReduceMotion()&&typeof g.ghost.animate==='function'){
   const r=g.button.getBoundingClientRect();navDropCleanup=cleanup;g.dropMotion=g.ghost.animate([{transform:g.ghost.style.transform,opacity:.94},{transform:`translate3d(${r.left}px,${r.top}px,0) scale(1)`,opacity:1}],{duration:160,easing:'cubic-bezier(.2,.8,.2,1)',fill:'forwards'});
   g.dropMotion.finished.then(cleanup).catch(cleanup);
  }else cleanup();
  navSuppressClickUntil=performance.now()+500;
  navSuppressClickId=g.button.id;
  document.body.classList.remove('window-interacting','nav-arranging');
  if(typeof resumeGlobalReading==='function')resumeGlobalReading();
 }
 navArrangeGesture=null;
}
try{applyNavOrder(JSON.parse(WorkspaceStore.getItem(NAV_ORDER_KEY)||'[]'));}catch(e){applyNavOrder([]);}
navActions.setAttribute('aria-label','顶部功能，可拖动排序；Alt 加方向键移动按钮');
navActions.addEventListener('pointerdown',e=>{
 const button=e.target.closest('.nbtn[id]');if(!button||button.parentElement!==navActions||e.button!==0||HELP_MODE||navArrangeGesture||document.body.classList.contains('window-interacting'))return;
 navArrangeGesture={button,startX:e.clientX,startY:e.clientY,x:e.clientX,y:e.clientY,pointerId:e.pointerId,dragging:false,frame:0,original:currentNavOrder()};
});
document.addEventListener('pointermove',e=>{
 const g=navArrangeGesture;if(!g||e.pointerId!==g.pointerId)return;g.x=e.clientX;g.y=e.clientY;
 if(!g.dragging&&Math.hypot(g.x-g.startX,g.y-g.startY)<(e.pointerType==='touch'?10:6))return;
 if(!g.dragging)startNavArrange(g);e.preventDefault();
 if(!g.frame)g.frame=requestAnimationFrame(paintNavArrange);
});
document.addEventListener('pointerup',e=>{const g=navArrangeGesture;if(!g||e.pointerId!==g.pointerId)return;g.x=e.clientX;g.y=e.clientY;finishNavArrange();});
document.addEventListener('pointercancel',()=>finishNavArrange({cancel:true}));
navActions.addEventListener('lostpointercapture',()=>finishNavArrange({cancel:true}));
window.addEventListener('blur',()=>finishNavArrange({cancel:true}));
window.addEventListener('resize',()=>finishNavArrange({cancel:true}));
document.addEventListener('click',e=>{if(e.detail!==0&&performance.now()<navSuppressClickUntil&&(e.target===navActions||e.target.closest('.nbtn[id]')?.id===navSuppressClickId)){navSuppressClickUntil=0;e.preventDefault();e.stopImmediatePropagation();}},true);
navActions.addEventListener('keydown',e=>{
 if(e.key==='Escape'&&navArrangeGesture?.dragging){e.preventDefault();e.stopPropagation();finishNavArrange({cancel:true});return;}
 const button=e.target.closest('.nbtn[id]');if(!button||!e.altKey||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(e.key))return;
 e.preventDefault();e.stopPropagation();const order=currentNavOrder(),index=order.indexOf(button.id);
 const target=e.key==='Home'?0:e.key==='End'?order.length-1:Math.min(order.length-1,Math.max(0,index+(['ArrowLeft','ArrowUp'].includes(e.key)?-1:1)));
 if(target===index)return;order.splice(index,1);order.splice(target,0,button.id);navReflow(()=>applyNavOrder(order));button.focus({preventScroll:true});saveNavOrder();
});
document.getElementById('navLayoutReset').addEventListener('click',()=>{if(navDropCleanup)navDropCleanup();navReflow(()=>applyNavOrder(DEFAULT_NAV_ORDER));saveNavOrder();notifyLocal('顶部功能已恢复默认顺序。');});

