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
