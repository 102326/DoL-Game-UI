// Runs during ModLoader's inject-early phase, before mod earlyload scripts.
// This experiment only changes when the post-patch cache is rebuilt.
(() => {
  const root = window;
  const api = { enabled: false, active: false, invalidations: 0, restored: false, restoreConflict: false };
  root.DoLGameUIStartupCacheExperiment = api;
  let saved;
  try {
    const raw = root.localStorage.getItem('DoLMidnightTheme.preferences.v1');
    if (!raw || raw.length > 512) return;
    saved = JSON.parse(raw);
  } catch { return; }
  if (saved?.startupCacheLazy !== true) return;

  const manager = root.modSC2DataManager;
  const preloader = root.jsPreloader;
  if (!manager || !preloader || typeof manager.flushAfterPatchCache !== 'function' || typeof preloader.startLoad !== 'function') return;
  const nativeFlush = manager.flushAfterPatchCache;
  const nativeStartLoad = preloader.startLoad;
  api.enabled = true;

  function restore() {
    if (!api.active) return;
    api.restoreConflict = manager.flushAfterPatchCache !== lazyFlush || preloader.startLoad !== startLoad;
    if (manager.flushAfterPatchCache === lazyFlush) manager.flushAfterPatchCache = nativeFlush;
    if (preloader.startLoad === startLoad) preloader.startLoad = nativeStartLoad;
    api.active = false;
    api.restored = !api.restoreConflict;
  }
  function lazyFlush() {
    this.cSC2DataInfoAfterPatchCache?.destroy();
    this.cSC2DataInfoAfterPatchCache = undefined;
    api.invalidations++;
  }
  function startLoad(...args) {
    restore();
    return nativeStartLoad.apply(this, args);
  }

  api.restore = restore;
  manager.flushAfterPatchCache = lazyFlush;
  preloader.startLoad = startLoad;
  api.active = true;
})();
