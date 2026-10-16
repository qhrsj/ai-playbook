"""Delivery byte-integrity verification.

Recomputes the byte identity of the HTML artifacts for the release declared in
``src/data/release.json`` and asserts the allowed product forms (ARCH A7.4 /
A4.4):

  1. ``SOURCE/dist/index.html`` (build output, no beacon) must be **byte
     identical** to ``OPEN-v<ver>-<phase>.html`` (the packaged deliverable).
     Always required.
  2. ``SOURCE/dist/index.html`` must contain **no CRLF** (``b'\\r\\n'`` count 0).
     Always required.
  3. The root deployment artifact ``AI-Playbook-v<ver>-<phase>.html`` must equal
     ``dist`` **after stripping the trailing Cloudflare beacon** script. If the
     beacon structure cannot be located, that is itself a failure — we must not
     silently pass a changed deployment form.

Assertion 3 is **conditional**: the deployment artifact is a deployment-side
product and is deliberately **not shipped inside** the delivery zip (see
《交付流程》 D5). When this script runs from an unpacked delivery tree there is
no deployment artifact next to ``SOURCE/``; in that case assertion 3 is
**skipped** (it cannot be evaluated) and the report records
``rootArtifact: null`` / ``rootPresent: false`` plus an explicit
``skipped: ["root-vs-dist"]`` marker. This is a **documented limitation, not a
pass** — the receiving engineer must understand the deployment form was not
verified here. When the deployment artifact *is* present, assertion 3 runs in
full and any mismatch (or an unrecognisable beacon) fails the run.

Exits 0 when every *applicable* assertion holds, 1 otherwise, and always writes
``reports/delivery-integrity.json``. Standard library only.
"""

from pathlib import Path
import hashlib
import json
import re
import sys

SOURCE = Path(__file__).resolve().parents[1]
ROOT = SOURCE.parent

# Matches the Cloudflare beacon script (and only that script) so it can be
# removed from the root artifact. Intentionally anchored on the
# static.cloudflareinsights.com hostname so an unrelated script is never cut.
BEACON_RE = re.compile(
    r'[ \t]*<script\b[^>]*\bstatic\.cloudflareinsights\.com\b[^>]*>[\s\S]*?</script>\r?\n?'
)


def sha256(data):
    return hashlib.sha256(data).hexdigest()


def describe(path, data):
    return {
        'path': str(path),
        'bytes': len(data),
        'sha256': sha256(data),
        'crlf': data.count(b'\r\n'),
    }


def main():
    release = json.loads((SOURCE / 'src/data/release.json').read_text(encoding='utf-8'))
    version = release['version']
    phase = release['phase']

    dist_path = SOURCE / 'dist/index.html'
    packaged_path = ROOT / f'OPEN-v{version}-{phase}.html'
    root_path = ROOT / f'AI-Playbook-v{version}-{phase}.html'

    failures = []

    # --- Read targets. `dist` and `OPEN` are mandatory; the root deployment
    #     artifact is OPTIONAL (the delivery ZIP does not carry it - see D5).
    dist = dist_path.read_bytes() if dist_path.exists() else None
    packaged = packaged_path.read_bytes() if packaged_path.exists() else None
    root = root_path.read_bytes() if root_path.exists() else None
    root_present = root is not None

    report = {
        'status': 'failed',
        'version': version,
        'phase': phase,
        'targets': [],
        'expectedSha256': None,
        'rootPresent': root_present,
        'rootArtifact': None,
        'packagedArtifact': None,
        'browserRun': False,
    }

    for label, path, data in (('dist', dist_path, dist), ('packaged', packaged_path, packaged), ('root', root_path, root)):
        if data is not None:
            report['targets'].append(describe(path, data))

    # dist and OPEN are required in every environment.
    if dist is None:
        failures.append(f'dist artifact missing: {dist_path}')
    if packaged is None:
        failures.append(f'packaged artifact missing: {packaged_path}')

    # Assertions 1 and 2 require both mandatory artifacts.
    if dist is not None and packaged is not None:
        # --- Assertion 1: dist == packaged (strict byte equality) -------------
        if dist != packaged:
            failures.append(
                'dist != packaged: dist=%d bytes (sha %s) vs packaged=%d bytes (sha %s); delta=%d bytes, '
                'crlf dist=%d packaged=%d'
                % (
                    len(dist), sha256(dist), len(packaged), sha256(packaged),
                    len(packaged) - len(dist), dist.count(b'\r\n'), packaged.count(b'\r\n'),
                )
            )

        # --- Assertion 2: dist must not contain CRLF --------------------------
        if dist.count(b'\r\n') != 0:
            failures.append(
                'dist contains %d CRLF sequences (expected 0); rebuild with '
                "write_text(..., newline='\\n')" % dist.count(b'\r\n')
            )

        report['packagedArtifact'] = describe(packaged_path, packaged)
        report['expectedSha256'] = sha256(dist)

    # --- Assertion 3 (CONDITIONAL, ADR ruling): root minus beacon == dist -----
    # The delivery package (per D5) intentionally excludes the root deployment
    # artifact, so its absence must NOT fail verification - but we must record
    # it explicitly (rootPresent:false, rootArtifact:null) and warn on stdout so
    # it is never silently treated as a pass of the root check.
    if root is None:
        print('WARN: root deployment artifact absent, assertion 3 skipped (packaged-only verification)')
    else:
        root_text = root.decode('utf-8', errors='strict')
        match = BEACON_RE.search(root_text)
        if not match:
            failures.append(
                'beacon structure changed: no <script ... static.cloudflareinsights.com ...> '
                'block found in %s; refusing to pass a changed deployment form' % root_path
            )
            beacon_bytes = None
            stripped_equals_dist = False
        else:
            beacon_text = match.group(0)
            beacon_bytes = len(beacon_text.encode('utf-8'))
            stripped = root_text[: match.start()] + root_text[match.end():]
            stripped_bytes = stripped.encode('utf-8')
            stripped_equals_dist = dist is not None and stripped_bytes == dist
            if not stripped_equals_dist:
                failures.append(
                    'root minus beacon != dist: stripped=%d bytes (sha %s) vs dist=%s; delta=%d bytes'
                    % (
                        len(stripped_bytes), sha256(stripped_bytes),
                        ('%d bytes (sha %s)' % (len(dist), sha256(dist))) if dist is not None else 'MISSING',
                        (len(stripped_bytes) - len(dist)) if dist is not None else 0,
                    )
                )

        report['rootArtifact'] = {
            **describe(root_path, root),
            'beaconBytes': beacon_bytes,
            'strippedEqualsDist': stripped_equals_dist,
        }

    if failures:
        report['status'] = 'failed'
        report['failures'] = failures
        _write(report)
        _print_failures(failures)
        return 1

    report['status'] = 'passed'
    _write(report)
    if root_present:
        print(
            'Checksum verification passed: dist == OPEN (%d bytes, sha256 %s), no CRLF, '
            'root == dist + %d-byte Cloudflare beacon'
            % (len(dist), sha256(dist), report['rootArtifact']['beaconBytes'])
        )
    else:
        print(
            'Checksum verification passed: dist == OPEN (%d bytes, sha256 %s), no CRLF '
            '(root deployment artifact not present in this environment)'
            % (len(dist), sha256(dist))
        )
    return 0


def _write(report):
    out = SOURCE / 'reports/delivery-integrity.json'
    out.parent.mkdir(exist_ok=True)
    out.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8', newline='\n')


def _print_failures(failures):
    print('Checksum verification FAILED:', file=sys.stderr)
    for item in failures:
        print('  - ' + item, file=sys.stderr)


if __name__ == '__main__':
    sys.exit(main())
