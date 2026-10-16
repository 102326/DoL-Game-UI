import {connectConsumer} from '../connect';
import {startGameUI} from '../../src/main';

// The official package consumes the same public Host as an independent author.
const disconnect=connectConsumer(host=>{
 if((window as Window & {DoLGameUI?:unknown}).DoLGameUI)throw Error('Another official UI is already active');
 const owner=host.register('SoftWetOfficialUI');
 let ui:ReturnType<typeof startGameUI>|undefined;
 let destroyUi:(()=>void)|undefined;
 const release=()=>{try{destroyUi?.()}finally{ui=undefined;destroyUi=undefined;owner.dispose()}};
 try{
  if(!owner.claim('region','soft-wet-official-ui')){release();return release}
  ui=startGameUI({host,owner});if(!ui)throw Error('Official UI unavailable');
  destroyUi=ui.destroy;ui.destroy=()=>disconnect();ui.version='3.0.0-lab.10';return release;
 }catch(error){release();throw error}
});
export function dispose(){disconnect()}
