import type {CombatControls} from '../src/combat/types';
import type {GameUiControls} from '../src/runtime/game-controls';

function controlContract(api:GameUiControls){
 const prefs=api.getPreferences(),flag:boolean|undefined=prefs.visualGlass;
 const typed:0 extends (1&typeof prefs.visualGlass)?true:false=false;
 api.setPreference('fontScale',100);
 // @ts-expect-error The actual control entry accepts booleans or numbers.
 api.setPreference('fontScale',[]);
 // @ts-expect-error A known preference keeps its boolean type.
 const wrong:number|undefined=prefs.visualMotion;
 // @ts-expect-error Unrecognized third-party preference fields remain unknown.
 const external:string=prefs.foreign;
 return {flag,typed,wrong,external};
}
void controlContract;


function combatContract(api:CombatControls){
 const enabled:boolean=api.getEnabled();api.setEnabled(true);
 // @ts-expect-error The actual combat controller accepts a boolean.
 api.setEnabled(1);
 // @ts-expect-error Enabled state is not a string.
 const wrong:string=api.getEnabled();
 return {enabled,wrong};
}
void combatContract;


function panelContract(api:import('../src/panels/types').PanelControls){
 const enabled:boolean=api.getEnabled('journal');
 const count:number=api.getLifecycleCounts().mounts;
 api.setEnabled('settings',false);
 // @ts-expect-error Unknown panel names are not part of the native adapter contract.
 api.setEnabled('third-party-panel',true);
 // @ts-expect-error Display enablement accepts booleans, not numbers.
 api.setEnabled('journal',1);
 // @ts-expect-error Diagnostics retain numeric counts.
 const wrong:string=api.getLifecycleCounts().failures;
 return {enabled,count,wrong};
}
void panelContract;
