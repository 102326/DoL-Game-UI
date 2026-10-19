"""Real ZIP mutations must fail; the original package stays untouched."""
import importlib.util
import copy
import shutil
import json
from pathlib import Path
import sys
import tempfile
import unittest
import warnings
import runpy
from unittest.mock import patch
import zipfile

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))
spec = importlib.util.spec_from_file_location('check_ci_packages', ROOT / 'scripts/check-ci-packages.py')
checks = importlib.util.module_from_spec(spec)
spec.loader.exec_module(checks)


def rewrite_zip(target, original, files, mutate_info=None, reverse=False, archive_comment=b'', duplicate=None):
    with zipfile.ZipFile(original) as archive:
        infos = {name: copy.copy(archive.getinfo(name)) for name in archive.namelist()}
    with zipfile.ZipFile(target, 'w') as archive:
        archive.comment = archive_comment
        for name in sorted(files, reverse=reverse):
            info = infos.get(name, zipfile.ZipInfo(name, (2026, 1, 1, 0, 0, 0)))
            if name not in infos:
                info.create_system = 3
                info.external_attr = 0o600 << 16
                info.compress_type = zipfile.ZIP_DEFLATED
            if mutate_info:
                mutate_info(info)
            archive.writestr(info, files[name], compress_type=info.compress_type, compresslevel=6)
        if duplicate:
            with warnings.catch_warnings():
                warnings.simplefilter('ignore', UserWarning)
                archive.writestr(copy.copy(infos[duplicate]), files[duplicate], compress_type=infos[duplicate].compress_type, compresslevel=6)


def contents(path):
    with zipfile.ZipFile(path) as archive:
        return {name: archive.read(name) for name in archive.namelist()}


class PackageChecks(unittest.TestCase):
    def test_rejects_broken_packages(self):
        for name, (version, _) in checks.PACKAGES.items():
            original = ROOT / 'dist/framework' / f'{name}-{version}.mod.zip'
            checks.check_package(original, name)
            with zipfile.ZipFile(original) as archive:
                clean = {key: archive.read(key) for key in archive.namelist()}
            for defect in ['license', 'dependency', 'entry', 'payload', 'unsafe', 'extra', 'duplicate']:
                with self.subTest(package=name, defect=defect), tempfile.TemporaryDirectory() as tmp:
                    files = dict(clean)
                    if defect == 'license':
                        del files['LICENSE']
                    elif defect == 'dependency':
                        boot = json.loads(files['boot.json'])
                        boot['dependenceInfo'][0]['version'] = '*'
                        files['boot.json'] = json.dumps(boot).encode()
                    elif defect == 'entry':
                        del files['index.js']
                    elif defect == 'payload':
                        files['index.js'] += b'\n/* unverified replacement */'
                    elif defect == 'unsafe':
                        files['../outside'] = b'bad'
                    elif defect == 'extra':
                        files['private.save'] = b'not for distribution'
                    target = Path(tmp) / original.name
                    rewrite_zip(target, original, files, duplicate='index.js' if defect == 'duplicate' else None)
                    reason = {'license': 'Missing referenced member', 'dependency': 'Dependency policy drift',
                              'entry': 'Missing referenced member', 'payload': 'Member differs from build/source input',
                              'unsafe': 'Unsafe ZIP path', 'extra': 'Missing or unexpected ZIP member',
                              'duplicate': 'Duplicate ZIP member'}[defect]
                    with self.assertRaisesRegex(AssertionError, reason):
                        checks.check_package(target, name)



class AdapterDeterminism(unittest.TestCase):
    def test_ignores_source_mtime_and_permissions(self):
        import os
        import subprocess
        import hashlib
        with tempfile.TemporaryDirectory() as tmp:
            folder = Path(tmp)
            boot = {'name': 'ControlledFixture', 'version': '1.0.0',
                    'dependenceInfo': [{'modName': 'ControlledTarget', 'version': '>=1.0.0'}],
                    'scriptFileList': ['fixture.js'], 'styleFileList': [], 'tweeFileList': [],
                    'additionFile': ['README.md', 'LICENSE']}
            (folder / 'boot.json').write_text(json.dumps(boot), encoding='utf-8')
            for name in ['fixture.js', 'README.md', 'LICENSE']:
                (folder / name).write_text('controlled first-party fixture', encoding='utf-8')
            observations = []
            for stamp, mode in [(946684800, 0o644), (946857600, 0o600)]:
                for file in folder.iterdir():
                    if file.is_file():
                        os.utime(file, (stamp, stamp))
                        file.chmod(mode)
                subprocess.run([sys.executable, str(ROOT / 'scripts/package-adapter.py'), str(folder)], check=True, stdout=subprocess.DEVNULL)
                target = next((folder / 'dist').glob('*.mod.zip'))
                with zipfile.ZipFile(target) as archive:
                    observations.append({'sha256': hashlib.sha256(target.read_bytes()).hexdigest(),
                                         'members': {name: archive.read(name) for name in archive.namelist()}})
            self.assertEqual(observations[0]['members'], observations[1]['members'])
            self.assertEqual(observations[0]['sha256'], observations[1]['sha256'], 'CJ3C: unrelated source mtime/permissions must not alter ZIP bytes')


class SourceVersions(unittest.TestCase):
    def test_rejects_mismatches_in_independent_sources(self):
        files = ['package.json', 'framework/official-ui/main.ts', 'scripts/package-framework.py',
                 'framework/contracts.ts', 'framework/host/README.md', 'framework/official-ui/README.md']
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            originals = {name: (ROOT / name).read_text(encoding='utf-8') for name in files}
            def restore():
                for name, text in originals.items():
                    (root / name).parent.mkdir(parents=True, exist_ok=True)
                    (root / name).write_text(text, encoding='utf-8')
            restore()
            self.assertEqual(checks.check_version_sources(root)['status'], 'PASS')
            for defect, reason in [('root', 'CJ3C_VERSION_ROOT'), ('joint-ui', 'CJ3C_VERSION_ROOT'),
                                   ('runtime', 'CJ3C_VERSION_RUNTIME'), ('host', 'CJ3C_VERSION_HOST'),
                                   ('protocol', 'CJ3C_HOST_PROTOCOL'), ('range', 'CJ3C_HOST_RANGE')]:
                with self.subTest(defect=defect):
                    restore()
                    if defect in ['root', 'joint-ui']:
                        data = json.loads((root / 'package.json').read_text(encoding='utf-8'))
                        data['version'] = '3.0.3'
                        (root / 'package.json').write_text(json.dumps(data), encoding='utf-8')
                    if defect in ['runtime', 'joint-ui']:
                        (root / 'framework/official-ui/main.ts').write_text(originals['framework/official-ui/main.ts'].replace("visualVersion='3.0.2'", "visualVersion='3.0.3'"), encoding='utf-8')
                    if defect == 'joint-ui':
                        # Producer follows the wrong root version too: independent policy must still refuse it.
                        (root / 'scripts/package-framework.py').write_text(originals['scripts/package-framework.py'].replace("official_version if directory", "'3.0.3' if directory"), encoding='utf-8')
                    if defect == 'host':
                        (root / 'scripts/package-framework.py').write_text(originals['scripts/package-framework.py'].replace("host_version = '0.1.4-experimental'", "host_version = '3.0.1'"), encoding='utf-8')
                    if defect == 'protocol':
                        (root / 'framework/contracts.ts').write_text(originals['framework/contracts.ts'].replace("PROTOCOL = '0.1-experimental'", "PROTOCOL = '0.2-experimental'"), encoding='utf-8')
                    if defect == 'range':
                        (root / 'scripts/package-framework.py').write_text(originals['scripts/package-framework.py'].replace("host_requirement = '>=0.1.2-experimental && <0.2.0'", "host_requirement = '*'"), encoding='utf-8')
                    with self.assertRaisesRegex(AssertionError, reason):
                        checks.check_version_sources(root)


class OptionalContracts(unittest.TestCase):
    def test_all_six_positive_and_precise_mutations(self):
        self.assertEqual(len(checks.ADAPTERS), 6)
        self.assertNotIn('lyra-wardrobe-mouth-soft-wet', checks.ADAPTERS)
        for directory in checks.ADAPTERS:
            policy, filename = checks.adapter_policy(directory)
            original = ROOT / 'compat' / directory / 'dist' / filename
            self.assertEqual(checks.check_adapter(original, directory)['status'], 'PASS')
            clean = contents(original)
            for defect, reason in [('version', 'CJ3C_ADAPTER_POLICY'), ('dependency', 'CJ3C_ADAPTER_POLICY'),
                                   ('entry-list', 'CJ3C_ADAPTER_POLICY'), ('missing', 'CJ3C_ADAPTER_MEMBERS'),
                                   ('extra', 'CJ3C_ADAPTER_MEMBERS'), ('unsafe', 'Unsafe ZIP path'),
                                   ('license', 'CJ3C_ADAPTER_BYTES'), ('payload', 'CJ3C_ADAPTER_BYTES'),
                                   ('duplicate', 'Duplicate ZIP member')]:
                with self.subTest(package=directory, defect=defect), tempfile.TemporaryDirectory() as tmp:
                    files = dict(clean)
                    boot = json.loads(files['boot.json'])
                    script = policy['scriptFileList'][0]
                    if defect == 'version': boot['version'] = '9.9.9'
                    if defect == 'dependency': boot['dependenceInfo'][0]['version'] = '*'
                    if defect == 'entry-list': boot['scriptFileList'] = ['replacement.js']
                    if defect in ['version', 'dependency', 'entry-list']: files['boot.json'] = json.dumps(boot).encode()
                    if defect == 'missing': del files[script]
                    if defect == 'extra': files['private.save'] = b'controlled counterexample only'
                    if defect == 'unsafe': files['../outside'] = b'controlled'
                    if defect == 'license': files['LICENSE'] += b' altered'
                    if defect == 'payload': files[script] += b' altered'
                    target = Path(tmp) / original.name
                    rewrite_zip(target, original, files, duplicate=script if defect == 'duplicate' else None)
                    with self.assertRaisesRegex(AssertionError, reason): checks.check_adapter(target, directory)

    def test_joint_manifest_corruption_and_incomplete_compilation(self):
        directory = 'modhub-soft-wet'
        policy, filename = checks.adapter_policy(directory)
        original = ROOT / 'compat' / directory / 'dist' / filename
        with tempfile.TemporaryDirectory() as tmp:
            fixture_root = Path(tmp)
            base = ROOT / 'compat' / directory
            destination = fixture_root / 'compat' / directory
            # Copy only the known contract inputs; never sweep arbitrary local reproduction files.
            for name in ['boot.json'] + [name for field in checks.ENTRY_FIELDS for name in policy[field]]:
                relative = 'dist/scripts/' + name if name.endswith('.js') else name
                (destination / relative).parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(base / relative, destination / relative)
            prior_root = checks.ROOT
            try:
                checks.ROOT = fixture_root
                self.assertEqual(checks.check_adapter(original, directory)['status'], 'PASS')
                bad = contents(original)
                manifest = json.loads(bad['boot.json'])
                manifest['dependenceInfo'][0]['version'] = '*'
                bad['boot.json'] = json.dumps(manifest).encode()
                (fixture_root / 'compat' / directory / 'boot.json').write_bytes(bad['boot.json'])
                target = fixture_root / filename
                rewrite_zip(target, original, bad)
                with self.assertRaisesRegex(AssertionError, 'CJ3C_ADAPTER_POLICY'):
                    checks.check_adapter(target, directory)
                (fixture_root / 'compat' / directory / 'boot.json').write_bytes(contents(original)['boot.json'])
                (fixture_root / 'compat' / directory / 'dist/scripts' / policy['scriptFileList'][0]).unlink()
                with self.assertRaisesRegex(AssertionError, 'CJ3C_ADAPTER_INPUT'):
                    checks.check_adapter(original, directory)
            finally:
                checks.ROOT = prior_root
        with tempfile.TemporaryDirectory() as tmp:
            base = Path(tmp)
            (base / 'dist/scripts').mkdir(parents=True)
            manifest = {'name': 'ControlledFixture', 'version': '1.0.0', 'dependenceInfo': [{'modName': 'ControlledTarget', 'version': '>=1.0.0'}], 'scriptFileList': ['fixture.js']}
            (base / 'boot.json').write_text(json.dumps(manifest), encoding='utf-8')
            (base / 'fixture.ts').write_text('export const fresh = true;', encoding='utf-8')
            (base / 'dist/scripts/fixture.js').write_text('stale output', encoding='utf-8')
            (base / 'dist/preserved.log').write_text('keep unrelated local log', encoding='utf-8')
            with patch.object(sys, 'argv', ['package-adapter.py', str(base)]), patch('subprocess.run') as compiler:
                compiler.return_value.returncode = 0  # Controlled compiler exits 0 but writes nothing.
                with self.assertRaisesRegex(AssertionError, 'CJ3C_MISSING_COMPILED_ADAPTER'):
                    runpy.run_path(str(ROOT / 'scripts/package-adapter.py'), run_name='__main__')
            self.assertEqual((base / 'dist/preserved.log').read_text(encoding='utf-8'), 'keep unrelated local log')
        mouth = json.loads((ROOT / 'compat/mouth-compat-051213/boot.json').read_text(encoding='utf-8'))
        mouth['dependenceInfo'].append({'modName': 'DoLGameUI', 'version': '>=3.0.0'})
        with self.assertRaisesRegex(AssertionError, 'CJ3C_ADAPTER_POLICY'):
            checks.check_adapter_manifest(mouth, 'mouth-compat-051213')
        legacy = json.loads((ROOT / 'compat/lyra-wardrobe-mouth-soft-wet/boot.json').read_text(encoding='utf-8'))
        with self.assertRaisesRegex(AssertionError, 'CJ3C_ADAPTER_POLICY'):
            checks.check_adapter_manifest(legacy, 'mouth-compat-051213')


class ZipMetadata(unittest.TestCase):
    def test_metadata_drift_and_comparison_diagnostics(self):
        original = ROOT / 'dist/framework/StoneFreeHost-0.1.4-experimental.mod.zip'
        checks.check_package(original, 'StoneFreeHost')
        clean = contents(original)
        mutations = {
            'time': lambda i: setattr(i, 'date_time', (2026, 1, 3, 0, 0, 0)),
            'permissions': lambda i: setattr(i, 'external_attr', 0o644 << 16),
            'system': lambda i: setattr(i, 'create_system', 0),
            'extra': lambda i: setattr(i, 'extra', b'\x01\x00\x00\x00'),
            'comment': lambda i: setattr(i, 'comment', b'controlled'),
            'compression': lambda i: setattr(i, 'compress_type', zipfile.ZIP_STORED),
        }
        for defect, mutate in mutations.items():
            with self.subTest(defect=defect), tempfile.TemporaryDirectory() as tmp:
                target = Path(tmp) / original.name
                rewrite_zip(target, original, clean, mutate_info=mutate)
                with self.assertRaisesRegex(AssertionError, 'CJ3C_ZIP_METADATA'):
                    checks.check_package(target, 'StoneFreeHost')
                differences = checks.compare_snapshots(checks.archive_snapshot(original), checks.archive_snapshot(target))
                self.assertTrue(any('member' in d and d['field'].startswith('metadata.') for d in differences))
        for defect in ['order', 'archive-comment', 'content', 'member']:
            with self.subTest(defect=defect), tempfile.TemporaryDirectory() as tmp:
                target = Path(tmp) / original.name
                files = dict(clean)
                if defect == 'content': files['index.js'] += b' altered'
                if defect == 'member': files['extra.txt'] = b'controlled'
                rewrite_zip(target, original, files, reverse=defect == 'order', archive_comment=b'controlled' if defect == 'archive-comment' else b'')
                differences = checks.compare_snapshots(checks.archive_snapshot(original), checks.archive_snapshot(target))
                expected = {'order': 'memberOrderOrSet', 'archive-comment': 'archiveComment', 'content': 'contentSha256', 'member': 'memberOrderOrSet'}[defect]
                self.assertTrue(any(d['field'] == expected for d in differences))
                if defect in ['order', 'archive-comment']:
                    with self.assertRaisesRegex(AssertionError, 'CJ3C_ZIP_ORDER' if defect == 'order' else 'CJ3C_ZIP_ARCHIVE_COMMENT'):
                        checks.check_package(target, 'StoneFreeHost')


class BuildEvidence(unittest.TestCase):
    def test_stale_incomplete_receipts_and_report_limit(self):
        # Receipts are mutated in an isolated directory; contract readers remain real.
        packages = checks.all_packages()
        records = [{key: item[key] for key in ['name', 'file', 'sha256']} for item in packages]
        paths = checks.package_paths()
        source = {'head': 'controlled', 'contentSha256': 'controlled'}
        receipt = {'source': source, 'runId': 'controlled-run', 'invocation': 'first', 'packages': records}
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            receipt_file = root / 'dist/CJ3C_BUILD_RECEIPT.json'
            with patch.object(checks, 'ROOT', root), patch.object(checks, 'all_packages', return_value=packages), patch.object(checks, 'package_paths', return_value=paths):
                checks.write_json(receipt_file, receipt)
                observation, _ = checks.build_observation({'source': source}, 'controlled-run')
                self.assertEqual(len(observation['snapshots']), 8)
                for mutation, reason in [({'source': {'head': 'old'}}, 'CJ3C_STALE_BUILD_SOURCE'),
                                         ({'runId': 'other'}, 'CJ3C_STALE_BUILD_RUN'),
                                         ({'invocation': ''}, 'CJ3C_MISSING_BUILD_INVOCATION'),
                                         ({'packages': records[:-1]}, 'CJ3C_INCOMPLETE_BUILD_RECEIPT'),
                                         ({'packages': [dict(r, sha256='bad') for r in records]}, 'CJ3C_INCOMPLETE_BUILD_RECEIPT')]:
                    with self.subTest(reason=reason):
                        checks.write_json(receipt_file, dict(receipt, **mutation))
                        with self.assertRaisesRegex(AssertionError, reason):
                            checks.build_observation({'source': source}, 'controlled-run')
                bounded = root / 'bounded.json'
                checks.write_json(bounded, {'status': 'PARTIAL'})
                original = bounded.read_bytes()
                with self.assertRaisesRegex(AssertionError, 'CJ3C_REPORT_LIMIT'):
                    checks.write_json(bounded, {'padding': 'x' * 262144})
                self.assertEqual(bounded.read_bytes(), original, 'oversized report must fail, never truncate into PASS')


if __name__ == '__main__':
    unittest.main()
