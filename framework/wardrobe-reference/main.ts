import {connectConsumer} from '../connect';
import {mountVue} from '../vue';
import ReferenceSpace from './ReferenceSpace.vue';
import './style.css';

const disconnect = connectConsumer(host => {
 if (!host.getCapabilities().views) return () => {};
 const owner = host.register('StoneFreeWardrobeReference');
 try {
  if (!owner.claim('region', 'wardrobe-reference')) {owner.dispose(); return () => {}}
  mountVue(owner, {id: 'reference-space', parent: document.body, lifetime: 'persistent', load: () => ReferenceSpace, props: {host, owner}});
 } catch (error) {owner.dispose(); throw error}
 return owner.dispose;
});

export function dispose() {disconnect()}
