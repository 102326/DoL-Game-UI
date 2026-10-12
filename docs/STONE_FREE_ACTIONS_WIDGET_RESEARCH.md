# Stone Free：剧情动作区与 Widget 首轮研究

日期：2026-10-13。仅针对正式计划 Phase 3 / Phase 4 的首轮可行性；不是功能完成或发布验收。未修改生产源码、原版模板、设备存档或 GER Store。

## 剧情动作区：不使用全局吸底

实际读取两台独立 0.5.12.13 App 的当前 DOM：它们都在 Start，存在 `passage-header`、`passage-content`、`passage-footer`。主内容包含原控件，Footer 中有第三方 ModHub 内容；不能将 Footer 解释成纯动作区。隐藏的第三方按钮即使查询到，也不能算当前可用动作。

读取手机实际已加载的 Bedroom / PassageFooter 模板，而不是假定本地旧版与目标一致：Bedroom 有 35 个 `<<link`，主要在 `passage-content` 中混排；两个 div 是 `passage-content` 与 `append`，没有独立动作组。PassageFooter 包含版本信息、导出提醒、原版浮层、debug 区域及 `next`。这是模板观察，尚未进入卧室逐项证明其运行 DOM。

本地原版 0.5.11.9 的 `game/04-Variables/variables-passageFooter.twee` 也显示，Footer 是多用途区域；仅用它解释结构，不宣称已验证目标游戏流程。

最小浏览器 CSS 实验（390×844）：保留原按钮和监听器，Footer 内 sticky 动作仍在 y=1612、屏幕外。将 Footer 的布局盒改为 display:contents 后，动作才到 y=800，点击仍到原监听器。结论是 sticky 的包含块限制，不是执行原动作的证据。不能为了吸底统一 flatten 第三方 Footer，也不能让散落链接各自 sticky 后互相覆盖。

当前生产战斗已经有独立原操作 Dock，见 `src/combat/main.ts` 的 `syncDock` / `mount` / 多区域处理；本轮不新增竞争 Dock，不扩展其搬家策略到普通剧情。

**执行决定：** 不增加全局 selector、Observer、按钮镜像或新业务状态。普通剧情保持原布局。阶段一可以继续评估具有独立完整动作容器的具体页面；必须验证容器只含该组动作、动态替换/隐藏、文字换行、IME、第三方附加内容以及关闭恢复。没有这样的结构，就降级保留原布局。

阶段二的动作镜像和阶段三真正阅读/动作分离仍未实现；当前没有充分的动作身份、条件和独立结果合同，不能借本次研究直接上线。

## Widget：限定自有展示，暂不建立 SDK

可复用的现有能力：

- 悬浮工具已经拥有稳定 Tool ID 和唯一执行逻辑，见 `src/floating/preferences.ts` / `main.ts`；Widget 不重复设置、Inspector 或移动工具的业务。
- API v1 已有 Surface / Theme / Capabilities，见 `src/public/ui.ts`；可提供主题与可用性信息，不需要为了实验升级 API v2。
- 主显示偏好及悬浮偏好已各有明确所有者。布局只保存 UI 布局，不保存游戏变量、第三方状态或 DOM 镜像。

首个可行原型限定为一个默认关闭的自有工作区，只承载自有快捷工具和显示偏好摘要。添加/移除、网格位置、尺寸和布局保存属于 UI 自己的数据。不得将现有原版侧栏、人物 canvas、商店列表、战斗控件或第三方 Mod DOM 拖入。

布局读取需要有版本、长度/条目上限、已知 Widget ID 白名单、有限网格坐标与尺寸；未知/损坏项跳过，异常布局回到默认。窄屏仅调整实际显示布局，不能覆盖用户保存的宽屏意图。禁用实验后工作区及其监听器清理，游戏页面照常运行。

先复用现成主题、工具执行和挂载清理；不暴露 Vue store、组件实例或私有节点，不注册通用第三方生命周期，不新增全页面 MutationObserver。

以上是研究边界，**尚未实现 Widget 原型**。不把文档里的布局合同当成公开 API，也不声称添加/拖动/调整尺寸/保存已完成。

## 本轮补充 T0 证据

- 平板 M367FC 真实从 1363×876 转至 909×1330，球体完整可见，存储位置未变；系统旋转设置已恢复。
- 手机横屏试验未取得终态，CDP evaluation timeout；恢复后仍为原竖屏、页面与悬浮球正常。原因 Unknown，不登记为 UI 缺陷或通过。保留失败记录，不无证据重复到绿。
- 平板分屏/小窗口及手机横屏继续为 T0 待验证，Widget 功能则属于尚未实现；两者不是同一种状态。

## Paisley Park 反馈候选

问题：横屏过程中的 CDP evaluation timeout。

发生场景：独立手机测试 App；ADB 改变方向，探针读取 WebView 终态。

当前行为：超时，finally 恢复旋转设置；之后新绑定观察成功，进程与 Document identity 不变。

期望行为：现场配方保留阶段信息和恢复证据，区分派发、旋转事实和页面终态。

实际影响：本次手机横屏不计通过，未影响其它已验证的手机竖屏/IME、平板竖屏结果。

建议方向：项目配方可将 before、请求方向、每步时间与 native/display 观察先增量落盘；原因 Unknown，不据此认定 Tools 实现缺陷或要求 Runtime 重构。

全部现场收据及合成实验在忽略目录 `tests/artifacts/stone-free-lab`。无 Full Evidence、Gameplay、存档读写或新工具环境。
