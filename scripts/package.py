from pathlib import Path
import json,zipfile,hashlib,os
root=Path(__file__).resolve().parent.parent
version=json.loads((root/'package.json').read_text())['version']
boot={'name':'DoLGameUI','version':version,'scriptFileList':['game-ui.js'],'styleFileList':['game-ui.css'],'tweeFileList':[],'imgFileList':[],'additionFile':['README.md','THIRD-PARTY-NOTICES.txt'],'dependenceInfo':[{'modName':'ModLoader','version':'>=2.100.0'}]}
assets={name:(root/'dist'/name).read_bytes() for name in boot['scriptFileList']+boot['styleFileList']}
assets['LICENSE']=(root/'LICENSE').read_bytes()
boot['additionFile'].append('LICENSE')
for name in ['UPSTREAM-RENDERER-LICENSE','UPSTREAM-RENDERER-NOTICE.md']:
 assets[name]=(root/name).read_bytes();boot['additionFile'].append(name)
for name in ['CHANGELOG.md','docs/VALIDATION.md','docs/DEVELOPMENT.md']:
 assets[name]=(root/name).read_bytes();boot['additionFile'].append(name)
boot['dependenceInfo'].append({'modName':'GameVersion','version':'=0.5.11.9'})
assets['boot.json']=json.dumps(boot,ensure_ascii=False,indent=2).encode();assets['README.md']=(root/'README.md').read_bytes()
notices=[]
for name in ['vue','@vue/shared','@vue/reactivity','@vue/runtime-core','@vue/runtime-dom','tailwindcss']:
 license=next((root/'node_modules'/name).glob('LICENSE*'));notices.append(name+'\n'+license.read_text(encoding='utf-8'))
assets['THIRD-PARTY-NOTICES.txt']='\n\n'.join(notices).encode()
filename=f'DoLGameUI-{version}.mod.zip';target=root/'dist'/filename
with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
 for name,data in sorted(assets.items()):
  item=zipfile.ZipInfo(name,(2026,1,1,0,0,0));item.compress_type=zipfile.ZIP_DEFLATED;z.writestr(item,data)
with zipfile.ZipFile(target) as z:
 assert z.testzip() is None and set(z.namelist())==set(assets)
 assert all(z.read(name)==data for name,data in assets.items())
release=target
if os.environ.get('DOL_RELEASE_DIR'):
 release=Path(os.environ['DOL_RELEASE_DIR'])/filename
 release.parent.mkdir(parents=True,exist_ok=True)
 if release.resolve()!=target.resolve(): release.write_bytes(target.read_bytes())
print(json.dumps({'file':str(release),'bytes':release.stat().st_size,'sha256':hashlib.sha256(release.read_bytes()).hexdigest()}))
