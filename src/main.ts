import {startSaves} from './saves/main';
import {startShop} from './shop/main';
import {startPanels,type PanelKind} from './panels/main';
import {startSocial} from './social/main';
import {startCharacteristics} from './characteristics/main';
import {startStatusPreview} from './runtime/preview';
import {startWardrobe} from './wardrobe/main';
import {startCombat} from './combat/main';
import {startLayout} from './theme/layout.js';
import {startTheme} from './theme/controller';
import './theme/midnight.css';
import './theme/controls.css';
import './theme/layout.css';
import './tokens.css';
const runtime=window as typeof window & Record<string,any>;
if(!runtime.DoLGameUI){
 runtime.DoLCombatUI?.destroy();
 runtime.DoLMidnightTheme?.destroy();
 runtime.DMTLayout?.destroy();
 runtime.DoLStatusPreview=startStatusPreview(runtime);
 runtime.DoLWardrobeUI=startWardrobe(runtime);
 runtime.DoLCharacteristicsUI=startCharacteristics(runtime);
 runtime.DoLSocialUI=startSocial(runtime);
 runtime.DoLPanelsUI=startPanels(runtime);
 runtime.DoLShopUI=startShop(runtime);
 runtime.DoLSavesUI=startSaves(runtime);
 startCombat();startLayout();startTheme();
 runtime.DoLGameUI={version:'1.0.9',openSettings:()=>runtime.DoLMidnightTheme?.openSettings(),
  getPreferences:()=>({...runtime.DoLMidnightTheme?.getPreferences(),savesEnabled:runtime.DoLSavesUI?.getEnabled(),shopEnabled:runtime.DoLShopUI?.getEnabled(),combatEnabled:runtime.DoLCombatUI?.getEnabled(),wardrobeEnabled:runtime.DoLWardrobeUI?.getEnabled(),characteristicsEnabled:runtime.DoLCharacteristicsUI?.getEnabled(),socialEnabled:runtime.DoLSocialUI?.getEnabled(),...Object.fromEntries(['journal','traits','statistics','feats','cheats','attitudes','settings'].map(kind=>[`${kind}Enabled`,runtime.DoLPanelsUI?.getEnabled(kind)]))}),
  setPreference(key:string,value:boolean|number){if(key.endsWith("Enabled")&&typeof value!=="boolean")return;if(key==='savesEnabled')runtime.DoLSavesUI?.setEnabled(value);else if(key==='shopEnabled')runtime.DoLShopUI?.setEnabled(value);else if(['journalEnabled','traitsEnabled','statisticsEnabled','featsEnabled','cheatsEnabled','attitudesEnabled','settingsEnabled'].includes(key))runtime.DoLPanelsUI?.setEnabled(key.replace('Enabled','') as PanelKind,value);else if(key==='socialEnabled')runtime.DoLSocialUI?.setEnabled(value);else if(key==='characteristicsEnabled')runtime.DoLCharacteristicsUI?.setEnabled(value);else if(key==='wardrobeEnabled')runtime.DoLWardrobeUI?.setEnabled(value);else if(key==='combatEnabled')runtime.DoLCombatUI?.setEnabled(value);else runtime.DoLMidnightTheme?.setPreference(key,value)},
  destroy(){runtime.DoLSavesUI?.destroy();delete runtime.DoLSavesUI;runtime.DoLShopUI?.destroy();delete runtime.DoLShopUI;runtime.DoLPanelsUI?.destroy();delete runtime.DoLPanelsUI;runtime.DoLSocialUI?.destroy();delete runtime.DoLSocialUI;runtime.DoLCharacteristicsUI?.destroy();delete runtime.DoLCharacteristicsUI;runtime.DoLWardrobeUI?.destroy();delete runtime.DoLWardrobeUI;runtime.DoLStatusPreview?.destroy();delete runtime.DoLStatusPreview;runtime.DoLCombatUI?.destroy();runtime.DoLMidnightTheme?.destroy();delete runtime.DoLGameUI}
 };
}
