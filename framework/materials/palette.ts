export const colorDefaults = {
 background: '#14161a',
 panel: '#252a32',
 text: '#e6e9ee',
 muted: '#939ca8',
 accent: '#93b5ca',
};
export type ColorRole = keyof typeof colorDefaults;
export const colorRoles = Object.keys(colorDefaults) as ColorRole[];
export function readColors(colors:unknown):Partial<Record<ColorRole,string>>{
 const result:Partial<Record<ColorRole,string>>={};
 if(colors&&typeof colors==='object'){
  for(const key of colorRoles){
   const color:unknown=Reflect.get(colors,key);
   if(typeof color==='string'&&/^#[0-9a-f]{6}$/i.test(color))result[key]=color.toLowerCase();
  }
 }
 return result;
}

export type ThemeMode = 'mist'|'porcelain';

type RGB = [number, number, number];
const black: RGB = [0, 0, 0], white: RGB = [255, 255, 255];
const rgb = (hex: string): RGB => [1, 3, 5].map(i => Number.parseInt(hex.slice(i, i + 2), 16)) as RGB;
const hex = (color: RGB) => '#' + color.map(channel => channel.toString(16).padStart(2, '0')).join('');
const mix = (from: RGB, to: RGB, ratio: number): RGB =>
 from.map((channel, index) => Math.round(channel + (to[index]! - channel) * ratio)) as RGB;
function lightness(color: RGB) {
 const channels = color.map(value => value / 255).map(value =>
  value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
 return .2126 * channels[0]! + .7152 * channels[1]! + .0722 * channels[2]!;
}
function adjust(from: RGB, toward: RGB, fits: (color: RGB) => boolean): RGB {
 if (fits(from)) return from;
 let low = 0, high = 1;
 for (let i = 0; i < 10; i++) {
  const mid = (low + high) / 2;
  if (fits(mix(from, toward, mid))) high = mid;
  else low = mid;
 }
 return mix(from, toward, high);
}

export const lightDesigns = {
 mist: {
  colors: {background:'#e6ecf2',panel:'#f7f9fc',text:'#1a232e',muted:'#546273',accent:'#366a92'},
  rail:'#edf2f7', reading:'#f4f7fa', well:'#e9eff5', link:'#245b87', focus:'#1f5b8a', glassMin:.83,
 },
 porcelain: {
  colors: {background:'#ebe9e5',panel:'#faf9f6',text:'#22201d',muted:'#656058',accent:'#476c7b'},
  rail:'#f1efea', reading:'#f6f5f1', well:'#edece7', link:'#345e70', focus:'#2e5a6c', glassMin:.85,
 },
} as const;

function lightInk(value:string, minimum:number) {
 return hex(adjust(rgb(value),black,color=>(minimum+.05)/(lightness(color)+.05)>=5.15));
}

/** Only an explicitly selected light preset opts into dark ink. Legacy colors keep their policy. */
export function appearancePalette(colors: Partial<Record<ColorRole,string>>, mode?:ThemeMode) {
 if(mode){
  const design=lightDesigns[mode], wanted={...design.colors,...colors};
  const background=adjust(rgb(wanted.background),white,color=>lightness(color)>=.70);
  const panel=adjust(rgb(wanted.panel),white,color=>lightness(color)>=.70);
  const hover=mix(panel,black,.025);
  // The darkest permitted composite includes the most transparent shell over black.
  const darkest=Math.min(lightness(background),lightness(hover),lightness(mix(black,panel,design.glassMin)));
  const ink=(value:string)=>lightInk(value,darkest);
  const accent=ink(wanted.accent), customAccent=wanted.accent!==design.colors.accent;
  const palette={background:hex(background),panel:hex(panel),hover:hex(hover),text:ink(wanted.text),
   muted:ink(wanted.muted),accent,onAccent:'#ffffff',error:ink('#b33840'),success:ink('#266e44'),
   warning:ink('#8b6014'),price:ink('#8b6014'),link:customAccent?accent:ink(design.link),focus:customAccent?accent:ink(design.focus)};
  return {palette,adjusted:colorRoles.some(role=>colors[role]&&wanted[role]!==palette[role])};
 }
 const wanted = {...colorDefaults, ...colors};
 const background = adjust(rgb(wanted.background), black, color => lightness(color) <= .072);
 const panel = adjust(rgb(wanted.panel), black, color => lightness(color) <= .072);
 const hover = mix(panel, white, .055);
 const brightest = Math.max(lightness(background), lightness(panel), lightness(hover));
 const readable = (value: string) => adjust(rgb(value), white, color =>
  (lightness(color) + .05) / (brightest + .05) >= 4.5);
 const accent = readable(wanted.accent);
 const palette = {background: hex(background), panel: hex(panel), hover: hex(hover),
  text: hex(readable(wanted.text)), muted: hex(readable(wanted.muted)), accent: hex(accent),
  onAccent: lightness(accent) >= .179 ? '#000000' : '#ffffff',
  error:'#ffb0b0',success:'#9de3b1',warning:'#ffd88a',price:'#ffd88a',link:hex(accent),focus:hex(accent)};
 return {palette, adjusted: colorRoles.some(role => colors[role] && wanted[role] !== palette[role])};
}

/** Intermediate solid surfaces between the chosen canvas and panel. */
export function materialSurfaces(background:string,panel:string,mode?:ThemeMode){
 const base=rgb(background),face=rgb(panel);
 return {
  canvas:background, reading:background,
  rail:hex(mix(base,face,.42)),
  well:hex(background===panel?mix(face,black,mode ? .04 : .18):mix(base,face,.50)),
 };
}
