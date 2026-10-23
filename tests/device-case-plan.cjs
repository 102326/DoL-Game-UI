// Versioned expected IDs stay available in the post-upload job without npm/browser code.
const plan=require('../scripts/expected.lock.json').devicePlans;
const negativeCodes={overflow:'DEVICE_ROOT_OVERFLOW',offscreen:'DEVICE_BOUNDS',nan:'DEVICE_NONFINITE',blockedClose:'DEVICE_HIT'};
function expectedCaseIds(depth='standard'){if(!['standard','deep'].includes(depth))throw Error('Unknown device depth');return [...plan[depth]]}
module.exports={negativeCodes,expectedCaseIds};
