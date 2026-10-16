export interface LayoutPreferences {order: string[]; hidden: string[]; density: 'comfortable' | 'compact'}
export const defaultLayout = (): LayoutPreferences => ({order: [], hidden: [], density: 'comfortable'});
const valid = (key: unknown): key is string => typeof key === 'string' && /^[A-Za-z][A-Za-z0-9_.-]{0,79}:[A-Za-z][A-Za-z0-9_.-]{0,79}$/.test(key);
export function readLayout(storage: Pick<Storage, 'getItem'>, key: string): LayoutPreferences {
 try {
  const raw = storage.getItem(key);
  if (!raw || raw.length > 32768) return defaultLayout();
  const data = JSON.parse(raw);
  if (!data || typeof data !== 'object' || Array.isArray(data)) return defaultLayout();
  const list = (value: unknown) => Array.isArray(value) ? [...new Set(value.filter(valid))].slice(0, 100) : [];
  return {order: list(data.order), hidden: list(data.hidden), density: data.density === 'compact' ? 'compact' : 'comfortable'};
 } catch {return defaultLayout()}
}
export function saveLayout(storage: Pick<Storage, 'setItem'>, key: string, value: LayoutPreferences) {
 try {storage.setItem(key, JSON.stringify({order: value.order, hidden: value.hidden, density: value.density})); return true}
 catch {return false}
}
