import {defineConfig} from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'node:path';
import {copyFileSync} from 'node:fs';
const output=path.resolve('tests/artifacts/settings-refraction-v1/dist');
export default defineConfig({root:path.resolve('prototypes/settings-refraction-v1'),plugins:[vue(),{name:'settings-study-notices',apply:'build',closeBundle(){copyFileSync('LICENSE',path.join(output,'LICENSE'));copyFileSync('prototypes/golden-spin-b/THIRD_PARTY_NOTICES.md',path.join(output,'THIRD_PARTY_NOTICES.md'))}}],base:'./',esbuild:{legalComments:'inline'},
 define:{__VUE_OPTIONS_API__:false,__VUE_PROD_DEVTOOLS__:false},
 server:{host:'127.0.0.1',port:5185,strictPort:true,fs:{allow:[path.resolve('.')]}},
 build:{outDir:output,emptyOutDir:true,target:'es2022',rollupOptions:{input:{compare:path.resolve('prototypes/settings-refraction-v1/index.html'),scene:path.resolve('prototypes/settings-refraction-v1/scene.html')}}}});
