import {mountVue, vueView} from '../vue';
import {connectConsumer} from '../connect';
import ComparisonPanel from './ComparisonPanel.vue';
import ComparisonInline from './ComparisonInline.vue';
import './panel.css';

// Independent consumer: no imports from the provider or the official UI.
export const dispose = connectConsumer(host => {
 const owner = host.register('StatusComparison');
 if (host.getCapabilities?.().views) owner.provideView({id: 'comparison', title: '状态对照', setup: vueView({load: () => ComparisonInline, props: {host}})});
 try {mountVue(owner, {id: 'comparison', parent: document.body, lifetime: 'persistent', load: () => ComparisonPanel, props: {host, owner}})}
 catch {owner.dispose(); throw new Error('Comparison panel failed')}
 return owner.dispose;
});
