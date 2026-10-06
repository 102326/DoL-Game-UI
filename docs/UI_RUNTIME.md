# UI Runtime：2.2.2 接入说明（API v1）

当前 UI 版本为 **2.2.2 / Crazy Diamond**，公共 API 与诊断仍使用版本 1。接入前先确认 `window.DoLGameUI?.ui?.apiVersion === 1`，并检查需要的方法是否存在；较早的 2.1.0 包没有此接口。如果不支持，就继续使用 Mod 自己的界面。

从 UI 2.2.2 起，Style Adapter 与衣柜槽位扩展的 `target.versions` 支持精确版本（例如 `1.3.0`）或最低数字版本（例如 `>=1.3.0`、`>=1.1.1.2`）。精确匹配仍按原字符串检查；最低版本通过 `modUtils.getSemVerTools()` 比较。缺少该 API 或比较失败时不匹配，不使用自制比较规则。页面结构与槽位数据检查仍需通过。使用最低版本写法的兼容包应声明 UI `>=2.2.2`；旧 Core 不支持此写法。

## 已实现的最小契约

2.2（Crazy Diamond）的 TypeScript 类型定义位于 `src/public/ui.ts`。运行 `npm run types` 可生成 `dist/types/ui.d.ts`，主包也附带 `types/ui.d.ts`。复制到项目后，可用 `import type {UiApi, StyleAdapter} from './ui'` 辅助编写代码。

类型文件帮助编辑器检查代码，不会安装或启动 UI 功能。实际调用时，仍要确认当前 Soft & Wet 支持所需接口。API v1、诊断格式 v1 与已有调用方式保持兼容。

| 接口 | 返回 / 范围 |
| --- | --- |
| `ui.getTheme()` | 冻结的 `{id, enabled, tokens}`；tokens 为现有 CSS 变量名，不另存主题状态 |
| `ui.getVisualTier()` | 用户选择的 `Smooth / Balanced / Fancy`；关闭主题后偏好仍保留 |
| `ui.getCapabilities()` | 冻结的启用状态、档位、blur 支持、reduced motion、实际有效 glass / motion、mobile / tablet / desktop 布局与 Style Adapter 可用性 |
| `ui.registerStyleAdapter(spec)` | 注册一个明确目标的 Style Only 契约；返回冻结的 `refresh / destroy / getDiagnostics` 句柄 |
| `ui.getAdapterDiagnostics()` | 所有已注册适配的最新只读诊断快照，不返回 DOM 或业务值 |
| `ui.getDiagnostics()` | 冻结的 Runtime / Adapter / Surface 快照与最多 32 条 UI 事件；适合复制和导出 |
| `ui.rescan()` | 手动重新检测已注册 Adapter，返回当前诊断；不扫描或接管未知页面 |
| `ui.openInspector()` | 打开只读检查工具；复用同一个浮层，主题关闭或原生能力不足时返回 null |
| `ui.openModal(request)` / `ui.openDrawer(request)` | 请求独立二级 / 三级浮层，返回冻结的 `close() / isOpen()` 句柄；不可用时返回 null |

主题查询不公开 store；角色样式沿用现有 Eyes token。布局档位使用宽度 600 / 899px 分界，表示当前排版空间，不表示硬件设备类型。能力查询不修改显示偏好或第三方决策。

## Surface 请求 API

这是版本 1 契约的增量能力，`apiVersion` 保持 1。调用前检查 `getCapabilities().surfaceApiVersion === 1`、`surfaces` 和具体方法是否存在；较早的 2.1.0 没有浮层接口。`surfaces` 表示当前主题启用、原生 dialog 和自动清理能力可用，不表示第三方页面已被接管。

```js
const ui = window.DoLGameUI?.ui;
const content = document.createElement('div');
content.textContent = '由调用方提供的内容';
const surface = ui?.apiVersion === 1 && typeof ui.getCapabilities === 'function' && ui.getCapabilities().surfaces &&
 typeof ui.openDrawer === 'function'
 ? ui.openDrawer({id: 'MyMod-details', title: '详情', content,
    onClose(reason) { /* 清理自己的 UI 引用；不由 Core 重试业务 */ }})
 : null;
if (!surface) { /* 使用 Mod 自己的原界面 */ }
// 主动关闭：surface?.close(); 查询：surface?.isOpen();
```

- `id` 使用调用方前缀，字母开头、字母 / 数字 / 连字符、最长 64。不同 Mod 不共用同一个 id。同 id、同类型重复打开返回现有句柄，不替换内容或重置输入；同 id 改成另一类型会拒绝。
- `title` 为非空短文本，最长 160，使用 textContent，不解析 HTML。
- `content` 必须是本 document 新建、没有父节点的 HTMLElement。拒绝连接中的原节点、其它容器中的节点及跨 document 节点；不搬原 Mod 窗口，不复制其内容，不托管其状态。正常启用时无效请求抛 TypeError，由调用方处理。
- Core 只创建自己的 dialog / 标题 / 关闭按钮 / 正文外壳。内容的值、click / input / change / submit 及回调仍由调用方拥有，不代理或重写。
- 关闭按钮、Esc、从遮罩开始并结束的点击、句柄 close、关闭主题、Core 销毁都能撤销。只有上层原生 dialog 收到 Esc；从内容拖到遮罩不会意外关闭。
- `onClose` 最多调用一次，原因是 `api / button / escape / backdrop / disabled / destroyed / failed / native`。回调异常只作 UI 警告，不重试，不影响其它浮层或 Adapter。关闭时移除 Core 外壳、将 content 留为完整的脱离节点；值与事件继续保留，可由调用方复用。
- 原生 dialog 提供背景 inert、键盘导航和焦点恢复。原打开控件仍存在时恢复焦点；不存在时不重建该节点。Edge 的 Tab 循环可短暂进入浏览器界面，Core 不额外拦截浏览器快捷键。
- 关闭主题后关闭已有请求浮层，后续请求返回 null。dialog / 观察能力缺失、document body 未就绪或 Core 已销毁也返回 null。showModal 失败会清理外壳并返回 null；不造第二套模拟弹窗或静默丢弃调用方原页面。
- Smooth / 关玻璃为 Solid，Balanced / Fancy 使用存档 Acrylic 方向和弱方向高光。新 API 浮层使用原生 `dialog::backdrop` 做单层 blur，避免 Android WebView 在 dialog 本身模糊失效；正文不加 blur，reduced motion 停用入场动画。这不修改原版或第三方的弹窗实现。

独立示例在 `examples/ui-surfaces/`，不自动弹窗、不连接游戏状态、存档或云服务，也不编入主包。可单独打包或临时加载，用于验证作者主动接入路线。

## Style Adapter 描述

当前不提供布局、代理、DOM 移动或 Vue 接管执行器。一个描述包含：

```js
const handle = DoLGameUI.ui.registerStyleAdapter({
 id: 'ExampleSkin', version: '0.1.0',
 target: {name: 'ExampleMod', versions: ['1.0.0']},
 scope: ['#example-panel'],
 attributes: ['data-example-control'],
 fingerprint: {
  id: 'example-ui-v1',
  safe: [['#example-toolbar'], ['#example-content']],
  required: [['#example-setting', '[data-example-control="setting"]']]
 },
 roles: [
  {role: 'page-shell', selectors: [':scope'], safe: true},
  {role: 'toolbar', selectors: ['#example-toolbar'], safe: true},
  {role: 'compact-row', selectors: ['.example-row'], all: true}
 ]
});
// 模组自己的 UI 撤销时：
handle.destroy();
```

- `target` 只读取加载器已加载 Mod 的版本信息，不加载 Mod、不解析依赖或管理其生命周期。
- `scope` 为有序候选；找到唯一根节点后，指纹和角色都只在此根节点内查询。`:scope` 指根节点本身。
- `safe / required` 中每组候选依次查找，所有分组须满足；重复目标视为歧义，不跳到其它候选猜测。版本满足精确或最低要求，且所有指纹匹配时才启用 full。
- 部分匹配须先通过全部 safe 指纹，且只标记 `safe: true` 的角色。不满足版本要求时为 `version-unverified`，不会因结构相似自动声明兼容。关键 safe 指纹不匹配时不加任何标记。
- 角色候选默认要求唯一，列表可明确 `all: true`。未命中的角色跳过，未知节点保留；不改原 id / name / class / value / hidden 或事件。
- `attributes` 只声明目标结构需要额外观察的属性；默认观察 id / class / hidden / data-overlay。禁止监听本 Runtime 的 `data-dgu-*` 属性以避免反馈循环。
- 可选 `when()` 仅查询自己的 UI 启用条件。不要在识别函数中执行业务、写游戏状态或触发原控件。
- 输入校验失败或重复 id 会同步拒绝注册，未产生部分接管；调用方捕获错误后保留原 UI。

## 样式作用范围与撤销

Core 只写可撤销的 `data-dgu-adapter`、`data-dgu-adapter-match` 和 `data-dgu-role`。已被其它适配拥有的根节点不覆盖；既有角色属性不覆盖。没有新增、包装、搬动或复制原节点。

目标专属 CSS 必须限定 `[data-dgu-adapter="自己的ID"][data-dgu-adapter-match="full"]`，避免降级时仍残留依赖旧结构的规则。partial 只使用 Core 的安静外壳/工具栏角色样式；关闭主题时不生效。CSS 应尊重原 hidden、布局和业务语义。

监听只递归观察声明的 Surface，发现新根节点使用 body 或已知父级的浅层 childList；主题属性单独观察。不会全局扫描或递归接管第三方页面。目标在陌生深层位置出现而无法发现时，可在目标自己的 UI 打开时调用 `handle.refresh()`，不扩大成全页监听。

`destroy()` 移除自己的监听和标记，可重复调用；若第三方后来改了同一属性，撤销不覆盖其新值。Core 销毁会撤销全部 Style Adapter；关闭总开关清理标记但保留注册，以便重新启用。Core 重建后派发 `dol-ui-runtime-ready`，可选包据此重新注册；这是 UI 可用通知，不是通用 Mod 生命周期。

## 诊断与现有兼容包

Adapter 诊断包括目标/适配版本、目标是否检测到、支持版本、指纹标识、full / partial / none、当前 Style Only / Disabled、降级状态、成功角色与跳过原因。`mappings` 每条包含 `role / primary / matched / fallback / count / reason / tags`，其中 `fingerprint:safe`、`fingerprint:required` 是指纹探测；`count` 为查询命中数量，`tags` 只含元素标签名，不返回 DOM 节点、文本或控件值。未打开的页面是 idle，不代表兼容失败；未知版本仅允许已验证 safe 角色，不能据此声明支持该版本。

`getAdapterDiagnostics()` 保留注册描述中的静态 selector；用于分享的 `getDiagnostics()` 会进一步移除 selector 的属性值。Runtime 事件最多 32 条，只记录状态变化与新浮层开关；稳定扫描不反复写相同事件。不采集 console、网络、全局日志或异常堆栈。状态只保留在当前 UI Runtime 内存，销毁后重建；没有遥测或持久日志。

## Runtime Inspector 与诊断导出

入口在 **界面设置 → 开发检查 → Runtime Inspector**，默认收起；需启用 Soft & Wet 与原生 dialog 支持。也可用：

```js
const ui = window.DoLGameUI?.ui;
if (ui?.apiVersion === 1 && ui.getCapabilities?.().inspector) {
 const handle = ui.openInspector();
 // handle?.close(); // 沿用 Surface 句柄
}
const diagnostics = ui?.getDiagnostics?.(); // 序列化即可分享，不暴露内部可变状态
```

工具按需读取快照，不轮询。基础信息包含 UI 版本、Runtime API 版本、Game / ModLoader 静态版本、档位、实际 glass、reduced motion、平台类别、视口、backdrop-filter 与 `:has()` 支持。Game 版本优先使用 `StartConfig.version`；信息缺失时显示 unknown，不读游戏变量来猜测。

Page 使用原生 passage 名称与 `#passages` 根；Surface 只列 Runtime 自有浮层和已知 `#customOverlay`。未注册 Dropdown / Context Menu 不作推断。Adapter 可展开“为什么这样适配”和指纹 / Mapping，显示 `structure-drift / version-unverified / safe-fingerprint-mismatch / ambiguous-selector / missing-selector / adapter-error` 等原因。不设数值置信度，也不宣称自动识别全部 Mod。

提供 **重新扫描、复制诊断、导出 JSON**。复制依赖浏览器 Clipboard 权限；失败只提示，不借用原版复制/存档功能。JSON 下载由浏览器处理，Android 容器可能不提供下载能力。关闭 Inspector 不修改显示偏好。

导出只含上述结构信息，不读取 `State.variables`、角色数据、存档、用户输入、DOM 正文、凭据、URL 或本机路径。Surface 不导出标题和调用方内容；异常只使用固定原因码。Adapter 描述也不得把业务值或秘密放进名称、版本、指纹或 selector。没有任意 JS Console、任意 selector 执行器、删除 DOM 或修改业务的操作；临时 Adapter 开关和 Debug Overlay 未在首版实现。

MapleBirchSoftWet **0.2.3** 与 ModHubSoftWet **0.2.3** 使用此契约，目标仍分别为 MapleBirch **5.2.3** 与 ModHub **1.3.0**。它们检查版本、查询 / 注册方法和 Style Adapter 能力；缺失时保留原 UI，不要求 Surface 能力。可查询各包的 `getDiagnostics()`。它们只改样式，不改云端请求、安装、排序、删除、安全模式或市场操作；Core 不内置这两个 Mod 的指纹，也不会用 openModal / openDrawer 替换目标原窗口。

通用扩展入口、Proxy 和 Deep Adapter 执行器仍未实现。

## 衣柜槽位扩展 API v1（UI 2.2.1 起）

`DoLGameUI.wardrobe` 提供 `apiVersion: 1` 与 `registerSlotMapping({id, target: {name, versions}, slots: {over_upper: '外套上装'}})`，返回可重复调用 `destroy()` 的句柄。类型见 `types/wardrobe.d.ts`。目标版本满足声明要求且原库存、定义与穿戴对象存在时才加入现有 Vue 分类。不覆盖原生分类，不接受状态对象、事件执行器或任意回调，不存储游戏数据。它只扩展语义模型；所有操作继续使用原衣柜的业务链。注销会刷新当前分类，Core 销毁会撤销全部映射。


```ts
const wardrobe = window.DoLGameUI?.wardrobe;
if (wardrobe?.apiVersion === 1 && typeof wardrobe.registerSlotMapping === 'function') {
  const handle = wardrobe.registerSlotMapping({
    id: 'ReOverfitsSoftWet',
    target: {name: 'ReOverfits', versions: ['4.1.1']},
    slots: {over_head: '外层头饰', over_upper: '外套上装', over_lower: '外套下装'},
  });
  // Adapter 退出时撤销自己注册的映射。
  handle.destroy();
}
```

入口独立于 `DoLGameUI.ui`，不改变 UI API v1 或诊断 Schema v1。公开类型源为 `src/public/wardrobe.ts`，主包附带 `types/wardrobe.d.ts`。重复 id、重叠槽位、原核心分类覆盖及非法字段会抛出错误；调用方应捕获注册失败并保留原界面。

注册/撤销只改变 UI 分类并取消尚未执行的整理确认计划，进行中的原业务操作按已有流程结束。Core 销毁后旧句柄失效，Adapter 应向新的 API 实例重新注册。

只支持可复用原衣柜数据与操作链的原生已有槽位；其它服装 Mod 可选择接入，不自动接管任意新业务结构，也不提供自定义业务回调、状态镜像或通用 Proxy / Deep Adapter 执行器。
