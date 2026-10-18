import type {UiApi, StyleAdapter, AdapterHandle} from '../../src/public/ui';
declare const window: Window & {DoLGameUI?:{ui?:Partial<UiApi>};CheatExtendedSoftWet?:{getDiagnostics():unknown;destroy():void}};
(function(){
 if(window.CheatExtendedSoftWet)return;
 const versions=['>=1.20.3.1','1.20.3.1-rebuild.30'];
 const contracts:StyleAdapter[]=[
  {id:'CheatExtendedSoftWet',version:'0.1.0',target:{name:'cheat extended',versions},scope:['#customOverlay[data-overlay="CEcheatMenu"]'],fingerprint:{id:'ce-two-level-overlay-1.20.3.1',safe:[[':scope>#customOverlayContent']],required:[['#customOverlayTitle #cheat_extended_options.CEtab'],['#cheat_extended_options>.CE-category-bar'],['#cheat_extended_options>.CE-subtab-bar'],['#customOverlayContent>#CE_settingsDiv']]},roles:[{role:'page-shell',selectors:[':scope']},{role:'title',selectors:['#customOverlayTitle']},{role:'toolbar',selectors:['#cheat_extended_options']},{role:'section',selectors:['#CE_settingsDiv']} ]},
  {id:'CheatExtendedInlineSoftWet',version:'0.1.0',target:{name:'cheat extended',versions},scope:['#customOverlay[data-overlay="cheats"] .CEDISPLAY'],fingerprint:{id:'ce-two-level-inline-1.20.3.1',safe:[[':scope>.CEDISPLAY_setting']],required:[[':scope>#cheat_extended_options.CEbuttonBar'],['#cheat_extended_options>.CE-category-bar'],['#cheat_extended_options>.CE-subtab-bar'],[':scope>.CEDISPLAY_setting>#CE_settingsDiv']]},roles:[{role:'toolbar',selectors:['#cheat_extended_options']},{role:'section',selectors:[':scope>.CEDISPLAY_setting']}]}
 ];
 let owner:Partial<UiApi>|undefined,handles:Readonly<AdapterHandle>[]=[],reason='runtime-unavailable';
 function attach(){try{const ui=window.DoLGameUI?.ui;if(owner===ui&&handles.length)return;for(const h of handles)h.destroy();handles=[];owner=ui;reason=ui?'runtime-api-unsupported':'runtime-unavailable';if(ui?.apiVersion!==1||typeof ui.getCapabilities!=='function'||typeof ui.registerStyleAdapter!=='function'||!ui.getCapabilities().styleAdapters)return;for(const spec of contracts)handles.push(ui.registerStyleAdapter(spec));reason='registered'}catch{for(const h of handles)h.destroy();handles=[];owner=undefined;reason='registration-failed'}}
 document.addEventListener('dol-ui-runtime-ready',attach);
 window.CheatExtendedSoftWet=Object.freeze({getDiagnostics:()=>handles.length?handles.map(h=>h.getDiagnostics()):[{status:'inactive',reason}],destroy(){document.removeEventListener('dol-ui-runtime-ready',attach);for(const h of handles)h.destroy();handles=[];owner=undefined;delete window.CheatExtendedSoftWet}});attach();
})();
