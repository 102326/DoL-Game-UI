import {defineConfig} from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({define:{'process.env.NODE_ENV':JSON.stringify('production'),__VUE_OPTIONS_API__:false,__VUE_PROD_DEVTOOLS__:false,__VUE_PROD_HYDRATION_MISMATCH_DETAILS__:false},plugins:[vue(),tailwindcss()],build:{target:'es2022',lib:{entry:'src/main.ts',name:'DoLGameUIBundle',formats:['iife'],fileName:()=> 'game-ui.js',cssFileName:'game-ui'},minify:true}});
