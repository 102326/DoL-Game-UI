import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

/** Moving the accepted renderer permits its type-import path change, not a new drawing. */
export function assertAcceptedWeather(){
 for(const[name,report]of[['blood-moon','evolution-blood-moon-b01'],['special-atmosphere','evolution-special-s01']]){
  const accepted=JSON.parse(fs.readFileSync('docs/media/'+report+'/result.json','utf8')).sources['prototypes/evolution-weather/'+name+'.ts'];
  const source=fs.readFileSync('src/ui/weather/'+name+'.ts','utf8').replace("from './surface'","from '../../src/ui/weather/surface'");
  assert.equal(crypto.createHash('sha256').update(source).digest('hex'),accepted,name+' accepted drawing changed');
 }
}
