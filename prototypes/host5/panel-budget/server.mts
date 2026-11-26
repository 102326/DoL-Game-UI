import {createServer} from 'vite';
// Only substitute the settings form's contents. Its production dialog controller,
// focus, cancel handling, preference store and fade adapter all run unchanged.
export const createLabServer = () => createServer({configFile:false, server:{host:'127.0.0.1',port:0},
 plugins:[{name:'neutral-form',enforce:'pre',resolveId(id){
  if(id.endsWith('/SettingsPanel.vue'))return '\0neutral-form';
 },load(id){if(id==='\0neutral-form')return 'import {h} from "vue";export default {emits:["close"],setup(_,ctx){return ()=>h("button",{class:"dmt-close",onClick:()=>ctx.emit("close")},"Close")}}';}},
 {name:'fixture',configureServer(s){s.middlewares.use('/panel-test',(_req,res)=>{
  res.setHeader('Content-Type','text/html');res.end('<!doctype html><html data-stone-free><meta name="viewport" content="width=device-width,initial-scale=1"><style>dialog{box-sizing:border-box;width:min(28rem,calc(100vw - 24px))}</style><main id="inspector"></main><button id="start">Open</button></html>');
 })}}]});
