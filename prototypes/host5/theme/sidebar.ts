import {mountConsumer} from './consumer';
const host=window.DoLUiHost!;
host.sceneReady();
if(new URLSearchParams(location.search).has('legacy')&&'theme' in host){
 // Model the earlier Host shape while retaining its real registration and modal APIs.
 window.DoLUiHost=Object.defineProperty(Object.create(host),'theme',{value:undefined});
}else if(host.theme){
 mountConsumer(host,'ThemeInspector',document.querySelector('#peer')!);
}
const entry=document.createElement('script');
entry.src='/dist/framework/official-ui/index.js';
document.body.append(entry);

// A native navigation action replaces the passage, as it would in the host page.
const passages=document.querySelector('#passages')!;
const passageTemplate=passages.firstElementChild!.cloneNode(true);
passages.addEventListener('click',event=>{
 if(!(event.target instanceof Element)||!event.target.closest('a[data-passage="Next"]'))return;
 event.preventDefault();
 const next=passageTemplate.cloneNode(true) as HTMLElement;
 next.querySelector('#native-prose')!.prepend('Next · ');
 passages.replaceChildren(next);
});
