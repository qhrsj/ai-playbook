/* P72: a personal offline workspace, with two concrete auxiliary tasks. */
const LOCAL_WORKSPACE_TABS=new Set(['prompts','favorites','recent','scratch','trash','check','backup']);
let localCheckState={id:'',text:'',result:null},workspaceRestorePreview=null,workspaceRestoreBusy=false,localRestoreReceipt=null,personalEditSaving=false,localWorkspaceLastTab=null;
let workspaceRestoreReadToken=0,workspaceRestoreReading=null,workspaceRestoreReadError='';
function localPromptCheck(text,description=''){
 const body=String(text||'').trim(),vars=importVarsFromTemplate(body).map(x=>x[0]);
 return [
  {name:'有没有正文',found:body?`已有 ${body.length} 个字符。`:'还没有正文。',next:body?'读一遍，确认没有误粘贴。':'先粘贴一条提示词，再检查。',state:body?'seen':'missing'},
  {name:'要让 AI 做什么',found:/(请|帮我|任务|目标|目的|需要|生成|整理|总结|分析|改写|输出)/.test(body)?'正文里能找到任务要求的文字线索。':description?'已填写用途说明，但正文中没有明显的任务要求词句。':'未找到明显的任务要求词句。',next:'在正文开头说清任务，例如“请把会议记录整理成决策和待办”。',state:/(请|帮我|任务|目标|目的|需要|生成|整理|总结|分析|改写|输出)/.test(body)?'seen':'reminder'},
  {name:'每次要换哪些材料',found:vars.length?`发现 ${vars.length} 个可能需要替换的字段：${vars.join('、')}。`:'没有识别到 [变量] 或 {{变量}}。',next:vars.length?'确认这些是待填字段；复制使用前逐一换成真实材料。':'如果每次材料不同，可以用 [材料] 标出需要替换的位置；没有变量也可以使用。',state:vars.length?'reminder':'seen'},
  {name:'希望结果长什么样',found:/(输出|格式|表格|列表|字数|分点|要点|JSON|Markdown|结构)/i.test(body)?'正文里能找到输出形式的文字线索。':'未找到明显的输出形式要求。',next:'有格式要求时写清，例如“按负责人、动作、期限输出表格”；自由回答可以不限制。',state:/(输出|格式|表格|列表|字数|分点|要点|JSON|Markdown|结构)/i.test(body)?'seen':'reminder'},
  {name:'材料不够时怎么办',found:/(不确定|未知|不编造|待确认|无法确认|无依据|缺失|不要猜|不能确定|不要编造)/.test(body)?'正文里能找到处理缺失或不确定信息的文字线索。':'没有找到这类文字线索。',next:'涉及事实时可补一句“材料没提供的信息标为待确认，不要编造”；创意任务按需要决定。',state:/(不确定|未知|不编造|待确认|无法确认|无依据|缺失|不要猜|不能确定|不要编造)/.test(body)?'seen':'reminder'}
 ];
}
function localCheckResultHTML(){return localCheckState.result?`<section class="local-check-results" id="localCheckResults" aria-live="polite"><h3>检查清单 · 逐项看，不打总分</h3><p>“发现线索”只说明文字里出现了相关表达；仍要用真实材料试一次，再判断结果是否好用。</p>${localCheckState.result.map(x=>`<article class="local-check-item"><span class="pw-chip">${x.state==='missing'?'先补正文':x.state==='reminder'?'请确认':'发现线索'}</span><h4>${pwEsc(x.name)}</h4><p>${pwEsc(x.found)}</p><p><b>接下来：</b>${pwEsc(x.next)}</p></article>`).join('')}<div class="w-actions"><button type="button" class="w-btn" data-local-check-edit>回到正文修改</button><button type="button" class="w-btn" data-local-check-copy>复制检查清单</button></div></section>`:'';}
function renderLocalCheck(){
 if(localCheckState.id&&!USER_IMPORT_RECORDS.some(x=>x.id===localCheckState.id))localCheckState.id='';
 const box=$('#personalWorkspaceList');box.innerHTML=`<section class="local-tool-intro"><h2>检查提示词</h2><p><b>什么时候用：</b>一条提示词不好用，或复制前想检查遗漏时。</p><p><b>怎么做：</b>选一条自己的提示词，或粘贴正文 → 点开始检查 → 按清单修改 → 再用真实材料试一次。</p><p><b>会改变什么：</b>这里只给检查线索。修改后点保存，才会更新你的提示词；它不联网，也不替你运行 AI。</p></section><label class="lifecycle-field full"><span>选一条我的提示词（也可以直接粘贴）</span><select id="localCheckSelect"><option value="">直接粘贴正文</option>${USER_IMPORT_RECORDS.map(r=>`<option value="${pwEsc(r.id)}" ${r.id===localCheckState.id?'selected':''}>${pwEsc(r.title)}</option>`).join('')}</select></label><label class="lifecycle-field full"><span>要检查的提示词正文</span><textarea id="localCheckText" placeholder="例如：请根据 [会议记录]，输出决策和待办表格；材料没提供的信息标为待确认，不要编造。">${pwEsc(localCheckState.text)}</textarea></label><div class="w-actions local-tool-actions"><button type="button" class="w-btn primary" data-local-check-run>开始检查</button><button type="button" class="w-btn" data-local-check-save>${localCheckState.id?'保存修改':'保存为我的提示词'}</button></div><p id="localCheckStatus" role="status">${localCheckState.result?'已生成检查清单，请逐项确认。':'正文可以修改；检查和输入都不会自动保存。'}</p>${localCheckResultHTML()}`;
}
function openLocalCheck(id=''){
 const r=USER_IMPORT_RECORDS.find(r=>r.id===id);localCheckState={id:r?.id||'',text:r?.rawPrompt||r?.prompt||'',result:null};openPersonalWorkspace('check');
}
function downloadLocalJSON(payload,name){const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function syncPersonalAssetsFromStore(){
 for(let i=DATA.length-1;i>=0;i--)if(DATA[i].userImported){delete TPL[DATA[i].id];DATA.splice(i,1);}
 USER_IMPORT_RECORDS=WorkspaceStore.personalRecords();USER_IMPORT_RECORDS.forEach(ensureLifecycle);
 for(const r of USER_IMPORT_RECORDS){const c=importedRecordToCard(r);DATA.push(c);TPL[c.id]=c.tpl;}
 const w=WorkspaceStore.snapshot().workspace;GLOBAL_SCRATCH=w.personal.scratch.draft;SCRATCH_ARCHIVE=w.personal.scratch.archive;refreshLibraryStats();renderHome();updateWorkspaceBadge();
}
async function saveLifecycleEditor(){
 if(personalEditSaving||!guardPersonalWrite())return false;
 const id=$('#lifecycleId').value,name=$('#lifecycleName').value.trim(),raw=$('#lifecyclePrompt').value.trim();if(!name||!raw){notifyLocal('名称和提示词正文为必填项。');return false;}
 personalEditSaving=true;const button=document.querySelector('[data-lifecycle-save]');button.disabled=true;
 try{
  await WorkspaceStore.flush();const payload=JSON.parse(JSON.stringify(WorkspaceStore.snapshot())),list=payload.workspace.personal.prompts,tags=$('#lifecycleTags').value.split(/[,，;；]/).map(x=>x.trim()).filter(Boolean),desc=$('#lifecycleDesc').value.trim(),status=$('#lifecycleStatus').value,at=lifecycleNow();
  let record=list.find(x=>x.id===id);
  if(id&&!record)throw Error('这条提示词已经不在当前工作区。');
  if(record){ensureLifecycle(record);record.versions.push(recordSnapshot(record));Object.assign(record,{title:name,rawPrompt:raw,prompt:normalizeImportedTemplate(raw),desc,tags:[...new Set(['个人导入',...tags])],lifecycleStatus:status,updatedAt:at});}
  else{const catId=inferImportCat(name+' '+tags.join(' ')+' '+desc+' '+raw);record={id:uniqueImportId(catId),title:name,catId,tags:[...new Set(['个人导入',...tags])],desc,rawPrompt:raw,prompt:normalizeImportedTemplate(raw),lifecycleStatus:status,createdAt:at,updatedAt:at,importedAt:at,file:'我的提示词编辑器',versions:[]};list.push(record);}
  await WorkspaceStore.restore(payload);syncPersonalAssetsFromStore();closeLifecycleEditor();
  if(personalWorkspaceTab==='check'){localCheckState={id:record.id,text:record.rawPrompt,result:null};}
  renderPersonalWorkspace();notifyLocal(id?'已保存修改，并保留旧版本。':'已创建我的提示词。');return true;
 }catch(e){notifyLocal('保存未完成：'+e.message+' 正文仍在编辑器，请重试。');return false;}
 finally{personalEditSaving=false;button.disabled=false;}
}
async function trashPrompt(id){
 if(!guardPersonalWrite())return false;
 try{await WorkspaceStore.flush();const payload=JSON.parse(JSON.stringify(WorkspaceStore.snapshot())),list=payload.workspace.personal.prompts,index=list.findIndex(x=>x.id===id);if(index<0)return false;const [record]=list.splice(index,1),trash=promptTrash();payload.governance[PROMPT_TRASH_KEY]=JSON.stringify([{...record,trashedAt:lifecycleNow()},...trash.filter(x=>x.id!==id)]);await WorkspaceStore.restore(payload);syncPersonalAssetsFromStore();renderPersonalWorkspace();notifyLocal('已移入回收站，需要时可以恢复。');return true;}
 catch(e){notifyLocal('删除未完成，记录仍保留，请重试。');return false;}
}
async function restoreTrashedPrompt(id){
 if(!guardPersonalWrite())return false;
 try{await WorkspaceStore.flush();const payload=JSON.parse(JSON.stringify(WorkspaceStore.snapshot())),trash=promptTrash(),record=trash.find(x=>x.id===id);if(!record)return false;const copy=JSON.parse(JSON.stringify(record));delete copy.trashedAt;if(payload.workspace.personal.prompts.some(x=>x.id===copy.id))copy.id=uniqueImportId(copy.catId||inferImportCat(copy.title));payload.workspace.personal.prompts.push(copy);payload.governance[PROMPT_TRASH_KEY]=JSON.stringify(trash.filter(x=>x.id!==id));await WorkspaceStore.restore(payload);syncPersonalAssetsFromStore();renderPersonalWorkspace();notifyLocal('已从回收站恢复。');return true;}
 catch(e){notifyLocal('恢复未完成，回收站里的记录仍保留，请重试。');return false;}
}
async function restoreVersion(){
 if(!guardPersonalWrite())return false;
 try{await WorkspaceStore.flush();const payload=JSON.parse(JSON.stringify(WorkspaceStore.snapshot())),record=payload.workspace.personal.prompts.find(x=>x.id===versionInspectId);if(!record)return false;const versions=allVersionsFor(record),selected=versions[versionInspectIndex];if(!selected||versionInspectIndex===versions.length-1)return false;record.versions.push(recordSnapshot(record));Object.assign(record,{title:selected.title||record.title,rawPrompt:selected.rawPrompt||selected.prompt,prompt:normalizeImportedTemplate(selected.rawPrompt||selected.prompt),desc:selected.desc||'',tags:[...(selected.tags||[])],lifecycleStatus:selected.status||'active',updatedAt:lifecycleNow()});await WorkspaceStore.restore(payload);syncPersonalAssetsFromStore();renderPersonalWorkspace();openVersionInspector(record.id);notifyLocal('已恢复这条提示词的旧版本，并保留恢复前的版本。');return true;}
 catch(e){notifyLocal('旧版本恢复未完成，当前内容仍保留，请重试。');return false;}
}
async function toggleArchivePrompt(id){
 if(!guardPersonalWrite())return false;
 try{await WorkspaceStore.flush();const payload=JSON.parse(JSON.stringify(WorkspaceStore.snapshot())),record=payload.workspace.personal.prompts.find(x=>x.id===id);if(!record)return false;record.lifecycleStatus=lifecycleStatus(record)==='archived'?'active':'archived';record.updatedAt=lifecycleNow();await WorkspaceStore.restore(payload);syncPersonalAssetsFromStore();renderPersonalWorkspace();notifyLocal(record.lifecycleStatus==='archived'?'已收起，可在已收起筛选中找回。':'已重新启用。');return true;}
 catch(e){notifyLocal('状态修改未保存，原状态仍保留，请重试。');return false;}
}
function validateWorkspaceBackup(payload){
 const w=payload?.workspace||payload;
 if(!w||!w.personal||!w.preferences||!Number.isInteger(w.schemaVersion)||w.schemaVersion<1)throw Error('不是可识别的工作区备份。请选择完整工作区 JSON。');
 if(w.schemaVersion>RELEASE_MANIFEST.schemaVersion)throw Error('这份备份来自更新的程序，请使用对应版本恢复。');
 for(const k of ['prompts','favorites','recent'])if(w.personal[k]!==undefined&&!Array.isArray(w.personal[k]))throw Error('备份中的个人列表格式不正确。');
 for(const r of w.personal.prompts||[])if(!r||typeof r.id!=='string'||typeof r.prompt!=='string')throw Error('备份中的提示词记录格式不正确。');
 return w;
}
function revealWorkspaceRestore(){
 openPersonalWorkspace('backup');renderPersonalWorkspace();
 requestAnimationFrame(()=>{if(personalWorkspaceTab!=='backup')return;const el=$('#localRestorePreview')||$('#localRestoreFileState');el?.scrollIntoView({block:'nearest',behavior:'instant'});el?.focus({preventScroll:true});});
}
function prepareWorkspaceRestore(payload,name='工作区备份.json'){
 const w=validateWorkspaceBackup(payload);workspaceRestoreReadToken++;workspaceRestorePreview={payload:JSON.parse(JSON.stringify(payload)),name,counts:{prompts:w.personal.prompts?.length||0,favorites:w.personal.favorites?.length||0,recent:w.personal.recent?.length||0,scratch:w.personal.scratch?.archive?.length||0},date:payload.exportedAt||w.meta?.updatedAt||'备份未注明日期'};workspaceRestoreReading=null;workspaceRestoreReadError='';localRestoreReceipt=null;revealWorkspaceRestore();
}
async function restoreWorkspaceBackupFile(file){
 if(!file||!guardPersonalWrite())return;
 const token=++workspaceRestoreReadToken;workspaceRestorePreview=null;localRestoreReceipt=null;workspaceRestoreReadError='';workspaceRestoreReading={name:file.name||'工作区备份.json'};revealWorkspaceRestore();
 try{
  if(file.size>100*1024*1024)throw Error('工作区备份超过 100 MB，已停止读取。');
  const raw=await file.text();if(token!==workspaceRestoreReadToken)return;
  prepareWorkspaceRestore(JSON.parse(raw),file.name||'工作区备份.json');
 }catch(e){if(token!==workspaceRestoreReadToken)return;workspaceRestoreReading=null;workspaceRestorePreview=null;workspaceRestoreReadError='备份未载入：'+e.message;revealWorkspaceRestore();notifyLocal(workspaceRestoreReadError);}
}
function renderLocalBackup(){
 const box=$('#personalWorkspaceList'),health=WorkspaceStore.health(),d=pwData(),p=workspaceRestorePreview,reading=workspaceRestoreReading;
 const names={prompts:'我的提示词',favorites:'收藏',recent:'最近使用',scratch:'随手记'};
 const comparison=p?`<table class="local-restore-counts"><caption>备份内容与当前工作区</caption><thead><tr><th scope="col">内容</th><th scope="col">当前</th><th scope="col">待恢复</th></tr></thead><tbody>${Object.entries(names).map(([key,name])=>`<tr><th scope="row">${name}</th><td>${d[key].length}</td><td>${p.counts[key]}</td></tr>`).join('')}</tbody></table>`:'';
 const preview=p?`<section class="local-restore-preview" id="localRestorePreview" tabindex="-1" role="region" aria-label="恢复前核对"><h3>已载入 · 请核对后恢复</h3><dl class="local-restore-file"><dt>文件</dt><dd>${pwEsc(p.name)}</dd><dt>备份时间</dt><dd>${pwEsc(p.date)}</dd></dl>${comparison}<p><b>确认后会替换当前个人数据、草稿、回收站、显示设置和教程进度。</b>想保留当前内容，先下载完整备份。选文件和取消都不会替换数据。</p><div class="w-actions"><button type="button" class="w-btn primary" data-workspace-restore-confirm ${workspaceRestoreBusy?'disabled':''}>${workspaceRestoreBusy?'正在恢复…':'确认恢复，替换当前工作区'}</button><button type="button" class="w-btn" data-workspace-restore-cancel ${workspaceRestoreBusy?'disabled':''}>取消，不恢复</button></div></section>`:`<section class="local-restore-file-state" id="localRestoreFileState" tabindex="-1" role="status" aria-live="polite"><h3>${reading?'正在读取备份…':workspaceRestoreReadError?'文件未载入':'等待选择备份文件'}</h3><p>${reading?pwEsc(reading.name):workspaceRestoreReadError?pwEsc(workspaceRestoreReadError):'选择完整工作区 JSON 后，文件名、备份时间和记录数量会立即显示在这里。'}</p>${reading?'<button type="button" class="w-btn small" data-workspace-restore-cancel>取消读取</button>':''}</section>`;
 box.innerHTML=`<section class="local-tool-intro"><h2>备份与恢复</h2><p>重要修改或换设备前，下载完整备份；要找回以前的内容，选择完整备份并核对，再确认恢复。</p><p>资料保存在这个浏览器，下载的 JSON 文件需要自己保留。</p></section><p id="localBackupStatus" role="status">${localRestoreReceipt?'已完成恢复，工作区内容已更新。':reading?'正在读取文件，尚未替换当前内容。':p?'文件已载入并刷新；请在恢复区核对内容。':workspaceRestoreReadError?pwEsc(workspaceRestoreReadError):'选择文件只预览，确认恢复才替换工作区。'}</p><div class="local-backup-grid"><section class="local-backup-current"><h3>备份 · 留一份当前副本</h3><div class="pw-stats">${Object.entries(names).map(([key,name])=>`<div class="pw-stat"><b>${d[key].length}</b><span>${name}</span></div>`).join('')}</div><p>完整备份同时包含草稿、回收站、显示设置和教程进度。</p><p role="status">${health.error?'最近保存未完成：'+pwEsc(health.error):health.pending?'正在保存，请等待完成后下载。':health.persistent?'当前浏览器保存可用。':'当前浏览器未允许持久保存，请及时下载备份。'}</p><button type="button" class="w-btn primary" data-workspace-export ${workspaceRestoreBusy?'disabled':''}>下载完整备份</button><section class="local-backup-extra"><h4>只需要提示词正文？</h4><p>用于单独导入和整理，不包含收藏、设置等内容。</p><button type="button" class="w-btn" data-import-export ${workspaceRestoreBusy?'disabled':''}>导出我的提示词</button></section></section><section class="local-backup-restore"><h3>恢复 · 从以前的副本找回</h3><p>选择文件 → 核对内容 → 确认恢复</p><button type="button" class="w-btn" data-workspace-import ${workspaceRestoreBusy?'disabled':''}>${p||reading?'换一份备份文件':'选择备份文件'}</button>${window.__PB_TRAINING_CHILD__?'<section class="local-training-backup"><p>训练文件保存在虚拟文件区，载入后仍走正式的预览与恢复流程。</p><button type="button" class="w-btn" data-training-backup-load>练习：载入刚才的虚拟备份</button></section>':''}${preview}</section></div>${WorkspaceStore.snapshot().workspace.recovery?.workspace?'<section class="local-backup-legacy"><h3>之前保留的恢复副本</h3><p>旧版本归零前的副本仍可导出；恢复它会带回当时的记录。</p><button type="button" class="w-btn small" data-workspace-reset-backup>导出归零前备份</button></section>':''}`;
}
async function confirmWorkspaceRestore(){
 if(!workspaceRestorePreview||workspaceRestoreReading||workspaceRestoreBusy||!guardPersonalWrite())return false;
 const preview=workspaceRestorePreview;workspaceRestoreBusy=true;renderLocalBackup();
 try{
  await WorkspaceStore.restore(preview.payload);localRestoreReceipt={name:preview.name,at:lifecycleNow()};workspaceRestorePreview=null;
  syncPersonalAssetsFromStore();localCheckState={id:'',text:'',result:null};
  if(window.__PB_TRAINING_CHILD__){notifyLocal('练习恢复已完成；只更新隔离练习数据。');}else{notifyLocal('工作区已恢复，正在重新载入…');setTimeout(()=>location.reload(),350);}
  return true;
 }catch(e){notifyLocal('恢复未完成：'+e.message+' 当前资料未被确认替换，请保留备份并重试。');return false;}
 finally{workspaceRestoreBusy=false;if(personalWorkspaceTab==='backup')renderLocalBackup();}
}
function pwRowActions(x){
 const id=pwEsc(x.cardId);
 if(x.kind==='prompts')return `<button type="button" class="w-btn small" data-pw-open="${id}">打开</button><button type="button" class="w-btn small" data-pw-edit="${id}">修改</button><button type="button" class="w-btn small" data-local-check-id="${id}">检查</button><button type="button" class="w-btn small" data-pw-versions="${id}">旧版本</button><details class="pw-more"><summary>更多</summary><div><button type="button" class="w-btn small" data-pw-duplicate="${id}">复制一份</button><button type="button" class="w-btn small" data-pw-archive="${id}">${x.status==='archived'?'重新启用':'收起暂不用的'}</button><button type="button" class="w-btn small" data-pw-trash="${id}">删除到回收站</button></div></details>`;
 if(x.kind==='favorites')return `<button type="button" class="w-btn small" data-pw-favorite-open="${id}">打开</button><button type="button" class="w-btn small" data-pw-favorite-derive="${id}">存成我的版本</button><button type="button" class="w-btn small" data-pw-unfavorite="${id}">删除收藏</button>`;
 if(x.kind==='recent')return `<button type="button" class="w-btn small" data-pw-open="${id}">打开</button><button type="button" class="w-btn small" data-pw-derive="${id}">存成我的版本</button><button type="button" class="w-btn small" data-pw-recent-delete="${id}">删除</button>`;
 if(x.kind==='scratch')return `<button type="button" class="w-btn small" data-pw-copy="${pwEsc(x.key)}">复制</button><button type="button" class="w-btn small" data-pw-delete="${x.scratchIndex}">删除到回收站</button>`;
 const scratch=x.kind==='trash-scratch';return `<button type="button" class="w-btn small" ${scratch?'data-scratch-trash-restore':'data-trash-restore'}="${id}">恢复</button><button type="button" class="w-btn small" ${scratch?'data-scratch-trash-purge':'data-trash-purge'}="${id}">永久删除</button>`;
}
function renderPersonalWorkspace(){
 if(!LOCAL_WORKSPACE_TABS.has(personalWorkspaceTab))personalWorkspaceTab='prompts';
 const d=pwData(),counts=Object.fromEntries(['prompts','favorites','recent','scratch','trash'].map(k=>[k,d[k].length]));
 document.querySelectorAll('[data-pw-count]').forEach(x=>x.textContent=counts[x.dataset.pwCount]||0);
 const stats=$('#personalWorkspaceStats');if(stats)stats.innerHTML='';
 const own=personalWorkspaceTab==='prompts',tool=['check','backup'].includes(personalWorkspaceTab);
 for(const sel of ['#personalWorkspaceStatus','#personalWorkspaceTag','#personalWorkspaceSort'])if($(sel))$(sel).hidden=!own;
 if($('#personalWorkspaceSearch'))$('#personalWorkspaceSearch').closest('.pw-search').hidden=tool;
 const hero=$('#personalWorkspaceOverlay .pw-hero');if(hero)hero.hidden=!own;
 const notice=$('#workspaceResetNotice');if(notice)notice.hidden=true;
 syncWorkspaceNavigation();const box=$('#personalWorkspaceList');if(!box)return;
 if(personalWorkspaceTab==='check'){renderLocalCheck();decorateHelp(box);return;}
 if(personalWorkspaceTab==='backup'){renderLocalBackup();decorateHelp(box);return;}
 if(own)populateTagFilter();let a=[...d[personalWorkspaceTab]];if(own){if(pwStatusFilter==='usable')a=a.filter(x=>x.status!=='archived');else if(pwStatusFilter!=='all')a=a.filter(x=>x.status===pwStatusFilter);if(pwTagFilter!=='all')a=a.filter(x=>(x.tags||[]).includes(pwTagFilter));a=sortPromptAssets(a);}
 const q=personalWorkspaceQuery.trim().toLowerCase();if(q)a=a.filter(x=>`${x.title} ${x.text} ${(x.tags||[]).join(' ')}`.toLowerCase().includes(q));
 const empty={prompts:'点“新建提示词”，或把主页模板存成自己的版本。',favorites:'在主页卡片或提示词广场点“☆ 收藏”，这里就能找到。',recent:'打开模板后会留一条记录；每条都可以删除。',scratch:'点“写随手记”，保存为记录后这里会显示。',trash:'删除的我的提示词和随手记会到这里；可以恢复。'};
 box.innerHTML=a.length?a.map(x=>`<article class="pw-item${x.status==='archived'?' is-archived':''}"><div><h3>${pwEsc(x.title)}</h3><p>${pwEsc((x.text||'').slice(0,300))}${(x.text||'').length>300?'…':''}</p><div class="pw-meta">${x.kind.startsWith('trash-')?`<span class="pw-chip">已删除 · ${x.kind==='trash-scratch'?'随手记':'我的提示词'}</span>`:pwMeta(x)}</div></div><div class="pw-actions">${pwRowActions(x)}</div></article>`).join(''):`<div class="pw-empty"><b>${q?'没有找到匹配内容':'这里还没有内容'}</b>${q?'换个关键词或清除筛选条件试试。':empty[personalWorkspaceTab]}</div>`;
 decorateHelp(box);updateWorkspaceBadge();
}
function syncWorkspaceNavigation(){
 if(!LOCAL_WORKSPACE_TABS.has(personalWorkspaceTab))personalWorkspaceTab='prompts';
 const dialog=$('#personalWorkspaceOverlay .personal-workspace-dialog');if(dialog){dialog.dataset.pwView=personalWorkspaceTab;dialog.dataset.pwSection=['check','backup'].includes(personalWorkspaceTab)?'local-tools':'daily';dialog.querySelectorAll('[data-pw-tab]').forEach(b=>{const on=b.dataset.pwTab===personalWorkspaceTab;b.setAttribute('role','tab');b.setAttribute('aria-controls','personalWorkspaceList');b.classList.toggle('active',on);b.setAttribute('aria-selected',String(on));});}
 if(localWorkspaceLastTab!==personalWorkspaceTab){const body=$('#personalWorkspaceOverlay .pw-body');if(body)body.scrollTop=0;localWorkspaceLastTab=personalWorkspaceTab;}
 const picker=$('#personalWorkspaceTabSelect');if(picker)picker.value=personalWorkspaceTab;
 const guide=HELP_WORKSPACE_TABS[personalWorkspaceTab];if($('#workspaceTabIntro'))$('#workspaceTabIntro').textContent=guide?.[1]||'';if($('#workspaceHelpContext'))$('#workspaceHelpContext').textContent=helpWorkspaceTab(personalWorkspaceTab)?.[1]||'';
}
function toggleWorkspaceHelp(open){const panel=$('#workspaceHelpPanel'),btn=$('#workspaceHelpBtn');if(!panel||!btn)return;panel.hidden=!open;btn.setAttribute('aria-expanded',String(open));if(open){$('#personalWorkspaceOverlay .pw-body').scrollTop=0;panel.querySelector('h2')?.focus();}else btn.focus();}
$('#personalWorkspaceTabSelect')?.addEventListener('change',e=>{personalWorkspaceTab=e.target.value;personalWorkspaceQuery='';$('#personalWorkspaceSearch').value='';renderPersonalWorkspace();});
$('#workspaceHelpBtn')?.addEventListener('click',()=>toggleWorkspaceHelp($('#workspaceHelpPanel')?.hidden));
$('#workspaceHelpPanel')?.addEventListener('click',e=>{if(e.target.closest('[data-pw-help-close]'))toggleWorkspaceHelp(false);});
document.addEventListener('input',e=>{if(e.target.id==='localCheckText'){localCheckState.text=e.target.value;localCheckState.result=null;$('#localCheckResults')?.remove();if($('#localCheckStatus'))$('#localCheckStatus').textContent='正文已修改，请重新检查；修改还没有保存。';}});
document.addEventListener('change',e=>{if(e.target.id==='localCheckSelect'){const r=USER_IMPORT_RECORDS.find(x=>x.id===e.target.value);localCheckState={id:r?.id||'',text:r?.rawPrompt||r?.prompt||'',result:null};renderLocalCheck();}});
document.addEventListener('click',async e=>{
 const inspect=e.target.closest('[data-local-check-id]');if(inspect){openLocalCheck(inspect.dataset.localCheckId);return;}
 if(e.target.closest('[data-personal-import]')){openUtility('#importOverlay');return;}
 if(e.target.closest('[data-local-check-run]')){localCheckState.text=$('#localCheckText').value;const r=USER_IMPORT_RECORDS.find(x=>x.id===localCheckState.id);localCheckState.result=localPromptCheck(localCheckState.text,r?.desc);renderLocalCheck();$('#localCheckResults')?.scrollIntoView({block:'nearest'});return;}
 if(e.target.closest('[data-local-check-edit]')){$('#localCheckText')?.focus();$('#localCheckText')?.scrollIntoView({block:'nearest'});return;}
 if(e.target.closest('[data-local-check-copy]')){if(localCheckState.result)copyText(localCheckState.result.map(x=>`${x.name}\n${x.found}\n接下来：${x.next}`).join('\n\n'),e.target.closest('button'));return;}
 if(e.target.closest('[data-local-check-save]')){const raw=$('#localCheckText').value.trim();if(!raw){notifyLocal('先填写正文。');return;}const r=USER_IMPORT_RECORDS.find(x=>x.id===localCheckState.id);openLifecycleEditor(r?.id||'',r?null:{prompt:raw,title:'',desc:'',tags:[]});$('#lifecyclePrompt').value=raw;return;}
 if(e.target.closest('[data-training-backup-load]')){if(!window.__PB_TRAINING_CHILD__)return;const payload=window.__PB_TRAINING_BACKUP_READ__?.();if(!payload){notifyLocal('先下载一份完整备份到虚拟文件区。');return;}prepareWorkspaceRestore(payload,'训练场虚拟工作区备份.json');return;}
 if(e.target.closest('[data-workspace-restore-cancel]')){if(!workspaceRestoreBusy){workspaceRestoreReadToken++;workspaceRestorePreview=null;workspaceRestoreReading=null;workspaceRestoreReadError='';renderLocalBackup();notifyLocal('已取消，当前内容没有改变。');}return;}
 if(e.target.closest('[data-workspace-restore-confirm]'))await confirmWorkspaceRestore();
});
