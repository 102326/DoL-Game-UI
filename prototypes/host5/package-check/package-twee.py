"""Package only the fixed public tool manifest, README and locally built entry."""
import sys
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo

source, output = map(Path, sys.argv[1:])
with ZipFile(output, 'w') as archive:
    for name in ('boot.json', 'README.md', 'dist/TweeReplacer.js'):
        info = ZipInfo(name, (2026, 1, 1, 0, 0, 0))
        archive.writestr(info, (source / name).read_bytes(), compress_type=ZIP_DEFLATED, compresslevel=6)
