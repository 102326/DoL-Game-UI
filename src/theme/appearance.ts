import {colorRoles,lightDesigns,readColors,type ColorRole} from '../../framework/materials/palette';
export {colorDefaults,colorRoles,appearancePalette,type ColorRole} from '../../framework/materials/palette';
export interface Appearance {
 colors: Partial<Record<ColorRole, string>>;
 font: string;
}
export const emptyAppearance = (): Appearance => ({colors: {}, font: ''});
export const fontPattern = /^[\p{L}\p{N}][\p{L}\p{N} ._-]{0,63}$/u;
export const systemFont = 'system-ui, -apple-system, "Segoe UI", sans-serif';

export function retiredPreset(value:unknown) {
 if(!value || typeof value!=='object')return undefined;
 const mode:unknown=Reflect.get(value,'themeMode');
 return mode==='mist'||mode==='porcelain' ? lightDesigns[mode].colors : undefined;
}

export function readAppearance(value: unknown): Appearance {
 const result = emptyAppearance();
 if (!value || typeof value !== 'object') return result;
 const font: unknown = Reflect.get(value, 'font');
 if (typeof font === 'string' && fontPattern.test(font.trim())) result.font = font.trim();
 result.colors=readColors(Reflect.get(value,'colors'));
 const preset=retiredPreset(value);
 // A customized RC palette keeps its saved inputs and uses the normal dark palette policy.
 if(preset && colorRoles.every(role=>!result.colors[role] || result.colors[role]===preset[role]))result.colors={};
 return result;
}

export function appearanceFont(font: string) {
 return font ? `"${font}", ${systemFont}` : systemFont;
}
