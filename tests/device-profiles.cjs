// Device descriptors are emulation inputs. Panel specifications never determine CSS viewports.
const fs = require('node:fs');
const path = require('node:path');
const { devices } = require('playwright');
const root = path.resolve(__dirname, '..');
const descriptorSource = 'https://github.com/microsoft/playwright/blob/v1.63.0/packages/playwright-core/src/server/deviceDescriptorsSource.json';
const emulationSource = 'https://playwright.dev/docs/emulation';
const size = (width, height) => ({ width, height });
const zeroInsets = () => ({ top: 0, right: 0, bottom: 0, left: 0 });
const named = (id, descriptor, category, screenClass, physicalResolution, source) => ({ id, descriptor, name: descriptor, category, screenClass, physicalResolution, sources: [descriptorSource, ...(source ? [source] : [])] });
const synthetic = (id, name, category, screenClass, viewport, deviceScaleFactor, physicalResolution = null, source) => ({ id, name, category, screenClass, viewport, deviceScaleFactor, physicalResolution, sources: [emulationSource, ...(source ? [source] : [])] });

const catalog = [
  named('iphone-16e', 'iPhone 16e', 'phone', '6.1-inch', size(1170,2532), 'https://support.apple.com/en-us/122208'),
  named('iphone-17-pro', 'iPhone 17 Pro', 'phone', '6.3-inch', size(1206,2622), 'https://support.apple.com/en-us/125090'),
  named('iphone-air', 'iPhone Air', 'phone', '6.5-inch', size(1260,2736), 'https://images.apple.com/at/iphone-air/specs/'),
  named('iphone-16-plus', 'iPhone 16 Plus', 'phone', '6.7-inch', size(1290,2796), 'https://support.apple.com/en-us/121030'),
  named('pixel-9-pro-xl', 'Pixel 9 Pro XL', 'phone', '6.8-inch', size(1344,2992), 'https://support.google.com/pixelphone/answer/7158570?hl=en'),
  named('iphone-17-pro-max', 'iPhone 17 Pro Max', 'phone', '6.9-inch', size(1320,2868), 'https://support.apple.com/en-us/125091'),
  named('galaxy-fold6-unfolded', 'Galaxy Z Fold 6', 'foldable', '7.6-inch-unfolded-boundary', size(1856,2160), 'https://www.samsung.com/uk/business/smartphones/galaxy-z/galaxy-z-fold6-crafted-black-512gb-online-exclusive-sm-f956bakceub/'),
  named('galaxy-s24', 'Galaxy S24', 'phone', 'compact-android-descriptor', null),
  named('galaxy-a55', 'Galaxy A55', 'phone', 'large-android-descriptor', null),
  named('galaxy-tab-s9', 'Galaxy Tab S9', 'tablet', '2.5K-medium-11-inch', size(1600,2560), 'https://www.samsung.com/us/support/answer/ANS10003691/'),
  named('ipad-pro-11', 'iPad Pro 11', 'tablet', '11-inch-descriptor', null),
  // These CSS sizes and DPRs are deliberately chosen test assumptions, not device measurements.
  synthetic('android-tablet-2k', 'Lenovo Tab M11 panel / assumed CSS', 'tablet', '2K-medium-11-inch', size(800,1280), 1.5, size(1200,1920), 'https://psref.lenovo.com/product/?productKey=Tab_M11'),
  synthetic('android-tablet-2-5k', '2.5K Android tablet / assumed CSS', 'tablet', '2.5K-medium', size(800,1200), 2, size(1600,2560), 'https://www.samsung.com/us/support/answer/ANS10003691/'),
  synthetic('android-tablet-3k', 'OnePlus Pad 2 panel / assumed CSS', 'tablet', '3K-large-12.1-inch', size(1060,1500), 2, size(2120,3000), 'https://www.oneplus.com/at/oneplus-pad-2/specs'),
  synthetic('android-tablet-3-2k', 'Xiaomi Pad 7 panel / assumed CSS', 'tablet', '3.2K-medium-11.16-inch', size(1068,1600), 2, size(2136,3200), 'https://www.mi.com/in/product/xiaomi-pad-7/specs/'),
  synthetic('android-tablet-large', 'Galaxy Tab S9 Ultra panel / assumed CSS', 'tablet', '2.9K-large-14.6-inch', size(924,1480), 2, size(1848,2960), 'https://www.samsung.com/us/support/answer/ANS10003691/'),
  synthetic('phone-approx-7', 'Approximate seven-inch class boundary / assumed CSS', 'phone', 'approx-7-inch-boundary', size(480,1000), 2),
  synthetic('desktop-1080', '1080p desktop layout', 'desktop', '1080p', size(1920,1080), 1),
  synthetic('desktop-1440', '1440p desktop layout', 'desktop', '1440p', size(2560,1440), 1),
  synthetic('desktop-4k', '4K desktop layout', 'desktop', '4K', size(3840,2160), 1),
  synthetic('desktop-ultrawide', 'Ultrawide desktop layout', 'desktop', 'ultrawide', size(3440,1440), 1),
  synthetic('window-1363', 'Historical desktop window', 'desktop', 'windowed', size(1363,876), 1),
  synthetic('window-1280', 'Compact desktop window', 'desktop', 'windowed', size(1280,720), 1),
  synthetic('regression-844x390', 'Landscape regression viewport', 'phone', 'regression-landscape', size(844,390), 1),
  synthetic('regression-390x320', 'Short viewport / keyboard-like space constraint', 'phone', 'short-viewport', size(390,320), 1),
  synthetic('minimum-320', 'Minimum CSS width', 'phone', 'minimum-width', size(320,568), 1),
];


// Requested hardware/families are tracked separately from executable emulation inputs.
// Owner consent to measure is not a measurement. Proxies never fill unknown target values.
const requestedTargets = [
  {
    id:'requested-redmi-k90-pro-max', requestedLabel:'Redmi K90ProMax', name:'REDMI K90 Pro Max', owned:true,
    officialModelStatus:'official-model-name-confirmed', officialURL:'https://www.mi.com/prod/redmi-k90-pro-max',
    matrixProxyIDs:['pixel-9-pro-xl-portrait','pixel-9-pro-xl-landscape','galaxy-a55-portrait','galaxy-a55-landscape'],
    provenance:'Owner-requested handset; official page confirms model name only. Large Android descriptor proxy coverage does not establish this handset viewport, DPR or browser configuration.'
  },
  {
    id:'requested-xiaomi-pad9-pro-max', requestedLabel:'Xiaomi pad9 pro max', name:'Xiaomi pad9 pro max (owner-reported model pending)', owned:true,
    officialModelStatus:'user-reported-name-pending-confirmation', officialURL:'https://www.mi.com/prod/xiaomi-pad-9',
    matrixProxyIDs:['android-tablet-3k-portrait','android-tablet-3k-landscape','android-tablet-3-2k-portrait','android-tablet-3-2k-landscape'],
    provenance:'Owner-reported name retained verbatim; the official Pad 9 family page lists Pad 9 Pro, but correspondence to the reported Pro Max name remains pending About-device model text. Synthetic Android tablet proxy coverage does not identify this device.'
  },
  ...[
    ['requested-ipad-air','iPad Air','iPad Air'],
    ['requested-ipad-pro','iPadPro','iPad Pro'],
    ['requested-ipad-mini','iPad mini','iPad mini']
  ].map(([id,requestedLabel,name]) => ({
    id, requestedLabel, name, owned:false, officialModelStatus:'family-exact-generation-and-size-pending', officialURL:null,
    matrixProxyIDs:['ipad-pro-11-portrait','ipad-pro-11-landscape'],
    provenance:'Requested iPad family without an exact generation, display size or SKU. Existing iPad Pro 11 descriptor is a representative tablet proxy, not evidence for this family or its current models.'
  })),
  ...[
    ['requested-iphone18-pro','iPhone18pro','iPhone 18 Pro','iphone-17-pro'],
    ['requested-iphone18-pro-max','iphone18promax','iPhone 18 Pro Max','iphone-17-pro-max']
  ].map(([id,requestedLabel,name,proxy]) => ({
    id, requestedLabel, name, owned:false, officialModelStatus:'official-spec-page-found-exact-viewport-pending',
    officialURL:'https://www.apple.com/iphone-18-pro/specs/', matrixProxyIDs:[proxy+'-portrait',proxy+'-landscape'],
    provenance:'Official iPhone 18 Pro specification page is available; locked Playwright 1.63.0 has no iPhone 18 descriptors. Existing iPhone 17 descriptor proxy coverage does not establish an iPhone 18 CSS viewport or browser setting.'
  }))
].map(target => ({
  ...target, source:'owner request 2026-10-19', measurementStatus:'pending', measured:false,
  viewport:null, DPR:null, deviceScaleFactor:null, physicalResolution:null
}));

function depthMode(depth) {
  if (!['standard', 'deep'].includes(depth)) throw Error('Expected standard or deep device depth');
  return depth;
}
function profileCase(profile, orientation, overrides = {}) {
  const descriptorName = profile.descriptor ? profile.descriptor + (orientation === 'landscape' ? ' landscape' : '') : null;
  let contextOptions;
  if (descriptorName) {
    if (!devices[descriptorName]) throw Error(`Missing pinned device descriptor: ${descriptorName}`);
    const { defaultBrowserType, ...options } = devices[descriptorName];
    contextOptions = structuredClone(options);
  } else {
    const swap = (orientation === 'landscape') !== (profile.viewport.width > profile.viewport.height);
    const viewport = swap ? size(profile.viewport.height, profile.viewport.width) : { ...profile.viewport };
    contextOptions = { viewport, deviceScaleFactor: profile.deviceScaleFactor, isMobile: profile.category !== 'desktop', hasTouch: profile.category !== 'desktop' };
  }
  const physicalResolution = profile.physicalResolution && (orientation === 'landscape' ? size(profile.physicalResolution.height, profile.physicalResolution.width) : { ...profile.physicalResolution });
  return {
    id: `${profile.id}-${orientation}`, name: profile.name, category: profile.category, screenClass: profile.screenClass,
    physicalResolution, descriptorName, viewport: contextOptions.viewport, deviceScaleFactor: contextOptions.deviceScaleFactor,
    isMobile: contextOptions.isMobile, hasTouch: contextOptions.hasTouch, orientation, safeArea: zeroInsets(), zoom: 1,
    measured: false, simulation: descriptorName ? 'playwright-descriptor' : 'synthetic', sources: [...profile.sources],
    provenance: descriptorName
      ? 'Installed Playwright 1.63.0 descriptor, including upstream viewport/screen orientation; browser emulation only, no physical-device measurement. Physical panel pixels are separate manufacturer metadata when available.'
      : 'Synthetic CSS viewport and DPR chosen independently as layout stress inputs; named panel metadata, if present, is from the manufacturer. Neither CSS size nor DPR is a measured device/browser setting.',
    contextOptions, ...overrides
  };
}
function buildCases(depth = 'standard') {
  depthMode(depth);
  const cases = catalog.flatMap(p => p.descriptor || ['tablet','foldable'].includes(p.category) || p.id === 'phone-approx-7'
    ? [profileCase(p, 'portrait'), profileCase(p, 'landscape')]
    : [profileCase(p, p.viewport.width > p.viewport.height ? 'landscape' : 'portrait')]);
  // Explicit assumed insets exercise env(safe-area-inset-*), not a real handset's notch dimensions.
  for (const [orientation, viewport, safeArea] of [
    ['portrait',size(390,844),{top:44,right:0,bottom:34,left:0}],
    ['landscape',size(844,390),{top:0,right:44,bottom:21,left:44}]
  ]) {
    const p = synthetic(`safe-area-${orientation}`, 'Assumed safe-area stress case', 'phone', 'safe-area-assumption', viewport, 3);
    cases.push(profileCase(p, orientation, { id: p.id, safeArea,
      provenance: 'Synthetic CSS viewport, DPR and safe-area insets chosen for controlled stress tests; 44/34 portrait and 44/21 landscape are assumptions, not measured notch or browser values.' }));
  }
  const base = catalog.find(p => p.id === 'desktop-1440');
  for (const zoom of [1.25,1.5,2]) {
    const viewport = size(Math.round(base.viewport.width/zoom),Math.round(base.viewport.height/zoom));
    cases.push(profileCase({ ...base, viewport }, 'landscape', { id: `desktop-1440-layout-zoom-${zoom}`, orientation:'landscape', zoom,
      simulation: 'layout-equivalent-zoom',
      provenance: `Synthetic layout-equivalent viewport for nominal ${zoom*100}% zoom; not actual browser UI zoom. DPR stays independent; browser visualViewport.scale and OS scaling require separate observation.` }));
  }
  if (depth === 'deep') {
    for (const p of catalog.filter(p => p.category === 'desktop')) for (const dpr of [1.25,2])
      cases.push(profileCase({ ...p, deviceScaleFactor:dpr }, 'landscape', { id:`${p.id}-dpr-${dpr}`, orientation:'landscape' }));
    for (const viewport of [size(800,600),size(1024,768)]) cases.push(profileCase(synthetic(`window-${viewport.width}x${viewport.height}`, 'Deep window boundary', 'desktop', 'windowed', viewport, 1), 'landscape'));
  }
  return cases;
}

function cssBreakpoints() {
  const widths = new Set();
  // Include container widths as scan candidates, while the harness records actual container geometry separately.
  for (const directory of ['src/floating','src/theme','src/saves','src/combat','framework/motion-hub','framework/workspace']) {
    for (const entry of fs.readdirSync(path.join(root,directory), {withFileTypes:true})) {
      if (!entry.isFile() || !/\.(css|vue)$/.test(entry.name)) continue;
      const source = fs.readFileSync(path.join(root,directory,entry.name),'utf8').replace(/\/\*[\s\S]*?\*\//g,'');
      for (const query of source.matchAll(/@(?:media|container)\b([^{}]*)\{/g))
        for (const match of query[1].matchAll(/(?:min|max)-width\s*:\s*(\d+(?:\.\d+)?)px/g)) widths.add(Number(match[1]));
    }
  }
  return [...widths].sort((a,b)=>a-b);
}
function scanWidths(depth = 'standard') {
  depthMode(depth);
  const widths = new Set([320,2560]);
  for (let width=320;width<=2560;width+=depth==='deep'?16:64) widths.add(width);
  for (const breakpoint of cssBreakpoints()) for (const delta of [-1,0,1]) {
    const width=breakpoint+delta;if(width>=320&&width<=2560) widths.add(width);
  }
  return [...widths].sort((a,b)=>a-b);
}
module.exports = { catalog, requestedTargets, buildCases, scanWidths, cssBreakpoints };
