import type {Clothing} from './host';
export type ClothingIconLayer={src:string;className:string;style:string};

const text=(value:unknown)=>typeof value==='string'?value:'';
const safeName=(value:string,normalise:(s:string)=>string)=>{
 try{const result=normalise(value).replace(/[\\\0\r\n]/g,'');return result.includes('..')?'':result.replace(/^\/+?/,'');}catch{return '';}
};
const colourClass=(value:unknown,normalise:(s:string)=>string)=>{const colour=text(value);if(!colour||colour==='custom')return '';const name=safeName(colour,normalise).replace(/[^a-zA-Z0-9_-]/g,'-');return name?`icon-${name}`:'';};
const customStyle=(value:unknown)=>{const raw=text(value).trim();const filter=raw.match(/^filter\s*:\s*(.+)$/i)?.[1]?.replace(/;\s*$/,'').trim()||'';return filter&&/^[^;{}]+$/.test(filter)&&!/url\s*\(/i.test(filter)&&!/expression\s*\(/i.test(filter)?`filter:${filter}`:'';};
const path=(name:string,normalise:(s:string)=>string,suffix='')=>{const file=safeName(name,normalise);return file?`img/misc/icon/clothes/${file}${suffix}`:'';};
const patternPath=(base:unknown,pattern:unknown,normalise:(s:string)=>string)=>{const a=safeName(text(base),normalise),b=safeName(text(pattern),normalise);return a&&b?`img/misc/icon/clothes/${a}-${b}.png`:'';};

export function clothingIconLayers(raw:Clothing|undefined,descriptor:Clothing|undefined,normalise:(s:string)=>string):ClothingIconLayer[]{
 if(!descriptor)return [];
 const item=descriptor;const worn:Partial<Clothing>=raw||{};const layers:ClothingIconLayer[]=[];
 const add=(src:string,className:string,style='')=>{if(src)layers.push({src,className:`icon ${className}`.trim(),style});};
 const pattern=text(worn.pattern)||text(item.pattern_options?.[0]);
 const iconName=text(item.iconFile)||text(item.name);
 if(item.iconFile){
  const src=typeof item.iconFile==='string'&&item.iconFile==='pattern'&&(!['secondary','tertiary'].includes(text(item.pattern_layer)))
   ?patternPath(item.outfitPrimary?.[1]||item.name,pattern,normalise):typeof item.iconFile==='string'?path(iconName,normalise):path(iconName,normalise,'.png');
  const colourable=worn.colour!==0&&!(Array.isArray(item.colour_options)&&item.colour_options.length<2);
  const classes=colourable?colourClass(worn.colour,normalise):'';add(src,classes,worn.colour==='custom'&&colourable?customStyle(worn.colourCustom):'');
 }
 if(item.accIcon!==0&&(item.accessory!==0||item.breast_acc_img)){
  const name=text(item.accIcon)||text(item.name);const src=typeof item.accIcon==='string'&&item.accIcon==='pattern'&&['secondary','tertiary'].includes(text(item.pattern_layer))
   ?patternPath(item.outfitSecondary?.[1]||item.name,pattern,normalise):typeof item.accIcon==='string'?path(name,normalise):path(name,normalise,'-acc.png');
  const colourable=!!worn.accessory_colour&&!(Array.isArray(item.accessory_colour_options)&&item.accessory_colour_options.length<2)&&!(item.accIcon==='pattern'&&item.pattern_layer==='tertiary');
  const classes=colourable?colourClass(worn.accessory_colour,normalise):'';add(src,`accIcon ${classes}`,worn.accessory_colour==='custom'&&colourable?customStyle(worn.accessory_colourCustom):'');
 }
 if(item.detailIcon){
  const name=text(item.detailIcon)||text(item.name);const src=typeof item.detailIcon==='string'&&item.detailIcon==='pattern'&&item.pattern_layer==='tertiary'
   ?patternPath(item.name,pattern,normalise):typeof item.detailIcon==='string'?path(name,normalise):path(name,normalise,'-detail.png');add(src,'accIcon');
 }
 return layers;
}
