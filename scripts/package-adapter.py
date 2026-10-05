"""Package an optional adapter with target and adapter versions in the filename."""
import hashlib
import json
import sys
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

if len(sys.argv) != 2:
    raise SystemExit('Usage: python scripts/package-adapter.py compat/<adapter>')
root = Path(sys.argv[1]).resolve()
boot = json.loads((root / 'boot.json').read_text(encoding='utf-8'))
dependency = boot['dependenceInfo'][0]
assert dependency['version'].startswith('='), 'Adapter target must be an exact version'
target_version = dependency['version'].removeprefix('=')
dist = root / 'dist'
dist.mkdir(exist_ok=True)
target = dist / f"{boot['name']}-{dependency['modName']}-{target_version}-v{boot['version']}.mod.zip"
with ZipFile(target, 'w', ZIP_DEFLATED) as out:
    for name in ['boot.json'] + [name for field in ['styleFileList','scriptFileList','scriptFileList_inject_early','tweeFileList','additionFile'] for name in boot.get(field, [])]:
        out.write(root / name, name)
with ZipFile(target) as out:
    assert out.testzip() is None
    assert json.loads(out.read('boot.json')) == boot
    assert all(out.read(name) == (root / name).read_bytes() for name in out.namelist())
digest = hashlib.sha256(target.read_bytes()).hexdigest()
(dist / 'SHA256SUMS.txt').write_text(f'{digest}  {target.name}\n', encoding='utf-8')
print(target)
print(digest)
