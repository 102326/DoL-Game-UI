// @ci-contract {"profiles":["standard"],"classification":"contract","granularity":"entry"}
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { devices } = require('playwright');
const { catalog, requestedTargets, buildCases, scanWidths, cssBreakpoints } = require('./device-profiles.cjs');

// Review descriptor changes deliberately when upgrading the pinned browser dependency.
assert.equal(require('../package-lock.json').packages['node_modules/playwright-core'].version, '1.63.0');
assert.equal(require('playwright-core/package.json').version, '1.63.0');
const named = catalog.filter(p => p.descriptor);
const descriptors = Object.fromEntries(named.flatMap(p => [p.descriptor, p.descriptor + ' landscape']).map(name => [name, devices[name]]));
assert.equal(crypto.createHash('sha256').update(JSON.stringify(descriptors)).digest('hex'), '4db61cca69ed71fa65114005c1cf22b1fd3b3ae73e5bdb82410f8bdd433ffefa', 'review viewport, screen, DPR, UA and orientation descriptor drift');
const standard = buildCases(), deep = buildCases('deep');
assert.deepEqual(requestedTargets.map(t => t.requestedLabel), ['Redmi K90ProMax', 'Xiaomi pad9 pro max', 'iPad Air', 'iPadPro', 'iPad mini', 'iPhone18pro', 'iphone18promax']);
assert.equal(new Set(requestedTargets.map(t => t.id)).size, 7);
assert.equal(requestedTargets.filter(t => t.owned).length, 2);
for (const target of requestedTargets) {
  assert.equal(target.measured, false); assert.equal(target.measurementStatus, 'pending');
  assert.equal(target.viewport, null); assert.equal(target.deviceScaleFactor, null); assert.equal(target.DPR, null);
  assert.equal(target.physicalResolution, null, 'unknown exact target parameters must remain unknown');
  assert.equal(target.source, 'owner request 2026-10-19');
  assert.ok(target.officialModelStatus && target.provenance.includes('proxy'));
  assert.ok(target.matrixProxyIDs.length > 0 && target.matrixProxyIDs.every(id => standard.some(c => c.id === id)));
}
assert.equal(requestedTargets.find(t => t.id === 'requested-xiaomi-pad9-pro-max').officialModelStatus, 'user-reported-name-pending-confirmation');
assert.ok(!Object.keys(devices).some(name => /iPhone 18/.test(name)), 'review registry mapping when a future lock supplies native descriptors');
assert.ok(standard.length >= 40 && standard.length <= 60, 'standard contexts remain bounded');
assert.equal(new Set(deep.map(c => c.id)).size, deep.length);
for (const c of deep) {
  assert.equal(c.measured, false, 'no user device measurements have been supplied');
  assert.ok(['playwright-descriptor', 'synthetic', 'layout-equivalent-zoom'].includes(c.simulation));
  assert.ok(c.provenance.length > 20 && c.sources.every(url => /^https:\/\//.test(url)));
  for (const n of [c.viewport.width, c.viewport.height, c.deviceScaleFactor, c.zoom]) assert.ok(Number.isFinite(n) && n > 0);
  assert.deepEqual(c.contextOptions.viewport, c.viewport);
  assert.equal(c.contextOptions.deviceScaleFactor, c.deviceScaleFactor);
  assert.equal(typeof c.isMobile, 'boolean'); assert.equal(typeof c.hasTouch, 'boolean');
  assert.deepEqual(Object.keys(c.safeArea).sort(), ['bottom', 'left', 'right', 'top']);
  assert.ok(Object.values(c.safeArea).every(n => Number.isInteger(n) && n >= 0));
  if (c.descriptorName) {
    const { defaultBrowserType, ...actual } = devices[c.descriptorName];
    assert.deepEqual(c.contextOptions, actual, 'named cases preserve installed viewport and screen rather than deriving them from panel pixels');
    assert.equal(c.zoom, 1);
  }
}
for (const c of standard) assert.deepEqual(deep.find(d => d.id === c.id), c, 'deep is a stable superset');
for (const size of ['6.1-inch', '6.3-inch', '6.5-inch', '6.7-inch', '6.8-inch', '6.9-inch', 'approx-7-inch-boundary']) assert.ok(standard.some(c => c.screenClass === size));
for (const size of ['2K', '2.5K', '3K', '3.2K']) assert.ok(standard.some(c => c.category === 'tablet' && c.screenClass.startsWith(size)));
for (const [width, height] of [[844,390],[1363,876],[390,320],[1920,1080],[2560,1440],[3840,2160],[3440,1440]]) assert.ok(standard.some(c => c.viewport.width === width && c.viewport.height === height));
for (const zoom of [1.25,1.5,2]) assert.ok(standard.some(c => c.zoom === zoom && c.simulation === 'layout-equivalent-zoom' && /not actual browser UI zoom/.test(c.provenance)));
assert.ok(standard.some(c => c.safeArea.top > 0) && standard.some(c => c.safeArea.left > 0));
const widths = scanWidths(), deeper = scanWidths('deep');
assert.equal(widths[0], 320); assert.equal(widths.at(-1), 2560);
assert.deepEqual(widths, [...new Set(widths)].sort((a,b) => a-b));
for (let n=320;n<=2560;n+=64) assert.ok(widths.includes(n));
for (let n=320;n<=2560;n+=16) assert.ok(deeper.includes(n));
for (const breakpoint of [420,480,600,640,650,680,699,700,800,899,900,980,1100]) {
  assert.ok(cssBreakpoints().includes(breakpoint), `actual CSS breakpoint ${breakpoint}`);
  for (const delta of [-1,0,1]) assert.ok(widths.includes(breakpoint + delta));
}
assert.ok(widths.every(n => deeper.includes(n)));
assert.throws(() => buildCases('typo')); assert.throws(() => scanWidths('typo'));
console.log(`PASS device catalog: ${standard.length} standard/${deep.length} deep cases; ${widths.length}/${deeper.length} scan widths; pinned descriptors, synthetic provenance and boundaries`);
