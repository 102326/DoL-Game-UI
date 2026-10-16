"""Isolated distribution comparison, not a change to the default research ZIPs."""
from pathlib import Path
import json, zipfile, hashlib

root = Path(__file__).resolve().parent.parent
out = root / 'dist/framework-vue-comparison'
inputs = json.loads((out / 'inputs.json').read_text(encoding='utf-8'))
version = '0.1.1-experimental'
packages = [('runtime', 'StoneFreeVueResearch')] + [(c['name'], c['modName']) for c in inputs['consumers']]
rows = []
for directory, name in packages:
    base = out / directory
    files = {p.name: p.read_bytes() for p in [base / 'index.js', base / 'style.css'] if p.exists()}
    dependencies = [{'modName': 'ModLoader', 'version': '>=2.100.0'}]
    if directory != 'runtime':
        dependencies += [{'modName': 'StoneFreeHost', 'version': '=' + version}, {'modName': 'StoneFreeVueResearch', 'version': '=' + version}]
    files.update({'LICENSE': (root / 'LICENSE').read_bytes(), 'README.md': (root / 'framework/experiments/README.md').read_bytes()})
    if directory == 'runtime':
        notices = []
        for module in ['vue', '@vue/shared', '@vue/reactivity', '@vue/runtime-core', '@vue/runtime-dom']:
            notices.append(module + '\n' + next((root / 'node_modules' / module).glob('LICENSE*')).read_text(encoding='utf-8'))
        files['THIRD-PARTY-NOTICES.txt'] = '\n\n'.join(notices).encode()
    boot = dict(name=name, version=version, nickName=name+' (Shared Vue Research)', scriptFileList=['index.js'],
                styleFileList=['style.css'] if 'style.css' in files else [], tweeFileList=[], imgFileList=[],
                additionFile=[k for k in files if k not in ['index.js', 'style.css']], dependenceInfo=dependencies)
    files['boot.json'] = json.dumps(boot, ensure_ascii=False, indent=2).encode()
    target = out / f'{name}-{version}.mod.zip'
    with zipfile.ZipFile(target, 'w', zipfile.ZIP_DEFLATED) as archive:
        for filename, payload in sorted(files.items()):
            member = zipfile.ZipInfo(filename, (2026, 1, 1, 0, 0, 0)); member.compress_type = zipfile.ZIP_DEFLATED
            archive.writestr(member, payload)
    with zipfile.ZipFile(target) as archive:
        assert archive.testzip() is None and len(archive.namelist()) == len(files)
        assert all(archive.read(k) == v for k, v in files.items())
    row = {'name': directory, 'modName': name, 'sharedJsBytes': len(files['index.js']), 'sharedZipBytes': target.stat().st_size,
           'sharedJsSha256': hashlib.sha256(files['index.js']).hexdigest()}
    if directory != 'runtime':
        plain = root / 'dist/framework' / f'{name}-{version}.mod.zip'
        with zipfile.ZipFile(plain) as archive:
            # Normalize only the docs; dependency and license costs remain real.
            baseline = {k: archive.read(k) for k in archive.namelist()}
        baseline['README.md'] = files['README.md']
        assert baseline.get('style.css') == files.get('style.css'), 'CSS must be identical in this distribution comparison'
        baseline_target = out / f'baseline-{name}.zip'
        with zipfile.ZipFile(baseline_target, 'w', zipfile.ZIP_DEFLATED) as archive:
            for filename, payload in sorted(baseline.items()):
                member = zipfile.ZipInfo(filename, (2026, 1, 1, 0, 0, 0)); member.compress_type = zipfile.ZIP_DEFLATED
                archive.writestr(member, payload)
        row.update(standaloneJsBytes=len(baseline['index.js']), standaloneZipBytes=baseline_target.stat().st_size,
                   standaloneJsSha256=hashlib.sha256(baseline['index.js']).hexdigest())
    rows.append(row)
scenarios = []
for count in range(1, len(rows)):
    selected = rows[1:count+1]
    plain = sum(r['standaloneZipBytes'] for r in selected)
    shared = rows[0]['sharedZipBytes'] + sum(r['sharedZipBytes'] for r in selected)
    scenarios.append({'consumers': [r['name'] for r in selected], 'standaloneZipBytes': plain, 'sharedZipBytes': shared, 'savedBytes': plain-shared})
report = {'vueVersion': inputs['vueVersion'], 'packages': rows, 'scenarios': scenarios,
          'limits': ['Incremental Vue consumers only; unchanged Host and domain-only packages excluded from both sides',
                     'Docs normalized; dependency metadata, notices and extra runtime package remain part of actual delivery cost',
                     'No startup, memory, CPU, Android or general author productivity claim']}
(out / 'comparison.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
print(json.dumps(report, indent=2))
