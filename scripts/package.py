from pathlib import Path
import json,zipfile,hashlib,os,re
root=Path(__file__).resolve().parent.parent
version=json.loads((root/'package.json').read_text())['version']
runtime_version=re.search(r"DoLGameUI=\{version:'([^']+)'",(root/'src/main.ts').read_text(encoding='utf-8'))
assert runtime_version and runtime_version.group(1)==version,'Runtime and package versions differ'
experiment_version=re.search(r"api\.version = '([^']+)'",(root/'shop-page-experiment.js').read_text(encoding='utf-8'))
assert experiment_version and experiment_version.group(1)==version,'Shop experiment and package versions differ'
boot={'name':'DoLGameUI','version':version,'scriptFileList_inject_early':['startup-cache-experiment.js','shop-page-experiment.js'],'scriptFileList':['game-ui.js'],'styleFileList':['game-ui.css'],'tweeFileList':[],'imgFileList':[],'additionFile':['README.md','THIRD-PARTY-NOTICES.txt'],'dependenceInfo':[{'modName':'ModLoader','version':'>=2.100.0'},{'modName':'TweeReplacer','version':'>=1.0.0'}],'addonPlugin':[{'modName':'TweeReplacer','addonName':'TweeReplacerAddon','modVersion':'>=1.0.0','params':[]}]}
assets={name:(root/'dist'/name).read_bytes() for name in boot['scriptFileList']+boot['styleFileList']}
assets['startup-cache-experiment.js']=(root/'startup-cache-experiment.js').read_bytes()
assets['shop-page-experiment.js']=(root/'shop-page-experiment.js').read_bytes()
shop_patches=[
 ('服装店按需分页：锁定本次列表渲染开关','\t<div id="shop-list-pages" class="shop-list-pages">','twee/patch-list-mode.twee'),
 ('服装店按需分页：关闭时保留原版后台生成','\t\t<!-- Generate other pages in background after a delay, so that shop can be displayed sooner -->\n\t\t<!-- Having all pages loaded allows for very fast shop catalogue navigation -->\n\t\t<!-- Generate via <<repeat>> one by one to not cause a lag spike -->\n\t\t<<timed 0.2s>>\n\t\t\t<<set _ppre = _startingShopPage - 1>>\n\t\t\t<<repeat 0.1s>>\n\t\t\t\t<<if document.getElementById("shop-list-pages") eq null or _ppre lt 0>>\n\t\t\t\t\t<<stop>>\n\t\t\t\t<</if>>\n\t\t\t\t<!-- Prepend pages before the current page -->\n\t\t\t\t<<prepend \'#shop-list-pages\'>>\n\t\t\t\t\t<<generateshoppage _ppre>>\n\t\t\t\t<</prepend>>\n\t\t\t\t<<set _ppre-->>\n\t\t\t<</repeat>>\n\t\t\t<!-- Append pages after the current page -->\n\t\t\t<<set _papp = _startingShopPage + 1>>\n\t\t\t<<repeat 0.1s>>\n\t\t\t\t<<if document.getElementById("shop-list-pages") eq null or _papp gte _maxPage>>\n\t\t\t\t\t<<stop>>\n\t\t\t\t<</if>>\n\t\t\t\t<<append \'#shop-list-pages\'>>\n\t\t\t\t\t<<generateshoppage _papp>>\n\t\t\t\t<</append>>\n\t\t\t\t<<set _papp++>>\n\t\t\t<</repeat>>\n\t\t<</timed>>','twee/patch-background.twee'),
 ('服装店按需分页：翻页时只生成目标页','\t<<run $(\'#shop-list-pages > div.clothing-shop-page\').addClass(\'hidden no-numberify\')>>\n\t<<run $(\'#shop-list-pages > div.clothing-shop-page:nth-of-type(\' + ($shopPage + 1) + \')\').removeClass(\'hidden no-numberify\')>>','twee/patch-page-change.twee'),
 ('服装店按需分页：只复用实验模式的分页宽度监听器','\t<<run $(window).on(\'resize\', () => {\n\t\tlet pagination = $(\'#shop-pagination\');\n\t\tlet pages = $(pagination).find(\'.shop-pages\');\n\t\tlet buttons = $(pagination).find(\'.btn-pagination\');\n\t\tlet isEnoughSpace = (pagination.width() - buttons.outerWidth() * 2 - 32) / pages.children().length >= 22;\n\n\t\tpages.toggleClass(\'hidden\', !isEnoughSpace);\n\t\tpagination.find(\'.shop-pages-number\').toggleClass(\'hidden\', isEnoughSpace);\n\t})>>','twee/patch-resize.twee')]
for tip,find_string,replace_file in shop_patches:
 boot['addonPlugin'][0]['params'].append({'tip':tip,'passage':'Clothing Shop v2 Widgets','findString':find_string,'replaceFile':replace_file})
 assets[replace_file]=(root/replace_file).read_bytes()
assets['LICENSE']=(root/'LICENSE').read_bytes()
boot['additionFile'].append('LICENSE')
for name in ['UPSTREAM-RENDERER-LICENSE','UPSTREAM-RENDERER-NOTICE.md']:
 assets[name]=(root/name).read_bytes();boot['additionFile'].append(name)
for name in ['CHANGELOG.md','docs/VALIDATION.md','docs/DEVELOPMENT.md','docs/RELEASE_2.0.0.md','docs/RELEASE_2.0.1.md','docs/RELEASE_2.0.2.md','docs/RELEASE_2.0.2_PUBLIC.md','docs/UI_SETTINGS.md']:
 assets[name]=(root/name).read_bytes();boot['additionFile'].append(name)
boot['dependenceInfo'].append({'modName':'GameVersion','version':'=0.5.11.9 || =0.5.12.13'})
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
