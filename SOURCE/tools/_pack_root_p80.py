# -*- coding: utf-8 -*-
"""Build the v6.58/P80 root deployment artifacts (OPEN + beacon-carrying root)."""
from pathlib import Path
root = Path(__file__).resolve().parents[2]
dist = (root / 'SOURCE/dist/index.html').read_bytes()
(root / 'OPEN-v6.58-P80.html').write_bytes(dist)
beacon = ('<script type="module" src="https://static.cloudflareinsights.com/beacon.min.js/'
          'v4bc70e2c01a94c73b74392e4234840661791215815920" '
          'integrity="sha512-L0ha0OXavK/8okipN9F8BtP84dg9DUhPERbBXzwI6dgTA55d2+yweo3pn5CSFYs45/'
          'r8md2+xvUPtTdvTNRfjA==" '
          "data-cf-beacon='{\"version\":\"2024.11.0\",\"token\":\"b1c37052cca244fca1a2011659a0ad0a\",\"r\":1,\"spa\":2}' "
          'crossorigin="anonymous"></script>')
text = dist.decode('utf-8')
assert text.count('</body>') == 1
deploy = text.replace('</body>', beacon + '\n</body>').encode('utf-8')
(root / 'AI-Playbook-v6.58-P80.html').write_bytes(deploy)
print('root artifacts written', len(dist), len(deploy))
