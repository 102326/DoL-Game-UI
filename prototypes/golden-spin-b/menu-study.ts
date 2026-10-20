// Historical menu-centric study: owner rejected this visual direction.
import {createApp} from 'vue';
import App from './App.vue';
import '../../framework/motion-hub/style.css';
import '../../src/theme/dark-acrylic.css';
import '../../src/theme/kraft-work-motion.css';
import './motion.css';
import './lab.css';
for(const attribute of ['data-stone-free','data-dol-midnight','data-dgu-visualGlass','data-dgu-visualMotion'])document.documentElement.setAttribute(attribute,'');
createApp(App).mount('#app');
