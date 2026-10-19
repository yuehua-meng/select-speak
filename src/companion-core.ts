export interface Point { x: number; y: number }
export interface Rect extends Point { width: number; height: number }
export interface AlphaMask { width: number; height: number; alpha: number[] }
export interface CompanionPreferences {
  visible: boolean; scale: number; locked: boolean; resting: boolean; position?: Point;
}
export interface CompanionState {
  speech: string; enabled: boolean; resting: boolean; locked: boolean; scale: number; doubleClickMs: number;
}
export const imageBox = { x: 30, y: 54, width: 220, height: 220 * 1312 / 1199 };
export const canvasSize = { width: 280, height: 318 };
export function preferences(value: any): CompanionPreferences {
  return {
    visible: value?.visible !== false,
    scale: [0.75, 1, 1.25].includes(value?.scale) ? value.scale : 1,
    locked: value?.locked === true, resting: value?.resting === true,
    position: Number.isFinite(value?.position?.x) && Number.isFinite(value?.position?.y)
      ? { x: Math.round(value.position.x), y: Math.round(value.position.y) } : undefined
  };
}
export function clampPosition(point: Point, size: {width: number; height: number}, work: Rect): Point {
  return {
    x: Math.round(Math.max(work.x, Math.min(point.x, work.x + Math.max(0, work.width - size.width)))),
    y: Math.round(Math.max(work.y, Math.min(point.y, work.y + Math.max(0, work.height - size.height))))
  };
}
// Sample the original transparency, with a small margin for the breathing animation.
export function hitsImage(point: Point, mask: AlphaMask, margin = 5): boolean {
  const box = imageBox;
  const mx = Math.floor((point.x - box.x) / box.width * mask.width);
  const my = Math.floor((point.y - box.y) / box.height * mask.height);
  const rx = Math.ceil(margin / box.width * mask.width);
  const ry = Math.ceil(margin / box.height * mask.height);
  for (let y = my - ry; y <= my + ry; y++) for (let x = mx - rx; x <= mx + rx; x++) {
    if (x >= 0 && y >= 0 && x < mask.width && y < mask.height && mask.alpha[y * mask.width + x] > 32) return true;
  }
  return false;
}
export function dragMoved(start: Point, current: Point): boolean {
  return Math.hypot(current.x - start.x, current.y - start.y) >= 6;
}
