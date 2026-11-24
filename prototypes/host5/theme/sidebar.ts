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
