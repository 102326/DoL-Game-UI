# 独立窗口入口 — E32 研究接线

本入口用于显式消费真实 Soft & Wet modal/drawer 壳。它复用 `src/runtime/surfaces.ts`，不是完整 UI 启动器，不依赖 Host、Legacy manager、active provider、全局 `DoLGameUI` 或真实游戏。4.5 Hub 分支保留；本研究不合并 main、不发布，也不改变产品/Host/兼容包版本。

## 构建与引用

运行 `npm run surfaces:build`。输出位于 `dist/standalone-surfaces/`：

- `index.js`：单个 ESM 命名导出 `createStandaloneSurfaces`，样式随入口提供，没有 CSS 导入时的全页副作用。
- `index.d.ts`、`types/`：由现有 TypeScript 类型生成的声明，可用于严格消费；没有手写另一套 Surface 合同。
- `SOURCE.json`：来源 HEAD/dirty、必要源码摘要和入口输出摘要。接线时应使用已提交、`dirty:false` 的构建，不凭文件名判断身份。
- `LICENSE`：现有项目许可。

Loader 从 UI 项目的实际入口产物导入，或在受支持的构建中引用本项目源码。不要复制窗口实现到 Loader；单独提交和记录来源身份。机器特有绝对路径只放本地交接或对话。

```ts
import {createStandaloneSurfaces} from '<UI artifact>/index.js';

const choice = {create: (doc: Document) => {
  if (!doc.defaultView) throw new Error('Missing target Window');
  return createStandaloneSurfaces(doc.defaultView);
}};
// 先捕获 choice；running.activate 时才调用 create，并由 Native own 持有实例。
```

## 所有权与失败合同

导入模块不创建 DOM、不启动业务或观察器。调用工厂创建实例后，它只持有自己的挂载容器、窄样式和窗口壳；不修改 html/body 的属性、全页主题、偏好或全局 UI。默认玻璃材质使用实际共享样式和局部基础 tokens，普通打开没有额外演出等待；不包含整套设置窗口天气、业务或受力效果。

实例提供 `available()`、`openModal(request)`、`openDrawer(request)`、`dispose()`。request/handle 沿用 `src/public/ui.ts` 的 `SurfaceRequest`/`SurfaceHandle`：内容必须属于目标 Document 且尚未挂载；同实例同 ID 重复打开保留原句柄和控件，不能换种类。构造器及 dialog 能力检查使用目标 Window realm，而非模块导入页。

`close()` 移除壳并将原内容节点脱离 DOM，保留其状态和消费者事件，可再次打开；不销毁、克隆或改写内容。`dispose()` 幂等关闭全部自有壳，移除壳监听、样式和挂载容器；另一个实例继续可用，不销毁共享全局 UI。内容、数据订阅、Blob/下载及 JSON 导出语义始终归 Loader。

校验错误可抛错；原生打开失败清理壳、返还内容、返回 null，并调用 `onClose('failed')`。能力或样式不可用返回 null；已有壳在下次 open/实例 dispose 时按原工厂合同关闭。Loader 应幂等清理，并在入口旁显示失败提示；入口已确定后不自动切换另一实现，不叠加第二个窗口。调用方必须释放拿到的实例，包括 available=false 的实例。

## 已验证与接续

Mac Node26.13.0 / Playwright1.63.0 Chromium153：新入口五组定向检查通过，覆盖导入零 DOM、CSS 逐规则作用域、外部同名元素样式不变、真实关闭/重开与原内容、两实例独立释放、null/throw/样式丢失、壳监听归零、目标 realm 与能力恢复。初次构建压缩去换行导致 Inspector 规则漏隔离的失败已保留；同一断言在修正后通过。

`npm run ci:check` 通过；`node tests/ui-runtime-surfaces.cjs` 复验原窗口的焦点、Esc、原生表单、关闭、失败回退及销毁通过。运行新定向检查：`npm run tooling:build && node tests/standalone-surfaces.cjs`。它已按现有 standard catalog/Expected Lock 登记，不修改 CI 机制或必需门禁。

样式作用域生成依赖共享 CSS 现有命名；测试遍历产物规则，新增未限定规则应明确失败，不能静默放行。独立只读复查未发现阻断问题。

尚未执行本分支完整 Actions、真实 Loader E32 接线、真实 JSON 下载、游戏或设备验收。Loader 侧继续用真实入口完成中性页面的开关/重开、失败可见提示、下载和释放，不把 UI 方的壳合同测试当作该端到端验收。
