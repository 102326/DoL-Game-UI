import type {Host,Json} from '../../../framework/contracts';

export function paint(node:HTMLElement,palette:Json){
 if(!palette||typeof palette!=='object'||Array.isArray(palette))throw Error('Expected palette');
 for(const [role,color] of Object.entries(palette)){
  if(typeof color!=='string'||!/^#[a-f0-9]{6}$/i.test(color))throw Error('Invalid color');
  node.style.setProperty('--theme-'+role,color);
 }
}
export function mountConsumer(host:Host,id:string,parent:HTMLElement){
 const owner=host.register(id);
 owner.mount({id:'surface',parent,lifetime:'persistent',async setup(ctx){
  const node=ctx.element;
  node.className='sample';
  node.innerHTML='<strong></strong><p>界面已就绪</p><span>已选中</span> <small>错误提示</small>';
  node.querySelector('strong')!.textContent=parent.getAttribute('aria-label');
  let revision=0;
  async function refresh(){
   const ticket=++revision;
   const source=host.sources('host5.theme').find(s=>s.owner==='HostThemeLab'&&s.id==='current');
   const result=await source?.read(ctx.binding());
   if(result?.ok&&ticket===revision&&ctx.isCurrent())paint(node,result.value);
  }
  document.addEventListener('host5-theme-applied',refresh);
  ctx.onCleanup(()=>document.removeEventListener('host5-theme-applied',refresh));
  await refresh();
 }});
 return owner.dispose;
}
