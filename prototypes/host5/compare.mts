import assert from 'node:assert/strict';

import {build} from 'esbuild';
import {chromium} from 'playwright';
import type {createPrecipitation, PrecipitationBackend} from './precipitation.ts';

declare global {
  interface Window { precip: {createPrecipitation: typeof createPrecipitation} }
}
const bundled = await build({entryPoints: ['prototypes/host5/precipitation.ts'], bundle: true,
  write: false, format: 'iife', globalName: 'precip', target: 'es2020'});
const script = bundled.outputFiles[0]!.text;
const browser = await chromium.launch({channel: process.env.HOST5_BROWSER || 'msedge'});
const frames = new Map<PrecipitationBackend, string>();
try {
  // Fresh page for each arm; reversed order helps expose a warm-up or ordering effect.
  for (const backend of ['canvas', 'svg', 'svg', 'canvas'] as const) {
    const page = await browser.newPage({viewport: {width: 480, height: 240}, deviceScaleFactor: 1});
    try {
      await page.setContent('<style>*{box-sizing:border-box}body{margin:0}main{width:480px;height:240px;position:relative;background:#1d2530;overflow:hidden}</style><main></main>');
      await page.addScriptTag({content: script});
      const snapshot = await page.evaluate(async backend => {
        const target = document.querySelector('main')!;
        const painter = window.precip.createPrecipitation(target, backend);
        const fixed = {rain: 0.65, snow: 0.35};
        const costs: number[] = [], intervals: number[] = [];
        let last = 0;
        for (let i = 0; i < 71; i++) {
          const stamp = await new Promise<number>(resolve => requestAnimationFrame(resolve));
          const start = performance.now();
          painter.paint(i * 16, fixed);
          if (i > 10) {costs.push(performance.now() - start); intervals.push(stamp - last)}
          last = stamp;
        }
        painter.paint(640, fixed);
        const pct = (values: number[], p: number) => [...values].sort((a, b) => a - b)[Math.ceil(values.length * p) - 1]!;
        return {backend, samples: costs.length, nodes: target.querySelectorAll('*').length,
          submissionP50Ms: pct(costs, 0.5), submissionP95Ms: pct(costs, 0.95), frameIntervalP95Ms: pct(intervals, 0.95),
          intervalsOver50Ms: intervals.filter(ms => ms > 50).length};
      }, backend);
      const telemetry = await page.context().newCDPSession(page);
      await telemetry.send('Performance.enable');
      const metrics = await telemetry.send('Performance.getMetrics');
      console.log(JSON.stringify({browser: browser.version(), ...snapshot,
        pageJsHeapUsedBytes: metrics.metrics.find(m => m.name === 'JSHeapUsedSize')?.value}));
      frames.set(backend, (await page.screenshot()).toString('base64'));
    } finally {await page.close()}
  }
  const comparator = await browser.newPage();
  const fixedPair = [frames.get('canvas')!, frames.get('svg')!];
  const differences = await comparator.evaluate(async inputs => {
    const arrays = await Promise.all(inputs.map(async png => {
      const image = new Image();
      image.src = 'data:image/png;base64,' + png;
      await image.decode();
      if (image.width !== 480 || image.height !== 240) throw new Error('Unexpected fixed frame size');
      const ctx = new OffscreenCanvas(image.width, image.height).getContext('2d')!;
      ctx.drawImage(image, 0, 0);
      return ctx.getImageData(0, 0, image.width, image.height).data;
    }));
    const [canvas, svg] = arrays as [Uint8ClampedArray, Uint8ClampedArray];
    let canvasInk = 0, svgInk = 0, strongDiff = 0;
    const fore = (pixels: Uint8ClampedArray, i: number) =>
      Math.max(Math.abs(pixels[i]! - 29), Math.abs(pixels[i+1]! - 37), Math.abs(pixels[i+2]! - 48)) > 12;
    for (let i = 0; i < canvas.length; i += 4) {
      if (fore(canvas, i)) canvasInk++;
      if (fore(svg, i)) svgInk++;
      if (Math.max(...[0,1,2].map(c => Math.abs(canvas[i+c]! - svg[i+c]!))) > 24) strongDiff++;
    }
    return {canvasInk, svgInk, strongDiff};
  }, fixedPair);
  console.log(JSON.stringify(differences));
  const ink = Math.min(differences.canvasInk, differences.svgInk);
  assert.ok(ink > 1000 && differences.strongDiff < 0.10 * ink, 'Both backends draw the same non-empty field');
} finally {await browser.close()}
