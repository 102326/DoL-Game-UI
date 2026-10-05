import type {NativeEventsHost} from '../runtime/sugarcube';
/** Native contracts read by the wardrobe UI; unknown Mod fields are preserved. */
export interface Clothing extends Record<string,unknown> {
 name:string;variable?:string;modder?:string;
 cn_name_cap?:string;cn_name?:string;name_cap?:string;description?:string;cn_description?:string;
 colour?:string|number;colourCustom?:unknown;accessory?:number;accessory_colour?:string|number;accessory_colourCustom?:unknown;
 pattern?:string|number;pattern_options?:unknown[];pattern_layer?:unknown;
 colour_options?:unknown[];accessory_colour_options?:unknown[];
 integrity?:number;integrity_max?:number;reveal?:number;warmth?:number;
 outfitPrimary?:Record<string,string>;outfitSecondary?:[string,string];
}
export interface Inventory extends Record<string,unknown> {
 space?:number;locationRequirement?:string[];
 name?:string;cn_name?:string;unlocked?:unknown;shopSend?:unknown;transfer?:unknown;
}
export type ClothingSlots=Record<string,Clothing[]>;
export type Worn=Record<string,Clothing>;
export interface WardrobeVariables extends Record<string,unknown> {
 worn:Worn;wardrobe:Inventory;wardrobes?:Record<string,Inventory>;
 location:string;wardrobe_location?:string;lastWardrobeSlot?:string;
 options?:{images?:number;showSidebarEffects?:boolean};
 wardrobeDefaults?:{showTraits?:boolean;extraInfo?:boolean};
 settings?:{multipleWardrobes?:boolean};player?:{bodyshape?:string};
 wardrobeOption?:string;tailorMonthlyService?:string|number;
}
export interface WardrobeSetup extends Record<string,unknown> {
 clothes:ClothingSlots;
 colourName?:(colour:unknown)=>unknown;
}
export type WikifierConstructor=new (output:HTMLElement,source:string)=>unknown;
export type NativeWidgetHost=Window & {SugarCube?:{Wikifier?:WikifierConstructor};Wikifier?:WikifierConstructor};
/** Renderer calls used by the private preview, not a public game rendering API. */
export interface PreviewRenderer {
 composeLayers:(context:CanvasRenderingContext2D|null,layers:unknown[],frames:number,callbacks:{renderingDone:()=>void;loadError:()=>void;error:()=>void})=>unknown;
 lintRgbStaged:(position:number,gradient:unknown)=>{toHexString:()=>string};
 mergeLayerData:unknown;emptyLayerFilter:unknown;lastCall?:[unknown,...unknown[]];
}
export type WardrobeDataHost=NativeWidgetHost & NativeEventsHost & {
 SugarCube?:{State?:{variables?:WardrobeVariables;passage?:unknown};setup?:WardrobeSetup};
 State?:{variables?:WardrobeVariables;passage?:unknown};V?:WardrobeVariables;setup?:WardrobeSetup;
 getCustomColourName?:(colour:unknown)=>unknown;getTrueWarmth?:(item:Clothing)=>number;
 normaliseFileName?:(name:string)=>string;isConnectedToHood?:(slot:string)=>boolean;
 clothingData?:(slot:string,item:Clothing,field:string)=>unknown;
 modUtils?:{getImage?:(src:string)=>string|undefined|Promise<string|undefined>};
 Renderer?:PreviewRenderer;Skin?:{color:unknown;tanningLayers:unknown};
 Transformations?:{defaults?:{demon?:{colour?:unknown}}};
 C?:{tiredness?:{max?:number}};ZIndices?:unknown;
};
