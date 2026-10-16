import {mountVue} from '../vue';
import {connectConsumer} from '../connect';
import ComparisonPanel from './ComparisonPanel.vue';
import './panel.css';

// Independent consumer: no imports from the provider or the official UI.
connectConsumer(host => {
 const owner = host.register('StatusComparison');
 try {mountVue(owner, {id: 'comparison', parent: document.body, lifetime: 'persistent', load: () => ComparisonPanel, props: {host, owner}})}
 catch {owner.dispose(); throw new Error('Comparison panel failed')}
 return owner.dispose;
});
