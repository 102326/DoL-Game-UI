import type {sourceMotion} from './source-motion';
const headings='h1,h2,h3,h4,h5,h6,summary,[role=heading],.settingsHeader,.foldoutHeader,.traitHeading,.gold';
/** Resolve existing headings only; never animate an entire form/card as a substitute. */
export function navigationHeading(target:HTMLElement):HTMLElement|undefined{
 if(target.matches(headings))return target;
 const previous=target.previousElementSibling;
 if(previous instanceof HTMLElement&&previous.matches(headings))return previous;
 return target.querySelector<HTMLElement>(`:scope > :is(${headings})`)??undefined;
}
export function flashNavigationHeading(motion:ReturnType<typeof sourceMotion>,heading:HTMLElement){
 if(!heading.isConnected||!heading.matches(headings)||!heading.getClientRects().length)return;
 const background=getComputedStyle(heading).backgroundColor;
 return motion.animate(heading,[{backgroundColor:'#a7b9b52b'},{backgroundColor:background}],360,'ease-out');
}
