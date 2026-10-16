/* ================================================================
   BACKGROUND ENGINE（保留 v3：10 世界 Canvas）
================================================================ */
const BGC = (() => {
  const cv = document.getElementById('bgc'), ctx = cv.getContext('2d');
  let W=0,H=0,raf=0,running=false,slow=false;
  const st = {t:0, p:[], ripples:[], px:-9999, py:-9999, smx:0, smy:0, attract:null, colors:{}};
  const rnd=(a,b)=>a+Math.random()*(b-a);
  function size(){ const d=Math.min(devicePixelRatio||1,2); W=innerWidth; H=innerHeight; cv.width=W*d; cv.height=H*d; ctx.setTransform(d,0,0,d,0,0); }
  function colors(){ const cs=getComputedStyle(document.body); const g=k=>cs.getPropertyValue(k).trim();
    st.colors={a1:g('--acc1'),a2:g('--acc2'),tx:g('--tx'),tx3:g('--tx3'),gold:g('--gold'),hi:g('--hi'),bg:g('--bg')}; }
  function ripple(x,y){ if(ENV.RM) return; st.ripples.push({x,y,born:st.t}); if(st.ripples.length>5) st.ripples.shift(); }
  function attract(x,y){ if(ENV.MOBILE||ENV.RM) return; st.attract={x,y,until:st.t+1.4}; }
  const RUNES='ᚠᚢᚦᚨᚱᚲᛃᛇᛜᛟ✦❈';
  const CODE='01{<>/;=+#$%&ABCDEF';
  const MODS = {
   nebula:{n:76, spawn:n=>Array.from({length:n},()=>({x:Math.random(),y:Math.random(),z:rnd(.25,1),tw:rnd(0,6),vx:rnd(-.004,.004),vy:rnd(-.002,.002)})),
    draw(dt){ ctx.clearRect(0,0,W,H);
      const ox=(st.smx-.5)*22, oy=(st.smy-.5)*14;
      st.p.forEach((p,i)=>{ if(i<26){ p.x+=p.vx*dt*.06; p.y+=p.vy*dt*.06; if(p.x<0)p.x=1; if(p.x>1)p.x=0; if(p.y<0)p.y=1; if(p.y>1)p.y=0; }
        let x=p.x*W+ox*p.z, y=p.y*H+oy*p.z;
        if(st.attract && st.attract.until>st.t){ const dx=st.attract.x-x, dy=st.attract.y-y, d=Math.hypot(dx,dy); if(d<260){ x+=dx*.06*p.z; y+=dy*.06*p.z; } }
        const a=(.22+.5*Math.abs(Math.sin(st.t*1.3+p.tw)))*p.z;
        ctx.fillStyle=`rgba(255,255,255,${a.toFixed(3)})`; ctx.beginPath(); ctx.arc(x,y,p.z*1.5,0,7); ctx.fill(); });
      rp('ring',st.colors.a1,.5); }},
   anomaly:{n:0, spawn:()=>[], draw(dt){ ctx.clearRect(0,0,W,H);
      ctx.strokeStyle=hexA(st.colors.tx3,.13); ctx.lineWidth=1; ctx.beginPath();
      for(let x=0;x<W;x+=56){ctx.moveTo(x,0);ctx.lineTo(x,H);} for(let y=0;y<H;y+=56){ctx.moveTo(0,y);ctx.lineTo(W,y);} ctx.stroke();
      if(!ENV.MOBILE&&st.px>0){ const g=ctx.createRadialGradient(st.px,st.py,0,st.px,st.py,150);
        g.addColorStop(0,hexA(st.colors.gold,.07)); g.addColorStop(1,'transparent'); ctx.fillStyle=g; ctx.fillRect(st.px-150,st.py-150,300,300);
        ctx.strokeStyle=hexA(st.colors.gold,.18); ctx.beginPath(); ctx.arc(st.px,st.py,26+Math.sin(st.t*2)*3,0,7); ctx.stroke(); }
      rp('sweep',st.colors.gold,.6); }},
   arcane:{n:26, spawn:n=>Array.from({length:n},()=>({x:Math.random(),y:Math.random(),s:rnd(1,2.4),v:rnd(.006,.02)})),
    draw(dt){ ctx.clearRect(0,0,W,H);
      st.p.forEach(p=>{ p.y-=p.v*dt*.06; if(p.y<-.02){p.y=1.02;p.x=Math.random();}
        ctx.fillStyle=hexA(st.colors.gold,.35); ctx.beginPath(); ctx.arc(p.x*W,p.y*H,p.s,0,7); ctx.fill(); });
      if(!ENV.MOBILE){ ctx.textAlign='center'; ctx.textBaseline='middle';
        for(let i=0;i<12;i++){ const rx=(i%4)*.25+.125, ry=(Math.floor(i/4))*.3+.18;
          const x=rx*W, y=ry*H+Math.sin(st.t+i)*6; const d=Math.hypot(st.px-x,st.py-y); const gl=Math.max(0,1-d/220);
          ctx.font=`${16+gl*10}px serif`; ctx.fillStyle=hexA(st.colors.gold,.08+gl*.4); ctx.fillText(RUNES[i%RUNES.length],x,y); } }
      rp('circle',st.colors.gold,.5); }},
   cyber:{n:7, spawn:n=>Array.from({length:n},(_,i)=>({x:(i+.5)/n,y:rnd(-1,0),sp:rnd(.03,.08),cs:Array.from({length:14},()=>CODE[Math.floor(Math.random()*CODE.length)])})),
    draw(dt){ ctx.clearRect(0,0,W,H);
      ctx.strokeStyle=hexA(st.colors.a1,.07); ctx.beginPath();
      for(let x=0;x<W;x+=64){ctx.moveTo(x,0);ctx.lineTo(x,H);} for(let y=0;y<H;y+=64){ctx.moveTo(0,y);ctx.lineTo(W,y);} ctx.stroke();
      ctx.font='12px ui-monospace,monospace'; ctx.textAlign='left';
      st.p.forEach(c=>{ c.y+=c.sp*dt*.06; if(c.y>1.4){c.y=-.4;c.cs=c.cs.map(()=>CODE[Math.floor(Math.random()*CODE.length)]);}
        c.cs.forEach((ch,i)=>{ ctx.fillStyle=hexA(st.colors.a1,.14*(1-i/14)); ctx.fillText(ch, c.x*W, ((c.y+i*.035)%1.4-.2)*H); }); });
      if(!ENV.MOBILE&&st.px>0){ ctx.strokeStyle=hexA(st.colors.a1,.14); ctx.beginPath();
        ctx.moveTo(st.px,0);ctx.lineTo(st.px,H);ctx.moveTo(0,st.py);ctx.lineTo(W,st.py); ctx.stroke(); }
      rp('ping',st.colors.a1,.55); }},
   intel:{n:0, spawn:()=>[], draw(dt){ ctx.clearRect(0,0,W,H);
      const ox=(st.smx-.5)*10, oy=(st.smy-.5)*6;
      ctx.strokeStyle=hexA(st.colors.tx3,.12); ctx.lineWidth=1;
      for(let i=1;i<5;i++){ ctx.beginPath(); ctx.moveTo(0,H*i/5+oy); ctx.lineTo(W,H*i/5+oy); ctx.stroke(); }
      ctx.beginPath(); for(let i=0;i<4;i++){ ctx.ellipse(W*.5+ox,H*.5+oy, W*(.18+i*.13), H*(.1+i*.09),0,0,7); ctx.stroke(); }
      rp('stamp',st.colors.a1,.55); }},
   eastern:{n:0, spawn:()=>[], draw(dt){ ctx.clearRect(0,0,W,H);
      ctx.fillStyle=hexA(st.colors.tx3,.05);
      ctx.beginPath(); ctx.moveTo(0,H*.82); ctx.quadraticCurveTo(W*.25,H*.72,W*.5,H*.8); ctx.quadraticCurveTo(W*.75,H*.88,W,H*.78); ctx.lineTo(W,H); ctx.lineTo(0,H); ctx.fill();
      ctx.beginPath(); ctx.moveTo(0,H*.9); ctx.quadraticCurveTo(W*.4,H*.84,W,H*.92); ctx.lineTo(W,H); ctx.lineTo(0,H); ctx.fill();
      if(!ENV.MOBILE&&st.px>0){ const g=ctx.createRadialGradient(st.px,st.py,0,st.px,st.py,160);
        g.addColorStop(0,hexA(st.colors.tx,.035)); g.addColorStop(1,'transparent'); ctx.fillStyle=g; ctx.fillRect(st.px-160,st.py-160,320,320); }
      rp('ink',st.colors.tx,.14); }},
   synlife:{n:44, spawn:n=>Array.from({length:n},()=>({x:Math.random(),y:Math.random(),vx:rnd(-.01,.01),vy:rnd(-.01,.01),r:rnd(2,5),w:rnd(0,6)})),
    draw(dt){ ctx.clearRect(0,0,W,H);
      const ay=st.attract&&st.attract.until>st.t?st.attract:null;
      st.p.forEach(p=>{ p.x+=p.vx*dt*.06; p.y+=p.vy*dt*.06; p.w+=dt;
        const tx=ay?ay.x:st.px, ty=ay?ay.y:st.py;
        if((ay||!ENV.MOBILE)&&tx>0){ const dx=tx-p.x*W, dy=ty-p.y*H, d=Math.hypot(dx,dy); if(d<240&&d>30){ p.vx+=dx/d*.00003*dt; p.vy+=dy/d*.00003*dt; } }
        p.vx*=.999; p.vy*=.999;
        if(p.x<0||p.x>1)p.vx*=-1; if(p.y<0||p.y>1)p.vy*=-1;
        p.x=Math.max(0,Math.min(1,p.x)); p.y=Math.max(0,Math.min(1,p.y)); });
      ctx.strokeStyle=hexA(st.colors.a1,.1);
      for(let i=0;i<st.p.length;i++)for(let j=i+1;j<st.p.length;j++){ const a=st.p[i],b=st.p[j];
        const dx=(a.x-b.x)*W, dy=(a.y-b.y)*H; if(dx*dx+dy*dy<5600){ ctx.beginPath(); ctx.moveTo(a.x*W,a.y*H); ctx.lineTo(b.x*W,b.y*H); ctx.stroke(); } }
      st.p.forEach(p=>{ ctx.fillStyle=hexA(st.colors.a2,.3); ctx.beginPath(); ctx.arc(p.x*W,p.y*H,p.r+Math.sin(p.w)*1,0,7); ctx.fill();
        ctx.fillStyle=hexA(st.colors.hi,.5); ctx.beginPath(); ctx.arc(p.x*W,p.y*H,p.r*.4,0,7); ctx.fill(); });
      rp('divide',st.colors.a1,.4); }},
   y2k:{n:0, spawn:()=>[], draw(dt){ ctx.clearRect(0,0,W,H);
      ctx.fillStyle=hexA(st.colors.tx3,.18);
      for(let x=24;x<W;x+=24)for(let y=24;y<H;y+=24){ ctx.fillRect(x,y,1.6,1.6); }
      rp('pixel',st.colors.a1,.5); }},
   museum:{n:0, spawn:()=>[], draw(dt){ ctx.clearRect(0,0,W,H);
      st.smx += ((st.px>-1?st.px/W:.5)-st.smx)*.03; st.smy += ((st.py>-1?st.py/H:.4)-st.smy)*.03;
      const g=ctx.createRadialGradient(st.smx*W,st.smy*H*.8,0,st.smx*W,st.smy*H*.8,300);
      g.addColorStop(0,hexA(st.colors.hi,.09)); g.addColorStop(1,'transparent');
      ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
      rp('light',st.colors.hi,.35); }},
   aurora:{n:60, spawn:n=>Array.from({length:n},()=>({x:Math.random(),y:Math.random(),v:rnd(.01,.04),s:rnd(.8,1.8)})),
    draw(dt){ ctx.clearRect(0,0,W,H);
      st.p.forEach(p=>{ p.y+=p.v*dt*.012; if(p.y>1.02){p.y=-.02;p.x=Math.random();}
        ctx.fillStyle=`rgba(255,255,255,${(.25*p.s).toFixed(2)})`; ctx.beginPath(); ctx.arc(p.x*W,p.y*H,p.s,0,7); ctx.fill(); });
      const bands=[[st.colors.a1,64,.06,0],[st.colors.a2,44,.05,2.1],[st.colors.hi,26,.045,4.2]];
      bands.forEach(([col,wd,al,ph],bi)=>{ ctx.strokeStyle=hexA(col,al*(st.attract&&st.attract.until>st.t?1.5:1)); ctx.lineWidth=wd; ctx.lineCap='round'; ctx.beginPath();
        for(let x=-40;x<=W+40;x+=44){ const y=H*(.24+bi*.09)+Math.sin(x*.004+st.t*.35+ph)*(46+bi*14)+Math.sin(x*.0013-st.t*.2)*24+(st.smx-.5)*30;
          x===-40?ctx.moveTo(x,y):ctx.lineTo(x,y); }
        ctx.stroke(); });
      ctx.strokeStyle=hexA(st.colors.tx3,.2); ctx.beginPath(); ctx.moveTo(0,H*.82); ctx.lineTo(W,H*.82); ctx.stroke();
      rp('hex',st.colors.hi,.5); }}
  };
  function hexA(hex,a){ if(!hex) return `rgba(136,136,136,${a})`; hex=hex.trim();
    if(hex.startsWith('rgba')) return hex;
    if(hex.startsWith('#')){ let h=hex.slice(1); if(h.length===3)h=h.split('').map(c=>c+c).join('');
      const n=parseInt(h,16); return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${a})`; }
    return `rgba(136,136,136,${a})`; }
  function drawRipple(r){
    const age=st.t-r.born; if(age>1.1) return false;
    const k=age/1.1, rr=10+k*230, al=(1-k); const c=st.colors;
    switch(st.theme){
      case 'anomaly':{ ctx.strokeStyle=hexA(c.gold,al*.55); ctx.lineWidth=1.5; ctx.beginPath(); ctx.arc(r.x,r.y,rr*.6,0,7); ctx.stroke();
        ctx.save(); ctx.translate(r.x,r.y); ctx.rotate(k*2.4); ctx.strokeStyle=hexA(c.gold,al*.4);
        ctx.beginPath(); ctx.moveTo(-rr*.4,0); ctx.lineTo(rr*.4,0); ctx.stroke(); ctx.restore(); break; }
      case 'arcane':{ ctx.strokeStyle=hexA(c.gold,al*.5); ctx.lineWidth=1.4; ctx.beginPath(); ctx.arc(r.x,r.y,rr*.55,0,7); ctx.stroke();
        ctx.beginPath(); for(let i=0;i<5;i++){ const a1=-Math.PI/2+i*2.513+k, x=r.x+Math.cos(a1)*rr*.5, y=r.y+Math.sin(a1)*rr*.5, a2=a1+2.513;
          if(i===0)ctx.moveTo(x,y); ctx.lineTo(r.x+Math.cos(a2)*rr*.5, r.y+Math.sin(a2)*rr*.5); } ctx.stroke(); break; }
      case 'cyber':{ ctx.strokeStyle=hexA(c.a1,al*.6); ctx.lineWidth=1.5; const s=rr*.7; ctx.strokeRect(r.x-s,r.y-s,s*2,s*2);
        ctx.fillStyle=hexA(c.a1,al*.8); ctx.font='10px ui-monospace,monospace'; ctx.fillText('PING',r.x+s+4,r.y); break; }
      case 'intel':{ ctx.save(); ctx.translate(r.x,r.y); ctx.rotate(.12-k*.1); ctx.strokeStyle=hexA(c.a1,al*.5);
        ctx.lineWidth=2; const s=rr*.4; ctx.strokeRect(-s,-s,s*2,s*2); ctx.restore(); break; }
      case 'eastern':{ const g=ctx.createRadialGradient(r.x,r.y,0,r.x,r.y,rr); g.addColorStop(0,hexA(c.tx,al*.12)); g.addColorStop(1,'transparent');
        ctx.fillStyle=g; ctx.beginPath(); ctx.arc(r.x,r.y,rr,0,7); ctx.fill(); break; }
      case 'synlife':{ ctx.strokeStyle=hexA(c.a1,al*.5); ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.arc(r.x-rr*.18,r.y,rr*.4,0,7); ctx.stroke(); ctx.beginPath(); ctx.arc(r.x+rr*.18,r.y,rr*.4,0,7); ctx.stroke(); break; }
      case 'y2k':{ ctx.strokeStyle=hexA(c.a1,al*.6); ctx.lineWidth=2; const s=Math.round(rr/14)*14;
        ctx.strokeRect(r.x-s,r.y-s*.6,s*2,s*1.2); break; }
      case 'museum':{ ctx.strokeStyle=hexA(c.hi,al*.4); ctx.lineWidth=1.2; ctx.beginPath(); ctx.arc(r.x,r.y,rr*.5,0,7); ctx.stroke(); break; }
      case 'aurora':{ ctx.strokeStyle=hexA(c.hi,al*.55); ctx.lineWidth=1.4; ctx.beginPath();
        for(let i=0;i<=6;i++){ const a1=-Math.PI/2+i*1.047+k*.6, x=r.x+Math.cos(a1)*rr*.55, y=r.y+Math.sin(a1)*rr*.55;
          i===0?ctx.moveTo(x,y):ctx.lineTo(x,y); } ctx.closePath(); ctx.stroke(); break; }
      default:{ ctx.strokeStyle=hexA(c.a1,al*.5); ctx.lineWidth=1.5; ctx.beginPath(); ctx.arc(r.x,r.y,rr*.6,0,7); ctx.stroke(); }
    }
    return true;
  }
  function rp(){ for(let i=st.ripples.length-1;i>=0;i--){ if(!drawRipple(st.ripples[i])) st.ripples.splice(i,1); } }
  let last=0;
  function frame(ts){ if(!running) return;
    if(document.body.classList.contains('window-interacting')){last=ts;raf=requestAnimationFrame(frame);return;}
    const dt=Math.min(33, ts-last||16); last=ts; st.t+=dt/1000;
    ctx.globalAlpha = slow? .45 : 1;
    MODS[st.theme].draw(dt);
    ctx.globalAlpha = 1;
    if(ENV.RM){ running=false; return; }
    raf=requestAnimationFrame(frame); }
  function setTheme(t){ st.theme=t; colors(); st.p=MODS[t].spawn(Math.round((MODS[t].n||0)*(ENV.MOBILE?.5:1))); st.ripples=[];
    if(!running){ running=true; last=0; raf=requestAnimationFrame(frame); } }
  function setSlow(v){ slow=v; }
  addEventListener('resize',size);
  document.addEventListener('visibilitychange',()=>{ if(document.hidden){ running=false; cancelAnimationFrame(raf); } else if(!ENV.RM){ running=true; last=0; raf=requestAnimationFrame(frame); } });
  size();
  return { st, setTheme, ripple, attract, colors, setSlow };
})();

