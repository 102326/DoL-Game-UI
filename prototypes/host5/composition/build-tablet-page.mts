import {build} from 'esbuild';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

// Embed the desktop scene and stylesheet so the Android activity needs no network permission.
const here = new URL('./', import.meta.url);
const bundle = await build({
  entryPoints: [fileURLToPath(new URL('tablet-probe.ts', here))],
  bundle: true, format: 'iife', target: 'chrome100', write: false
});
const css = await readFile(new URL('scene.css', here), 'utf8');
const template = await readFile(new URL('index.html', here), 'utf8');
const style = '<link rel="stylesheet" href="./scene.css">';
const script = '<script type="module" src="./scene.ts"></script>';
if (!template.includes(style) || !template.includes(script)) throw Error('Desktop scene entry changed');
const page = template
  .replace(style, () => '<style>' + css + '</style>')
  .replace(script, () => '<script>' + bundle.outputFiles[0]!.text.replace(/<\/script/gi, '<\\/script') + '</script>');
const output = new URL('../../../tests/artifacts/host5-tablet-page/', here);
await mkdir(output, {recursive: true});
await writeFile(new URL('index.html', output), page);
