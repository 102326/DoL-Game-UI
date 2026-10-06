"""Package an optional adapter with target and adapter versions in the filename."""
import hashlib
import json
import sys
import subprocess
import re
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

if len(sys.argv) != 2:
    raise SystemExit('Usage: python scripts/package-adapter.py compat/<adapter>')
root = Path(sys.argv[1]).resolve()
boot = json.loads((root / 'boot.json').read_text(encoding='utf-8'))
dependency = boot['dependenceInfo'][0]
assert re.fullmatch(r'(?:=|>=)\d[\w.+-]*', dependency['version']), 'Adapter target must be exact or a minimum version'
target_version = dependency['version'].removeprefix('>=').removeprefix('=')
if dependency['version'].startswith('>='):
    target_version += '-plus'
dist = root / 'dist'
dist.mkdir(exist_ok=True)
if any(name.endswith('.js') and (root / name).with_suffix('.ts').exists() for field in ['scriptFileList', 'scriptFileList_inject_early'] for name in boot.get(field, [])):
    subprocess.run(['node', str(Path(__file__).with_name('build-adapters.cjs')), str(root)], check=True)
def source(name):
    return dist / 'scripts' / name if name.endswith('.js') and (root / name).with_suffix('.ts').exists() else root / name
target = dist / f"{boot['name']}-{dependency['modName']}-{target_version}-v{boot['version']}.mod.zip"
with ZipFile(target, 'w', ZIP_DEFLATED) as out:
    for name in ['boot.json'] + [name for field in ['styleFileList','scriptFileList','scriptFileList_inject_early','tweeFileList','additionFile'] for name in boot.get(field, [])]:
        out.write(source(name), name)
with ZipFile(target) as out:
    assert out.testzip() is None
    assert json.loads(out.read('boot.json')) == boot
    assert all(out.read(name) == source(name).read_bytes() for name in out.namelist())
digest = hashlib.sha256(target.read_bytes()).hexdigest()
(dist / 'SHA256SUMS.txt').write_text(f'{digest}  {target.name}\n', encoding='utf-8')
print(target)
print(digest)
