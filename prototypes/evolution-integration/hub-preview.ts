import {createHost} from '../../framework/host';
import {startOfficialHub} from '../../framework/official-ui/hub';
import {startTheme} from '../../src/theme/controller';
import {startFloatingTools} from '../../src/floating/main';
import {nativeNavigation} from '../../framework/official-ui/navigation';

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
let stop=startOfficialHub(host,owner);
bodyAction.onclick=()=>notice.textContent='正文操作成功';
export const hubPreview={
 host,owner,floating,navigation,counts:()=>({native:count,settings,inspector}),
 stop(){stop()},remount(){stop();stop=startOfficialHub(host,owner)},
 dispose(){stop();owner.dispose();host.dispose();floating.destroy();navigation.dispose();theme.destroy();Reflect.deleteProperty(window,'DoLGameUI')}
};
Object.assign(window,{hubPreview});
