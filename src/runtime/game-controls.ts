import type {RequestedPages} from '../theme/page-preferences';
import type {Preferences} from '../theme/preferences';
import type {UiApi} from '../public/ui';
import type {WardrobeApi} from '../public/wardrobe';
export interface GameUiControls {version:string;openSettings:()=>void;getPreferences:()=>Partial<Preferences> & Record<string,unknown>;getRequestedPreferences:()=>Preferences & RequestedPages;setPreference:(key:string,value:boolean|number)=>void;destroy:()=>void;ui?:UiApi;wardrobe?:Readonly<WardrobeApi>}
