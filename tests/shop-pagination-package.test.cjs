const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const assert=require('node:assert/strict'),vm=require('node:vm');

const root = path.resolve(__dirname, '..');
const packageResult = spawnSync('python', ['scripts/package.py'], { cwd: root, encoding: 'utf8' });
if (packageResult.error) throw packageResult.error;
if (packageResult.status !== 0) throw new Error(packageResult.stderr || 'integrated package generation failed');

const packagePath = path.join(root, 'dist', `DoL-SoftWet-GameUI-${JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version}.mod.zip`);
const inspector = String.raw`import json, pathlib, sys, zipfile
root = pathlib.Path(sys.argv[1])
package_path = pathlib.Path(sys.argv[2])
expected_files = [
    'twee/patch-list-mode.twee',
    'twee/patch-background.twee',
    'twee/patch-page-change.twee',
    'twee/patch-resize.twee',
]
with zipfile.ZipFile(package_path) as archive:
    boot = json.loads(archive.read('boot.json'))
    assert boot['name'] == 'DoLGameUI', 'stable loader identity must not change'
    assert boot['nickName'] == 'DoL Soft & Wet Game UI', 'display name missing'
    assert not any(name.startswith('docs/audits/') for name in archive.namelist()), 'acceptance receipts belong in the repository'
    assert not {'docs/VALIDATION.md', 'docs/DEVELOPMENT.md', 'docs/TYPESCRIPT_2.2.md', 'docs/UI_INFRASTRUCTURE.md', 'docs/UI_RUNTIME.md'}.intersection(archive.namelist()), 'developer documents must not be bundled with the player package'
    integrated = next(item for item in boot['addonPlugin'] if item['modName'] == 'TweeReplacer')['params']
    assert boot['scriptFileList_inject_early'] == ['startup-cache-experiment.js', 'shop-page-experiment.js'], 'early script order/names changed'
    assert 'game-ui.js' in boot['scriptFileList'], 'game UI runtime missing'
    assert any(item['modName'] == 'TweeReplacer' and item['version'] == '>=1.0.0' for item in boot['dependenceInfo']), 'TweeReplacer dependency missing'
    assert len(integrated) == 4, f'expected four integrated shop patches, got {len(integrated)}'
    assert [item['replaceFile'] for item in integrated] == expected_files, 'patch order or file list changed'
    for name in boot['scriptFileList_inject_early']:
        assert archive.read(name) == (root / 'dist' / name).read_bytes(), 'runtime differs from compiled source'
    assert not any(name.endswith('.ts') and not name.endswith('.d.ts') for name in archive.namelist()), 'runtime TypeScript source must not be packaged'
    assert all(name.endswith('.js') for name in boot['scriptFileList'] + boot['scriptFileList_inject_early']), 'loader must execute only JS'
    assert 'types/ui.d.ts' in boot['additionFile'], 'public type declaration missing'
    assert archive.read('types/ui.d.ts') == (root / 'dist/types/ui.d.ts').read_bytes(), 'public declaration differs from generated contract'
    runtime = archive.read('shop-page-experiment.js').decode('utf-8')
    assert 'api.enabled = false' in runtime, 'runtime default-off switch missing'
    for parameter in integrated:
        relative = parameter['replaceFile']
        source = (root / relative).read_bytes()
        assert archive.read(relative) == source, f'{relative} differs from integrated source'
        text = source.decode('utf-8')
        assert '\\t' not in text, f'{relative} contains a literal tab escape'
    markers = {
        'twee/patch-list-mode.twee': ['_dolShopPageExperimentMode', 'id="shop-list-pages"'],
        'twee/patch-background.twee': ['!_dolShopPageExperimentMode', '<<repeat 0.1s>>'],
        'twee/patch-page-change.twee': ['.clothing-shop-page.page-', 'nth-of-type('],
        'twee/patch-resize.twee': ['resize.DoLShopPageExperiment', "$(window).on('resize', () => {"]
    }
    for relative, required in markers.items():
        text = archive.read(relative).decode('utf-8')
        assert all(marker in text for marker in required), f'{relative} fallback/experiment markers missing'
print(json.dumps({'package': str(package_path), 'exactPatches': len(integrated), 'defaultEnabled': False}))`;
const result = spawnSync('python', ['-c', inspector, root, packagePath], { encoding: 'utf8' });
if (result.error) throw result.error;
if (result.status !== 0) throw new Error(result.stderr || 'integrated package inspection failed');
console.log(result.stdout.trim());
// Exercise the compiled early global, including repeat loading and foreign fields.
const source=fs.readFileSync(path.join(root,'dist/shop-page-experiment.js'),'utf8');
const window={};vm.runInNewContext(source,{window});
const api=window.DoLShopPageExperiment;
assert.equal(api.enabled,false);assert.equal(api.setEnabled(true),true);
assert.equal(api.setEnabled('true'),false);api.setEnabled(true);api.foreign='kept';
vm.runInNewContext(source,{window});assert.equal(window.DoLShopPageExperiment,api);
assert.equal(api.enabled,true);assert.equal(api.foreign,'kept');assert.equal(api.reset(),false);
console.log('PASS compiled early shop API: default-off, strict boolean, repeat identity, foreign fields and reset');
