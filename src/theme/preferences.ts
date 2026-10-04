import type {PanelKind} from '../panels/main';
export const defaults={enabled:true,comfortable:true,mobileCompactControls:false,showCompact:false,layout:true,compactStats:false,wideReading:false,collapsedStats:false,statusPreview:false,wardrobePaged:true,wardrobeHiddenList:false,shopDeferredPaint:false,shopPageExperiment:false,startupCacheLazy:false,savesV2:false,fontScale:100,buttonScale:100,visualTier:1,visualGlass:true,visualMotion:true,visualGlow:true,visualPattern:false};
export type Preferences=typeof defaults;
export type PreferenceKey=keyof Preferences;
export interface SettingsState {preferences:Preferences;scaleMax:150|200;saves:boolean;combat:boolean;wardrobe:boolean;characteristics:boolean;social:boolean;shop:boolean;shopPageExperimentAvailable:boolean;panels:Record<PanelKind,boolean>;message:string}
