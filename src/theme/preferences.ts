import type {PanelKind} from '../panels/main';
export const defaults={enabled:true,comfortable:true,showCompact:false,layout:true,compactStats:false,wideReading:false,collapsedStats:false,statusPreview:false,wardrobePaged:false,shopDeferredPaint:false};
export type Preferences=typeof defaults;
export type PreferenceKey=keyof Preferences;
export interface SettingsState {preferences:Preferences;combat:boolean;wardrobe:boolean;characteristics:boolean;social:boolean;shop:boolean;panels:Record<PanelKind,boolean>;message:string}
