import {build} from 'esbuild';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

const root=new URL('../../../',import.meta.url);
const read=(path:string)=>readFile(new URL(path,root),'utf8');
const [host,ui,css,probe]=await Promise.all([read('dist/framework/host/index.js'),
 read('dist/framework/official-ui/index.js'),read('dist/framework/official-ui/style.css'),
 build({entryPoints:[fileURLToPath(new URL('touch-probe.ts',import.meta.url))],bundle:true,format:'iife',target:'es2022',write:false})]);
const scripts=[host,probe.outputFiles[0]!.text,ui].map(js=>'<script>'+js.replace(/<\/script/gi,'<\\/script')+'</script>').join('\n');
const html='<!doctype html><html lang="zh-CN" data-stone-free><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>设置触摸观测</title><style>'+css+'</style><body><main><p>打开界面设置，按住标题空白处拖动，再松手。可用倒计时提前就位。</p><button id="cue">一秒后打开设置</button><div id="menu"></div></main>'+scripts+'</body></html>';
const out=new URL('tests/artifacts/host5-settings-touch/',root);
await mkdir(out,{recursive:true});await writeFile(new URL('index.html',out),html);
