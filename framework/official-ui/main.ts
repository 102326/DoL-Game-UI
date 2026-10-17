import {connectConsumer} from '../connect';
import {startGameUI} from '../../src/main';
import {startOfficialHub} from './hub';
import '../../src/theme/stone-free.css';

// The official package consumes the same public Host as an independent author.
const disconnect=connectConsumer(host=>{
 if((window as Window & {DoLGameUI?:unknown}).DoLGameUI)throw Error('Another official UI is already active');
 const owner=host.register('SoftWetOfficialUI');
 let ui:ReturnType<typeof startGameUI>|undefined;
 let destroyUi:(()=>void)|undefined;
 let stopHub:(()=>void)|undefined;
 const html=document.documentElement,previous=html.getAttribute('data-stone-free'),visualVersion='3.0.0-lab.12';
 const release=()=>{try{stopHub?.();destroyUi?.()}finally{ui=undefined;destroyUi=undefined;stopHub=undefined;owner.dispose();if(html.getAttribute('data-stone-free')===visualVersion){if(previous===null)html.removeAttribute('data-stone-free');else html.setAttribute('data-stone-free',previous)}}};
 try{
  if(!owner.claim('region','soft-wet-official-ui')){release();return release}
  ui=startGameUI({host,owner});if(!ui)throw Error('Official UI unavailable');
  destroyUi=ui.destroy;ui.destroy=()=>disconnect();ui.version=visualVersion;html.setAttribute('data-stone-free',visualVersion);stopHub=startOfficialHub(host,owner);return release;
 }catch(error){release();throw error}
});
export function dispose(){disconnect()}
