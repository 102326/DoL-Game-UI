import type {PanelKind} from '../panels/main';
export const defaults={enabled:true,comfortable:true,showCompact:false,layout:true,compactStats:false,wideReading:false,collapsedStats:false,statusPreview:false,wardrobePaged:true,wardrobeHiddenList:false,shopDeferredPaint:false,shopPageExperiment:false,startupCacheLazy:false,savesV2:false,fontScale:100,buttonScale:100};
export type Preferences=typeof defaults;
export type PreferenceKey=keyof Preferences;
export interface SettingsState {preferences:Preferences;saves:boolean;combat:boolean;wardrobe:boolean;characteristics:boolean;social:boolean;shop:boolean;shopPageExperimentAvailable:boolean;panels:Record<PanelKind,boolean>;message:string}
