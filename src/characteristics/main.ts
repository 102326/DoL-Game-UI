import {nativeOverlayNavigation} from '../ui/native-overlay-navigation';
import type {Host,Participant} from '../../framework/contracts';
import Navigation from './Navigation.vue';
import './style.css';
const groups:readonly (readonly [string,string])[]=[['base-characteristics','基础属性'],['base-skills','生活技能'],['sex-skills','身体技能'],['sex-diagram','身体技能'],['school-grades','学业'],['prof','武器技能']];
export function startCharacteristics(root:Window,framework?:{host:Host;owner:Participant}){
 return nativeOverlayNavigation(root,{kind:'characteristics',prefix:'dgc',marker:'characteristics-display',claimKey:'characteristics-navigation-life',groups,component:Navigation,
  navigate({group,content,origin,motion,scroll,relay,current}){
   scroll(()=>{
    if(!current()||!group?.isConnected||!content.contains(group))return;
    const bounds=group.getBoundingClientRect(),viewport=content.getBoundingClientRect();
    const rect=new DOMRect(bounds.left,Math.max(bounds.top,viewport.top),bounds.width,Math.min(bounds.bottom,viewport.bottom)-Math.max(bounds.top,viewport.top));
    if(origin)relay(origin,rect);
    [...group.querySelectorAll<HTMLElement>(':scope>.characteristic-box')].filter(n=>!n.querySelector('a,button,input,select,textarea,[tabindex]')).slice(0,12).forEach((n,i)=>motion.animate(n,[{transform:'perspective(900px) translateY(38px) rotateX(-12deg) scale(.94)',opacity:.45},{transform:'perspective(900px) translateY(-4px) rotateX(0) scale(1)',opacity:1,offset:.72},{transform:'none',opacity:1}],620+i*24));
   });
  }
 },framework);
}
