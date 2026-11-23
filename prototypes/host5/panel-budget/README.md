# #41 第一刀 · 同一条面板时间线，两个独立使用方

研究起点为 `12081fb`。研究分支单独引入正式标签 `v4.5.2`（`002d1b4`）的 ModHub 布局修复和中性几何反例。产品版本字段仍沿用研究起点。#42 侧栏保持独立。

## 建议继续的部分

Host 通过可选的 `panelEffects.track(frames, enter, exit)` 接受一条局部视觉轨道。轨道提供转向、取消和释放。现有设置控制器仍决定显示偏好、模态窗口、关闭终点、焦点和卸载。设置用原有 100/80 ms 的透明度变化；中途反向时沿同一个 WAAPI 对象更新方向。旧 Host 继续走既有 fadeWindow。其余窗口仍有各自的接入合同。

独立检查器只导入 Host 类型，走已有 participant.mount/onCleanup。其局部样式位于 shadow root，拖动仅写检查器自身的位置，淡入仅写透明度。两个消费者共享 Host 实例的播放名额。实验上限设为一条，在争用时先入者继续，后来者立即呈现目标状态。无排队、常驻帧循环或全局布局样式。资源释放后另一个消费者可继续使用。减少动态、页面隐藏、尺寸变化和 Host 退出可回收正在播放的轨道。

保留 WAAPI 做这一刀。CSS 可呈现短淡入，但现有 WAAPI 已可从中点反向；此次无需纹理、预渲染缓存或实时粒子。天气的 Canvas/SVG 与素材租约已有独立对照，仍在上级研究记录中。当前只有同一类短时特效，一个名额无法代表整机 GPU 预算。下一刀适合让天气层与交互层争用，比较前台预留或优先级与先到先得，重点观察长期占用是否饿死后来者。

## 中性复验

使用锁定依赖、Node 26.13.0 和 macOS Chromium 153.0.8010.12。在仓库根目录运行：

```sh
npm ci
node prototypes/host5/panel-budget/check.mts
npm run tooling:build && node tests/overlay-manager-layout.cjs
node_modules/.bin/tsc -p prototypes/host5/tsconfig.json
npm run typecheck && npm run framework:check
node prototypes/host5/panel-budget/preview.mts
```

预览命令打印本机地址，提供旧版、共享与独立三个入口。新旧两页加载真实设置控制器，表单内容替换成中性关闭按钮。独立页只加载 Host 与检查器。打开、关闭、重开、焦点恢复、连续反向、拖动、同时播放、偏好降级、卸载以及预览入口均有浏览器检查。320 至 899 CSS px 的 ModHub 局部布局另与原生边界逐档对照，1440 px 检查桌面上限。

[本机样本](mac-result.json)记录相同 390 × 820 视口、首次打开后执行 12 次中途转向的结果。两种方式各读取 24 个帧间隔。旧路径创建 13 个 Animation 对象，共享路径创建 1 个；两种方式的连续画面、焦点和关闭终点均通过。两组超过 50 ms 的间隔均为零。处理时间是一次脚本批次采样，堆读数是未强制 GC 的末尾快照，均不足以证明整机提速或内存节省。尺寸读数对应中性表单。压缩构建计数为 esbuild minify 后、传输压缩前的 JS 字节。

Windows 待验触摸/键盘混合输入、缩放与原生焦点；Android WebView 待验指针捕获丢失、后台切换及低端设备帧时。下一轮可加长会话，对照界面反复挂载后的堆趋势。当前没有游戏本体、Windows、Android 或发布结论。
