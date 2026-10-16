/* v6.0 Foundation runtime: WorkspaceStore / migration / persistence */
const WORKSPACE_STORAGE_KEY='ai_playbook_workspace_v1';
const WORKSPACE_SCHEMA_VERSION=RELEASE_MANIFEST.schemaVersion;
const WorkspaceStore=(()=>{
  const now=()=>new Date().toISOString();
  const defaults=()=>({
    schemaVersion:WORKSPACE_SCHEMA_VERSION,
    preferences:{theme:'nebula',mode:'dark',mobile:'auto',scenes:{},reading:{scale:100},countsVisible:true,navOrder:[]},
    personal:{prompts:[],scratch:{draft:{text:'',updatedAt:'',manualAt:''},archive:[]},favorites:[],recent:[],lifecycle:{version:4,candidates:[],curationRuns:[],releaseDrafts:[],releaseRuns:[],trash:[]}},
    tutorial:{version:RELEASE_MANIFEST.tutorialVersion,lastCompletedVersion:'',completedAt:'',trainingProgress:{},welcome:{status:'',at:''}},
    recovery:{},meta:{createdAt:now(),updatedAt:now(),releaseVersion:RELEASE_MANIFEST.version,migratedFrom:'',workspaceReset:'P71'}
  });
  let state=defaults(), persistent=true, loaded=false, migrated=false, personalBusy=false;
  const database=typeof PlaybookDatabase!=='undefined'&&PlaybookDatabase.available?PlaybookDatabase:null;
  const rawGet=(key)=>{try{return (window.__PB_TRAINING_STORAGE__||window.localStorage).getItem(key);}catch(e){persistent=false;return null;}};
  const rawSet=(key,value)=>{try{(window.__PB_TRAINING_STORAGE__||window.localStorage).setItem(key,String(value));persistent=true;return true;}catch(e){persistent=false;return false;}};
  const rawRemove=(key)=>{try{(window.__PB_TRAINING_STORAGE__||window.localStorage).removeItem(key);return true;}catch(e){persistent=false;return false;}};
  const parse=(value,fallback)=>{try{return value==null?fallback:JSON.parse(value);}catch(e){return fallback;}};
  const obj=(v,fallback={})=>v&&typeof v==='object'&&!Array.isArray(v)?v:fallback;
  const arr=(v)=>Array.isArray(v)?v:[];
  function normalize(candidate){
    const base=defaults(), c=obj(candidate,{}), p=obj(c.preferences,{}), personal=obj(c.personal,{}), scratch=obj(personal.scratch,{}), tutorial=obj(c.tutorial,{}), meta=obj(c.meta,{});
    const schema=Number(c.schemaVersion||1);
    if(schema>WORKSPACE_SCHEMA_VERSION)throw new Error('备份 schemaVersion 高于当前程序，无法安全恢复。');
    return {
      schemaVersion:WORKSPACE_SCHEMA_VERSION,recovery:obj(c.recovery,{}),
      preferences:{
        theme:typeof p.theme==='string'?p.theme:base.preferences.theme,
        mode:typeof p.mode==='string'?p.mode:base.preferences.mode,
        mobile:['on','off','auto'].includes(p.mobile)?p.mobile:base.preferences.mobile,
        scenes:obj(p.scenes,{}),
        reading:obj(p.reading,{scale:100}),
        countsVisible:typeof p.countsVisible==='boolean'?p.countsVisible:true,
        navOrder:arr(p.navOrder).filter(id=>typeof id==='string')
      },
      personal:{
        prompts:arr(personal.prompts),
        scratch:{draft:obj(scratch.draft,{text:'',updatedAt:'',manualAt:''}),archive:arr(scratch.archive)},
        favorites:arr(personal.favorites),recent:arr(personal.recent),lifecycle:obj(personal.lifecycle,{version:4,candidates:[],curationRuns:[],releaseDrafts:[],releaseRuns:[],trash:[]})
      },
      tutorial:{
        version:typeof tutorial.version==='string'?tutorial.version:RELEASE_MANIFEST.tutorialVersion,
        lastCompletedVersion:typeof tutorial.lastCompletedVersion==='string'?tutorial.lastCompletedVersion:'',
        completedAt:typeof tutorial.completedAt==='string'?tutorial.completedAt:'',
        trainingProgress:obj(tutorial.trainingProgress,{}),
        welcome:(()=>{const w=obj(tutorial.welcome,{});return {status:['done','skipped'].includes(w.status)?w.status:'',at:typeof w.at==='string'?w.at:''};})()
      },
      meta:{
        createdAt:typeof meta.createdAt==='string'?meta.createdAt:now(),
        updatedAt:typeof meta.updatedAt==='string'?meta.updatedAt:now(),
        releaseVersion:RELEASE_MANIFEST.version,
        migratedFrom:typeof meta.migratedFrom==='string'?meta.migratedFrom:'',workspaceReset:typeof meta.workspaceReset==='string'?meta.workspaceReset:'P71'
      }
    };
  }
  if(database&&DATABASE_BOOT.workspace){state=normalize(DATABASE_BOOT.workspace);loaded=true;}
  const saved=rawGet(WORKSPACE_STORAGE_KEY);
  if(saved&&!loaded){
    const parsed=parse(saved,null);
    if(!parsed)throw Error('旧工作区 JSON 无法读取，原副本仍保留。请在原版本导出备份后重试。');
    try{state=normalize(parsed);loaded=true;}catch(e){throw Error('旧工作区数据无法安全迁移：'+e.message+' 原副本仍保留，请使用对应版本导出备份。');}
  }
  if(!loaded){
    const legacy={
      theme:rawGet('pb_theme'), mode:rawGet('pb_mode'), mobile:rawGet('pb_mobile'),
      scenes:parse(rawGet('pb_scenes_v4'),{}), prompts:parse(rawGet('pb_user_prompts_v55'),[]),
      draft:parse(rawGet('pb_global_scratch_v1'),null), archive:parse(rawGet('pb_scratch_archive_v1'),[]),
      reading:parse(rawGet('pb_reading_display_v1'),null)
    };
    if(legacy.theme)state.preferences.theme=legacy.theme;
    if(legacy.mode)state.preferences.mode=legacy.mode;
    if(['on','off','auto'].includes(legacy.mobile))state.preferences.mobile=legacy.mobile;
    if(legacy.scenes&&typeof legacy.scenes==='object')state.preferences.scenes=legacy.scenes;
    if(Array.isArray(legacy.prompts))state.personal.prompts=legacy.prompts;
    if(legacy.draft&&typeof legacy.draft==='object')state.personal.scratch.draft=legacy.draft;
    if(Array.isArray(legacy.archive))state.personal.scratch.archive=legacy.archive;
    if(legacy.reading&&typeof legacy.reading==='object')state.preferences.reading=legacy.reading;
    const hadLegacy=Boolean(legacy.theme||legacy.mode||legacy.mobile||Object.keys(legacy.scenes||{}).length||legacy.prompts.length||legacy.draft||legacy.archive.length||legacy.reading);
    if(hadLegacy){state.meta.migratedFrom='v5.x localStorage keys';migrated=true;}
    if(!database)rawSet(WORKSPACE_STORAGE_KEY,JSON.stringify(state));
  }
  function touch(){state.meta.updatedAt=now();state.meta.releaseVersion=RELEASE_MANIFEST.version;state.tutorial.version=RELEASE_MANIFEST.tutorialVersion;}
  const ready=database&&!DATABASE_BOOT.workspace?database.write(state,true).then(()=>{migrated=true;}):Promise.resolve();
  function persistOrThrow(includePrompts=false){
    touch();
    if(database){database.write(state,includePrompts).catch(()=>{persistent=false;});return true;}
    if(!rawSet(WORKSPACE_STORAGE_KEY,JSON.stringify(state)))throw new Error('LOCAL_PERSISTENCE_UNAVAILABLE');return true;
  }
  function setPersonalRecords(records){if(personalBusy)throw Error('正在保存导入数据，请稍后再编辑。');state.personal.prompts=arr(records);return persistOrThrow(true);}
  async function appendPromptsAtomic(batch){
    if(personalBusy)throw Error('正在保存另一批数据，请稍后重试。');
    personalBusy=true;
    try{
      if(database)await database.flush().catch(()=>{});
      const next=[...state.personal.prompts,...batch],candidate={...state,personal:{...state.personal,prompts:next},meta:{...state.meta,updatedAt:now()}};
      if(database)await database.write(candidate,true);
      else if(!rawSet(WORKSPACE_STORAGE_KEY,JSON.stringify(candidate)))throw Error('浏览器存储空间不足或未允许保存。');
      state.personal.prompts=next;state.meta.updatedAt=candidate.meta.updatedAt;persistent=true;return next;
    }finally{personalBusy=false;}
  }
  function getItem(key){
    switch(key){
      case 'pb_theme': return state.preferences.theme||null;
      case 'pb_mode': return state.preferences.mode||null;
      case 'pb_mobile': return state.preferences.mobile||null;
      case 'pb_scenes_v4': return JSON.stringify(state.preferences.scenes||{});
      case 'pb_user_prompts_v55': return JSON.stringify(state.personal.prompts||[]);
      case 'pb_global_scratch_v1': return JSON.stringify(state.personal.scratch.draft||{});
      case 'pb_scratch_archive_v1': return JSON.stringify(state.personal.scratch.archive||[]);
      case 'pb_reading_display_v1': return JSON.stringify(state.preferences.reading||{scale:100});
      case 'pb_nav_order_v1': return JSON.stringify(state.preferences.navOrder||[]);
      case 'pb_count_visibility_v1': return state.preferences.countsVisible?'shown':'hidden';
      case 'pb_favorites_v61': return JSON.stringify(state.personal.favorites||[]);
      case 'pb_recent_v61': return JSON.stringify(state.personal.recent||[]);
      case 'pb_combo_training_v1': return JSON.stringify(state.tutorial.trainingProgress||{});
      default:return rawGet(key);
    }
  }
  function setItem(key,value){
    if(key==='pb_user_prompts_v55')return setPersonalRecords(arr(parse(value,[])));
    switch(key){
      case 'pb_theme': state.preferences.theme=String(value);break;
      case 'pb_mode': state.preferences.mode=String(value);break;
      case 'pb_mobile': state.preferences.mobile=String(value);break;
      case 'pb_scenes_v4': state.preferences.scenes=obj(parse(value,{}),{});break;
      case 'pb_user_prompts_v55': state.personal.prompts=arr(parse(value,[]));break;
      case 'pb_global_scratch_v1': state.personal.scratch.draft=obj(parse(value,{}),{});break;
      case 'pb_scratch_archive_v1': state.personal.scratch.archive=arr(parse(value,[]));break;
      case 'pb_reading_display_v1': state.preferences.reading=obj(parse(value,{scale:100}),{scale:100});break;
      case 'pb_nav_order_v1': state.preferences.navOrder=arr(parse(value,[])).filter(id=>typeof id==='string');break;
      case 'pb_count_visibility_v1': state.preferences.countsVisible=value!=='hidden';break;
      case 'pb_favorites_v61': state.personal.favorites=arr(parse(value,[]));break;
      case 'pb_recent_v61': state.personal.recent=arr(parse(value,[]));break;
      case 'pb_combo_training_v1': state.tutorial.trainingProgress=obj(parse(value,{}),{});break;
      default:if(!rawSet(key,value))throw new Error('LOCAL_PERSISTENCE_UNAVAILABLE');return true;
    }
    return persistOrThrow();
  }
  function removeItem(key){
    if(key==='pb_user_prompts_v55')return setPersonalRecords([]);
    const known=['pb_theme','pb_mode','pb_mobile','pb_scenes_v4','pb_user_prompts_v55','pb_global_scratch_v1','pb_scratch_archive_v1','pb_reading_display_v1','pb_count_visibility_v1','pb_nav_order_v1','pb_favorites_v61','pb_recent_v61','pb_combo_training_v1'];
    if(!known.includes(key)){if(!rawRemove(key))throw new Error('LOCAL_PERSISTENCE_UNAVAILABLE');return true;}
    const fresh=defaults();
    if(key==='pb_theme')state.preferences.theme=fresh.preferences.theme;
    else if(key==='pb_mode')state.preferences.mode=fresh.preferences.mode;
    else if(key==='pb_mobile')state.preferences.mobile=fresh.preferences.mobile;
    else if(key==='pb_scenes_v4')state.preferences.scenes={};
    else if(key==='pb_user_prompts_v55')state.personal.prompts=[];
    else if(key==='pb_global_scratch_v1')state.personal.scratch.draft=fresh.personal.scratch.draft;
    else if(key==='pb_scratch_archive_v1')state.personal.scratch.archive=[];
    else if(key==='pb_reading_display_v1')state.preferences.reading=fresh.preferences.reading;
    else if(key==='pb_nav_order_v1')state.preferences.navOrder=[];
    else if(key==='pb_count_visibility_v1')state.preferences.countsVisible=true;
    else if(key==='pb_favorites_v61')state.personal.favorites=[];
    else if(key==='pb_recent_v61')state.personal.recent=[];
    else if(key==='pb_combo_training_v1')state.tutorial.trainingProgress={};
    return persistOrThrow();
  }
  function markTutorialComplete(){state.tutorial.lastCompletedVersion=RELEASE_MANIFEST.tutorialVersion;state.tutorial.completedAt=now();try{persistOrThrow();}catch(e){}}
  /* P80 (D8): one-shot first-run welcome state. '' shows the card once;
     'done'/'skipped' silence it forever and travel with full backups. */
  function welcome(){return {...(state.tutorial.welcome||{status:'',at:''})};}
  function setWelcome(status){state.tutorial.welcome={status:status==='done'?'done':'skipped',at:now()};try{persistOrThrow();}catch(e){}}
  function snapshot(){return {governance:workspaceGovernanceSnapshot(),schema:'ai-playbook-workspace-backup-v1',schemaVersion:WORKSPACE_SCHEMA_VERSION,release:RELEASE_MANIFEST,exportedAt:now(),workspace:state};}
  async function restore(payload){
    const source=payload&&payload.workspace?payload.workspace:payload,restored=normalize(source);
    if(personalBusy)throw Error('导入正在保存，请完成后再恢复备份。');
    await listWriteTail;
    restored.meta.updatedAt=now();restored.meta.releaseVersion=RELEASE_MANIFEST.version;restored.meta.workspaceReset='P71';
    personalBusy=true;
    try{
      if(database)await database.flush().catch(()=>{});await commitWorkspaceReplacement({available:!!database,workspace:state},restored,payload.governance||workspaceGovernanceSnapshot());
      state=restored;persistent=true;return true;
    }finally{personalBusy=false;}
  }
  let listWriteTail=Promise.resolve();
  function updatePersonalListAtomic(key,update){
    if(!['favorites','recent'].includes(key))return Promise.reject(Error('未知个人列表。'));
    if(personalBusy)return Promise.reject(Error('正在保存个人数据，请稍后重试。'));
    const job=listWriteTail.catch(()=>{}).then(async()=>{
      const before=state.personal[key],next=update([...before]);state.personal[key]=next;touch();
      try{if(database)await database.write(state,false);else if(!rawSet(WORKSPACE_STORAGE_KEY,JSON.stringify(state)))throw Error('浏览器未允许保存。');persistent=true;return next;}
      catch(error){state.personal[key]=before;persistent=false;if(database){try{await database.write(state,false);}catch(e){}}throw error;}
    });listWriteTail=job;return job;
  }
  function health(){return {backend:database?'IndexedDB':'localStorage',pending:database?database.status().pending:0,error:database?database.status().error:'',persistent,migrated,schemaVersion:state.schemaVersion,updatedAt:state.meta.updatedAt,prompts:state.personal.prompts.length,scratchRecords:state.personal.scratch.archive.length,favorites:state.personal.favorites.length,recent:state.personal.recent.length};}
  return {getItem,setItem,removeItem,updatePersonalListAtomic,flush:async()=>{await ready;await listWriteTail;if(database)await database.flush();},markTutorialComplete,welcome,setWelcome,snapshot,restore,health,ready,setPersonalRecords,appendPromptsAtomic,personalRecords:()=>state.personal.prompts,personalWritesBlocked:()=>personalBusy,get persistent(){return persistent;}};
})();

const USER_IMPORT_KEY = 'pb_user_prompts_v55';
function normalizeImportedTemplate(text){return String(text||'').replace(/\{\{\s*([^{}\n]{1,42}?)\s*\}\}/g,'[$1]');}
function importVarsFromTemplate(text){const out=[],seen=new Set();for(const m of normalizeImportedTemplate(text).matchAll(/\[([^\[\]\n]{1,42})\]/g)){const key='['+m[1].trim()+']';if(!seen.has(key)){seen.add(key);out.push([key,'个人导入模板中的变量','否']);}}return out;}
function importedRecordToCard(r){
 const catId=CATS[r.catId]?r.catId:'13', tpl=normalizeImportedTemplate(r.prompt||'');
 return {id:r.id,name:r.title||'未命名个人 Prompt',cat:catId+'-'+CATS[catId][0],catId,sub:'个人导入',task:r.desc||'用户自行导入并保存在当前浏览器的提示词。',fit:'适合保留你已经验证过、希望反复使用的私人 Prompt。',unfit:'未经母模板策展、去重与来源核验；涉及事实、专业判断或高风险任务时仍需自行复核。',vars:importVarsFromTemplate(tpl),tpl,extras:[],output:'按个人 Prompt 原设定输出',example:'打开工作台，填写识别出的变量后复制使用。',tags:Array.isArray(r.tags)?r.tags:['个人导入'],scores:{'实用性':0,'通用性':0,'可复用性':0,'可控性':0,'独特价值':0},overall:0,overallLabel:'个人导入 · 未策展评分',source:'个人导入 · 当前浏览器'+(r.author?' · 署名发布者：'+r.author:''),origin:[r.originalSource,r.sourceSheet?'工作表：'+r.sourceSheet:'',r.sourceRow?'原始行：'+r.sourceRow:'',r.externalId?'来源 ID：'+r.externalId:''].filter(Boolean).join(' · ')||'用户从文件导入或在工作区创建。',status:'个人导入（未进入母模板策展流程）',mergedTo:'—',notes:'本条只属于个人层；若未来要升级为母模板，应重新执行去重、评分、融合、参数化与来源追溯。',srcs:[{f:[r.file||'个人导入',r.sourceSheet,r.sourceRow?'第 '+r.sourceRow+' 行':''].filter(Boolean).join(' · '),n:(r.title||'个人 Prompt')+(r.author?' · 署名发布者：'+r.author:''),t:r.rawPrompt||r.prompt||''}],batch:'个人导入',userImported:true,importedAt:r.importedAt||''};
}
let USER_IMPORT_RECORDS=[];
try{const raw=WorkspaceStore.personalRecords?null:WorkspaceStore.getItem(USER_IMPORT_KEY);const arr=WorkspaceStore.personalRecords?WorkspaceStore.personalRecords():(raw?JSON.parse(raw):[]);if(Array.isArray(arr))USER_IMPORT_RECORDS=arr.filter(x=>x&&x.id&&x.prompt);}catch(e){USER_IMPORT_RECORDS=[];}
USER_IMPORT_RECORDS.map(importedRecordToCard).forEach(c=>DATA.push(c));
const LIB_STATS = {cards:CORE_CARD_COUNT,rawSources:BASE_RAW_SOURCES,departments:0,compression:Number(((1-CORE_CARD_COUNT/BASE_RAW_SOURCES)*100).toFixed(1)),personal:USER_IMPORT_RECORDS.length,total:DATA.length};
const TPL = {}; DATA.forEach(c => TPL[c.id] = c.tpl);
function cnNum(n){const d=['零','壹','贰','叁','肆','伍','陆','柒','捌','玖'];n=Number(n)||0;if(n<10)return d[n];if(n<20)return n===10?'拾':'拾'+d[n-10];if(n<100){const a=Math.floor(n/10),b=n%10;return d[a]+'拾'+(b?d[b]:'');}return String(n);}
const ROMAN = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV','XV','XVI','XVII','XVIII'];
const STATS = {total:0,hi:0,normal:0};
function refreshLibraryStats(){LIB_STATS.personal=DATA.filter(c=>c.userImported).length;LIB_STATS.total=DATA.length;LIB_STATS.departments=new Set(DATA.map(c=>c.catId)).size;STATS.total=DATA.length;STATS.hi=DATA.filter(c=>c.overall>=4.5).length;STATS.normal=DATA.length-STATS.hi;}
refreshLibraryStats();

function guardPersonalWrite(){if(window.__playbookImportSaving||WorkspaceStore.personalWritesBlocked?.()){notifyLocal("正在保存这批提示词，完成后再编辑或恢复备份。");return false;}return true;}
await WorkspaceStore.ready;

