import '../../../framework/boot';
import {resolveTheme} from '../../../framework/materials/theme';
import {paint,mountConsumer} from './consumer';
const host=window.DoLUiHost!;
host.sceneReady();
const provider=host.theme!;
provider.apply(provider.presets.graphite);
const select=document.querySelector('select')!;
const draft=()=>provider.presets[select.value as keyof typeof provider.presets];
const update=()=>paint(document.querySelector('#preview')!,resolveTheme(draft()));
select.onchange=update;update();
document.querySelector<HTMLButtonElement>('#apply')!.onclick=()=>provider.apply(draft());
const remove=document.querySelector<HTMLButtonElement>('#remove')!;
if(new URLSearchParams(location.search).has('solo'))remove.hidden=true;
else {
 const dispose=mountConsumer(host,'ThemeWorkbench',document.querySelector('#a')!);
 remove.onclick=()=>{dispose();remove.hidden=true};
}
mountConsumer(host,'ThemeInspector',document.querySelector('#b')!);
