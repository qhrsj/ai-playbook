/* P62 · One maximize/restore control per desktop window; preserve normal geometry. */
const WINDOW_NORMAL_GEOMETRY=new WeakMap();
const WINDOW_GEOMETRY_KEYS=['position','left','top','right','bottom','width','height','minWidth','minHeight','maxWidth','maxHeight','margin','borderRadius','animation'];
const MAXIMIZE_VIEW_SELECTOR=ADJUSTABLE_SELECTOR;
function windowViewportRect(){return {left:0,top:0,width:document.documentElement.clientWidth||window.innerWidth,height:window.innerHeight};}
function maximizeWindowFit(view){
 if(!view.classList.contains('window-maximized')||!adjustableDesktop())return;
 const rect=windowViewportRect();
 Object.assign(view.style,{position:'fixed',left:'0px',top:'0px',right:'auto',bottom:'auto',width:rect.width+'px',height:rect.height+'px',minWidth:'0',minHeight:'0',maxWidth:'none',maxHeight:'none',margin:'0',borderRadius:'0',animation:'none'});
}
function updateWindowMaximizeButton(view){
 const button=view.querySelector('[data-window-maximize]');if(!button)return;
 const max=view.classList.contains('window-maximized');button.setAttribute('aria-pressed',String(max));button.setAttribute('aria-label',max?'还原窗口':'最大化窗口');button.title=max?'还原窗口':'最大化窗口';
 button.innerHTML=max?'<span aria-hidden="true">❐</span>':'<span aria-hidden="true">□</span>';
}
function ensureWindowMaximize(view){
 const head=view.querySelector(':scope > header,:scope > .context-flyout-head,:scope > .panel-window-head');if(!head)return;
 let button=head.querySelector('[data-window-maximize]');
 if(!button){
  button=document.createElement('button');button.type='button';button.className='window-maximize';button.dataset.windowMaximize='';
  const close=head.querySelector('.close,.context-flyout-close,.panel-window-close');
  if(close)close.parentElement.insertBefore(button,close);else head.appendChild(button);
 }
 updateWindowMaximizeButton(view);
}
function toggleWindowMaximize(view){
 if(!view||!adjustableDesktop())return;
 focusDesktopWindow(windowHost(view));
 if(view.classList.contains('window-maximized')){
  const normal=WINDOW_NORMAL_GEOMETRY.get(view);view.classList.remove('window-maximized');
  if(normal)WINDOW_GEOMETRY_KEYS.forEach(key=>view.style[key]=normal[key]);
  WINDOW_NORMAL_GEOMETRY.delete(view);adjustableKeepInView(view);
 }else{
  const normal={};WINDOW_GEOMETRY_KEYS.forEach(key=>normal[key]=view.style[key]||'');
  WINDOW_NORMAL_GEOMETRY.set(view,normal);adjustableEnd();cardMove=null;
  view.classList.add('window-maximized');maximizeWindowFit(view);
 }
 updateWindowMaximizeButton(view);
}
const _p62EnsureAdjustable=ensureAdjustable;
ensureAdjustable=function(view){_p62EnsureAdjustable(view);ensureWindowMaximize(view)};
document.querySelectorAll(MAXIMIZE_VIEW_SELECTOR).forEach(ensureAdjustable);
document.addEventListener('click',e=>{const button=e.target.closest('[data-window-maximize]');if(button){e.preventDefault();toggleWindowMaximize(button.closest('.window-adjustable'));}});
document.addEventListener('dblclick',e=>{
 if(e.target.closest('button,input,textarea,select,a'))return;
 const head=e.target.closest('header,.context-flyout-head,.panel-window-head'),view=head?.closest('.window-adjustable');
 if(view&&head.parentElement===view)toggleWindowMaximize(view);
});
window.addEventListener('resize',()=>document.querySelectorAll(MAXIMIZE_VIEW_SELECTOR).forEach(maximizeWindowFit));
let lastWindowDesktopMode=adjustableDesktop();
new MutationObserver(()=>{
 const desktop=adjustableDesktop();if(desktop===lastWindowDesktopMode)return;
 lastWindowDesktopMode=desktop;syncDesktopWindowMode();document.querySelectorAll(MAXIMIZE_VIEW_SELECTOR).forEach(maximizeWindowFit);
}).observe(document.body,{attributes:true,attributeFilter:['class']});
// New content rendered in any window or on the home page uses the global reading preference.
new MutationObserver(records=>{
 if(records.some(record=>[...record.addedNodes].some(node=>node.nodeType===1)))queueGlobalReading();
}).observe(document.body,{childList:true,subtree:true});
queueGlobalReading();

