/* Targeted verification for the 5 map/tutorial fixes (user report 2026-10-15).
   v2: waits for the step indicator on every advance; welcome check runs first
   on a fresh boot before any openMap settles it. */
const fs=require('fs'),path=require('path'),cp=require('child_process'),os=require('os');
const ROOT=path.resolve(__dirname,'..');
const APP='file:///'+path.join(ROOT,'dist','index.html').replace(/\\/g,'/');
const PORT=9229,BASE='http://127.0.0.1:'+PORT;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let ws,idc=1;const pend=new Map();
function send(method,params={}){const id=idc++;ws.send(JSON.stringify({id,method,params}));return new Promise((res,rej)=>pend.set(id,{res,rej}));}
async function ev(expr){const r=await send('Runtime.evaluate',{expression:expr,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error('eval: '+JSON.stringify(r.exceptionDetails.exception?.description||r.exceptionDetails.text));return r.result.value;}
async function waitFor(fn,label,timeout=15000){const t0=Date.now();let last;while(Date.now()-t0<timeout){try{last=await fn();if(last)return last;}catch(e){last=e.message}await sleep(250);}throw Error(label+' timeout: '+last);}
const vis=sel=>`(function(){var el=document.querySelector(${JSON.stringify(sel)});if(!el)return false;var r=el.getBoundingClientRect();if(r.width<2||r.height<2)return false;var hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);if(!hit)return false;return hit===el||el.contains(hit)||hit.contains(el)||hit.id==='tourSpot'||hit.id==='tourTip';})()`;
const stepIdx=async()=>ev(`document.querySelector('#tourTip .tstep').textContent.trim()`);
const report=[];const rec=o=>{report.push(o);console.log(JSON.stringify(o));};
async function startTour(id){await ev(`window.AI_PLAYBOOK_ONBOARDING.openMap()`);await waitFor(()=>ev(`!!document.querySelector('[data-map-tour="${id}"]')`),'map btn '+id);await ev(`document.querySelector('[data-map-tour="${id}"]').click()`);await waitFor(()=>ev(`document.querySelector('#tourTip').style.display==='block'`),'tip '+id,20000);}
async function goStep(n){
 const want=String(n).padStart(2,'0')+' / ';
 try{await ev(`document.querySelector('#tourTip .tnext').click()`);}catch(e){}
 /* Single click, then wait: slow steps (card open + pane switch) take ~600ms;
    clicking again would hit the next step's 完成 button and end the tour. */
 await waitFor(async()=>{const c=await stepIdx().catch(e=>'ERR');if(c.startsWith(want))return true;const m=parseInt(c,10);return !isNaN(m)&&m>=n;},'tour step '+n,9000);
 await sleep(300);
}
async function skip(){await ev(`document.querySelector('#tourTip .tskip').click()`);await sleep(350);}
async function main(){
 const exe=process.env.BROWSER_EXE,tmp=fs.mkdtempSync(path.join(os.tmpdir(),'pbfix3-'));
 const child=cp.spawn(exe,[`--remote-debugging-port=${PORT}`,'--headless=new','--disable-gpu','--no-first-run',`--user-data-dir=${tmp}`,'--window-size=1400,900','--hide-scrollbars','about:blank'],{stdio:'ignore'});
 try{
  let targets;for(let i=0;i<40;i++){try{targets=await (await fetch(BASE+'/json/list')).json();if(targets.some(t=>t.type==='page'))break;}catch(e){}await sleep(250);}
  ws=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);
  await new Promise((res,rej)=>{ws.onopen=res;ws.onerror=rej;});
  ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pend.has(m.id)){const p=pend.get(m.id);pend.delete(m.id);m.error?p.rej(Error(m.error.message)):p.res(m.result);}
   if(m.method==='Runtime.consoleAPICalled'){const text=(m.params.args||[]).map(a=>a.value??a.description??'').join(' ');if(text.includes('[Tutorial]')||text.includes('beforeView'))console.log('  [console]',text.slice(0,160));}};
  await send('Page.enable');await send('Runtime.enable');
  await send('Page.navigate',{url:APP});
  await waitFor(()=>ev(`document.readyState==='complete'&&!!window.AI_PLAYBOOK_ONBOARDING`),'app boot',60000);
  /* welcome retirement: the card element no longer exists anywhere */
  const retired=await ev(`document.querySelector('#welcomeCard')===null&&document.querySelector('#welcomeStart')===null`);
  rec({check:'0 welcome card fully retired (no element)',status:retired?'passed':'failed'});
  /* 3: comboBack returns to the operation map */
  await ev(`window.AI_PLAYBOOK_ONBOARDING.openMap()`);
  await ev(`document.querySelector('[data-map-course="personal-create"]').click()`);
  await waitFor(()=>ev(`document.querySelector('#comboTrainingOverlay').classList.contains('open')`),'practice open',15000);
  await sleep(600);
  await ev(`document.querySelector('#comboBack').click()`);await sleep(500);
  const mapOpen=await ev(`document.querySelector('#tutorialMapOverlay').classList.contains('open')`);
  const comboClosed=await ev(`!document.querySelector('#comboTrainingOverlay').classList.contains('open')`);
  rec({check:'3 comboBack returns to operation map',status:mapOpen&&comboClosed?'passed':'failed',mapOpen,comboClosed});
  /* 1: S0 overview button prominent */
  await ev(`window.AI_PLAYBOOK_ONBOARDING.openMap()`);
  const s0=await ev(`(function(){var b=document.querySelector('.tutorial-map-overview-btn');var r=b.getBoundingClientRect();return {primary:b.classList.contains('primary'),w:Math.round(r.width),h:Math.round(r.height)};})()`);
  rec({check:'1 S0 overview button prominent',status:s0.primary&&s0.w>160&&s0.h>40?'passed':'failed',...s0});
  /* 2: flow chips expose every lesson */
  const chips=await ev(`(function(){var out={};document.querySelectorAll('.tutorial-flow').forEach(f=>{out[f.dataset.flow]=f.querySelectorAll('.tutorial-flow-courses [data-map-course]').length;});return out;})()`);
  const ok2=chips.F1===4&&chips.F2===6&&chips.F3===3&&chips.F4===10;
  rec({check:'2 flow chips expose all lessons',status:ok2?'passed':'failed',chips});
  /* 5a: S1 reaches 复制完整提示词 (9 steps, card opens) */
  await startTour('S1');
  for(let n=2;n<=8;n++)await goStep(n);
  await goStep(9);
  const copyVis=await ev(vis('[data-action="copy"]'));
  const s1last=await ev(`document.querySelector('#tourTip .ttitle').textContent`);
  /* flicker fix: while parked on this step the card modal must stay open and
     the scroll position must be stable — no open/close churn, no re-scroll. */
  const flicker=await ev(`(async function(){var states=[];for(var i=0;i<8;i++){var b=document.querySelector('#backdrop');states.push(b.classList.contains('open')?'open':'closed');states.push(String(Math.round(b.scrollTop)));await new Promise(function(r){setTimeout(r,180)});}var openStates=[...new Set(states.filter(function(s){return s==='open'||s==='closed'}))];var scrollStates=[...new Set(states.filter(function(s){return s!=='open'&&s!=='closed'}))];return {stable:openStates.length===1&&openStates[0]==='open'&&scrollStates.length<=2,openStates:openStates,scrollStates:scrollStates};})()`);
  const shot1=await send('Page.captureScreenshot',{format:'png'});
  fs.writeFileSync(path.join(ROOT,'reports','fix-s1-copy.png'),Buffer.from(shot1.data,'base64'));
  rec({check:'5f S1 step9 no modal flicker (backdrop stable)',status:flicker.stable?'passed':'failed',...flicker});
  let diag=null;
  if(!copyVis){
   const samples=[];
   for(let i=0;i<4;i++){samples.push(await ev(`(function(){var a=document.querySelector('#panel [data-view].active');return {view:a?a.dataset.view:null,paneHidden:(document.querySelector('#panel [data-pane="core-prompt"]')||{hidden:'?'}).hidden};})()`).catch(e=>'ERR '+e.message));await sleep(300);}
   diag=await ev(`(function(){var vb=document.querySelector('#panel [data-view="core-prompt"]');var pane=document.querySelector('#panel [data-pane="core-prompt"]');var act=document.querySelector('#panel [data-view].active');return {vb:!!vb,pane:!!pane,paneHidden:pane?pane.hidden:null,wsTheme:document.querySelector('#panel').dataset.wsTheme,activeView:act?act.dataset.view:null,backdropOpen:document.querySelector('#backdrop').classList.contains('open')};})()`);
   diag.samples=samples;
  }
  rec({check:'5a S1 reaches 复制完整提示词 (card opens, 03 pane)',status:copyVis&&/复制/.test(s1last)?'passed':'failed',lastTitle:s1last.trim(),copyVisible:copyVis,diag});
  await skip();
  /* 5b: S2 covers 收藏 → 工作区 → 收藏页 */
  await startTour('S2');
  await goStep(2);await sleep(300);
  const s2btn=await ev(vis('#personalWorkspaceBtn'));
  await goStep(3);await sleep(500);
  const s2ws=await ev(`document.querySelector('#personalWorkspaceOverlay').classList.contains('open')`);
  const s2vis=await ev(vis('[data-pw-tab="favorites"]'));
  rec({check:'5b S2 covers 工作区+收藏页 (visible)',status:s2btn&&s2ws&&s2vis?'passed':'failed',workspaceBtn:s2btn,workspaceOpen:s2ws,favoritesVisible:s2vis});
  await skip();
  /* 5c: S3 covers 新建 → 旧版本(空列表跳过) → 检查 */
  await startTour('S3');
  await goStep(2);await sleep(300);
  const s3create=await ev(vis('[data-pw-create]'));
  await goStep(4);await sleep(400);
  const s3check=await ev(vis('[data-pw-tab="check"]'));
  rec({check:'5c S3 covers 新建 (visible) and lands on 检查 (versions skipped on empty list)',status:s3create&&s3check?'passed':'failed',createVisible:s3create,checkVisible:s3check});
  await skip();
  /* 5d/5e: S4 检查 → 备份 → 下载 → 回收站 */
  await startTour('S4');
  await goStep(2);await sleep(300);
  const backupTab=await ev(vis('[data-pw-tab="backup"]'));
  await goStep(3);await sleep(400);
  const dlVis=await ev(vis('[data-workspace-export]'));
  const shot2=await send('Page.captureScreenshot',{format:'png'});
  fs.writeFileSync(path.join(ROOT,'reports','fix-s4-download.png'),Buffer.from(shot2.data,'base64'));
  rec({check:'5d S4 备份tab可见且切面板后下载按钮可见',status:backupTab&&dlVis?'passed':'failed',backupTabVisible:backupTab,downloadVisible:dlVis});
  await goStep(4);await sleep(400);
  const trashVis=await ev(vis('[data-pw-tab="trash"]'));
  rec({check:'5e S4 回收站 visible',status:trashVis?'passed':'failed',highlightVisible:trashVis});
  await skip();
  const shot=await send('Page.captureScreenshot',{format:'png'});
  fs.writeFileSync(path.join(ROOT,'reports','map-fix2-p80.png'),Buffer.from(shot.data,'base64'));
  fs.writeFileSync(path.join(ROOT,'reports','map-fix2-results.json'),JSON.stringify({generatedAt:new Date().toISOString(),version:'6.58',phase:'P80',results:report},null,2)+'\n');
  if(report.some(x=>x.status!=='passed'))throw Error('VERIFY failures: '+JSON.stringify(report.filter(x=>x.status!=='passed')));
  console.log('ALL 5 FIXES VERIFIED');
 }finally{try{await send('Browser.close')}catch(e){}try{child.kill()}catch(e){}}
}
main().catch(e=>{console.error('VERIFY FAIL',e.message);process.exit(1)});
