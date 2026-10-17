from pathlib import Path
import json,zipfile,hashlib,os,re,subprocess
root=Path(__file__).resolve().parent.parent
version=json.loads((root/'package.json').read_text())['version']
runtime_version=re.search(r"DoLGameUI=\{version:'([^']+)'",(root/'src/main.ts').read_text(encoding='utf-8'))
assert runtime_version and runtime_version.group(1)==version,'Runtime and package versions differ'
experiment_version=re.search(r"api\.version = '([^']+)'",(root/'shop-page-experiment.ts').read_text(encoding='utf-8'))
assert experiment_version and experiment_version.group(1)==version,'Shop experiment and package versions differ'
boot={'name':'DoLGameUI','nickName':'DoL Soft & Wet Game UI','description':'Soft & Wet UI for Degrees of Lewdity','version':version,'scriptFileList_inject_early':['shop-page-experiment.js'],'scriptFileList':['game-ui.js'],'styleFileList':['game-ui.css'],'tweeFileList':[],'imgFileList':[],'additionFile':['README.md','THIRD-PARTY-NOTICES.txt'],'dependenceInfo':[{'modName':'ModLoader','version':'>=2.100.0'},{'modName':'TweeReplacer','version':'>=1.0.0'}],'addonPlugin':[{'modName':'TweeReplacer','addonName':'TweeReplacerAddon','modVersion':'>=1.0.0','params':[]}]}
assets={name:(root/'dist'/name).read_bytes() for name in boot['scriptFileList']+boot['styleFileList']}
subprocess.run(['node',str(root/'scripts/build-early.cjs')],check=True,cwd=root)
subprocess.run(['node',str(root/'node_modules/typescript/bin/tsc'),'-p',str(root/'tsconfig.public.json')],check=True,cwd=root)
assets['shop-page-experiment.js']=(root/'dist/shop-page-experiment.js').read_bytes()
for filename in ['ui.d.ts','wardrobe.d.ts']:
 declaration=root/'dist/types'/filename
 name='types/'+declaration.name
 assets[name]=declaration.read_bytes();boot['additionFile'].append(name)
from shop_package import add_shop_patches
add_shop_patches(root,boot,assets)
assets['LICENSE']=(root/'LICENSE').read_bytes()
boot['additionFile'].append('LICENSE')
for name in ['UPSTREAM-RENDERER-LICENSE','UPSTREAM-RENDERER-NOTICE.md']:
 assets[name]=(root/name).read_bytes();boot['additionFile'].append(name)
for name in ['docs/UI_SETTINGS.md',f'docs/RELEASE_{version}.md','docs/OPTIONAL_ADAPTERS.md']:
 assets[name]=(root/name).read_bytes();boot['additionFile'].append(name)
boot['dependenceInfo'].append({'modName':'GameVersion','version':'=0.5.11.9 || =0.5.12.13'})
assets['boot.json']=json.dumps(boot,ensure_ascii=False,indent=2).encode();assets['README.md']=(root/'README.md').read_bytes()
notices=[]
for name in ['vue','@vue/shared','@vue/reactivity','@vue/runtime-core','@vue/runtime-dom','tailwindcss']:
 license=next((root/'node_modules'/name).glob('LICENSE*'));notices.append(name+'\n'+license.read_text(encoding='utf-8'))
assets['THIRD-PARTY-NOTICES.txt']='\n\n'.join(notices).encode()
filename=f'DoL-SoftWet-GameUI-{version}.mod.zip';target=root/'dist'/filename
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
