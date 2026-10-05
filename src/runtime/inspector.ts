import type {OpenSurface, RuntimeDiagnostics} from '../public/ui';

// A manual snapshot, not a live console or another observation/lifecycle layer.
export function openInspector(root: Window, open: OpenSurface, snapshot: () => RuntimeDiagnostics, rescan: () => unknown) {
 const doc = root.document, content = doc.createElement('div'); content.className = 'dgu-inspector';
 const tools = doc.createElement('div'); tools.className = 'dgu-inspector-tools';
 const status = doc.createElement('p'); status.setAttribute('role', 'status');
 const view = doc.createElement('div'); content.append(tools, status, view);
 const element = (tag: string, text: unknown, parent: HTMLElement) => {const node = doc.createElement(tag); node.textContent = String(text ?? 'unknown'); parent.append(node); return node};
 function section(title: string) {const node = doc.createElement('section'); element('h3', title, node); view.append(node); return node}
 function rows(parent: HTMLElement, values: Record<string, unknown>) {const list = doc.createElement('dl'); parent.append(list); for (const [label,value] of Object.entries(values)) {element('dt', label, list); element('dd', typeof value === 'boolean' ? value ? 'Yes' : 'No' : value, list)}}
 function render() {
  try {
   const d = snapshot(); view.replaceChildren();
   rows(section('基础信息'), {UI: d.uiVersion, Runtime: d.runtimeVersion, Game: d.gameVersion, ModLoader: d.loaderVersion,
    档位: d.capabilities.visualTier, 启用: d.capabilities.enabled, Acrylic: d.capabilities.glass, 'Reduced motion': d.capabilities.reducedMotion,
    平台: d.platform, Viewport: `${d.viewport.width} × ${d.viewport.height}`, 'backdrop-filter': d.capabilities.backdropFilter, ':has()': d.capabilities.hasSelector});
   const surfaces = section('Page / Surface'); rows(surfaces, {Page: d.page.name, Root: d.page.root, 来源: d.page.source, Adapter: d.page.adapter ?? '未识别'});
   for (const surface of d.surfaces) element('p', `${surface.kind} · ${surface.source} · ${surface.owner}`, surfaces);
   element('p', '仅列出 Runtime 自有浮层和已知原生 Overlay；未注册的小浮层不作推断。', surfaces);
   const adapters = section('Adapter');
   if (!d.adapters.length) element('p', '没有注册的 Adapter。', adapters);
   for (const adapter of d.adapters) {
    const details = doc.createElement('details'); adapters.append(details);
    element('summary', `${adapter.id} · ${adapter.status} · ${adapter.level}`, details);
    rows(details, {目标: adapter.target, 检测到: adapter.targetDetected, 识别版本: adapter.targetVersion || 'unknown', 支持版本: adapter.supportedVersions.join(', '),
     'Adapter version': adapter.adapterVersion, Fingerprint: adapter.fingerprint, Match: adapter.match, 降级: adapter.degraded,
     命中查询: adapter.mappings.filter(hit => hit.count > 0).length, Fallback: adapter.mappings.filter(hit => hit.fallback).length});
    element('h4', '为什么这样适配？', details);
    element('p', `${adapter.reason}。Style Only 仅标记样式，控件、事件和业务仍由原页面拥有。`, details);
    const mappings = doc.createElement('details'); details.append(mappings); element('summary', '指纹与 Selector Mapping', mappings);
    for (const hit of adapter.mappings) {
     const row = doc.createElement('div'); row.className = 'dgu-inspector-mapping'; mappings.append(row);
     element('strong', hit.role, row); element('code', `primary: ${hit.primary}`, row);
     element('code', `matched: ${hit.matched || 'none'}`, row);
     element('span', `${hit.count} node(s) ${hit.tags.join(', ')} · ${hit.fallback ? 'fallback' : 'primary'} · ${hit.reason || 'matched'}`, row);
    }
    if (adapter.skipped.length) element('p', adapter.skipped.join(' · '), details);
   }
   const log = section('Recent UI Events · 最多 32 条');
   for (const event of d.events) element('p', `${event.time.slice(11,19)} [${event.level}] ${event.source}: ${event.message}`, log);
  } catch {status.textContent = '诊断暂不可用；原页面不受影响。'}
 }
 function action(label: string, run: () => void | Promise<void>) {const button = doc.createElement('button'); button.type = 'button'; button.textContent = label; button.addEventListener('click', () => {Promise.resolve().then(run).catch(() => {status.textContent = '操作不可用，请使用其它诊断操作。'})}); tools.append(button)}
 action('重新扫描', () => {rescan(); render(); status.textContent = '已重新检测注册的 Adapter。'});
 action('复制诊断', async () => {await root.navigator.clipboard.writeText(JSON.stringify(snapshot(), null, 2)); status.textContent = '诊断已复制，不含游戏变量或输入正文。'});
 action('导出 JSON', () => {
  const url = URL.createObjectURL(new Blob([JSON.stringify(snapshot(), null, 2)], {type: 'application/json'}));
  const link = doc.createElement('a'); link.href = url; link.download = 'soft-wet-ui-diagnostics.json';
  try {link.click(); status.textContent = '已请求导出；文件下载由浏览器处理。'} finally {root.setTimeout(() => URL.revokeObjectURL(url), 1000)}
 });
 const handle = open({id: 'SoftWetRuntimeInspector', title: 'Runtime Inspector', content});
 if (handle) render();
 return handle;
}
