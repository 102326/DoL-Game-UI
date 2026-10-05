const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = require('esbuild').buildSync({entryPoints:[path.join(__dirname,'../startup-cache-experiment.ts')],bundle:true,write:false,format:'iife',target:'es2022'}).outputFiles[0].text;

function boot(preferences) {
  const calls = [];
  let builds = 0;
  const manager = {
    cSC2DataInfoAfterPatchCache: { destroy() { calls.push('destroy'); } },
    getSC2DataInfoAfterPatch() {
      if (!this.cSC2DataInfoAfterPatchCache) {
        builds++;
        this.cSC2DataInfoAfterPatchCache = { destroy() { calls.push('destroy'); } };
      }
      return this.cSC2DataInfoAfterPatchCache;
    },
    flushAfterPatchCache() {
      this.cSC2DataInfoAfterPatchCache?.destroy();
      this.cSC2DataInfoAfterPatchCache = undefined;
      this.getSC2DataInfoAfterPatch();
    },
  };
  const nativeFlush = manager.flushAfterPatchCache;
  const preloader = { startLoad(value) {
    calls.push('preload');
    assert.equal(manager.flushAfterPatchCache, nativeFlush);
    return value + 1;
  } };
  const nativeStart = preloader.startLoad;
  const window = { modSC2DataManager: manager, jsPreloader: preloader, localStorage: {
    getItem() { return preferences; },
  } };
  vm.runInNewContext(source, { window });
  return { window, manager, preloader, nativeFlush, nativeStart, calls, get builds() { return builds; } };
}

for (const preferences of [null, '{broken', JSON.stringify({ startupCacheLazy: false }), JSON.stringify({ enabled: false, startupCacheLazy: true }), ' '.repeat(513)]) {
  const run = boot(preferences);
  assert.equal(run.manager.flushAfterPatchCache, run.nativeFlush);
  assert.equal(run.preloader.startLoad, run.nativeStart);
  assert.equal(run.window.DoLGameUIStartupCacheExperiment.enabled, false);
}

const run = boot(JSON.stringify({ startupCacheLazy: true }));
assert.notEqual(run.manager.flushAfterPatchCache, run.nativeFlush);
run.manager.flushAfterPatchCache();
run.manager.flushAfterPatchCache();
assert.equal(run.builds, 0, 'repeated invalidations must not eagerly rebuild');
assert.equal(run.manager.cSC2DataInfoAfterPatchCache, undefined);
assert.equal(run.manager.getSC2DataInfoAfterPatch(), run.manager.cSC2DataInfoAfterPatchCache);
assert.equal(run.builds, 1, 'native getter still rebuilds on explicit demand');
assert.equal(run.preloader.startLoad(4), 5);
assert.equal(run.manager.flushAfterPatchCache, run.nativeFlush);
assert.equal(run.preloader.startLoad, run.nativeStart);
assert.equal(run.window.DoLGameUIStartupCacheExperiment.invalidations, 2);
assert.equal(run.window.DoLGameUIStartupCacheExperiment.restored, true);
assert.deepEqual(run.calls, ['destroy', 'preload']);
run.manager.flushAfterPatchCache();
assert.equal(run.builds, 2, 'native eager behavior returns after preload boundary');

console.log('startup cache experiment: passed');
