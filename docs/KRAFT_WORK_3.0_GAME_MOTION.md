# Kraft Work 3.0：游戏主界面动效结果

2026-10-18。本轮已实现代表性的游戏交互动效，完成本地构建、定向测试和平板 WebView 检查，并部署到已授权的独立测试版。**Stable Visual Gate 继续 Blocked，等待负责人观看实际效果后确认。** 本文中的动效方案属于待验收实现。

保留前三轮的黑灰 Acrylic、设置导航、角色信息材质、特质和成就布局。本轮不推送、合并、创建 Tag 或发布，也不改稳定 2.7、公开 RC、Host 或公共协议。

## 设计与实际覆盖

先完成 Hub 到属性窗口及卧室原入口，再扩展到衣柜、商店与可选战斗 B。这样能先验证来源、焦点、关闭和中断，再复用展示能力；没有为每个页面创建新的动画 Runtime。

| 区域 | 实现与设计目的 | 本轮实际验证 |
| --- | --- | --- |
| Floating Hub | 子按钮依次释放，局部颜色区分工具；单个装饰轮廓从来源移向目标窗口，背景短暂退让，关闭时轮廓归位并恢复焦点 | 展开、属性入口、窗口关闭、主球恢复、停靠和重新展开 |
| 普通正文 | 仅为结构明确的卧室衣柜、镜子原链接标注展示属性，提供材质反馈；衣柜入口与新标题之间建立来源联系 | 卧室原衣柜链接只收到一次点击，进入实际 Wardrobe；未知、重复、被包装的入口在独立夹具中不增强 |
| 商店 | 分类轮廓跟随真实 active 状态迁移，商品按压响应，原详情区短暂清晰化 | 查看全部、两个分类、两个商品、对应原详情；补拍逐项检查实际命中点，没有购买或试穿 |
| 衣柜 | 分类切换更新列表过渡；主层衣物变化触发预览区过渡；保留原穿戴渠道 | 上装→下装→上装；一次实际校服衬衫穿戴，库存减少并进入第三方原生叠穿层，详见下文 |
| 战斗 B | 编辑部位切换与实际选择反馈，旧动画可中断；提示以当前原 radio 状态为准 | 六组安排、部位切换、一次原 radio change、连续快速切换；没有执行回合，结束后恢复关闭 |
| 角色窗口 | 已适配属性、社交、特质、成就共享打开、背景退让和关闭恢复；保持各页原有布局 | 本轮主要覆盖属性入口、重复开关及焦点。复用第二、三轮内部功能证据，不宣称四页本轮逐项复验 |

轮廓使用 560ms 空间迁移；角色窗口导航使用 460ms 位移，背景进入 300ms、退出 280ms。商店详情和衣柜列表约 480ms，实际主层预览变化约 520ms。原动作立即处理，不等待动效完成。静止后移除临时轮廓，不增加常驻扫光。

## Android 动态材料

材料保存在 `tests/artifacts/kraft-work-round4-20261018/`，仅供本地评审，不作为普通玩家发行附件。

| 视频 | 内容 | 输入方式 |
| --- | --- | --- |
| [Hub、原正文与衣柜，约 30 秒](../tests/artifacts/kraft-work-round4-20261018/hub-body-wardrobe.native.mp4) | 展开→属性→关闭→停靠／恢复→原衣柜入口→分类→实际叠穿结果 | 首次主球点击为 Android 原生注入，事件 `isTrusted=true`；其余为 CDP 控制 |
| [商店分类与详情，约 20 秒](../tests/artifacts/kraft-work-round4-20261018/shop-visible-r4.native.mp4) | 查看全部、分类切换、选择夏日连衣裙与晚礼服、原详情响应 | CDP；每个操作先用 `elementFromPoint` 检查真实位置没有遮挡 |
| [可选战斗 B，约 20 秒](../tests/artifacts/kraft-work-round4-20261018/combat-focus-r4.native.mp4) | 部位切换、原动作选择、安排反馈、快速切换 | CDP；原 change 一次，Continue 派发零次 |

以上均为 ADB `screenrecord` 的真实 Android 视频，不是浏览器页面合成录制，也不是实际人手触控验收。代表性画面已抽帧检查：[属性](../tests/artifacts/kraft-work-round4-20261018/04-origin-window-final.native.png)、[商店详情](../tests/artifacts/kraft-work-round4-20261018/08-shop-visible.native.png)、[战斗编辑](../tests/artifacts/kraft-work-round4-20261018/07-combat-edit.native.png)。衣柜视频约 24 秒可看到原角色叠穿后的衣物。

请负责人重点判断：来源轮廓是否自然、Hub 工具释放与窗口进入是否协调、黑灰背景退让是否舒适，以及商店／衣柜／战斗之间的动态节奏是否适合继续采用。技术检查不替代这项判断。

## 原操作与第三方边界

主要实现为 [official-ui/motion.ts](../framework/official-ui/motion.ts)、[共享展示动效](../src/ui/source-motion.ts)和[局部样式](../src/theme/kraft-work-motion.css)，并在现有衣柜与战斗组件中订阅实际展示状态。没有新增依赖，也没有改变公共 API v1 或 Host 协议。

- 新动效模块不读取游戏变量，不调用业务动作，不取消事件，也不补发点击。实际业务读取仅存在于本地检查脚本中。
- `.kw-moving-focus` 与 `.kw-context-plane` 是 `aria-hidden`、`pointer-events:none` 的装饰节点。它们不保存商品或服装数据，也不拥有原业务节点。
- 原角色窗口不施加 transform 或 filter，避免改变其 fixed 后代的坐标。装饰背景单独承载 blur，正文关闭窗口后恢复。
- 正文白名单要求唯一当前 Bedroom Passage、唯一直接内容容器及唯一直接 Wardrobe／Mirror 原链接。结构不匹配时保留原样。未知第三方入口不增强。
- 分类焦点在原控件更新后读取真实选中状态；穿戴继续使用既有原 widget 路径；战斗继续使用原 radio、target、Continue 和校验。
- 新 Observer 只观察已知 `#customOverlay` 的相关属性，以及其父级直接子节点替换。没有增加全页递归扫描或 DOM 镜像。
- 重复动画取消同节点旧动画；新焦点移除旧轮廓。场景切换、总开关关闭和卸载清理动画、装饰、标记、监听及待执行帧。
- 关闭动画或系统 reduced motion 时不播放迁移、内容和控件动画，窗口和原操作继续工作。装饰背景保留静态上下文，关闭时清除。

战斗 B 的默认值仍为 `false`，不是本轮默认正式体验。没有恢复已删除的衣柜浏览／确认穿戴实验，没有新增全局动作底栏。

## 实际穿戴结果与保留的失败记录

衣柜中只点击了一次已有校服衬衫，库存从 2 减到 1。最初脚本要求 `worn.upper.name` 必须变化，因此失败；失败回执 [hub-wardrobe-result.json](../tests/artifacts/kraft-work-round4-20261018/hub-wardrobe-result.json) 保持原状，没有重试穿戴。

随后只读核对发现：主层仍为 `sundress`，`wornStacking.upper` 已包含 `school shirt`。这符合当前优化 Mod 的原生叠穿渠道，与 [R16-W01 的原 widget 边界](STONE_FREE_3.0_R16.md)一致。确认记录为 [wear-confirmed.json](../tests/artifacts/kraft-work-round4-20261018/wear-confirmed.json) 和 [实际叠穿见证](../tests/artifacts/kraft-work-round4-20261018/wear-stacking-witness.json)。这是实际业务结果，不是仅凭 UI 提示认定成功。

最初直接经 CDP 返回整个带 getter 的 `worn` 对象得到 `{}`，不能由此判断游戏对象不存在。明确投影所需字段后可读取真实主层与叠穿层；没有据此认定 Dev Tools 缺陷。

视频复看还发现两项测试准备问题：

1. 第一段商店视频被 ModHub 自动日志窗口遮住。此前 DOM 断言证明了背后的状态变化，未证明可见交互，故不作为正式商店动态材料。原视频 `shop-continuity-r4.native.mp4` 保留；日志显示 Wardrobe widget 的 `TypeError`，其根因 **Unknown**，本轮不扩展为第三方修复。
2. 最初通过 `Engine.play('Bedroom')` 离开 Combat Demo，没有执行其 `endcombatdemo` 清理，留下 `$combat=1` 和原战斗菜单。这是受控场景准备遗漏，不能当作普通商店状态。随后使用 Demo 原生卧室出口完成清理，见 [native-demo-cleanup.json](../tests/artifacts/kraft-work-round4-20261018/native-demo-cleanup.json)。最终商店录像断言 `$combat=0`，并检查每个实际命中点；旧材料另存 `shop-visible-before-demo-cleanup.*`。

补拍脚本的第一次可见性守卫还将 `aria-hidden`、`inert` 的已收起 Hub sheet 当成窗口，因其缩放后仍有 rect。回执 `shop-visible-guard-failure.json` 保留。补充祖先语义检查后继续，没有删除产品 DOM 或强行点击遮挡层。

这些记录说明 DOM 存在、点击完成、状态变化和用户实际看见的结果需要分别检查。没有通过隐藏失败或改业务断言制造绿色结果。

## 验证与性能观察

设备：M367FC 平板，Android 17，WebView Chrome `154.0.8037.58`；独立 App `com.vrelnir.dol.lyra.uicompat051213`，DoL `0.5.12.13`、ModLoader `2.101.1`、Host `0.1.4-experimental`，含 MapleBirch `5.4.3` 与 CE rebuild.30 等现有社区组合。实际画面为 3408×2272，WebView 约 1363×876，DPR 2.5。

本地检查通过：

```text
npm run framework:check
npm run typecheck
node tests/official-game-motion.cjs
node tests/framework-motion.cjs
node tests/framework-motion-gate.cjs
node tests/combat-focused.cjs
node tests/wardrobe-source-m2.test.cjs
node tests/settings-orbit.cjs
node tests/kraft-work-collections.cjs
node tests/shop-stone-free.cjs
node scripts/build-framework.mjs
python scripts/package-framework.py --players-only
```

`official-game-motion.cjs` 的首次夹具因测试导航覆盖未知链接而失败；调整夹具位置后通过，未放宽产品断言。测试包含原节点身份、一次原事件、未知来源、中断重开、动画关闭、reduced motion、主开关和卸载清理。未重新执行完整发布回归。

Android 的 [closeout-result.json](../tests/artifacts/kraft-work-round4-20261018/closeout-result.json) 另验证三次属性开关、关闭过程中立即重开、关闭动画和 reduced motion。每次稳定关闭后临时背景／轮廓、窗口运行中动画均为 0。390×844 与 844×390 **受控 WebView 视口**下，关闭按钮可命中，正文无横向溢出；这不是物理手机或软键盘验收。UI 偏好、Floating 配置与位置原始字符串均与入场一致。

全部场景结束后的 [最终状态](../tests/artifacts/kraft-work-round4-20261018/final-state.json) 再确认：回到 Bedroom，原 `$combat=0`，战斗 B 关闭，临时装饰为 0，偏好与 Hub 位置保持入场值。

使用已安装 Paisley Park `6.1.0` 的标准 Action、WebView 连接和 `perf-series`，没有安装第二套工具。直接 CDP 用于项目私有状态的明确投影、命中点与实际制品身份；ADB 用于原生截图和录像。没有创建 GER Goal、重置 Store 或处理历史 Unknown。

性能仅报告本轮实际采样：

- 开关与窄视口检查前后，CDP heap used 从 213,197,412 到 228,018,812 字节，DOM 计数约 97,393 到 122,051，监听 524 到 531。期间包含原窗口重建及视口切换，未强制 GC，不能归因为动效泄漏。
- 随后三次标准采样的 App PSS 为 519,920／520,541／520,297 KiB，JS heap used 为 213,909,800／214,279,844／213,886,184 字节；监听均为 513。热状态 severity 为 0。见 [perf-series](../tests/artifacts/kraft-work-round4-20261018/perf-closeout/performance-series.json)。
- `gfxinfo` 三次有效 sampledFrames 均为 0，median／p95 缺失，不能提供真实呈现 FPS 或帧时间结论。Action roundTrip 包含工具通信，不能冒充用户输入响应延迟。
- 关闭后的自有临时节点检查通过；这不证明整个 App 无泄漏。第二轮 App 内存变化的根因仍为 **Unknown**。未使用 Perfetto、heap dump、detached probe 或 Full Evidence，也没有声称完成长期运行调查。

## 制品身份与交付状态

本地分支 `research/stone-free-3.0-framework`，HEAD 为 `014f469f4092d246cdcd22098fc9b5a943d029b6`；本轮与前三轮视觉工作仍是未提交改动，HEAD 不是这些源码的冻结提交。

本轮实际安装包 [DoLGameUI-3.0.0-kraft-work-r4.mod.zip](../tests/artifacts/kraft-work-round4-20261018/DoLGameUI-3.0.0-kraft-work-r4.mod.zip)，210365 字节：

```text
ZIP      71976b9cbb7c3756bf5f0da7d300802dab3a4ca181698ee49918bed41f28ff79
index.js d7404134d380d0ea3d13fc3dfaa49a9e7c36b31400d8ace8b529a6b779fa052d
style.css 89f89e45d3e2ccd7c23c1efa94f769e57c034d07d674a5e1f44b0fb8cac3edfb
```

成员摘要已与实际加载 ZIP 核对，记录在 `hub-wardrobe-result.json`。此前第一轮现场检查仅少一条焦点弱化 CSS，另存为 `DoLGameUI-3.0.0-kraft-work-r4-before-focus.mod.zip`，不冒充最终制品。没有安装重建 Host，设备仍用冻结 Host。

- **Delivered**：代表性 Hub→窗口、正文白名单、商店、衣柜、可选战斗 B 动效；构建和三段可评审 Android 视频。
- **Validated**：目标本地测试、实际平板原控件交互、真实叠穿结果、中断／关闭清理、受控窄视口与偏好保持。第二、三轮内部功能证据按未改变部分复用。
- **Not validated**：物理手机手指、真实 IME、全部 Mod／商品／战斗场景、购买和试穿、长期性能、全部角色页本轮逐项交互。
- **Known limitations**：普通正文仅覆盖严格匹配的卧室衣柜／镜子；其它入口保持原生。窗口打开后若在同一次显示期间改变尺寸，关闭轮廓仍可使用打开时的来源矩形，属于待观察的装饰几何限制。穿戴预览过渡监听主层变化，叠穿仍依赖原预览刷新和操作反馈。当前没有依据承诺全局流畅或内存问题已解决。

本轮代表性实现与验证已收口；负责人视觉验收是下一步，不自动升级为稳定版通过。
