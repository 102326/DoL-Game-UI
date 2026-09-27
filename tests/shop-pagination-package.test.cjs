const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const packageResult = spawnSync('python', ['scripts/package.py'], { cwd: root, encoding: 'utf8' });
if (packageResult.error) throw packageResult.error;
if (packageResult.status !== 0) throw new Error(packageResult.stderr || 'integrated package generation failed');

const packagePath = path.join(root, 'dist', `DoLGameUI-${JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version}.mod.zip`);
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
    integrated = next(item for item in boot['addonPlugin'] if item['modName'] == 'TweeReplacer')['params']
    assert 'shop-page-experiment.js' in boot['scriptFileList_inject_early'], 'experiment runtime must load early'
    assert 'game-ui.js' in boot['scriptFileList'], 'game UI runtime missing'
    assert any(item['modName'] == 'TweeReplacer' and item['version'] == '>=1.0.0' for item in boot['dependenceInfo']), 'TweeReplacer dependency missing'
    assert len(integrated) == 4, f'expected four integrated shop patches, got {len(integrated)}'
    assert [item['replaceFile'] for item in integrated] == expected_files, 'patch order or file list changed'
    assert archive.read('shop-page-experiment.js') == (root / 'shop-page-experiment.js').read_bytes(), 'runtime differs from integrated source'
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
