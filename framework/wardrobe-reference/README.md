# Stone Free Wardrobe Reference

An optional, read-only Framework consumer for the original Wardrobe passage. It adds its own modeless reference entry and keeps the original wardrobe and its equip, try-on, and organization flows in charge.

The consumer reads the existing wardrobe snapshot helpers and immediately projects each item to copied display fields: name, colour, slot, warmth, durability, lewdness, outfit type, and a short description. It never passes clothing objects, inventory handles, or action callbacks into the reference UI. A is a frozen catalog snapshot; B is selected from the current catalog. Ordinary and spatial comparison show the same values. Spatial comparison animates from B's own reference card and returns focus to that card when the scene is still valid.

When the active passage or inventory is unsupported, the entry reports that the original wardrobe remains available. Unknown slot names are reported without guessing their meaning. Passage invalidation and consumer disposal clear A, B, and native DOM references. Reduced-motion settings remove the spatial transition.

The only intentional product surface is the optional reference launcher and its readonly panel. This experiment does not include outfit preview imagery, try-on, equip, persistence, or wardrobe replacement.

## Build and test integration

The standalone entry is `main.ts`; the framework build loop adds `['wardrobe-reference', 'wardrobe-reference/main.ts']` in `scripts/build-framework.mjs`, and the offline package list includes `wardrobe-reference` in `scripts/package-framework.py`. This consumer uses the matching experimental Host protocol and does not change the stable DoL UI API.

`tests/framework-reference.cjs` bundles the projection helper and Host fixture with esbuild, then builds the Vue entry with the existing Vite/Vue dependencies into a unique test artifact directory before running Microsoft Edge. The fixture is labeled and does not claim compatibility with a live DoL scene or every Mod-added wardrobe slot.
