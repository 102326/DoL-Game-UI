export interface Area {left: number; top: number; width: number; height: number}
export interface Position {side: 'left' | 'right'; y: number; docked: boolean}
export const positionKey = 'StoneFreeMotionHub.position.v1';
export const initialPosition = (): Position => ({side: 'right', y: .58, docked: false});
export const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(Math.max(min, max), value));
export function readPosition(raw: string | null): Position {
 try {
  if (!raw || raw.length > 1024) return initialPosition();
  const value = JSON.parse(raw);
  if (!value || !['left', 'right'].includes(value.side) || typeof value.y !== 'number' || !Number.isFinite(value.y) || typeof value.docked !== 'boolean') return initialPosition();
  return {side: value.side, y: clamp(value.y, 0, 1), docked: value.docked};
 } catch {return initialPosition()}
}
export function locate(position: Position, area: Area) {
 const width = position.docked ? 38 : 56, height = position.docked ? 72 : 56, gap = position.docked ? 0 : 12;
 return {x: position.side === 'left' ? area.left + gap : area.left + area.width - width - gap,
  y: area.top + 12 + Math.max(0, area.height - height - 24) * position.y};
}
