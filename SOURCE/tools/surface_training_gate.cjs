/* Two production realms wired through the actual parent/child protocol.
   Timers are accelerated by the DOM adapter; no manual pass/advance shortcut. */
const fs=require('fs'),path=require('path'),assert=require('assert');
const {make,Evt,catalog,read}=require('./combo_action_gate.cjs');
const root=path.resolve(__dirname,'..'),pause=ms=>new Promise(r=>setTimeout(r,ms));
async function until(test,label){for(let i=0;i<240;i++){if(test())return;await pause(5);}throw Error('Timed out: '+label);}
async function pair(course,mode='guided',mobile=false){
 const c=make(course,mode),p=make(course,mode),commands=[];
 if(mobile){c.ctx.window.innerWidth=390;c.ctx.window.innerHeight=700;c.doc.body.classList.add('m-mode');}
 const frame={postMessage(m){commands.push(m);c.ctx.command=m;c.run('comboChildCommand({source:parent,data:command})');}};
 p.ctx.frame=frame;p.ctx.nonce=c.ctx.window.__PB_TRAINING_CHILD__.nonce;p.ctx.cid=course.id;
 p.run("comboParentSession={course:comboCourse(cid),mode:'"+mode+"',nonce,index:0,proof:new Set(),errors:0,hints:0,singleIndex:0,frame:{contentWindow:frame},awaiting:false,completed:false}");
 c.ctx.parent.postMessage=m=>{c.messages.push(m);p.ctx.incoming=m;p.run('comboParentMessage({source:frame,data:incoming})');};
 const src=read('src/js/24-combo-training.js');p.run(src.slice(src.indexOf(" $('#comboClose').addEventListener"),src.indexOf("\n $('#comboBriefStart').addEventListener")));
 p.doc.querySelector('#comboTrainingOverlay').classList.add('open');await c.run('comboInitChild()');return {c,p,commands};
}
async function main(){
 const completed=[];
 for(const course of catalog.courses){const {c,p,commands}=await pair(course);
  assert.equal(p.doc.querySelector('.combo-practice-column').querySelectorAll('button,input,textarea,select,summary,a').length,0);
  assert(p.doc.querySelector('#comboCopySample').closest('.combo-coach'));
  for(let i=0;i<course.steps.length;i++){
   await until(()=>p.run('comboParentSession.index')===i&&c.run('comboChild.index')===i,course.id+' step '+i);
   const step=course.steps[i],target=c.run('comboTarget(comboChild.course.steps[comboChild.index])');assert(target);
   if(step.type==='input'){target.value=step.value;target.dispatchEvent(new Evt('input',{isTrusted:true}));target.dispatchEvent(new Evt('change',{isTrusted:true}));}
   else if(step.type==='key')target.dispatchEvent(new Evt('keydown',{isTrusted:true,key:step.key}));
   else target.dispatchEvent(new Evt('click',{isTrusted:true}));
   await until(()=>p.run('comboParentSession.proof.has('+i+')'),course.id+' proof '+i);
   /* P81: user-paced — the explanation stays until 下一步 is clicked. */
   /* P81a: the floating note at the control carries the 下一步 button. */
   await until(()=>c.doc&&c.doc.querySelector('#comboNoteNext'),course.id+' note next visible after proof');
   c.doc.querySelector('#comboNoteNext').click();
   if(i<course.steps.length-1)await until(()=>p.run('comboParentSession.index')===i+1,course.id+' next after click '+i);
  }
  await until(()=>p.run('comboParentSession.completed'),course.id+' completion after final next');
  assert.equal(p.run('comboParentSession.proof.size'),course.steps.length);assert.equal(p.run('comboParentSession.errors'),0);
  assert(!p.doc.querySelector('#comboCompletionBanner').hidden);assert(commands.some(x=>x.type==='finish'));assert(c.run('comboChild.completed'));
  assert(!p.doc.querySelector('#comboExpectedInput').classList.contains('combo-attention'));assert(!c.doc.querySelector('#comboTargetSpot'));
  p.doc.querySelector('#comboFinish').click();assert.equal(p.run('comboParentSession'),null);assert(!p.doc.querySelector('#comboTrainingOverlay').classList.contains('open'));
  completed.push(course.id);
 }
 // A half-written sentence and IME composition must not quietly advance.
 const course=catalog.courses.find(c=>c.id==='daily-match'),a=await pair(course),input=a.c.doc.querySelector('#q');
 input.value='会议';input.dispatchEvent(new Evt('input',{isTrusted:true}));await pause(65);assert.equal(a.p.run('comboParentSession.proof.size'),0);
 input.dispatchEvent(new Evt('compositionstart',{isTrusted:true}));input.value='会议纪要';input.dispatchEvent(new Evt('input',{isTrusted:true}));await pause(65);assert.equal(a.p.run('comboParentSession.proof.size'),0);
 input.dispatchEvent(new Evt('compositionend',{isTrusted:true}));await until(()=>a.p.run('comboParentSession.awaiting'),'composition completes and awaits next');await until(()=>a.c.doc.querySelector('#comboNoteNext'),'note next after composition');a.c.doc.querySelector('#comboNoteNext').click();await until(()=>a.p.run('comboParentSession.index')===1,'next button advances after composition');
 assert.equal(a.c.run('NEED_CONTEXT.length'),0,'filling does not implicitly submit matcher');
 a.p.run('closeComboTraining()');
 // Untouched pre-filled fields and synthetic edits cannot earn credit.
 const b=await pair(course);b.c.doc.querySelector('#q').value='会议纪要';b.c.doc.querySelector('#q').dispatchEvent(new Evt('input'));b.c.doc.querySelector('#q').dispatchEvent(new Evt('change'));await pause(65);assert.equal(b.p.run('comboParentSession.proof.size'),0);b.p.run('closeComboTraining()');
 // A genuine but incorrect commit stays put and explains what to fix.
 const bad=await pair(course),field=bad.c.doc.querySelector('#q');field.value='产品';field.dispatchEvent(new Evt('input',{isTrusted:true}));field.dispatchEvent(new Evt('change',{isTrusted:true}));await pause(30);
 assert.equal(bad.p.run('comboParentSession.index'),0);assert.equal(bad.p.run('comboParentSession.proof.size'),0);assert(bad.p.doc.querySelector('#comboPlayStatus').textContent.includes('输入未达到'));bad.p.run('closeComboTraining()');
 // Closing while the verified result is being displayed cancels the advance.
 const stop=await pair(course);stop.c.doc.querySelector('#q').value='会议纪要';stop.c.doc.querySelector('#q').dispatchEvent(new Evt('input',{isTrusted:true}));stop.c.doc.querySelector('#q').dispatchEvent(new Evt('change',{isTrusted:true}));
 await until(()=>stop.p.run('comboParentSession.awaiting'),'pending advance');const before=stop.commands.filter(x=>x.type==='advance').length;
 stop.p.run("comboShowBriefing('daily-match')");await pause(70);assert.equal(stop.commands.filter(x=>x.type==='advance').length,before);assert.equal(stop.p.run('comboParentSession'),null);
 // P80 risk guard: entering organize-restore at its SECOND step silently
 // replays chain indices [0 .. chainMap[1]) — the whole archive/trash/restore
 // path, observe step included — and no replay action earns proof.
 const organize=catalog.courses.find(c=>c.id==='organize-restore'),o=make(organize);o.ctx.window.__PB_TRAINING_CHILD__.startIndex=1;await o.run('comboInitChild()');
 assert(!o.messages.some(m=>m.type==='passed'),'silent replay must not earn proof');
 assert(!o.messages.some(m=>m.type==='error'),JSON.stringify(o.messages.filter(m=>m.type==='error')));
 assert.equal(o.run('comboChild.index'),1);assert.equal(o.run('comboChild.replay'),false);
 // The replayed chain already restored the trashed record: the observe step and
 // the restore click both executed silently inside the prefix.
 assert(o.run('USER_IMPORT_RECORDS.some(x=>x.id==="USR-09-LAB")'),'replay restored the record');
 assert(!o.run('promptTrash().some(x=>x.id==="USR-09-LAB")'),'trash drained by replay');
 const lastTarget=o.run('comboTarget(comboChild.course.steps[1])');assert(lastTarget);lastTarget.dispatchEvent(new Evt('click',{isTrusted:true}));
 for(let w=0;w<240&&!o.messages.some(m=>m.type==='passed');w++)await pause(5);
 assert(o.messages.some(m=>m.type==='passed'),'final action passes after replay');assert.equal(o.run('personalWorkspaceTab'),'prompts');
 // Phone layout uses exactly the same user-paced protocol.
 const phone=await pair(catalog.courses.find(c=>c.id==='search'),'guided',true);const q=phone.c.doc.querySelector('#q');q.value='会议纪要';q.dispatchEvent(new Evt('input',{isTrusted:true}));q.dispatchEvent(new Evt('change',{isTrusted:true}));await until(()=>phone.p.run('comboParentSession.awaiting'),'phone input awaits next');await until(()=>phone.c.doc.querySelector('#comboNoteNext'),'phone note next');phone.c.doc.querySelector('#comboNoteNext').click();await until(()=>phone.p.run('comboParentSession.index')===1,'phone next advances');
 phone.c.run('comboTarget(comboChild.course.steps[1])').dispatchEvent(new Evt('click',{isTrusted:true}));await until(()=>phone.p.run('comboParentSession.awaiting'),'phone final proof awaits');await until(()=>phone.c.doc.querySelector('#comboNoteNext'),'phone final note next');phone.c.doc.querySelector('#comboNoteNext').click();await until(()=>phone.p.run('comboParentSession.completed'),'phone completion');
 fs.writeFileSync(path.join(root,'reports/surface-training-gate-results.json'),JSON.stringify({status:'passed',version:catalog.version,phase:catalog.phase,pairedCourses:completed,actions:catalog.courses.reduce((n,c)=>n+c.steps.length,0),realParentChildProtocol:true,userPacedAdvance:true,readOnlyCoach:true,practiceSideControls:true,checks:['partial text waits','IME composition waits','synthetic edits no credit','incorrect commit stays put','result timer cancels on course change','mid-chain replay builds state silently and earns no proof','replayed trash state completes with real actions','next button advances after each proof','phone user-paced input and completion','explicit finish clears guidance and exits'],browserRun:false,limitation:'DOM adapter executes production event/protocol logic with accelerated timers; not a real-browser visual test'},null,2));
 console.log('Surface training gate passed: paired courses advance via the 下一步 button');
}
main().catch(e=>{console.error(e);process.exit(1)});
