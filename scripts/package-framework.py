"""Research ZIPs, independent from the unchanged official UI packaging path."""
from pathlib import Path
import json, zipfile, hashlib

root = Path(__file__).resolve().parent.parent
out = root / 'dist/framework'
version = '0.1.0-experimental'
def write_archive(name, target, files):
    with zipfile.ZipFile(target, 'w', zipfile.ZIP_DEFLATED) as z:
        for filename, payload in sorted(files.items()):
            member = zipfile.ZipInfo(filename, (2026, 1, 1, 0, 0, 0)); member.compress_type = zipfile.ZIP_DEFLATED
            z.writestr(member, payload)
    with zipfile.ZipFile(target) as z:
        assert z.testzip() is None and len(z.namelist()) == len(files) and set(z.namelist()) == set(files)
        assert all(z.read(k) == v for k, v in files.items())
    print(json.dumps({'name': name, 'bytes': target.stat().st_size, 'sha256': hashlib.sha256(target.read_bytes()).hexdigest()}))

packages = [('host', 'StoneFreeHost'), ('native-status', 'StoneFreeNativeStatus'), ('comparison', 'StoneFreeStatusComparison'), ('soft-wet-surface', 'StoneFreeSoftWetSurface'), ('workspace', 'StoneFreeWorkspace'), ('alternate-workspace', 'StoneFreeAlternateWorkspace'), ('native-reading', 'StoneFreeNativeReading'), ('reading-controls', 'StoneFreeReadingControls')]
for directory, name in packages:
    base = out / directory
    dependencies = [{'modName': 'ModLoader', 'version': '>=2.100.0'}]
    if directory != 'host':
        dependencies.append({'modName': 'StoneFreeHost', 'version': '=' + version})
    if directory == 'soft-wet-surface':
        dependencies.append({'modName': 'DoLGameUI', 'version': '>=2.7.0'})
    boot = dict(name=name, version=version, nickName=name + ' (Research)', scriptFileList=['index.js'],
                styleFileList=['style.css'] if (base/'style.css').exists() else [],
                tweeFileList=[], imgFileList=[], additionFile=['README.md', 'LICENSE'], dependenceInfo=dependencies)
    files = {p: (base/p).read_bytes() for p in boot['scriptFileList'] + boot['styleFileList']}
    files['boot.json'] = json.dumps(boot, ensure_ascii=False, indent=2).encode()
    files['README.md'] = (root/'framework/README.md').read_bytes()
    files['LICENSE'] = (root/'LICENSE').read_bytes()
    if directory in ('native-status', 'comparison', 'soft-wet-surface', 'workspace', 'alternate-workspace', 'reading-controls'):
        licenses = []
        for module in ['vue', '@vue/shared', '@vue/reactivity', '@vue/runtime-core', '@vue/runtime-dom']:
            licenses.append(module + '\n' + next((root/'node_modules'/module).glob('LICENSE*')).read_text(encoding='utf-8'))
        files['THIRD-PARTY-NOTICES.txt'] = '\n\n'.join(licenses).encode()
        boot['additionFile'].append('THIRD-PARTY-NOTICES.txt')
        files['boot.json'] = json.dumps(boot, ensure_ascii=False, indent=2).encode()
    target = out/f'{name}-{version}.mod.zip'
    write_archive(name, target, files)

# Development sources only: no runtime boot.json, UI sources, dependencies or test evidence.
kit_paths = ['LICENSE', 'scripts/framework-factory.mjs', 'framework/contracts.ts', 'framework/vue.ts', 'framework/connect.ts',
             'framework/factory/Panel.vue', 'framework/factory/preview.ts', 'framework/factory/index.html',
             'framework/factory/vite.config.mjs', 'framework/factory/package.py']
files = {name: (root/name).read_bytes() for name in kit_paths}
files['README.md'] = (root/'framework/factory/AUTHOR_KIT.md').read_bytes()
manifest = dict(kind='source-kit', version=version, sdkProtocol='0.1-experimental',
                files={name: hashlib.sha256(data).hexdigest() for name, data in sorted(files.items())})
files['stone-free-author-kit.json'] = json.dumps(manifest, ensure_ascii=False, indent=2).encode()
write_archive('StoneFreeAuthorKit', out/f'StoneFreeAuthorKit-{version}.source.zip', files)
