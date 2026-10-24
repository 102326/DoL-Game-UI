// Only allowlisted first-party fixtures may request bounded pixels and geometry.
import fs = require('node:fs');
import path = require('node:path');
import type {Page} from 'playwright';
const {fixtureChecks,writeJson}:typeof import('../scripts/ci/records.ts')=require('../scripts/ci/records.ts');
const {context}:typeof import('../scripts/ci/context.ts')=require('../scripts/ci/context.ts');
const root=path.resolve(__dirname,'..');
const record=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value);
type EvidencePage=Pick<Page,'viewportSize'|'screenshot'>&Partial<Pick<Page,'evaluate'>>;

function evidenceDirectory():string|null {
  const check = process.env.MOODY_CHECK_NAME, directory = process.env.MOODY_EVIDENCE_DIR;
  if (!check||!fixtureChecks.includes(check) || !directory || !/^[a-zA-Z0-9_-]{1,100}$/.test(process.env.MOODY_EVIDENCE_ID || '')) return null;
  const expected = path.join(root, 'tests/artifacts/ci', process.env.MOODY_EVIDENCE_ID||'', 'fixtures', check);
  return path.resolve(directory) === expected ? directory : null;
}

function writeLayoutReport(report:Record<string,unknown>):boolean {
  const directory = evidenceDirectory();
  if (!directory || process.env.MOODY_CHECK_NAME !== 'device-layouts.cjs') return false;
  const data = { schema: 1, ...report, identity: context().identity };
  if (Buffer.byteLength(JSON.stringify(data, null, 2) + '\n') > 262144) throw Error('Layout report exceeds 256 KiB; coverage evidence cannot be dropped');
  writeJson(path.join(directory, 'layout-report.json'), data);
  return true;
}

async function captureFailure(page:EvidencePage|null, { kind, error, snapshot }:{kind:string;error:unknown;snapshot:unknown}):Promise<void> {
  const check = process.env.MOODY_CHECK_NAME, directory = evidenceDirectory();
  if (!directory || !['settings', 'combat', 'devices'].includes(kind)) return;
  try {
    const viewport = page?.viewportSize(),fields=record(snapshot)?snapshot:undefined,focus=record(fields?.focusRect)?fields.focusRect:undefined,profile=record(fields?.profile)?fields.profile:undefined;
    const clip = viewport ? { width: Math.min(viewport.width, 2048), height: Math.min(viewport.height, 1536), x: 0, y: 0 } : null;
    if (clip && focus && viewport) {
      const finite = (value:unknown):number => typeof value==='number'&&Number.isFinite(value) ? value : 0;
      clip.x = Math.max(0, Math.min(viewport.width - clip.width, finite(focus.x) + finite(focus.width) / 2 - clip.width / 2));
      clip.y = Math.max(0, Math.min(viewport.height - clip.height, finite(focus.y) + finite(focus.height) / 2 - clip.height / 2));
    }
    const device = kind === 'devices' ? { id: profile?.id, viewport: profile?.viewport, dpr: profile?.deviceScaleFactor, scenario: fields?.scenario } : undefined;
    const runtime = typeof page?.evaluate === 'function' ? await page.evaluate(() => ({ viewport: { width: innerWidth, height: innerHeight }, dpr: devicePixelRatio, visualViewport: visualViewport ? { width: visualViewport.width, height: visualViewport.height, scale: visualViewport.scale } : null })) : undefined;
    const detail=record(error)?error:undefined;
    const data = { kind, check, device, runtime, identity: context().identity, screenshot: { viewport, clip, scale: 'css', cropped: Boolean(viewport && (viewport.width > 2048 || viewport.height > 1536)) }, assertion: { name: detail?.name, code: detail?.code, message: String(detail?.message || error).slice(0, 4000) }, snapshot };
    let json = JSON.stringify(data, null, 2) + '\n';
    if (Buffer.byteLength(json) > 65536) json = JSON.stringify({ kind, check, device, runtime, identity: data.identity, screenshot: data.screenshot, assertion: data.assertion, snapshotOmitted: '64 KiB limit' });
    writeJson(path.join(directory, 'snapshot.json'), JSON.parse(json));
    if (!viewport||!clip||!page) return;
    const pixels = await page.screenshot({ type: 'jpeg', quality: 60, scale: 'css', clip, animations: 'disabled', timeout: 3000 });
    if (pixels.length <= 524288) fs.writeFileSync(path.join(directory, 'viewport.jpg'), pixels);
  } catch (captureError) {
    // The original assertion remains the failure even if browser capture is unavailable.
    const detail=record(captureError)?captureError:undefined;
    console.error('Controlled fixture capture unavailable:', detail?.code || detail?.name);
  }
}

export = { captureFailure, writeLayoutReport };
