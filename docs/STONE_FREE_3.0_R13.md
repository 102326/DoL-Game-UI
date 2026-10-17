# Stone Free R13：运动语义与真实游戏接合

2026-10-17。基于 R12 本地提交 `c57ca1e2c9af94d0e3aaa5fca34ffa256484898b`，分支 `research/stone-free-3.0-framework`。本轮约定范围已完成；官方包为 `3.0.0-lab.13`，仍是研究候选。没有推送、合并或正式发布，也没有修改正式安装或私人存档。

## Delivered

| 主线 | 本轮实际交付 | 边界 |
| --- | --- | --- |
| M1 运动语言 | 衣柜与商店共用 `src/ui/source-motion.ts`：从来源取出、标签暂存、字段揭示、关闭归位；取消与资源释放集中处理 | 官方内部工具，不新增 Host 动画 API；阅读正文及原动作按钮不随动 |
| M2 空间比较 | 商店新增普通/空间转场切换、差异字段顺序强调；比较中继续选 B 会更新来源；原交易清空选择后关闭 B | A/B 仍是显示快照，不推断价格、隐藏属性或替换关系；衣柜主按钮保持单击穿戴 |
| M3 真实交易 | 识别原“购买并送到家 ×1”控件，原事件执行后核对实际扣款与目标衣物入库；只有同时匹配才显示 confirmed | 只支持已识别的普通单件、原 wardrobe 目的地；其它原操作照常执行，不额外确认 |
| M4 战斗 | 原选中 radio 使用 Ocean 边缘和可选 Glow，坐标不变；完成原版战斗演示的实际动作、回合和退出验证 | 真实原宏/原事件，不是夹具回合；不宣称自然随机遭遇或完整战斗结算已验收 |
| M5 官方消费者 | 社交自有导航接入公共 Host 的 persistent mount；原关系节点、原事件仍由游戏/Mod 拥有 | 仅导航消费者化，不是社交业务接管，也不代表所有正式页面已迁移 |
| M6 跨场景协作 | 衣柜固定 A 时发布一份会话内显示快照；离开后 Hub 标记“已离开来源场景”，只允许清除 | 不保留旧 DOM、操作 key、原状态或穿戴回调，不恢复旧 Passage；未写入持久存储 |

沿用 R12 的 Eyes/Ocean `#8dc7ff`、Card `#2d2e33`、Acrylic 外壳、字体与视觉档位。普通/空间模式共享数据；系统减少动态效果、主题撤销动态效果或不支持 WAAPI 时保留功能。快速重新固定、关闭、来源失效及页面离开会取消自有运动。

### 交易与原事件的边界

`src/shop/transaction.ts` 只读取原 `getClothingCost` 和实际 State。原控件继续执行条件检查、扣款、`shopbuyv2`、`generalSend`、列表刷新与 `updateMoment`；UI 没有第二套购买实现。

确认条件为：当前场景仍有效、同一原状态、金钱恰好减少原价、对应衣槽长度增加一、目标 variable 数量增加一。无法确认进入 unknown；pending/unknown 会阻止本界面对同类送回单件操作再次派发，不自动重试。离开场景会释放本地观察状态，不能把重开页面当作旧 unknown 已解决。套装、多件、未知目的地不进入该确认合同，沿用原版结果。

原 `linkifyDivs` 会由 `.buy-button-inner.div-link` 的 jQuery 处理器执行内部链接。R13 在原外壳点击前复核同一个已绑定原链接，未 clone 或转发业务。核对使用下一任务而非捕获阶段的微任务，避免先于原 bubbling handler 读取结果。退出时清理待核对任务。

### 官方功能覆盖

| 区域 | 当前承载方式 | 本轮证据 / 状态 |
| --- | --- | --- |
| 衣柜、快穿、整理、未知入口 | 原 Source/操作校验 + 官方自有 Vue + Host passage mount | 比较、浏览、自然退出/重入；Windows 原穿戴；整理/扩展合同复用未改的历史证据 |
| 商店、颜色、原购买区 | 原商品/报价绑定 + Host passage mount；早期脚本及四项原补丁 | 两端真实 Loader、分页、比较、一次单件送回购买；未穷举颜色与其它交易类型 |
| 战斗、原继续区、摘要 | 原控件 + Host passage mount | 两端原版演示动作/回合/退出；组件校验原节点、坐标、事件和降级 |
| 社交导航 | 自有导航 Host persistent mount，原关系区不重建 | 两端原 overlay 打开/关闭；定向测试动态替换、启停、owner 退出和 peer 保留 |
| Floating Hub / 公开视图 | 自有公共消费者与公开 View | 当前参照入口与离场快照，隐藏/释放，无第二个旧球 |
| 设置 / Inspector | 既有正式模块，Hub 提供公开入口 | 入口保留；未逐项重跑设置业务，不称全部 Host 化 |
| 存档、导入导出、统计、特质、日志、成就及其它低频页 | 继承既有正式实现 | 本轮未重构、未逐页验收；原版回退和总开关不改 |
| API v1 / 经典 2.7 | 保留独立经典构建与声明 | 新鲜经典入口仍为 2.7.0/API 1、没有官方 Host owner 或参考 UI；声明及早期补丁逐字节核对 |

Host、连接器和公开协议均未改；Host ZIP 与 R12 字节一致。独立发行继续采用已知配对，不扩大成任意版本独立升级承诺。

## Validated

### 源码与组件

Node `v26.12.0`、Python `3.14.7`、现有锁文件和依赖，未安装或更新工具。`npm run typecheck`、`npm run framework:check`、`npm run lab:check`、研究构建和经典 Vite 构建通过。

- `tests/wardrobe-reference-panel.cjs`：40 条目组件，中断、重复操作、失效、焦点/滚动恢复、减少动态效果及释放；收据 `tests/artifacts/stone-free-r13/panel-1792228216622/result.json`。
- `tests/shop-stone-free.cjs`：A/B 冻结显示、详情挂载、焦点返回、动效门槛撤销、原节点恢复、场景失效和经典路径。
- `tests/shop-source.test.cjs`：报价/定义/场景过期、外壳命中、一次派发、未知入口。
- `tests/shop-transaction.cjs`：精确扣款/数量变化、unchanged/stale/replaced → unknown、不支持目的地/多件/套装/错误 → 原版。
- `tests/shop-transaction-lifecycle.cjs`：浏览器 locator 点击触发夹具原 handler 一次；confirmed、unknown 后 clone 控件仍阻止重放、不支持路径及经典路径。fixture 金钱变化不是实际游戏购买证据；`isTrusted` 也不是物理触控证明。
- `tests/combat-stone-free.cjs`：原 radio 身份/一次事件、选择前后坐标、减少动态效果、失效/重入/经典路径。本轮该测试最初仍输出到 `stone-free-r12/combat-1792228214646`；后续输出路径已改为 r13，历史收据未移动。
- `tests/social.test.cjs --framework-mount-only`：启停、overlay 替换、owner 清理不重挂、同伴和经典路径，原节点/handler 保留。
- `tests/shop-pagination-package.test.cjs`：早期入口默认关闭、严格布尔、重复初始化、四项原补丁。

### 真实 Loader 与游戏结果

最终流程：`tests/framework-official-r13.cjs`。Windows Edge 156，原 DoL `0.5.12.13` HTML、ModLoader `2.101.1`，1280×900 及受控 390×844；平板 M367FC / `0509B830099C3540`，独立包 `com.vrelnir.dol.lyra.uicompat051213`，Android 17、WebView `154.0.8037.58`，1363×876 CSS 视口。

使用 Paisley Park 6.1.0 resolver、Doctor、execution-context、标准 web-click/web-input/restart，CDP 原状态读取/截图；Windows 使用项目 Playwright。实际安装 Host + NativeStatus 同伴 + 官方 UI + TweeReplacer 后重载，不是临时注入替代 Loader 安装。流程创建隔离新游戏，没有载入或保存私人进度。

| 验证 | Windows | Android |
| --- | --- | --- |
| 衣柜普通/空间同字段，浏览上下文、焦点、自然退出/重入 | passed，另验证原单击穿戴 | passed |
| Hub 当前入口、离场快照、无旧动作 | passed | passed |
| 商店详情、比较、原翻页 | passed，另检查受控窄 Drawer 与关闭命中 | passed |
| 原单件购买 | Hairpin，原价 500；money 100500→100000；head 长度0→1，hairpin数量0→1；confirmed | 同一合同与相同变化，confirmed |
| 社交原 overlay 与导航 Host mount | passed | passed |
| 原版战斗演示 | Passage计数9→10，left rest→leftchest，enemyarousal 42.66→56.66 | Passage计数9→10，left rest→leftchest，enemyarousal 26.66→29.66 |
| 原 Bedroom 退出战斗 | combat1→0，原动作重置，UI释放 | 同左 |
| 官方退出、同伴继续读取、原节点恢复 | passed，经典2.7入口/API1 | passed |

交易前通过原 `<<money 100000>>` 为这份新测试游戏准备预算；不是购买结果。商店/战斗入口通过原 Engine 准备，战斗的 Add human、Start、radio、Next 和 Bedroom 为原生控件。没有注入假动作处理器、假 Passage 事件或直接改写库存/战斗结果。

战斗使用游戏自带 `Combat Demo Preparation → Combat Demo`，运行原 `actionsman/effectsman/stateman` 等宏及原回合事件。它证明真实游戏回合接合，未证明自然随机遭遇、所有战斗类型或战斗结束结算。

最终收据：

- Windows：`tests/artifacts/stone-free-r13/desktop-1792228263383/result.json`，passed。
- Android：`tests/artifacts/stone-free-r13/android-1792228263381/result.json`，passed。
- Android 同目录 `restore-verification.json`：原 Mod/隐藏清单及 UI 偏好经重启读回一致。恢复哈希 `91bcddd958a5108cb493e2e7131c7504637a436d3811a102d950f49ea9a4628c`。
- 购买后定向补查：`android-1792228485032` 与 `android-1792228599690/result.json`，passed；两次恢复读回也通过。后者增加原生设备截图、控件 computed bounds 和购买后重新选择原商品，不重复旧 unknown 操作。
- 包体：`tests/artifacts/stone-free-r13/package-audit.json`。截图和这些收据不进入运行 ZIP。

## 真实失败与修正

1. 默认“全部”可见商品为套装，不能据此测试普通单件合同。改点原 head 分类，未放宽确认条件。
2. 原大按钮使用 jQuery 外壳执行链接；只观察 anchor 的 DOM 点击会漏掉外壳。补强原 Source 命中，仍保留原执行者。
3. `desktop-1792228027534`：原扣款与入库已发生，但捕获阶段微任务过早读取，误报 unknown。保留失败，不重放同一未知交易。后续在新的独立浏览器新游戏修正为事件结束后核对，并用实际浏览器输入的定向测试防回归。
4. 真实战斗回合已经执行，但测试等待 State.length>5 超时（`desktop-1792228138990`）。原配置 `Config.history.maxStates=5`；改查原 Passage 计数和行动/战斗状态，不把历史上限误判为回合失败。
5. 调查脚本曾有嵌套正则转义错误、返回整个原状态导致序列化失败；均为项目测试代码错误，未派发购买，记录保留。没有据此认定 Tools 缺陷。

Windows 启动出现两条泛化 Event page exception，原因 Unknown；参考、交易与战斗流程没有新增 page exception。Android 本轮没有做完整 Console 采集，不声明全游戏日志无错。

### 网页截图与设备画面的差异

CDP `Page.captureScreenshot` 的购买后图片将工具栏纵向压缩，还漏掉部分角色渲染。等待800ms后仍如此，不能直接当作过渡帧。追加原生 ADB `screencap` 对照，同一现场的实际设备画面正常；DOM 的 header 高49.6px、分类高44.6px、工具区域132.6px，transform none / zoom1，无活跃动画。随后使用标准 Action 重新选择商品，详情与购买区正常显示。

证据位于 `android-1792228599690/`：`shop-native-purchase-confirmed.png`（网页截图）、`shop-native-purchase-device.png`（设备画面）、`shop-after-purchase-reselect.png` 和 `result.json`。这是已观察的采图路径差异，确切渲染原因 Unknown；没有据此改 UI 或认定 Paisley Park 实现缺陷。审阅购买后布局应优先使用该原生设备截图，不能只凭异常网页截图下结论。

## 制品身份

| 制品 | 字节 | SHA-256 |
| --- | ---: | --- |
| DoLGameUI-3.0.0-lab.13.mod.zip | 182399 | `efb1995402f2ce6d8b72d38a58fdf4f1ea72f907a191bdf05a676fc6f3204d3c` |
| StoneFreeHost-0.1.1-experimental.mod.zip | 11224 | `7f393f438111a2679d329e3301ba6b7456e88a21a3ac606da2bc995d2815902c` |

Windows/Android 最终实际加载的官方包摘要均与本表一致。ZIP 共16项，包含 README、许可证、运行 JS/CSS、原早期脚本、四项 TweeReplacer 资源及 API v1 声明；不含测试收据、截图、APK或存档。早期脚本、四项补丁和声明与经典2.7逐字节一致。可选 MotionHub0.1.2、独立 WardrobeReference0.1.1 未改版，不需要与官方 UI 同装。

## Not validated / Known limitations

- 未验物理手机/IME、长期性能、其它游戏/WebView/Loader、复杂 Mod 组合和全部第三方衣槽。390px 是受控浏览器布局，不能称手机触控验收。
- 桌面仅提供编译 HTML，部分游戏图片未提供；平板有实际资源。未为截图隐藏同伴 NativeStatus 入口。
- 单件送回结果有明确核对合同；套装、多件、其它目的地及异步第三方交易只保留原版，不宣称获得同等确认覆盖。
- 会话快照可能过时；清除衣柜当前 A 不等于清除 Hub 独立快照，后者有自己的清除按钮。页面重载不保留快照。
- 低频页面继承原实现，没有全消费者化。没有扩大 Host、SDK、Factory、全局输入接管或并行业务状态系统。

本轮达成的是 R13 的代表性运动交互、原游戏接合及消费者推进。下一阶段和正式发行仍需按新授权确定范围，以上未覆盖项不自动成为本轮剩余任务。
