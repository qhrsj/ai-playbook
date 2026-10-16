/* ================================================================
   控件 HTML（每主题通过 CSS 与 glyph 呈现不同形态）
================================================================ */
const QUICKS=[['本批精选','炉子广场策展'],['旧批炉子','炉子提示词.xlsx'],['我的导入','个人导入'],['高分精选 4.5+','评分:4.5'],['去AI味','去AI味'],['营销增长','营销'],['教师备课','备课'],['模拟面试','面试'],['PPT 汇报','PPT'],['AI 绘图','Midjourney'],['格式转换','JSON']];
const quickHTML = ()=>`<div id="quick">${QUICKS.map(([l,k])=>`<button class="qbtn" data-k="${k}">${l}</button>`).join('')}</div>`;
const catsHTML = ()=>{ const counts={}; DATA.forEach(c=>counts[c.catId]=(counts[c.catId]||0)+1);
  let html=`<span class="cnode ${APP_STATE.cat==='all'?'active':''}" data-cat="all"><span class="gl">◉</span>全部 <span class="ct">${DATA.length}</span></span>`;
  for(const id of Object.keys(CATS)){ const [name,em,color]=catInfo(id); const n=counts[id]||0;
    html+=`<span class="cnode ${APP_STATE.cat===id?'active':''} ${n===0?'empty':''}" data-cat="${id}" style="--c:${color}" title="${name}"><span class="gl">${glyph(id)}</span>${name} <span class="ct">${n}</span></span>`; }
  return `<div id="cats">${html}</div>`; };
const sortHTML = ()=>`<div class="sortsel"><span>${L('sortLabel')}</span><select id="sort">
  <option value="score" ${APP_STATE.sort==='score'?'selected':''}>${L('sortA')}</option>
  <option value="id" ${APP_STATE.sort==='id'?'selected':''}>${L('sortB')}</option></select></div>`;
const emptyHTML = ()=>`<div class="no-result" id="empty" ${currentList().length?'hidden':''}><div class="art" id="emptyArt">${L('emptyArt')}</div><p id="emptyText">${L('empty')}</p></div>`;
const rinfoHTML = list => `<div class="result-info" id="rinfo">${L('result').replace('{n}',`<b>${list.length}</b>`)}${APP_STATE.cat!=='all'?` · ${catInfo(APP_STATE.cat)[0]}`:''}${APP_STATE.q?` · 「${esc(APP_STATE.q)}」`:''}</div>`;
const stars = v => { const f=Math.round(v); let s=''; for(let i=1;i<=5;i++) s+=i<=f?'★':'<span class="off">★</span>'; return s; };
function hl(text){
  const raw=String(text??''), q=APP_STATE.q;
  if(!q) return esc(raw);
  const at=raw.toLowerCase().indexOf(q.toLowerCase());
  return at<0?esc(raw):esc(raw.slice(0,at))+'<mark>'+esc(raw.slice(at,at+q.length))+'</mark>'+esc(raw.slice(at+q.length));
}

