import {build} from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
execFileSync(process.execPath,[path.join(root,'scripts/build-early.cjs')],{cwd:root,stdio:'inherit'});
execFileSync(process.execPath,[path.join(root,'node_modules/typescript/bin/tsc'),'-p',path.join(root,'tsconfig.public.json')],{cwd:root,stdio:'inherit'});
for (const [name, entry] of [['host', 'boot.ts'], ['native-status', 'examples/status-mod.ts'], ['comparison', 'examples/comparison-mod.ts'], ['soft-wet-surface', 'examples/soft-wet-surface.ts'], ['workspace', 'examples/workspace-mod.ts'], ['alternate-workspace', 'examples/alternate-workspace-mod.ts'], ['native-reading', 'examples/reading-source-mod.ts'], ['reading-controls', 'examples/reading-controls-mod.ts'], ['motion-hub', 'motion-hub/main.ts'], ['wardrobe-reference', 'wardrobe-reference/main.ts'], ['official-ui', 'official-ui/main.ts']]) {
 await build({root, configFile: false, plugins: [vue(), ...(name==='official-ui'?[tailwindcss()]:[])],
  esbuild: name==='official-ui'?{legalComments:'inline'}:undefined,
  define: {__STONE_FREE_CONSUMER__:true, 'process.env.NODE_ENV': JSON.stringify('production'), __VUE_OPTIONS_API__: false, __VUE_PROD_DEVTOOLS__: false, __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false},
  build: {target: 'es2022', outDir: path.join(root, 'dist/framework', name), emptyOutDir: true,
   lib: {entry: path.join(root, 'framework', entry), name: `StoneFree_${name.replaceAll('-', '_')}`, formats: ['iife'], fileName: () => 'index.js', cssFileName: 'style'},
   minify: true}});
}
