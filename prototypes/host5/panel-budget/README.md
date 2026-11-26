# #41 第一刀 · 同一条面板时间线，两个独立使用方

研究起点为 `12081fb`。研究分支单独引入正式标签 `v4.5.2`（`002d1b4`）的 ModHub 布局修复和中性几何反例。产品版本字段仍沿用研究起点。#42 侧栏保持独立。

## Windows · 共用表面动效与材质

从 `6552b8e` 快进接续。正常 Host 启动器提供两个可选入口，设置页和独立检查器分别拥有自己的 DOM、可见状态、焦点和释放时机。

- `host.panelEffects.track(frames, enter, exit)` 创建局部轨道。用 `to(layer, shown)` 请求方向，`cancel()` 中断，`release()` 结束所有权。获得播放机会时返回本次请求的完成通知，`await playback.finished` 得到 `finished` 或 `cancelled`。中途反向立即结清旧请求，同一原生播放器继续走向新目标。没有播放机会时返回 `undefined`，调用方直接到达终态。外部代码无需操纵浏览器的 Animation 对象。
- `host.layerPresets.surface` 负责选择 Acrylic 或静态材质。设置页复用自身的玻璃绘制层，独立检查器在自己的挂载下使用装饰层；缺能力、禁用玻璃或绘制失败时沿用可读底色。[材质用法及回退](material/README.md)
- 组合示例内，云层位移和浓度由环境所有者持有两个名额，前景反馈保有独立的一个名额。前景之间的原有争用策略保留。隐藏文档、退出页面、减少动态或显式释放仍能结束播放。布局 resize 交给 CSS 重新计算与尺寸有关的百分比，Host 播放器保留时间线。

**真实布局视口反例。** 独立 Chrome 157.0.8103.79 从 900 × 820 改到 700 × 820 CSS px。两次都得到舞台宽 780 → 644，信号条宽 288 → 288。夹具先将两条在播轨道定位到指定位置并以 0.01 倍速观察，以便在真实 resize 与绘制回调后仍能检查同一播放阶段。

| 源码 | 云层轨道 | 前景信号轨道 |
| --- | --- | --- |
| 冻结基线 `6552b8e` | 原对象进入 idle，新对象从约 3.6 ms 开始 | 原对象进入 idle，70 ms 处的轨道消失 |
| 本轮 | 原对象继续，4000 → 4001.60 ms | 原对象继续，70 → 71.49 ms |

基线同时存在 Host 的全体取消与组合页的全体刷新。集成路径去掉了两处 resize 处理。CSS 已能在本场景更新相对几何，无需增加 observer。历史独立对照仍沿用原实现。

**两位消费者。** 独立面板在没有主 UI 时完成退场中反向、拖动、减少动态和卸载。设置控制器的连续反向、回焦和名额争用通过。新增反例发现旧开窗请求会把随后关窗成功误报为自己完成，现已分别验证两次请求的结果。另用正常构建的 Host 和主 UI 加载完整设置表单，在中性页面实际点击「材质 → 玻璃模糊」并复原；计算滤镜从 `blur(24px) saturate(0.78)` 切到 `none` 再恢复，关闭后焦点回到入口，独立面板的材质节点仍在。研究预览按钮也改为控制器就绪后才接受点击。

**复验**（仓库根目录，使用独立浏览器）：

```powershell
$env:HOST5_BROWSER = 'chrome'
node prototypes/host5/composition/viewport-check.mts
node prototypes/host5/panel-budget/check.mts
node prototypes/host5/panel-budget/material/check.mts --channel=chrome
npm run framework:build
node prototypes/host5/panel-budget/full-form.mts
```

旧行为可用 `viewport-check.mts --baseline` 核对，需先将基线的 `framework/`、`prototypes/host5/composition/` 及 `src/ui/` 按原相对路径放在忽略目录 `tests/artifacts/viewport-freeze-6552b8e/`。验证只据轨道身份、进度、几何和可操作状态作判断。Android 已连接，已核实的隔离应用里没有可登记输入事件的现成中性页面；本轮未触发软键盘或 Home，因此没有两类 resize、同页返回或文档重建的设备结论。

## 初次 Mac 实验

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
