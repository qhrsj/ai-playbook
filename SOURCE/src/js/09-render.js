/* ================================================================
   RENDER 管线（保留 q / cat / sort / 滚动位置）
================================================================ */
function currentList(){
  let list=DATA.filter(c=>APP_STATE.cat==='all'||c.catId===APP_STATE.cat);
  if(APP_STATE.q.trim()){ const q=APP_STATE.q.trim().toLowerCase();
    if(q.startsWith('评分:')){ const min=parseFloat(q.slice(3))||0; list=list.filter(c=>c.overall>=min); }
    else list=list.filter(c=>(c.name+c.task+c.sub+c.tags.join('')+c.id+(c.tpl||'')+(c.source||'')+(c.origin||'')+(c.batch||'')).toLowerCase().includes(q)); }
  if(APP_STATE.sort==='id') list.sort((a,b)=>a.id.localeCompare(b.id));
  else list.sort((a,b)=>b.overall-a.overall||a.id.localeCompare(b.id));
  return list;
}
function renderHome(){
  const sy=scrollY;
  const list=currentList();
  document.getElementById('home').innerHTML=HOME_RENDERERS[APP_STATE.theme](list);
  mountHeroQuote();
  enhanceHome();
  decorateHelp(document);
  scrollTo(0,sy);
}
function renderCards(){
  HOME_LIBRARY.official.page=HOME_LIBRARY.personal.page=1;
  renderHome();
}

