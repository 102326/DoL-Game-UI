import '../../../framework/boot';
import {preview,publishTheme,type Preset} from './provider';
import {paint,mountConsumer} from './consumer';
const host=window.DoLUiHost!;
host.sceneReady();
const provider=publishTheme(host);
const select=document.querySelector('select')!;
const draft=()=>select.value as Preset;
const update=()=>paint(document.querySelector('#preview')!,preview(draft()));
select.onchange=update;update();
document.querySelector<HTMLButtonElement>('#apply')!.onclick=()=>provider.apply(draft());
const remove=document.querySelector<HTMLButtonElement>('#remove')!;
if(new URLSearchParams(location.search).has('solo'))remove.hidden=true;
else {
 const dispose=mountConsumer(host,'ThemeWorkbench',document.querySelector('#a')!);
 remove.onclick=()=>{dispose();remove.hidden=true};
}
mountConsumer(host,'ThemeInspector',document.querySelector('#b')!);
