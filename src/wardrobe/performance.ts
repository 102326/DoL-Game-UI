/** Opt-in, bounded timing data only. Never retain game objects or clothing names. */
export function createWardrobePerformance(clock:()=>number=()=>performance.now()) {
 let enabled=false,epoch=0,fullStateCopy=false;
 const samples=new Map<string,number[]>();
 function start(phase:string){
  if(!enabled)return ()=>{};
  const began=clock(),ticket=epoch;let finished=false;
  return ()=>{if(finished)return;finished=true;if(!enabled||ticket!==epoch)return;const values=samples.get(phase)??[];values.push(Math.max(0,clock()-began));if(values.length>128)values.shift();samples.set(phase,values)};
 }
 function measure<T>(phase:string,fn:()=>T):T {const end=start(phase);try{return fn()}finally{end()}}
 return {start,measure,getFullStateCopy:()=>fullStateCopy,setFullStateCopy(value:boolean){fullStateCopy=!!value},setEnabled(value:boolean){enabled=!!value;epoch++},reset(){samples.clear();epoch++},report(){return {enabled,fullStateCopy,limit:128,units:'ms',phases:Object.fromEntries([...samples].map(([name,values])=>{const sorted=[...values].sort((a,b)=>a-b);return [name,{samples:values.length,p50:sorted[Math.ceil(sorted.length*.5)-1],p95:sorted[Math.ceil(sorted.length*.95)-1],max:sorted[sorted.length-1]}]}))}}};
}
export type WardrobePerformance=ReturnType<typeof createWardrobePerformance>;
