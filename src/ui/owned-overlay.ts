// Reviewed presentation contracts only. A partial/unknown adapter never enters this set.
export const adaptedOverlaySelector='#customOverlay[data-dgu-adapter-match=full]:is([data-dgu-adapter=ModHubSoftWet],[data-dgu-adapter=MapleBirchSoftWet],[data-dgu-adapter=DolOptimizationSoftWet],[data-dgu-adapter=CheatExtendedSoftWet])';
export const ownedOverlaySelector=':is(#customOverlay:is(.dgc-overlay:has(>.dgc-host),.dgs-overlay:has(>.dgs-host),.dgp-overlay:has(>.dgp-host),[data-sf-workspace=saves]),'+adaptedOverlaySelector+')';
