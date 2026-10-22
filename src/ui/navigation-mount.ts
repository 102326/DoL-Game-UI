import type {Claim,MountHandle,MountRequest,Participant} from '../../framework/contracts';

/** Internal navigation transaction; callers keep their DOM, Vue and host semantics. */
export function navigationMount(owner:Participant,key:string,invalidated:()=>void){
 let lease:Readonly<Claim>|undefined,handle:Readonly<MountHandle>|undefined,epoch=0,ownerExited=false;
 function release(){
  epoch++;const previous=handle,claim=lease;handle=undefined;lease=undefined;
  try{previous?.dispose()}finally{claim?.release()}
 }
 function exited(){if(lease&&!lease.isCurrent())ownerExited=true;return ownerExited}
 return{
  implementation:'navigation-mount/v1',
  release,exited,
  active:()=>!!lease||!!handle,
  current:()=>!!lease?.isCurrent()&&!!handle?.isCurrent(),
  acquire(){release();if(ownerExited)return false;lease=owner.claim('region',key)??undefined;return !!lease},
  mount(request:MountRequest){
   if(!lease?.isCurrent())return false;
   const ticket=epoch;
   try{
    const value=owner.mount({...request,setup(context){
     context.onCleanup(()=>{
      if(ticket!==epoch)return;
      exited();try{invalidated()}finally{release()}
     });
     return request.setup(context);
    }});
    if(ticket!==epoch||!value.isCurrent()){value.dispose();return false}
    handle=value;return true;
   }catch(error){exited();release();throw error}
  }
 };
}
