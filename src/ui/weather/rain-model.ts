// Bounded research model: area proxy conservation, not a calibrated fluid solver.
export type Drop = {id:number;x:number;y:number;area:number;vy:number;age:number;pin:number;shape:number;runoff?:boolean};
export type Trail = {x:number;y:number;endX:number;endY:number;width:number;life:number;strand?:number;distance?:number};
export function rainModel(seed=0x27fa29,naturalTrails=false,runoff=false){
 let drops:Drop[]=[],trails:Trail[]=[],id=0,birth=0,merges=0,slides=0,drained=0;
 let width=1,height=1,initialized=false,runoffWait=.4,runoffBorn=0,runoffDrained=0;
 const fieldSeed=seed;let strand=0;
 const anchors=new Map<number,{x:number;y:number;distance:number;strand:number;steer:number}>();
 const hash=(x:number,y:number)=>{let v=Math.imul(x+173,374761393)^Math.imul(y+197,668265263)^fieldSeed;v=Math.imul(v^(v>>>13),1274126177);return((v^(v>>>16))>>>0)/4294967296};
 const field=(x:number,y:number)=>{const gx=x/46,gy=y/52,ix=Math.floor(gx),iy=Math.floor(gy),ease=(t:number)=>t*t*(3-2*t),u=ease(gx-ix),v=ease(gy-iy),a=hash(ix,iy)*(1-u)+hash(ix+1,iy)*u,b=hash(ix,iy+1)*(1-u)+hash(ix+1,iy+1)*u;return(a*(1-v)+b*v)*2-1};
 const random=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return(seed>>>0)/4294967296};
 const add=(x:number,y:number,r:number,pin:number)=>drops.push({id:++id,x,y,area:r*r,vy:0,age:0,pin,shape:random()});
 function resize(w:number,h:number){
  if(!Number.isFinite(w+h)||w<=0||h<=0)throw Error('Rain surface dimensions must be finite and positive');
  if(naturalTrails&&(w!==width||h!==height)){trails=[];anchors.clear()}
  for(const d of drops){d.x*=w/width;d.y*=h/height}width=w;height=h;
 }
 function step(dt:number,wet:number,amount=1,energy=1){
  if(!Number.isFinite(dt+wet+amount+energy)||dt<0||dt>.1||amount<0||amount>2||energy<.25||energy>3)throw Error('Invalid rain step');
  wet=Math.max(0,Math.min(1,wet));
  if(!initialized&&wet>.12){
   initialized=true;
   for(let i=0;i<Math.min(80,Math.round(64*amount));i++){
    let x=8+random()*Math.max(0,width-16),y=8+random()*Math.max(0,height-16);
    if(Math.hypot(x-width*.63,y-height*.15-8)<40)x=width*.2;
    add(x,y,.8+Math.pow(random(),2.7)*7.4,4+random()*22);
   }
   // Composed contact pair: real collision/area transfer, visible in the material close-up.
   add(width*.63,height*.15,6.5,2);add(width*.63+.7,height*.15+16,5.3,20);
  }
  birth+=dt*wet*1.8*amount;
  while(birth>=1){birth--;if(drops.length<(runoff?82:90))add(7+random()*Math.max(0,width-14),7+random()*Math.max(0,height-14),.8+random()*1.4,5+random()*18)}
  // Feed a sparse renewing population; reserve capacity so static microdrops
  // cannot eventually starve the sliding water. Reuse the same contact model.
  if(runoff&&wet>.55){runoffWait-=dt*wet*amount;if(runoffWait<=0&&drops.filter(d=>d.runoff).length<7){
   const r=6.8+random()*1.6;add(width*(.48+random()*.46),-r,r,.2+random()*.5);drops.at(-1)!.runoff=true;runoffBorn++;runoffWait=3.8+random()*2.4;
  }}
  for(const d of drops){
   d.age+=dt;
   d.area=Math.max(0,d.area+dt*(wet>.2?wet*(.16+d.shape*.22):-4-d.area*.2));
   const moving=(d.area>40||d.runoff&&d.area>12)&&d.age>d.pin&&wet>.18;
   if(moving&&d.vy===0)slides++;
   d.vy=moving?Math.min(52*energy,d.vy+dt*(6+d.area*.16)*energy*energy):0;
   if(d.vy){const oldX=d.x,oldY=d.y;d.y+=dt*d.vy;
    if(naturalTrails){
     let a=anchors.get(d.id);if(!a){a={x:oldX,y:oldY,distance:0,strand:++strand,steer:0};anchors.set(d.id,a)}
     // Stable surface variation, not a time-looping sine-wave drawn behind the bead.
     a.steer+=(field(d.x,d.y)*.24-a.steer)*(1-Math.exp(-dt*7));d.x+=(d.y-oldY)*a.steer;if(d.runoff){const margin=Math.min(10,width*.1);d.x=Math.max(margin,Math.min(width-margin,d.x))}
     const distance=Math.hypot(d.x-a.x,d.y-a.y);
     if(distance>=1){a.distance+=distance;const footprint=.35+(.65*(field(d.x+81,d.y*1.6)+1)/2);trails.push({x:a.x,y:a.y,endX:d.x,endY:d.y,width:Math.sqrt(d.area)*.34*footprint,life:1,strand:a.strand,distance:a.distance});a.x=d.x;a.y=d.y}
    }else{d.x+=Math.sin(d.y*.065+d.shape*17)*dt*.8;if(d.y-oldY>.12)trails.push({x:oldX,y:oldY,endX:d.x,endY:d.y,width:Math.sqrt(d.area)*.25,life:1})}
    d.area=Math.max(0,d.area-dt*d.vy*.018);
   }
  }
  for(let i=0;i<drops.length;i++)for(let j=i+1;j<drops.length;j++){
   const a=drops[i],b=drops[j];if(!a||!b)throw Error('Missing rain drop in bounded pair');if(a.area===0||b.area===0)continue;
   if(Math.hypot(a.x-b.x,a.y-b.y)>(Math.sqrt(a.area)+Math.sqrt(b.area))*.88)continue;
   const sum=a.area+b.area;a.x=(a.x*a.area+b.x*b.area)/sum;a.y=(a.y*a.area+b.y*b.area)/sum;
   a.vy=Math.max(a.vy,b.vy);a.pin=Math.min(a.pin,b.pin);a.age=Math.max(a.age,b.age);a.area=sum;b.area=0;merges++;if(runoff&&b.runoff)a.runoff=true;anchors.delete(a.id);anchors.delete(b.id);
  }
  drops=drops.filter(d=>{if(d.runoff&&d.area<=.08){anchors.delete(d.id);return false}if(d.y>height+(d.runoff?Math.sqrt(d.area*1.55):15)){drained++;if(d.runoff)runoffDrained++;anchors.delete(d.id);return false}if(d.area<=.08){anchors.delete(d.id);return false}return true});
  trails=trails.filter(t=>(t.life-=dt*(wet>.2?.16:.6))>0).slice(-900);
  if(wet<.01&&drops.length===0)initialized=false;
 }
 return{resize,step,snapshot:()=>({drops:drops.map(d=>({...d})),trails:trails.map(t=>({...t})),merges,slides,drained,runoffBorn,runoffDrained,width,height})};
}
