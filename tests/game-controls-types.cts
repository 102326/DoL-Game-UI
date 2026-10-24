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
