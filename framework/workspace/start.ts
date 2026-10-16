import {connectConsumer} from '../connect';
import {mountVue} from '../vue';
import WorkspacePanel from './WorkspacePanel.vue';
import './style.css';
export function startWorkspace(alternate = false) {
 return connectConsumer(host => {
  const owner = host.register(alternate ? 'AlternateWorkspace' : 'StoneFreeWorkspace');
  try {
   if (!host.getCapabilities().views || typeof host.views !== 'function') {owner.dispose(); return () => {}}
   mountVue(owner, {id: 'workspace', parent: document.body, lifetime: 'persistent', load: () => WorkspacePanel, props: {host, owner, alternate}})
  }
  catch {owner.dispose(); throw new Error('Workspace failed')}
  return owner.dispose;
 });
}
