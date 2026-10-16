/* Tutorial coverage gate.
 *
 * Focused on the three-way consistency between the course catalog
 * (src/data/combo-training.json), the generated manual (TUTORIAL-v<version>.md)
 * and the coverage table (TUTORIAL_COVERAGE in
 * src/js/15-scratchpad-reading-boot.js). Version/phase identity is covered by
 * combo_sync_gate.cjs; this gate deliberately does NOT re-assert the log views
 * or the release.sources vs source-catalog count (the two figures use different
 * accounting definitions, see ARCH D3).
 *
 * Exits 0 when every assertion passes, 1 otherwise. Writes
 * reports/tutorial-coverage-gate-results.json. No third-party dependencies:
 * fs / path / vm / assert only.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');

const VALID_TYPES = ['click', 'input', 'key'];
const OVERVIEW_KEYS = ['purpose', 'when', 'result', 'prerequisites', 'mechanism', 'boundary'];

function main() {
  const release = JSON.parse(read('src/data/release.json'));
  const version = release.version;
  const phase = release.phase;
  const cat = JSON.parse(read('src/data/combo-training.json'));

  // (1) catalog version/phase identity (mirrors combo_sync_gate L6, kept minimal).
  assert.equal(cat.version, release.version, 'combo-training.version must equal release.version');
  assert.equal(cat.phase, release.phase, 'combo-training.phase must equal release.phase');

  // (2) every course declares group/goal/steps and a fully populated overview.
  //     P80: the observe type is retired from courses (content moved to tours);
  //     the coverage gate asserts the negative as well as the positive.
  assert(Array.isArray(cat.courses) && cat.courses.length === 33, 'combo-training.courses must hold the 33 v6.59 courses');
  let stepCount = 0;
  const ids = new Set();
  for (const course of cat.courses) {
    const label = 'course ' + (course.id || course.group || '?');
    assert(course.group && String(course.group).length > 0, label + ' must have a non-empty group');
    assert(course.goal && String(course.goal).length > 0, label + ' must have a non-empty goal');
    assert(Array.isArray(course.steps) && course.steps.length > 0, label + ' must have a non-empty steps array');
    assert(course.overview && typeof course.overview === 'object', label + ' must have an overview object');
    for (const key of OVERVIEW_KEYS) {
      assert(
        typeof course.overview[key] === 'string' && course.overview[key].length > 0,
        label + ' overview.' + key + ' must be a non-empty string',
      );
    }
    for (const step of course.steps) {
      const sl = label + ' step ' + (step.id || '?');
      for (const field of ['id', 'type', 'target', 'instruction', 'why', 'check', 'success']) {
        assert(step[field] && String(step[field]).length > 0, sl + ' must have a non-empty ' + field);
      }
      assert(VALID_TYPES.includes(step.type), sl + ' type must be one of ' + VALID_TYPES.join('/') + ', got ' + step.type);
      assert(step.type !== 'observe', sl + ': observe steps were retired from courses in P80');
      assert(!ids.has(step.id), sl + ' id "' + step.id + '" is not globally unique');
      ids.add(step.id);
      stepCount += 1;
    }
  }

  // (3) every step.instruction must appear verbatim in the generated manual,
  //     and the manual must carry the five tour script titles (three-layer manual).
  const tutorialFile = 'TUTORIAL-v' + version + '.md';
  const tutorial = read(tutorialFile);
  for (const course of cat.courses) {
    for (const step of course.steps) {
      assert(
        tutorial.includes(step.instruction),
        'step ' + step.id + ' instruction is missing from ' + tutorialFile,
      );
    }
  }
  assert(Array.isArray(cat.tours) && cat.tours.length === 5, 'combo-training.tours must hold the 5 v6.58 scripts');
  for (const tour of cat.tours) {
    assert(tutorial.includes(tour.title), 'tour ' + tour.id + ' title is missing from ' + tutorialFile);
  }
  assert.equal(stepCount, 130, 'P80 locks the operation count at 130 (29 observe points moved to tours)');

  // (4) coverage table consistency.
  //
  // NOTE (deviation from ARCH A4.3 clause 5): the design asked us to assert
  // `TUTORIAL_COVERAGE key count === Number(phase.slice(1)) + 1`. That equation
  // cannot hold on any real baseline: TUTORIAL_COVERAGE is keyed by *version*
  // (v6.2 … v6.54, with gaps) not by *phase*. At the P76 baseline there are 52
  // version keys while the formula yields 77 — so the literal assertion would
  // fail the untouched baseline. We therefore keep the invariants that actually
  // guard the release: the current version key must exist and every coverage
  // bucket must be a non-empty list. The raw key count is still recorded in the
  // report for traceability (see code summary / REVIEW).
  const boot = read('src/js/15-scratchpad-reading-boot.js');
  const m = boot.match(/const TUTORIAL_COVERAGE=\{([\s\S]*?)\n\};/);
  assert(m, 'Could not locate TUTORIAL_COVERAGE definition in 15-scratchpad-reading-boot.js');
  const coverageKeys = [...m[1].matchAll(/'v[\d.]+':/g)].map(x => x[0].slice(1, -2));
  assert(coverageKeys.includes('v' + version), "TUTORIAL_COVERAGE must contain a 'v" + version + "' key");
  const bootCtx = {};
  vm.createContext(bootCtx);
  vm.runInContext('const TUTORIAL_COVERAGE={' + m[1] + '\n};this.__keys=Object.keys(TUTORIAL_COVERAGE);this.__map=TUTORIAL_COVERAGE;', bootCtx);
  const emptyBuckets = vm
    .runInContext('Object.entries(TUTORIAL_COVERAGE).filter(([k,v])=>!Array.isArray(v)||v.length===0).map(([k])=>k)', bootCtx);
  assert.equal(
    emptyBuckets.length,
    0,
    'TUTORIAL_COVERAGE buckets must be non-empty arrays; empty/invalid: ' + emptyBuckets.join(', '),
  );
  const coverageKeyCount = vm.runInContext('Object.keys(TUTORIAL_COVERAGE).length', bootCtx);
  assert.equal(coverageKeyCount, coverageKeys.length, 'TUTORIAL_COVERAGE key count mismatch between regex and VM parse');

  // (5) explicit negative guard: the two source-count definitions must not be
  //     cross-asserted (ARCH D3). The gate records them for the report only.
  // (No assertion here by design.)

  const report = {
    status: 'passed',
    version,
    phase,
    courses: cat.courses.length,
    steps: stepCount,
    coverageKeys: coverageKeys.length,
    coverageKeyCountNote:
      'TUTORIAL_COVERAGE is keyed by version, not phase; count is recorded but not asserted against phase (see ARCH A4.3 deviation).',
    emptyModules: 0,
    tutorialFile,
    browserRun: false,
  };
  fs.writeFileSync(
    path.join(root, 'reports/tutorial-coverage-gate-results.json'),
    JSON.stringify(report, null, 2),
  );
  console.log(
    'Tutorial coverage gate passed: ' + version + ' / ' + phase +
    ' (' + cat.courses.length + ' courses, ' + stepCount + ' steps, ' +
    coverageKeys.length + ' coverage keys)',
  );
}

try {
  main();
} catch (e) {
  console.error(e && e.stack ? e.stack : e);
  process.exit(1);
}
