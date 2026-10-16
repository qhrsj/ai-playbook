/* Production ordering/animation calls against geometry and Animation substitutes.
   Checks lifecycle and continuity arguments, not browser animation rendering. */
const fs=require('fs'),path=require('path'),assert=require('assert');
const {make,Evt,catalog,read}=require('./combo_action_gate.cjs');
const root=path.resolve(__dirname,'..');
async function main(){
 const h=make(catalog.courses[0]),{doc,run}=h,nav=doc.querySelector('.navbtns'),proto=Object.getPrototypeOf(nav),motions=[];let reduced=false;
 Object.defineProperty(proto,'nextElementSibling',{get(){const list=this.parentElement?.children||[];return list[list.indexOf(this)+1]||null;},configurable:true});
 nav.querySelectorAll=function(s){return s===':scope > .nbtn[id]'?this.children.filter(x=>x.matches('.nbtn[id]')):proto.querySelectorAll.call(this,s)};
 nav.insertBefore=function(el,next){el.remove();const i=next?this.childNodes.indexOf(next):this.childNodes.length;this.childNodes.splice(i,0,el);el.parentNode=this;return el;};
 proto.cloneNode=function(deep){const el=doc.createElement(this.tagName.toLowerCase());for(const [k,v] of Object.entries(this.attrs))el.setAttribute(k,v);if(deep)el.innerHTML=this.innerHTML;return el;};
 proto.animate=function(frames,options){let resolve,reject;const motion={el:this,frames,options,finished:new Promise((a,b)=>{resolve=a;reject=b}),cancelled:false,cancel(){if(this.cancelled)return;this.cancelled=true;reject(Error('cancelled'));},finish(){resolve();}};motions.push(motion);return motion;};
 for(const b of nav.children)b.getBoundingClientRect=()=>{const i=nav.children.indexOf(b),left=(i%6)*120,top=Math.floor(i/6)*38;return {left,top,width:114,height:32,right:left+114,bottom:top+32}};
 h.ctx.matchMedia=()=>({matches:reduced});h.ctx.HELP_MODE=false;h.ctx.performance={now:()=>0};h.ctx.cancelAnimationFrame=clearTimeout;
 h.ctx.getComputedStyle=()=>({fontSize:'11.5px',fontFamily:'sans-serif',lineHeight:'15.5px',padding:'6px 8px',gap:'5px',borderRadius:'9px',letterSpacing:'0px'});
 run(read('src/js/22-navigation-order.js'));const original=Array.from(run('currentNavOrder()'));
 doc.querySelector('#sourceCatalogBtn').dispatchEvent(new Evt('keydown',{isTrusted:true,altKey:true,key:'End'}));
 assert(motions.some(m=>m.options.duration===180&&m.frames[0].transform!=='translate(0,0)'));
 assert(motions.filter(m=>m.options.duration===180).every(m=>m.frames[1].transform==='translate(0,0)'));
 assert.equal(run('JSON.parse(WorkspaceStore.getItem(NAV_ORDER_KEY)).at(-1)'),'sourceCatalogBtn');
 doc.querySelector('#navLayoutReset').click();assert.deepEqual(Array.from(run('currentNavOrder()')),original);assert(motions.some(m=>m.cancelled));
 function drag(id,pointerId,x,y){const b=doc.querySelector('#'+id),r=b.getBoundingClientRect();b.dispatchEvent(new Evt('pointerdown',{isTrusted:true,button:0,pointerId,clientX:r.left+15,clientY:r.top+15}));doc.fire(new Evt('pointermove',{isTrusted:true,pointerId,clientX:x,clientY:y}),false);run('paintNavArrange()');return b;}
 const b=drag(original[0],1,715,54),g=run('navArrangeGesture');assert.equal(g.ghost.style.fontSize,'11.5px');assert(g.ghost.style.transform.includes('scale(1.025)'));assert(!g.ghost.id);assert.equal(g.ghost.querySelectorAll('[id]').length,0);
 const during=run('currentNavOrder().join("|")');g.x+=2;run('paintNavArrange()');assert.equal(run('currentNavOrder().join("|")'),during,'small movement should not churn slots');
 doc.fire(new Evt('pointerup',{isTrusted:true,pointerId:1,clientX:715,clientY:54}),false);
 const drop=motions.findLast(m=>m.options.duration===160);assert(drop&&drop.frames[1].transform.includes('scale(1)'));assert(b.classList.contains('nav-drag-source'));
 assert.equal(run('JSON.parse(WorkspaceStore.getItem(NAV_ORDER_KEY)).at(-1)'),original[0]);
 // Starting another drag cleans the old drop once, including its rejected
 // finished callback; it must not strip the new source's placeholder class.
 drag(original[0],2,100,15);await Promise.resolve();await Promise.resolve();assert(b.classList.contains('nav-drag-source'));assert(drop.cancelled);
 const saved=run('WorkspaceStore.getItem(NAV_ORDER_KEY)');h.win.fire(new Evt('resize'),false);assert.equal(run('WorkspaceStore.getItem(NAV_ORDER_KEY)'),saved);assert(!b.classList.contains('nav-drag-source'));assert.equal(run('navArrangeGesture'),null);
 // Reduced motion changes order but creates no new animation.
 reduced=true;const count=motions.length;doc.querySelector('#navLayoutReset').click();drag(original[0],3,715,54);doc.fire(new Evt('pointerup',{isTrusted:true,pointerId:3,clientX:715,clientY:54}),false);assert.equal(motions.length,count);assert.equal(doc.querySelectorAll('.nav-drag-ghost').length,0);
 // No Animation API is a supported fallback, rather than a blocked interaction.
 reduced=false;proto.animate=undefined;doc.querySelector('#navLayoutReset').click();drag(original[0],4,715,54);doc.fire(new Evt('pointerup',{isTrusted:true,pointerId:4,clientX:715,clientY:54}),false);assert.equal(run('currentNavOrder().at(-1)'),original[0]);assert.equal(doc.querySelectorAll('.nav-drag-ghost').length,0);
 // Resolve all surviving test motions to prove bookkeeping finishes cleanly.
 for(const m of motions)if(!m.cancelled)m.finish();await Promise.resolve();await Promise.resolve();assert.equal(run('NAV_MOTIONS.size'),0);
 fs.writeFileSync(path.join(root,'reports/navigation-motion-gate-results.json'),JSON.stringify({status:'passed',version:catalog.version,phase:catalog.phase,checks:['keyboard reflow and saved order','reset cancels prior motion','cross-row pointer reflow','stable-slot small-movement buffer','ghost preserves typography and removes duplicate IDs','animated drop into slot','idempotent drop cleanup during new drag','resize cancels without saving','reduce-motion no animations','missing Animation API fallback','finished animation bookkeeping'],reflowMs:180,dropMs:160,browserRun:false,limitation:'Production calls verified with geometry/Animation substitutes, not browser frames or perceived smoothness'},null,2));
 console.log('Navigation motion gate passed: reflow, drop, cancel, reduced-motion and fallback');
}
main().catch(e=>{console.error(e);process.exit(1)});
