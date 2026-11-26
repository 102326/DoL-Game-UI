import {createHost} from '../../../../framework/host';
import {startTheme} from '../../../../src/theme/controller';
import {windowKeys} from './bridge';
const host=createHost(window);window.DoLUiHost=host;
const doc=document;
doc.documentElement.toggleAttribute('data-plain',new URLSearchParams(location.search).has('plain'));
function attachSettings(){
 startTheme(window,undefined,'modeless');
 const settings=doc.querySelector<HTMLDialogElement>('#dol-midnight-controls')!;
 windowKeys(settings,()=>settings.querySelector<HTMLButtonElement>('.dmt-close')!.click());
 const ui=Reflect.get(window,'DoLMidnightTheme') as {openSettings():void};
 return ()=>ui.openSettings();
}
let openSettings=new URLSearchParams(location.search).has('e39')?undefined:attachSettings();
doc.querySelector<HTMLButtonElement>('#settings')!.onclick=()=>{openSettings??=attachSettings();openSettings()};
const ordinary=doc.querySelector<HTMLButtonElement>('#ordinary')!;
ordinary.onclick=()=>ordinary.dataset.count=String(Number(ordinary.dataset.count??0)+1);
const native=doc.querySelector<HTMLDialogElement>('#native')!;
doc.querySelector<HTMLButtonElement>('#modal')!.onclick=()=>native.showModal();
native.querySelector('button')!.onclick=()=>native.close();
