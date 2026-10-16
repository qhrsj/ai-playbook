/* P69: atomic actions use the real app inside a scripts-only sandbox.
   The parent never supplies private workspace data. Since P80 the tutorial is
   practice-only (guided/single/solo); observation content moved to the scene
   tours and the former video/demo playback protocol was removed entirely. */
const COMBO_CATALOG=@@COMBO_CATALOG@@;
const COMBO_PROGRESS_KEY='pb_combo_training_v1';
const comboClone=v=>JSON.parse(JSON.stringify(v));
const comboEsc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function comboAvailableCourses(){return COMBO_CATALOG.courses.filter(c=>c.id&&c.title&&c.group&&Array.isArray(c.steps)&&c.steps.length);}
function comboCourse(id){const courses=comboAvailableCourses();return courses.find(c=>c.id===id)||courses[0];}
function comboIndex(value,max){const n=Number(value);return Math.max(0,Math.min(Number.isFinite(n)?Math.trunc(n):0,Math.max(0,max)));}
function comboMemory(seed={}){
 const values=new Map(Object.entries(seed));return {getItem:k=>values.has(String(k))?values.get(String(k)):null,setItem:(k,v)=>values.set(String(k),String(v)),removeItem:k=>values.delete(String(k)),clear:()=>values.clear(),key:i=>[...values.keys()][i]??null,get length(){return values.size}};
}
function comboFixtureSeed(course,theme='nebula',mode='dark',display={}){
 const at='2026-10-12T12:00:00.000Z',prompt=COMBO_CATALOG.prompt;
 const personal={id:'USR-09-LAB',title:'练习素材 · 会议复盘方法',prompt,rawPrompt:prompt,desc:'将会议记录转换为决定、待确认问题和有依据的行动责任',tags:['会议','复盘'],file:'训练专用虚构会议记录.md',originalSource:'隔离训练样例',catId:'09',lifecycleStatus:'active',createdAt:at,updatedAt:at,versions:[{title:'练习旧稿',prompt:prompt+'\n旧版输出约束',rawPrompt:prompt+'\n旧版输出约束',desc:'会议复盘练习方法',tags:['会议'],status:'active',savedAt:at}]};
 const hasPersonal=course.fixture!=='empty';
 const workspace={schemaVersion:RELEASE_MANIFEST.schemaVersion,preferences:{theme:ACTIVE_THEME_IDS.includes(theme)?theme:'nebula',mode:mode==='light'?'light':'dark',mobile:['auto','on','off'].includes(display.mobile)?display.mobile:'auto',scenes:display.sceneId?{[theme]:display.sceneId}:{},reading:{scale:100},countsVisible:true,navOrder:[]},personal:{prompts:hasPersonal?[personal]:[],scratch:{draft:{text:'',updatedAt:'',manualAt:''},archive:[]},favorites:[],recent:[],lifecycle:{version:4,candidates:[],curationRuns:[],releaseDrafts:[],releaseRuns:[],trash:[]}},tutorial:{version:RELEASE_MANIFEST.tutorialVersion,lastCompletedVersion:'',completedAt:'',trainingProgress:{}},meta:{createdAt:at,updatedAt:at,releaseVersion:RELEASE_MANIFEST.version,migratedFrom:'隔离训练场'}};
 return {ai_playbook_workspace_v1:JSON.stringify(workspace)};
}

function comboFrameHtml(course,config){
 const source=window.__PB_TEMPLATE_SOURCE__;if(!source)throw Error('原始界面尚未准备完成，请重开页面。');
 const setup={...config,courseId:course.id,seed:comboFixtureSeed(course,APP_STATE.theme,APP_STATE.mode,{sceneId:currentScene().id,mobile:APP_STATE.mobile})};
 const wire=JSON.stringify(setup).replace(/</g,'\\u003c');
 const js='window.__PB_TRAINING_CHILD__='+wire+';window.__PB_TRAINING_STORAGE__=('+comboMemory.toString()+')(window.__PB_TRAINING_CHILD__.seed);';
 const csp="<meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'none'; script-src 'unsafe-inline' blob:; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; worker-src blob:; connect-src 'none'; form-action 'none'\">";
 return '<!doctype html>'+source.replace('<head>','<head>'+csp+'<script>'+js+'<'+'/script>');
}

let comboParentSession=null,comboLastFocus=null,comboBriefingChoice=null;
function comboReadProgress(){try{const p=JSON.parse(WorkspaceStore.getItem(COMBO_PROGRESS_KEY)||'{}');if(!p||typeof p!=='object'||Array.isArray(p))return{};/* P80: stale ':video' watch keys are ignored at the read layer too. */for(const k of Object.keys(p))if(k.endsWith(':video'))delete p[k];return p;}catch(e){return {};}}
/* P80: one-shot cleanup of the retired watch-progress keys (called once by the onboarding boot). */
function comboPurgeVideoProgress(){
 let p;try{p=JSON.parse(WorkspaceStore.getItem(COMBO_PROGRESS_KEY)||'{}');}catch(e){return false;}
 if(!p||typeof p!=='object'||Array.isArray(p))return false;
 const keys=Object.keys(p).filter(k=>k.endsWith(':video'));if(!keys.length)return false;
 for(const k of keys)delete p[k];
 try{WorkspaceStore.setItem(COMBO_PROGRESS_KEY,JSON.stringify(p));return true;}catch(e){return false;}
}
function comboWriteProgress(course,mode,proof,errors,hints,singleIndex){
 const full=course.steps.every((s,i)=>proof.has(i));if(mode==='single'?!proof.has(singleIndex):!full)return false;
 const p=comboReadProgress(),key=mode==='single'?course.id+':single:'+singleIndex:course.id+':'+mode;
 p[key]={version:RELEASE_MANIFEST.version,revision:course.revision,mode,at:new Date().toISOString(),actions:mode==='single'?1:proof.size,errors,hints,independent:mode==='solo'&&hints===0};
 try{WorkspaceStore.setItem(COMBO_PROGRESS_KEY,JSON.stringify(p));return true;}catch(e){$('#comboFeedback').textContent='操作已完成，但本次进度未能保存。你仍可重新练习。';return false;}
}
function comboRenderMenu(){
 const p=comboReadProgress(),host=$('#comboCourseMenu');if(!host)return;
 const courses=comboAvailableCourses(),groups=[...new Set(courses.map(c=>c.group))];
 host.innerHTML=groups.map(group=>`<section class="combo-course-group"><h3>${comboEsc(group)}</h3><div class="combo-course-grid">${courses.filter(c=>c.group===group).map(c=>{const done=p[c.id+':guided']?.revision===c.revision||p[c.id+':solo']?.revision===c.revision;return `<button type="button" class="combo-course" data-combo-course="${comboEsc(c.id)}"><span class="combo-course-kind">${done?'✓ 已练过':'练习课'} · ${c.steps.length} 个环节</span><b>${comboEsc(c.title)}</b><span>${comboEsc(c.goal||c.overview?.result)}</span><em>先看章节说明 →</em></button>`}).join('')}</div></section>`).join('')||'<p class="combo-empty" role="status">本版本暂无可用练习模块。</p>';
 $('#comboCourseSelect').innerHTML=courses.map(c=>`<option value="${comboEsc(c.id)}">${comboEsc(c.title)}</option>`).join('');$('#comboCourseSelect').disabled=!courses.length;$('#comboBegin').disabled=!courses.length;comboUpdateSinglePicker();
}
function comboUpdateSinglePicker(){const c=comboCourse($('#comboCourseSelect').value),select=$('#comboSingleSelect');select.innerHTML=(c?.steps||[]).map((s,i)=>`<option value="${i}">${i+1}. ${comboEsc(s.instruction)}</option>`).join('');select.disabled=!c;select.hidden=true;}
function comboViewportFit(){const view=$('#comboTrainingOverlay .combo-training-view');if(!view)return;view.style.setProperty('--combo-available-height',(window.visualViewport?.height||window.innerHeight)+'px');comboViewLayout();}
function comboViewLayout(){const view=$('#comboTrainingOverlay .combo-training-view');if(!view||!view.getClientRects().length)return;const rect=view.getBoundingClientRect();view.dataset.comboCompact=String(rect.width<=900);view.dataset.comboShort=String(rect.height<520);view.style.setProperty('--combo-coach-cap',Math.max(80,Math.min(255,Math.floor(rect.height*.28)))+'px');}
function comboCoachReveal(id){requestAnimationFrame(()=>{const el=$('#'+id);if(el&&!el.hidden)el.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});});}

function openComboTraining(){
 if(window.__PB_TRAINING_CHILD__)return;
 comboLastFocus=document.activeElement;$('#comboTrainingOverlay').classList.add('open');$('#comboTrainingOverlay').setAttribute('aria-hidden','false');$('#comboMenuSection').hidden=false;$('#comboSessionSection').hidden=true;$('#comboBriefingSection').hidden=true;comboRenderMenu();syncBodyLock();comboViewportFit();
 const view=$('#comboTrainingOverlay .combo-training-view');if(typeof ensureAdjustable==='function')ensureAdjustable(view);
 if(typeof adjustableDesktop==='function'&&adjustableDesktop()&&!view.classList.contains('window-maximized'))toggleWindowMaximize(view);
 requestAnimationFrame(()=>$('#comboCourseSelect').focus({preventScroll:true}));
}
/* P80: layer-3 entry used by the operation map and the welcome card. Closes the
   layer-1 surfaces first, then opens the tutorial overlay (same preamble as
   openComboTraining — the sandbox must be laid out at full desktop size before
   the child boots) and shows the standard briefing (mode defaults to guided). */
function comboOpenCourse(courseId,mode='guided'){
 if(window.__PB_TRAINING_CHILD__)return;
 try{window.AI_PLAYBOOK_ONBOARDING?.closeMap?.();}catch(e){}
 if(!$('#comboTrainingOverlay').classList.contains('open')){
  comboLastFocus=document.activeElement;$('#comboTrainingOverlay').classList.add('open');$('#comboTrainingOverlay').setAttribute('aria-hidden','false');syncBodyLock();comboViewportFit();
  const view=$('#comboTrainingOverlay .combo-training-view');if(typeof ensureAdjustable==='function')ensureAdjustable(view);
  if(typeof adjustableDesktop==='function'&&adjustableDesktop()&&!view.classList.contains('window-maximized'))toggleWindowMaximize(view);
 }
 comboShowBriefing(courseId,['guided','single','solo'].includes(mode)?mode:'guided',0);
}
function comboClearRight(){for(const id of ['comboExpectedInput','comboInputMaterial','comboCopySample'])$('#'+id)?.classList.remove('combo-attention');$('#comboMaterialNote').hidden=true;}
function comboPlayStatus(text){$('#comboPlayStatus').textContent=text;$('#comboFeedback').textContent=text;}
function comboDestroyFrames(){
 if(comboParentSession)clearTimeout(comboParentSession.advanceTimer);comboParentSession=null;
 $('#comboFrameHost').replaceChildren();comboClearRight();$('#comboCompletionBanner').hidden=true;$('#comboFrameNote').hidden=true;$('#comboSessionSection').classList.remove('combo-completed');
}
function closeComboTraining(){comboDestroyFrames();$('#comboTrainingOverlay').classList.remove('open');$('#comboTrainingOverlay').setAttribute('aria-hidden','true');syncBodyLock();if(comboLastFocus?.isConnected)comboLastFocus.focus({preventScroll:true});}
function comboShowBriefing(courseId,mode='guided',startIndex=0){
 comboDestroyFrames();const course=comboCourse(courseId);mode=['guided','single','solo'].includes(mode)?mode:'guided';comboBriefingChoice={courseId:course.id,mode,startIndex:mode==='solo'?0:comboIndex(startIndex,course.steps.length-1)};
 $('#comboMenuSection').hidden=true;$('#comboSessionSection').hidden=true;$('#comboBriefingSection').hidden=false;$('#comboBriefTitle').textContent=course.title;
 for(const [key,id] of Object.entries({purpose:'Purpose',when:'When',result:'Result',prerequisites:'Prerequisites',mechanism:'Mechanism',boundary:'Boundary'}))$('#comboBrief'+id).textContent=course.overview[key];
 const comboBriefHook=$('#comboBriefHook');if(comboBriefHook)comboBriefHook.textContent=course.hook||course.goal;
 $('#comboBriefMode').textContent=`${mode==='guided'?'拆招带练':mode==='single'?'单环节专练':'独立挑战'} · ${course.steps.length} 个环节${mode==='single'?'；前置环节会自动静默准备，不计完成。':''}`;
 requestAnimationFrame(()=>$('#comboBriefStart').focus({preventScroll:true}));
}
function comboToken(){return globalThis.crypto?.randomUUID?.()||String(Date.now())+'-'+Math.random().toString(36).slice(2);}
function comboMakeFrame(course,config,host){const frame=document.createElement('iframe');frame.title='操作训练 · 独立练习数据';/* P78: allow-forms is required so requestSubmit fires submit events inside the sandbox; CSP form-action 'none' still blocks any real navigation. */frame.setAttribute('sandbox','allow-scripts allow-forms');frame.setAttribute('referrerpolicy','no-referrer');frame.srcdoc=comboFrameHtml(course,config);host.replaceChildren(frame);return frame;}
function comboStart(courseId,mode='guided',startIndex=0,prior=null){
 comboDestroyFrames();const course=comboCourse(courseId);mode=['guided','single','solo'].includes(mode)?mode:'guided';startIndex=mode==='solo'?0:comboIndex(startIndex,course.steps.length-1);
 const nonce=comboToken(),proof=prior?.proof||new Set();comboParentSession={course,mode,nonce,index:startIndex,proof,errors:prior?.errors||0,hints:prior?.hints||0,singleIndex:startIndex,awaiting:false,advanceTimer:0,completed:false,failed:false};
 $('#comboMenuSection').hidden=true;$('#comboBriefingSection').hidden=true;$('#comboSessionSection').hidden=false;$('#comboCourseName').textContent=course.title;$('#comboProgressText').textContent='正在准备独立练习界面…';$('#comboFeedback').textContent=startIndex?'正在自动准备本环节的前置条件；这些操作不计亲手完成。':'训练使用虚构数据，退出后不会改动原工作区。';$('#comboRestartStep').hidden=mode==='solo';
 try{comboParentSession.frame=comboMakeFrame(course,{nonce,mode,startIndex},$('#comboFrameHost'));}catch(e){$('#comboFeedback').textContent=e.message;}
}
function comboCoachStep(step,index){
 const s=comboParentSession;if(!s||s.completed)return;clearTimeout(s.advanceTimer);s.index=index;s.awaiting=false;comboClearRight();$('#comboFrameNote').hidden=true;
 $('#comboProgressText').textContent=`${s.mode==='single'?'单环节':s.mode==='solo'?'独立挑战':'拆招带练'} · ${index+1} / ${s.course.steps.length}`;
 const hiddenHint=s.mode==='solo'&&!s.showHint;
 $('#comboInstruction').textContent=hiddenHint?s.course.goal:step.instruction;$('#comboWhy').textContent=hiddenHint?'在练习区按已经练过的流程操作；系统核对真实结果后，点「下一步」继续。':step.why;
 $('#comboExpectedInput').hidden=hiddenHint||step.type!=='input'||step.inputKind==='select';$('#comboInputMaterial').value=step.value??'';$('#comboCopySample').hidden=hiddenHint||step.type!=='input'||step.inputKind==='select'||!step.value;
 $('#comboHint').hidden=!(s.mode==='solo'||s.mode==='guided');
 comboPlayStatus(hiddenHint?'按已经练过的流程操作；需要时在练习工具中请求提示。':step.type==='input'?(step.inputKind==='select'?'在高亮下拉框选择指定选项，生效后点「下一步」继续。':'从练习区复制材料并填写；输入完整、停止输入或离开字段后自动核对，点「下一步」继续。'):'只需操作高亮控件；成功后读完说明，点「下一步」继续。');
 if(step.type==='input'&&step.inputKind!=='select'&&!hiddenHint){$('#comboExpectedInput').classList.add('combo-attention');if(step.value)$('#comboCopySample').classList.add('combo-attention');$('#comboMaterialNote').hidden=false;$('#comboMaterialNote').textContent=step.value?'复制示例后亲手填入高亮字段。需要读原文可展开材料；不会自动替你填写。':'本步清空高亮字段，无需复制。删除完成后会自动核对。';}
 $('#comboActionStrip').innerHTML=s.course.steps.map((x,i)=>`<span class="${s.proof.has(i)?'passed':i===index?'current':''}" title="${comboEsc(x.instruction)}">${i+1}</span>`).join('');
}
function comboSend(command){const s=comboParentSession;if(s?.frame?.contentWindow)s.frame.contentWindow.postMessage({channel:'pb-combo-command',nonce:s.nonce,...command},'*');}
async function comboCopySample(){
 const s=comboParentSession;if(!s||s.completed)return;const text=s.course.steps[s.index].value||'',ta=$('#comboInputMaterial');
 let copied=false;try{copied=await writeClipboard(text)}catch(e){}if(!copied){$('#comboMaterialDetails').open=true;ta.focus();ta.select();$('#comboMaterialNote').hidden=false;$('#comboMaterialNote').textContent='文字已选中，请按 Ctrl/Cmd+C，或在手机上长按复制，再粘贴到高亮字段。';return;}
 comboClearRight();comboPlayStatus('示例已复制。请亲手粘贴到高亮字段，系统会自动核对。');comboSend({type:'focus-input'});
}
function comboInputReady(ready){const s=comboParentSession;if(!s||s.completed||s.awaiting)return;if(ready){comboClearRight();comboPlayStatus('正在核对输入；继续填写即可，无需点击检查按钮。');}}
function comboComplete(){
 const s=comboParentSession;if(!s||s.completed)return;clearTimeout(s.advanceTimer);const saved=comboWriteProgress(s.course,s.mode,s.proof,s.errors,s.hints,s.singleIndex);s.completed=true;comboClearRight();comboSend({type:'finish'});
 $('#comboSessionSection').classList.add('combo-completed');$('#comboProgressText').textContent=s.mode==='single'?'本环节练习已完成':s.mode==='solo'&&s.hints===0?'独立教程已完成':'本模块教程已完成';$('#comboInstruction').textContent=s.mode==='single'?'这一环节已完成。':'练完了。';$('#comboWhy').textContent=s.mode==='single'?'只完成了选定环节；要掌握完整流程，请再做整套模块。':(s.course.completionNote||s.course.overview.result);
 $('#comboCompletionBanner').hidden=false;$('#comboCompletionTitle').textContent=s.mode==='single'?'✓ 本环节练习完成':'✓ 本模块教程已完成';$('#comboCompletionText').textContent=(s.mode==='single'?'你已完成选定环节，完整流程需要另练。':((s.course.completionNote||s.course.overview.result)+' 你已亲手走完这一门。'))+(saved?' 完成记录已保存。':' 本次进度未能保存。')+' 点击「完成并退出」返回正式主界面。';
 $('#comboFeedback').textContent=`错误提示 ${s.errors} 次 · 使用帮助 ${s.hints} 次。下次用自己的素材复做并核对结果。`;
 for(const id of ['comboExpectedInput','comboHint','comboRestartStep','comboRestartAll'])$('#'+id).hidden=true;$('#comboFrameNote').hidden=true;$('#comboFinish').focus({preventScroll:true});
}
function comboAdvance(){const s=comboParentSession;if(!s||s.completed||!s.awaiting)return;clearTimeout(s.advanceTimer);comboClearRight();$('#comboFrameNote').hidden=true;comboSend({type:'clear-guidance'});if(s.mode==='single'||s.index===s.course.steps.length-1){comboComplete();return;}s.index++;s.awaiting=false;comboSend({type:'advance',index:s.index});}
function comboParentMessage(e){
 const m=e.data;if(!m||m.channel!=='pb-combo')return;
 const s=comboParentSession;if(!s||s.completed||e.source!==s.frame?.contentWindow||m.nonce!==s.nonce)return;
 if(m.type==='exit'){closeComboTraining();return;}
 if(m.type==='error'){s.failed=true;comboPlayStatus('练习已停止：'+m.message+'。可退出后重新打开本课。');return;}
 if(m.type==='note'){$('#comboFrameNote').hidden=!m.fallback;$('#comboFrameNote').textContent=m.text||'';return;}
 if(m.type==='step'){const index=comboIndex(m.index,s.course.steps.length-1);if(index!==s.index)return;comboCoachStep(s.course.steps[index],index);return;}
 if(m.type==='wrong'){s.errors++;comboPlayStatus(m.message||'这一步还没对上，别急，看看提示再试一次。');return;}
 if(m.type==='next'){if(s.awaiting&&m.index===s.index)comboAdvance();return;}
 if(m.type==='ready'){comboInputReady(m.ready);return;}
 if(m.type==='passed'){
  if(m.index!==s.index||s.awaiting||!m.userAction)return;s.awaiting=true;s.proof.add(m.index);comboClearRight();const marker=$('#comboActionStrip').children[m.index];if(marker){marker.classList.add('passed');marker.classList.remove('current');}
  comboPlayStatus('✓ '+(s.course.steps[m.index]?.success||'操作与结果已核对。'));$('#comboExpectedInput').hidden=true;
  /* P81a: pacing moved into the floating note at the control (comboChildMark
     renders the 下一步 button there); the side rail stays read-only. */
 }
}

function comboTarget(step){return [...document.querySelectorAll(step.target)].find(el=>!el.disabled&&!el.hidden&&el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden'&&!el.closest('[hidden],[inert]'))||null;}
let comboChild=null,comboCopyText='',comboDownloads=[];
function comboChildPost(type,extra={}){const s=comboChild;if(s)parent.postMessage({channel:'pb-combo',nonce:s.config.nonce,type,...extra},'*');}
function comboChildFixture(course){refreshLibraryStats();renderHome();}

function comboCheck(step,el){
 const check=step.check,value=el?.value?.trim?.()||'',on=id=>$('#'+id)?.classList.contains('open');
 if(check.startsWith('favorite-on:'))return isFavoriteCard(check.slice(12))&&!activeCard;
 if(check.startsWith('favorite-off:'))return !isFavoriteCard(check.slice(13));
 if(check.startsWith('recent-removed:'))return !pwRead(PERSONAL_RECENT_KEY).some(x=>x.id===check.slice(15))&&DATA.some(x=>x.id===check.slice(15));
 if(check==='visible')return !!el&&el.getClientRects().length>0;
 if(check.startsWith('card:'))return activeCard?.id===check.slice(5);
 if(/^catalog-\d+$/.test(check))return on('sourceCatalogOverlay')&&SOURCE_CATALOG.find(x=>x.id===sourceCatalogSelected)?.seq===Number(check.slice(8));
 if(check.startsWith('source-category:'))return sourceCatalogCategory===check.slice(16)&&$('#sourceCatalogCategory').value===check.slice(16);
 if(check.startsWith('source-sort:'))return sourceCatalogSort===check.slice(12)&&$('#sourceCatalogSort').value===check.slice(12);
 if(check.startsWith('source-search:'))return $('#sourceCatalogSearch').value===check.slice(14)&&sourceCatalogMatches.every(i=>check.slice(14).toLocaleLowerCase().split(/\s+/).filter(Boolean).every(w=>SOURCE_SEARCH_INDEX[i].includes(w)));
 if(check.startsWith('source-page:'))return sourceCatalogPage===Number(check.slice(12));
 if(check.startsWith('tab:'))return personalWorkspaceTab===check.slice(4)&&on('personalWorkspaceOverlay');
 if(check.startsWith('pane:')){const pane=document.querySelector(`[data-pane="${check.slice(5)}"]`);return !!pane&&!pane.hidden;}
 switch(check){
  case 'need-results':return on('needOverlay')&&NEED_CONTEXT[0]==='会议纪要'&&!!document.querySelector('[data-need-use="PC-09-006"]');
  case 'need-expanded':return !!document.querySelector('#needThread .need-prompt')?.open;
  case 'need-copy':return comboCopyText.includes('用户原始需求')&&comboCopyText.includes('会议纪要');
  case 'excerpt-open':return on('srcOverlay')&&!!$('#srcText')?.textContent;
  case 'excerpt-copy':return comboCopyText===$('#srcText')?.textContent;
  case 'excerpt-closed':return !on('srcOverlay');
  case 'catalog-closed':return !on('sourceCatalogOverlay');
  case 'catalog-open':return on('sourceCatalogOverlay')&&sourceCatalogMatches.length>0;
  case 'source-copy':return comboCopyText===SOURCE_CATALOG.find(x=>x.id===sourceCatalogSelected)?.text;
  case 'source-page-input':return $('#sourcePageInput').value==='2'&&sourceCatalogPage===0;
  case 'source-selected':return !retiredSelected&&!!SOURCE_CATALOG.find(x=>x.id===sourceCatalogSelected)&&document.querySelector('#sourceCatalogDetail .source-full-text')?.textContent===SOURCE_CATALOG.find(x=>x.id===sourceCatalogSelected)?.text;
  case 'retired-open':return retiredSelected?.card.id==='PC-13-005';
  case 'retired-copy':return comboCopyText===RETIRED_CARDS.find(x=>x.card.id==='PC-13-005')?.card.tpl;
  case 'source-saved':return activeCard?.userImported&&USER_IMPORT_RECORDS.some(r=>r.squareEntryId===sourceCatalogSelected)&&!on('sourceCatalogOverlay');
  case 'source-author-note':return !!document.querySelector('#sourceCatalogDetail details')?.open;
  case 'workspace':return on('personalWorkspaceOverlay');
  case 'workspace-closed':return !on('personalWorkspaceOverlay');
  case 'search':return APP_STATE.q.includes('会议纪要')&&!!document.querySelector('.card[data-id="PC-09-006"]');
  case 'card-closed':return !activeCard&&!on('backdrop')&&!document.querySelector('.nav').inert;
  case 'card':return activeCard?.id==='PC-09-006';
  case 'material':return value.includes('小林')&&value.includes('待讨论')&&composePrompt(activeCard).includes(value);
  case 'meeting-date':return value.includes('未提供')&&value.includes('待确认')&&completion(activeCard).filled===completion(activeCard).total&&composePrompt(activeCard).includes(value);
  case 'copy':return comboCopyText.includes('小林')&&comboCopyText.includes('待讨论')&&!comboCopyText.includes('[会议记录]')&&!comboCopyText.includes('[会议日期]');
  case 'editor':return on('promptLifecycleOverlay')&&!$('#lifecycleId').value;
  case 'editor-existing':return on('promptLifecycleOverlay')&&!!$('#lifecycleId').value;
  case 'name':return value==='会议复盘练习';
  case 'description':return value.length>=8;
  case 'tags':return value.includes('会议')&&value.includes('复盘');
  case 'prompt':return value.length>=40&&value.includes('[会议记录]')&&value.includes('[阅读对象]');
  case 'revised':return value.includes('请先列出待确认问题');
  case 'personal-saved':return USER_IMPORT_RECORDS.some(r=>r.title==='会议复盘练习')&&!on('promptLifecycleOverlay');
  case 'version-saved':return USER_IMPORT_RECORDS.some(r=>r.title==='会议复盘练习'&&r.versions?.length&&r.prompt.includes('请先列出待确认问题'));
  case 'versions':return on('versionInspectorOverlay');
  case 'old-version':return versionInspectIndex===0&&!!document.querySelector('[data-version-diff]');
  case 'diff':return versionDiffMode&&!!document.querySelector('.diff-box');
  case 'promotion':return on('promotionOverlay');
  case 'reason':return value.length>=8;
  case 'local-check-selected':return localCheckState.id==='USR-09-LAB'&&$('#localCheckSelect').value==='USR-09-LAB'&&$('#localCheckText').value===localCheckState.text;
  case 'local-check-result':return localCheckState.result?.length===5&&!!$('#localCheckResults');
  case 'local-check-edited':return value===step.value&&localCheckState.text===step.value&&!localCheckState.result&&USER_IMPORT_RECORDS.find(x=>x.id==='USR-09-LAB')?.prompt!==step.value;
  case 'local-check-copy':return comboCopyText.includes('有没有正文')&&comboCopyText.includes('接下来');
  case 'local-check-saved':return USER_IMPORT_RECORDS.find(x=>x.id==='USR-09-LAB')?.prompt.includes('不要编造')&&USER_IMPORT_RECORDS.find(x=>x.id==='USR-09-LAB')?.versions.length>=2&&!on('promptLifecycleOverlay');
  case 'local-more-open':return !!document.querySelector('#personalWorkspaceList .pw-more')?.open;
  case 'local-trashed':return !USER_IMPORT_RECORDS.some(x=>x.id==='USR-09-LAB')&&promptTrash().some(x=>x.id==='USR-09-LAB');
  case 'local-restored':return USER_IMPORT_RECORDS.some(x=>x.id==='USR-09-LAB')&&!promptTrash().some(x=>x.id==='USR-09-LAB');
  case 'local-archived':return USER_IMPORT_RECORDS.find(x=>x.id==='USR-09-LAB')?.lifecycleStatus==='archived';
  case 'local-active':return USER_IMPORT_RECORDS.find(x=>x.id==='USR-09-LAB')?.lifecycleStatus==='active';
  case 'local-filter-archived':return pwStatusFilter==='archived'&&!!document.querySelector('[data-pw-archive="USR-09-LAB"]');
  case 'local-filter-usable':return pwStatusFilter==='usable'&&!!document.querySelector('[data-pw-archive="USR-09-LAB"]');
  case 'local-version-restored':return USER_IMPORT_RECORDS.find(x=>x.id==='USR-09-LAB')?.rawPrompt.includes('旧版输出约束')&&USER_IMPORT_RECORDS.find(x=>x.id==='USR-09-LAB')?.versions.length>=2;
  case 'local-backup-export':return comboDownloads.some(x=>x.json?.workspace?.personal.prompts.some(p=>p.id==='USR-09-LAB'));
  case 'local-backup-prompts':return comboDownloads.some(x=>x.json?.schema==='ai-playbook-personal-prompts-v1'&&x.json.items.some(p=>p.id==='USR-09-LAB'));
  case 'local-restore-preview':return workspaceRestorePreview?.counts.prompts===1&&!!$('#localRestorePreview')&&!USER_IMPORT_RECORDS.some(x=>x.id==='USR-09-LAB');
  case 'local-restore-cancelled':return !workspaceRestorePreview&&!$('#localRestorePreview')&&!USER_IMPORT_RECORDS.some(x=>x.id==='USR-09-LAB');
  case 'local-restore-done':return !!localRestoreReceipt&&!workspaceRestorePreview&&USER_IMPORT_RECORDS.some(x=>x.id==='USR-09-LAB')&&!promptTrash().some(x=>x.id==='USR-09-LAB');
  case 'local-backup-found':return on('personalWorkspaceOverlay')&&personalWorkspaceTab==='prompts'&&!!document.querySelector('[data-pw-open="USR-09-LAB"]');
  default:return check==='field'&&value.length>0;
 }
}

function comboNotePosition(rect,note,viewport){
 const gap=12,pad=8,w=viewport.width,h=viewport.height,x=Math.max(pad,Math.min(rect.left,w-note.width-pad)),y=Math.max(pad,Math.min(rect.top,h-note.height-pad));
 const choices=[{side:'bottom',left:x,top:rect.bottom+gap},{side:'top',left:x,top:rect.top-note.height-gap},{side:'right',left:rect.right+gap,top:y},{side:'left',left:rect.left-note.width-gap,top:y}];
 return choices.find(p=>p.left>=pad&&p.top>=pad&&p.left+note.width<=w-pad&&p.top+note.height<=h-pad&&!(p.left<rect.right&&p.left+note.width>rect.left&&p.top<rect.bottom&&p.top+note.height>rect.top))||null;
}
let comboMarkFrame=0;
function comboScheduleMark(){if(!comboMarkFrame)comboMarkFrame=requestAnimationFrame(()=>{comboMarkFrame=0;comboChildMark()});}
function comboChildClearGuidance(){const s=comboChild;if(s)s.marker=null;for(const id of ['comboTargetSpot','comboTargetNote']){const el=$('#'+id);if(el)el.style.display='none';}comboChildPost('note',{fallback:false,text:''});}
/* P81a: the floating note's 下一步 button is delegated at document level so it
   works with innerHTML re-renders and in every realm (parent never renders it). */
document.addEventListener('click',e=>{const b=e.target.closest('#comboNoteNext');if(b&&comboChild&&comboChild.passed)comboChildPost('next',{index:comboChild.index});});
function comboChildMark(){ const s=comboChild;if(!s||s.completed)return;if(s.preparing){comboChildClearGuidance();return;}if(s.config.mode==='solo'&&!s.hint&&!s.passed){comboChildClearGuidance();return;}
 const spec=s.marker||s.course.steps[s.index],target=comboTarget(spec),spot=$('#comboTargetSpot'),note=$('#comboTargetNote');if(!spot||!note)return;
 /* P81a: the passed state turns the note into a paced footer — ✓ result +
    下一步 anchored at the control. If the verified action removed the target
    (e.g. closing an overlay), the note docks bottom-center so pacing survives. */
 const passedHTML=()=>{const stepNow=s.course.steps[s.index];return '<div class="combo-note-ok">✓ '+comboEsc(stepNow.success||'操作与结果已核对。')+'</div><button type="button" class="w-btn primary small" id="comboNoteNext">'+(s.index>=s.course.steps.length-1?'✓ 完成本课':'下一步 →')+'</button>';};
 if(!target){
  if(s.passed){const vw=window.innerWidth,nw=Math.min(320,vw-16);const had=note.querySelector('#comboNoteNext');if(!had)note.innerHTML=passedHTML();note.style.display='block';note.style.pointerEvents='auto';note.style.width=nw+'px';note.style.left=Math.max(8,Math.round((vw-nw)/2))+'px';note.style.top=Math.max(8,window.innerHeight-170)+'px';if(spot)spot.style.display='none';}
  return;
 }
 const r=target.getBoundingClientRect();Object.assign(spot.style,{display:'block',left:Math.max(0,r.left-4)+'px',top:Math.max(0,r.top-4)+'px',width:r.width+8+'px',height:r.height+8+'px'});
 /* P78: the floating note is visible in every mode. It is typeset next to the
    highlight box; when no side fits, it docks fully inside the viewport
    (bottom-center) instead of disappearing. */
 /* P81b: rebuild the markup ONLY when the step changes — a pointerup-triggered
    mark that replaced the button between mousedown and mouseup swallowed real
    clicks (user report: 下一步 stuck). Repositioning alone never rebuilds. */
 if(s.passed){
  if(!note.querySelector('#comboNoteNext'))note.innerHTML=passedHTML();
  note.style.pointerEvents='auto';
 }else{
  note.textContent=spec.message||spec.why||'先核对当前控件及结果。';note.style.pointerEvents='none';
 }
 note.style.display='block';note.style.width=Math.min(320,window.innerWidth-16)+'px';
 const measured=note.getBoundingClientRect(),position=comboNotePosition(r,{width:measured.width,height:measured.height},{width:window.innerWidth,height:window.innerHeight});
 if(position){note.dataset.side=position.side;Object.assign(note.style,{left:position.left+'px',top:position.top+'px'});comboChildPost('note',{fallback:false,text:''});}
 else{const vw=window.innerWidth,vh=window.innerHeight;note.dataset.side='dock';Object.assign(note.style,{left:Math.max(8,Math.round((vw-measured.width)/2))+'px',top:Math.max(8,vh-measured.height-8)+'px'});comboChildPost('note',{fallback:false,text:''});}
}
function comboChildSetStep(index){
 const s=comboChild;clearTimeout(s.inputTimer);comboChildClearGuidance();s.index=comboIndex(index,s.course.steps.length-1);s.passed=false;s.userInput=false;s.clicked=false;s.lastTarget=null;s.marker=null;s.composing=false;
 const step=s.course.steps[s.index],target=comboTarget(step);if(!target){comboChildPost('error',{message:'找不到当前控件：'+step.instruction});return;}
 /* P81 fix: block:'center' — 'nearest' left targets stuck under the sticky top
    bar, so the highlight looked like it pointed at the wrong control. */
 target.scrollIntoView({block:'center',inline:'nearest',behavior:'instant'});if(['input','key'].includes(step.type)&&s.config.mode!=='solo'&&window.innerWidth>760)target.focus({preventScroll:true});
 if(s.config.mode==='solo'&&step.type==='input'&&s.trustedInputs.has(step.target)){s.userInput=true;s.lastTarget=target;}
 comboChildPost('step',{index:s.index});comboChildPost('ready',{ready:false});requestAnimationFrame(comboChildMark);
 if(s.config.mode==='solo'&&s.userInput&&comboCheck(step,target))setTimeout(()=>comboChildTryPass(true),0);
}
function comboChildObserve(step){
 const s=comboChild;if(!step.observe||!s||s.completed)return;s.marker=step.observe;const target=comboTarget(step.observe);if(!target){comboChildPost('error',{message:'找不到要核对的结果位置：'+step.instruction});return;}
 target.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});requestAnimationFrame(comboChildMark);
}
function comboChildTryPass(userAction,attempt=0){
 const s=comboChild;if(!s||s.replay||s.passed||s.completed)return;const step=s.course.steps[s.index],target=comboTarget(step)||s.lastTarget;
 const meaningful=step.type==='input'?s.userInput:s.clicked;
 let pass=false;try{pass=meaningful&&comboCheck(step,target)}catch(e){}
 if(!pass&&meaningful&&['click','key'].includes(step.type)&&attempt<8){const index=s.index;setTimeout(()=>{if(comboChild===s&&s.index===index&&!s.passed)comboChildTryPass(userAction,attempt+1)},80);return;}
 if(!pass){comboChildPost('wrong',{message:step.type==='input'?'输入未达到本步条件，别急：核对字段、完整文字或选择值后再试。':'这一步还没对上，看看高亮的控件再试一次就好。'});return;}
 s.passed=true;comboChildPost('passed',{index:s.index,userAction:!!userAction});comboChildMark();
}
function comboChildQueueInput(commit=false){
 const s=comboChild;if(!s||s.passed||s.completed||s.composing||!s.userInput)return;clearTimeout(s.inputTimer);const index=s.index;
 s.inputTimer=setTimeout(()=>{if(comboChild!==s||s.index!==index||s.passed||s.completed||s.composing)return;const step=s.course.steps[index],target=comboTarget(step)||s.lastTarget;
  // Quiet debounce requires the full exercise text, so a pause halfway through
  // a sentence cannot advance. A real blur/change explicitly ends the edit.
  if(!commit&&String(target?.value??'').trim()!==String(step.value??'').trim())return;
  if(!commit&&!comboCheck(step,target))return;comboChildTryPass(true);
 },commit?180:900);
}
function comboChildEvent(e){
 const s=comboChild;if(!s||s.replay||s.completed||!e.isTrusted)return;
 if(s.passed){if(e.target?.closest?.('#comboNoteNext'))return;/* P81a: the note's 下一步/完成本课 IS the advance control. */if(e.target?.closest?.('button,input,textarea,select,a,summary,[role="button"]')&&(e.type==='click'||e.type==='keydown'&&['Enter',' '].includes(e.key))){e.preventDefault();e.stopImmediatePropagation();}return;}
 if(e.type==='input')for(const inputStep of s.course.steps.filter(x=>x.type==='input'))if(e.target.matches?.(inputStep.target))s.trustedInputs.add(inputStep.target);
 const step=s.course.steps[s.index],target=e.target?.closest?.(step.target),interactive=e.target?.closest?.('button,input,textarea,select,a,summary,[role="button"]');
 if(e.type==='keydown'&&e.key==='Enter'&&step.type==='input'&&target?.matches('input')&&target.closest('form')){e.preventDefault();e.stopImmediatePropagation();comboChildPost('wrong',{message:'先把高亮字段填好；停止输入或按 Tab 结束编辑后会自动核对。'});return;}
 if(e.type==='keydown'&&step.type==='key'&&target&&e.key===step.key){s.clicked=true;s.lastTarget=target;setTimeout(()=>comboChildTryPass(true),180);return;}
 if(e.type==='click'){
  if(['input','key'].includes(step.type)&&target)return;
  if(step.type==='click'&&target){s.clicked=true;s.lastTarget=target;setTimeout(()=>comboChildTryPass(true),180);return;}
  if(step.type==='input'&&s.config.mode==='solo'&&interactive?.matches('input,textarea,select'))return;
  if(interactive){e.preventDefault();e.stopImmediatePropagation();comboChildPost('wrong',{message:s.config.mode==='solo'?'这一步还没完成，按练过的流程再来一次；需要时点提示。':'这一步只需要：'+step.instruction});}
 }else if(e.type==='compositionstart'&&step.type==='input'&&target){s.composing=true;clearTimeout(s.inputTimer);}
 else if(e.type==='compositionend'&&step.type==='input'&&target){s.composing=false;s.userInput=true;s.lastTarget=target;comboChildQueueInput();}
 else if(e.type==='input'&&step.type==='input'&&target){s.userInput=true;s.lastTarget=target;comboChildPost('ready',{ready:true});comboChildQueueInput();}
 else if(['change','focusout'].includes(e.type)&&step.type==='input'&&target){
  if(e.type==='change'&&e.isTrusted){s.userInput=true;s.lastTarget=target;comboChildPost('ready',{ready:true});}
  comboChildQueueInput(true);
 }
}
/* P78: robustness budgets are real time, so slow devices cannot starve a step. */
function comboRealDelay(ms){return new Promise(r=>setTimeout(r,ms));}
/* P80: renamed from the former demonstration-action runner. This is the CHAIN
   REPLAY path used to
   silently build the state a mid-course entry expects — it intentionally keeps
   the observe branch, because sliced chains still contain observe steps.
   Removing it would break every mid-chain course (backup-trash/restore,
   organize-restore/versions...). It is not a user practice path. */
async function comboReplayAction(step){
 let target;for(let n=0;n<80;n++){target=comboTarget(step);if(target)break;await comboRealDelay(100);}
 if(!target)throw Error('控件尚未出现：'+step.instruction);target.scrollIntoView({block:'center',inline:'center',behavior:'instant'});
 if(step.type==='observe'){await comboRealDelay(120);return;}
 if(step.type==='input'){target.focus();target.value=step.value??'';target.dispatchEvent(new Event('input',{bubbles:true}));target.dispatchEvent(new Event('change',{bubbles:true}));target.blur();}
 else if(step.type==='key'){if(!target.form)throw Error('当前页码没有对应表单');target.form.requestSubmit();}
 else target.click();
 await comboRealDelay(220);if(comboChild?.completed)return;for(let n=0;n<80;n++){try{if(comboCheck(step,comboTarget(step)||target))return;}catch(e){}await comboRealDelay(100);}
 throw Error('未得到预期结果：'+step.instruction);
}
function comboChildCommand(e){
 const s=comboChild,m=e.data;if(!s||s.completed||e.source!==parent||m?.channel!=='pb-combo-command'||m.nonce!==s.config.nonce)return;
 if(m.type==='advance'&&s.passed&&m.index===s.index+1)comboChildSetStep(m.index);
 if(m.type==='focus-input'&&s.course.steps[s.index].type==='input'){comboTarget(s.course.steps[s.index])?.focus({preventScroll:true});comboChildMark();}
 if(m.type==='hint'){s.hint=true;comboChildPost('step',{index:s.index});comboChildMark();}
 if(m.type==='clear-guidance')comboChildClearGuidance();
 if(m.type==='finish'){s.completed=true;clearTimeout(s.inputTimer);comboChildClearGuidance();$('#comboTargetSpot')?.remove();$('#comboTargetNote')?.remove();}
}
async function comboInitChild(){
 const config=window.__PB_TRAINING_CHILD__,course=comboCourse(config.courseId);comboChild={config,course,index:0,replay:true,hint:false,passed:false,userInput:false,clicked:false,lastTarget:null,trustedInputs:new Set(),completed:false};
 /* P79/P80: micro courses slice a source chain; the prefix (chain indices
    [0 .. chainMap[startIndex])) — observe steps included — is replayed
    silently so every lesson starts from the state its first action expects. */
 const chain=course.from?COMBO_CATALOG.chains?.[course.from]:null,replaySteps=chain||course.steps;
 const start=comboIndex(config.startIndex,course.steps.length-1);
 const prefix=chain&&Array.isArray(course.chainMap)?course.chainMap[start]:start;
 if(!window.__PB_TRAINING_STORAGE__||PlaybookDatabase.available)throw Error('练习存储隔离未就绪，已停止训练。');
 document.body.classList.add('combo-child');
 const badge=document.createElement('div');badge.className='combo-child-label';badge.textContent='独立练习场 · 全部为训练数据';document.body.appendChild(badge);
 const spot=document.createElement('div');spot.id='comboTargetSpot';document.body.appendChild(spot);const note=document.createElement('div');note.id='comboTargetNote';note.setAttribute('role','status');note.setAttribute('aria-live','polite');document.body.appendChild(note);
 copyText=function(text,btn){comboCopyText=String(text);if(btn){btn.textContent='✓ 练习复制';btn.classList.add('done');}notifyLocal('练习复制区已收到指令；不会访问系统剪贴板。');};
 const blobs=new Map(),create=URL.createObjectURL.bind(URL);URL.createObjectURL=function(blob){const url=create(blob);blobs.set(url,blob);return url;};
 const originalAnchorClick=HTMLAnchorElement.prototype.click;
 HTMLAnchorElement.prototype.click=function(){if(this.download){const blob=blobs.get(this.href),item={name:this.download,json:null};comboDownloads.push(item);if(blob)blob.text().then(text=>{try{item.json=JSON.parse(text)}catch(e){item.text=text}});notifyLocal('练习文件已生成，仅在本训练场记录。');return;}return originalAnchorClick.call(this);};
 comboChildFixture(course);window.__PB_TRAINING_BACKUP_READ__=()=>comboClone([...comboDownloads].reverse().find(x=>x.json?.workspace)?.json||null);
 addEventListener('message',comboChildCommand);for(const type of ['click','input','change','focusout','keydown','compositionstart','compositionend'])addEventListener(type,comboChildEvent,true);
 addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();comboChildPost('exit');}},true);
 addEventListener('scroll',comboScheduleMark,true);addEventListener('resize',comboScheduleMark);addEventListener('pointermove',()=>{if(document.body.classList.contains('window-interacting'))comboScheduleMark()});addEventListener('pointerup',comboScheduleMark);
 for(let i=0;i<prefix;i++)await comboReplayAction(replaySteps[i]);
 comboChild.replay=false;comboChildSetStep(start);
}

if(window.__PB_TRAINING_CHILD__){comboInitChild().catch(e=>comboChildPost('error',{message:e.message}));}
else{
 $('#comboClose').addEventListener('click',closeComboTraining);
 $('#comboBack').addEventListener('click',()=>{comboDestroyFrames();closeComboTraining();window.AI_PLAYBOOK_ONBOARDING?.openMap?.();});
 $('#comboCourseSelect').addEventListener('change',comboUpdateSinglePicker);
 $('#comboBegin').addEventListener('click',()=>comboShowBriefing($('#comboCourseSelect').value,'guided',0));
 $('#comboCourseMenu').addEventListener('click',e=>{const b=e.target.closest('[data-combo-course]');if(b)comboShowBriefing(b.dataset.comboCourse);});
 $('#comboCopySample').addEventListener('click',comboCopySample);$('#comboFinish').addEventListener('click',closeComboTraining);
 $('#comboBriefBack').addEventListener('click',()=>{$('#comboBriefingSection').hidden=true;$('#comboMenuSection').hidden=false;});
 $('#comboBriefStart').addEventListener('click',()=>{const b=comboBriefingChoice;if(b)comboStart(b.courseId,b.mode,b.startIndex);});
 $('#comboHint').addEventListener('click',()=>{const s=comboParentSession;if(s){s.hints++;s.showHint=true;comboSend({type:'hint'});}});
 $('#comboRestartStep').addEventListener('click',()=>{const s=comboParentSession;if(s)comboStart(s.course.id,s.mode,s.index,{proof:new Set(s.proof),errors:s.errors,hints:s.hints});});
 $('#comboRestartAll').addEventListener('click',()=>{const s=comboParentSession;if(s)comboStart(s.course.id,s.mode,0);});
 $('#comboTrainingOverlay').addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();closeComboTraining();}});
 if(typeof ResizeObserver!=='undefined')new ResizeObserver(comboViewLayout).observe($('#comboTrainingOverlay .combo-training-view'));
 addEventListener('message',comboParentMessage);addEventListener('resize',comboViewportFit);window.visualViewport?.addEventListener('resize',comboViewportFit);
 const comboPriorHelp=helpDescription;helpDescription=function(el){if(el.id==='tourBtn')return helpInfo('操作地图','一页看懂四条核心流程和每个按钮的名字。','每条流程都能「跟导览看一遍」在真实界面上认识控件，或直接「亲手练」进沙箱练习。','不确定某个按钮的用途时，先看地图再看导览，最后进练习课动手。');return comboPriorHelp(el);};
}
window.AI_PLAYBOOK_COMBO={catalog:COMBO_CATALOG,open:openComboTraining,openCourse:comboOpenCourse,purgeVideoProgress:comboPurgeVideoProgress};
