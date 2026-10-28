# EVO-P0：建议冻结的架构覆盖与迁移清单

2026-10-22，**负责人原则通过并批准作为A2/A3范围**。授权见[原文](../references/SOFT_WET_4.0_EVOLUTION_V1.2_ORIGINAL.md)，批准覆盖当前表中的自有纳管项和必要例外；新增范围仍不得自动加入。首轮A1及隔离天气V1已另行获施工授权。

## 身份与审计方式

main=`6a6e3c00b705dc67d37c1780b27f585847da5d1a`，公开3.0.4源码=`915dcb9e85f3266a73a3e7ce38d769edd0c29ff4`；main包含后续兼容包修复，不与Tag混称。研究输入=`baf0d48d3d4b63cae1e17ff324d233b9a37e16b4`（main之后16提交），沿用已有独立worktree，新分支`dev/evolution-4.0`。继承的运行差异只有5文件：MotionHub、official motion、设置控制器/组件、sourceMotion；其余原型及证据单独存在。

[词法普查](EVO-P0-inventory.json)固定上述研究输入，在src、official-ui、motion-hub、compat及两类研究原型中检索动画、生命周期、几何和材质线索，逐文件含SHA256；共89个命中文件。词法命中**不是消费者纳管证明**，也不能识别所有间接CSS变量消费。下表按实际入口和职责归组，未宣称全仓100%覆盖；将来增加入口必须登记而不是计入已完成。

## 建议范围

表中“纳管”指共同所有权/失效/取消/坐标/资源合同，不强制换引擎、统一组件或改变视觉。A1已施工，其余纳管项为已获批的A2/A3范围，须逐项验证并退出旧路径，不等于已经完成。

| 消费者及正式入口 | 输入基线的管理/实现 | 决定及例外理由 | 验收与旧路径退出条件 |
| --- | --- | --- | --- |
| 属性 src/characteristics/main.ts | 独立overlay发现、Vue/Host挂载、observer、租约；sourceMotion专属卡片/接力 | A1收敛基础，保留原生正文、识别和演出 | 双端真实Host测试、原节点/事件、Zoom、快速意图、故障；旧基础代码删除，薄配置入口保留 |
| 社交 src/social/main.ts | 与属性同构但租约/异常代码已漂移；专属高亮 | A1同一适配器，不强制同一Vue组件 | 同上，保留社交分组与显示语义；不得重建关系宏 |
| 通用原生页 src/panels/main.ts | 多PanelKind、独立overlay/正文发现与取消 | 纳管共同作用域；原生/非overlay宿主保留专用控制器 | journal/traits/statistics/feats/cheats/attitudes/settings各kind覆盖后方可退出旧基础；未知页不接管 |
| 原生窗口呈现 framework/official-ui/motion.ts | 自有代理、输入标记/observer/帧调度，含缩放与重定向 | 纳管自有层，不接管游戏窗口动画 | native事件单次、无错误恢复、隐藏/关闭重开；撤销旧代理路径须与对应场景对照 |
| 原生导航 framework/official-ui/navigation.ts | sidebar/tabs/CE分组、自有Vue OrbitFocus、原属性还原；消费headerWeather | 共享租约/清理，已审白名单识别独立保留 | 原生按钮/第三方原事件、精确属性还原、group退出后零owned节点 |
| OrbitFocus src/ui/OrbitFocus.vue | 独立Resize/Mutation/RAF与sourceMotion；已有局部坐标换算 | 纳管作用域/坐标，保留局部滚动与圆角 | CJ-3B反例、NaN/Infinity、生产CSS、缩放/滚动和卸载；迁移后不得绕回自有定时器 |
| GameButton / SettingsToggle | Vue控件、CSS波纹/hover/focus | CSS/Vue可继续使用，登记所有者而非禁止声明式能力 | 点击/键盘/disabled/reduced、卸载；非必要无物理积分 |
| 设置 src/theme/controller.ts | 正式研究src仍b507基础，V2.3当前仅隔离生成副本 | 纳管窗口生命周期；**最终必须保留100/80ms及立即可用** | 整合时搬迁已认可方案，旧开关代理才可退出；不拿原型代替生产集成 |
| 设置分类/布局/预览 SettingsPanel.vue、SettingsNavigation.vue、SettingsPreview.vue | sourceMotion与Vue过渡、layout observer，多作用域 | 保留V2.2分类视觉；收敛作用域/失效和坐标 | 最新意图、隐藏/卸载/Zoom、布局/偏好与原事件；原生成副本不永久充当正式入口 |
| 主题/侧栏布局 src/theme/layout.ts、sidebar-layout.ts、theme.ts | 部分共享，多个observer/RAF，原样式恢复 | 纳管自有布局任务，不替代游戏布局语义 | 移动/滚动、恢复/重复挂载；保留布局fallback直到等价验证 |
| 天气 framework/official-ui/weather.ts | readGameWeather权威读取、headerWeather表面Map/轮询、sourceMotion交叉退出 | 复用读取与neutral fallback，V1研究新材质参数；生产升级后退出旧paint/粒子路径 | W1–W4及天气字段边界/隐藏/减少动态；旧CSS/SVG删除须所有消费者已迁移 |
| Acrylic/theme CSS及天气SVG src/theme/*、runtime/surfaces.css | 共享tokens/角色样式，多个局部blur/天气选择器 | 按角色纳管材质；必要嵌套blur例外，不能无差别删除 | 分角色可读性/多窗口采样/静动态对照；无消费者前不删样式或背景层 |
| 公共表面 src/runtime/ui.ts、surfaces.ts、inspector.ts | 既有Surface/owner、DOM observer、焦点/模态合同 | 复用而非另造中央Runtime；公开UiApi v1不变 | ui-runtime、modal/focus/恢复、owner释放；共享原语证据成立前保留适配 |
| 公共管理 master/presentation/sugarcube | 已共享开关、隔离失败、Vue释放、场景适配 | 继续复用，按具体消费者补故障测试 | 不重试原生业务事件；不得扩大成为游戏事件运行时 |
| 正式Hub framework/official-ui/hub.ts、motion-hub/MotionHub.vue、geometry.ts | 真实Host视图/工具/拖停靠与布局，专用生命周期 | 纳管资源与坐标但保留真实工具/终态布局 | H1–H4，焦点/拖停靠/反向/owner；候选通过后退出冗余动效路径 |
| Golden Spin prototypes/golden-spin-b/{sphere,hub-motion}.ts | 已认可球体，独立GSAP/Canvas；Hub联动仍研究且工具曾整段禁用 | 冻结球体外观；V2必须处理动画期间操作，不继承旧禁用策略 | H1–H4实际工具，不以单球测试替代；星形刻纹/新轨道/菜单布局未经许可不引入 |
| 旧Floating src/floating/main.ts、FloatingTools.vue/Settings.vue | 经典入口及偏好，official renderSurface=false | 作为经典fallback例外保留，先共享偏好/释放 | 正式/经典双路径均可用后评估退出；不因官方Hub存在直接删除 |
| 商店 src/shop/main.ts、ShopReference.vue、Toolbar.vue | 专属source/transaction、Host/Resize/布局/波纹、sourceMotion | 只共享视觉生命周期/坐标；购买和事实读取语义保留 | 单次原事件、比较关闭/重入、分页、窄屏、已提交业务不可回滚 |
| 衣柜 main/WardrobePanel/ReferenceDock/outfit-layout | 真实节点搬移、专属异步渲染/缓存/observer/动画 | 纳管自有作用域；原生穿戴/预览/restore边界例外 | 原节点不复活、穿戴/搜索/抽屉/预览恢复、异步迟到；原渲染器不重写 |
| 衣柜 renderer/sidebar-preview/vendor | Canvas/render jobs；上游isolated-model与像素算法 | 自有wrapper资源纳管，上游vendor例外冻结 | 取消/缓存/卸载；不将第三方渲染算法算成自有纳管比例 |
| 战斗 src/combat/* | 多session/真实动作/选择框、Host挂载、专用RAF/Resize | 纳管自有视觉资源，真实战斗业务/系统选择器例外 | 原动作单次、恢复/聚焦/多region、实机选择框；不克隆或吞原事件 |
| 存档 src/saves/* | panel Resize、传输/元信息及Host生命周期 | UI任务纳管；导入导出及玩家数据语义例外 | 保存/载入不由动画完成代替，传输生命周期/异常/焦点；禁止自动采集私人存档 |
| referenceShelf / wardrobe-reference | Host贡献/比较、异步来源与视图 | 复用Host合同，表面/任务可纳管，来源语义保留 | 撤销/迟到/重复标识/卸载；不新增外部API |
| compat ModHub/MapleBirch/Optimization/CE/SmartPhone/ReOverfits | 自有外观适配、原属性保存/还原、源Mod入口白名单 | 仅本工程装饰层纳管，第三方业务/未知页明确例外 | 已有adapter/material/native事件测试；无专用识别不接管第三方动画 |
| compat Mouth/Lyra mouth | 资源映射，无窗口动画 | 排除视觉纳管统计，保留包合同 | 资源测试；不为了统一管理强加UI依赖 |
| story-actions | 当前默认退役能力，仍保留历史/回退代码 | 不重新启用；若未来明确批准再纳入迁移 | 默认开关/历史合同；不能将死代码算成已纳管消费者 |
| Framework Host/connect/contracts | 已有owner/mount/claims/cleanup，多个独立参与者 | 作为共用基础复用；本轮**不改对外Host API** | framework契约/peer隔离/故障清理，不建设新Host版本 |
| Framework workspace/factory/examples/component-lab | 开发与作者工具，非正式玩家UI入口 | 此次玩家视觉范围外例外；可能消费共享内部修复但不自动重做 | 原类型/构建保持；新增作者API需单独授权 |

## 已批准范围与关卡

负责人已批准上表自有视觉/生命周期纳管项及列明例外。**本表已获批准，A2/A3允许继续**，新增消费者不能默默加进范围。商店、衣柜、战斗、存档和原生dialog各自保留业务/宿主控制器；统一的是管理合同。上游游戏、第三方Mod与玩家存档不计自有资源。

性能阈值暂只使用已有确定性几何/释放门槛与本机原型观察；Windows、Android WebView、真实设备DPR/系统缩放及并窗长期性能尚未建立4.0数值基线，不编造FPS目标。现有手机/平板只有型号报告，没有实测viewport，不能按英寸推导。A0后与负责人确认设备测试安排。

A1通过只是路线验证；V1原型只有Implemented/Tested候选身份；G1/G2/G3均未通过。所有旧路径退出要求：真实消费者已转入共用实现、正负及回退证据成立、Host/原生/第三方合同保持，再删除，不能以“以后整理”永久并行，也不能在未迁移前抢删。

## 当前迁移增量

[EVO-INT-H01](EVO-INT-HUB01.md)将认可球体和240/650ms工具联动接入实际官方Hub；研究路径薄导出共享实现，自有资源归visualScope。保留原生/第三方工具与作者默认Hub，补隐藏resize、偏好、构造和清理故障回归。所有暂不需要实机的工程及仍待负责人/真实宿主/设备验收的边界见[清单](EVO-NONDEVICE-CLOSEOUT.md)。Integrated限研发官方Hub，未自动通过G1/G2/G3。

[EVO-INT-W01](EVO-INT-WEATHER01.md)将 C5.2/R10 接入实际设置天气消费者，退出该消费者旧paint/雨滴节点；原生窗口旧路径仍使用，不抢删其CSS/SVG。共用模型/时钟/材质受管，保持S01底材与交互；9组当前正例、真实像素精确反例、13入口释放及包合同通过。此处Integrated限研发设置天气首片，不改表中冻结输入，也不将原型成功替代真实游戏或G1/G2/G3。

[EVO-INT-S01](EVO-INT-SETTINGS01.md)已将认可设置V2.3接入实际设置入口，旧开窗代理和独立材质路径当批退出。五组当前正例通过，固定旧TS/Vue行为的四组拒绝/一组通过（当前CSS，非完整旧视觉）。本项Integrated限研发设置首片，不改表中冻结输入身份，不等于天气/Hub或全局G1/G2/G3完成。

[EVO-A2/A3消费者迁移](EVO-A2-A3-CONSUMERS.md)完成本轮已批准呈现资源的共同所有权接线与重复路径退出：设置/侧栏、正式窗口/天气/Hub、导航/通用面板、商店/衣柜/战斗/存档及自有兼容装饰均有实际消费者；13个根入口资源及迟到回调检查通过。既有UiApi/Host工厂、原生业务和六项调度边界明确保留。G1技术复核、原型正式接线、设备与ModLoader验收分别记录，不用此批自动替代。

[EVO-A2共享动效与设置布局资源迁移](EVO-A2-SETTINGS-RESOURCES.md)将sourceMotion内部滚动帧/环境监听及SettingsPanel布局测量/观察器实际交给visualScope；对应旧帧管理和卸载序列当批退出，单节点/peer取消与正式设置行为保留。已完成这两项资源迁移，不代表sourceMotion的所有页面消费者或已认可原型已正式整合。

[EVO-A2 视觉资源作用域首批](EVO-A2-VISUAL-SCOPE.md)使OrbitFocus和原生导航共用visualScope帧/清理所有权，删除对应局部排帧与顶层释放序列；保留原宿主、分组、业务和例外。这是两个消费者的A2/A3增量，sourceMotion内部资源已由后续设置布局批次接入；其它表面随后由消费者批次完成本轮资源迁移。

[EVO-A2 焦点坐标与反向检查](EVO-A2-ORBIT-CONTINUITY.md)使OrbitFocus迁移起点/终点共用 `navigationRect`，修复边框重复计入和失效定位；保留原动作及事件。该坐标批次未覆盖资源作用域；后续导航批次已收敛其帧/清理所有权，见上方作用域记录。

[EVO-A2-L01](EVO-A2-MOUNT-LIFECYCLE.md)让属性/社交、通用面板overlay及passage实际共用导航挂载事务；保留专用发现、内容索引、演出和宿主生命周期，退出旧独立claim/mount清理路径。这里只更新已迁移族的状态，不重写上表冻结输入身份，不宣称其余消费者或整个A2/A3/G1完成。

[EVO-HUB-V2-INPUT](EVO-HUB-V2-INPUT.md)已在隔离真实Hub组件退出整段输入禁用，完成H1–H4受控输入/生命周期检查；球体与终态布局冻结。它是V2研究增量，不将正式Hub标为已迁移或Integrated，也不更改上表的原始输入身份。


## 2026-10-24 发布前技术收口

当前Mod组合、正式消费者真实宿主证据及G1/G2/G3边界更新见[发布前报告](EVO-PRERELEASE-2026-10-24.md)。受验实现37da596，两套CI与独立下载成功；九包冻结、八包实际加载成员一致。既有A2/A3代码与六项例外保持，本批没有重新启动全UI视觉研究或扩大READ01接入范围。负责人整体关卡仍Pending。


## 4.1统一交付覆盖补充（2026-10-28）

关联#31／EVO41-INTEGRATION-01。负责人明确：滑杆、视觉/交互改善和性能工作均属于4.1优化，最终共同交付；研发分支隔离不构成部分窗口漏改的理由。本节是原消费者清单的4.1接续，不重写4.0架构验收或另建路线图。

### 首批接续前核对与当前缺口

以下为输入38a30cb时的审计；2026-10-28首批M01已解除设置门控并收窄共用overlay材质，见当前表和material-entry-receipt。天气与独立表面缺口继续有效。输入38a30cb。`src/theme/controller.ts`仍要求`data-evo41-material-review`才启用材质轴，`SettingsPanel.vue`也据此显示通透度控件；因此26d233c设置预览获认可不等于正式入口已完成接入。`framework/official-ui/weather.ts:set`只有settings创建新renderer，其他surface创建旧kw-heading-weather，必须逐消费者迁移或保留明确批准的角色例外。`acrylic-v1.css`中的普通`#customOverlay`选择器太宽，直接全局移除预览条件会命中未知第三方；`.dcu-shell`等还有独立材质层，不能据共享变量存在便记为覆盖。

### 逐消费者核对表

以下是当前待交付范围，不把代码存在、词法命中、设置通过或模拟通过当整体验收。每行接续都要补实际源码/测试/预览与对应提交；未列明完成证据即保持待整合。自有业务节点和第三方业务所有权继续保留。

| 消费者 | 真实入口/宿主 | 当前4.1接入与剩余核对 |
| --- | --- | --- |
| 界面设置（阅读/材质/入口/页面/高级，上下/左右） | src/theme/controller.ts、SettingsPanel.vue | M01正式入口去除演示依赖，设置/恢复/中断/宽窄合同及6张认可预览一致；真实游戏/设备与整合性能待核对 |
| 属性 | src/characteristics/main.ts；.dgc-overlay | M01材质已接入；CONSUMER-PREVIEW-01以真实控制器核对宽窄壳、原操作节点回退/重入；天气仍旧路径，真实信息变化/焦点/游戏组合待验 |
| 社交 | src/social/main.ts；.dgs-overlay | M01共享材质已接入；新巡检以合成内容核对宽窄壳、同节点回退/重入；真实社交动作、信息变化/焦点与天气仍待验 |
| 日志/笔记 | src/panels/main.ts；journal | M01共用壳已接入；新巡检核对真实控制器、原操作节点与笔记输入在回退/重入后保留；天气、真实笔记业务/长滚动仍待验 |
| 特质 | 同上；traits | 新巡检核对真实控制器、壳材质及同节点回退/重入；动态内容、实际折叠业务和天气待验 |
| 统计 | 同上；statistics | 新巡检核对真实控制器、壳材质及同节点回退/重入；真实数据/信息密度与天气待验 |
| 成就 | 同上；feats | 新巡检以合成长列表核对真实控制器、壳材质及同节点回退/重入；真实筛选/成就业务与天气待验 |
| 作弊 | 同上；cheats | 新巡检核对真实控制器、壳材质、checkbox和同节点回退/重入；真实分页/表单业务与天气待验，不改业务调用 |
| 态度 | 同上；attitudes与非overlay宿主 | 独立核对真实宿主、恢复与适用材质/天气角色，不能套overlay证据 |
| 游戏设置 | 同上；settings（与界面设置独立） | 待核对原生tabs/输入/系统选择框、材质及标题天气 |
| 存档/详情/传输工具 | src/saves/main.ts；.dgs-host/.dgs-native-tools | 待核对双栏/窄屏详情/原生工具与材质、天气、退出；不自动读写真实存档 |
| 服装店列表/分类/筛选 | src/shop/main.ts、Toolbar.vue；.dgshop-host/.dgshop-content | 待核对原列表节点、长商品、默认过滤、滚动/材质与适用天气，不改购买语义 |
| 商品详情/对照浮层 | src/shop/ShopReference.vue及main.ts详情/比较 | 待核对浮层材质、遮挡、关闭/Escape/取消和资源，不能复用列表单行结论 |
| 衣柜主界面 | src/wardrobe/main.ts、WardrobePanel.vue；.dgw-shell | 待核对新材质/天气角色、换装/搜索/分页、异步退出与原生恢复 |
| 衣柜抽屉/参考/预览 | src/wardrobe/extras.ts、ReferenceDock.vue、WardrobePanel.vue及runtime/surfaces抽屉 | 待逐层核对材质深度、原动作/系统控件/Canvas边界及释放，不重写上游渲染算法 |
| 战斗主面板/扩展区域/聚焦编辑 | src/combat/main.ts、CombatPanel.vue；.dcu-shell/.dcu-root | 独立伪元素材质仍需接轴；真实动作/布局/多region/选择框与适用天气待核对 |
| 官方Hub（扇形/网格/停靠/内圈工具） | framework/official-ui/hub.ts、motion-hub/MotionHub.vue | 布局/响应已有候选；材质轴的角色映射、玻璃关闭和全部工具/连续打断需组合验证，保留已认可球体 |
| 经典Floating回退 | src/floating/main.ts、FloatingTools.vue | 明确保留回退，核对显示/隐藏/偏好/释放；若视觉角色保留旧式须列原因，不假定可删除 |
| UI自有参考/对照表面 | framework/official-ui/reference-shelf.ts、src/theme/SettingsPreview.vue及参考组件 | 需覆盖停驻/浮起/关闭的材质和原节点、业务边界；原型样例不能替代实际消费者 |
| ModHub / MapleBirch / 原版优化 / CE | compat下对应四个外观包；navigation.adaptedOverlaySelector | 仅full匹配且已审宿主进入装饰，材质/天气/控件/退出逐包验证；partial/未知不接管，业务算法另保原作者合同 |
| SmartPhone / ReOverfits | compat下对应独立外观入口 | 不属于上述四包overlay选择器，须各自审宿主和控制边界后登记接入/例外，不能算在“四包通过”内 |

### 必须显式保留的边界

- 正文排版与游戏语义仍属原游戏；阅读调节及界面主题按现有合同工作，不把粒子铺满正文当全覆盖。
- Host是公共机制，其他作者/未知贡献视图、未知第三方窗口不强制套同一外观；本工程装饰层适用范围逐条说明。
- mouth类资源兼容包无窗口，保留资源/包合同，列为不适用；上游衣柜Canvas算法等继续例外冻结。
- 工具、正文、信息板、抽屉可采用不同材质/天气强度；角色差异要有设计/性能理由和对应认可，不能将未迁移改写成“不适用”。

### 统一完成条件

1. 同一份清单记录每行的材质/偏好、天气/动效、控件、原生行为、布局/输入/焦点、恢复/释放、性能与设备证据；Implemented / Tested / Visually Accepted / Integrated分开记录。旧证据仅覆盖未变内容。
2. 对首批已批准自有窗口逐个接入同一偏好与共同机制；保留100/80ms窗口节奏、默认60%/左对齐和已认可雨雪，不以削弱效果冒称性能优化。比较固定相同档位/操作/视口，性能无收益也如实记录。
3. 每行完成后再退出其旧路径。新机制仅在设置生效、其他目标仍留旧路径且没有认可例外时，4.1整体不得标为完成。
4. 分支最终汇入同一个4.1集成源码，核对实际diff和生产入口；使用无需手工预览标记的真实构建验证，不用截图、原型或分支分别绿灯代替集成树。最终CI、包、源码与验收证据必须对应同一明确提交。
5. 游戏、多Mod、Android/WebView、Windows与GPU等需要真实环境的条目保持待验，不能由Mac/Actions代签；main、版本与发行仍按明确授权执行。

### 施工接续

第一批从设置正式入口和共用原生窗口（属性/社交及各PanelKind）开始：先收窄宿主白名单、让统一偏好贯通真实材质层，再迁移适用天气/动效并做行为与固定档位性能对照；随后按表处理商店、衣柜、战斗、Hub/参考表面和各兼容宿主。每批同步#31和HANDOFF。当前本节完成的是覆盖核对与联合验收约束，未因记录计划就宣称这些迁移已实施。

2026-10-28 CONSUMER-PREVIEW-01：以上补充仅为真实UI源码＋合成原生形状DOM的巡检。入口含属性/社交及7种Panel语义，态度是正文宿主，不假造overlay；正文材质/天气未因此覆盖。1280/390是两个CSS视口，非设备实测。预览CSS只提供夹具尺寸/示例内容外观，不能替代完整游戏HTML/数据、原生模态输入边界、业务状态、性能或视觉验收。复现沿HANDOFF。

EVO41-NAV-FEEDBACK-01：按负责人反馈，属性/社交/通用overlay与正文态度/设置统一标题轻闪，删除属性relay/卡片入场和消费者独立整组高亮；有效导航控制样式及宽窄回退受检。这是栏目交互切片，不使天气、真实业务/游戏/设备或性能条目变成完成；视觉反馈看当前预览。
