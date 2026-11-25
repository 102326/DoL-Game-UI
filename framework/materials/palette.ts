export const colorDefaults = {
 background: '#242426',
 panel: '#272729',
 text: '#e6e6e8',
 muted: '#aaa9ad',
 accent: '#c9c9cd',
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

/** This palette preserves the dark material and existing light semantic indicators. */
export function appearancePalette(colors: Partial<Record<ColorRole,string>>) {
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
  onAccent: lightness(accent) >= .179 ? '#000000' : '#ffffff'};
 return {palette, adjusted: colorRoles.some(role => colors[role] && wanted[role] !== palette[role])};
}

export function readingSurface(panel:string,text:string){
 return hex(mix(rgb(panel),rgb(text),.05));
}
