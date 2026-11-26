import {panelDrag} from '../ui/panel-drag';

export function settingsMaterial(shell:HTMLElement,handle:HTMLElement,core:HTMLElement,dialog:HTMLDialogElement){
 return panelDrag(shell,handle,core,{eligible:()=>dialog.open,lifecycle:dialog,marker:'data-dgu-settings-material'});
}
