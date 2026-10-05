# Surface API 独立示例 0.1.1

用于本轮 UI 2.2.0 的 Modal / Drawer 接入验证，不是日常游戏功能，也不包含在 UI 主包中。使用 Core 的公共 API 创建独立示例控件，不查询或修改游戏变量、存档或第三方业务。

加载后在控制台调用 `SoftWetSurfaceDemo.openModal()` 或 `SoftWetSurfaceDemo.openDrawer()`。返回关闭句柄；关闭按钮、Esc 和遮罩点击均可关闭，`getLastClose()` 可查询本例最后的关闭原因。关闭主题 / API 不可用时返回 null，示例不强制打开其它界面。没有常驻入口、自动弹窗或后台监听。

打包：`python scripts/package-adapter.py examples/ui-surfaces`。源码为 `surface-demo.ts`，仅以 `import type` 引用公共契约；打包时生成 `dist/scripts/surface-demo.js`，Manifest 的 JS 入口名不变。临时检查应加载生成的 JS 与原 CSS，不直接加载 TS，结束删除 `window.SoftWetSurfaceDemo`；模组自身不注册第三方 Adapter。
