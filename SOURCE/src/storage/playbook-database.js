
/* P67: offline persistence, with transactional bulk records and a small core.
   Loaded once before the application's asynchronous boot. */
const PlaybookDatabase=(()=>{
 const NAME='AIPlaybookPersonalWorkspace',VERSION=1,MARKER='ai_playbook_database_migrated_v1';
 let db=null,initialWorkspace=null,tail=Promise.resolve(),pending=0,lastError='',promptError='',coreError='',listeners=[];
 const clone=v=>typeof structuredClone==='function'?structuredClone(v):JSON.parse(JSON.stringify(v));
 function status(){return {available:!!db,pending,error:lastError||promptError||coreError};}
 function signal(){const s=status();for(const f of listeners){try{f(s);}catch(e){}}}
 function subscribe(f){listeners.push(f);f(status());}
 function request(req){return new Promise((resolve,reject)=>{req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||Error('DATABASE_READ_FAILED'));});}
 async function init(){
  if(window.__PB_TRAINING_CHILD__)return {available:false,workspace:null};
  if(!globalThis.indexedDB)return {available:false,workspace:null};
  try{
   db=await new Promise((resolve,reject)=>{
    const req=indexedDB.open(NAME,VERSION);let done=false;
    const timer=setTimeout(()=>{done=true;reject(Error('数据库被其他窗口占用，请关闭同一系统的其他窗口后重试。'));},8000);
    req.onupgradeneeded=()=>{const d=req.result;d.createObjectStore('core');d.createObjectStore('prompts',{keyPath:'id'});};
    req.onsuccess=()=>{if(done){req.result.close();return;}clearTimeout(timer);resolve(req.result);};
    req.onerror=()=>{clearTimeout(timer);reject(req.error||Error('DATABASE_OPEN_FAILED'));};
   });
   db.onversionchange=()=>{db.close();db=null;lastError='本地数据库版本已改变，请重新打开页面。';signal();};
   const tx=db.transaction(['core','prompts'],'readonly');
   const coreRequest=request(tx.objectStore('core').get('workspace')),promptsRequest=request(tx.objectStore('prompts').getAll());
   const [core,prompts]=await Promise.all([coreRequest,promptsRequest]);
   prompts.sort((a,b)=>(a._playbookOrder??0)-(b._playbookOrder??0));for(const r of prompts)delete r._playbookOrder;
   if(core)initialWorkspace={...core,personal:{...core.personal,prompts}};
   signal();return {available:true,workspace:initialWorkspace};
  }catch(error){
   if(db){db.close();db=null;throw error;}
   let migrated=false;try{migrated=localStorage.getItem(MARKER)==='yes';}catch(e){}
   if(migrated)throw Error('暂时无法读取已保存的个人数据。请重新打开页面或恢复最近的工作区备份；数据库不会被覆盖。');
   signal();return {available:false,workspace:null};
  }
 }
 function write(state,includePrompts=false){
  if(!db)return Promise.reject(Error('DATABASE_UNAVAILABLE'));
  // Retry an unsaved personal snapshot on the next interaction. A successful
  // preference-only save must never hide a failed personal-record save.
  includePrompts=includePrompts||!!promptError;
  // Copy before queuing: subsequent edits must not change a transaction's payload.
  const core=clone({...state,personal:{...state.personal,prompts:[]}}),records=includePrompts?clone(state.personal.prompts):null;
  pending++;signal();
  const job=tail.catch(()=>{}).then(()=>new Promise((resolve,reject)=>{
   if(!db){reject(Error('DATABASE_UNAVAILABLE'));return;}
   let tx;try{tx=db.transaction(includePrompts?['core','prompts']:['core'],'readwrite');}catch(e){reject(e);return;}
   tx.oncomplete=()=>resolve(true);tx.onabort=()=>reject(tx.error||Error('DATABASE_TRANSACTION_ABORTED'));
   tx.onerror=()=>{};
   try{
    tx.objectStore('core').put(core,'workspace');
    if(records){
     const store=tx.objectStore('prompts');
     store.clear().onsuccess=()=>{
      let offset=0;
      function putChunk(){
       try{
       const end=Math.min(offset+100,records.length);let last;
       for(;offset<end;offset++)last=store.put({...records[offset],_playbookOrder:offset});
       // Continue inside a request callback so the transaction remains active.
       if(last&&offset<records.length)last.onsuccess=putChunk;
       }catch(e){try{tx.abort();}catch(ignored){}reject(e);}
      }
      putChunk();
     };
    }
   }catch(e){try{tx.abort();}catch(ignored){}reject(e);}
  }));
  tail=job;
  job.then(()=>{pending--;coreError='';if(records)promptError='';try{localStorage.setItem(MARKER,'yes');}catch(e){}signal();},error=>{pending--;if(records)promptError=error?.message||'本地保存失败';else coreError=error?.message||'本地保存失败';signal();});
  return job;
 }
 function flush(){return tail;}
 return {init,write,flush,subscribe,status,get available(){return !!db;}};
})();

