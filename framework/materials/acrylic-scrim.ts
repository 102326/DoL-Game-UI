import type {MountContext} from '../contracts';

/** Mount into a caller-owned positioned stacking context. Never changes the parent. */
export function acrylicScrim({element}: MountContext) {
 element.setAttribute('aria-hidden','true');
 element.inert = true;
 Object.assign(element.style,{
  position:'absolute', inset:'0', zIndex:'-1', borderRadius:'inherit',
  pointerEvents:'none', backgroundColor:'var(--sf-scrim-tint, rgba(30,34,40,.36))',
  backdropFilter:'blur(var(--sf-scrim-blur, 4px))',
 });
 element.style.setProperty('-webkit-backdrop-filter','blur(var(--sf-scrim-blur, 4px))');
}
