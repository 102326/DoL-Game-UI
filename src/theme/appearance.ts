import {readColors,type ColorRole} from '../../framework/materials/palette';
export {colorDefaults,colorRoles,appearancePalette,type ColorRole} from '../../framework/materials/palette';
export interface Appearance {
 colors: Partial<Record<ColorRole, string>>;
 font: string;
}
export const emptyAppearance = (): Appearance => ({colors: {}, font: ''});
export const fontPattern = /^[\p{L}\p{N}][\p{L}\p{N} ._-]{0,63}$/u;
export const systemFont = 'system-ui, -apple-system, "Segoe UI", sans-serif';

export function readAppearance(value: unknown): Appearance {
 const result = emptyAppearance();
 if (!value || typeof value !== 'object') return result;
 const font: unknown = Reflect.get(value, 'font');
 if (typeof font === 'string' && fontPattern.test(font.trim())) result.font = font.trim();
 result.colors=readColors(Reflect.get(value,'colors'));
 return result;
}

export function appearanceFont(font: string) {
 return font ? `"${font}", ${systemFont}` : systemFont;
}
