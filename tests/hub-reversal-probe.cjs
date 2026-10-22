// Sample the native click and its class observer in one browser task, without driver latency.
module.exports=async page=>{
 await page.evaluate(()=>{window.hubReversal=null});
 await page.waitForFunction(()=>{
  const before=goldenSpinLab.controller.inspect();
  if(!before.moving||before.target!==1||before.q<=.2||before.q>=.96)return false;
  const observer=new MutationObserver(()=>{
   const after=goldenSpinLab.controller.inspect();
   if(after.target===before.target)return;
   observer.disconnect();window.hubReversal={before,after};
  });
  observer.observe(document.querySelector('.sf-motion-orbit'),{attributes:true,attributeFilter:['class']});
  document.querySelector('.sf-motion-ball').click();return true;
 });
 await page.waitForFunction(()=>window.hubReversal);
 return page.evaluate(()=>window.hubReversal);
};
