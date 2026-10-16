/* ================================================================
   全局事件代理（卡片 / 标签 / 分类 / 快捷 / 排序）
================================================================ */
document.addEventListener('click',e=>{
  if(e.target.closest('[data-favorite-card]'))return;
  const tag=e.target.closest('[data-tag]');
  if(tag){ APP_STATE.q=tag.dataset.tag; document.getElementById('q').value=APP_STATE.q; renderHome(); return; }
  const qb=e.target.closest('.qbtn');
  if(qb&&qb.dataset.k!=null){ APP_STATE.q=qb.dataset.k; document.getElementById('q').value=APP_STATE.q; renderHome(); window.scrollTo({top:0,behavior:'smooth'}); return; }
  const cat=e.target.closest('[data-cat]');
  if(cat){ if(cat.classList.contains('empty')) return; APP_STATE.cat=cat.dataset.cat; renderHome(); return; }
  const hint=e.target.closest('#nbHint');
  if(hint){ focusMainSearch(); return; }
  const card=e.target.closest('.card');
  if(card) openCard(card.dataset.id);
});
document.addEventListener('change',e=>{
  if(e.target.id==='sort'){ APP_STATE.sort=e.target.value;HOME_LIBRARY.official.page=1;renderHome(); }
});
function focusMainSearch(){const input=document.getElementById('q');if(input){input.scrollIntoView({block:'center'});input.focus({preventScroll:true});}}
function renderMainSearchResults(){
 const view=document.getElementById('home-library-view');if(!view){renderHome();return;}
 view.innerHTML=homeLibrarySection(APP_STATE.theme,HOME_LIBRARY.active);
 enhanceHome();decorateHelp(view);queueGlobalReading();
}
let qT=0;
document.addEventListener('input',e=>{
 const id=e.target.id;
 if(id==='q'&&!e.isComposing){APP_STATE.q=e.target.value;clearTimeout(qT);qT=setTimeout(()=>{HOME_LIBRARY.official.page=1;renderMainSearchResults();},160);return;}
 if(id==='skillSearchHome'&&!e.isComposing){HOME_LIBRARY.skills.q=e.target.value;clearTimeout(qT);qT=setTimeout(()=>{HOME_LIBRARY.skills.page=1;renderMainSearchResults();},160);return;}
 if(id==='personalHomeSearch'&&!e.isComposing){HOME_LIBRARY.personal.q=e.target.value;clearTimeout(qT);qT=setTimeout(()=>{HOME_LIBRARY.personal.page=1;renderMainSearchResults();},160);return;}
});
document.addEventListener('compositionend',e=>{
 const id=e.target.id;
 if(id==='q'){APP_STATE.q=e.target.value;clearTimeout(qT);qT=setTimeout(()=>{HOME_LIBRARY.official.page=1;renderMainSearchResults();},160);return;}
 if(id==='skillSearchHome'){HOME_LIBRARY.skills.q=e.target.value;clearTimeout(qT);qT=setTimeout(()=>{HOME_LIBRARY.skills.page=1;renderMainSearchResults();},160);return;}
 if(id==='personalHomeSearch'){HOME_LIBRARY.personal.q=e.target.value;clearTimeout(qT);qT=setTimeout(()=>{HOME_LIBRARY.personal.page=1;renderMainSearchResults();},160);return;}
});

