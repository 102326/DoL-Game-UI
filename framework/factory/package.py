from pathlib import Path
import json,zipfile,re
root=Path(__file__).resolve().parent
meta=json.loads((root/'package.json').read_text(encoding='utf-8'))
assert re.fullmatch(r'[A-Za-z][A-Za-z0-9]{0,63}',meta['modName']),'Invalid technical Mod name'
assert re.fullmatch(r'\d+\.\d+\.\d+(?:-[A-Za-z0-9.-]+)?',meta['version']),'Invalid package version'
styles=['style.css'] if (root/'dist/style.css').is_file() else []
boot=dict(name=meta['modName'],version=meta['version'],scriptFileList=['index.js'],styleFileList=styles,tweeFileList=[],imgFileList=[],
          additionFile=['LICENSE','README.md','THIRD-PARTY-NOTICES.txt'],dependenceInfo=[{'modName':'ModLoader','version':'>=2.100.0'},{'modName':'StoneFreeHost','version':'=0.1.0-experimental'}])
files={name:(root/'dist'/name).read_bytes() for name in ['index.js']+styles}
for name in ['LICENSE','README.md']:files[name]=(root/name).read_bytes()
licenses=[]
for module in ['vue','@vue/shared','@vue/reactivity','@vue/runtime-core','@vue/runtime-dom']:
    licenses.append(module+'\n'+next((root/'node_modules'/module).glob('LICENSE*')).read_text(encoding='utf-8'))
files['THIRD-PARTY-NOTICES.txt']='\n\n'.join(licenses).encode()
files['boot.json']=json.dumps(boot,ensure_ascii=False,indent=2).encode()
target=root/'dist'/f"{meta['modName']}-{meta['version']}.mod.zip"
with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED) as z:
    for name,payload in sorted(files.items()):
        item=zipfile.ZipInfo(name,(2026,1,1,0,0,0));item.compress_type=zipfile.ZIP_DEFLATED;z.writestr(item,payload)
with zipfile.ZipFile(target) as z:
    assert z.testzip() is None and len(z.namelist())==len(files) and set(z.namelist())==set(files)
    assert all(z.read(name)==payload for name,payload in files.items())
print(target)
