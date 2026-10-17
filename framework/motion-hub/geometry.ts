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
export function menuLayout(point: {x:number;y:number}, area: Area, count: number, preferGrid = false, ballWidth = 56) {
 const margin = 12, gap = 12, right = area.left + area.width, bottom = area.top + area.height;
 const leftSpace = point.x - area.left - margin - gap, rightSpace = right - point.x - ballWidth - margin - gap;
 const side = rightSpace >= 210 ? 'right' : leftSpace >= 210 ? 'left' : rightSpace >= leftSpace ? 'right' : 'left';
 const fan = !preferGrid && count <= 3 && area.height >= 290 && Math.max(leftSpace, rightSpace) >= 210;
 const width = fan ? 210 : Math.min(210, area.width - margin * 2);
 let x = side === 'right' ? point.x + ballWidth + gap : point.x - width - gap;
 x = clamp(x, area.left + margin, right - width - margin);
 const overlapsBall = x < point.x + ballWidth + gap && x + width > point.x - gap;
 let height = fan ? 266 : Math.min(area.height - margin * 2, count * 51 + 100);
 let y = clamp(point.y - (fan ? 95 : height / 2), area.top + margin, bottom - height - margin);
 if (!fan && overlapsBall) {
  const above = point.y - area.top - margin - gap, below = bottom - point.y - 56 - margin - gap;
  if (above >= below) {height = Math.min(height, Math.max(0, above)); y = point.y - gap - height}
  else {height = Math.min(height, Math.max(0, below)); y = point.y + 56 + gap}
 }
 return {x,y,width,height,grid:!fan,petalX:side === 'right' ? 0 : 74};
}
