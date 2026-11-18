import {createHost} from '../../framework/host';
import {startOfficialHub} from '../../framework/official-ui/hub';
import {startTheme} from '../../src/theme/controller';
import {startFloatingTools} from '../../src/floating/main';
import {nativeNavigation} from '../../framework/official-ui/navigation';
import {startOfficialMotion} from '../../framework/official-ui/motion';

import './entry-c.css';
import './menu-preview.css';

const query = new URLSearchParams(location.search);
const menu = query.get('menu');
const previewLayout = menu === 'drawer' ? 'drawer' : menu === 'list' || menu === '' ? 'list' : undefined;
if (previewLayout) {
 const heading = document.querySelector('#hub-preview-scene h1');
 if (heading) {
  heading.textContent = '双菱形 · 工具菜单';
  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', '菜单布局');
  for (const [id, label] of [['list', '列表'], ['drawer', '抽屉']] as const) {
   const link = document.createElement('a');
   link.href = '?menu=' + id;
   link.textContent = label;
   if (id === previewLayout) link.setAttribute('aria-current', 'page');
   nav.append(link);
  }
  heading.after(nav);
 }
}

const entry = new URLSearchParams(location.search).get('entry');
if (!previewLayout && (entry === 'c46' || entry === 'c56')) {
 document.documentElement.dataset.previewEntry = entry;
 const heading = document.querySelector('#hub-preview-scene h1');
 if (heading) heading.textContent = entry === 'c46' ? '细线入口 · 原稿比例 46%' : '细线入口 · 放大试样 56%';
}

const root:NonNullable<Parameters<typeof startTheme>[0]>=window;
startTheme(root);
const theme=root.DoLMidnightTheme;if(!theme)throw Error('Missing settings preview owner');
Object.assign(window,{Weather:{name:'rain',precipitation:'rain',precipitationIntensity:1.7,dayState:'day'}});
const navigation=nativeNavigation(),floating=startFloatingTools(window,false),host=createHost(window),owner=host.register('SoftWetOfficialUI');
host.sceneReady();
let count=0,settings=0,inspector=0;
const notice=document.getElementById('notice'),bodyAction=document.getElementById('body-action');
if(!notice||!bodyAction)throw Error('Missing Hub preview controls');
for(const button of document.querySelectorAll('#overlayButtons [data-preview-native]'))button.addEventListener('click',()=>{notice.textContent='原生动作：'+(++count)+' 次 · '+button.textContent});
Object.assign(window,{DoLGameUI:{
 openSettings(){settings++;theme.openSettings();navigation.refresh()},
 ui:{openInspector(){inspector++;notice.textContent='本页模拟的运行检查通知'}}
}});
let stop=startOfficialHub(host,owner,previewLayout),stopMotion:(()=>void)|undefined;
bodyAction.onclick=()=>notice.textContent='正文操作成功';
export const hubPreview={
 host,owner,floating,navigation,
 enableOfficialMotion(){if(stopMotion)return;navigation.dispose();stopMotion=startOfficialMotion(window)},
 counts:()=>({native:count,settings,inspector}),
 stop(){stop()},remount(){stop();stop=startOfficialHub(host,owner,previewLayout)},
 dispose(){stopMotion?.();stopMotion=undefined;stop();owner.dispose();host.dispose();floating.destroy();navigation.dispose();theme.destroy();Reflect.deleteProperty(window,'DoLGameUI')}
};
Object.assign(window,{hubPreview});
