"""Research ZIPs, independent from the unchanged official UI packaging path."""
from pathlib import Path
import json, zipfile, hashlib, argparse
from shop_package import add_shop_patches

root = Path(__file__).resolve().parent.parent
out = root / 'dist/framework'
version = '0.1.4-experimental'
host_version = '0.1.4-experimental'
# Official product version is independent of the Host package/protocol.
official_version = json.loads((root / 'package.json').read_text(encoding='utf-8'))['version']
# Minimum includes the R15 scene bridge guarantees; SDK/package edits do not raise it.
host_requirement = '>=0.1.2-experimental && <0.2.0'
parser = argparse.ArgumentParser()
parser.add_argument('--players-only', action='store_true', help='Package only the paired Host and official UI')
args = parser.parse_args()
def write_archive(name, target, files):
    with zipfile.ZipFile(target, 'w', zipfile.ZIP_DEFLATED) as z:
        for filename, payload in sorted(files.items()):
            member = zipfile.ZipInfo(filename, (2026, 1, 1, 0, 0, 0))
            member.create_system = 3
            member.external_attr = 0o600 << 16
            z.writestr(member, payload, compress_type=zipfile.ZIP_DEFLATED, compresslevel=6)
    with zipfile.ZipFile(target) as z:
        assert z.testzip() is None and len(z.namelist()) == len(files) and set(z.namelist()) == set(files)
        assert all(z.read(k) == v for k, v in files.items())
    print(json.dumps({'name': name, 'bytes': target.stat().st_size, 'sha256': hashlib.sha256(target.read_bytes()).hexdigest()}))

packages = [('host', 'StoneFreeHost'), ('native-status', 'StoneFreeNativeStatus'), ('comparison', 'StoneFreeStatusComparison'), ('soft-wet-surface', 'StoneFreeSoftWetSurface'), ('workspace', 'StoneFreeWorkspace'), ('alternate-workspace', 'StoneFreeAlternateWorkspace'), ('native-reading', 'StoneFreeNativeReading'), ('reading-controls', 'StoneFreeReadingControls'), ('motion-hub', 'StoneFreeMotionHub'), ('wardrobe-reference', 'StoneFreeWardrobeReference'), ('official-ui', 'DoLGameUI')]
for directory, name in packages:
    if args.players_only and directory not in ('host', 'official-ui'):
        continue
    base = out / directory
    dependencies = [{'modName': 'ModLoader', 'version': '>=2.100.0'}]
    if directory != 'host':
        dependencies.append({'modName': 'StoneFreeHost', 'version': host_requirement})
    if directory == 'soft-wet-surface':
        dependencies.append({'modName': 'DoLGameUI', 'version': '>=2.7.0'})
    package_version = official_version if directory == 'official-ui' else host_version if directory == 'host' else '0.1.5-experimental' if directory == 'motion-hub' else version
    nickname = 'Soft & Wet 3.0 — Kraft Work' if directory == 'official-ui' else 'Stone Free Framework Host' if directory == 'host' else name + ' (Research)'
    boot = dict(name=name, version=package_version, nickName=nickname, scriptFileList=['index.js'],
                styleFileList=['style.css'] if (base/'style.css').exists() else [],
                tweeFileList=[], imgFileList=[], additionFile=['README.md', 'LICENSE'], dependenceInfo=dependencies)
    files = {p: (base/p).read_bytes() for p in boot['scriptFileList'] + boot['styleFileList']}
    files['boot.json'] = json.dumps(boot, ensure_ascii=False, indent=2).encode()
    readme = f'framework/{directory}/README.md' if directory in ('host', 'motion-hub', 'wardrobe-reference', 'official-ui') else 'framework/README.md'
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
        for doc in ['docs/UI_SETTINGS.md','docs/OPTIONAL_ADAPTERS.md',f'docs/RELEASE_{official_version}.md']:
            files[doc] = (root/doc).read_bytes(); boot['additionFile'].append(doc)
        for declaration in ['ui.d.ts','wardrobe.d.ts']:
            asset_name = 'types/'+declaration
            files[asset_name] = (root/'dist/types'/declaration).read_bytes(); boot['additionFile'].append(asset_name)
        boot['scriptFileList_inject_early'] = ['shop-page-experiment.js']
        files['shop-page-experiment.js'] = (root/'dist/shop-page-experiment.js').read_bytes()
        boot['dependenceInfo'] += [{'modName':'TweeReplacer','version':'>=1.0.0'}, {'modName':'GameVersion','version':'=0.5.12.13'}]
        boot['addonPlugin'] = [{'modName':'TweeReplacer','addonName':'TweeReplacerAddon','modVersion':'>=1.0.0','params':[]}]
        add_shop_patches(root,boot,files)
        for notice in ['UPSTREAM-RENDERER-LICENSE', 'UPSTREAM-RENDERER-NOTICE.md']:
            files[notice] = (root/notice).read_bytes(); boot['additionFile'].append(notice)
        files['boot.json'] = json.dumps(boot, ensure_ascii=False, indent=2).encode()
    target = out/f'{name}-{package_version}.mod.zip'
    write_archive(name, target, files)

# Development sources only: no runtime boot.json, UI sources, dependencies or test evidence.
if args.players_only:
    raise SystemExit(0)
kit_paths = ['LICENSE', 'scripts/framework-factory.mjs', 'framework/contracts.ts', 'framework/vue.ts', 'framework/connect.ts',
             'framework/factory/Panel.vue', 'framework/factory/preview.ts', 'framework/factory/index.html',
             'framework/factory/vite.config.mjs', 'framework/factory/package.py']
files = {name: (root/name).read_bytes() for name in kit_paths}
files['README.md'] = (root/'framework/factory/AUTHOR_KIT.md').read_bytes()
manifest = dict(kind='source-kit', version=version, sdkProtocol='0.1-experimental',
                files={name: hashlib.sha256(data).hexdigest() for name, data in sorted(files.items())})
files['stone-free-author-kit.json'] = json.dumps(manifest, ensure_ascii=False, indent=2).encode()
write_archive('StoneFreeAuthorKit', out/f'StoneFreeAuthorKit-{version}.source.zip', files)
