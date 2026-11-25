import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
// Official standalone Twine 2 format. Supply only our four neutral passages.
export function neutralWeatherStory(zip:string|undefined){
 assert.ok(zip,'Pass the upstream sugarcube-2.37.3-for-twine-2.1-local.zip');
 const bytes = readFileSync(zip);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),'da00a8c15ec4e88a9e231a3ff6c516c57055f84231bb999f869ed34ade353dab');
 const format = execFileSync(process.platform==='win32'?'python':'python3',['-c',"import sys,io,zipfile;sys.stdout.buffer.write(zipfile.ZipFile(io.BytesIO(sys.stdin.buffer.read())).read('sugarcube-2/format.js'))"],{input:bytes,encoding:'utf8'});
 const prefix='window.storyFormat(';
 assert.ok(format.startsWith(prefix) && format.trimEnd().endsWith(');'));
 const {source,version}=JSON.parse(format.trimEnd().slice(prefix.length,-2)) as {source:string;version:string};
 assert.equal(version,'2.37.3');
 const story = `<tw-storydata name="Neutral weather" startnode="1" format="SugarCube" format-version="2.37.3" ifid="8570F7F3-E233-4569-B20E-59D0361CFCC2" hidden>
<script role="script" type="text/twine-javascript" id="twine-user-script">$(document).on(':passagedisplay.fixture',function(){const p=document.querySelector('#passages > .passage:last-child');if(p?.querySelector('.dgp-host'))p.classList.add('dgp-overlay')});</script>
<tw-passagedata pid="1" name="Start">[[Page A]]</tw-passagedata>
<tw-passagedata pid="2" name="Page A">&lt;header class="dgp-host"&gt;A&lt;/header&gt;[[Page B]]</tw-passagedata>
<tw-passagedata pid="3" name="Page B">&lt;header class="dgp-host"&gt;B&lt;/header&gt;[[End]]</tw-passagedata>
<tw-passagedata pid="4" name="End">Done.</tw-passagedata></tw-storydata>`;
 return source.replaceAll('{{STORY_NAME}}','Neutral weather').replace('{{STORY_DATA}}',()=>story);
}
