import {defineConfig} from 'vite';
import vue from '@vitejs/plugin-vue';
export default defineConfig({plugins:[vue()],define:{'process.env.NODE_ENV':JSON.stringify('production'),__VUE_OPTIONS_API__:false,__VUE_PROD_DEVTOOLS__:false,__VUE_PROD_HYDRATION_MISMATCH_DETAILS__:false},
 build:{target:'es2022',lib:{entry:'src/main.ts',name:'AuthorMod',formats:['iife'],fileName:()=> 'index.js',cssFileName:'style'}}});
