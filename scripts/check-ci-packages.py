"""Check/rebuild the two player and six maintained optional packages; never publish."""
from pathlib import Path, PurePosixPath
import hashlib
import json
import os
import subprocess
import zipfile
import ast
import io
import re
import sys
import uuid
import platform
import zlib
import struct
import unittest

from shop_package import shop_patches

ROOT = Path(__file__).resolve().parent.parent
PACKAGES = {
    'StoneFreeHost': ('0.1.4-experimental', 'host'),
    'DoLGameUI': ('3.0.3', 'official-ui'),
}


def digest(data):
    return hashlib.sha256(data).hexdigest()


# Independent policies for the current 3.0.3 release line. Producers do not read them.
ADAPTERS = {
    'modhub-soft-wet': ('ModHubSoftWet', 'ModHub', '>=1.3.0', 'modhub-soft-wet'),
    'maplebirch-soft-wet': ('MapleBirchSoftWet', 'maplebirch', '>=5.2.3', 'maplebirch-soft-wet'),
    'dol-optimization-soft-wet': ('DolOptimizationSoftWet', '原版优化', '>=1.1.1.2', 'dol-optimization-soft-wet'),
    'cheat-extended-soft-wet': ('CheatExtendedSoftWet', 'cheat extended', '>=1.20.3', 'cheat-extended-soft-wet'),
    'reoverfits-soft-wet': ('ReOverfitsSoftWet', 'ReOverfits', '>=4.1.1', 'reoverfits-soft-wet'),
    'mouth-compat-051213': ('LyraMouthCompat051213', 'Lyra', '=0.5.12.13-1.0.1a-1004.1-goose-ucb', 'mouth-compat'),
}
HOST_REQUIREMENT = '>=0.1.2-experimental && <0.2.0'
PROTOCOL = '0.1-experimental'
ENTRY_FIELDS = ['scriptFileList', 'scriptFileList_inject_early', 'styleFileList', 'tweeFileList', 'imgFileList', 'additionFile']


def literal_assignment(file, name):
    for statement in ast.parse(file.read_text(encoding='utf-8')).body:
        if isinstance(statement, ast.Assign) and any(isinstance(target, ast.Name) and target.id == name for target in statement.targets):
            return ast.literal_eval(statement.value)
    raise AssertionError(f'CJ3C_VERSION_SOURCE: missing {name}')


def check_version_sources(root=None):
    root = root or ROOT
    ui = PACKAGES['DoLGameUI'][0]
    host = PACKAGES['StoneFreeHost'][0]
    assert json.loads((root / 'package.json').read_text(encoding='utf-8'))['version'] == ui, 'CJ3C_VERSION_ROOT'
    runtime = re.search(r"visualVersion\s*=\s*'([^']+)'", (root / 'framework/official-ui/main.ts').read_text(encoding='utf-8'))
    assert runtime and runtime.group(1) == ui, 'CJ3C_VERSION_RUNTIME'
    producer = root / 'scripts/package-framework.py'
    assert literal_assignment(producer, 'host_version') == host, 'CJ3C_VERSION_HOST'
    assert literal_assignment(producer, 'host_requirement') == HOST_REQUIREMENT, 'CJ3C_HOST_RANGE'
    protocol = re.search(r"export const PROTOCOL\s*=\s*'([^']+)'", (root / 'framework/contracts.ts').read_text(encoding='utf-8'))
    assert protocol and protocol.group(1) == PROTOCOL, 'CJ3C_HOST_PROTOCOL'
    host_readme = (root / 'framework/host/README.md').read_text(encoding='utf-8')
    ui_readme = (root / 'framework/official-ui/README.md').read_text(encoding='utf-8')
    assert re.search(r'`' + re.escape(host) + r'`', host_readme), 'CJ3C_HOST_DOCUMENTED_VERSION'
    assert f'DoLGameUI {ui}' in ui_readme and HOST_REQUIREMENT in ui_readme, 'CJ3C_UI_DOCUMENTED_VERSION'
    return {'status': 'PASS', 'ui': ui, 'officialRuntime': runtime.group(1), 'hostPackage': host,
            'hostProtocol': PROTOCOL, 'uiHostRequirement': HOST_REQUIREMENT,
            'legacyCoreAndEarlyEntry': '2.7.0 is an internal legacy entry, not the official wrapper product version'}


def read_archive(path):
    with zipfile.ZipFile(path) as archive:
        names = archive.namelist()
        assert len(names) == len(set(names)), 'Duplicate ZIP member'
        for member in names:
            parts = PurePosixPath(member)
            assert not parts.is_absolute() and '..' not in parts.parts and '\\' not in member and ':' not in member, 'Unsafe ZIP path'
        assert archive.testzip() is None, 'ZIP CRC failure'
        return {name: archive.read(name) for name in names}


def check_zip_metadata(path):
    with zipfile.ZipFile(path) as archive:
        assert archive.namelist() == sorted(archive.namelist()), 'CJ3C_ZIP_ORDER'
        assert not archive.comment, 'CJ3C_ZIP_ARCHIVE_COMMENT'
        for member in archive.infolist():
            expected = {'date_time': (2026, 1, 1, 0, 0, 0), 'compress_type': zipfile.ZIP_DEFLATED,
                        'create_system': 3, 'external_attr': 0o600 << 16, 'internal_attr': 0,
                        'create_version': 20, 'extract_version': 20, 'extra': b'', 'comment': b'',
                        'flag_bits': 0 if member.filename.isascii() else 0x800}
            for field, value in expected.items():
                assert getattr(member, field) == value, f'CJ3C_ZIP_METADATA: {member.filename}/{field}'


def adapter_policy(directory):
    name, target, requirement, stem = ADAPTERS[directory]
    mouth = directory == 'mouth-compat-051213'
    deps = [{'modName': target, 'version': requirement}]
    if not mouth:
        deps.append({'modName': 'DoLGameUI', 'version': '>=3.0.0'})
    deps.append({'modName': 'GameVersion', 'version': '=0.5.12.13'})
    if mouth:
        deps.append({'modName': 'maplebirch', 'version': '>=5.2.3 <6.0.0'})
    lists = {field: [] for field in ENTRY_FIELDS}
    lists.update(scriptFileList=[stem + '.js'], styleFileList=[] if mouth else [stem + '.css'], additionFile=['README.md', 'LICENSE'])
    suffix = requirement.removeprefix('>=').removeprefix('=') + ('-plus' if requirement.startswith('>=') else '')
    version = '1.0.1' if directory == 'dol-optimization-soft-wet' else '1.0.0'
    return {'name': name, 'version': version, 'dependenceInfo': deps, **lists}, f'{name}-{target}-{suffix}-v{version}.mod.zip'


def check_adapter_manifest(boot, directory):
    expected, _ = adapter_policy(directory)
    assert set(boot) <= set(expected) | {'description', 'nickName'}, 'CJ3C_ADAPTER_FIELDS'
    for field in ['name', 'version', 'dependenceInfo'] + ENTRY_FIELDS:
        assert boot.get(field, [] if field in ENTRY_FIELDS else None) == expected[field], f'CJ3C_ADAPTER_POLICY: {directory}/{field}'
    return expected


def check_adapter(path, directory):
    base = ROOT / 'compat' / directory
    source_manifest = (base / 'boot.json').read_bytes()
    check_adapter_manifest(json.loads(source_manifest), directory)
    expected, filename = adapter_policy(directory)
    assert path.name == filename, 'CJ3C_ADAPTER_FILENAME'
    files = read_archive(path)
    assert 'boot.json' in files, 'CJ3C_ADAPTER_MANIFEST_MISSING'
    check_adapter_manifest(json.loads(files['boot.json']), directory)
    assert files['boot.json'] == source_manifest, 'CJ3C_ADAPTER_MANIFEST_BYTES'
    members = {name for field in ENTRY_FIELDS for name in expected[field]} | {'boot.json'}
    assert set(files) == members, 'CJ3C_ADAPTER_MEMBERS'
    for name in sorted(members - {'boot.json'}):
        source = base / ('dist/scripts/' + name if name.endswith('.js') else name)
        assert source.is_file() and not source.is_symlink() and source.resolve().is_relative_to(base.resolve()), f'CJ3C_ADAPTER_INPUT: {directory}/{name}'
        assert files[name] == source.read_bytes(), f'CJ3C_ADAPTER_BYTES: {directory}/{name}'
    check_zip_metadata(path)
    return {'status': 'PASS', 'file': filename, 'name': expected['name'], 'version': expected['version'],
            'dependencies': expected['dependenceInfo'], 'sha256': digest(path.read_bytes()),
            'members': {name: digest(data) for name, data in sorted(files.items())}}


def package_paths():
    return [(name, ROOT / 'dist/framework' / f'{name}-{version}.mod.zip', None) for name, (version, _) in PACKAGES.items()] + [
        (ADAPTERS[directory][0], ROOT / 'compat' / directory / 'dist' / adapter_policy(directory)[1], directory) for directory in ADAPTERS]


def all_packages():
    return [check_adapter(path, directory) if directory else check_package(path, name) for name, path, directory in package_paths()]


def observed_identity():
    return json.loads(subprocess.check_output(['node', '-e', "process.stdout.write(JSON.stringify(require('./scripts/ci-evidence.cjs').context().identity))"], cwd=ROOT, text=True))


def observed_source():
    return json.loads(subprocess.check_output(['node', '-e', "process.stdout.write(JSON.stringify(require('./scripts/ci-evidence.cjs').sourceIdentity()))"], cwd=ROOT, text=True))


def write_json(path, data, limit=262144):
    payload = (json.dumps(data, ensure_ascii=False, indent=2) + '\n').encode('utf-8')
    assert len(payload) <= limit, 'CJ3C_REPORT_LIMIT: report exceeds 256 KiB'
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + '.tmp')
    temporary.write_bytes(payload)
    temporary.replace(path)


def build_packages():
    before = observed_source()
    check_version_sources()
    for directory in ADAPTERS:
        check_adapter_manifest(json.loads((ROOT / 'compat' / directory / 'boot.json').read_text(encoding='utf-8')), directory)
    subprocess.run([sys.executable, str(ROOT / 'scripts/package-framework.py'), '--players-only'], cwd=ROOT, check=True)
    for directory in ADAPTERS:
        subprocess.run([sys.executable, str(ROOT / 'scripts/package-adapter.py'), str(ROOT / 'compat' / directory)], cwd=ROOT, check=True)
    packages = all_packages()
    assert observed_source() == before, 'CJ3C_SOURCE_CHANGED_DURING_BUILD'
    receipt = {'schema': 1, 'invocation': str(uuid.uuid4()), 'source': before,
               'runId': os.environ.get('MOODY_EVIDENCE_ID'),
               'packages': [{key: item[key] for key in ['name', 'file', 'sha256']} for item in packages]}
    write_json(ROOT / 'dist/CJ3C_BUILD_RECEIPT.json', receipt)
    print('PASS CJ3C build receipt: two players + six current optional packages; legacy Lyra excluded')


def archive_snapshot(path):
    data = path.read_bytes()  # Freeze bytes now, before a later build overwrites the path.
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        members = []
        for info in archive.infolist():
            metadata = {field: getattr(info, field) for field in ['date_time', 'compress_type', 'create_system', 'create_version', 'extract_version', 'flag_bits', 'internal_attr', 'external_attr', 'file_size', 'compress_size', 'CRC', 'header_offset']}
            metadata.update(extra=info.extra.hex(), comment=info.comment.hex())
            name_bytes, extra_bytes = struct.unpack_from('<HH', data, info.header_offset + 26)
            start = info.header_offset + 30 + name_bytes + extra_bytes
            members.append({'name': info.filename, 'sha256': digest(archive.read(info.filename)),
                            'compressedSha256': digest(data[start:start + info.compress_size]), 'metadata': metadata})
        return {'file': path.name, 'sha256': digest(data), 'archiveComment': archive.comment.hex(), 'members': members}


def compare_snapshots(first, second):
    differences = []
    for field in ['file', 'sha256', 'archiveComment']:
        if first[field] != second[field]:
            differences.append({'field': field, 'first': first[field], 'second': second[field]})
    left = {member['name']: member for member in first['members']}
    right = {member['name']: member for member in second['members']}
    if [m['name'] for m in first['members']] != [m['name'] for m in second['members']]:
        differences.append({'field': 'memberOrderOrSet', 'first': list(left), 'second': list(right)})
    for name in sorted(left.keys() & right.keys()):
        for field in ['sha256', 'compressedSha256']:
            if left[name][field] != right[name][field]:
                differences.append({'member': name, 'field': 'contentSha256' if field == 'sha256' else field, 'first': left[name][field], 'second': right[name][field]})
        for field in left[name]['metadata'].keys() | right[name]['metadata'].keys():
            if left[name]['metadata'].get(field) != right[name]['metadata'].get(field):
                differences.append({'member': name, 'field': 'metadata.' + field, 'first': left[name]['metadata'].get(field), 'second': right[name]['metadata'].get(field)})
    return differences


def build_observation(identity, expected_run):
    receipt = json.loads((ROOT / 'dist/CJ3C_BUILD_RECEIPT.json').read_text(encoding='utf-8'))
    assert receipt['source'] == identity['source'], 'CJ3C_STALE_BUILD_SOURCE'
    assert not expected_run or receipt['runId'] == expected_run, 'CJ3C_STALE_BUILD_RUN'
    assert isinstance(receipt.get('invocation'), str) and receipt['invocation'], 'CJ3C_MISSING_BUILD_INVOCATION'
    packages = all_packages()
    expected = [{key: item[key] for key in ['name', 'file', 'sha256']} for item in packages]
    assert receipt['packages'] == expected, 'CJ3C_INCOMPLETE_BUILD_RECEIPT'
    return {'receipt': receipt, 'snapshots': [archive_snapshot(path) for _, path, _ in package_paths()]}, packages


def check_package(path, name):
    version, directory = PACKAGES[name]
    files = read_archive(path)
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
        for filename in ['docs/UI_SETTINGS.md', 'docs/OPTIONAL_ADAPTERS.md', 'docs/RELEASE_3.0.3.md', 'UPSTREAM-RENDERER-LICENSE', 'UPSTREAM-RENDERER-NOTICE.md']:
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
        lists['additionFile'] += ['THIRD-PARTY-NOTICES.txt', 'docs/UI_SETTINGS.md', 'docs/OPTIONAL_ADAPTERS.md', 'docs/RELEASE_3.0.3.md', 'types/ui.d.ts', 'types/wardrobe.d.ts', 'UPSTREAM-RENDERER-LICENSE', 'UPSTREAM-RENDERER-NOTICE.md']
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
    check_zip_metadata(path)
    return {'status': 'PASS', 'file': path.name, 'name': name, 'version': version, 'dependencies': deps, 'sha256': digest(path.read_bytes()), 'members': {filename: digest(data) for filename, data in sorted(files.items())}}


def negative_tests():
    suite = unittest.defaultTestLoader.discover(str(ROOT / 'tests'), pattern='test_ci_packages.py')
    def identifiers(tests):
        for test in tests:
            if isinstance(test, unittest.TestSuite):
                yield from identifiers(test)
            else:
                yield test.id()
    plan = list(identifiers(suite))
    required = {'test_rejects_broken_packages', 'test_ignores_source_mtime_and_permissions',
                'test_rejects_mismatches_in_independent_sources', 'test_all_six_positive_and_precise_mutations',
                'test_joint_manifest_corruption_and_incomplete_compilation', 'test_metadata_drift_and_comparison_diagnostics',
                'test_stale_incomplete_receipts_and_report_limit'}
    assert {name.rsplit('.', 1)[-1] for name in plan} >= required, 'CJ3C_MISSING_NEGATIVE_TESTS'
    result = unittest.TextTestRunner(verbosity=2).run(suite)
    good = result.wasSuccessful() and result.testsRun == len(plan) and not result.skipped and not result.expectedFailures
    return {'status': 'PASS' if good else 'FAIL', 'plan': plan, 'testsRun': result.testsRun,
            'failures': len(result.failures), 'errors': len(result.errors), 'skipped': len(result.skipped),
            'expectedFailures': len(result.expectedFailures), 'unexpectedSuccesses': len(result.unexpectedSuccesses)}


def main():
    requested_run = os.environ.get('MOODY_EVIDENCE_ID')
    identity = observed_identity()
    os.environ['MOODY_EVIDENCE_ID'] = identity['run']['id']
    assert re.fullmatch(r'[a-zA-Z0-9_-]{1,100}', identity['run']['id']), 'Invalid evidence ID'
    destination = ROOT / 'tests/artifacts/ci' / identity['run']['id'] / 'package-contracts.json'
    report = {'schema': 1, 'kind': 'package-contracts', 'identity': identity, 'status': 'PARTIAL',
              'scope': 'Same environment and source; not cross-OS/zlib or installed ModLoader/release proof',
              'runtime': {'python': platform.python_version(), 'zlibRuntime': zlib.ZLIB_RUNTIME_VERSION},
              'expectedPackages': [name for name, _, _ in package_paths()], 'builds': [],
              'negativeTests': {'status': 'UNVERIFIED', 'testsRun': 0}}
    write_json(destination, report)
    try:
        report['versionSources'] = check_version_sources()
        first, packages = build_observation(identity, requested_run)
        report['builds'].append(first)
        report['contracts'] = packages
        write_json(destination, report)
        # Genuine new compiler and archive invocations; no deletion of old logs or broad dist trees.
        subprocess.run(['node', str(ROOT / 'scripts/build-framework.mjs')], cwd=ROOT, check=True)
        build_packages()
        assert observed_source() == identity['source'], 'CJ3C_SOURCE_CHANGED_BETWEEN_BUILDS'
        second, packages = build_observation(identity, identity['run']['id'])
        report['builds'].append(second)
        assert first['receipt']['invocation'] != second['receipt']['invocation'], 'CJ3C_REUSED_BUILD_RECEIPT'
        differences = []
        for left, right in zip(first['snapshots'], second['snapshots']):
            differences.extend({'package': left['file'], **difference} for difference in compare_snapshots(left, right))
        report['reproducibility'] = {'status': 'FAIL' if differences else 'PASS', 'differences': differences}
        assert not differences, 'CJ3C_REPRODUCIBILITY: ' + json.dumps(differences, ensure_ascii=False)
        report['contracts'] = packages
        report['negativeTests'] = negative_tests()
        assert report['negativeTests']['status'] == 'PASS', 'CJ3C_NEGATIVE_TESTS_NOT_PASSING'
        assert observed_source() == identity['source'], 'CJ3C_SOURCE_CHANGED_DURING_NEGATIVES'
        report['status'] = 'PASS'
        write_json(destination, report)
        output = ROOT / 'dist/ci-packages'
        output.mkdir(parents=True, exist_ok=True)
        allowed = {path.name for _, path, _ in package_paths()} | {'PACKAGE_CHECKS.json', 'SHA256SUMS.txt'}
        assert all(path.name in allowed for path in output.iterdir()), 'Unexpected CI artifact; use a clean output directory'
        for _, path, _ in package_paths():
            (output / path.name).write_bytes(path.read_bytes())
        write_json(output / 'PACKAGE_CHECKS.json', report)
        payloads = sorted(path for path in output.iterdir() if path.name != 'SHA256SUMS.txt')
        (output / 'SHA256SUMS.txt').write_text(''.join(f'{digest(path.read_bytes())}  {path.name}\n' for path in payloads), encoding='utf-8')
        for package in packages:
            print(f"PASS {package['file']} {package['sha256']}")
        print('PASS CJ3C independent versions, eight package contracts and two fresh builds (members/bytes/metadata/ZIP SHA)')
    except Exception as error:
        report.update(status='FAIL', failure={'type': type(error).__name__, 'message': str(error)[:8000]})
        write_json(destination, report)
        raise


if __name__ == '__main__':
    if sys.argv[1:] == ['build']:
        build_packages()
    else:
        assert not sys.argv[1:], 'Expected no arguments or build'
        main()
