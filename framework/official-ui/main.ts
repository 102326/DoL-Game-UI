import {connectConsumer} from '../connect';
import {startGameUI} from '../../src/main';
import {startOfficialHub} from './hub';
import {referenceShelf} from './reference-shelf';
import {startOfficialMotion} from './motion';
import {isolate} from '../../src/runtime/presentation';
import '../../src/theme/stone-free.css';
import '../../src/theme/dark-acrylic.css';
import '../../src/theme/kraft-work-pages.css';
import '../../src/theme/kraft-work-motion.css';
import '../../src/theme/navigation-material.css';

// The official package consumes the same public Host as an independent author.
const disconnect=connectConsumer(host=>{
 if((window as Window & {DoLGameUI?:unknown}).DoLGameUI)throw Error('Another official UI is already active');
 const owner=host.register('SoftWetOfficialUI'),shelf=referenceShelf(host,owner);
 let ui:ReturnType<typeof startGameUI>|undefined;
 let destroyUi:(()=>void)|undefined;
 let stopHub:(()=>void)|undefined;
 let stopMotion:(()=>void)|undefined;
 const html=document.documentElement,previous=html.getAttribute('data-stone-free'),visualVersion='3.0.1';
 const release=()=>{try{stopMotion?.();stopHub?.();shelf.dispose();destroyUi?.()}finally{ui=undefined;destroyUi=undefined;stopHub=undefined;stopMotion=undefined;owner.dispose();if(html.getAttribute('data-stone-free')===visualVersion){if(previous===null)html.removeAttribute('data-stone-free');else html.setAttribute('data-stone-free',previous)}}};
 try{
  if(!owner.claim('region','soft-wet-official-ui')){release();return release}
  ui=startGameUI({host,owner,rememberReference:shelf.remember,rememberProduct:shelf.rememberProduct});if(!ui)throw Error('Official UI unavailable');
  destroyUi=ui.destroy;ui.destroy=()=>disconnect();ui.version=visualVersion;html.setAttribute('data-stone-free',visualVersion);stopHub=startOfficialHub(host,owner);stopMotion=isolate('official motion',()=>startOfficialMotion());return release;
 }catch(error){release();throw error}
});
export function dispose(){disconnect()}
