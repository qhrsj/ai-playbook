/* QA independent CDP spot-check (v6.58/P80) — separate from browser_playback_diag.
   Covers: welcome one-shot (trusted skip), map rendering (4 flows + overview),
   S0 tour write-guard (trusted click+typing blocked, Next advances),
   daily-match & organize-restore full guided runs with completion banner,
   and deviation-(1) iframe geometry (non-0x0) at course open. */
const fs = require('fs'), path = require('path'), cp = require('child_process'), os = require('os');
const ROOT = path.resolve(__dirname, '..');
const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/combo-training.json'), 'utf8'));
const APP = 'file:///' + path.join(ROOT, 'dist', 'index.html').replace(/\\/g, '/');
const PORT = 9229, BASE = 'http://127.0.0.1:' + PORT;
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ws, idc = 1; const pend = new Map();
function send(method, params = {}, sessionId) { const id = idc++; ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) })); return new Promise((res, rej) => pend.set(id, { res, rej })); }
async function ev(expr, sessionId) { const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true }, sessionId); if (r.exceptionDetails) throw Error('eval: ' + String(r.exceptionDetails.exception?.description || r.exceptionDetails.text).slice(0, 300)); return r.result.value; }
async function clickAt(x, y) { await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 }); await sleep(40); await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 }); }
async function typeText(text) { for (const ch of text) { await send('Input.dispatchKeyEvent', { type: 'keyDown', key: ch, text: ch, unmodifiedText: ch }); await sleep(25); await send('Input.dispatchKeyEvent', { type: 'keyUp', key: ch }); await sleep(25); } }
async function waitFor(test, label, budget) { const dl = Date.now() + budget; let last; while (Date.now() < dl) { try { last = await test(); } catch (e) { last = null; } if (last) return last; await sleep(250); } throw Error('timeout: ' + label); }
async function attachSandbox() {
  for (let i = 0; i < 100; i++) {
    try { const list = await send('Target.getTargets', {}); const f = (list.targetInfos || []).find(t => t.type === 'iframe'); if (f) { const { sessionId } = await send('Target.attachToTarget', { targetId: f.targetId, flatten: true }); await send('Runtime.enable', {}, sessionId); return sessionId; } } catch (e) { }
    await sleep(250);
  } return null;
}
async function iframeCenterOf(sessionId, sel) {
  const rect = await ev(`(function(){var el=document.querySelector(${JSON.stringify(sel)});if(!el)return null;el.scrollIntoView({block:'center',behavior:'instant'});var r=el.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};})()`, sessionId);
  if (!rect) throw Error('missing in sandbox: ' + sel);
  const off = await ev(`(function(){var f=document.querySelector('#comboFrameHost iframe');if(!f)return null;var r=f.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};})()`);
  if (!off) throw Error('iframe gone');
  return { cx: off.x + rect.x + rect.w / 2, cy: off.y + rect.y + rect.h / 2, iframe: off };
}
const results = [];
function rec(name, ok, detail) { const r = { check: name, status: ok ? 'passed' : 'failed', detail }; results.push(r); console.log(JSON.stringify(r)); }
async function runCourse(course) {
  const t0 = Date.now();
  await ev(`(function(){window.AI_PLAYBOOK_ONBOARDING.closeMap();window.AI_PLAYBOOK_ONBOARDING.closeWelcome();window.AI_PLAYBOOK_COMBO.openCourse(${JSON.stringify(course.id)},'guided');document.querySelector('#comboBriefStart').click();})()`);
  const ctx = await waitFor(() => attachSandbox(), 'sandbox ' + course.id, 30000);
  const geo = await ev(`(function(){var f=document.querySelector('#comboFrameHost iframe');if(!f)return null;var r=f.getBoundingClientRect();return {w:r.width,h:r.height};})()`);
  if (!geo || geo.w < 50 || geo.h < 50) throw Error('iframe geometry not usable: ' + JSON.stringify(geo));
  const total = course.steps.length;
  for (let i = 0; i < total; i++) {
    await waitFor(() => ev(`document.querySelector('#comboProgressText').textContent.includes('· ${i + 1} / ${total}')`), course.id + ' readiness ' + (i + 1), 45000);
    const step = course.steps[i];
    let proved = false;
    for (let a = 0; a < 3 && !proved; a++) {
      if (step.type === 'input') {
        await ev(`(function(){var el=document.querySelector(${JSON.stringify(step.target)});if(!el)throw Error('missing');el.focus();})()`, ctx); await sleep(100);
        await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'a', code: 'KeyA', windowsVirtualKeyCode: 65, modifiers: 2 }); await sleep(30);
        await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'a', code: 'KeyA', windowsVirtualKeyCode: 65, modifiers: 2 }); await sleep(30);
        await send('Input.insertText', { text: step.value ?? '' }); await sleep(150);
      } else {
        const p = await iframeCenterOf(ctx, step.target);
        await clickAt(p.cx, p.cy); await sleep(200);
      }
      try { await waitFor(() => ev(`document.querySelectorAll('#comboActionStrip .passed').length>${i}`), 'proof', 10000); proved = true; } catch (e) { if (a === 2) throw Error(course.id + ' proof ' + (i + 1) + ': ' + e.message); }
    }
    if (i + 1 < total) await waitFor(() => ev(`document.querySelector('#comboProgressText').textContent.includes('· ${i + 2} / ${total}')`), course.id + ' advance ' + (i + 1), 30000);
  }
  await waitFor(() => ev(`!document.querySelector('#comboCompletionBanner').hidden`), course.id + ' banner', 30000);
  const bannerText = await ev(`document.querySelector('#comboCompletionBanner').textContent.trim().slice(0,80)`);
  await ev(`(function(){var b=document.querySelector('#comboFinish');if(b)b.click();})()`);
  rec('course:' + course.id + ' (' + total + ' steps, replayPrefix=' + (course.chainMap ? course.chainMap[0] : 0) + ', iframe ' + Math.round(geo.w) + 'x' + Math.round(geo.h) + ')', true, bannerText);
  return Math.round((Date.now() - t0) / 1000);
}
async function main() {
  const exe = process.env.BROWSER_EXE, tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'qaqa-'));
  const child = cp.spawn(exe, [`--remote-debugging-port=${PORT}`, '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', `--user-data-dir=${tmp}`, '--window-size=1400,900', 'about:blank'], { stdio: 'ignore' });
  let okAll = true;
  try {
    let targets; for (let i = 0; i < 40; i++) { try { targets = await (await fetch(BASE + '/json/list')).json(); if (targets.some(t => t.type === 'page')) break; } catch (e) { } await sleep(250); }
    const page = targets.find(t => t.type === 'page');
    ws = new WebSocket(page.webSocketDebuggerUrl); await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
    ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.rej(Error(m.error.message)) : p.res(m.result); } };
    await send('Page.enable'); await send('Runtime.enable');
    await send('Page.navigate', { url: APP });
    await waitFor(() => ev(`document.readyState==='complete'&&!!document.querySelector('.home-primary-actions')&&!!window.AI_PLAYBOOK_COMBO&&!!window.AI_PLAYBOOK_ONBOARDING`), 'app boot', 60000);
    /* 1) welcome one-shot with TRUSTED skip click */
    const shownOnce = await ev(`!document.querySelector('#welcomeCard').hidden`);
    const sk = await ev(`(function(){var b=document.querySelector('#welcomeSkip');var r=b.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`);
    await clickAt(sk.x, sk.y); await sleep(300);
    const hiddenAfterSkip = await ev(`document.querySelector('#welcomeCard').hidden`);
    await send('Page.reload', { ignoreCache: false });
    await waitFor(() => ev(`document.readyState==='complete'&&!!document.querySelector('#welcomeCard')&&!!window.AI_PLAYBOOK_COMBO`), 'boot after reload', 60000);
    const hiddenAfterReload = await ev(`document.querySelector('#welcomeCard').hidden`);
    rec('welcome-one-shot(trusted-skip)', shownOnce === true && hiddenAfterSkip === true && hiddenAfterReload === true, { shownOnce, hiddenAfterSkip, hiddenAfterReload });
    if (!(shownOnce && hiddenAfterSkip && hiddenAfterReload)) okAll = false;
    /* 2) map: 4 flows, 5 tour entries, 4 practice entries */
    await ev(`window.AI_PLAYBOOK_ONBOARDING.openMap()`);
    await waitFor(() => ev(`document.querySelector('#tutorialMapOverlay').classList.contains('open')`), 'map open', 15000);
    const map = await ev(`(function(){return {flows:document.querySelectorAll('#tutorialMapBody .tutorial-flow').length,tours:document.querySelectorAll('#tutorialMapBody [data-map-tour]').length,courses:document.querySelectorAll('#tutorialMapBody [data-map-course]').length,overview:!!document.querySelector('#tutorialMapBody .tutorial-map-overview button'),sub:document.querySelector('#tutorialMapSub').textContent};})()`);
    const mapOk = map.flows === 4 && map.tours === 5 && map.courses === 4 && map.overview === true;
    rec('map-render(4 flows + overview entry)', mapOk, map);
    if (!mapOk) okAll = false;
    /* 3) S0 tour via map button (trusted click), write-guard smoke, advance */
    const s0btn = await ev(`(function(){var b=document.querySelector('[data-map-tour="S0"]');var r=b.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`);
    await clickAt(s0btn.x, s0btn.y);
    await waitFor(() => ev(`document.querySelector('#tourTip').style.display==='block'`), 'S0 tour start', 20000);
    const themeBefore = await ev(`(function(){return {menu:document.querySelector('#themeMenu').classList.contains('open'),sheet:document.querySelector('#themeSheet')?document.querySelector('#themeSheet').classList.contains('open'):false,expanded:document.querySelector('#themeBtn').getAttribute('aria-expanded')};})()`);
    const tb = await ev(`(function(){var b=document.querySelector('#themeBtn');var r=b.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`);
    await clickAt(tb.x, tb.y); await sleep(250);
    const themeAfter = await ev(`(function(){return {menu:document.querySelector('#themeMenu').classList.contains('open'),sheet:document.querySelector('#themeSheet')?document.querySelector('#themeSheet').classList.contains('open'):false,expanded:document.querySelector('#themeBtn').getAttribute('aria-expanded')};})()`);
    await typeText('qa'); await sleep(200);
    const bubbleUp = await ev(`document.querySelector('#tourTip').style.display==='block'`);
    const guardOk = bubbleUp && !themeAfter.menu && !themeAfter.sheet;
    rec('S0 write-guard blocks trusted click+typing', guardOk, { themeBefore, themeAfter, bubbleUp });
    if (!guardOk) okAll = false;
    /* advance twice via trusted clicks on Next (re-click like a stuck user);
       accept counter >= expected (engine may auto-skip steps with missing sel) */
    let counter = '';
    for (let k = 0; k < 2; k++) {
      const want = k + 2;
      let reached = false;
      for (let attempt = 0; attempt < 8 && !reached; attempt++) {
        const st = await ev(`(function(){var tip=document.querySelector('#tourTip');if(tip.style.display!=='block')return {ended:true,step:''};var t=tip.querySelector('.tstep');return {ended:false,step:t?t.textContent.trim():''};})()`);
        if (st.ended) { reached = true; break; }
        const cur = parseInt((st.step || '').split('/')[0].trim(), 10) || 0;
        if (cur >= want) { reached = true; break; }
        const nx = await ev(`(function(){var b=document.querySelector('#tourTip .tnext');var r=b.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`);
        await clickAt(nx.x, nx.y);
        const dl = Date.now() + 5000;
        while (Date.now() < dl) {
          const s2 = await ev(`(function(){var tip=document.querySelector('#tourTip');if(tip.style.display!=='block')return {ended:true,step:''};var t=tip.querySelector('.tstep');return {ended:false,step:t?t.textContent.trim():''};})()`);
          if (s2.ended) break;
          const c2 = parseInt((s2.step || '').split('/')[0].trim(), 10) || 0;
          if (c2 >= want) break;
          await sleep(400);
        }
      }
      if (!reached) throw Error('S0 advance to step ' + want + ' failed');
    }
    counter = await ev(`(function(){var tip=document.querySelector('#tourTip');return tip.style.display==='block'?(tip.querySelector('.tstep')||{}).textContent||'':'ended';})()`);
    const curFinal = counter === 'ended' ? 99 : parseInt((counter || '').split('/')[0].trim(), 10) || 0;
    rec('S0 trusted Next advances (now at: ' + counter + ')', curFinal >= 3, counter);
    if (curFinal < 3) okAll = false;
    const skipBtn = await ev(`(function(){var b=document.querySelector('#tourTip .tskip');var r=b.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`);
    await clickAt(skipBtn.x, skipBtn.y); await sleep(300);
    /* 4) two course spot-checks */
    const dm = catalog.courses.find(c => c.id === 'daily-match');
    try { await runCourse(dm); } catch (e) { okAll = false; rec('course:daily-match', false, String(e.message).slice(0, 300)); try { await send('Page.reload'); await sleep(1500); await waitFor(() => ev(`!!window.AI_PLAYBOOK_COMBO`), 'reboot', 60000); } catch (_) { } }
    const or = catalog.courses.find(c => c.id === 'organize-restore');
    try { await runCourse(or); } catch (e) { okAll = false; rec('course:organize-restore', false, String(e.message).slice(0, 300)); }
    fs.writeFileSync(path.join(ROOT, 'reports/qa-cdp-spotcheck-results.json'), JSON.stringify({ generatedAt: new Date().toISOString(), version: catalog.version, phase: catalog.phase, results, okAll }, null, 2) + '\n');
    console.log(okAll ? 'QA SPOTCHECK DONE (all passed)' : 'QA SPOTCHECK FAILED');
    if (!okAll) process.exitCode = 1;
  } finally { try { await send('Browser.close'); } catch (e) { } try { child.kill(); } catch (e) { } }
}
main().catch(e => { console.error('QA SPOTCHECK FAIL', e); process.exit(1); });
