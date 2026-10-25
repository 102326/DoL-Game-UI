// Edit CTS; generated CJS is retained for npm-free catalog and post-upload startup.
const value:unknown=require('../scripts/expected.lock.json');
if(!value||typeof value!=='object'||!('devicePlans' in value))throw Error('Missing device plans');
const rawPlan=value.devicePlans;
if(!rawPlan||typeof rawPlan!=='object'||Array.isArray(rawPlan))throw Error('Invalid device plans');
const plan=rawPlan;
const negativeCodes={overflow:'DEVICE_ROOT_OVERFLOW',offscreen:'DEVICE_BOUNDS',nan:'DEVICE_NONFINITE',blockedClose:'DEVICE_HIT'};
function expectedCaseIds(depth='standard'){
 if(!['standard','deep'].includes(depth))throw Error('Unknown device depth');
 const ids:unknown=Reflect.get(plan,depth);
 if(!Array.isArray(ids)||!ids.every((id:unknown):id is string=>typeof id==='string'))throw Error('Invalid device case IDs');
 return [...ids];
}
export = {negativeCodes,expectedCaseIds};
