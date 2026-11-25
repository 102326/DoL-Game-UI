// A visual viewport can shrink while the layout viewport stays put. Some WebViews
// shrink both. Only retain the previous height for a plausible editing session.
export function adaptiveViewport(surface: HTMLElement, notify: () => void) {
 const view = window.visualViewport;
 let stable = window.innerHeight, width = 0, viewportWidth = window.innerWidth;
 let angle = screen.orientation?.angle;
 function measure(containerWidth: number) {
  const height = window.innerHeight, direction = screen.orientation?.angle;
  const editing = document.activeElement instanceof HTMLElement &&
   surface.contains(document.activeElement) && (document.activeElement.isContentEditable ||
    document.activeElement.matches('textarea,input:not([type]),input:is([type=text],[type=search],[type=email],[type=url],[type=number],[type=password],[type=tel])'));
  const sameWidth = Math.abs(width-containerWidth)<=2 && Math.abs(window.innerWidth-viewportWidth)<=2;
  if (!editing || !sameWidth || angle!==direction || height>=stable) stable=height;
  width=containerWidth; viewportWidth=window.innerWidth; angle=direction;
  const visual = view?.scale===1 ? view.height : height;
  const inset = view?.scale===1 ? Math.max(0,height-visual-view.offsetTop) : 0;
  return {short:(editing && sameWidth && stable-height>=100 ? stable : height)<500, visual, inset};
 }
 window.addEventListener('resize',notify);
 view?.addEventListener('resize',notify);
 view?.addEventListener('scroll',notify);
 surface.addEventListener('focusin',notify);
 surface.addEventListener('focusout',notify);
 return {measure,dispose(){
  window.removeEventListener('resize',notify);
  view?.removeEventListener('resize',notify);
  view?.removeEventListener('scroll',notify);
  surface.removeEventListener('focusin',notify);
  surface.removeEventListener('focusout',notify);
 }};
}
