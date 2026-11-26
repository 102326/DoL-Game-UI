"""Build the opt-in effect provider and independent observatory Mod as separate ZIPs."""
from pathlib import Path
import hashlib
import json
import subprocess
import zipfile

here = Path(__file__).resolve().parent
root = here.parents[2]
out = root / "dist/host5/workspace-weather"
out.mkdir(parents=True, exist_ok=True)
version = "0.1.0-prototype"

for name, entry, has_style in [("Host5Atmosphere", "provider", True), ("Host5Observatory", "entry", False)]:
    subprocess.run(["node", "--input-type=module", "-e", """
import {build} from 'esbuild';
await build({entryPoints:[process.argv[1]], bundle:true, outfile:process.argv[2],
    format:'iife', target:'es2020', minify:true});
""", str(here / f"{entry}.ts"), str(out / f"{name}.js")], cwd=root, check=True)
    dependencies = [dict(modName="ModLoader", version=">=2.100.0"),
                    dict(modName="StoneFreeHost", version="=0.1.5-experimental")]
    if not has_style:
        dependencies.append(dict(modName="Host5Atmosphere", version=f"={version}"))
    meta = dict(name=name, version=version, scriptFileList=["index.js"], styleFileList=["index.css"] if has_style else [],
                tweeFileList=[], imgFileList=[], additionFile=["LICENSE", "README.md"], dependenceInfo=dependencies)
    members = {"index.js": (out / f"{name}.js").read_bytes(), "boot.json": json.dumps(meta, indent=2).encode(),
               "LICENSE": (root / "LICENSE").read_bytes(), "README.md": (here / "README.md").read_bytes()}
    if has_style:
        members["index.css"] = (out / f"{name}.css").read_bytes()
    target = out / f"{name}-{version}.mod.zip"
    with zipfile.ZipFile(target, "w") as archive:
        for key, value in sorted(members.items()):
            member = zipfile.ZipInfo(key, (2026, 1, 1, 0, 0, 0))
            archive.writestr(member, value, compress_type=zipfile.ZIP_DEFLATED)
    with zipfile.ZipFile(target) as archive:
        assert archive.testzip() is None and set(archive.namelist()) == set(members)
    print(target.name, target.stat().st_size, hashlib.sha256(target.read_bytes()).hexdigest())
