// @ci-contract {"profiles":["standard"],"classification":"contract","granularity":"native"}
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {isSourceLink} from '../component-lab/source-link.ts';

test('lab accepts source-index fields without dropping the full producer response',()=>{
  const value={format:'dol-ui-source-index',snapshot:{revision:'head',digest:'sha',dirty:true},files:['owned.ts']};
  assert.equal(isSourceLink(value),true);
  assert.deepEqual(value.files,['owned.ts']);
  for(const invalid of [null,[],{}, {format:'dol-ui-source-index'}, {format:'dol-ui-source-index',snapshot:null},
    {format:'dol-ui-source-index',snapshot:{revision:1,digest:'sha'}}, {format:'other',snapshot:{revision:'head',digest:'sha'}}])assert.equal(isSourceLink(invalid),false);
});
