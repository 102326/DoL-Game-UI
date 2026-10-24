"""Package an optional adapter with target and adapter versions in the filename."""
import hashlib
import json
import sys
import subprocess
import re
from pathlib import Path, PurePosixPath
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED

if len(sys.argv) != 2:
    raise SystemExit('Usage: python scripts/package-adapter.py compat/<adapter>')
root = Path(sys.argv[1]).resolve()
boot = json.loads((root / 'boot.json').read_text(encoding='utf-8'))
dependency = boot['dependenceInfo'][0]
assert re.fullmatch(r'(?:=|>=)\d[\w.+-]*', dependency['version']), 'Adapter target must be exact or a minimum version'
target_version = dependency['version'].removeprefix('>=').removeprefix('=')
if dependency['version'].startswith('>='):
    target_version += '-plus'
members = ['boot.json'] + [name for field in ['styleFileList', 'scriptFileList', 'scriptFileList_inject_early', 'tweeFileList', 'imgFileList', 'additionFile'] for name in boot.get(field, [])]
assert len(members) == len(set(members)), 'Duplicate adapter member'
for name in members + [boot['name'], dependency['modName']]:
    value = PurePosixPath(name)
    assert not value.is_absolute() and '..' not in value.parts and '\\' not in name and ':' not in name, 'Unsafe adapter path'
dist = root / 'dist'
dist.mkdir(exist_ok=True)
compiled = [name for field in ['scriptFileList', 'scriptFileList_inject_early'] for name in boot.get(field, []) if name.endswith('.js') and (root / name).with_suffix('.ts').exists()]
if compiled:
    # Invalidate only these generated entries; preserve all unrelated builds/logs.
    for name in compiled:
        (dist / 'scripts' / name).unlink(missing_ok=True)
    repository = Path(__file__).resolve().parent.parent
    subprocess.run(['node', str(repository / 'node_modules/typescript/bin/tsc'), '-p', str(repository / 'tsconfig.tools.json')], check=True, cwd=repository)
    subprocess.run(['node', str(Path(__file__).with_name('build-adapters.cjs')), str(root)], check=True)
    assert all((dist / 'scripts' / name).is_file() and not (dist / 'scripts' / name).is_symlink() for name in compiled), 'CJ3C_MISSING_COMPILED_ADAPTER'

def source(name):
    return dist / 'scripts' / name if name.endswith('.js') and (root / name).with_suffix('.ts').exists() else root / name
target = dist / f"{boot['name']}-{dependency['modName']}-{target_version}-v{boot['version']}.mod.zip"
with ZipFile(target, 'w', ZIP_DEFLATED) as out:
    for name in sorted(members):
        member = ZipInfo(name, (2026, 1, 1, 0, 0, 0))
        member.create_system = 3
        member.external_attr = 0o600 << 16
        out.writestr(member, source(name).read_bytes(), compress_type=ZIP_DEFLATED, compresslevel=6)
with ZipFile(target) as out:
    assert out.testzip() is None
    assert json.loads(out.read('boot.json')) == boot
    assert all(out.read(name) == source(name).read_bytes() for name in out.namelist())
digest = hashlib.sha256(target.read_bytes()).hexdigest()
(dist / 'SHA256SUMS.txt').write_text(f'{digest}  {target.name}\n', encoding='utf-8')
print(target)
print(digest)
