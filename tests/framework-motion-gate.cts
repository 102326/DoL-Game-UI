import fs = require('node:fs');
import path = require('node:path');
import assert = require('node:assert/strict');
import esbuild = require('esbuild');
import scopes = require('../src/ui/visual-scope.ts');
const {transformSync}=esbuild;
type Control={selector:string;textContent:string;visible:boolean;pointerEvents?:string;disabled:boolean;getClientRects:()=>object[];closest:()=>null;getAttribute:()=>null;click:()=>void};
const source=fs.readFileSync(path.join(__dirname,'../framework/official-ui/hub.ts'),'utf8');
const output=transformSync(source,{loader:'ts',format:'cjs'}).code;
let actions:Record<string,unknown>|undefined,clicks=0,controls:Control[]=[],modal:Control[]=[];
function invoke(id:string):unknown{const action=actions?.[id];assert.equal(typeof action,'function');if(typeof action!=='function')throw Error('Missing native action '+id);return action()}

function message(id:string){const result:unknown=invoke(id);assert.equal(typeof result,'string');if(typeof result!=='string')throw Error('Action result must be a message');return result}
const windowStub={DoLFloatingTools:{getPreferences:()=>({enabled:true,hidden:false,mode:'grid'})}};
const documentStub={body:{},addEventListener(){},removeEventListener(){},querySelectorAll(selector:string){return selector.startsWith('dialog')?modal:controls.filter(node=>node.selector===selector)}};
const styleStub=(node:Control)=>({visibility:node.visible?'visible':'hidden',pointerEvents:node.pointerEvents??'auto'});
const moduleUnderTest:{exports:unknown}={exports:{}};
new Function('require','module','exports','window','document','getComputedStyle',output)((name:string)=>{
 if(name==='../../src/ui/visual-scope')return scopes;
 if(name==='../vue')return {mountVue:(_owner:unknown,options:unknown)=>{assert.ok(options&&typeof options==='object'&&'props' in options);const props=options.props;assert.ok(props&&typeof props==='object'&&'directActions' in props);const direct=props.directActions;assert.ok(direct&&typeof direct==='object');actions=Object.fromEntries(Object.entries(direct));return {dispose(){}}}};
 if(name==='../../src/runtime/master')return {isMasterEnabled:()=>true};
 if(name.endsWith('.css')||name.endsWith('.vue'))return {};
 return {};
},moduleUnderTest,moduleUnderTest.exports,windowStub,documentStub,styleStub);
const owner={provideView(){return ()=>{}}};
const moduleExports=moduleUnderTest.exports;assert.ok(moduleExports&&typeof moduleExports==='object'&&'startOfficialHub' in moduleExports&&typeof moduleExports.startOfficialHub==='function');const stop:unknown=moduleExports.startOfficialHub({},owner);assert.ok(typeof stop==='function');
const make=(selector:string,label:string,visible=true):Control=>({selector,textContent:label,visible,disabled:false,getClientRects(){return visible?[{}]:[]},closest(){return null},getAttribute(){return null},click(){clicks++}});
const save='#overlayButtons>.sidebarButtonSplit>button.link-internal,#startCaption>button.link-internal';
const social='#overlayButtons > button.link-internal.macro-button';
controls=[make(save,'存档'),make(social,'社交'),make(social,'属性')];
invoke('SoftWetOfficialUI:native-saves');invoke('SoftWetOfficialUI:native-social');invoke('SoftWetOfficialUI:native-attributes');
assert.equal(clicks,3,'each shortcut dispatches exactly one original click');
controls=[make(save,'存档'),make(save,'存档')];assert.match(message('SoftWetOfficialUI:native-saves'),/不可用/);
controls=[make(save,'存档',false)];assert.match(message('SoftWetOfficialUI:native-saves'),/不可用/);
controls=[make(save,'选项')];assert.match(message('SoftWetOfficialUI:native-saves'),/不可用/);
controls=[make(save,'存档')];modal=[make('dialog[open]','',true)];assert.match(message('SoftWetOfficialUI:native-saves'),/不可用/);
assert.equal(clicks,3,'ambiguous, hidden, changed and modal-covered controls are not invoked');
modal=[];controls=[make(save,'Save')];invoke('SoftWetOfficialUI:native-saves');assert.equal(clicks,4,'the current visible original control is reacquired');
stop();console.log('PASS official Hub native shortcuts');
