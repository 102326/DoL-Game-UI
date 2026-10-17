import {connectConsumer} from '../connect';
import {startGameUI} from '../../src/main';
import {startOfficialHub} from './hub';

// The official package consumes the same public Host as an independent author.
const disconnect=connectConsumer(host=>{
 if((window as Window & {DoLGameUI?:unknown}).DoLGameUI)throw Error('Another official UI is already active');
 const owner=host.register('SoftWetOfficialUI');
 let ui:ReturnType<typeof startGameUI>|undefined;
 let destroyUi:(()=>void)|undefined;
 let stopHub:(()=>void)|undefined;
 const release=()=>{try{stopHub?.();destroyUi?.()}finally{ui=undefined;destroyUi=undefined;stopHub=undefined;owner.dispose()}};
 try{
  if(!owner.claim('region','soft-wet-official-ui')){release();return release}
  ui=startGameUI({host,owner});if(!ui)throw Error('Official UI unavailable');
  destroyUi=ui.destroy;ui.destroy=()=>disconnect();ui.version='3.0.0-lab.11';stopHub=startOfficialHub(host,owner);return release;
 }catch(error){release();throw error}
});
export function dispose(){disconnect()}
