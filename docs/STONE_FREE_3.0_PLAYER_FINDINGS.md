# Stone Free 3.0 — 玩家反馈与全局视觉专项

2026-10-17。当前 **Stable Gate Blocked**；负责人视觉验收为独立强制门槛，自动化通过不能替代。SG-01～06 和 UI 设置共同纳入本轮；不推送、Tag 或发布。

## Visual findings

现场为 M367FC / Android 17 / WebView 154.0.8037.58，独立 `com.vrelnir.dol.lyra.uicompat051213`，DoL 0.5.12.13 / Loader 2.101.1。入场 UI 为 RC-01、Host 0.1.4，华丽档与玻璃开启。实际组合含 ModHub 1.7.0、MapleBirch 5.4.3、CE rebuild.28、原版优化 1.1.1.5 和三个外观适配包；完整版本留在本地记录，不据此扩大兼容承诺。

1. **商店退出与空白同源。** 原生 `#clothingShop-div > a[data-passage="Shopping Centre Top"]` 没有被删。`.dgshop-content::before` 的绘制顺序盖住了原生行内正文和直系链接。分类卡片因自身定位仍可见，造成“大块空区、没有出口”的印象。为自有玻璃层建立隔离并置于内容后方，原链接、父节点和回调保持原样。不是新增一个猜测目的地的退出按钮。
2. **Start 导航漏了主题范围。** Start 用 `#startCaption`，已有轻导航主要作用于 `#overlayButtons`。ModHub 的公开侧栏入口另有 `.modhub-sidebar-entry` 包装，未被直系按钮规则覆盖。并非加载了整套 1.x 运行时。
3. **设置存在旧构图。** 官方设置仍机械平铺分组卡片；FloatingSettings 在官方包装尚未赋 3.x 版本时读取版本，误显示旧工具配置。另有原生滑杆的硬框外观。修正为单列 Section + Control Row、弱分隔、原 checkbox 的 Switch 外观及轻轨道；官方构建标记决定工具显示，不改游戏设置逻辑。
4. **Hub 空间不足。** 固定扇形偏移没有考虑完整工具尺寸和边缘；停靠消息没有到期清理。改为按空间选择方向，工具多或空间不足用紧凑可滚动列表；状态提示 2.2 秒后消失，可访问名称仍保留。
5. **真机角落另有层级冲突。** 左右展开本身通过后，角落命中被商店提示层盖住。现有 Eyes 商店 tooltip 层为 10001；仅在官方商店且原版 Overlay 关闭时提高自有 Hub 层。原生面板开启后恢复既有层级，没有改第三方 tooltip 的节点、内容或事件。

## 视觉归属地图

Official-Owned 指官方创建的节点；Original-Owned 指游戏节点；Shared Styling 只描述样式协调，不代表业务所有权。下表是本轮核查边界，不是全部页面业务验收。

| 区域 | 实际归属与源码 | 本轮处理 / 核查 |
| --- | --- | --- |
| Start 主内容、阅读正文 | Original-Owned；`src/theme/{eyes,layout,mobile}.css` 提供 Shared Styling | 保留原创建角色、基础/自定义等操作；不重写开始游戏 |
| Start 侧边导航 | 原按钮与 split 容器；`sidebar-layout.ts`、`stone-free.css` | 增加可撤销标题、轻导航、分组和统一状态；不搬原按钮 |
| 游戏中状态侧栏、导航 | Original-Owned；`sidebar.css`、`layout.ts`、`sidebar-layout.ts` | 原 HUD/状态来源保留，统一已知导航；已有 Tip 包装按原合同恢复，未知节点不删 |
| 界面设置 | Official-Owned；`SettingsPanel.vue`、`floating/Settings.vue`、`controls.css` | 本轮重整 Section/控件外观；UI 偏好仍由既有 controller 管理 |
| ModHub 侧栏入口 | Third-Party-Owned 的公开 `.modhub-sidebar-entry` | 只协调这一已知入口的表面/字形/间距；原按钮与事件保留 |
| ModHub 内部 | Third-Party-Owned；可选 ModHubSoftWet Adapter | 本轮不重建列表、不搬按钮、不接管管理行为；实际打开/关闭核查 |
| 衣柜 | 官方 shell/参考；原库存、来源与穿戴操作；`src/wardrobe` | 保留现有来源、R16 叠加语义和单击穿戴；核查主视图与参考，不恢复浏览实验 |
| 服装店 | 官方外壳/参考；Original-Owned 分类、商品、报价、颜色、购买/离开；`src/shop` | 修正玻璃绘制与入口密度；保留直接原链接，正常退出/重入 |
| 战斗 | 官方分组/摘要；Original-Owned 动作与继续；`src/combat` | 本轮不改回合/动作算法；核查主要操作区，历史业务证据单列复用 |
| 社交 | 官方导航；Original-Owned `#relation-display`；`src/social`、`eyes.css` | 保留原人物内容，现有轻卡片与 Acrylic；实际开/关 |
| 属性 | 官方导航；Original-Owned 内容；`src/characteristics` | 原状态不镜像，实际开/关 |
| 特质 | 官方分组导航、原 `.trait` 节点；`panels/{main,presentation}.ts` | 原 hidden/未知条目继续有效，轻条目；实际开/关 |
| 统计 | 官方导航/Shared Styling；原统计节点；`src/panels` | 保留原数值与展开；实际开/关，不新建 dashboard |
| 日志 | 官方导航、原正文/笔记输入；`src/panels` | 稳定内容层；实际开/关，本轮不写笔记 |
| 成就 | 官方导航、原筛选及成就；`src/panels` | 原状态/筛选保留；Start 和游戏中入口核查 |
| 存档 | 官方 shell/投影、原槽位/存读档；`src/saves` | 实际入口与关闭；本轮不写私人存档，既有升级回退证据按未改业务复用 |
| 游戏选项与其它原版 Overlay | Original-Owned；已识别页面用 `src/panels` 和 Shared Styling | 不换游戏原控件；未知 Overlay 不强接管 |
| Floating Hub | Official-Owned；`framework/official-ui/hub.ts`、`motion-hub` | 本轮修空间/提示/工具；受支持原面板入口需唯一、可见、启用且当前来源有效 |
| 参考与比较空间 | Official-Owned UI/只读快照；`official-ui/reference-shelf.ts`、衣柜/商店组件 | 保留来源关系、场景失效和撤销；不让快照成为新的游戏状态源 |
| Drawer、三级浮层、Inspector | 官方 Surface / 原提示层分别拥有；`src/runtime`、`eyes.css` | 自有表面协调，模态优先；不提供任意 JS/游戏状态写入工具 |

## Delivered

- 首页和游戏导航使用同一轻导航形态；边框、标题、主次层级、Hover/Focus/Press 一并协调。原按钮仍可定位，主题关闭时移除自有标题并恢复样式。
- 官方设置改为 Section + Control Row；Switch、Select 和滑杆保留原输入及绑定，移除旧官方工具实验配置的误显示。
- 商店正文/原出口恢复；保暖条限制宽度，说明区弱化重框、分类更轻，不再把被遮住的正文误作装饰留白。
- Hub 加入界面设置、只读 Inspector、原存档/社交/属性入口；保留已固定参考和第三方主动注册视图。找不到唯一有效原按钮时给出短暂不可用提示，不猜 Passage，不重试业务。
- Host、公共协议、API v1、存档格式、游戏状态源和第三方生命周期没有改动。

## 候选身份与验证记录

运行源码固定为 `c23b3728da9ca7677fc8acea158ba3db8cdca0b9`，在 `git archive` 独立目录重建；没有安装依赖。候选仅装入已授权独立测试 App，版本字段为本地 `3.0.0`，不表示 Stable 已批准。

| 制品 | SHA-256 |
| --- | --- |
| `dist/player-gate-3.0.0-v3/DoLGameUI-3.0.0.mod.zip` | `5095436180d3c37507fd6e24b06c461e104c8271208f10d91bac1399ca57ff38` |
| `StoneFreeHost-0.1.4-experimental.mod.zip` | `ad78fca929e3819fce4da6f0d10affb4fc91318661583e4dacec896b64936153` |

Host 与公开冻结包字节一致。首次视觉候选 `2154cf…`、第二候选 `b3ed66…` 均留存。第二候选到最终候选只有 `style.css` 改变：窄屏详情的隔离上下文升到自有背景遮罩上方，底层内容不参与命中，详情仍可点击；详情打开时暂时隐藏 Hub。没有移动原详情节点，也没有修改购买逻辑。完整成员摘要见本地 manifest。

本地定向检查包括 `framework:check`、`framework-motion-gate.cjs`、`framework-motion.cjs`、`sidebar-layout.cjs`、`stone-free-player-shells.cjs` 及固定提交构建/打包。motion 的八个浏览器夹具覆盖中断、连续操作、拖动取消、大小变化、提示清理、原输入、减少动态效果、公开视图撤回和退出清理；它们不是物理触控证明。

保留的失败：截图脚本默认缓冲不够导致 ENOBUFS（已恢复原清单/偏好，扩大本地截图缓冲）；商品标题 link 的 `pointer-events:none` 使直接命中断言失败（原可交互目标是商品行，改用真实行点击）；Android 角落 tooltip 盖住 Hub、玻璃隔离后窄屏 Drawer 被背景遮罩盖住（两个真实产品层级问题，均做最小修正）。额外采样的 `scrollIntoView(nearest)` 将战斗原控件贴到固定底栏下，改为滚到可视中部后原 radio 和原 Bedroom 返回都通过；没有点继续。详情背景遮罩开启时直接点击侧栏切换也被正确阻挡，后续先收侧栏再进入窄详情。旧夹具缺少宿主 sceneReady 和新增测试误双击的问题也保留在原测试收据，没有通过放宽运行时保护处理。

## Android evidence 与 Gameplay regression

记录目录为 `tests/artifacts/stone-free-player-findings/`。实际截图已经人工查看。ADB 原屏部分包含系统通知，保留在本机而不用于对外审阅；下列 `.webview.png` 是真实 Android WebView 的 CDP 捕获，排除了系统通知，并非桌面夹具或概念图。**本环境 CDP 截图会遗漏角色 Canvas 的可见画面**：原 Canvas 与衣柜副本均有 15925 个非透明像素，CSS 可见，ADB 原屏可见角色，CDP 图中却为空。角色预览以已检查无通知的 `.native.png` 为准，不将采图差异误记成预览丢失。具体底层原因 Unknown。

| 审阅内容 | 本地截图 |
| --- | --- |
| Start 与统一导航 | [review-start.webview.png](../tests/artifacts/stone-free-player-findings/review-start.webview.png) |
| 官方设置与原输入换皮 | [review-settings.webview.png](../tests/artifacts/stone-free-player-findings/review-settings.webview.png) |
| 游戏中状态侧栏、阅读 | 侧栏见下行 ADB 原屏；正文见 [18-reading-sidebar.webview.png](../tests/artifacts/stone-free-player-findings/18-reading-sidebar.webview.png)（CDP 不用于角色画面验收） |
| 衣柜主视图、真实角色与参考 | [25-wardrobe-settled.native.png](../tests/artifacts/stone-free-player-findings/25-wardrobe-settled.native.png)、[26-wardrobe-settled-reference.native.png](../tests/artifacts/stone-free-player-findings/26-wardrobe-settled-reference.native.png)，ADB 实际原屏，无通知 |
| 商店入口正文、原生退出 | [07-shop-entry-top.webview.png](../tests/artifacts/stone-free-player-findings/07-shop-entry-top.webview.png)、[08-shop-native-exit.webview.png](../tests/artifacts/stone-free-player-findings/08-shop-native-exit.webview.png) |
| 商品列表与原详情 | [09-shop-catalog.webview.png](../tests/artifacts/stone-free-player-findings/09-shop-catalog.webview.png) |
| Hub 左侧、右侧、角落 | [hub-left.webview.png](../tests/artifacts/stone-free-player-findings/hub-left.webview.png)、[hub-right.webview.png](../tests/artifacts/stone-free-player-findings/hub-right.webview.png)、[hub-corner.webview.png](../tests/artifacts/stone-free-player-findings/hub-corner.webview.png) |
| 停靠、提示到期、恢复 | [12-hub-docked.webview.png](../tests/artifacts/stone-free-player-findings/12-hub-docked.webview.png)、[13-hub-docked-hint-cleared.webview.png](../tests/artifacts/stone-free-player-findings/13-hub-docked-hint-cleared.webview.png)、[14-hub-restored.webview.png](../tests/artifacts/stone-free-player-findings/14-hub-restored.webview.png) |
| 实际 Hub 设置/社交/只读 Inspector | [10-hub-settings.webview.png](../tests/artifacts/stone-free-player-findings/10-hub-settings.webview.png)、[11-hub-social.webview.png](../tests/artifacts/stone-free-player-findings/11-hub-social.webview.png)、[16-hub-inspector.webview.png](../tests/artifacts/stone-free-player-findings/16-hub-inspector.webview.png) |
| 战斗主要操作与原选择 | [22-combat-centered-selection.webview.png](../tests/artifacts/stone-free-player-findings/22-combat-centered-selection.webview.png) |
| 受控 390px 详情、返回列表 | [23-narrow-product-details.webview.png](../tests/artifacts/stone-free-player-findings/23-narrow-product-details.webview.png)、[24-narrow-product-list.webview.png](../tests/artifacts/stone-free-player-findings/24-narrow-product-list.webview.png) |

实际结果分别保留，不把中途失败报告改成 passed：

- `android-partial-through-exit.json`：八类侧栏面板、Start 存档/选项/成就、ModHub 共存、衣柜参考、原生商店两次退出/重入与 shop 挂载释放已通过；之后在错误的商品 link 命中断言处停止，清单和偏好已恢复。
- `android-final-result.json`：第二候选实际安装、JS/CSS/early 成员匹配；左右/角落菜单均在视口内、不叠主球、主球真实可命中。实际打开/关闭设置、社交、存档，停靠消息到期、恢复、重载后偏好恢复通过。报告最后的 390px 仅证明没有横向溢出，不能单独证明完整窄屏交互。
- `android-extra-result.json`：Start 不存在的社交入口返回“原版入口当前不可用”，不跳场景，提示到期；只读 Inspector、原 checkbox 往返、流畅档关闭玻璃、主题总开关恢复通过；在战斗 nearest 滚动命中处停止，偏好恢复通过。
- `android-layout-result.json`：将原动作滚到可视中部后 radio 实际选中；没有执行回合，原继续仍存在；原 Bedroom 返回后战斗 shell/footer 释放。Hub 原属性入口打开与关闭通过。其后窄屏遮罩挡返回按钮的真实失败促成本轮最后修正。
- `android-narrow-final-result.json`：最终候选 `509543…` 的运行 CSS 摘要匹配。实际 390px WebView（非物理手机），页面宽度为 390；侧栏先正常收起；详情返回按钮命中并回到列表，再次打开后点击上方空白背景也能关闭。结束清除视口覆盖、恢复偏好、重载到 Start，最终 UI 3.0.0 / Host 0.1.4，原 RC 存储仍保留。
- `android-wardrobe-native.json`：最终候选的衣柜分类、参考、256×256 Canvas 及 ADB 原屏核查；原角色和镜像的非透明像素数一致。`final-runtime-identity.json` 再核对最终运行 CSS/Host/Start。早期 `android-wardrobe-review.json` 的 uiSha 来自未使用的旧 helper 输入路径，不是部署身份；独立说明见 `metadata-clarification.json`，原记录未删除。

最后一次 CSS `3c01e7bb5559227d9a1b8f53c5d672c47c9513acdb422d3d5e890e4b0b7eafba`；运行 JS `cccbc96ae0131eb05606a2faf7ba6d1f98adbc72fd0d4dc045e827a183f63729`。最终变动只触及窄详情打开状态的 CSS，其它新通过项目不重复运行。

本轮只新建未保存的隔离测试进度；控制性预算/原 Demo Passage 用于准备场景，不当作购买、退出或随机遭遇证明。**未执行本轮购买、换装、保存、读档或战斗回合。** 这些业务逻辑未改，复用 R15/R16/RC 与首轮 Stable Gate 的已说明证据，不能称为最终候选全部重验。共享 GER Store 及历史 Pending/Unknown 没有清理或绕过。

## SG-01～06 与 Gate

| 项目 | 状态 | 依据 / 剩余 |
| --- | --- | --- |
| SG-01 停靠提示常驻 | Fixed | 实际停靠后提示到期，恢复可操作；无常驻提示 |
| SG-02 旧构图与密度 | Partially Fixed | 原正文被盖和装饰宽度已修、设置重整；整体构图接受程度仍由负责人审阅 |
| SG-03 原商店退出 | Fixed | 原链接两轮实际退出/重入，shop 挂载释放；非第三方浮动“离开”替代 |
| SG-04 展开遮挡 | Fixed | 左右/角落实际命中通过；附带 tooltip 层冲突修正；工具多时使用紧凑列表 |
| SG-05 Hub 实用功能 | Fixed | 五项可靠入口、已有公开参考；不可用不猜动作，负责人仍可评价使用感受 |
| SG-06 官方导航旧形态 | Partially Fixed | 统一层级、分组/间距、导航及三态反馈，原入口可用；尚未得到负责人视觉通过 |

| Gate | 当前结论 |
| --- | --- |
| Functional Gate | 本轮约定的退出、原入口、原输入和窄详情关闭通过；无新增已确认业务阻断 |
| Interaction Gate | 本轮 Hub 位置/工具/提示/恢复，以及关闭返回定向合同通过；不替代玩家手感确认 |
| Visual Gate | **Pending / Blocked**，整改材料已提供，不能由自动测试自评解除 |
| Owner Acceptance | **Pending**，负责人尚未明确接受 |
| Stable Release | **Blocked，未授权发布** |

## Architecture impact、Not validated 与 Known limitations

公共 Host、协议与 API v1 没有改变；没有改 Mod 加载顺序、第三方状态源、游戏存档/事务或穿戴/购买/回合逻辑。新增 Hub 操作调用当前原按钮一次，不持有平行业务状态。普通未知 Mod 内容不隐去；只协调已识别的 ModHub 公开侧栏入口，内部外观仍由其可选 Adapter 负责。

Windows 本轮为真实浏览器的定向布局/生命周期夹具；本轮未重跑 Windows 游戏完整流程。Android 是实际 Loader 安装及 CDP 受控触摸/按键；未进行新一轮物理手指、真实手机/IME、全部第三方组合、其它游戏版本或全 Framework 矩阵。没有调用 Perfetto、bugreport 或新 Full Evidence。以上属于覆盖边界，不用它们绕过当前强制视觉 Gate。

已知限制：Hub 工具较多时会转紧凑列表，设置里的扇形偏好不保证所有场景强制扇形；未知/歧义原入口只提示不可用；第三方内部 UI 未全部重设计。受控新游戏画面曾出现原游戏错误定位提示，完整来源 **Unknown**，没有证据归因于本轮代码，未以改第三方逻辑消除。最终视觉与物理操作感受仍需负责人判断。

本轮 Paisley Park 经验：复用已装 6.1.0 的 Execution Context/Action 完成重载与重新绑定；真实命中由 CDP `elementFromPoint` 配合触摸证据确认。不要把采图完成、Canvas DOM 存在或 alpha 非零自动当作截图内容完整；出现画面矛盾时用 ADB 原屏交叉核查。本轮未确认 Paisley Park 实现缺陷；Canvas 捕获差异的 CDP/WebView/图形层归因仍为 Unknown。一次性项目脚本的缓冲和目标选择错误属于本项目采样脚本，不归入工具 Runtime 缺陷。

## 当前发布状态

**Stable Gate 仍为 Blocked。** 本轮工程整改及代表性材料已经提供，剩余当前门槛为 SG-02/06 的负责人视觉审阅与 Owner Acceptance；不将其改为 Known Limitation 或 Deferred。本轮未推送、合并、创建 Tag 或发布。正式 2.7 工作区和原有两个未跟踪文件保持原状。
