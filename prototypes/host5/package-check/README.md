# Neutral Loader package check

Chrome 157.0.8103.79, a self-authored SugarCube passage and actual ModLoader source fixed at `933b235de5b28187b80eb178c18d0e82b3cd7a3d` were used to check the candidate player ZIPs. The general dependency checker accepts the order `TweeReplacer`, `StoneFreeHost`, `DoLGameUI`; it deliberately skips the UI's `GameVersion` requirement. This does not establish game compatibility.

The real `IndexDBLoader.addMod` API installed the packages into a fresh browser context. After reload, the Loader returned the expected package order, a successful general dependency check, the candidate Host script hash and the `layerPresets.driftingTexture` capability. A second fresh context installed the public old Host first: after reload its script hash was `86b828ae8aa2f389f17ac10eb887752d2972cdfddf172c06a8237e25a43ef7bd` and the capability was absent. Replacing its same IndexedDB key with the candidate and reloading yielded candidate hash `c286078d4f784606c110b9b0ebec38e8902534ff129cdd3875095264ca8f0214`, the capability, and one Host key. Both paths opened settings using the actual sidebar button and closed it with Escape. These checks cover page reload, not GUI import or browser restart.

Both Host packages identify as `StoneFreeHost 0.1.5-experimental` despite different bytes. Version matching alone cannot prove the executing Host identity; the UI declares `>=0.1.2-experimental && <0.2.0`, so a 5.x alias cannot substitute for this Host version. The tested public v4.5.2 Host ZIP SHA-256 is `6f221a29f9a042e9c5f32b4b9be9894d6941df4bebd29a5d326a44a8377cb8b8`; candidate Host ZIP is `a409e8acf03d4d83edeeece1ac992fb4973a734fc97799a10d1ab57cab627f0d` and candidate UI ZIP is `fc3b1050988a7b3aac3a5cf8cb7b47371552b02b23206cbd06b8c9bcc385400d`. Update the recorded candidate identity after any rebuild.

## Reproduce

The upstream Loader references the public [TweeReplacer](https://github.com/Lyoko-Jeremie/Degrees-of-Lewdity_Mod_TweeReplacer) commit `5094160465b0c5ef034eb5acd3d4f8122bdf8e09`. Its `boot.json` identifies version 1.7.0, requires Loader `^2.60.1`, and the neutral test package contains its locally built JS, manifest and README. Source inspection found no network, eval or storage calls in `src/`; it registers a Loader addon and processes replacement entries. This is a local source build, not a published release ZIP.

Use Node 26, the UI checkout's esbuild 0.28.2, Yarn 3.4.1 and the public [SugarCube 2.37.3 format ZIP](https://github.com/tmedwards/sugarcube-2/releases/download/v2.37.3/sugarcube-2.37.3-for-twine-2.1-local.zip), SHA-256 `da00a8c15ec4e88a9e231a3ff6c516c57055f84231bb999f869ed34ade353dab`. `$UI_ROOT` is this checkout, `$LOADER_SRC` is a checkout of [upstream ModLoader](https://github.com/Lyoko-Jeremie/sugarcube-2-ModLoader) containing the fixed commit, and `$WORK` is a new temporary directory. Network is needed for public repositories and locked dependencies. Do not use a real game document.

```sh
mkdir -p "$WORK/loader" "$WORK/twee"
git -C "$LOADER_SRC" archive 933b235de5b28187b80eb178c18d0e82b3cd7a3d package.json yarn.lock .yarnrc.yml src/BeforeSC2 | tar -x -C "$WORK/loader"
git clone https://github.com/Lyoko-Jeremie/Degrees-of-Lewdity_Mod_TweeReplacer.git "$WORK/twee-git"
git -C "$WORK/twee-git" archive 5094160465b0c5ef034eb5acd3d4f8122bdf8e09 | tar -x -C "$WORK/twee"
(cd "$WORK/loader" && npx -y @yarnpkg/cli-dist@3.4.1 install --immutable && "$UI_ROOT/node_modules/.bin/esbuild" src/BeforeSC2/init.ts --bundle --platform=browser --format=iife --outfile=bundle.js --tsconfig=src/BeforeSC2/tsconfig.json)
(cd "$WORK/twee" && npx -y @yarnpkg/cli-dist@3.4.1 install --immutable && mkdir -p dist && "$UI_ROOT/node_modules/.bin/esbuild" src/init.ts --bundle --platform=browser --format=iife --outfile=dist/TweeReplacer.js --tsconfig=src/tsconfig.json)
python3 "$UI_ROOT/prototypes/host5/package-check/package-twee.py" "$WORK/twee" "$WORK/twee.zip"
python3 "$UI_ROOT/prototypes/host5/package-check/neutral-loader-page.py" /path/to/fixed-sugarcube.zip "$WORK/loader/bundle.js" "$WORK/neutral.html"
node "$UI_ROOT/prototypes/host5/package-check/indexeddb-check.mts" "$WORK/neutral.html" "$WORK/twee.zip" /path/to/public-host.zip /path/to/candidate-host.zip /path/to/candidate-ui.zip
```

The tested locked Loader bundle SHA-256 was `e509dd57a78b393bf684e98e017bf970e0bdf13ec9440162ef82dc33c103d81e` and locally built TweeReplacer ZIP SHA-256 `291b83e9f3ea584cf7223e6701abb8e7a345026df746dc57a755c28f33ae308b`. The page generator checks the former; compare the latter before accepting a replay. Generated HTML embeds the Loader and must stay outside the repository.
