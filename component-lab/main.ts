import {createApp} from 'vue';
// Same selected-style order as shop/combat imports then src/main theme imports.
import '../src/floating/style.css';
import '../src/shop/style.css';
import '../src/theme/midnight.css';
import '../src/theme/controls.css';
import '../src/theme/layout.css';
import '../src/tokens.css';
import '../src/theme/visual.css';
import '../src/theme/eyes.css';
import '../src/theme/mobile.css';
import './lab.css';
import App from './App.vue';
createApp(App).mount('#app');
