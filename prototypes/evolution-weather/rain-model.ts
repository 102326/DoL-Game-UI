// Bounded research model: area proxy conservation, not a calibrated fluid solver.
export type Drop = {id:number;x:number;y:number;area:number;vy:number;age:number;pin:number;shape:number};
export type Trail = {x:number;y:number;endX:number;endY:number;width:number;life:number};
export function rainModel(seed=0x27fa29){
 let drops:Drop[]=[],trails:Trail[]=[],id=0,birth=0,merges=0,slides=0,drained=0;
 let width=1,height=1,initialized=false;
 const random=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return(seed>>>0)/4294967296};
 const add=(x:number,y:number,r:number,pin:number)=>drops.push({id:++id,x,y,area:r*r,vy:0,age:0,pin,shape:random()});
 function resize(w:number,h:number){
  if(!Number.isFinite(w+h)||w<=0||h<=0)throw Error('Rain surface dimensions must be finite and positive');
  for(const d of drops){d.x*=w/width;d.y*=h/height}width=w;height=h;
 }
 function step(dt:number,wet:number){
  if(!Number.isFinite(dt+wet)||dt<0||dt>.1)throw Error('Invalid rain step');
  wet=Math.max(0,Math.min(1,wet));
  if(!initialized&&wet>.12){
   initialized=true;
   for(let i=0;i<64;i++){
    let x=8+random()*Math.max(0,width-16),y=8+random()*Math.max(0,height-16);
    if(Math.hypot(x-width*.63,y-height*.15-8)<40)x=width*.2;
    add(x,y,.8+Math.pow(random(),2.7)*7.4,4+random()*22);
   }
   // Composed contact pair: real collision/area transfer, visible in the material close-up.
   add(width*.63,height*.15,6.5,2);add(width*.63+.7,height*.15+16,5.3,20);
  }
  birth+=dt*wet*1.8;
  while(birth>=1){birth--;if(drops.length<90)add(7+random()*Math.max(0,width-14),7+random()*Math.max(0,height-14),.8+random()*1.4,5+random()*18)}
  for(const d of drops){
   d.age+=dt;
   d.area=Math.max(0,d.area+dt*(wet>.2?wet*(.16+d.shape*.22):-4-d.area*.2));
   const moving=d.area>40&&d.age>d.pin&&wet>.18;
   if(moving&&d.vy===0)slides++;
   d.vy=moving?Math.min(52,d.vy+dt*(6+d.area*.16)):0;
   if(d.vy){const oldX=d.x,oldY=d.y;d.y+=dt*d.vy;d.x+=Math.sin(d.y*.065+d.shape*17)*dt*.8;
    if(d.y-oldY>.12)trails.push({x:oldX,y:oldY,endX:d.x,endY:d.y,width:Math.sqrt(d.area)*.25,life:1});
    d.area=Math.max(0,d.area-dt*d.vy*.018);
   }
  }
  for(let i=0;i<drops.length;i++)for(let j=i+1;j<drops.length;j++){
   const a=drops[i],b=drops[j];if(a.area===0||b.area===0)continue;
   if(Math.hypot(a.x-b.x,a.y-b.y)>(Math.sqrt(a.area)+Math.sqrt(b.area))*.88)continue;
   const sum=a.area+b.area;a.x=(a.x*a.area+b.x*b.area)/sum;a.y=(a.y*a.area+b.y*b.area)/sum;
   a.vy=Math.max(a.vy,b.vy);a.pin=Math.min(a.pin,b.pin);a.age=Math.max(a.age,b.age);a.area=sum;b.area=0;merges++;
  }
  drops=drops.filter(d=>{if(d.y>height+15){drained++;return false}return d.area>.08});
  trails=trails.filter(t=>(t.life-=dt*(wet>.2?.16:.6))>0).slice(-900);
  if(wet<.01&&drops.length===0)initialized=false;
 }
 return{resize,step,snapshot:()=>({drops:drops.map(d=>({...d})),trails:trails.map(t=>({...t})),merges,slides,drained,width,height})};
}
