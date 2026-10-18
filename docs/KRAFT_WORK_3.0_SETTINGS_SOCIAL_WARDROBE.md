# KRAFT WORK：设置输入、社交焦点与衣柜动效

2026-10-18。本轮三个指定区域的实现及代表性检查已完成，候选已安装到平板独立测试版。**Stable Visual Gate 继续 Blocked，等待负责人实际验收；没有提交、推送或发布。**

后续负责人反馈的设置滚动、衣柜后景输入及材质问题，由[设置 P0 整改](KRAFT_WORK_3.0_SETTINGS_P0.md)接续。下文保留本轮已取得的证据；其中冒泡和 CDP 触摸检查不能替代后续 Android 原生滑动验证。

## 实录与截图

| 区域 | 本轮证据 |
| --- | --- |
| 设置 | [真实命中、拖动与布局切换录屏](../tests/artifacts/kraft-work-settings-social-wardrobe-20261018/candidate-v2/settings-real-hit-and-material.native.mp4) · [上下布局](../tests/artifacts/kraft-work-settings-social-wardrobe-20261018/candidate-v2/settings-horizontal.native.png) · [左右布局](../tests/artifacts/kraft-work-settings-social-wardrobe-20261018/candidate-v2/settings-vertical.native.png) |
| 社交 | [环绕焦点与连续迁移录屏](../tests/artifacts/kraft-work-settings-social-wardrobe-20261018/candidate-v3/social-orbit-migration.native.mp4) · [稳定状态及材质对照](../tests/artifacts/kraft-work-settings-social-wardrobe-20261018/candidate-v3/social-final.native.png) |
| 衣柜 | [原穿戴、叠穿与侧向预览录屏](../tests/artifacts/kraft-work-settings-social-wardrobe-20261018/candidate-v3/wardrobe-ripple-native-wear-and-preview.native.mp4) · [真实穿戴后](../tests/artifacts/kraft-work-settings-social-wardrobe-20261018/candidate-v3/wardrobe-wear-settled.native.png) |

均为 Android 原生录屏/截图。设置使用 CDP 生成的触摸路径，社交和衣柜使用 Action 的原节点点击；不称人工物理触控。v2 设置实录可复用：v3 只增加衣柜条目被原操作移除后的短时按压材质，其它实现未改，CSS 摘要相同。有限离线抽帧只辅助审阅，不作为精确原始帧时刻或性能结论。

## Delivered

### 设置输入与材质

本轮现场证实两项问题：

1. 设置控件事件会继续冒泡到 document。旧版真实控件点击的文档观察计数为 1；模态命中本身不会阻止全局委托事件。现在在设置 dialog 边界隔离点击、输入、变更、指针及键盘冒泡，不阻止内部控件的默认行为或回调。
2. 入场 100ms 后按实时矩形点击关闭，旧候选有一次未关闭，随后侧栏入口被仍打开的模态正确阻挡。旧入场动画会移动、缩放和裁切真实 dialog，输入期间命中区域持续移动。现在改为非交互材质层展开，真实窗口只渐显，根节点不再移动或裁切；关闭也不移动控件。新候选同路径能够关闭、重开。

第一项为已证实的事件边界缺陷；第二项为已观察的早点击失败及有源码依据的命中稳定性修正。**本轮没有录到设置输入实际改变背后游戏业务的完整现象，其全部触发条件仍为 Unknown，不把两项修正宣称为所有“穿透”的唯一根因。**

真实输入复验覆盖：打开中关闭、重新打开、阅读/材质/入口/页面切换、开关、滑块拖动、上下/左右布局、预览响应、关闭后原衣柜入口。舒适阅读 true→false，字号 100→115，预览实际字号变为 17.25px；设置操作阶段文档冒泡计数及落到设置外部的 pointerdown 均为 0，没有残留 inert section。见 `candidate-v2/settings-review.json`。

双布局共用同一壳体：玻璃基底由 `--kw-shell` 的 rgba(36,38,42,.68) 调为设置局部 rgba(25,27,31,.48)，保持黑灰，模糊仍为 24px；未降低整个窗口 opacity。标题、导航、内容及状态栏继续使用已有分层，内层文字与控件不一起变透。上面的设置双布局截图和社交截图供负责人对照，不用透明度数值代替视觉批准。关闭玻璃仍使用既有稳定实底。

### 社交动态焦点

从设置导航提取私有 `src/ui/OrbitFocus.vue`，设置和社交复用同一 SVG 轮廓、流动、位置迁移及清理实现。保留社交按钮基本外观和原 `go()` 分组滚动；原导航拒绝时不改变选中。未推广到所有按钮或其它页面，未新增公共 API。

Android 连续切换五次后，焦点与当前按钮 x/y 差为 0、宽差约 0.4px；轮廓 pointer-events 为 none，流动偏移实际变化。减少动态效果时活动动画为 0。见 `candidate-v3/social-review.json`、`final-state.json`。

### 衣柜列表与角色预览

- 复用已认可的半强度蓝色/蓝紫波纹及呼吸样式，条目原地响应，不再从衣物发射飞块。
- 原穿戴会立即移除或重建库存行。此时只保留原位置的非交互按压材质，约 1.25 秒内消退，不复制文字、控件或衣物业务；行失效不保留假条目。仍存在的当前条目可持续流动，切分类、筛选、分页或进入整理时清除旧选择。
- 原角色画布更新后，自有画布从右向左进入；没有新增“先查看再穿戴”模式或第二套详情业务。完成反馈仍以主装备及 `wornStacking` 的真实变化为前提，预览代次/中断保护保留。

Android 一次校服衬衫穿戴：原 wear-link 调用数 1，库存 2→1，`wornStacking.upper` 包含 schoolshirt，主层仍为 sundress，余额保持 500。角色画布 SHA 由 `88e8f8a6…` 变为 `533106c5…`；不是仅凭播放动画判断成功。检查时原地按压层 1、飞块 0，预览存在横向位移。之后快速切分类、另一件原穿戴后离场，装饰归零、原页面错误为 0。见 `candidate-v3/wardrobe-review.json`。

## Validated

环境：M367FC，Android 17 / WebView 154.0.8037.58，独立 App `com.vrelnir.dol.lyra.uicompat051213`；DoL 0.5.12.13 / ModLoader 2.101.1，原 Host 0.1.4-experimental。复用已安装的 Paisley Park 6.1.0 White Snake，没有重新安装工具或替换 Host。

- 源码类型检查 `npm run framework:check`、现有 Framework 构建与 players-only 打包通过。未运行会清空历史 dist 的普通 build。
- `settings-input-boundary.cjs`：真实鼠标/键盘路径、控件值及预览、双布局/分类中断、文档事件隔离、关闭后背景入口恢复。
- `settings-orbit.cjs`：共享焦点、快速迁移、窄/横屏尺寸、关闭暂停、reduced/no-motion、释放。
- 新 `selection-motion.cjs`：社交原 go/拒绝路径、移动轮廓对齐；衣柜单条波纹、回调次数、分类/reduced/unmount 清理。该夹具不作为原穿戴证明。
- `wardrobe-native-link.cjs`、`wardrobe-source-m2.test.cjs`、`wardrobe-mode-cleanup.cjs`：原入口调用、来源新鲜度和局部清理。
- `social.test.cjs` 中源码驱动的 Framework 挂载/释放检查通过；其中其它历史 dist 路径不作为新 Orbit 的证明。
- Android 三区域检查见上述收据。受控 390px 平板 WebView 中衣柜宽约 310.4px，无横向溢出；原地展示归零。最终回卧室，偏好与入场逐项一致，布局恢复 vertical、侧栏保持展开，设置已关闭、装饰及原页面错误为 0。没有写入或读取玩家存档，实际穿戴只发生在本轮临时新游戏。

## 失败记录与工具使用

- 新组件夹具首次直接加载 Vue esm-bundler，浏览器无法解析裸依赖；改用无查询参数的优化文件又产生两个 Vue 实例。最终通过 Vite 虚拟入口统一依赖来源。归属测试夹具，不是 UI 或 Paisley 缺陷。
- 衣柜计数探针最后一个表达式返回 `HTMLElement.prototype`，CDP 以 -32603 拒绝序列化。此时尚未派发穿戴；改为返回 void 后继续。原失败 JSON/截图保留，不重派未知业务。建议探针默认只返回小型普通数据，不把协议拒绝判成游戏故障。
- 最后窄屏检查一度被 ModHub 日志窗口挡住，命中保护正确拒绝衣柜入口。记录实际遮挡后经原关闭入口退出，再继续；没有穿透强点或改第三方源码。
- 离线取帧曾传 max-frames=32，超过文档 1..30，修正参数后完成。归属调用参数；通用脱敏错误没有指出具体上限，属于错误提示可改善的候选，不是已确认采集缺陷。不为此改工具仓库。

## 候选身份与边界

分支 `research/stone-free-3.0-framework`，HEAD 保持 `014f469f4092d246cdcd22098fc9b5a943d029b6`。既有未提交工作保留。本轮主要改动为设置 controller/材质、私有 OrbitFocus 及两导航接入、衣柜展示层；Host、公共协议、UI API、原穿戴业务及商店半强度效果未改，战斗 B 仍默认关闭。

[最终本地候选](../tests/artifacts/kraft-work-settings-social-wardrobe-20261018/candidate-v3/DoLGameUI-3.0.0-input-focus-wardrobe.mod.zip)：219380 bytes。

| 对象 | SHA-256 |
| --- | --- |
| ZIP | `415d2b9fbc271e6089b0a6fa64daa7225c1666f15051530a54a44599e2bd12ba` |
| index.js | `663f04930d9a67930ce969ac18bd6b2b10f238092c679edab8a048cbcada26c2` |
| style.css | `e13bda5fe31c99348cfaf489dc69cb77a5b71b627f3d62101009dbd073858b7c` |

包内运行成员与 Android 实际加载成员一致。研究版本标识仍为 3.0.0，不代表已发布 Stable。

**Not validated：** 人工物理触控、其它设备/版本/Mod 组合、长期性能，以及用户原反馈全部业务副作用的完整重现。快速两件选择、reduced/unmount 有组件证据，实际叠穿、预览和离场有 Android 证据，不将每一种组合都写成真机通过。

**Known limitations：** 原库存行消失后不会留下永久波纹或假选中衣物；原位置按压材质只短时消退。素材、侧向运动幅度和透感仍需负责人判断。Visual Gate 继续 Blocked；没有提交、推送、合并、Tag 或 Release。
