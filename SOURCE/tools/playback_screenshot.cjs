const fs=require('fs'),path=require('path'),cp=require('child_process'),os=require('os');
const ROOT=path.resolve(__dirname,'..');
const APP='file:///'+path.join(ROOT,'dist','index.html').replace(/\\/g,'/');
const PORT=9226,BASE='http://127.0.0.1:'+PORT;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let ws,idc=1;const pend=new Map();
function send(method,params={}){const id=idc++;ws.send(JSON.stringify({id,method,params}));return new Promise((res,rej)=>pend.set(id,{res,rej}));}
async function ev(expr){const r=await send('Runtime.evaluate',{expression:expr,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error('eval: '+JSON.stringify(r.exceptionDetails.exception?.description||r.exceptionDetails.text));return r.result.value;}
async function main(){
 const exe=process.env.BROWSER_EXE,tmp=fs.mkdtempSync(path.join(os.tmpdir(),'pbshot-'));
 const child=cp.spawn(exe,[`--remote-debugging-port=${PORT}`,'--headless=new','--disable-gpu','--no-first-run',`--user-data-dir=${tmp}`,'--window-size=1400,900','--hide-scrollbars','about:blank'],{stdio:'ignore'});
 try{
  let targets;for(let i=0;i<40;i++){try{targets=await (await fetch(BASE+'/json/list')).json();if(targets.some(t=>t.type==='page'))break;}catch(e){}await sleep(250);}
  ws=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);
  await new Promise((res,rej)=>{ws.onopen=res;ws.onerror=rej;});
  ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pend.has(m.id)){const p=pend.get(m.id);pend.delete(m.id);m.error?p.rej(Error(m.error.message)):p.res(m.result);}};
  await send('Page.enable');await send('Runtime.enable');
  await send('Page.navigate',{url:APP});
  for(let i=0;i<60;i++){await sleep(500);try{if(await ev(`!!window.AI_PLAYBOOK_COMBO`))break;}catch(e){}}
  await ev(`(function(){window.AI_PLAYBOOK_COMBO.open();document.querySelector('[data-combo-course="daily-fill"]').click();document.getElementById('comboBriefStart').click();})()`);
  await sleep(16000);
  await ev(`(function(){var b=document.getElementById('comboVideoPlay');if(b&&!b.disabled)b.click();})()`);
  await sleep(1200);
  const shot=await send('Page.captureScreenshot',{format:'png'});
  const out=path.join(__dirname,'..','reports','playback-screenshot-p78.png');
  fs.writeFileSync(out,Buffer.from(shot.data,'base64'));
  console.log('screenshot saved:',out,fs.statSync(out).size,'bytes');
  const state=await ev(`JSON.stringify({time:document.getElementById('comboVideoTime').textContent,frame:document.getElementById('comboFrameHost').childElementCount})`);
  console.log('state',state);
 }finally{try{await send('Browser.close')}catch(e){}try{child.kill()}catch(e){}}
}
main().catch(e=>{console.error('SHOT FAIL',e);process.exit(1)});
