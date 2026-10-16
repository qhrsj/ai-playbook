/* Development-log sync gate.
 *
 * Verifies that the six rendered devlog views are synchronised with the
 * current release phase declared in src/data/release.json. The DEVLOG_*
 * definitions live in src/js/08-detail-presentation.js between
 * `const DEVLOG_FEATURES` and `initDevlogTabs();`; we load that slice into a
 * sandboxed VM context (the same technique used by combo_sync_gate.cjs) and
 * assert on the real values plus the rendered innerHTML.
 *
 * Exits 0 when every assertion passes, 1 otherwise. Writes
 * reports/devlog-sync-gate-results.json. No third-party dependencies:
 * fs / path / vm / assert only.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');

function main() {
  const release = JSON.parse(read('src/data/release.json'));
  const phase = release.phase;
  const version = release.version;
  assert(/^P\d+$/.test(phase), 'release.phase must be an integer phase like P76, got ' + phase);

  const log = read('src/js/08-detail-presentation.js');
  const start = log.indexOf('const DEVLOG_FEATURES');
  const end = log.indexOf('\ninitDevlogTabs();');
  assert(start >= 0 && end > start, 'Could not locate DEVLOG_* definition block in 08-detail-presentation.js');
  const defs = log.slice(start, end);

  // Minimal DOM adapter: every selector returns a stable object so the render
  // helpers can write innerHTML/textContent without a real browser.
  const elements = new Map();
  function $(s) {
    if (!elements.has(s)) elements.set(s, { innerHTML: '', textContent: '', scrollTop: 0 });
    return elements.get(s);
  }
  const ctx = {
    $,
    console,
    RELEASE_MANIFEST: release,
    esc: s => String(s ?? ''),
    document: { querySelectorAll: () => [] },
  };
  vm.createContext(ctx);
  vm.runInContext(defs, ctx);

  // (1) FEATURES / BUGS / INTERNALS each carry at least one entry for the phase.
  const surfaces = {};
  for (const kind of ['FEATURES', 'BUGS', 'INTERNALS']) {
    const count = vm.runInContext(
      'DEVLOG_' + kind + '.filter(x=>x.phase===RELEASE_MANIFEST.phase).length',
      ctx,
    );
    assert(count >= 1, 'DEVLOG_' + kind + ' must contain at least one entry for ' + phase + ', found ' + count);
    surfaces[kind] = count;
  }

  // (2) TIMELINE has exactly one entry for the phase.
  const timelineForPhase = vm.runInContext(
    'DEVLOG_TIMELINE.filter(x=>x.phase===RELEASE_MANIFEST.phase).length',
    ctx,
  );
  assert.equal(timelineForPhase, 1, 'DEVLOG_TIMELINE must have exactly 1 entry for ' + phase + ', found ' + timelineForPhase);
  surfaces.TIMELINE = timelineForPhase;

  // (3) TIMELINE length == P-number + 1 (P0 is included).
  const timelineCount = vm.runInContext('DEVLOG_TIMELINE.length', ctx);
  const expectedTimelineCount = Number(phase.slice(1)) + 1;
  assert.equal(
    timelineCount,
    expectedTimelineCount,
    'DEVLOG_TIMELINE.length must equal ' + expectedTimelineCount + ' (phase ' + phase + '), found ' + timelineCount,
  );

  // (4) render the views and assert the current phase is present everywhere,
  //     and appears before the legacy P69 anchor in the aggregate view.
  assert(vm.runInContext('devlogIntegrity().ok', ctx), 'devlogIntegrity().ok must be true');
  vm.runInContext('renderDevlogViews()', ctx);
  const viewIds = ['#devAllDynamic', '#devFeatureStream', '#devBugStream', '#devInternalStream', '#devTimeline'];
  for (const id of viewIds) {
    assert($(id).innerHTML.includes(phase), id + ' innerHTML must contain current phase ' + phase);
  }
  const allHtml = $('#devAllDynamic').innerHTML;
  assert(
    allHtml.indexOf(phase) < allHtml.indexOf('P69'),
    '#devAllDynamic must list ' + phase + ' before the legacy P69 anchor (newest-first ordering)',
  );

  // (5) every DEVLOG_*.push must live before initDevlogTabs() so the appended
  //     records actually reach the first render.
  for (const type of ['FEATURES', 'BUGS', 'INTERNALS', 'TIMELINE']) {
    assert(
      log.lastIndexOf('DEVLOG_' + type + '.push(') < end,
      'DEVLOG_' + type + '.push must be declared before initDevlogTabs()',
    );
  }

  const report = {
    status: 'passed',
    version,
    phase,
    surfaces,
    timelineCount,
    expectedTimelineCount,
    source: 'src/js/08-detail-presentation.js',
    browserRun: false,
  };
  fs.writeFileSync(
    path.join(root, 'reports/devlog-sync-gate-results.json'),
    JSON.stringify(report, null, 2),
  );
  console.log(
    'Devlog sync gate passed: ' + version + ' / ' + phase +
    ' (features=' + surfaces.FEATURES + ', bugs=' + surfaces.BUGS +
    ', internals=' + surfaces.INTERNALS + ', timeline=' + timelineCount + ')',
  );
}

try {
  main();
} catch (e) {
  console.error(e && e.stack ? e.stack : e);
  process.exit(1);
}
