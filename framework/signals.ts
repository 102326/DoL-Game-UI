import type {Cleanup} from './contracts';

/** Local, disposable signal composition; never patches the browser globals. */
export function combineSignals(signals: readonly AbortSignal[]) {
 const controller=new AbortController(),listeners:Cleanup[]=[];
 const dispose=()=>{for(const off of listeners.splice(0))off()};
 for(const signal of signals){
  const abort=()=>{controller.abort(signal.reason);dispose()};
  if(signal.aborted){abort();break}
  signal.addEventListener('abort',abort,{once:true});
  listeners.push(()=>signal.removeEventListener('abort',abort));
 }
 return {signal:controller.signal,dispose};
}
