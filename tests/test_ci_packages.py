"""Real ZIP mutations must fail; the original package stays untouched."""
import importlib.util
import json
from pathlib import Path
import sys
import tempfile
import unittest
import warnings
import zipfile

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))
spec = importlib.util.spec_from_file_location('check_ci_packages', ROOT / 'scripts/check-ci-packages.py')
checks = importlib.util.module_from_spec(spec)
spec.loader.exec_module(checks)


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
                    with zipfile.ZipFile(target, 'w') as archive:
                        for key, value in files.items():
                            archive.writestr(key, value)
                        if defect == 'duplicate':
                            with warnings.catch_warnings():
                                warnings.simplefilter('ignore', UserWarning)
                                archive.writestr('index.js', clean['index.js'])
                    with self.assertRaises((AssertionError, KeyError)):
                        checks.check_package(target, name)


if __name__ == '__main__':
    unittest.main()
