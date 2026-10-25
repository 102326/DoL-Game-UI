// Sample the native click and its class observer in one browser task, without driver latency.
import type {Page} from 'playwright';
import type {sphereHub} from '../src/ui/golden-spin/hub-motion.ts';
declare const goldenSpinLab:{controller:ReturnType<typeof sphereHub>};
type Snapshot=ReturnType<ReturnType<typeof sphereHub>['inspect']>;
declare global {interface Window {hubReversal?:{before:Snapshot;after:Snapshot}|null}}
const reverseHub=async(page:Page)=>{
 await page.evaluate(()=>{window.hubReversal=null});
 await page.waitForFunction(()=>{
  const before=goldenSpinLab.controller.inspect();
  if(!before.moving||before.target!==1||before.q<=.2||before.q>=.96)return false;
  const observer=new MutationObserver(()=>{
   const after=goldenSpinLab.controller.inspect();
   if(after.target===before.target)return;
   observer.disconnect();window.hubReversal={before,after};
  });
  const orbit=document.querySelector('.sf-motion-orbit'),ball=document.querySelector<HTMLButtonElement>('.sf-motion-ball');if(!orbit||!ball)throw Error('Missing Hub reversal fixture');
  observer.observe(orbit,{attributes:true,attributeFilter:['class']});
  ball.click();return true;
 });
 await page.waitForFunction(()=>window.hubReversal);
 return page.evaluate(()=>{if(!window.hubReversal)throw Error('Missing reversal sample');return window.hubReversal});
};

export = reverseHub;
