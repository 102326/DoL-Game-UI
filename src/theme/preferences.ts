import type {PanelKind} from '../panels/types';
import {acrylicDefault} from './acrylic';
export const readingDefaults={readingLineScale:100,readingBlockGap:0,readingWidth:0};
export const readingRanges={
 readingLineScale:{min:100,max:160,step:5,label:'正文行距',description:'100%跟随原版；调大后文字行距更宽松。'},
 readingBlockGap:{min:0,max:24,step:2,label:'段落与选项间距',description:'在原版段落、已识别选项和自有表单间增加留白；0为紧凑默认，不改变业务内容。'},
 readingWidth:{min:0,max:100,step:5,label:'正文宽度',description:'从原版宽度逐渐放宽到可用空间；窄屏或原本已铺满时变化较小。'},
};
export type ReadingKey=keyof typeof readingDefaults;
export const defaults={...readingDefaults,enabled:true,combatFocused:false,storyActions:false,comfortable:false,mobileCompactControls:false,centerOptions:false,acrylicTransparency:acrylicDefault,showCompact:false,layout:true,compactStats:false,wideReading:false,collapsedStats:false,statusPreview:false,wardrobePaged:true,wardrobeHiddenList:false,shopDeferredPaint:false,shopPageExperiment:false,startupCacheLazy:false,savesV2:false,fontScale:100,buttonScale:100,visualTier:1,visualGlass:true,visualMotion:true,visualGlow:true,visualPattern:false};
// Retired flags remain false for existing preference readers; they no longer activate runtime code.
export type Preferences=typeof defaults;
export type PreferenceKey=keyof Preferences;
export interface SettingsState {preferences:Preferences;scaleMax:150;saves:boolean;combat:boolean;wardrobe:boolean;characteristics:boolean;social:boolean;shop:boolean;shopPageExperimentAvailable:boolean;panels:Record<PanelKind,boolean>;message:string}
