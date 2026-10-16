/* v6.27 · Full, attributed Luzi Square source corpus. Curated cards remain separate. */
const SOURCE_PAGE_SIZE = 25;
const SOURCE_SEARCH_INDEX = SOURCE_CATALOG.map(x =>
  [x.title,x.publisher,x.originalAuthor,x.summary,x.tags,x.text,String(x.seq)].join(' ').toLocaleLowerCase()
);
// Browsing categories are inferred only; the source's original tags remain intact.
const SOURCE_CATEGORY_HINTS={...CAT_HINTS,'16':['生活','健康','饮食','运动','睡眠','旅行','家庭','心理'],'17':['法律','合同','合规','条款','隐私','知识产权'],'18':['财务','投资','理财','预算','税务','基金','股票']};
const SOURCE_CATEGORY_INDEX=SOURCE_CATALOG.map(x=>{const q=normText(x.title+' '+x.tags),scores=Object.entries(SOURCE_CATEGORY_HINTS).map(([id,hints])=>[id,hints.reduce((n,k)=>n+(q.includes(normText(k))?1:0),0)]).sort((a,b)=>b[1]-a[1]);return scores[0]?.[1]?scores[0][0]:'other';});
let sourceCatalogMatches = SOURCE_CATALOG.map((_, i) => i);
let sourceCatalogPage = 0;
let sourceCatalogCategory='all',sourceCatalogSort='seq-asc';
let sourceCatalogSelected = null;
let sourceCatalogReturn = null;
let sourceCatalogTimer = 0;
let retiredSelected = null;

function sourceCatalogOpen(id = '') {
  const overlay = $('#sourceCatalogOverlay');
  if (!overlay.classList.contains('open')) sourceCatalogReturn = document.activeElement;
  if (id) {
    retiredSelected = RETIRED_CARDS.find(x=>x.card.id===id) || null;
    const entry = SOURCE_CATALOG.find(x => x.id === id || x.seq === Number(id));
    if (entry) {
      sourceCatalogSelected = entry.id;
      $('#sourceCatalogSearch').value = '';
      sourceCatalogCategory='all';sourceCatalogSort='seq-asc';
      $('#sourceCatalogCategory').value='all';$('#sourceCatalogSort').value='seq-asc';
      sourceCatalogFilter();
      sourceCatalogPage = Math.floor(sourceCatalogMatches.indexOf(SOURCE_CATALOG.indexOf(entry)) / SOURCE_PAGE_SIZE);
      sourceCatalogSelected=entry.id;
    }
  } else if (!sourceCatalogSelected) {
    sourceCatalogSelected = SOURCE_CATALOG[0].id;
  }
  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden','false');
  renderSourceCatalog();
  syncBodyLock();
  requestAnimationFrame(() => $('#sourceCatalogSearch').focus({preventScroll:true}));
}
function closeSourceCatalog() {
  const overlay = $('#sourceCatalogOverlay');
  if (!overlay.classList.contains('open')) return;
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden','true');
  syncBodyLock();
  if (sourceCatalogReturn?.isConnected) sourceCatalogReturn.focus({preventScroll:true});
}
function sourceCatalogFilter() {
  retiredSelected = null;
  const words = $('#sourceCatalogSearch').value.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  sourceCatalogCategory=$('#sourceCatalogCategory').value;
  sourceCatalogSort=$('#sourceCatalogSort').value;
  sourceCatalogMatches = SOURCE_SEARCH_INDEX.flatMap((s,i) => (sourceCatalogCategory==='all'||SOURCE_CATEGORY_INDEX[i]===sourceCatalogCategory)&&words.every(w=>s.includes(w))?[i]:[]);
  if(sourceCatalogSort==='seq-desc')sourceCatalogMatches.reverse();
  else if(sourceCatalogSort==='title'||sourceCatalogSort==='publisher'){
    const key=sourceCatalogSort;
    sourceCatalogMatches.sort((a,b)=>SOURCE_CATALOG[a][key].localeCompare(SOURCE_CATALOG[b][key],'zh-CN')||SOURCE_CATALOG[a].seq-SOURCE_CATALOG[b].seq);
  }
  sourceCatalogPage = 0;
  sourceCatalogSelected = sourceCatalogMatches.length ? SOURCE_CATALOG[sourceCatalogMatches[0]].id : null;
  renderSourceCatalog();
}
function sourceCatalogDetail(entry) {
  const detail = $('#sourceCatalogDetail');
  if (!entry) { detail.innerHTML='<p>没有匹配的来源。换一个关键词试试。</p>'; return; }
  const duplicate = (entry.duplicateSeqs||[]).map(n => `<button type="button" class="w-btn small" data-square-seq="${n}">#${n}</button>`).join(' ');
  detail.innerHTML = `<div class="source-kicker">来源记录 #${entry.seq} · ${esc(entry.publishedAt||'日期未提供')}</div>
    <h2>${esc(entry.title)}</h2>
    <dl class="source-meta"><dt>署名发布者</dt><dd><b>${esc(entry.publisher)}</b> · ${esc(entry.publisherKind||'来源未标注')}${entry.publisherPage?` · ${esc(entry.publisherPage)}`:''}</dd>
    <dt>原创路由</dt><dd>${esc(entry.route==='站内原创'?'炉子广场':(entry.route||'未注明'))}${entry.originalAuthor?` · 原始出处作者：${esc(entry.originalAuthor)}`:''}</dd>
    ${entry.inspiration?`<dt>灵感来源</dt><dd>${esc(entry.inspiration)}</dd>`:''}
    <dt>原始定位</dt><dd>《炉子广场-文本提示词.xlsx》 · 提示词清单 #${entry.seq}<br>广场条目 ID：${esc(entry.id)}</dd>
    ${entry.tags?`<dt>原发布标签</dt><dd>${esc(entry.tags)}</dd>`:''}</dl>
    ${entry.authorNote?`<details><summary>作者说明</summary><p class="source-note">${esc(entry.authorNote)}</p></details>`:''}
    ${duplicate?`<p class="source-duplicates">相同正文的其他发布记录：${duplicate}</p>`:''}
    ${entry.relatedCards.length?`<p class="source-links">已关联母模板：${entry.relatedCards.map(id=>`<button type="button" class="w-btn small" data-square-card="${esc(id)}">${esc(id)} · 查看策展版本</button>`).join(' ')}</p>`:''}
    <div class="source-actions">${favoriteButton('source:'+entry.id,entry.title)}<button type="button" class="w-btn primary" data-square-copy>复制完整原文</button><button type="button" class="w-btn" data-square-save>存成我的提示词</button><span>${entry.text.length.toLocaleString()} 字符 · 原文保留，不代表已获母模板评分</span></div>
    <pre class="source-full-text"></pre>`;
  detail.querySelector('.source-full-text').textContent = entry.text;
}
function retiredCardDetail(record) {
  const c=record.card,detail=$('#sourceCatalogDetail');
  detail.innerHTML=`<div class="source-kicker">旧母模板档案 · ${esc(record.retiredAt)}</div>
    <h2>${esc(c.id)} · ${esc(c.name)}</h2>
    <p>${esc(record.reason)}</p>
    <dl class="source-meta"><dt>原分类</dt><dd>${esc(c.cat)}</dd>
    <dt>原始出处</dt><dd>${esc(c.source)}</dd>
    <dt>归档原则</dt><dd>退出首页策展卡片；原模板正文和来源摘录完整保留。</dd></dl>
    <div class="source-actions">${favoriteButton('retired:'+c.id,c.name)}<button type="button" class="w-btn primary" data-retired-copy="${esc(c.id)}">复制旧模板</button></div>
    <pre class="source-full-text"></pre>`;
  detail.querySelector('.source-full-text').textContent=c.tpl;
}
function renderSourceCatalog() {
  const count = sourceCatalogMatches.length;
  const maxPage = Math.max(1, Math.ceil(count / SOURCE_PAGE_SIZE));
  sourceCatalogPage = Math.min(Math.max(sourceCatalogPage,0), maxPage-1);
  $('#sourceCatalogSummary').textContent = `匹配 ${count.toLocaleString()} / ${SOURCE_CATALOG.length.toLocaleString()} 条 · 原始发布记录，不将同文不同署名合并删除 · 分类仅供浏览`;
  $('#retiredCardShelf').innerHTML=`旧母模板档案：${RETIRED_CARDS.map(x=>`<button type="button" class="w-btn small" data-retired-id="${esc(x.card.id)}">${esc(x.card.id)} · ${esc(x.card.name)}</button>`).join(' ')}`;
  const slice = sourceCatalogMatches.slice(sourceCatalogPage*SOURCE_PAGE_SIZE,(sourceCatalogPage+1)*SOURCE_PAGE_SIZE);
  $('#sourceCatalogList').innerHTML = slice.map(i=>{
    const x=SOURCE_CATALOG[i];
    return `<div class="source-item-row"><button type="button" class="source-item${sourceCatalogSelected===x.id?' selected':''}" data-square-id="${esc(x.id)}"><span>#${x.seq} · ${esc(x.title)}</span><small>${esc(CATS[SOURCE_CATEGORY_INDEX[i]]?.[0]||'其他')} · 署名发布者：${esc(x.publisher)}${x.duplicateSeqs?.length?' · 同文 '+(x.duplicateSeqs.length+1)+' 条':''}</small></button>${favoriteButton('source:'+x.id,x.title,true)}</div>`;
  }).join('') || '<p class="source-empty">没有匹配记录。</p>';
  $('#sourceCatalogPages').innerHTML = `<button type="button" class="w-btn small" data-square-page="prev" ${sourceCatalogPage===0?'disabled':''}>上一页</button><form id="sourcePageJump" class="source-page-inline" novalidate><label><input id="sourcePageInput" type="number" min="1" max="${maxPage}" value="${sourceCatalogPage+1}" inputmode="numeric" enterkeyhint="go" title="输入页码后按回车跳转" aria-label="当前页码，编辑后按回车跳转"></label><span>/ ${maxPage} 页</span></form><button type="button" class="w-btn small" data-square-page="next" ${sourceCatalogPage>=maxPage-1?'disabled':''}>下一页</button>`;
  if(retiredSelected)retiredCardDetail(retiredSelected);
  else sourceCatalogDetail(SOURCE_CATALOG.find(x=>x.id===sourceCatalogSelected));
}

const sourceCategoryCounts={};SOURCE_CATEGORY_INDEX.forEach(id=>sourceCategoryCounts[id]=(sourceCategoryCounts[id]||0)+1);
$('#sourceCatalogCategory').innerHTML=`<option value="all">全部主题 · ${SOURCE_CATALOG.length}</option>${Object.entries(CATS).filter(([id])=>sourceCategoryCounts[id]).map(([id,info])=>`<option value="${id}">${esc(info[0])} · ${sourceCategoryCounts[id]}</option>`).join('')}<option value="other">其他 · ${sourceCategoryCounts.other||0}</option>`;
$('#sourceCatalogBtn').addEventListener('click',()=>sourceCatalogOpen());
$('#sourceCatalogClose').addEventListener('click',closeSourceCatalog);
$('#sourceCatalogOverlay').addEventListener('click',e=>{if(e.target.id==='sourceCatalogOverlay')closeSourceCatalog()});
$('#sourceCatalogSearch').addEventListener('input',()=>{clearTimeout(sourceCatalogTimer);sourceCatalogTimer=setTimeout(sourceCatalogFilter,120)});
$('#sourceCatalogCategory').addEventListener('change',sourceCatalogFilter);
$('#sourceCatalogSort').addEventListener('change',sourceCatalogFilter);
document.addEventListener('submit',e=>{if(e.target.id!=='sourcePageJump')return;e.preventDefault();const raw=$('#sourcePageInput').value.trim(),max=Math.max(1,Math.ceil(sourceCatalogMatches.length/SOURCE_PAGE_SIZE));if(!raw||!Number.isSafeInteger(Number(raw))){notifyLocal('请输入有效页码。');return;}sourceCatalogPage=Math.min(max,Math.max(1,Number(raw)))-1;retiredSelected=null;sourceCatalogSelected=SOURCE_CATALOG[sourceCatalogMatches[sourceCatalogPage*SOURCE_PAGE_SIZE]]?.id||null;renderSourceCatalog();$('#sourceCatalogList').scrollTop=0;$('#sourcePageInput')?.focus({preventScroll:true});$('#sourcePageInput')?.select();});
document.addEventListener('click',e=>{
  if(e.target.closest('[data-favorite-card]'))return;
  const link=e.target.closest('[data-source-catalog-entry]');
  if(link){const id=link.dataset.sourceCatalogEntry;closeSrc();sourceCatalogOpen(id);return;}
  const row=e.target.closest('[data-square-id]');
  if(row){retiredSelected=null;sourceCatalogSelected=row.dataset.squareId;renderSourceCatalog();return;}
  const archived=e.target.closest('[data-retired-id]');
  if(archived){retiredSelected=RETIRED_CARDS.find(x=>x.card.id===archived.dataset.retiredId)||null;renderSourceCatalog();return;}
  const archivedCopy=e.target.closest('[data-retired-copy]');
  if(archivedCopy){const x=RETIRED_CARDS.find(x=>x.card.id===archivedCopy.dataset.retiredCopy);if(x)copyText(x.card.tpl,archivedCopy);return;}
  const seq=e.target.closest('[data-square-seq]');
  if(seq){sourceCatalogOpen(seq.dataset.squareSeq);return;}
  const page=e.target.closest('[data-square-page]');
  if(page){retiredSelected=null;const max=Math.max(1,Math.ceil(sourceCatalogMatches.length/SOURCE_PAGE_SIZE));sourceCatalogPage=Math.min(max-1,Math.max(0,sourceCatalogPage+(page.dataset.squarePage==='next'?1:-1)));sourceCatalogSelected=SOURCE_CATALOG[sourceCatalogMatches[sourceCatalogPage*SOURCE_PAGE_SIZE]]?.id||null;renderSourceCatalog();$('#sourceCatalogList').scrollTop=0;return;}
  const copy=e.target.closest('[data-square-copy]');
  if(copy){const x=SOURCE_CATALOG.find(x=>x.id===sourceCatalogSelected);if(x)copyText(x.text,copy);return;}
  const save=e.target.closest('[data-square-save]');
  if(save){
    if(!guardPersonalWrite())return;
    const x=SOURCE_CATALOG.find(x=>x.id===sourceCatalogSelected);if(!x)return;
    const existing=USER_IMPORT_RECORDS.find(r=>r.squareEntryId===x.id);
    if(existing){closeSourceCatalog();openCard(existing.id);notifyLocal('这条来源已经保存为个人 Prompt。');return;}
    const catId=inferImportCat(x.title+' '+x.tags+' '+x.summary),now=new Date().toISOString();
    const record={id:uniqueImportId(catId),title:x.title,catId,tags:['个人导入',...x.tags.split(/[,，、;；]/).map(s=>s.trim()).filter(Boolean)],
      desc:x.summary,prompt:normalizeImportedTemplate(x.text),rawPrompt:x.text,
      file:`炉子广场 #${x.seq} · 署名发布者：${x.publisher} · ${x.id}`,squareEntryId:x.id,
      importedAt:new Date().toLocaleString('zh-CN',{hour12:false}),createdAt:now,updatedAt:now,lifecycleStatus:'active',versions:[]};
    const {card,persisted}=addImportedRecord(record);
    if(!persisted){notifyLocal('浏览器无法保存该条来源；请先复制原文，再检查本地存储空间。');return;}
    closeSourceCatalog();openCard(card.id);notifyLocal('已保存为个人 Prompt，可填写识别出的变量。');return;
  }
  const card=e.target.closest('[data-square-card]');
  if(card){const id=card.dataset.squareCard;closeSourceCatalog();openCard(id);}
});

