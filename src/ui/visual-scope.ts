/** Internal owner for presentation resources; never owns native game actions. */
export function visualScope(){
 const frames=new Map<()=>void,number>(),cleanups=new Set<()=>void>();let disposed=false;
 function cancelFrame(task:()=>void){const id=frames.get(task);if(id!==undefined){cancelAnimationFrame(id);frames.delete(task)}}
 function cancelFrames(){for(const id of frames.values())cancelAnimationFrame(id);frames.clear()}
 function own(cleanup:()=>void){let live=true;const release=()=>{if(!live)return;live=false;cleanups.delete(release);cleanup()};if(disposed)release();else cleanups.add(release);return release}
 return{
  active:()=>!disposed,cancelFrame,cancelFrames,own,
  timeout(task:()=>void,delay:number){
   if(disposed)return()=>{};
   let pending=true;const id=setTimeout(()=>{if(!pending)return;release();if(!disposed)task()},delay),release=own(()=>{pending=false;clearTimeout(id)});return release;
  },
  frame(task:()=>void){
   if(disposed||frames.has(task))return false;
   const id=requestAnimationFrame(()=>{if(disposed||frames.get(task)!==id)return;frames.delete(task);task()});frames.set(task,id);return true;
  },
  dispose(){
   if(disposed)return;disposed=true;cancelFrames();const errors:unknown[]=[];
   for(const cleanup of [...cleanups].reverse())try{cleanup()}catch(error){errors.push(error)}
   cleanups.clear();if(errors.length)throw new AggregateError(errors,'Visual scope cleanup failed');
  }
 };
}
