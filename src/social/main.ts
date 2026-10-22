import {nativeOverlayNavigation} from '../ui/native-overlay-navigation';
import type {Host,Participant} from '../../framework/contracts';
import Navigation from './Navigation.vue';
import './style.css';
const groups=[['npc-relations','主要关系'],['secondary-npcs','其他人物'],['faction-reputations','势力声望'],['farm-status','农场状况'],['global-recognition','知名度']];
export function startSocial(root:Window,framework?:{host:Host;owner:Participant}){
 return nativeOverlayNavigation(root,{kind:'social',prefix:'dgs',marker:'relation-display',claimKey:'social-navigation-lifecycle',groups,component:Navigation,
  navigate({target,group,motion,scroll}){scroll();if(group)motion.animate(target,[{backgroundColor:'#a79ab31a',boxShadow:'inset 3px 0 #a79ab370'},{backgroundColor:getComputedStyle(target).backgroundColor,boxShadow:getComputedStyle(target).boxShadow}],900)}
 },framework);
}
