interface StartupCacheManager {cSC2DataInfoAfterPatchCache?:{destroy:()=>unknown};flushAfterPatchCache:()=>unknown}
interface StartupPreloader {startLoad:(...args:unknown[])=>unknown}
interface StartupCacheStatus {enabled:boolean;active:boolean;invalidations:number;restored:boolean;restoreConflict:boolean;restore?:()=>void}
// Runs during ModLoader's inject-early phase, before mod earlyload scripts.
// This experiment only changes when the post-patch cache is rebuilt.
(() => {
  const root = window as Window & {
    DoLGameUIStartupCacheExperiment?:StartupCacheStatus;
    modSC2DataManager?:StartupCacheManager;jsPreloader?:StartupPreloader;
  };
  const api:StartupCacheStatus = { enabled: false, active: false, invalidations: 0, restored: false, restoreConflict: false };
  root.DoLGameUIStartupCacheExperiment = api;
  let saved:Partial<Record<'enabled'|'startupCacheLazy',unknown>>|null;
  try {
    const raw = root.localStorage.getItem('DoLMidnightTheme.preferences.v1');
    if (!raw || raw.length > 512) return;
    saved = JSON.parse(raw) as typeof saved;
  } catch { return; }
  if (saved?.enabled === false || saved?.startupCacheLazy !== true) return;

  const manager = root.modSC2DataManager;
  const preloader = root.jsPreloader;
  if (!manager || !preloader || typeof manager!.flushAfterPatchCache !== 'function' || typeof preloader!.startLoad !== 'function') return;
  const nativeFlush = manager.flushAfterPatchCache;
  const nativeStartLoad = preloader.startLoad;
  api.enabled = true;

  function restore() {
    if (!api.active) return;
    api.restoreConflict = manager!.flushAfterPatchCache !== lazyFlush || preloader!.startLoad !== startLoad;
    if (manager!.flushAfterPatchCache === lazyFlush) manager!.flushAfterPatchCache = nativeFlush;
    if (preloader!.startLoad === startLoad) preloader!.startLoad = nativeStartLoad;
    api.active = false;
    api.restored = !api.restoreConflict;
  }
  function lazyFlush(this:StartupCacheManager) {
    this.cSC2DataInfoAfterPatchCache?.destroy();
    this.cSC2DataInfoAfterPatchCache = undefined;
    api.invalidations++;
  }
  function startLoad(this:StartupPreloader,...args:unknown[]) {
    restore();
    return nativeStartLoad.apply(this, args);
  }

  api.restore = restore;
  manager.flushAfterPatchCache = lazyFlush;
  preloader.startLoad = startLoad;
  api.active = true;
})();
