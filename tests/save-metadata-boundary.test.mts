import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSaveMetadata,type SaveMetadataHost} from '../src/saves/metadata.ts';
import type {SaveEntry} from '../src/saves/source.ts';

function entry(slot='1'):SaveEntry{return {key:1,slot,auto:false,empty:false,identity:'',customName:'',gameTime:'',name:'native',description:'',date:'',recent:false,saveAction:0,actions:[]};}
test('save metadata skips malformed rows without changing native data or writing storage',async()=>{
  const details=[null,{slot:2,data:'invalid'},{slot:1,data:{date:123,id:'native',metadata:{saveName:'saved',dolGameUI:{gameTime:'2022/9/7 08:03'}},unknown:{preserve:true}}}];
  const before=JSON.stringify(details),writes:string[]=[];
  const host={localStorage:{getItem:()=>null,setItem:(key:string)=>{writes.push(key)}},idb:{getSaveDetails:async()=>details}} satisfies SaveMetadataHost;
  const metadata=createSaveMetadata(host),value=entry();
  try{
    const result=await metadata.read([value],true);
    assert.equal(result?.dates.get('idb:1'),123);assert.equal(value.name,'saved');assert.equal(value.gameTime,'2022/9/7 08:03');
    assert.equal(await metadata.revision(value,true),JSON.stringify(['idb','1',details[2]?.data]));
    assert.equal(JSON.stringify(details),before);assert.deepEqual(writes,[]);
  }finally{metadata.destroy()}
});
test('NaN dates remain invalid numbers and unknown legacy shapes fail closed',async()=>{
  const host={localStorage:{getItem:()=> '[]',setItem:()=>{throw Error('Unexpected write')}},idb:{getSaveDetails:async()=>[{slot:1,data:{date:NaN,metadata:{dolGameUI:'invalid'}}}]}} satisfies SaveMetadataHost;
  const metadata=createSaveMetadata(host),value=entry();
  try{
    assert.equal((await metadata.read([value],true))?.dates.get('idb:1'),0);assert.equal(value.identity,'');assert.equal(value.name,'native');
    assert.equal(await metadata.read([value],false),undefined);await assert.rejects(metadata.revision(value,false),/Unknown save details/);
  }finally{metadata.destroy()}
});
