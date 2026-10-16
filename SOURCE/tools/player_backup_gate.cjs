/* P80 integration regression. Production handlers run in the existing DOM
   adapter. This does not claim visual, touch or browser performance acceptance.
   The v6.58 tutorial has no playback mode, so the former video/clock sections
   were replaced by: practice-surface sanity, ':video' progress purge, and a
   guided mid-chain entry into backup-restore through real production actions. */
const assert=require('assert'),fs=require('fs'),path=require('path');
const {make,Evt,catalog,read}=require('./combo_action_gate.cjs');
const root=path.resolve(__dirname,'..'),wait=ms=>new Promise(r=>setTimeout(r,ms));
const report={status:'running',version:catalog.version,phase:catalog.phase,playback:[],checks:[],browserRun:false};
function parentHooks(h){h.run('function helpDescription(){return null}');const src=read('src/js/24-combo-training.js');h.run(src.slice(src.indexOf("\nelse{\n $('#comboClose')")+7,src.lastIndexOf('\n}\nwindow.AI_PLAYBOOK_COMBO')));}
async function main(){
 // The practice surface stays read-only; the retired video controls are gone.
 const p=make(catalog.courses.find(c=>c.id==='backup-export'));parentHooks(p);
 assert.equal(p.doc.querySelector('.combo-practice-column').querySelectorAll('button,input,textarea,select,[role="slider"]').length,0);
 for(const id of ['comboBack','comboFinish','comboHint','comboRestartStep','comboRestartAll'])assert(p.doc.querySelector('#'+id).closest('.combo-coach'),id);
 for(const id of ['comboVideoPlay','comboVideoRestart','comboVideoRetry','comboVideoSpeed','comboDemo','comboDemoPanel','comboObserveNext'])assert(!p.doc.querySelector('#'+id),'retired control must not exist: '+id);
 report.checks.push('all practice controls in right rail','retired video/demo/observe controls removed');
 // ':video' progress keys: read layer ignores them; one purge removes them all.
 p.run("WorkspaceStore.setItem(COMBO_PROGRESS_KEY,JSON.stringify({'backup-export:video':{watched:true,version:'6.57'},'backup-restore:video':{watched:true,version:'6.57'},'backup-export:guided':{revision:1}}))");
 assert.equal(p.run("comboReadProgress()['backup-export:video']"),undefined,'read layer ignores :video keys');
 assert.equal(p.run('comboPurgeVideoProgress()'),true);
 assert.equal(p.run("Object.keys(comboReadProgress()).join(',')"),'backup-export:guided');
 report.checks.push('stale :video keys ignored and purged once');
 // Guided mid-chain entry into backup-restore (startIndex 3): the silent prefix
 // replays export/load/trash/restore-preview prerequisites — observe step
 // local-backup:4 included — then the user confirms the restore with real actions.
 const course=catalog.courses.find(c=>c.id==='backup-restore'),h=make(course);
 h.ctx.window.__PB_TRAINING_CHILD__.startIndex=3;await h.run('comboInitChild()');
 assert(!h.messages.some(m=>m.type==='error'),JSON.stringify(h.messages.filter(m=>m.type==='error')));
 assert(!h.messages.some(m=>m.type==='passed'),'silent replay earns no proof');
 for(let i=3;i<course.steps.length;i++){
  if(i>3)h.run(`comboChildCommand({source:parent,data:{channel:'pb-combo-command',nonce:comboChild.config.nonce,type:'advance',index:${i}}})`);
  const target=h.run(`comboTarget(comboChild.course.steps[${i}])`);assert(target,course.id+' step '+i);
  target.dispatchEvent(new Evt('click',{isTrusted:true}));
  for(let w=0;w<240&&!h.messages.some(m=>m.type==='passed'&&m.index===i);w++)await wait(5);
  assert(h.messages.some(m=>m.type==='passed'&&m.index===i),course.id+' step '+i+' passed');
 }
 assert(h.messages.filter(m=>m.type==='passed').length===2,'only the two real actions earn proof');
 assert(h.run('USER_IMPORT_RECORDS.some(x=>x.id==="USR-09-LAB")')&&!h.run('promptTrash().some(x=>x.id==="USR-09-LAB")'),'restore completed through production handlers');
 assert(h.run('comboDownloads.some(x=>x.json?.workspace)'),'virtual backup file produced during replay');
 report.playback.push({course:course.id,mode:'guided',startIndex:3,replayPrefix:course.chainMap[3],steps:course.steps.length,status:'passed'});
 report.checks.push('guided mid-chain entry replays chain prefix (observe included) with zero proof','restore confirm/cancel flow through production handlers');
 // Desktop already-open route must redraw both same-tab and different-tab data.
 const b=make(catalog.courses.find(c=>c.id==='backup-export'));b.ctx.focusDesktopWindow=()=>{};b.run('const _p61OpenPersonalWorkspace=openPersonalWorkspace;');b.run(read('src/js/19-independent-windows.js').split('\n').find(l=>l.startsWith('openPersonalWorkspace=function')));
 b.run('openPersonalWorkspace("backup")');const before=b.run('JSON.stringify(WorkspaceStore.snapshot().workspace)');b.ctx.payload=JSON.parse(before);b.run('prepareWorkspaceRestore(payload,"first.json")');assert(b.doc.querySelector('#localRestorePreview').textContent.includes('first.json'));b.run('prepareWorkspaceRestore(payload,"second.json")');assert(b.doc.querySelector('#localRestorePreview').textContent.includes('second.json'));assert(!b.doc.querySelector('#localRestorePreview').textContent.includes('first.json'));
 b.run('openPersonalWorkspace("prompts");prepareWorkspaceRestore(payload,"from-other-tab.json")');assert.equal(b.run('personalWorkspaceTab'),'backup');assert(b.doc.querySelector('#localRestorePreview'));
 let resolveA;const aPromise=new Promise(r=>resolveA=r);b.ctx.fileA={name:'A.json',size:1,text:()=>aPromise};const readA=b.run('restoreWorkspaceBackupFile(fileA)');assert(b.doc.querySelector('#localRestoreFileState').textContent.includes('A.json'));
 b.ctx.fileB={name:'B.json',size:1,text:async()=>JSON.stringify(b.ctx.payload)};await b.run('restoreWorkspaceBackupFile(fileB)');assert(b.doc.querySelector('#localRestorePreview').textContent.includes('B.json'));resolveA(JSON.stringify(b.ctx.payload));await readA;assert(b.doc.querySelector('#localRestorePreview').textContent.includes('B.json'));
 let resolveCancel;b.ctx.fileCancel={name:'cancel.json',size:1,text:()=>new Promise(r=>resolveCancel=r)};const readCancel=b.run('restoreWorkspaceBackupFile(fileCancel)');b.doc.querySelector('[data-workspace-restore-cancel]').click();resolveCancel(JSON.stringify(b.ctx.payload));await readCancel;assert(!b.doc.querySelector('#localRestorePreview'));assert.equal(b.run('JSON.stringify(WorkspaceStore.snapshot().workspace)'),before);
 for(const file of [{name:'bad.json',size:1,text:async()=>'{bad'},{name:'future.json',size:1,text:async()=>JSON.stringify({workspace:{schemaVersion:999,personal:{prompts:[]},preferences:{}}})},{name:'oversize.json',size:100*1024*1024+1,text:async()=>{throw Error('should not read')}}]){b.ctx.file=file;await b.run('restoreWorkspaceBackupFile(file)');assert(!b.doc.querySelector('#localRestorePreview'));assert(b.run('workspaceRestoreReadError'));assert.equal(b.run('JSON.stringify(WorkspaceStore.snapshot().workspace)'),before);}
 assert(b.doc.querySelector('#localRestoreFileState').closest('.local-backup-restore'));b.run('prepareWorkspaceRestore(payload,"ready.json")');assert(b.doc.querySelector('#localRestorePreview').closest('.local-backup-restore'));assert(b.doc.querySelector('.local-restore-counts').textContent.includes('当前'));assert(b.doc.querySelector('[data-workspace-restore-confirm]').closest('#localRestorePreview'));
 report.checks.push('already-open backup refresh','different-tab restore routing','reading status immediate','latest file wins out-of-order reads','cancel reading no writes','bad/future/oversize file states','file metadata/counts/confirmation in same restore region');
 report.status='passed';report.limitation='Production handlers in DOM adapters; real browser visuals, touch and device performance were not tested.';fs.writeFileSync(path.join(root,'reports/player-backup-gate-results.json'),JSON.stringify(report,null,2));console.log('P80 player and backup regression passed');
}
main().catch(e=>{console.error(e);process.exitCode=1});
