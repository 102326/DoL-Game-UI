import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {readReport} from './records.ts';
import {finalizeUpload} from './upload.ts';
import type {Context,Summary} from './upload.ts';
import {safeSource,filesBelow} from './research-files.ts';
const require=createRequire(import.meta.url);
const {researchPlan:plan}:typeof import('../ci-catalog.cjs')=require('../ci-catalog.cjs');
const record=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const rows=(v:unknown)=>{if(!Array.isArray(v))throw Error('Invalid research upload list');return v.map((entry:unknown)=>{if(!record(entry))throw Error('Invalid research upload item');return entry})};
export function researchUpload(ctx:Context, summary:Summary) {
  const report = readReport(ctx, 'research.json');
  const rawFiles = plan.filter(c=>c.report).map(c=>c.report?.fixture ? 'fixtures/moody-historical-regressions.cjs/snapshot.json' : `research/${c.id}/result.json`);
  const required = ['catalog.json','identity.json','summary.json','research.json','stage-dependencies.json','stage-browser-install.json', ...rawFiles];
  const optional = plan.map(c=>`research/${c.id}.log`);
  // Keep controlled comparison builds/CSS and newly generated review pixels in a separate bounded layer.
  // Raw player data is never among these roots/extensions.
  const assets:string[] = [];
  for (const check of rows(report?.results||[])) for (const a of rows(check.artifacts||[])) {
    // Flat Evolution reports have no per-case review directory. Never sweep
    // their common parent, or every weather image is copied once per report.
    if (typeof a.origin!=='string'||!a.origin || path.basename(a.origin) !== 'result.json') continue;
    const spec = plan.find(c=>c.id === check.name)?.report;
    const normalized = path.relative(path.join(ctx.root,'tests/artifacts'), path.resolve(ctx.root,a.origin)).split(path.sep).join('/');
    if (!spec?.pattern || !new RegExp('^' + spec.pattern.replaceAll('.', '\\.') + '$').test(normalized)) continue;
    const sourceDir = path.dirname(path.join(ctx.root, a.origin));
    if (!safeSource(ctx.root, sourceDir) || !fs.statSync(sourceDir).isDirectory()) continue;
    const siblings = fs.readdirSync(sourceDir, { withFileTypes: true }).filter(e=>e.isFile() && e.name !== 'result.json' && /\.(png|json|mp4|webm)$/.test(e.name));
    for (const entry of siblings) {
      const source = path.join(sourceDir, entry.name);
      const relative = `review/${check.name}/${path.basename(source)}`;
      fs.mkdirSync(path.dirname(path.join(ctx.dir, relative)), { recursive: true }); fs.copyFileSync(source, path.join(ctx.dir, relative)); assets.push(relative);
    }
  }
  for (const folder of ['golden-spin-b/dist','settings-refraction-v1/dist','evolution/weather-dist']) {
    for (const source of filesBelow(path.join(ctx.root, 'tests/artifacts', folder), ctx.root).filter(f=>/\.(css|js|html|svg|md|txt|json|png|jpe?g|webp|mp4|webm|woff2?)$/.test(f) || path.basename(f)==='LICENSE')) {
      const relative = 'builds/' + path.relative(path.join(ctx.root,'tests/artifacts'), source).split(path.sep).join('/');
      fs.mkdirSync(path.dirname(path.join(ctx.dir, relative)), { recursive: true }); fs.copyFileSync(source, path.join(ctx.dir, relative)); assets.push(relative);
    }
  }
  for (const file of ['golden-spin-b/bundle-sizes.json','settings-refraction-v1/provenance.json']) {
    const source = path.join(ctx.root, 'tests/artifacts', file);
    if (!safeSource(ctx.root, source) || !fs.statSync(source).isFile()) continue;
    const relative = 'build-metadata/' + file;
    fs.mkdirSync(path.dirname(path.join(ctx.dir, relative)), { recursive: true }); fs.copyFileSync(source, path.join(ctx.dir, relative)); assets.push(relative);
  }
  return finalizeUpload(ctx, summary, { required, identityFiles: required.filter(f=>!rawFiles.includes(f)), candidates: [...required,...optional,...assets], totalLimit: 160 * 1024 * 1024,
    fileLimit: file => file.startsWith('review/') ? (/\.(png|mp4|webm)$/.test(file) ? 8 : 2) * 1024 * 1024 : file.startsWith('builds/') ? 8 * 1024 * 1024 : file.startsWith('research/') && file.endsWith('.json') ? 2 * 1024 * 1024 : undefined });
}