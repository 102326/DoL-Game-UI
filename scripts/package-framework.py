"""Research ZIPs, independent from the unchanged official UI packaging path."""
from pathlib import Path
import json, zipfile, hashlib
from shop_package import add_shop_patches

root = Path(__file__).resolve().parent.parent
out = root / 'dist/framework'
version = '0.1.2-experimental'
def write_archive(name, target, files):
    with zipfile.ZipFile(target, 'w', zipfile.ZIP_DEFLATED) as z:
        for filename, payload in sorted(files.items()):
            member = zipfile.ZipInfo(filename, (2026, 1, 1, 0, 0, 0)); member.compress_type = zipfile.ZIP_DEFLATED
            z.writestr(member, payload)
    with zipfile.ZipFile(target) as z:
        assert z.testzip() is None and len(z.namelist()) == len(files) and set(z.namelist()) == set(files)
        assert all(z.read(k) == v for k, v in files.items())
    print(json.dumps({'name': name, 'bytes': target.stat().st_size, 'sha256': hashlib.sha256(target.read_bytes()).hexdigest()}))

packages = [('host', 'StoneFreeHost'), ('native-status', 'StoneFreeNativeStatus'), ('comparison', 'StoneFreeStatusComparison'), ('soft-wet-surface', 'StoneFreeSoftWetSurface'), ('workspace', 'StoneFreeWorkspace'), ('alternate-workspace', 'StoneFreeAlternateWorkspace'), ('native-reading', 'StoneFreeNativeReading'), ('reading-controls', 'StoneFreeReadingControls'), ('motion-hub', 'StoneFreeMotionHub'), ('wardrobe-reference', 'StoneFreeWardrobeReference'), ('official-ui', 'DoLGameUI')]
for directory, name in packages:
    base = out / directory
    dependencies = [{'modName': 'ModLoader', 'version': '>=2.100.0'}]
    if directory != 'host':
        dependencies.append({'modName': 'StoneFreeHost', 'version': '=' + version})
    if directory == 'soft-wet-surface':
        dependencies.append({'modName': 'DoLGameUI', 'version': '>=2.7.0'})
    package_version = '3.0.0-lab.16' if directory == 'official-ui' else '0.1.3-experimental' if directory == 'motion-hub' else version
    boot = dict(name=name, version=package_version, nickName=name + ' (Research)', scriptFileList=['index.js'],
                styleFileList=['style.css'] if (base/'style.css').exists() else [],
                tweeFileList=[], imgFileList=[], additionFile=['README.md', 'LICENSE'], dependenceInfo=dependencies)
    files = {p: (base/p).read_bytes() for p in boot['scriptFileList'] + boot['styleFileList']}
    files['boot.json'] = json.dumps(boot, ensure_ascii=False, indent=2).encode()
    readme = f'framework/{directory}/README.md' if directory in ('motion-hub', 'wardrobe-reference', 'official-ui') else 'framework/README.md'
    files['README.md'] = (root/readme).read_bytes()
    files['LICENSE'] = (root/'LICENSE').read_bytes()
    if directory in ('native-status', 'comparison', 'soft-wet-surface', 'workspace', 'alternate-workspace', 'reading-controls', 'motion-hub', 'wardrobe-reference', 'official-ui'):
        licenses = []
        for module in ['vue', '@vue/shared', '@vue/reactivity', '@vue/runtime-core', '@vue/runtime-dom'] + (['tailwindcss'] if directory == 'official-ui' else []):
            licenses.append(module + '\n' + next((root/'node_modules'/module).glob('LICENSE*')).read_text(encoding='utf-8'))
        files['THIRD-PARTY-NOTICES.txt'] = '\n\n'.join(licenses).encode()
        boot['additionFile'].append('THIRD-PARTY-NOTICES.txt')
        files['boot.json'] = json.dumps(boot, ensure_ascii=False, indent=2).encode()
    if directory == 'official-ui':
        for doc in ['docs/UI_SETTINGS.md','docs/OPTIONAL_ADAPTERS.md']:
            files[doc] = (root/doc).read_bytes(); boot['additionFile'].append(doc)
        for declaration in ['ui.d.ts','wardrobe.d.ts']:
            asset_name = 'types/'+declaration
            files[asset_name] = (root/'dist/types'/declaration).read_bytes(); boot['additionFile'].append(asset_name)
        boot['scriptFileList_inject_early'] = ['shop-page-experiment.js']
        files['shop-page-experiment.js'] = (root/'dist/shop-page-experiment.js').read_bytes()
        boot['dependenceInfo'] += [{'modName':'TweeReplacer','version':'>=1.0.0'}, {'modName':'GameVersion','version':'=0.5.11.9 || =0.5.12.13'}]
        boot['addonPlugin'] = [{'modName':'TweeReplacer','addonName':'TweeReplacerAddon','modVersion':'>=1.0.0','params':[]}]
        add_shop_patches(root,boot,files)
        for notice in ['UPSTREAM-RENDERER-LICENSE', 'UPSTREAM-RENDERER-NOTICE.md']:
            files[notice] = (root/notice).read_bytes(); boot['additionFile'].append(notice)
        files['boot.json'] = json.dumps(boot, ensure_ascii=False, indent=2).encode()
    target = out/f'{name}-{package_version}.mod.zip'
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
