# KRAFT WORK：主窗口与商品交互动效整改

2026-10-18。主窗口双候选、商店原地波纹和右向左详情交接已实现，并完成定向检查。按负责人最新反馈，商品波纹和持续呼吸的整体透明度已降为上一候选的 **50%**。**Stable Visual Gate 仍为 Blocked，等待负责人观看实际效果；没有提交或发布。**

## 本轮实录

三段均为平板原生录屏，输入由 Action / CDP 执行，不称人工物理触控。

| 场景 | 观看内容 | 实录 |
| --- | --- | --- |
| 主窗口 A1 | 同一原生成就入口：中心材质展开、内容显现、关闭与快速重开 | [中心展开](../tests/artifacts/kraft-work-stage-shop-20261018/candidate-v1/window-center-open-close.native.mp4) |
| 主窗口 A2 | 同一原生成就入口：上升渐显、向下退出、关闭与快速重开 | [上升渐显](../tests/artifacts/kraft-work-stage-shop-20261018/candidate-v1/window-rise-open-close.native.mp4) |
| 商品最终候选 | 夏日连衣裙、晚礼服原地波纹与持续流动，详情从右向左交接；波纹强度已减半 | [半强度商品效果](../tests/artifacts/kraft-work-stage-shop-20261018/candidate-v3/shop-ripple-half-and-drawer.native.mp4) |

窗口视频复用 v1：后续 v2 只修正商品选中投影，v3 只降低商品波纹透明度，窗口实现未改。旧商店全强度和失败视频保留，不作为最终视觉候选。

## Delivered

- 普通已知主窗口不再从侧栏或 Hub 入口发射飞框。中心展开使用不参与输入的实心材质展示层；上升方案使用原窗口已有定位和 top/opacity。真实窗口根不增加 transform、filter 或 clip，避免改变 fixed 后代坐标合同。
- 两方案共用同一个成就入口供比较；本地审阅标记 `data-kw-window-study="rise"` 可切换上升方案，未设置时预览中心方案。没有新增公共 API 或用户配置，也没有未经批准随机分配页面动效。关闭立即执行原逻辑，只让非交互材质退场；重开、窗口变化、停用及离场清理旧展示。
- 商店取消商品向详情飞行的图标/材质代理。当前商品原地播放蓝色、蓝紫波纹和低频呼吸；只有一个选中项保留流动。文字、图标和原控件保持可读、可命中。
- 商品详情及操作区的自有内部容器独立右向左进入；实际商品定义、原描述、价格、配色和原购买/试穿控件仍来自游戏。窄屏保留既有 Drawer 返回和关闭。
- 最新微调只将波纹父层呼吸透明度 `.65/.95/.8` 改为 `.325/.475/.4`，从而同时降低点击波纹及持续流动强度；时长、形状、静态选中底色和详情运动不变，没有增加额外开关。
- 快速连续选择时，以原游戏当前定义复核选中投影；无法唯一匹配时清除投影，不猜测、补点或重派原操作。购买报价保护未改。

主要源码：`framework/official-ui/motion.ts`、`src/shop/main.ts`、`src/shop/source.ts`、`src/theme/kraft-work-motion.css`、`src/theme/kraft-work-pages.css`。既有设置、Hub、衣柜与战斗 B 默认关闭的决策保留；Host、协议和 UI API 未改。

## 实际异常与处理

**旧红色压缩块。** 旧代理真实复制了 sundress 图标；64×64 采样有 1,342 个偏红像素 / 1,729 个有效像素，图像 filter 为 none。第一帧父层缩放为 `scale(1.45643, 0.180818)`，30×30 图标实际变为约 69.91×8.68 CSS px。实测支持“原红色图标被非等比压扁”的解释，不将未采到的所有红块都归因于此。新商店没有该代理调用，真机正常、快速和窄屏检查中的飞行代理数均为 0。证据位于 `before/before.json`、`before/old-relay-first-frame.json` 及同目录截图。

**快速选择的真实投影缺陷。** 原版重建列表后、linkify 的 ready 回调绑定前，第二行实际没有 click 处理器；第二次点击没有改变原定义，但旧 UI 会将它当成已选中。v1 的 rapid 步骤最初只核对装饰数量，不能证明商品一致性。补充 `candidate-v1/rapid-before-fix.json` 复现后，v2 改为只读核对原定义，`candidate-v2/rapid-after-fix.json` 证明未执行的第二次选择不再虚假高亮；正常 ready 后的选择仍只调用一次原处理器。此修复不解决原版暂时未绑定的窗口，也不自动重试。

**检查脚本与环境。** 初次入口命中被收起的侧栏挡住，先展开再操作；试穿内部 anchor 的中心不是实际命中节点，核对原 `.div-link` carrier 后检查其命中，没有穿透点击或更改产品逻辑。新 Vite 夹具的首次导入失败，显式使用项目根与动态端口后可运行；更深环境原因 Unknown。未发现足以确认的 Paisley Park 实现缺陷。这些失败记录保留。

## Validated

环境：M367FC / Android 17 / WebView 154.0.8037.58，独立 App `com.vrelnir.dol.lyra.uicompat051213`，DoL 0.5.12.13 / ModLoader 2.101.1，原 Host 0.1.4-experimental。使用本机已有 Paisley Park 6.1.0 White Snake；未安装第二套工具或修改工具仓库。

- 主窗口：两种方式均核对原入口计数、最终位置尺寸、立即关闭、焦点恢复、关闭中重开、装饰清理。相同最终 rect：x181.6/y38/1000×800；真实根 transform/clip 无新增。见 `candidate-v1/window-review.json`。
- 商店：两件商品原处理器各调用一次，原定义、详情及价格 £15/£120 对应；购买和试穿真实 carrier 的中心命中成立。仅为显示可购买原控件，将临时新游戏预算从 500 设为 100000，结束恢复 500；**没有派发购买或试穿**。选择期间库存、穿戴及预算不变。最终半强度实录与收据见 `candidate-v3/shop-review.json`。
- v3 实际运行 CSS 动画关键帧为 `.325/.475/.4/.325`；只有一个波纹，pointer-events 为 none，飞行代理为 0。`candidate-v3/final-state.json` 同时核对已回卧室、侧栏恢复 stowed、偏好与入场一致、装饰为 0、原页面错误为 0。
- 复用 v1 有效生命周期证据：列表滚动、受控 390px Drawer 关闭、动效开关、reduced motion、总开关、resize 和 Passage 离开清理。其原 rapid 步骤不计商品一致性证明，由 v2 前后对照和正常选择证据替代。v3 仅 CSS 强度变化，不重复整套生命周期验收。
- 项目检查通过：`npm run framework:check`；`official-game-motion.cjs`、`shop-source.test.cjs`、`shop-ripple-motion.cjs`、`shop-stone-free.cjs`、`shop-transaction-lifecycle.cjs`、`game-first-motion.cjs`。使用源码驱动夹具，不将旧 dist 测试当作本轮证据。
- 使用现有 `node scripts/build-framework.mjs` 和 `python scripts/package-framework.py --players-only` 构建打包；未使用会清空历史 dist 的普通 build。v3 安装后实际运行 JS/CSS 摘要与包内成员一致，Host 未安装替代构建。

## 本地候选身份

分支 `research/stone-free-3.0-framework`；HEAD 保持 `014f469f4092d246cdcd22098fc9b5a943d029b6`，当前源码和既有未提交工作保留。

[最终本地 UI 包](../tests/artifacts/kraft-work-stage-shop-20261018/candidate-v3/DoLGameUI-3.0.0-stage-shop.mod.zip)：218483 bytes。

| 对象 | SHA-256 |
| --- | --- |
| ZIP | `12f33d0ab1ece0d8d0341cf27fd943d23685e8d85721c256a70fd11115c7ed55` |
| index.js | `825590bc7099d27aaf8a28a96c8511c781c9686e81208ce65bf06af86ff0b6cf` |
| style.css | `e2a1a0f8951273df837feffdb2412b3037498876fc708daee3d9d0f2bc10c0d4` |

v3 的 JS 与 v2 相同，仅 CSS 波纹透明度变化；不能据此宣称 ZIP 字节相同或完成正式发布验收。原任务快照、旧候选、失败收据及构建日志均保留在 `tests/artifacts/kraft-work-stage-shop-20261018/`。

## Not validated / Known limitations

本轮没有物理手机触控、全设备/全 Mod 矩阵、长期性能或新购买/试穿业务验收；390px 是平板 WebView 的受控尺寸。没有运行 GER、清除历史未决 Effect 或读写玩家存档。

共享图标 relay 仍用于既有衣柜场景，本轮只排除商店该路径，不宣称所有其它调用都消除了非等比图标缩放。未知主窗口仍按既有回退，不强行应用新转场。两种主窗口候选的最终选择及观感均待负责人验收。

本轮实现与约定定向检查已完成；**Visual Gate：Blocked**。没有提交、推送、合并、Tag 或发布。
