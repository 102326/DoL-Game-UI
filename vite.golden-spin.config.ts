import {defineConfig} from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'node:path';
export default defineConfig({root:path.resolve('prototypes/golden-spin-b'),plugins:[vue()],base:'./',
 define:{__VUE_OPTIONS_API__:false,__VUE_PROD_DEVTOOLS__:false},
 server:{host:'127.0.0.1',port:5181,strictPort:true,fs:{allow:[path.resolve('.')]}},
 build:{outDir:path.resolve('tests/artifacts/golden-spin-b/dist'),emptyOutDir:true,target:'es2022',rollupOptions:{input:{sphere:path.resolve('prototypes/golden-spin-b/index.html'),hub:path.resolve('prototypes/golden-spin-b/hub.html')}}}});
