import assert from 'node:assert/strict';
import {test} from 'node:test';
import type {StandaloneSurfaces} from '../src/runtime/standalone-surfaces.ts';

const entry=new URL('../dist/standalone-ui/index.js',import.meta.url);
const exports=await import(entry.href); // Node has no Window, document or global dialog.
const create:(win:Window)=>StandaloneSurfaces=exports.createStandaloneSurfaces;

function fixture(){
 let failShow=false;
 // Each fixture has its own constructors, as two different documents would.
 class Element extends EventTarget {
  ownerDocument=doc;
  tag:string;
  children:Element[]=[];
  parentNode:Element|null=null;
  dataset:Record<string,string>={};
  style={cssText:''};
  id='';
  textContent='';
  sheet:object|null={};
  constructor(tag:string){super();this.tag=tag}
  get isConnected():boolean{return this===doc.body||!!this.parentNode?.isConnected}
  append(...children:Element[]){for(const child of children){child.remove();this.children.push(child);child.parentNode=this}}
  remove(){if(this.parentNode)this.parentNode.children=this.parentNode.children.filter(child=>child!==this);this.parentNode=null}
  contains(node:Element|null):boolean{return this===node||this.children.some(child=>child.contains(node))}
  setAttribute(name:string,value:string){attributes.set(this,{...attributes.get(this),[name]:value})}
  find(predicate:(el:Element)=>boolean):Element|undefined{
   if(predicate(this))return this;
   for(const child of this.children){const found=child.find(predicate);if(found)return found}
  }
 }
 class Dialog extends Element {
  open=false;
  showModal(){if(failShow)throw Error('fixture refused dialog');this.open=true}
  close(){this.open=false}
 }
 const attributes=new WeakMap<Element,Record<string,string>>();
 type Doc={body:Element;activeElement:Element|null;defaultView:unknown;createElement:(tag:string)=>Element;getElementById:(id:string)=>Element|undefined};
 const doc:Doc={body:null!,activeElement:null,defaultView:null,
  createElement:tag=>tag==='dialog'?new Dialog(tag):new Element(tag),
  getElementById:id=>doc.body.find(node=>node.id===id)};
 doc.body=doc.createElement('body');
 const win={document:doc,HTMLElement:Element,HTMLDialogElement:Dialog,MutationObserver:class{}};
 doc.defaultView=win;
 return {doc,win:win as unknown as Window,refuseDialog:(value:boolean)=>{failShow=value},
  content:()=>doc.createElement('section') as unknown as HTMLElement};
}

test('ESM import is inert and only exports the explicit factory',()=>{
 assert.deepEqual(Object.keys(exports),['createStandaloneSurfaces']);
 assert.equal(typeof create,'function');
});

test('close, reopen, dispose and remount preserve the original content and its listeners',()=>{
 const f=fixture(),a=create(f.win),b=create(f.win),content=f.content(),reasons:string[]=[];
 const request={id:'inspector',title:'Inspector',content,onClose:(reason:string)=>reasons.push(reason)};
 let clicks=0;content.addEventListener('click',()=>clicks++);
 const handle=a.openModal(request)!;
 assert.ok(handle.isOpen());
 assert.equal(a.openModal({...request,content:f.content()}),handle);
 assert.throws(()=>a.openDrawer(request),TypeError);
 const button=f.doc.body.find(node=>node.tag==='button')!;
 button.dispatchEvent(new Event('click'));
 assert.equal(handle.isOpen(),false);
 assert.equal(content.parentNode,null);
 assert.deepEqual(reasons,['button']);
 const reopened=a.openModal(request)!;
 const other=b.openDrawer({...request,content:f.content(),onClose:undefined})!;
 assert.ok(reopened.isOpen()&&other.isOpen());
 a.dispose();a.dispose();handle.close();
 assert.equal(a.available(),false);assert.equal(content.parentNode,null);assert.ok(other.isOpen());
 assert.deepEqual(reasons,['button','destroyed']);
 assert.equal(f.doc.body.children.length,1);
 const c=create(f.win),fresh=c.openModal(request)!;
 content.dispatchEvent(new Event('click'));assert.equal(clicks,1);
 fresh.close();fresh.close();assert.deepEqual(reasons,['button','destroyed','api']);
 b.dispose();c.dispose();assert.equal(f.doc.body.children.length,0);
});

test('target realm, invalid content, unavailable style and failed opens clean up',()=>{
 const f=fixture(),second=fixture(),api=create(f.win),content=f.content(),reasons:string[]=[];
 const request={id:'inspector',title:'Inspector',content,onClose:(reason:string)=>reasons.push(reason)};
 assert.throws(()=>api.openModal({...request,content:second.content()}),TypeError);
 const prototype=(f.doc.defaultView as Window & typeof globalThis).HTMLDialogElement.prototype;
 const show=prototype.showModal;
 try{
  Reflect.set(prototype,'showModal',undefined);
  assert.equal(api.available(),false);assert.equal(api.openModal(request),null);
  assert.equal(content.parentNode,null);
 }finally{prototype.showModal=show}
 f.refuseDialog(true);assert.equal(api.openModal(request),null);
 assert.equal(content.parentNode,null);assert.deepEqual(reasons,['failed']);
 f.refuseDialog(false);assert.ok(api.openModal(request)?.isOpen());
 const style=f.doc.body.find(node=>node.tag==='style')!;style.sheet=null;
 assert.equal(api.available(),false);assert.equal(api.openModal(request),null);
 assert.equal(content.parentNode,null);assert.deepEqual(reasons,['failed','disabled']);
 style.sheet={};assert.ok(api.openDrawer(request)?.isOpen());
 api.dispose();assert.equal(content.parentNode,null);assert.equal(f.doc.body.children.length,0);
});
