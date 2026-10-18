# Kraft Work 3.0 R5-A：Hub 动效候选对比

2026-10-18。R5-A 已完成两种本地候选、构建与平板代表性检查。**R5 整体尚未收口，Visual Gate 仍为 Blocked。** 按任务书 R5-B 的先后关系，先交付样板供负责人选择，收到明确反馈后再深化商店、衣柜和战斗；本轮没有把候选效果直接推广到这些页面。

保留 R4 以及前三轮的可靠成果，不改 Host、公共协议、API v1、原游戏业务或稳定 2.7。没有提交、推送、Tag 或发布。

## 两种设计及评审材料

两段视频在同一平板、同一个新开临时游戏的卧室中录制，均展示两次完整的「展开工具→属性→关闭→主球恢复」。黑灰材质与背景相同，区别来自形态和空间运动。

| 候选 | 主要运动 | Android 视频 |
| --- | --- | --- |
| A · 形态展开 | 工具外壳以主球为变形原点，从压缩形态舒展；来源胶囊先横向延伸、再展开高度，交接到属性窗口；关闭时收回主球 | [material.native.mp4，约 20 秒](../tests/artifacts/kraft-work-round5-20261018/material.native.mp4) |
| B · 空间交接 | 工具组带透视倾转和分组释放；来源平面沿斜向路径倾转、放大并归正；窗口导航与正文分层进入，关闭时折回主球 | [spatial.native.mp4，约 20 秒](../tests/artifacts/kraft-work-round5-20261018/spatial.native.mp4) |

代表性静态材料：[A 工具展开](../tests/artifacts/kraft-work-round5-20261018/material-tools.native.png)、[B 窗口稳定后](../tests/artifacts/kraft-work-round5-20261018/spatial-window-0.native.png)。静态截图不能代替两段动态材料。

使用 Paisley Park 标准 `animation-frames` 分别抽取前 20 帧、间隔 250ms，检查展开及进场的代表性帧。两个 manifest 均标记 `truncated:true`，只覆盖视频开头约 5 秒，不表示完整视频逐帧审查；`frameAtSeconds` 是理论采样序号，不能当作原始 PTS。

### Codex 的初步判断

我倾向继续 B：倾转和归正提供了更清楚的方向，工具释放、窗口进入和关闭回返之间更容易区分。A 更连贯柔和，但压缩外壳在展开中会短暂裁掉工具文字，视觉上也更接近一层舒展的遮罩。

两者仍有共同限制：运动中的主平面是无业务内容的装饰代理，原文字留在实际窗口中；代理与正文交接时可能有「空壳先到、内容随后显现」的感觉。它们不是完整的共享内容转场。若负责人认可空间方向，下一步优先打磨这段交接，而不是继续增加光晕或延长时长。

这些是设计判断与后续建议，不是已确认缺陷，也不代表负责人批准 B。可以选择 A、B，或保留某一方案的一部分后继续调整。进入、关闭与停靠的原有产品行为不因选择而改写。

## 实现与启用边界

本轮只修改 [官方动效模块](../framework/official-ui/motion.ts)、[官方局部样式](../src/theme/kraft-work-motion.css)及[定向测试](../tests/official-game-motion.cjs)。沿用现有 `sourceMotion()`、CSS transition 和 Web Animations API；未建立新的动画 Runtime，也未修改共享 Host 组件。

候选由临时本地属性 `html[data-kw-hub-study="material"|"spatial"]` 选择，未添加玩家设置、存储键或公共接口。评审结束已移除该标记；重载也不会保留。正常未标记路径继续使用 R4。临时标记用于 Hub 展开研究，新的窗口形变仅对来源为官方 Hub 属性工具、目标为已适配属性窗口的链路启用。

- 原动作同步执行，动效不取消事件、不补发点击、不读写游戏变量。
- 新 `.kw-hub-transfer` 只有装饰材质，不克隆商品、角色字段、表单、控件或事件。它为 `aria-hidden`、`pointer-events:none`，不能成为业务状态来源。
- 原窗口根节点保持 `transform:none`、`filter:none`。窗口根和原正文只作透明度变化；较强位移、透视和形变放在装饰平面与自有导航上，避免改变第三方 fixed 后代坐标。
- 同一时刻至多保留一个形变代理。关闭、重开、场景切换、尺寸变化、主开关关闭和卸载会取消旧展示；动画结束或取消时移除代理。
- 关闭入口仍执行原关闭逻辑，实际窗口不会为等待回返动画继续占用业务状态。焦点返回主球，不自动重新展开工具菜单。
- 关闭动画或系统 reduced motion 时，代理不创建、空间动画不播放，原窗口仍可打开与关闭。
- 现有正文白名单、商店报价／颜色、衣柜原 widget 与叠穿、战斗原 radio／target／Continue 均未改动。战斗 B 保持 `false`。

## 实际验证

设备为 M367FC 平板（`0509B830099C3540`），独立测试 App `com.vrelnir.dol.lyra.uicompat051213`；Android 17，WebView Chrome `154.0.8037.58`，DoL `0.5.12.13`、ModLoader `2.101.1`、冻结 Host `0.1.4-experimental`。复用现有社区 Mod 环境，没有安装重建 Host 或复制私人存档。

两段录像第一次主球点击均使用 Android 原生注入，记录 `isTrusted=true`；随后为经命中检查的 CDP 控制。**不属于实际人手触控验收。** 未购买、穿戴、执行战斗回合、读写存档或处理历史 GER Unknown。安装候选重载后，通过原 Start／Orphanage Intro／Bedroom 入口准备临时游戏。

本地检查通过：

```text
npm run framework:check
node tests/official-game-motion.cjs
node tests/framework-motion-gate.cjs
node scripts/build-framework.mjs
python scripts/package-framework.py --players-only
git diff --check
```

新增测试证明两个方案具有不同的关键帧结构，装饰不抢占命中，原窗口根不变换，快速重开只留一个代理，关闭动画与 reduced motion 清理代理；原事件、未知内容、主开关和卸载检查继续通过。没有重复执行未改变的 R4 商店、衣柜、战斗回归。

平板记录为 [android-review-result.json](../tests/artifacts/kraft-work-round5-20261018/android-review-result.json) 与 [boundaries-result.json](../tests/artifacts/kraft-work-round5-20261018/boundaries-result.json)：

- A、B 各两次完整打开关闭，每次原属性入口计数只增加 1；实际关闭按钮在进场期间可命中，且同一次显示期间节点身份保持。
- 关闭过程中重开，不累计代理；关闭后背景、轮廓和形变代理均为 0，焦点回到主球。
- 390×844、844×390 受控 WebView 视口下，工具组最终位于视口内，属性工具可命中；展开过程抽查主球未被工具遮住。
- 动效播放中关闭动画会移除代理；reduced motion 下不生成代理；两种设置下仍可操作窗口。
- 结束后恢复原视口，移除评审标记，偏好、Floating 配置及原始位置字符串与入场一致；回到 Bedroom，原 `$combat=0`，战斗 B 关闭。

这不是物理手机横竖屏或 IME 验收，也没有穷举所有贴边位置、全部第三方窗口或极端缩放。沿用原有布局与拖动能力，不把它们全部重验作为本轮完成条件。

### 保留的失败与归属

首次真机脚本把打开前的关闭按钮引用作为基准，打开后引用不一致，断言失败。这个跨打开过程的身份稳定合同并未事先成立；本轮动效源码不创建或替换关闭按钮，但没有完整追踪原版／第三方的控件创建链，具体创建归属仍为 Unknown。回执 [android-review-native-close-assumption.json](../tests/artifacts/kraft-work-round5-20261018/android-review-native-close-assumption.json) 和 `material-incomplete-first-attempt.native.mp4` 保留。原脚本失败后仍让窗口打开，所以最终检查有 1 个背景层；这是未关闭窗口的合法背景，不据此判定动画泄漏。

修正的是测试时点及失败后的原生关闭清理，未修改产品代码以规避断言。接续复验复用了已安装候选，没有重新构建或重复派发未决游戏业务操作。

窄视口脚本首次还因在页面表达式中使用了未传入的 `width` 而产生 `ReferenceError`，记录在 `boundaries-harness-reference-error.json`。改为实际 `innerWidth/innerHeight` 后继续，属于本地检查脚本错误；没有证据表明是 UI、WebView 或 Paisley Park 缺陷。

## 性能观察与工具反馈

边界测试约 39 秒前后，CDP JS heap used 为 209,777,248 → 209,223,376 字节，Nodes 为 83,142 → 80,292，监听均为 378。原窗口重建、视口变化和 GC 时机混合在其中，不能据此推导每个方案成本或证明没有泄漏。

随后标准 [perf-series 三次采样](../tests/artifacts/kraft-work-round5-20261018/perf-closeout/performance-series.json)：

| 样本 | App PSS（KiB） | JS heap used（字节） | Nodes | 监听 |
| --- | ---: | ---: | ---: | ---: |
| 1 | 568796 | 209107708 | 80467 | 378 |
| 2 | 570989 | 209342800 | 80712 | 378 |
| 3 | 570773 | 209549704 | 80950 | 378 |

热状态 severity 均为 0。`gfxinfo` 有效 sampledFrames 均为 0，不能报告呈现 FPS 或 p95 帧时间；本轮也没有用 rAF 代替它。没有进行持续数小时、低端设备或真实显示帧时调查。R4 未归因的内存／DOM 变化继续为 **Unknown**，本轮 PSS 与 R4 的差异也不能直接归因于新增动画。

继续使用本机 Paisley Park `6.1.0`，未重装或创建第二套环境。标准 Action 用于原生输入／重载，标准 `animation-frames` 用于有限抽帧，标准 `perf-series` 用于末端观察；直接 CDP 用于受控项目标记、一次原入口计数、实际命中和私有制品核对，ADB 用于原生录像。没有开 GER Goal、清理 Store、使用 Perfetto 或 Full Evidence。

本轮可复用经验是：DOM 引用的比较时点应在原页面正常生成节点之后；只看有 rect 不足以判定控件可用，仍需考虑 `inert`、祖先隐藏和实际命中。两项失败均有明确的本地脚本原因，未发现需修改 Paisley Park 实现的证据。没有自动向其它对话发送新反馈或扩展工具研发任务。

## 制品与阶段状态

工作区分支 `research/stone-free-3.0-framework`，HEAD `014f469f4092d246cdcd22098fc9b5a943d029b6`。前三轮、R4 和本轮改动仍未提交；保留既有工作区与历史制品，不能把该 HEAD 称为 R5 冻结源码。

实际安装的本地候选 [DoLGameUI-3.0.0-kraft-work-r5a.mod.zip](../tests/artifacts/kraft-work-round5-20261018/DoLGameUI-3.0.0-kraft-work-r5a.mod.zip)，211560 字节：

```text
ZIP       747b01ace302fb91100a9a69b27fd8ad6ca2ed0130811a98ef674489b38f6946
index.js  43770488c4f8cc83c34da91d26c0e1ca6fa0ea55318eaf8ec72d374becaefa5f
style.css 9ca005f118203d57fdc035011e028e6752cf15b0ddd82e7fae5997477c561504
```

成员 SHA 已从实际加载 ZIP 读取，与构建候选对应。Mod 技术身份仍是 `DoLGameUI 3.0.0`，不是新增公开版本或 Stable 声明。

- **Delivered**：R5-A 两种可交互候选、两段真实 Android 视频、代表性截图、定向验证和本报告。
- **Validated**：本地构建／定向测试、授权平板的真实原入口与关闭、命中、中断、受控窄视口、关闭动画及 reduced motion、偏好保持和临时节点清理。
- **Not validated**：物理手机、实际人手、长期性能、全部贴边位置和 Mod 组合；本轮没有重新验证购买、叠穿或战斗业务。
- **Known limitations**：代理不包含原业务内容，可能出现短暂空壳感；A 展开中会裁掉部分工具文字；尚无真实呈现帧时间结论。具体视觉取舍需负责人观看视频决定。
- **下一阶段**：R5-B／C 未开始，等待负责人对样板的明确反馈；它们不是已完成实现，也不归入单纯未覆盖项。Visual Gate 继续 Blocked，本轮不发布。
