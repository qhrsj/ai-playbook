/* ================================================================
   HOME RENDERERS · retained legacy homes
================================================================ */
const HOME_RENDERERS={
 nebula(list){
  return `<section class="nb-hero wrap" style="max-width:1280px;margin:0 auto;padding-left:24px;padding-right:24px">
    <div><div class="nb-kicker">✦ ${esc(L('logo'))} · ${THEMES.nebula.hero.k}</div>
    <h1>${THEMES.nebula.hero.h1}</h1><p class="nb-desc">${THEMES.nebula.hero.d}</p>
    <span class="nb-hint" id="nbHint">${THEMES.nebula.hero.hint}</span></div>
    <div class="nb-core"><span class="ring" style="width:270px;height:270px"></span><span class="ring" style="width:180px;height:180px"></span>
    <span class="core">✦</span>
    <span class="nb-node" style="left:9%;top:16%"><i></i><b>28</b> ARCHIVES</span>
    <span class="nb-node" style="right:7%;top:38%"><i style="background:var(--g2);box-shadow:0 0 10px var(--g2)"></i><b>1200</b> SIGNALS</span>
    <span class="nb-node" style="left:16%;bottom:14%"><i style="background:var(--g3);box-shadow:0 0 10px var(--g3)"></i><b>97.7%</b> COMPRESSION</span></div>
   </section>
   <div class="wrap"><div class="nb-ctl">${catsHTML()}<div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">${quickHTML()}${sortHTML()}</div></div>
   ${rinfoHTML(list)}
   <section id="grid" class="nb-grid">${list.map((c,i)=>CARD_SKINS.nebula(c,i)).join('')}</section>
   ${emptyHTML()}</div>`;
 },
 arcane(list){
  return `<div class="ar-orn"><div class="t">咒 文 库</div><div class="line"></div></div>
   <div class="ar-title"><h1>《AI 母咒文典藏》</h1>
   <p class="prose">凡 <b>${LIB_STATS.cards} 卷</b>，采自 <b>${LIB_STATS.rawSources}</b> 条旧术，<br>去芜存菁，皆可抄录施用。</p></div>
   <div class="ar-ctl">${catsHTML()}</div>
   <div class="wrap"><div class="ar-meta">${quickHTML()}${sortHTML()}</div>
   ${rinfoHTML(list)}
   <section id="grid" class="ar-catalog">${list.map((c,i)=>CARD_SKINS.arcane(c,i)).join('')}</section>
   ${emptyHTML()}</div>`;
 },
 eastern(list){
  return `<div>
   <div class="ea-head"><div class="tm">母模板藏书阁</div><div class="rule"></div>
   <p class="pre">去繁存要，聚术成卷。<br>${LIB_STATS.rawSources} 条旧稿，最终整理为 ${LIB_STATS.cards} 卷可复用之术。</p>
   <div class="nums">${LIB_STATS.cards} 卷 · ${LIB_STATS.rawSources} 条旧稿 · 压缩率 ${LIB_STATS.compression}%</div></div>
   <div class="ea-ctl">${catsHTML()}</div>
   <div class="wrap"><div class="ea-meta">${quickHTML()}${sortHTML()}</div>
   ${rinfoHTML(list)}
   <section id="grid" class="ea-catalog">${list.map((c,i)=>CARD_SKINS.eastern(c,i)).join('')}</section>
   ${emptyHTML()}</div></div>`;
 },
 synlife(list){
  const ring=(v,max,color)=>{ const R=30, CIRC=2*Math.PI*R; return `<svg width="76" height="76" viewBox="0 0 76 76"><circle cx="38" cy="38" r="${R}" fill="none" stroke="color-mix(in srgb,var(--tx3) 25%,transparent)" stroke-width="5"/><circle cx="38" cy="38" r="${R}" fill="none" stroke="${color}" stroke-width="5" stroke-linecap="round" stroke-dasharray="${CIRC}" stroke-dashoffset="${(CIRC*(1-v/max)).toFixed(1)}"/><text x="38" y="44" text-anchor="middle" font-size="16" font-weight="800" fill="var(--tx)" font-family="var(--fn)">${v>=100?v:v}</text></svg>`; };
  return `<div class="wrap">
   <div class="sy-hero"><div><div class="nb-kicker" style="color:var(--hi);font:11px var(--fl);letter-spacing:3px;margin-bottom:14px">🧬 ${THEMES.synlife.hero.k}</div>
   <h1>${THEMES.synlife.hero.h1}</h1><p class="d">${THEMES.synlife.hero.d}</p>
   <div style="margin-top:16px"><span class="nb-hint" style="font:12px var(--fl);color:var(--tx3);border:1px dashed var(--line);border-radius:999px;padding:6px 14px">${THEMES.synlife.hero.hint}</span></div></div>
   <div class="sy-dna"><svg width="100%" height="100%" viewBox="0 0 400 230" preserveAspectRatio="xMidYMid slice">
   ${Array.from({length:16},(_,i)=>{ const x=30+i*24, ph=i*.55, y1=115+Math.sin(ph)*70, y2=115-Math.sin(ph)*70, rung=Math.cos(ph)>0?1:0.35;
   return `<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" stroke="color-mix(in srgb,var(--g2) ${rung*60}%,transparent)" stroke-width="2"/><circle cx="${x}" cy="${y1}" r="4.5" fill="var(--g1)" opacity=".85"/><circle cx="${x}" cy="${y2}" r="4.5" fill="var(--acc2)" opacity=".85"/>`; }).join('')}</svg></div></div>
   <div class="sy-rings"><div class="sy-ring">${ring(STATS.total,30,'var(--acc1)')}<div class="lb">GENOME TYPES</div></div>
   <div class="sy-ring">${ring(LIB_STATS.cards,Math.max(50,LIB_STATS.cards),'var(--g2)')}<div class="lb">STABLE GENOMES</div></div>
   <div class="sy-ring">${ring(LIB_STATS.rawSources,Math.max(1300,LIB_STATS.rawSources),'var(--acc2)')}<div class="lb">SOURCE STRANDS</div></div>
   <div class="sy-ring">${ring(LIB_STATS.compression,100,'var(--gold)')}<div class="lb">PURITY %</div></div></div>
   <div class="sy-ctl">${quickHTML()}<div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap">${catsHTML()}${sortHTML()}</div></div>
   ${rinfoHTML(list)}
   <section id="grid" class="sy-tray">${list.map((c,i)=>CARD_SKINS.synlife(c,i)).join('')}</section>
   ${emptyHTML()}</div>`;
 },
 museum(list){
  return `<div class="mu-hero wrap"><div class="exno">EXHIBITION 01 — PERMANENT COLLECTION</div>
   <h1>Museum<br>of <em>Intelligence</em></h1>
   <div class="row"><p class="desc"><b>${LIB_STATS.cards} works</b> from a corpus of <b>${LIB_STATS.rawSources.toLocaleString()} prompts</b>.<br>一场关于"可复用智能"的常设展：每件展品都是一条经整理压缩（${LIB_STATS.compression}%）与策展评估的母模板。</p>
   <div class="exinfo">CURATED 2026<br><b>${LIB_STATS.cards}</b> MASTER PROMPTS<br><b>${LIB_STATS.rawSources}</b> SOURCE WORKS<br>HALL ${ROMAN[+(APP_STATE.cat==='all'?1:APP_STATE.cat)-1]||'I'}</div></div></div>
   <hr class="mu-rule">
   <div class="wrap" style="max-width:1440px"><div class="mu-ctl">${catsHTML()}<div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap">${quickHTML()}${sortHTML()}</div></div></div>
   <div class="wrap" style="max-width:1440px">${rinfoHTML(list)}
   <section id="grid" class="mu-grid">${list.map((c,i)=>CARD_SKINS.museum(c,i)).join('')}</section>
   ${emptyHTML()}</div>`;
 },
 aurora(list){
  return `<div class="wrap">
   <div class="au-hero"><div><div style="font:11px var(--fl);letter-spacing:3px;color:var(--hi);margin-bottom:14px">🔭 ${THEMES.aurora.hero.k}</div>
   <h1>${THEMES.aurora.hero.h1}</h1><div class="au-readout">
   STABLE SIGNALS&nbsp;&nbsp;<b>${LIB_STATS.cards}</b><br>SOURCE ARCHIVE&nbsp;&nbsp;<b>${LIB_STATS.rawSources}</b><br>SIGNAL PURITY&nbsp;&nbsp;<b>${LIB_STATS.compression}%</b><br>STATUS&nbsp;&nbsp;<b>ALL NOMINAL</b></div></div>
   <div class="au-radar"><span class="c1"></span><span class="c2"></span><span class="c3"></span><span class="swp"></span>
   <span class="blip" style="left:30%;top:28%"><i></i>SIG-A</span><span class="blip" style="right:24%;top:42%"><i></i>SIG-B</span>
   <span class="blip" style="left:44%;bottom:20%"><i></i>SIG-C</span>
   <span style="position:absolute;left:14px;bottom:10px;font:9px var(--fl);letter-spacing:2px;color:var(--tx3)">OBS WINDOW 01 · LIVE</span></div></div>
   <div class="au-ctl">${quickHTML()}<div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap">${catsHTML()}${sortHTML()}</div></div>
   ${rinfoHTML(list)}
   <section id="grid" class="au-panels">${list.map((c,i)=>CARD_SKINS.aurora(c,i)).join('')}</section>
   ${emptyHTML()}</div>`;
 }
};

