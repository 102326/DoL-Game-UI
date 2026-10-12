import {createApp} from 'vue';
// Same selected-style order as shop/combat imports then src/main theme imports.
import '../src/shop/style.css';
import '../src/ui/utilities.css';
import '../src/theme/midnight.css';
import '../src/theme/controls.css';
import '../src/tokens.css';
import './lab.css';
import App from './App.vue';
createApp(App).mount('#app');
