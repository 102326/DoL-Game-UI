# Moody Blues CJ-3D device coverage

Owner-authorized extension to P0, priority P1, on `ci/moody-blues-p0`.
P0 CJ-3A/B implementation `1e8010808a7d1c71f0cfe1d3049227df1258ea8b`
passed macOS and [Actions](https://github.com/102326/DoL-Game-UI/actions/runs/39222671934).
Its downloaded 52 evidence entries and hashes were checked. Preserve that contract
and all existing tests while adding device layout coverage.

1. Inspect actual Playwright descriptors, production shared CSS, Floating Hub,
   settings modal and save drawer fixtures. Reuse actual modules and styles;
   never substitute empty model geometry for a rendered production component.
2. Add one source-labelled device catalog. Separate manufacturer physical specs,
   pinned Playwright CSS viewport/DPR descriptors and explicit synthetic stress
   scenarios. Mark every profile unmeasured until actual device data is obtained.
   Cover phone size classes, Android/tablet resolution classes, orientations,
   desktop/window/zoom layout conditions; inches never determine CSS dimensions.
3. Add a focused layout suite, not the whole business suite for every device.
   Run the catalog plus 320–2560 CSS px width scans, actual breakpoints ±1,
   height boundaries, rotation, Hub docks, modal/drawer, long text and dense rows.
   Standard uses 64px grid; manual deep uses 16px grid and more stress contexts.
4. Assert finite geometry, no accidental root overflow, visible/hittable critical
   controls, bounded Hub/drawer and expected scale. List intended scroll regions.
   Prove controlled overflow/offscreen/nonfinite/occluded-control negatives fail
   for the intended assertion; infrastructure failures never satisfy a negative.
5. Extend CJ-3A's explicit allowlist with a bounded layout report and failure
   geometry/screenshot, configuration ID, actual viewport/DPR/environment/source.
   Reject absent/incomplete coverage reports; do not silently truncate into PASS.
6. Add manual standard/deep selection to the existing workflow without changing
   main/PR triggers, permissions, CD or remote merge policy. Measure both modes,
   validate source-matched results, commit/push the branch and run real Actions.
   Update HANDOFF and device coverage documentation with counts, runtime and gaps.

Safe-area inputs are synthetic CDP env-inset overrides, not measured notches.
Zoom-equivalent viewport/DPR scenarios do not establish native browser UI zoom.
Chromium emulation does not establish Android WebView/Safari, OS dropdown,
soft-keyboard, physical touch, system scaling or real device compatibility.
No private game HTML/saves or full-page captures are collected. No production
UI change, main merge, release rewrite, new service or ruleset change is implied.
