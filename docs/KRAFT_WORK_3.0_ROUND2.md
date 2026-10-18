# Kraft Work 3.0：第二轮材质与动态表现

2026-10-18。本轮实现与代表性验证已完成，**Visual Gate 继续 Blocked，待负责人验收**。未提交、推送或发布；公开 RC、Stable 2.7 和 Host 合同未改变。

工作区 `experiments/stone-free-framework-30`，分支 `research/stone-free-3.0-framework`，起点 `014f469f4092d246cdcd22098fc9b5a943d029b6`。沿用入场已有改动，没有重置历史成果。技术版本仍为本地 `3.0.0`。

## Delivered

| 区域 | 本轮变化 | 保留的边界 |
| --- | --- | --- |
| 属性 | 顶部、页签、导航保持原样；正文底层从 .78 调至 .46，指标内容仍有稳定承载 | 原描述、图标、数值、进度条及回退 |
| 社交 | 正文底层减重，卡片保留 .88 稳定承载；间隙 18px，窄屏 12px；细边缘与浅投影分离卡片 | 原角色节点、语义色、第三方内容、分组与回退；不增加逐卡模糊 |
| 商店 | 标题和主体同一黑灰外壳；分类、商品、详情与 Hub 分层协调，选中使用低亮青绿 | 原商品、报价、颜色、购买与试穿；blur 仍放装饰伪元素，避免改变 fixed 控件坐标 |
| 设置 | 更深、更透的黑灰外壳；深轨道搭配柔和绿色开关、淡紫滑块；单个 SVG 环绕焦点在分类间迁移 | 实际偏好回调、原控件命中区；无新运行库或公共 API |
| 动态 | 焦点迁移 580ms、边缘流动周期 7s；内容 620ms 空间进入，带位移、深度、旋转、模糊与轻回弹 | 快速操作取消旧动画；旧内容 inert/aria-hidden；关闭、离场和减少动态效果时清理或静态降级 |

相关源码：`SettingsNavigation.vue`、`SettingsPanel.vue`、`settings-workspace.css`、`dark-acrylic.css`、`kraft-work-pages.css`。页面新增部分以 CSS 换皮为主，未重建属性或社交数据。

## Android 画面与录屏

本地资料位于 `tests/artifacts/kraft-work-round2-20261018/`，不作为发行附件。截图是原生 Android 截图；视频是 Android screenrecord，操作由 CDP 控制。原生 tap/swipe 是 Android 注入输入，不冒充人手触控验收。

| 资料 | 内容 |
| --- | --- |
| [属性](../tests/artifacts/kraft-work-round2-20261018/10-attributes-after.native.png) | 已认可顶部与更新正文，基础属性位置 |
| [社交之前](../tests/artifacts/kraft-work-round2-20261018/09-social-before.native.png) / [之后](../tests/artifacts/kraft-work-round2-20261018/12-social-character-after.native.png) | 同一临时角色与卧室背景；卡片分层和留白变化 |
| [商店入口](../tests/artifacts/kraft-work-round2-20261018/13-shop-entry-after.native.png) | 标题与正文协调 |
| [商店旧材质配方](../tests/artifacts/kraft-work-round2-20261018/15-shop-before-material-recipe.native.png) / [新配方](../tests/artifacts/kraft-work-round2-20261018/16-shop-after-material-recipe.native.png) | 同一商品、布局与现场，临时回放旧材质；不是完整旧版 UI 对照 |
| [商店 Hub](../tests/artifacts/kraft-work-round2-20261018/17-shop-hub-after.native.png) | 外壳与商品页面的材质关系 |
| [设置旧材质配方](../tests/artifacts/kraft-work-round2-20261018/02-before-material-recipe.native.png) / [新配方](../tests/artifacts/kraft-work-round2-20261018/03-after-material-recipe.native.png) | 同场景、同布局，只比较材质；临时探针已移除 |
| [最终设置](../tests/artifacts/kraft-work-round2-20261018/19-settings-final-pages.native.png) | 恢复字体 100% 和原偏好后的当前设置 |
| [环绕焦点与内容转场录屏](../tests/artifacts/kraft-work-round2-20261018/orbit-and-content.native.mp4) | 20 秒，焦点迁移、连续切换、对象浮起归位与重开 |
| [最新页面与设置录屏](../tests/artifacts/kraft-work-round2-20261018/pages-and-settings.native.mp4) | 约 24 秒，商店 Hub、社交滚动和设置空间转场 |

## Validated

真实设备为 M367FC／0509B830099C3540，Android 17，WebView Chrome 154.0.8037.58；授权独立 App `com.vrelnir.dol.lyra.uicompat051213`，DoL 0.5.12.13，ModLoader 2.101.1，现有 Host 0.1.4-experimental。未替换 Host。截图中 MapleBirch 为 5.4.3；CE 从 rebuild.28 变为 rebuild.29 的外部变化未归因到本 UI。

最新本地 UI ZIP：`DoLGameUI-3.0.0-kraft-work-r2-pages.mod.zip`，206543 bytes，SHA-256 `522907a77e0fac2ac9d543b7980e4a18a55ce4ddb50937dd7699bb6b368173ce`。实际 Loader 成员摘要与构建一致：

- JS：`08e49434632fbd910545e59ec52aadc9cb07cea88e846e98eafe14b82754e057`
- CSS：`85324d088210652a818f42af4da5a04bbab00cfaed278266ad37a4f5d3e7019e`

最后扩展只增加页面 CSS，JS 与此前设置动态验证制品完全相同。复用本轮此前设置快速切换、关闭重开、原生注入点击与滑块、无动画和 reduced motion 的结果；最新包另拍真实页面与设置连续录屏。最终偏好与入场逐项一致，战斗 B 仍默认关闭。

项目 typecheck、framework:check、现有 Framework 构建及玩家打包通过。定向检查通过：`settings-orbit.cjs`、`settings-workspace.cjs`、`settings-official-init.cjs`、`kraft-work-materials.cjs`、`social.test.cjs`、`characteristics.test.cjs`、`stone-free-player-shells.cjs`、`shop-stone-free.cjs`。

检查涵盖：焦点几何对齐、指针不被装饰层拦截、动画中断、关闭后不继续流动、卸载清理、原节点/事件及 hidden 保留、第三方样式不被接管、商店装饰层与原固定控件边界。实际 Android 验证了 31 个属性条目、17 张社交卡、12 件商品的代表性展示，商店操作区滚动后命中正确，受控 390×844 下无横向溢出、Drawer 可关闭、Hub 按既有规则退让。

商店使用原生 Clothing Shop Passage 做临时场景准备，不作为路线 Gameplay 验收。临时游戏仅有 £5，因此当前商品购买不可用；只检查可用操作的显示和命中，没有购买、试穿、战斗回合、存读档或云端操作。

## 性能观察与限制

- 设置原生注入点击：确认 `isTrusted:true`，该次点击到下一个 rAF 约 8.2ms。此数不是全链路输入延迟。
- 短 rAF 采样：静止 264 个间隔，中位 8.3ms、P95 8.4ms、最大 8.5ms；分类切换 237 个间隔，中位 8.3ms、P95 8.4ms、最大 50ms，6 个大于 33ms。它们是回调间隔，不是实际呈现帧或 FPS。
- 标准 perf-series 采集成功，但 gfxinfo sampledFrames 为 0，不能据此证明显示帧时间。8 次重开后，关闭窗口时自有动画为 0、遗留离场节点为 0；单个持久导航焦点仍存在，符合设置窗口生命周期。
- App PSS 在不同采样阶段约 395MB 与 855MB，后续序列降至约 829MB；后者 JS heap 约 210→208MB，监听器 349 保持不变。跨阶段包含录屏、视口和页面变化，没有隔离 GC 与各 Mod，增长原因为 **Unknown**，既不判定泄漏，也不宣称无资源风险。
- 没有 Perfetto、heap dump、长时间内存或低端设备测试。当前不因未隔离的整 App 数值删减已认可动效。若日常重复开关出现持续增长或可感知卡顿，再围绕相同页面、相同输入做专项归因。

## 失败记录与工具反馈

Paisley Park 使用已安装的 6.1.0 White Snake，复用 execution-context、Action、CDP、perf-series 和 animation-frames；精确样式、节点和状态断言由已审阅的局部 CDP 表达式完成。原生截图/录屏及 range 拖动使用现有 ADB，没有新装环境或重型工具。

入场一度发生页面未就绪、后续对话框已关闭的前置条件失败；分别增加明确就绪与可见性检查后继续，原失败记录保留。临时命令漏传 DOL_ADB 出现 ENOENT，属于本地调用环境。商店批量 selector 被 Action 拒绝，因要求唯一目标；修为明确单个商品，不作为 UI 缺陷。另一项断言错误地要求原游戏切换商品后仍保留旧列表节点，并假定预算足够，已记录为测试前置条件错误；后续验证改为实际原场景、已知预算与换皮前后节点身份，不重写业务以获得通过。

animation-frames 取了原 20 秒视频前 3.3 秒的 12 帧，标记 truncated；不能把采集完成解释成整段已覆盖。最新录屏另抽查 3／9／17 秒画面。没有发现足以归为 Paisley Park 实现缺陷的证据，不修改工具仓库。

## Not validated / 下一步

未覆盖物理手机、更多 WebView、所有社区组合、长期性能及全部交易/战斗场景。它们不等同于本轮材质未实现。下一步先由负责人观看四页画面与录屏，确认层次、透感和动效；有具体反馈再局部调整。**本轮不自行批准 Visual Gate，也不进入正式发布。**
