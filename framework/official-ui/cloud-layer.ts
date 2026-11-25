import type {Host,Participant} from '../contracts';
type Drift=NonNullable<NonNullable<Host['layerPresets']>['driftingTexture']>;

// One bounded layer under the controls. The shell retains its original live backdrop sampler.
export function cloudLayer(parent:HTMLElement,key:string,owner:Participant,drift:Drift){
 let update:((moving:boolean)=>void)|undefined;
 const lease=owner.mount({id:'cloud.'+key,parent,lifetime:'persistent',setup(context){
  const clip=context.element,texture=document.createElement('span');
  clip.className='sf-cloud-layer';clip.inert=true;clip.setAttribute('aria-hidden','true');
  texture.className='sf-cloud-texture';clip.append(texture);
  update=drift(context,texture,7,16000);
 }});
 return {update(moving:boolean){update?.(moving)},dispose:lease.dispose,isCurrent:lease.isCurrent};
}
