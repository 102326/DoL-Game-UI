import {visualScope} from '../../src/ui/visual-scope';
import {clamp,type Area} from '../../framework/motion-hub/geometry';
/** One real sphere, bounded motion. No world, collision graph or decorative replacement sphere. */
export function freeHubMotion(point:{x:number;y:number},area:Area,root:HTMLElement,commit:()=>void){
 const scope=visualScope(),media=matchMedia('(prefers-reduced-motion: reduce)');
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg'),line=document.createElementNS(svg.namespaceURI,'path'),anchor=document.createElementNS(svg.namespaceURI,'circle');
 svg.classList.add('e42-thread');svg.setAttribute('aria-hidden','true');svg.dataset.active='false';anchor.setAttribute('r','4');svg.append(line,anchor);root.append(svg);scope.own(()=>svg.remove());
 let phase:'rest'|'fly'|'recall'='rest',vx=0,vy=0,last=0,elapsed=0,frames=0,target={x:0,y:0};
 const bounds=()=>{point.x=clamp(point.x,area.left+12,area.left+area.width-68);point.y=clamp(point.y,area.top+12,area.top+area.height-68)};
 function paint(){root.dataset.e42Phase=phase;svg.dataset.active=String(phase==='recall');
  if(phase!=='recall'){svg.style.opacity='0';return}
  const a={x:target.x+28,y:target.y+28},b={x:point.x+28,y:point.y+28},extension=clamp(elapsed/.12,0,1),sag=Math.max(0,1-elapsed/.3)*38;
  const end={x:a.x+(b.x-a.x)*extension,y:a.y+(b.y-a.y)*extension};
  line.setAttribute('d',`M ${a.x} ${a.y} Q ${(a.x+end.x)/2} ${(a.y+end.y)/2+sag} ${end.x} ${end.y}`);anchor.setAttribute('cx',String(a.x));anchor.setAttribute('cy',String(a.y));svg.style.opacity=String(extension*.8);
 }
 function stop(save=false){scope.cancelFrame(tick);phase='rest';vx=vy=last=elapsed=0;paint();if(save&&scope.active())commit()}
 function tick(){if(!scope.active())return;frames++;const now=performance.now(),dt=last?Math.min(.05,(now-last)/1000):1/60;last=now;elapsed+=dt;
  const steps=Math.ceil(dt/(1/120)),h=dt/steps;
  for(let i=0;i<steps;i++){
   if(phase==='recall'&&elapsed>.15){const w=2*Math.PI*3.2;vx+=(w*w*(target.x-point.x)-2*.78*w*vx)*h;vy+=(w*w*(target.y-point.y)-2*.78*w*vy)*h;}
   if(phase==='fly'){const k=Math.exp(-h*6);vx*=k;vy*=k;}
   point.x+=vx*h;point.y+=vy*h;const x=point.x,y=point.y;bounds();if(x!==point.x)vx*=-.24;if(y!==point.y)vy*=-.24;
  }
  paint();
  if((phase==='fly'&&(Math.hypot(vx,vy)<8||elapsed>1.1))||(phase==='recall'&&elapsed>.15&&Math.hypot(target.x-point.x,target.y-point.y)<.4&&Math.hypot(vx,vy)<4)){
   if(phase==='recall')Object.assign(point,target);bounds();stop(true);
  }else scope.frame(tick);
 }
 const listen=(node:EventTarget,type:string,fn:EventListener)=>{node.addEventListener(type,fn);scope.own(()=>node.removeEventListener(type,fn))};
 listen(media,'change',()=>{if(media.matches&&phase!=='rest'){if(phase==='recall')Object.assign(point,target);bounds();stop(true)}});
 return{
  stop,release(x:number,y:number){if(!scope.active())return;stop();if(media.matches||Math.hypot(x,y)<60){commit();return}phase='fly';vx=clamp(x,-720,720);vy=clamp(y,-720,720);scope.frame(tick)},
  recall(home:{x:number;y:number}){if(!scope.active())return;stop();target={...home};if(media.matches){Object.assign(point,target);bounds();commit();return}phase='recall';paint();scope.frame(tick)},
  snapshot:()=>({phase,frames,settled:phase==='rest',reduced:media.matches}),dispose(){stop();scope.dispose()}
 };
}
