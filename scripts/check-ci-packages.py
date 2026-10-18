"""Check the two player packages against their build inputs; never publish them."""
from pathlib import Path, PurePosixPath
import hashlib
import json
import os
import subprocess
import zipfile

from shop_package import shop_patches

ROOT = Path(__file__).resolve().parent.parent
PACKAGES = {
    'StoneFreeHost': ('0.1.4-experimental', 'host'),
    'DoLGameUI': ('3.0.1', 'official-ui'),
}


def digest(data):
    return hashlib.sha256(data).hexdigest()


def check_package(path, name):
    version, directory = PACKAGES[name]
    with zipfile.ZipFile(path) as archive:
        names = archive.namelist()
        assert len(names) == len(set(names)), 'Duplicate ZIP member'
        for member in names:
            parts = PurePosixPath(member)
            assert not parts.is_absolute() and '..' not in parts.parts and '\\' not in member and ':' not in member, 'Unsafe ZIP path'
        assert archive.testzip() is None, 'ZIP CRC failure'
        files = {member: archive.read(member) for member in names}
    boot = json.loads(files['boot.json'])
    assert (boot['name'], boot['version']) == (name, version), 'Wrong Mod identity'
    assert path.name == f'{name}-{version}.mod.zip', 'Wrong ZIP filename'
    deps = [{'modName': 'ModLoader', 'version': '>=2.100.0'}]
    expected = {
        'index.js': ROOT / 'dist/framework' / directory / 'index.js',
        'README.md': ROOT / 'framework' / directory / 'README.md',
        'LICENSE': ROOT / 'LICENSE',
    }
    lists = {'scriptFileList': ['index.js'], 'styleFileList': [], 'tweeFileList': [], 'imgFileList': [], 'additionFile': ['README.md', 'LICENSE']}
    if name == 'DoLGameUI':
        deps += [{'modName': 'StoneFreeHost', 'version': '>=0.1.2-experimental && <0.2.0'}, {'modName': 'TweeReplacer', 'version': '>=1.0.0'}, {'modName': 'GameVersion', 'version': '=0.5.12.13'}]
        lists.update(styleFileList=['style.css'], scriptFileList_inject_early=['shop-page-experiment.js'])
        expected['style.css'] = ROOT / 'dist/framework/official-ui/style.css'
        expected['shop-page-experiment.js'] = ROOT / 'dist/shop-page-experiment.js'
        for filename in ['ui.d.ts', 'wardrobe.d.ts']:
            expected['types/' + filename] = ROOT / 'dist/types' / filename
        for filename in ['docs/UI_SETTINGS.md', 'docs/OPTIONAL_ADAPTERS.md', 'docs/RELEASE_3.0.1.md', 'UPSTREAM-RENDERER-LICENSE', 'UPSTREAM-RENDERER-NOTICE.md']:
            expected[filename] = ROOT / filename
        notices = []
        for module in ['vue', '@vue/shared', '@vue/reactivity', '@vue/runtime-core', '@vue/runtime-dom', 'tailwindcss']:
            license_file = next((ROOT / 'node_modules' / module).glob('LICENSE*'))
            notices.append(module + '\n' + license_file.read_text(encoding='utf-8'))
        assert files['THIRD-PARTY-NOTICES.txt'] == '\n\n'.join(notices).encode(), 'Dependency notices differ from installed inputs'
        params = [{'tip': tip, 'passage': 'Clothing Shop v2 Widgets', 'findString': find, 'replaceFile': file} for tip, find, file in shop_patches]
        assert boot['addonPlugin'] == [{'modName': 'TweeReplacer', 'addonName': 'TweeReplacerAddon', 'modVersion': '>=1.0.0', 'params': params}], 'Wrong shop patch metadata'
        for _, _, filename in shop_patches:
            expected[filename] = ROOT / filename
        lists['additionFile'] += ['THIRD-PARTY-NOTICES.txt', 'docs/UI_SETTINGS.md', 'docs/OPTIONAL_ADAPTERS.md', 'docs/RELEASE_3.0.1.md', 'types/ui.d.ts', 'types/wardrobe.d.ts', 'UPSTREAM-RENDERER-LICENSE', 'UPSTREAM-RENDERER-NOTICE.md']
    else:
        assert not boot.get('addonPlugin') and not boot.get('scriptFileList_inject_early'), 'Unexpected Host entry'
    assert boot['dependenceInfo'] == deps, 'Dependency policy drift'
    assert set(boot) == {'name', 'version', 'nickName', 'dependenceInfo'} | set(lists) | ({'addonPlugin'} if name == 'DoLGameUI' else set()), 'Unexpected metadata field'
    for field, entries in lists.items():
        assert boot[field] == entries, f'Wrong entry list: {field}'
        assert all(filename in files for filename in entries), f'Missing referenced member: {field}'
    allowed = set(expected) | {'boot.json'}
    if name == 'DoLGameUI':
        allowed.add('THIRD-PARTY-NOTICES.txt')
    assert set(files) == allowed, 'Missing or unexpected ZIP member'
    for filename, source in expected.items():
        assert files[filename] == source.read_bytes(), f'Member differs from build/source input: {filename}'
    return {'file': path.name, 'name': name, 'version': version, 'dependencies': deps, 'sha256': digest(path.read_bytes()), 'members': {filename: digest(data) for filename, data in sorted(files.items())}}


def main():
    reports = []
    paths = []
    for name, (version, _) in PACKAGES.items():
        path = ROOT / 'dist/framework' / f'{name}-{version}.mod.zip'
        reports.append(check_package(path, name))
        paths.append(path)
    commit = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
    dirty = bool(subprocess.check_output(['git', 'status', '--porcelain'], cwd=ROOT, text=True).strip())
    output = ROOT / 'dist/ci-packages'
    output.mkdir(parents=True, exist_ok=True)
    allowed = {path.name for path in paths} | {'PACKAGE_CHECKS.json', 'SHA256SUMS.txt'}
    assert all(path.name in allowed for path in output.iterdir()), 'Unexpected CI artifact; use a clean output directory'
    for path in paths:
        (output / path.name).write_bytes(path.read_bytes())
    (output / 'PACKAGE_CHECKS.json').write_text(json.dumps({'commit': commit, 'dirty': dirty, 'github_sha': os.environ.get('GITHUB_SHA'), 'scope': 'CI build inputs and package structure, not installed ModLoader proof or a public release', 'packages': reports}, indent=2) + '\n', encoding='utf-8')
    payloads = sorted(path for path in output.iterdir() if path.name != 'SHA256SUMS.txt')
    (output / 'SHA256SUMS.txt').write_text(''.join(f'{digest(path.read_bytes())}  {path.name}\n' for path in payloads), encoding='utf-8')
    for report in reports:
        print(f"PASS {report['file']} {report['sha256']}")


if __name__ == '__main__':
    main()
