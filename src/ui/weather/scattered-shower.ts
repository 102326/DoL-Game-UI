/** Bounded seeded independent rain. No tiled texture or shared wrapping phase. */
export function scatteredShower(seed=0x971ac){
 let width=1,height=1,clock=0,ready=false;
 const random=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return(seed>>>0)/4294967296};
 const drops=Array.from({length:64},(_,slot)=>({slot,cycle:0,x:0,y:0,speed:1,slope:.5,length:12,width:.7,alpha:.5,wait:0}));
 function spawn(p:typeof drops[number],initial=false){
  p.speed=.76+random()*.48;p.slope=.4+random()*.24;p.length=8+Math.pow(random(),1.4)*16;p.width=.45+random()*.65;p.alpha=.3+random()*.38;
  if(initial){p.x=random()*width;p.y=random()*height;p.wait=0}
  else{p.cycle++;const left=random()<height*p.slope/(width+height*p.slope);p.x=left?-p.length:random()*width;p.y=left?random()*height:-p.length;p.wait=random()*.22}
 }
 function step(dt:number,w:number,h:number,intensity:number){
  if(!Number.isFinite(dt+w+h+intensity)||dt<0||dt>.05||w<=0||h<=0||intensity<0||intensity>2)throw Error('Invalid scattered rain frame');
  if(!ready){width=w;height=h;drops.forEach(p=>spawn(p,true));ready=true}
  else if(w!==width||h!==height){for(const p of drops){p.x*=w/width;p.y*=h/height}width=w;height=h}
  clock+=dt;const budget=Math.min(64,10+26*intensity),speed=350+460*intensity;
  for(const p of drops){if(dt===0)continue;if(p.wait>0){p.wait=Math.max(0,p.wait-dt);continue}p.y+=dt*speed*p.speed;p.x+=dt*speed*p.speed*p.slope;if(p.y>height+p.length||p.x>width+p.length)spawn(p)}
  return{clock,budget,speed,streaks:drops.slice(0,Math.ceil(budget)).map(p=>{
   const vy=speed*p.speed,vx=vy*p.slope,scale=p.length/Math.hypot(vx,vy),weight=Math.min(1,budget-p.slot),fade=Math.max(0,Math.min(1,p.y/22,(height-p.y)/24,p.x/18,(width-p.x)/20));
   return{...p,vx,vy,tailX:p.x-vx*scale,tailY:p.y-vy*scale,opacity:p.wait?0:p.alpha*weight*fade};
  })};
 }
 return{step};
}
