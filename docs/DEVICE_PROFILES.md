# CJ-3D device profile catalog

Catalog review: 2026-10-19. `tests/device-profiles.cjs` supplies 48 standard or
62 deep **emulation scenarios**, not certified physical devices. Every scenario
has `measured:false`: no actual device/browser measurements have been supplied.
Windows, Android/iOS hardware, real DoL and
ModLoader remain separate acceptance environments.
Use the [offline measurement instructions](DEVICE_MEASUREMENT.md) to supply
actual browser observations; the page does not independently certify hardware.

## Inputs and source boundaries

`buildCases('standard'|'deep')` returns the viewport, DPR, mobile/touch flags,
orientation, safe-area assumptions, nominal zoom, source URLs and provenance.
`contextOptions` contains only Playwright browser-context inputs. Named profiles
copy the installed descriptors, including the dedicated landscape entry, without
converting inches or panel resolution to CSS pixels. `physicalResolution` is
separate manufacturer panel metadata, oriented for the scenario, or `null` when
not established. It does not certify the browser's active output resolution.

The locked Playwright/core version is **1.63.0**. Configuration tests pin both its
version and a SHA-256 over every selected portrait/landscape descriptor, including
UA, viewport, screen, DPR and preferred browser. Dependency updates require
reviewing that snapshot. The runtime source is the installed `playwright.devices` export (bundled in
`playwright-core/lib/coreBundle.js` in this package build), corresponding to the
[versioned upstream registry](https://github.com/microsoft/playwright/blob/v1.63.0/packages/playwright-core/src/server/deviceDescriptorsSource.json).
[Playwright's emulation documentation](https://playwright.dev/docs/emulation)
describes the inputs; it does not supply the synthetic numerical assumptions.
The Chromium harness remains Chromium even when using an iPhone descriptor; its
UA and inputs do not prove Safari or iOS behavior. Some upstream Apple landscape
entries keep portrait `screen` dimensions: these are preserved and observable,
not silently corrected.

| Named phone / boundary | Advertised class | Native panel pixels | Specification source |
| --- | --- | --- | --- |
| iPhone 16e | 6.1 in | 1170 × 2532 | [Apple](https://support.apple.com/en-us/122208) |
| iPhone 17 Pro | 6.3 in | 1206 × 2622 | [Apple](https://support.apple.com/en-us/125090) |
| iPhone Air | 6.5 in | 1260 × 2736 | [Apple](https://images.apple.com/at/iphone-air/specs/) |
| iPhone 16 Plus | 6.7 in | 1290 × 2796 | [Apple](https://support.apple.com/en-us/121030) |
| Pixel 9 Pro XL | 6.8 in | 1344 × 2992 | [Google](https://support.google.com/pixelphone/answer/7158570?hl=en) |
| iPhone 17 Pro Max | 6.9 in | 1320 × 2868 | [Apple](https://support.apple.com/en-us/125091) |
| Galaxy Z Fold6 unfolded | 7.6 in, above-seven-inch boundary | 1856 × 2160 | [Samsung](https://www.samsung.com/uk/business/smartphones/galaxy-z/galaxy-z-fold6-crafted-black-512gb-online-exclusive-sm-f956bakceub/) |

Galaxy S24, Galaxy A55, Galaxy Tab S9 and iPad Pro 11 add installed descriptor
coverage. The catalog leaves S24/A55/iPad physical pixels unknown rather than
inferring them from DPR. A separate approximately-seven-inch synthetic boundary
has no measured diagonal or physical resolution; Fold6 is not called a 7.0-inch
phone. All named profiles run both upstream orientations.

| Tablet panel reference | Panel pixels | CSS portrait stress input / DPR | Input status |
| --- | --- | --- | --- |
| [Lenovo Tab M11](https://psref.lenovo.com/product/?productKey=Tab_M11) | 1200 × 1920 | 800 × 1280 / 1.5 | Synthetic; 2K class |
| [Galaxy Tab S9](https://www.samsung.com/us/support/answer/ANS10003691/) | 1600 × 2560 | 640 × 1024 / 2.5 | Installed descriptor |
| Galaxy Tab S9 panel reference | 1600 × 2560 | 800 × 1200 / 2 | Synthetic; independent 2.5K class layout |
| [OnePlus Pad 2](https://www.oneplus.com/at/oneplus-pad-2/specs) | 2120 × 3000 | 1060 × 1500 / 2 | Synthetic; 3K class |
| [Xiaomi Pad 7](https://www.mi.com/in/product/xiaomi-pad-7/specs/) | 2136 × 3200 | 1068 × 1600 / 2 | Synthetic; 3.2K class |
| [Galaxy Tab S9 Ultra](https://www.samsung.com/us/support/answer/ANS10003691/) | 1848 × 2960 | 924 × 1480 / 2 | Synthetic; large tablet |

Synthetic tablet CSS sizes/DPRs are independently chosen stress configurations,
including when their numbers happen to match a panel/DPR ratio. They do not claim
the manufacturer's default Android density or active browser viewport. Tablet
cases cover portrait and landscape.

Desktop scenarios use CSS viewports 1920×1080, 2560×1440, 3840×2160,
3440×1440 and windowed 1363×876 / 1280×720. These are synthetic layout inputs,
not measured monitor/OS scaling settings. Deep mode adds DPR 1.25/2 and smaller
800×600 / 1024×768 windows. Regression viewports include 844×390, 390×320 and
320×568. The short viewport constrains space; it does not simulate an actual
virtual keyboard or its events.

Safe-area scenarios use assumed portrait insets 44/0/34/0 and landscape
0/44/21/44 (top/right/bottom/left). They exercise CSS environment handling through
the harness's protocol override, without claiming measured cutout dimensions.
Nominal desktop zoom 125%, 150%, 200% reduces the layout viewport while keeping
DPR independent; `simulation:'layout-equivalent-zoom'` marks this explicitly.
It is **not actual browser UI zoom**, pinch zoom, CSS zoom or OS scaling.
The harness must record observed `visualViewport.scale` separately.


## Owner-requested targets awaiting measurement

`requestedTargets` is a separate registry and does not add guessed parameters to
`buildCases()`. All seven entries have `measurementStatus:'pending'`,
`measured:false`, `viewport:null`, `DPR:null`, `deviceScaleFactor:null` and
`physicalResolution:null`. Source: owner request, 2026-10-19. Original spelling is
preserved in `requestedLabel`; `name` holds a separate display label. The two
owned devices still need actual browser/viewport/DPR observations; consent to
measure supplies no numerical data.

| Original requested label | Owned | Model status | Existing matrix proxy IDs |
| --- | --- | --- | --- |
| `Redmi K90ProMax` | Yes | [Official REDMI K90 Pro Max name](https://www.mi.com/prod/redmi-k90-pro-max) confirmed; browser parameters pending | `pixel-9-pro-xl-*`, `galaxy-a55-*` |
| `Xiaomi pad9 pro max` | Yes | Owner-reported name pending confirmation against About-device model text. The [official Pad 9 family page](https://www.mi.com/prod/xiaomi-pad-9) lists Pad 9 Pro; correspondence to the reported Pro Max name is unresolved | `android-tablet-3k-*`, `android-tablet-3-2k-*` |
| `iPad Air` | No | Exact generation, size and SKU pending | `ipad-pro-11-*` |
| `iPadPro` | No | Exact generation, size and SKU pending | `ipad-pro-11-*` |
| `iPad mini` | No | Exact generation, size and SKU pending | `ipad-pro-11-*` |
| `iPhone18pro` | No | [Official specification page](https://www.apple.com/iphone-18-pro/specs/) available; exact CSS viewport pending | `iphone-17-pro-*` |
| `iphone18promax` | No | Same official family specification page; exact CSS viewport pending | `iphone-17-pro-max-*` |

Each `*` means the existing portrait and landscape case. A proxy is only adjacent
emulation coverage. It is not an exact model match, a real-device result, or a
claim about an entire current iPad family. The Pad name remains as supplied;
missing correspondence does not prove the model nonexistent. Installed
Playwright 1.63.0 has no iPhone 18 descriptor, and this change neither upgrades it
nor invents a descriptor from panel pixels. Registry data is not passed to browser
contexts; the executable matrix stays **48 standard / 62 deep**.

## Width scan and checks

`scanWidths()` includes 320 through 2560 at 64 CSS-pixel intervals (16 for deep),
both endpoints, and actual current `min/max-width: Npx` media/container thresholds
plus N−1/N/N+1. Thresholds are read from `src/floating`, `src/theme`, `src/saves`, `src/combat`,
`framework/motion-hub` and `framework/workspace` CSS/Vue files. The latter two
cover the current Framework Hub and its detail view outlet. Container thresholds are candidate viewport widths only: the harness
must observe real container geometry and cannot equate the two sizes. Width
scans use four representative scenes rather than rerunning every business suite
for every profile.

`node tests/device-profiles.test.cjs` checks descriptor drift, unique IDs,
unknown measurement status, source/provenance flags, required device classes,
regression sizes, zoom labels, safe-area inputs, width endpoints/boundaries and
deep mode as a strict extension of standard coverage. It also checks the seven
requested targets, two owned flags, pending/null measurements and valid proxy IDs. This configuration check
does not prove rendered layout; `tests/device-layouts.cjs` owns that evidence.
