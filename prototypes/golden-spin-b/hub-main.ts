import {createApp} from 'vue';
import App from './HubApp.vue';
import '../../framework/motion-hub/style.css';
import '../../src/theme/dark-acrylic.css';
import '../../src/theme/kraft-work-motion.css';
import './lab.css';
import './hub.css';
for(const attribute of ['data-stone-free','data-dol-midnight','data-dgu-visualGlass','data-dgu-visualMotion'])document.documentElement.setAttribute(attribute,'');
createApp(App).mount('#app');
