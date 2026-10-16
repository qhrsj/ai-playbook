/* P67 · Offline batch import. Parse in a Worker; review before an atomic save. */
let FILE_IMPORT_STAGE=[],FILE_IMPORT_CONTEXTS=[],fileImportToken=0,fileImportPage=1,fileImportContext=0;
let fileImportWorker=null,fileImportJob=null,fileImportJobId=0,FILE_IMPORT_BUSY=false,FILE_IMPORT_COMMITTING=false,fileImportErrors=[];
const FILE_IMPORT_MAX=20*1024*1024,FILE_IMPORT_BATCH_MAX=40*1024*1024,FILE_IMPORT_PAGE_SIZE=15;
const IMPORT_FIELDS={title:'名称',body:'提示词正文（必选）',category:'分类',tags:'标签',author:'署名发布者',source:'出处 / 来源链接',externalId:'来源条目 ID',desc:'说明'};
const IMPORT_ALIASES={title:['名称','标题','提示词名称','name','title'],body:['提示词','正文','提示词正文','完整正文','内容','prompt','rawprompt','content','text','tpl'],category:['分类','类别','catid','category'],tags:['标签','tags','tag'],author:['作者','署名作者','发布者','署名发布者','author','publisher'],source:['来源','出处','链接','来源链接','source','url'],externalId:['条目id','来源id','广场条目id','id'],desc:['说明','描述','description','desc']};
const importYield=()=>new Promise(resolve=>setTimeout(resolve,0));
const importBodyKey=s=>String(s||'').replace(/\r\n?/g,'\n').trim();
function importHeaderKey(s){return String(s||'').toLowerCase().replace(/[\s_：:（）()]/g,'');}
function cancelFileImportWorker(reason='读取已取消。'){
 if(fileImportJob){clearTimeout(fileImportJob.timer);fileImportJob.reject(Error(reason));fileImportJob=null;}
 fileImportWorker?.terminate();fileImportWorker=null;
}
function importWorkerRequest(payload,token){
 if(typeof Worker==='undefined')return Promise.reject(Error('当前浏览器不支持后台文件读取，请使用较新的 Chrome、Edge 或 Firefox。'));
 if(!fileImportWorker){
  const url=URL.createObjectURL(new Blob([XLSX_VENDOR_SOURCE,'\n',IMPORT_WORKER_SOURCE],{type:'text/javascript'}));
  try{fileImportWorker=new Worker(url);}finally{URL.revokeObjectURL(url);}
  fileImportWorker.onmessage=e=>{
   const job=fileImportJob,data=e.data;if(!job||job.id!==data.id)return;
   if(data.progress!=null){if(token===fileImportToken)$('#fileImportProgress').value=data.progress;return;}
   clearTimeout(job.timer);fileImportJob=null;data.error?job.reject(Error(data.error)):job.resolve(data.result);
  };
  fileImportWorker.onerror=()=>{if(fileImportJob){clearTimeout(fileImportJob.timer);fileImportJob.reject(Error('后台读取失败，请检查文件或换用较新的浏览器。'));fileImportJob=null;}fileImportWorker?.terminate();fileImportWorker=null;};
 }
 return new Promise((resolve,reject)=>{
  const id=++fileImportJobId,timer=setTimeout(()=>{if(fileImportJob?.id===id)cancelFileImportWorker('读取超过 45 秒，请分小文件后再试。');},45000);
  fileImportJob={id,resolve,reject,timer};
  try{fileImportWorker.postMessage({...payload,id},payload.buffer?[payload.buffer]:[]);}catch(error){clearTimeout(timer);fileImportJob=null;reject(error);}
 });
}
function newImportContext(file,result,sheet,index){
 const context={file,kind:result.kind,included:index===0,headerRow:0,mapping:{},rows:sheet?.rows||[],sheet:sheet?.name||'',items:result.items||[],text:result.text||'',mode:result.mode||'whole'};
 if(context.kind==='table'){
  let best=-1,header=null;
  for(const row of context.rows.slice(0,10)){
   const score=row.values.reduce((n,v)=>n+Object.values(IMPORT_ALIASES).some(a=>a.includes(importHeaderKey(v))),0);
   if(score>best){best=score;header=row;}
  }
  if(best>=1){context.headerRow=header.sourceRow;for(const [field,aliases] of Object.entries(IMPORT_ALIASES)){const col=header.values.findIndex(v=>aliases.includes(importHeaderKey(v)));if(col>=0)context.mapping[field]=col;}}
 }
 return context;
}
function importContextItems(context){
 if(context.kind!=='table')return context.items.map((item,i)=>({item,sourceRow:item?.sourceRow||i+1}));
 const value=(row,field)=>context.mapping[field]==null?'':String(row.values[context.mapping[field]]??'');
 return context.rows.filter(r=>!context.headerRow||r.sourceRow>context.headerRow).map(row=>({sourceRow:row.sourceRow,item:{title:value(row,'title'),rawPrompt:value(row,'body'),category:value(row,'category'),tags:value(row,'tags'),author:value(row,'author'),originalSource:value(row,'source'),externalId:value(row,'externalId'),desc:value(row,'desc')}}));
}
function validateImportItem(value,context,sourceRow){
 const empty={file:context.kind==='records'&&value?.file||context.file,importFile:context.file,sourceSheet:context.sheet||value?.sourceSheet||'',sourceRow:context.kind==='records'?(Number(value?.sourceRow)||sourceRow):sourceRow};
 if(!value||typeof value!=='object'||Array.isArray(value))return {...empty,title:'第 '+sourceRow+' 条',rawPrompt:'',invalid:'不是可识别的 Prompt 对象。'};
 const raw=[value.rawPrompt,value.prompt,value.tpl,value.content,value.text].find(v=>typeof v==='string'&&v.trim());
 const title=[value.title,value.name].find(v=>typeof v==='string'&&v.trim())||context.file.replace(/\.[^.]+$/,'')+' · '+sourceRow;
 const item={...value,...empty,title:title.trim(),rawPrompt:raw||'',author:String(value.author||value.publisher||''),originalSource:String(value.originalSource||value.source||value.url||''),externalId:String(value.externalId||value.sourceId||(!/^USR-/.test(value.id||'')?value.id||'':'')),invalid:''};
 if(!raw)item.invalid=context.kind==='table'&&context.mapping.body==null?'请先为此工作表选择正文列。':'正文为空，不能导入。';
 return item;
}
async function rebuildFileImportStage(token=fileImportToken){
 FILE_IMPORT_BUSY=true;fileImportPage=1;setFileImportBusy();
 const bodies=new Set(USER_IMPORT_RECORDS.map(r=>importBodyKey(r.rawPrompt||r.prompt))),names=new Set(USER_IMPORT_RECORDS.map(r=>r.title));
 const stage=[];let textBytes=0;
 for(const context of FILE_IMPORT_CONTEXTS.filter(c=>c.included)){
  for(const {item:value,sourceRow} of importContextItems(context)){
   if(token!==fileImportToken)return;
   const item=validateImportItem(value,context,sourceRow),key=importBodyKey(item.rawPrompt);
   textBytes+=item.rawPrompt.length*2;
   if(stage.length>=10000||textBytes>FILE_IMPORT_BATCH_MAX){fileImportErrors.push('本批预览超过 10000 条或 40 MB 文字，请分批上传。');FILE_IMPORT_STAGE=[];FILE_IMPORT_BUSY=false;renderFileImportStage();return;}
   item.duplicate=!item.invalid&&bodies.has(key);item.sameName=!item.invalid&&!item.duplicate&&names.has(item.title);
   item.selected=!item.invalid&&!item.duplicate&&!item.sameName;
   if(!item.invalid){bodies.add(key);names.add(item.title);}stage.push(item);
   if(stage.length%150===0)await importYield();
  }
 }
 if(token!==fileImportToken)return;
 FILE_IMPORT_STAGE=stage;FILE_IMPORT_BUSY=false;renderFileImportStage();
}
function renderFileImportSources(){
 const target=$('#fileImportMapping'),context=FILE_IMPORT_CONTEXTS[fileImportContext];
 if(!context){target.innerHTML='';return;}
 let html=`<div class="import-source-row"><label>文件 / 工作表<select id="fileImportSource">${FILE_IMPORT_CONTEXTS.map((c,i)=>`<option value="${i}" ${i===fileImportContext?'selected':''}>${esc(c.file+(c.sheet?' · '+c.sheet:''))}${c.included?' ✓':''}</option>`).join('')}</select></label><label class="import-check"><input type="checkbox" id="fileImportInclude" ${context.included?'checked':''}>导入这份内容</label></div>`;
 if(context.kind==='table'){
  const cols=Math.max(0,...context.rows.map(r=>r.values.length)),header=context.rows.find(r=>r.sourceRow===context.headerRow);
  html+=`<label class="import-header-row">表头所在原始行（0 = 无表头）<input id="fileImportHeader" type="number" min="0" max="10001" value="${context.headerRow}"></label><div class="import-column-map">`;
  for(const [field,label] of Object.entries(IMPORT_FIELDS))html+=`<label>${label}<select data-import-column="${field}"><option value="">不读取</option>${Array.from({length:cols},(_,i)=>`<option value="${i}" ${context.mapping[field]===i?'selected':''}>第 ${i+1} 列${header?.values[i]?' · '+esc(String(header.values[i]).slice(0,55)):''}</option>`).join('')}</select></label>`;
  html+='</div><p class="utility-note">先核对正文列。只读取选中的列；每行对应一条 Prompt，原始文件、工作表和行号会保留。切换工作表后可分别设置列映射。</p>';
 }else if(context.kind==='text')html+=`<label>文本拆分方式<select id="fileImportTextMode"><option value="whole" ${context.mode==='whole'?'selected':''}>整篇作为一条</option><option value="delimited" ${context.mode==='delimited'?'selected':''}>按单独一行 === PROMPT === 拆分</option><option value="headings" ${context.mode==='headings'?'selected':''}>按 Markdown 一级标题（# ）拆分</option></select></label><p class="utility-note">普通分隔线和代码块不会被当作提示词边界。请通过下方预览核对拆分结果。</p>`;
 target.innerHTML=html;setFileImportBusy();
}
function setFileImportBusy(){
 const busy=FILE_IMPORT_BUSY||FILE_IMPORT_COMMITTING;
 $('#importFile').disabled=FILE_IMPORT_COMMITTING;
 $('#fileImportCancel').hidden=!FILE_IMPORT_BUSY;
 $('#fileImportProgress').hidden=!FILE_IMPORT_BUSY;
 document.querySelectorAll('#fileImportMapping input,#fileImportMapping select,[data-file-import-reset],[data-import-select],[data-import-row],[data-import-full],#fileImportFilter,#fileImportPage').forEach(el=>el.disabled=busy||el.dataset.importRow!=null&&!!FILE_IMPORT_STAGE[Number(el.dataset.importRow)]?.invalid);
 $('[data-file-import-commit]').disabled=busy||!FILE_IMPORT_STAGE.some(r=>r.selected&&!r.invalid);
}
function visibleImportRows(){const filter=$('#fileImportFilter').value;return FILE_IMPORT_STAGE.map((r,i)=>({r,i})).filter(({r})=>filter==='all'||filter==='selected'&&r.selected||filter==='issues'&&(r.invalid||r.duplicate||r.sameName));}
function renderFileImportStage(message=''){
 const selected=FILE_IMPORT_STAGE.filter(r=>r.selected&&!r.invalid).length,invalid=FILE_IMPORT_STAGE.filter(r=>r.invalid).length,duplicate=FILE_IMPORT_STAGE.filter(r=>r.duplicate).length,same=FILE_IMPORT_STAGE.filter(r=>r.sameName).length;
 const visible=visibleImportRows(),pages=Math.max(1,Math.ceil(visible.length/FILE_IMPORT_PAGE_SIZE));fileImportPage=Math.min(Math.max(1,fileImportPage),pages);
 $('#fileImportPreview').innerHTML=visible.length?visible.slice((fileImportPage-1)*15,fileImportPage*15).map(({r,i})=>`<article class="file-import-preview"><div class="import-preview-head"><label class="import-check"><input type="checkbox" data-import-row="${i}" ${r.selected?'checked':''} ${r.invalid?'disabled':''}>${esc(r.title)}</label><span class="import-row-state">${esc(r.invalid|| (r.duplicate?'正文重复 · 默认跳过':r.sameName?'同名不同正文 · 请核对':'可导入'))}</span></div><small>${esc([r.file,r.sourceSheet,'原始第 '+r.sourceRow+' 行',r.author?'署名发布者：'+r.author:'',r.originalSource].filter(Boolean).join(' · '))}</small><pre>${esc(r.rawPrompt.slice(0,320))}${r.rawPrompt.length>320?'…':''}</pre>${r.rawPrompt.length>320?`<button class="w-btn small" data-import-full="${i}">查看完整正文（${r.rawPrompt.length.toLocaleString()} 字符）</button><pre class="import-fulltext" id="importFull-${i}" hidden></pre>`:''}</article>`).join(''):'<p class="file-import-empty">'+(FILE_IMPORT_CONTEXTS.length?'当前没有可预览的条目，请核对工作表、正文列和筛选。':'选择文件后，先核对列映射与拆分方式，再勾选要导入的记录。')+'</p>';
 $('#fileImportStatus').textContent=message||(FILE_IMPORT_STAGE.length?`预览 ${FILE_IMPORT_STAGE.length} 条 · 已勾选 ${selected} · 正文重复 ${duplicate} · 同名 ${same} · 无效 ${invalid}。`:'尚无待导入记录。');
 $('#fileImportErrors').textContent=fileImportErrors.join('\n');$('#fileImportErrors').hidden=!fileImportErrors.length;
 $('#fileImportPage').value=fileImportPage;$('#fileImportPages').textContent='/ '+pages;$('#fileImportPage').max=pages;
 $('[data-import-page="prev"]').disabled=fileImportPage<=1;$('[data-import-page="next"]').disabled=fileImportPage>=pages;
 $('[data-file-import-commit]').textContent=FILE_IMPORT_COMMITTING?'正在保存…':`确认导入 ${selected} 条`;
 setFileImportBusy();
}
async function stagePromptFiles(files){
 if(FILE_IMPORT_COMMITTING)return;
 cancelFileImportWorker();const token=++fileImportToken;FILE_IMPORT_STAGE=[];FILE_IMPORT_CONTEXTS=[];fileImportContext=0;fileImportErrors=[];
 FILE_IMPORT_BUSY=true;renderFileImportSources();renderFileImportStage('正在读取文件…');
 const list=Array.from(files||[]);
 if(list.reduce((sum,f)=>sum+f.size,0)>FILE_IMPORT_BATCH_MAX){fileImportErrors=['本批文件合计超过 40 MB，请分批上传。'];FILE_IMPORT_BUSY=false;renderFileImportStage();return;}
 try{
  for(let index=0;index<list.length;index++){
   const file=list[index];if(token!==fileImportToken)return;
   $('#fileImportStatus').textContent=`正在读取 ${index+1}/${list.length}：${file.name}`;$('#fileImportProgress').value=0;
   if(file.size>FILE_IMPORT_MAX){fileImportErrors.push(file.name+'：超过 20 MB。');continue;}
   try{
    const buffer=await file.arrayBuffer();if(token!==fileImportToken)return;
    const result=await importWorkerRequest({buffer,name:file.name},token);if(token!==fileImportToken)return;
    if(result.kind==='table'){
     let first=true;for(const sheet of result.sheets){const c=newImportContext(file.name,result,sheet,first?0:1);c.included=first&&sheet.rows.length>0;if(c.included)first=false;FILE_IMPORT_CONTEXTS.push(c);}
    }else FILE_IMPORT_CONTEXTS.push(newImportContext(file.name,result,null,0));
   }catch(error){if(token!==fileImportToken)return;fileImportErrors.push(file.name+'：'+(error.message||'读取失败。'));}
  }
  if(token!==fileImportToken)return;fileImportContext=Math.max(0,FILE_IMPORT_CONTEXTS.findIndex(c=>c.included));renderFileImportSources();await rebuildFileImportStage(token);
 }finally{if(token===fileImportToken){FILE_IMPORT_BUSY=false;cancelFileImportWorker();setFileImportBusy();}}
}
function prepareFileImportRecords(items,reserved=new Set([...DATA.map(c=>c.id),...USER_IMPORT_RECORDS.map(r=>r.id)]),startIndex=0){
 const now=new Date().toISOString();
 return items.map((item,index)=>{
  const {invalid,duplicate,sameName,selected,_selectionExplicit,...metadata}=item;
  let tags=Array.isArray(item.tags)?item.tags:String(item.tags||'').split(/[,，;；|]/);tags=tags.filter(x=>typeof x==='string').map(x=>x.trim()).filter(Boolean);
  const desc=typeof item.desc==='string'?item.desc:typeof item.description==='string'?item.description:'';
  const category=String(item.catId||item.category||''),matched=Object.keys(CATS).find(id=>id===category||CATS[id][0]===category);
  const catId=matched||inferImportCat(item.title+' '+tags.join(' ')+' '+desc+' '+item.rawPrompt);
  const base=typeof item.id==='string'&&/^USR-/.test(item.id)?item.id:'USR-'+catId+'-'+Date.now().toString(36).toUpperCase()+'-'+(index+startIndex+1);
  let id=base,n=2;while(reserved.has(id))id=base+'-'+n++;reserved.add(id);
  return {...metadata,id,title:item.title,catId,tags:[...new Set(['个人导入',...tags])],desc,prompt:normalizeImportedTemplate(item.rawPrompt),rawPrompt:item.rawPrompt,file:item.file,
   author:item.author||'',originalSource:item.originalSource||'',externalId:item.externalId||'',sourceSheet:item.sourceSheet||'',sourceRow:Number(item.sourceRow)||1,importFile:item.importFile||item.file,
   importedAt:new Date().toLocaleString('zh-CN',{hour12:false}),createdAt:typeof item.createdAt==='string'?item.createdAt:now,updatedAt:now,
   lifecycleStatus:['active','draft','archived'].includes(item.lifecycleStatus)?item.lifecycleStatus:'active',
   versions:Array.isArray(item.versions)?item.versions.filter(v=>v&&typeof v==='object'&&(typeof v.prompt==='string'||typeof v.rawPrompt==='string')).map(v=>({...v})):[]};
 });
}
function refreshFileImportDuplicates(){
 if(!FILE_IMPORT_STAGE.length||FILE_IMPORT_BUSY||FILE_IMPORT_COMMITTING)return false;
 const bodies=new Set(USER_IMPORT_RECORDS.map(r=>importBodyKey(r.rawPrompt||r.prompt))),names=new Set(USER_IMPORT_RECORDS.map(r=>r.title));let changed=false;
 for(const r of FILE_IMPORT_STAGE){
  if(r.invalid)continue;const key=importBodyKey(r.rawPrompt),duplicate=bodies.has(key),sameName=!duplicate&&names.has(r.title);
  if(duplicate!==r.duplicate||sameName!==r.sameName){changed=true;if(!r._selectionExplicit)r.selected=!duplicate&&!sameName;}
  r.duplicate=duplicate;r.sameName=sameName;bodies.add(key);names.add(r.title);
 }
 if(changed)renderFileImportStage('个人模板库已更新，重复和同名状态已同步。请核对当前勾选后再确认。');return changed;
}
async function commitPromptFiles(){
 if(FILE_IMPORT_BUSY||FILE_IMPORT_COMMITTING)return false;
 if(refreshFileImportDuplicates())return false;
 const items=FILE_IMPORT_STAGE.filter(r=>r.selected&&!r.invalid);if(!items.length)return false;
 FILE_IMPORT_COMMITTING=true;window.__playbookImportSaving=true;renderFileImportStage('正在保存本批提示词，请等待保存完成…');
 try{
  await importYield();const batch=[],cards=[],reserved=new Set([...DATA.map(c=>c.id),...USER_IMPORT_RECORDS.map(r=>r.id)]);
  for(let offset=0;offset<items.length;offset+=100){const part=prepareFileImportRecords(items.slice(offset,offset+100),reserved,offset);batch.push(...part);cards.push(...part.map(importedRecordToCard));await importYield();}
  const next=await WorkspaceStore.appendPromptsAtomic(batch);
  USER_IMPORT_RECORDS=next;DATA.push(...cards);for(const card of cards)TPL[card.id]=card.tpl;
  refreshLibraryStats();renderHome();updateWorkspaceBadge();notifyWindowDataChange('personal');
  FILE_IMPORT_STAGE=[];FILE_IMPORT_CONTEXTS=[];fileImportErrors=[];$('#importFile').value='';renderFileImportSources();
  FILE_IMPORT_COMMITTING=false;renderFileImportStage(`已保存 ${batch.length} 条 Prompt。可在「个人模板」或「我的工作区」查看与编辑。`);notifyLocal(`已导入 ${batch.length} 条个人 Prompt。`);return true;
 }catch(error){FILE_IMPORT_COMMITTING=false;renderFileImportStage('导入未完成：'+(error.message||'保存失败')+'。原有记录保持不变，预览已保留，可重试或导出原有工作区备份。');notifyLocal('导入未保存，请保留原文件并重试。');return false;}
 finally{window.__playbookImportSaving=false;}
}
function resetFileImport(){if(FILE_IMPORT_COMMITTING)return;fileImportToken++;cancelFileImportWorker();FILE_IMPORT_BUSY=false;FILE_IMPORT_STAGE=[];FILE_IMPORT_CONTEXTS=[];fileImportErrors=[];$('#importFile').value='';renderFileImportSources();renderFileImportStage('尚未确认的读取已取消，已有记录保持不变。');}
$('#importFile').addEventListener('change',e=>stagePromptFiles(e.target.files));
document.addEventListener('change',async e=>{
 const el=e.target;if(!el.closest('#importOverlay')||FILE_IMPORT_BUSY||FILE_IMPORT_COMMITTING)return;
 const context=FILE_IMPORT_CONTEXTS[fileImportContext];
 if(el.id==='fileImportSource'){fileImportContext=Number(el.value);renderFileImportSources();return;}
 if(el.id==='fileImportInclude'){context.included=el.checked;renderFileImportSources();await rebuildFileImportStage();return;}
 if(el.id==='fileImportHeader'){context.headerRow=Math.max(0,Number(el.value)||0);renderFileImportSources();await rebuildFileImportStage();return;}
 if(el.dataset.importColumn){const field=el.dataset.importColumn;if(el.value==='')delete context.mapping[field];else context.mapping[field]=Number(el.value);await rebuildFileImportStage();return;}
 if(el.id==='fileImportTextMode'){
  FILE_IMPORT_BUSY=true;setFileImportBusy();const token=fileImportToken;
  try{const result=await importWorkerRequest({operation:'split',text:context.text,mode:el.value,base:context.file.replace(/\.[^.]+$/,'')},token);if(token!==fileImportToken)return;context.mode=el.value;context.items=result.items;await rebuildFileImportStage(token);}
  catch(error){if(token===fileImportToken){FILE_IMPORT_BUSY=false;renderFileImportStage(error.message);}}
  finally{if(token===fileImportToken){FILE_IMPORT_BUSY=false;cancelFileImportWorker();setFileImportBusy();}}return;
 }
 if(el.dataset.importRow!=null){FILE_IMPORT_STAGE[Number(el.dataset.importRow)].selected=el.checked;FILE_IMPORT_STAGE[Number(el.dataset.importRow)]._selectionExplicit=true;renderFileImportStage();}
 if(el.id==='fileImportFilter'){fileImportPage=1;renderFileImportStage();}
 if(el.id==='fileImportPage'){fileImportPage=Number(el.value)||1;renderFileImportStage();}
});
document.addEventListener('keydown',e=>{if(e.target.id==='fileImportPage'&&e.key==='Enter'){fileImportPage=Number(e.target.value)||1;renderFileImportStage();}});
document.addEventListener('click',e=>{
 if(e.target.closest('[data-file-import-commit]')){commitPromptFiles();return;}
 if(e.target.closest('[data-file-import-reset],#fileImportCancel')){resetFileImport();return;}
 if(FILE_IMPORT_BUSY||FILE_IMPORT_COMMITTING)return;
 const page=e.target.closest('[data-import-page]');if(page){fileImportPage+=page.dataset.importPage==='next'?1:-1;renderFileImportStage();}
 const select=e.target.closest('[data-import-select]');if(select){const mode=select.dataset.importSelect;for(const r of FILE_IMPORT_STAGE){r.selected=mode==='eligible'&&!r.invalid&&!r.duplicate&&!r.sameName;r._selectionExplicit=mode==='none';}renderFileImportStage();}
 const full=e.target.closest('[data-import-full]');if(full){const index=Number(full.dataset.importFull),pre=$('#importFull-'+index);pre.hidden=!pre.hidden;if(!pre.hidden)pre.textContent=FILE_IMPORT_STAGE[index].rawPrompt;full.textContent=pre.hidden?'查看完整正文':'收起完整正文';}
});
let lastDatabaseNotice='';
function updateDatabaseStatus(status){
 const backend=WorkspaceStore.health().backend;
 const text=status?.error?'保存遇到问题：'+status.error+'。请保留页面并在工作区导出备份。':status?.pending?'正在保存本地数据，请稍候…':backend==='IndexedDB'?'本地数据库保存已就绪 · 内容只留在当前浏览器。':'兼容保存模式 · 大批内容可能无法保存，请及时备份。';
 for(const id of ['#workspaceStorageStatus','#fileImportStorageStatus']){const el=$(id);if(el){el.textContent=text;el.classList.toggle('storage-error',!!status?.error);}}
 if(status?.error&&status.error!==lastDatabaseNotice)notifyLocal('本地保存失败，请保留页面并在工作区导出备份。');lastDatabaseNotice=status?.error||'';
}
if(typeof PlaybookDatabase!=='undefined')PlaybookDatabase.subscribe(updateDatabaseStatus);else updateDatabaseStatus();
window.addEventListener('beforeunload',e=>{if(FILE_IMPORT_COMMITTING||typeof PlaybookDatabase!=='undefined'&&(PlaybookDatabase.status().pending||PlaybookDatabase.status().error)){e.preventDefault();e.returnValue='';}});
renderFileImportStage();

