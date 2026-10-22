/** Internal owner for presentation resources; never owns native game actions. */
export function visualScope(){
 const frames=new Map<()=>void,number>(),cleanups=new Set<()=>void>();let disposed=false;
 function cancelFrames(){for(const id of frames.values())cancelAnimationFrame(id);frames.clear()}
 return{
  active:()=>!disposed,
  own(cleanup:()=>void){if(disposed)cleanup();else cleanups.add(cleanup)},
  frame(task:()=>void){
   if(disposed||frames.has(task))return;
   frames.set(task,requestAnimationFrame(()=>{frames.delete(task);if(!disposed)task()}));
  },
  dispose(){
   if(disposed)return;disposed=true;cancelFrames();const errors:unknown[]=[];
   for(const cleanup of [...cleanups].reverse())try{cleanup()}catch(error){errors.push(error)}
   cleanups.clear();if(errors.length)throw new AggregateError(errors,'Visual scope cleanup failed');
  }
 };
}
