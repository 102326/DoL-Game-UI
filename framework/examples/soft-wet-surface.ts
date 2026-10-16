import {connectConsumer} from '../connect';
import type {SurfaceHandle, UiApi} from '../../src/public/ui';
import './panel.css';

type OptionalUi = Window & {DoLGameUI?: {ui?: UiApi}};
/** Layout policy example: same source, existing official public Surface API v1. */
export const dispose = connectConsumer(host => {
 const owner = host.register('SoftWetSurface');
 owner.mount({id: 'surface-entry', parent: document.body, lifetime: 'persistent', setup(context) {
  const entry = document.createElement('section'); entry.className = 'sf-example sf-official';
  const button = document.createElement('button'); button.type = 'button'; button.textContent = 'Soft & Wet 状态';
  const message = document.createElement('span'); message.className = 'sf-message'; message.setAttribute('role', 'status');
  entry.append(button, message); context.element.append(entry);
  let surface: Readonly<SurfaceHandle> | null = null;
  function close() {surface?.close(); surface = null}
  button.onclick = async () => {
   if (surface?.isOpen()) return;
   const ui = (window as OptionalUi).DoLGameUI?.ui;
   if (ui?.apiVersion !== 1 || typeof ui.openDrawer !== 'function' || !ui.getCapabilities?.().surfaces) {message.textContent = '官方 Surface 未启用；独立视图仍可使用。'; return}
   const claim = owner.claim('modal', 'foreground');
   if (!claim) {message.textContent = '另一个参与者正在显示详情。'; return}
   const binding = context.binding(), source = host.sources('dol.status.experimental')[0];
   const result = source ? await source.read(binding) : null;
   if (!context.isCurrent() || !binding.isCurrent() || !claim.isCurrent()) {claim.release(); return}
   const content = document.createElement('div');
   if (result?.ok && result.value && typeof result.value === 'object' && !Array.isArray(result.value)) {
    for (const [field, value] of Object.entries(result.value)) {
     const row = document.createElement('p'); row.textContent = `${({pain:'疼痛',stress:'压力',tiredness:'疲劳'} as Record<string,string>)[field] ?? field}：${value ?? '未知'}`; content.append(row);
    }
   } else content.textContent = '公开状态来源当前不可用。';
   try {surface = ui.openDrawer({id: 'StoneFreeStatus', title: '公开状态来源', content, onClose: () => {claim.release(); surface = null}})}
   catch {message.textContent = '当前 Surface 不可用。'}
   if (!surface) claim.release();
  };
  context.onScene(close); context.onCleanup(() => {button.onclick = null; close()});
 }});
 return owner.dispose;
});
