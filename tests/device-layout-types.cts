import oracles = require('./device-layout-oracles.cjs');
import type {Page} from 'playwright';

function oracleContract(page:Page){
 const snapshot=oracles.layoutSnapshot(page,[{selector:'#native',inside:true,hittable:true}]);
 const typed:0 extends (1&Awaited<typeof snapshot>['environment']['root']['fontScale'])?true:false=false;
 // @ts-expect-error The browser collector requires an actual Playwright Page.
 oracles.layoutSnapshot('page');
 // @ts-expect-error Selectors are text, not arbitrary runtime values.
 oracles.layoutSnapshot(page,[{selector:2}]);
 // @ts-expect-error A snapshot cannot be replaced with a partial arbitrary JSON object.
 oracles.assertLayout({}, {viewport:{width:390,height:844},deviceScaleFactor:1,safeArea:{top:0,right:0,bottom:0,left:0}});
 return {snapshot,typed};
}
void oracleContract;
