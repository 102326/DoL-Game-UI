# Wardrobe renderer attribution

The isolated wardrobe renderer derives from **Degrees of Lewdity**, by Vrelnir and contributors, commit `41993d3f32476f0b1c8db730c159a50ffcdc2a65` (0.5.11.9).

Source: https://gitgud.io/Vrelnir/degrees-of-lewdity

The upstream rendering code and its modifications are licensed under **Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International**. The full upstream notice is included as `UPSTREAM-RENDERER-LICENSE`. The project's MIT notice does not replace that license for this derived code. The bundled JavaScript includes this code; preserve this notice and the upstream license when redistributing it.

Changes: lexical isolation of model preparation and compilation; caller-owned copies of state and clothing definitions; visible failure on layer errors; no live model hooks or global state swapping; static outfit rendering; reviewed Lyra mouth asset path adapter. Clothing projection and the Vue wardrobe interface are separate project code. Game artwork is not included in this package.

Reproduction: `node scripts/vendor-wardrobe.cjs` reads the pinned local upstream checkout and generates `src/wardrobe/vendor/isolated-model.js`. The script lists the exact source modules and helpers. No code is downloaded or evaluated from strings at runtime.
