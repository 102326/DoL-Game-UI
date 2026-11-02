import {readFileSync} from 'node:fs';import assert from 'node:assert/strict';
type Row={label:string;enabled:boolean;value:{handlerMs:number;gaps:number[]}};
const rows=JSON.parse(readFileSync(new URL('./paired-raw.json',import.meta.url),'utf8')) as Row[];assert.equal(rows.length,18);
const median=(a:number[])=>{assert(a.length>0&&a.every(Number.isFinite));const s=[...a].sort((x,y)=>x-y);return s[Math.floor(s.length/2)]};
const pairs=['属性','作弊','ModHub'].flatMap(label=>[true,false].map(enabled=>{const a=rows.filter(r=>r.label===label&&r.enabled===enabled);assert.equal(a.length,3);return{label,enabled,n:3,handlerMedianMs:median(a.map(r=>r.value.handlerMs)),longestRafIntervalMedianMs:median(a.map(r=>Math.max(...r.value.gaps)))}}));
type Slice={durationMs:number;overlapMs:number;stack:Array<{functionName:string;line:number;column:number}>};
const traces=JSON.parse(readFileSync(new URL('./timeline-projection.json',import.meta.url),'utf8')) as Array<{file:string;styleMs:number;layoutMs:number;styleEvents:Slice[];layoutEvents:Slice[]}>;assert.equal(traces.length,4);
for(const t of traces){assert(Math.abs(t.styleEvents.reduce((s,e)=>s+e.overlapMs,0)-t.styleMs)<.0001);assert(Math.abs(t.layoutEvents.reduce((s,e)=>s+e.overlapMs,0)-t.layoutMs)<.0001)}
console.log(JSON.stringify({status:'PASS',pairs,traces:traces.map(t=>({file:t.file,styleMs:t.styleMs,layoutMs:t.layoutMs,topStyle:t.styleEvents.toSorted((a,b)=>b.durationMs-a.durationMs).slice(0,4)})),limits:'Offline replay of captured Android data; does not remeasure the current computer or GPU/FPS.'},null,2));
