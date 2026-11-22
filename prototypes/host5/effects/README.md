# Host 5 effects fixture

An opt-in neutral browser fixture using the shipped `framework/host` directly. `effects.ts` is a standalone consumer entry: call `createWeather(host)` once, pass that shared capability to separate `mountEffects(host, id, parent, shared)` consumers, dispose consumers first and the shared provider last. Each mount owns its precipitation clock and WAAPI transitions (Canvas by default, optional SVG backend); the provider owns one Host claim. The demo replaces two different neutral page bodies while the Host page effect and a floating panel remain mounted. Background controls outside the panel remain clickable. The panel closes immediately and reopens with an opening transition; there is no closing motion. No DoLGameUI or game data is used.

From the repository root with dependencies installed:

```
npx vite --host 127.0.0.1
```

Open `/prototypes/host5/effects/`. Drag the surface by its handle, switch sunny to rain to snow quickly, switch pages, and remove/reopen the panel. The fixture respects reduced motion and stops the precipitation clock after the sunny fade or under reduced motion. For a Windows neutral Chromium check and typecheck:

```
npx tsc -p prototypes/host5/tsconfig.json
node prototypes/host5/effects/check.mts
```

The check uses Playwright's installed Chrome channel, a fresh Playwright context, and a temporary localhost Vite server. It does not exercise the game, mobile devices, or performance.

Weather colors and precipitation weights crossfade when interrupted; individual particle positions continue on their clock rather than morphing between rain and snow shapes.
