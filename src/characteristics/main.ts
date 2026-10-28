import {nativeOverlayNavigation} from '../ui/native-overlay-navigation';
import type {Host,Participant} from '../../framework/contracts';
import Navigation from './Navigation.vue';
import './style.css';
const groups:readonly (readonly [string,string])[]=[['base-characteristics','基础属性'],['base-skills','生活技能'],['sex-skills','身体技能'],['sex-diagram','身体技能'],['school-grades','学业'],['prof','武器技能']];
export function startCharacteristics(root:Window,framework?:{host:Host;owner:Participant}){
 return nativeOverlayNavigation(root,{kind:'characteristics',prefix:'dgc',marker:'characteristics-display',claimKey:'characteristics-navigation-life',groups,component:Navigation},framework);
}
