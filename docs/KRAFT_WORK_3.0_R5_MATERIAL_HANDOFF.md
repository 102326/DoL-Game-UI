# Kraft Work R5-A：设置材质与 Hub B 交接深化

2026-10-18。按负责人本轮评审实施。实现和限定验证已完成；**Visual Gate 仍为 Blocked，等待负责人验收，不授权发布。**

## 本轮交付

设置保留左侧分类、Orbit 环绕焦点、分类空间转场、彩色控件和真实组件预览。没有重做主题或改变设置业务。

| 层级 | 调整及目的 |
| --- | --- |
| 外壳 | 去掉 `brightness(.7)` 对背景的整体压暗，改用中性炭灰承载与柔和模糊，让环境参与表面。没有降低文字透明度。 |
| 标题与底栏 | 使用连续的微弱反射与边缘，减少各自成为独立面板的感觉。 |
| 中部控制区 | 减少叠加黑底，保留稳定文字和控件对比，不对全部区域统一降透明度。 |
| 右侧预览 | 分开处理阅读示例、预览舞台和浮起卡片；移除重复内层模糊，用表面差异、细边缘及浅阴影区分前后。 |
| 分类导航 | 减轻静态选中背景；保留原 SVG 环绕、迁移和中断处理。 |

Hub 继续深化 B：透视轨迹保留，装饰代理较早淡出，真实窗口和正文较早显现。原窗口根节点仍不添加 transform/filter；业务表单没有克隆，原入口没有被替换。A 的实现和历史视频保留。

B 仍通过非持久评审标记 `data-kw-hub-study="spatial"` 体验，不是最终定稿或玩家默认开关。检查结束已移除标记；正常未设置路径仍为 R4。

## 同一背景下的材质对照

以下三张在同一个 Bedroom 文档中采集，中间没有游戏动作或 Passage 切换。成就仅打开查看，没有解锁或导入操作。

| 材料 | 截图 |
| --- | --- |
| 成就页参考锚点 | [01 成就](../tests/artifacts/kraft-work-round5-refinement-20261018/01-feats-anchor.native.png) |
| 调整前设置 | [02 调整前](../tests/artifacts/kraft-work-round5-refinement-20261018/02-settings-before.native.png) |
| 同一场景 CSS 预览 | [03 调整后](../tests/artifacts/kraft-work-round5-refinement-20261018/03-settings-after.native.png) |

03 使用从新源码提取的十条设置样式作临时预览；实际 Passage 节点及显示偏好未变。它证明同背景的材质变化，不代替整包安装证明。随后安装新包并重载，临时样式随旧文档释放；[04 整包安装后的设置](../tests/artifacts/kraft-work-round5-refinement-20261018/04-settings-installed.native.png)与[05 实际材质预览](../tests/artifacts/kraft-work-round5-refinement-20261018/05-settings-material.native.png)来自新包，确认没有残留预览补丁。

Codex 观察：外壳、控制区和预览之间的区别更清楚，原先接近实黑的叠层有所减少。是否达到负责人要求的轻盈与舒适程度，留给视觉验收。

## Android 动态材料

- [设置材质、分类、开关、滑块及真实预览录屏](../tests/artifacts/kraft-work-round5-refinement-20261018/settings-material.native.mp4)
- [Hub B 展开、属性进入、关闭与焦点恢复录屏](../tests/artifacts/kraft-work-round5-refinement-20261018/spatial.native.mp4)
- [上一轮 A/B 对照与边界](KRAFT_WORK_3.0_R5_HUB_STUDIES.md)

B 视频保留两次完整进入与返回。实际内容更早参与，代理不再维持此前的高不透明度直至后段；这减轻了空壳与正文分离的实现原因，但仍是视觉近似，并非真实共享元素。采样帧仅覆盖视频前段且有截断；新旧录屏的输入起点不同，不作同帧或同时间点的像素比较。

第一下 Hub 展开使用工具注入的 Android 点击，事件记录 `isTrusted=true`；后续为经命中检查的 CDP 控件操作。设置滑块使用 Paisley Park 标准 `web-input`。这些不是人工手指触控证明。

## 验证结果

现场：M367FC 平板、Android 17、独立测试 App `com.vrelnir.dol.lyra.uicompat051213`；DoL 0.5.12.13、ModLoader 2.101.1、WebView Chrome 154.0.8037.58；Host 0.1.4-experimental 保持原冻结包。Paisley Park 使用已安装的 6.1.0 White Snake，没有重建工具环境。

通过的本地检查：`npm run framework:check`、`node tests/official-game-motion.cjs`、`node tests/settings-orbit.cjs`、`node tests/settings-workspace.cjs`。后者经典入口使用既有制品，未声称重新构建稳定版。构建使用 `node scripts/build-framework.mjs`，打包使用 `python scripts/package-framework.py --players-only`；未运行会清理整个 dist 的通用 build。

| 场景 | 实际结果与收据 |
| --- | --- |
| 设置打开、分类、开关、滑块、关闭 | 字号 110% 与实际示例字号对应，随后恢复 100%；玻璃关闭后 backdrop 为 none；预览浮起仍是同一真实节点；关闭后 Orbit 暂停。[设置收据](../tests/artifacts/kraft-work-round5-refinement-20261018/settings-review-result.json) |
| 快速分类切换 | 最终只保留一个当前分类，无残留交互区。 |
| Hub→属性→关闭，两次 | 每次仅调用原属性入口一次；打开期间原关闭节点身份不变、可命中，根 transform/filter 均为 none；关闭后焦点返回主球，装饰节点清零。[Hub 收据](../tests/artifacts/kraft-work-round5-refinement-20261018/android-review-result.json) |
| 连续开关、中途关闭动效、reduced motion | 最多一个交接代理；关闭动效或 reduced motion 后无交接代理；结束清理正确。[边界收据](../tests/artifacts/kraft-work-round5-refinement-20261018/boundaries-result.json) |
| 受控 390×844 / 844×390 | 设置无水平溢出、关闭可点；Hub 菜单在视口内、工具和关闭命中。属于平板 WebView 受控视口，不是物理手机验收。 |

检查后恢复进入时的 UI 偏好、Hub 配置及位置；`combatFocused=false`，评审标记清除，临时装饰数为 0。未保存、读取、删除存档，未购买、穿戴或执行战斗回合。重载后通过原版开始与卧室入口准备隔离测试场景，未写私人长期存档。

执行中保留两个探针问题：一次使用不存在的状态栏 selector 导致观察脚本报错，改为实际 footer；一次设置入口在视口外，命中保护拒绝点击，先滚动再操作即通过。它们没有证明 UI 遮挡或 Paisley Park 实现缺陷。失败材料未清理。

## 性能采样范围

[收尾采样](../tests/artifacts/kraft-work-round5-refinement-20261018/perf-closeout/performance-series.json)为关闭窗口后的三次顺序观察，实际起点约 0 / 1787 / 3537ms，不是动画全过程测量。App PSS 524922→524699→524663KB；选定 WebView heap 约 209.3→209.5→209.8MB、listener 均 392，Documents 均 1。只报告观测值，不作泄漏或无泄漏推断；App PSS 也不等于单个 WebView 的全部内存。

`gfxinfo.sampledFrames=0`，中位数和 p95 为空，**没有可用真实呈现帧率结论**。边界测试的即时 listener 曾从 392 到 409，后续收尾为 392；未将短期计数变化认定为泄漏。未调用 Perfetto、bugreport 或 Full Evidence，因为本轮没有需要这些手段回答的新性能故障。长期稳定性和此前内存归因仍为 Unknown。

## 源码与制品身份

分支 `research/stone-free-3.0-framework`，HEAD `014f469f4092d246cdcd22098fc9b5a943d029b6`，本轮改动仍未提交。保留已有未提交工作，本轮不整理历史提交。

本轮修改为设置材质、B 动画交接、相关断言与本文档；未改 Host/API、强制战斗 B 或扩展商店／衣柜／战斗范围。

| 对象 | 身份 |
| --- | --- |
| 安装的 UI 候选 | `DoLGameUI-3.0.0-kraft-work-r5-refined.mod.zip`，211661 字节 |
| ZIP SHA-256 | `5777ce766c9e676f87724d0fa12f42008de278c38cf485b23a64224411329b87` |
| 实际加载 index.js SHA-256 | `6f34cda675d28a769009cab0d97d21871219839a1dc41dae38bd52e94fd358b9` |
| 实际加载 style.css SHA-256 | `031dc7f00df17c703c0fe4e870b6dcd260a47b77619c7fe26642085a8b47258e` |

制品、原始录屏、探针和收据保留于 `tests/artifacts/kraft-work-round5-refinement-20261018/`，不作为公开 Release 附件。构建生成的 Host 没有安装；测试版继续使用原冻结 Host。稳定 2.7、公开 RC 与其它工作区均未覆盖；未提交、推送、合并、Tag 或发布。

## 未验证与已知限制

- 未进行物理手机触控、额外设备或第三方组合、长期性能和业务全矩阵验收；不作为本轮新增开发事项。
- B 仅为评审候选，结束时不默认启用；A 保留，最终选择待负责人确认。
- 动画期间内容仍使用 opacity 交叉过渡，无法保证所有采样瞬间与静止时相同对比；没有为追求共享元素而移动原窗口业务树。
- 技术检查通过不等于视觉通过。**Visual Gate：Blocked，等待负责人验收。**
