/* ================================================================
   INTERACTION ENGINE — 事件代理
================================================================ */
addEventListener('pointermove', e=>{ BGC.st.px=e.clientX; BGC.st.py=e.clientY; BGC.st.smx=e.clientX/innerWidth; BGC.st.smy=e.clientY/innerHeight;
},{passive:true});
document.addEventListener('pointerdown', e=>{ if(e.target.closest('.panel,.srcview,.themeMenu,.nav,.tourTip,#themeSheet,.utilityView,.help-popover')) return; BGC.ripple(e.clientX,e.clientY); },{passive:true});
let lastHov=0;
document.addEventListener('mouseover', e=>{ const c=e.target.closest('.card'); if(!c) return;
  const now=Date.now(); if(now-lastHov<160) return; lastHov=now;
  const r=c.getBoundingClientRect(); BGC.attract(r.left+r.width/2, r.top+r.height/2); });

