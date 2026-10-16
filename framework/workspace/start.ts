import {connectConsumer} from '../connect';
import {mountVue} from '../vue';
import WorkspacePanel from './WorkspacePanel.vue';
import './style.css';
export function startWorkspace(alternate = false) {
 return connectConsumer(host => {
  if (!host.getCapabilities?.().views || typeof host.views !== 'function') return () => {};
  const owner = host.register(alternate ? 'AlternateWorkspace' : 'StoneFreeWorkspace');
  try {mountVue(owner, {id: 'workspace', parent: document.body, lifetime: 'persistent', load: () => WorkspacePanel, props: {host, owner, alternate}})}
  catch {owner.dispose(); throw new Error('Workspace failed')}
  return owner.dispose;
 });
}
