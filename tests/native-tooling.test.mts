// @ci-contract {"profiles":["standard"],"classification":"contract","granularity":"native"}
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {spawnSync} from 'node:child_process';

test('native erasure check rejects an extra enum fixture while retaining the normal roots',t=>{
  const folder=fs.mkdtempSync(path.join(os.tmpdir(),'sw-native-'));
  t.after(()=>{
    const absolute=path.resolve(folder);
    if(path.dirname(absolute)!==path.resolve(os.tmpdir())||!path.basename(absolute).startsWith('sw-native-'))throw Error('Unexpected fixture cleanup path');
    fs.rmSync(absolute,{recursive:true,force:true});
  });
  const source=path.join(folder,'non-erasable.ts');fs.writeFileSync(source,'enum UnsupportedNativeFixture { One }\n');
  const result=spawnSync(process.execPath,['--experimental-strip-types','scripts/check-native-tooling.mts',source],{encoding:'utf8'});
  assert.notEqual(result.status,0);assert.match(result.stderr,/TS1294/);assert.match(result.stderr,/non-erasable\.ts/);
});
