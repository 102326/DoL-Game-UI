import type {Host} from '../../../framework/contracts';

/** A standalone DOM consumer; imports no UI runtime or theme styles. */
export function attachInspector(host: Readonly<Host>, parent: HTMLElement) {
 const owner = host.register('IndependentInspector');
 const mounted = owner.mount({id: 'panel', parent, lifetime: 'persistent', setup(context) {
  const shadow = context.element.attachShadow({mode: 'open'});
  shadow.innerHTML = '<style>:host{display:block;min-width:0}article{padding:8px;background:#41454a;color:white}button{font:inherit}</style><button type="button" aria-expanded="false">Inspector</button><article hidden><button class="grip" style="touch-action:none">Move</button> Local surface</article>';
  const opener = shadow.querySelector('button')!, layer = shadow.querySelector('article')!;
  const preset=host.layerPresets?.acrylicScrim;
  if(preset){
   layer.style.position='relative';layer.style.isolation='isolate';
   const material=owner.mount({id:'scrim',parent:layer,lifetime:'persistent',setup:preset});
   context.onCleanup(material.dispose);
  }
  const track = host.panelEffects?.track([{opacity: 0}, {opacity: 1}], 100, 80);
  const grip = layer.querySelector<HTMLButtonElement>('.grip')!;
  let drag: {id: number; offset: number} | undefined, x = 0;
  grip.onpointerdown = event => {
   if (drag || event.button !== 0) return;
   grip.setPointerCapture(event.pointerId);
   drag = {id: event.pointerId, offset: event.clientX - x};
  };
  grip.onpointermove = event => {
   if (drag?.id !== event.pointerId) return;
   x = Math.max(-16, Math.min(16, event.clientX - drag.offset));
   layer.style.transform = `translateX(${x}px)`;
  };
  grip.onlostpointercapture = () => {drag = undefined};
  let shown = false, ticket = 0;
  opener.onclick = () => {
   shown = !shown;
   const current = ++ticket;
   opener.setAttribute('aria-expanded', String(shown));
   if (shown) layer.hidden = false;
   const animation = track?.to(layer, shown);
   const finish = () => {if (ticket === current) layer.hidden = !shown};
   if (animation) void animation.finished.then(finish, finish); else finish();
  };
  context.onCleanup(() => {ticket++; track?.release(); opener.onclick = null});
 }});
 if (!mounted) {owner.dispose(); throw Error('Cannot mount inspector')}
 return () => owner.dispose();
}
