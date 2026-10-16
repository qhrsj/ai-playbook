/* ================================================================
   CARD RENDERERS · retained legacy skins
================================================================ */
const CARD_SKINS={
 nebula:(c,i)=>{ const [name,em,color]=catInfo(c.catId); const feat=c.overall>=4.5;
  return `<article class="card nb-card ${feat?'feat':''}" style="--c:${color};--sp:${c.overall/5*100}%;animation-delay:${Math.min(i*35,400)}ms" data-id="${c.id}">
   <div class="aid"><b>ARCHIVE ${c.id}</b><span>SIG ${(c.overall*20).toFixed(0)}%</span></div>
   <div class="st">${em}</div><h3>${hl(c.name)}</h3><div class="sub">${name.toUpperCase()} · ${hl(c.sub)}</div>
   <div class="sig"></div></article>`; },
 arcane:(c,i)=>{ const [name,em,color]=catInfo(c.catId);
  return `<article class="card ar-entry" style="--c:${color};animation-delay:${Math.min(i*28,360)}ms" data-id="${c.id}">
   <div class="rune">${glyph(c.catId)}</div>
   <div class="body"><h3>${hl(c.name)}</h3><div class="school">${name}学派 · 卷号 ${c.id} · 稳定性 ${c.overall}</div><p>${hl(c.task)}</p></div>
   <span class="unroll">展开古卷</span></article>`; },
 eastern:(c,i)=>{ const [name,em,color]=catInfo(c.catId); const idx=DATA.indexOf(c);
  return `<article class="card ea-row" style="--c:${color};animation-delay:${Math.min(i*30,400)}ms" data-id="${c.id}">
   <span class="no">${cnNum(idx+1)}</span>
   <div class="body"><h3>${hl(c.name)}</h3><p>${hl(c.task)}</p><div class="cat">${name} · 品第 ${c.overall} · ${hl(c.sub)}</div></div>
   <span class="view">查 看</span></article>`; },
 synlife:(c,i)=>{ const [name,em,color]=catInfo(c.catId);
  return `<article class="card sy-tray-item" style="--c:${color};animation-delay:${Math.min(i*28,380)}ms" data-id="${c.id}">
   <div class="sid"><b>SAMPLE ${c.id}</b><span>STORAGE-0${(i%4)+1}</span></div>
   <h3><span class="dna">❍</span>${hl(c.name)}</h3><p>${hl(c.task)}</p>
   <div class="fit"><span>GENE FAMILY ${name}</span><span class="stab"><i style="width:${c.overall/5*100}%"></i></span><b>${c.overall}</b></div></article>`; },
 museum:(c,i)=>{ const [name,em,color]=catInfo(c.catId); const no=String(DATA.indexOf(c)+1).padStart(2,'0'); const big=c.overall>=4.5&&i<3;
  return `<article class="card mu-item ${big?'big':''}" style="--c:${color};animation-delay:${Math.min(i*30,400)}ms" data-id="${c.id}">
   <div class="no">${no}</div><div class="meta">CATALOG ${c.id} · ${ROMAN[+c.catId-1]||c.catId} · ${name}</div>
   <h3>${hl(c.name)}</h3><p class="cur">${hl(c.task)}</p><span class="lnk">View Exhibit</span></article>`; },
 aurora:(c,i)=>{ const [name,em,color]=catInfo(c.catId);
  return `<article class="card au-panel" style="--c:${color};animation-delay:${Math.min(i*28,380)}ms" data-id="${c.id}">
   <div class="ph"><b>SIG-${c.id.split('-')[1]}${c.id.split('-')[2]}</b><span>${glyph(c.catId)} ${name}</span></div>
   <h3>${hl(c.name)}</h3><p>${hl(c.task)}</p>
   <div class="pf"><span>QUALITY</span><span class="stab"><i style="width:${c.overall/5*100}%"></i></span><b>${c.overall}/5</b></div></article>`; }
};

