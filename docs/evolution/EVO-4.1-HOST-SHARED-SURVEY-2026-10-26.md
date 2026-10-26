# 4.1 补充调查 — Host 公共能力整合

2026-10-26，调查编号 **EVO41-HOST-S01**。接入现有[性能调查](EVO-4.1-PERF-SURVEY-2026-10-26.md)和[首批计划](../superpowers/plans/2026-10-26-evo41-first-batch-proposal.md)，不是第二套路线图。P1／P2／P3是调查优先级，**均不代表实施批准**。现有顺序仍为开窗A／ModHub B → 持续天气 → 游戏调用链；本议题低于该主线。

**结论：Host 已经提供最值得共享的 owner／mount／Binding／贡献机制。当前最直接的性能问题仍在 UI 的写读批次和适配器刷新扇出，尚无证据证明搬到 Host 会更快。4.1 优先在原所有者内验证小范围协调；新公共协议、全局观察器或事件总线留待有真实消费者和收益证据后决定。**

## 1. 输入、真实依赖与边界

产品基线4.0.1：`ff428b4d385b79f6c14fada9a65301157978aa6f`；调查工作树起点 `7ac2d593cce707ecbd8eb10174592ad3513ed555`，分支 `perf/4.1-panel-preparation`。比较 `src/ framework/ compat/` 与产品基线，只有 `src/panels/main.ts` 含已记录的4.1 A1修改，其余相同。以下源码链接按当前工作树行号；panels同时注明A1关系。隔离验证则通过 `git show ff428b4:路径` 读取真正4.0.1字节，没有用候选替代发布源码。

| 层 | 当前实现、依赖和调用 | 谁拥有／不拥有什么 |
| --- | --- | --- |
| 独立Host | [打包器](../../scripts/package-framework.py#L9)产出 `StoneFreeHost-0.1.5-experimental`；[boot](../../framework/boot.ts#L6) → [createHost](../../framework/host.ts#L29) → `window.DoLUiHost`，协议 `0.1-experimental` | 无Vue／主题／游戏状态镜像；拥有参与者、声明、租约、挂载及场景失效。不是UI内置Host，也不是准备迁出的过渡副本 |
| 官方UI | [official-ui/main](../../framework/official-ui/main.ts#L17) → `connectConsumer` → `register('SoftWetOfficialUI')`／region claim → [startGameUI](../../src/main.ts#L38) → 各页、UiApi、Hub、motion | 一个官方participant向多个页面传入host/owner；各页面仍有自己的source、Vue、原节点恢复、Observer和交互所有权 |
| 外观兼容包 | ModHub／MapleBirch／SmartPhone／CE／原版优化 → `DoLGameUI.ui` API v1 → `registerStyleAdapter` → UI Runtime条目；其boot依赖目标Mod和UI，不直接依赖Host | 业务指纹／选择器／适用条件由包声明；公共标记、版本匹配、观察与撤销已经由UI Runtime实现。原版优化另有日期、叠穿业务适配 |
| 模型／资源兼容 | ReOverfits → [WardrobeApi v1](../../src/public/wardrobe.ts#L18)槽位标签及自有DOM装饰；当前Lyra嘴部包 → `maplebirch.char.use` | 嘴部包不依赖UI／Host；旧Lyra预览包监听 `dol-ui-outfit-prepared`，保留在源码但不计当前九包。它们不是同一种StyleAdapter |
| 自愿贡献 | [Host contracts](../../framework/contracts.ts#L70)的Source／View／Command；当前官方Hub提供View、referenceShelf提供只读快照，衣柜可提供参考View | 完整Source／Command演示在examples／独立研究包，不能当作官方玩家已启动的重复服务；Vue SDK在消费者侧，Host不持有共享Vue实例 |

调用关系的要点：游戏jQuery事件 → Host失效/ready → 有挂载的消费者 `onScene`；游戏DOM变化 → 页面/兼容包装饰观察器 → 自有刷新；兼容包注册 → UI Runtime映射角色 → 官方导航/天气读取适配标记。**后两条不是Host场景通知的重复副本。**

当前 [package.py](../../scripts/package.py#L1)明确转交双包生产；[build-framework](../../scripts/build-framework.mts#L11)把Host和官方UI分别构建。`src/main.ts`的无Framework启动分支和旧monolith打包路径仍在，不代表正式4.0.1缺Host时自动启动单包回退。历史Framework README中的0.1.4／3.0候选描述不覆盖当前打包事实。

正式UI manifest仍声明Host `>=0.1.2-experimental && <0.2.0`、ModLoader `>=2.100.0`、GameVersion `=0.5.12.13`及TweeReplacer依赖；声明范围不等于所有旧Host/浏览器已验证。connect当前严格要求协议等值及完整方法、views/commands布尔字段，不是任意缺能力的Host都能按子集接入。

顺序须保留：Host先invalidate，发布对象、接桥，再发host-ready；消费者先订阅ready/stopped再立即bind。官方UI先register/claim，再启动页面和UiApi；`dol-ui-runtime-ready`在API赋值后、官方Hub/motion启动前发出，外观包也先订阅再立即attach。退出按motion→Hub→shelf→原UI destroy→owner/根属性恢复执行；不能假定所有ready事件同义或把它们改成任意延迟广播。

## 2. 重复／相似实现清单

频率是源码触发规则；除下文受控样本，真实游戏每秒次数和耗时均未测。MO=MutationObserver，RO=ResizeObserver；构造实例数不等于活跃观察数。

| 项 | 源码位置与实际职责 | 触发频率、资源所有者及合并判断 |
| --- | --- | --- |
| 场景事件 | [boot:22](../../framework/boot.ts#L22)监听init/loadsave失效、end/storyready就绪；[panels:159](../../src/panels/main.ts#L159)、[wardrobe:269](../../src/wardrobe/main.ts#L269)、[combat:160](../../src/combat/main.ts#L160)、[theme:173](../../src/theme/controller.ts#L173)、[motion:147](../../framework/official-ui/motion.ts#L147)另监听end等刷新 | 每个对应游戏事件；各控制器注销自己的namespace／callback。可研究复用Host就绪通知，但事件时点、首次刷新和局部DOM恢复不同，不能直接删监听；[saves的oncloseoverlay](../../src/saves/main.ts#L138)更不是场景事件 |
| 挂载失效 | [Host:56–64](../../framework/host.ts#L56)只有一个MO，观察所有自有mount的祖先childList；[navigationMount](../../src/ui/navigation-mount.ts#L4)处理租约/挂载事务；页内额外检查root、内容和可见性 | 每次mount/release重建祖先集合；MO投递时遍历mount、清除断开者。Host拥有自有wrapper；页面拥有原节点和目标有效性。已共享，不能用Host的isCurrent代替业务Binding |
| Overlay发现与内容 | [属性/社交共同适配器:71](../../src/ui/native-overlay-navigation.ts#L71)每消费者2个MO；[panels:152](../../src/panels/main.ts#L152)3个MO用于overlay/passage/发现；[motion:141](../../framework/official-ui/motion.ts#L141)3个用于overlay/sidebar/发现 | root替换或匹配变更后排帧；多个入口重复查 `#customOverlay`。内容、属性过滤和恢复语义不同；可共享root身份发现，不能共享全部记录与刷新策略 |
| StyleAdapter观察/刷新 | [ui:73–107](../../src/runtime/ui.ts#L73)每条目2个MO（scope和浅层发现）；[ui:176–188](../../src/runtime/ui.ts#L176)一个偏好MO、一个整轮rAF；5个包声明共9条目 | 任一条目schedule最终遍历全部条目；每条目仍做目标Mod查询/选择器/指纹。owner是UI Runtime，不是兼容包各造完整引擎；浅发现可收敛、精准dirty集合可研究，宜先留UI内部 |
| 兼容包接入模板 | [ModHub:46](../../compat/modhub-soft-wet/modhub-soft-wet.ts#L46)、[Maple:32](../../compat/maplebirch-soft-wet/maplebirch-soft-wet.ts#L32)、[Phone:34](../../compat/smartphone-soft-wet/smartphone-soft-wet.ts#L34)、[CE:11](../../compat/cheat-extended-soft-wet/cheat-extended-soft-wet.ts#L11)、[优化:35](../../compat/dol-optimization-soft-wet/dol-optimization-soft-wet.ts#L35)重复API能力检查、ready监听、旧handle释放 | 首次attach及 `dol-ui-runtime-ready`；包拥有这些订阅/handles。多条目失败的保留/回滚策略、同API重试条件并不相同，适合审查后抽SDK模板，不需要Host业务注册层 |
| 专属兼容恢复 | [优化日期:111](../../compat/dol-optimization-soft-wet/dol-optimization-soft-wet.ts#L111)与[叠穿:149](../../compat/dol-optimization-soft-wet/dol-optimization-soft-wet.ts#L149)各MO；[ReOverfits:76](../../compat/reoverfits-soft-wet/reoverfits-soft-wet.ts#L76)2个MO（passage/主题） | 前两者观察documentElement subtree但过滤/断开自写；后者观察当前passages和主题。均帧合并且包退出清理；日期行身份、叠穿变量/模板、槽位语义不能合成Host状态 |
| 其它页面发现 | [shop:233](../../src/shop/main.ts#L233)2个MO；[saves:132](../../src/saves/main.ts#L132)2个；[wardrobe:265](../../src/wardrobe/main.ts#L265)1个；[combat:148](../../src/combat/main.ts#L148)1个 | DOM批次经局部过滤后排帧；商店有fastPath、存档dirty/visibility、衣柜原节点刷新、战斗多region。root范围可能重叠，检测内容不相同；不应为少一个MO丢掉必要更新 |
| 侧栏恢复 | [theme:166](../../src/theme/controller.ts#L166)1个MO检查入口失联；[layout:54](../../src/theme/layout.ts#L54)动态MO处理侧栏/遮罩；motion/sidebar另观察按钮组 | 按实际节点/内容变更触发，作用域清理。主题挂载、侧栏业务遮罩、入口视觉标记职责不同。官方模式 [floating renderSurface=false](../../src/main.ts#L60)，其经典body观察未启用；不能把旧悬浮UI与官方Hub同时计为活跃 |
| 环境监听 | [sourceMotion:48–55](../../src/ui/source-motion.ts#L48)每实例一个偏好MO及media/visibility/pagehide/resize/visualViewport监听；实际调用点为衣柜、属性、社交、panels、shop、theme、官方motion、headerWeather | 每个实例独立订阅、独立取消动画，正常完整启动源码可达8个实例（不是整机实测总数）。有共享环境通知价值，先考虑UI内部订阅器；每个owner仍须独立cancel/dispose，不变成Host动画总管 |
| 尺寸观察 | [headerWeather:85/98](../../framework/official-ui/weather.ts#L85)、[weatherSurface:33](../../src/ui/weather/surface.ts#L33)、[shop:90](../../src/shop/main.ts#L90)、[combat:115](../../src/combat/main.ts#L115)及Orbit/Hub/组件各有RO | 观察对象的实际尺寸变化才通知；有的直接wake/resized，有的帧合并。暂停唤醒、Canvas backing尺寸、顶栏占高和战斗dock坐标不同；相同parent不等于相同测量合同 |
| 计时与轮询 | [boot:32](../../framework/boot.ts#L32)100ms重试、30s截止；[theme:181](../../src/theme/controller.ts#L181)250/1000/3000ms有限重试；[天气:67](../../framework/official-ui/weather.ts#L67)可见且有surface时500ms（settings）/2000ms；[surface:29](../../src/ui/weather/surface.ts#L29)仅非managedPoll才自轮询 | Host／theme／weather分别拥有；设置使用managedPoll，生产路径已共用一个天气轮询，不是每层重复读游戏Weather。绘图rAF和商店0ms结果核对各有语义，不能合成全局tick |
| 清理/绑定/版本 | [visualScope](../../src/ui/visual-scope.ts#L2)、[presentation](../../src/runtime/presentation.ts#L4)、Host onCleanup／signals已共享；[target-version](../../src/runtime/target-version.ts#L9)、ReOverfits/优化的版本检查有部分同形；[connect](../../framework/connect.ts#L12)检查Host全合同 | scope按函数身份合帧、逆序清理；各Binding另外携带DOM/业务修订。确切版本和Loader范围规则、Host协议等值检查不是同一版本算法，不应统一为一个宽松比较器 |

[connectSugarCube/status](../../src/runtime/sugarcube.ts#L10)及[story-actions](../../src/story-actions/main.ts#L9)在当前正式入口没有调用；它们和研究examples保留为历史/可选源码，未计入玩家启动资源重复量。源码中叫Host的WardrobeDataHost等类型也不是第二个Framework Host实例。

## 3. 证据：已观察到什么，尚不能证明什么

1. 复用[Android深度调查](EVO-4.1-PERF-DEEP-2026-10-26.md)的4.0.1输入：面板索引、motion可见性、天气顶栏和focus各关联同步style slice；没有显示Host registry／scene bridge是热点。复用[Mac A2](EVO-4.1-MAC-BROWSER-A2-2026-10-26.md)：首开sync/nav/weather各3次，人工burst重复不直接证明可省布局；[A1](EVO-4.1-A1-2026-10-26.md)扫描2→1仍未测得时间收益。不能用少监听/少代码行当收益。
2. 本轮 **4.0.1原源码隔离 census**：Mac arm64、Node26.12.1、Chromium153.0.8010.12、1280×900。实际UI Runtime与5个兼容包入口在空白页面注册9条目；modUtils仅提供占位版本，无真实目标Mod DOM。21个自有MO构造、12个处于观察状态。一次无关body直接子节点添加，触发11次自有MO回调、2次实际排帧回调（UI整轮与优化包衣柜各1）、9次目标Mod查询；其中UI已有单rAF批次，但仍刷新全部9条目。21=偏好1+条目18+优化包2；12=偏好1+发现9+优化包2。销毁后自有观察实例0。**证明现有扇出，未测耗时/内存，未验证改造收益；不代表完整游戏的数量。**
3. 同轮实际Host隔离检查：2个persistent挂载经历失效后旧Binding aborted/stale；sceneReady各通知一次、挂载保留；共同父节点移除后两者清理、句柄失效，owner/Host可退出。证明现有机制能覆盖这段需求，无须先造新生命周期层；不是全部异常/异步合同重验。

快照：[结果和输入SHA](perf-4.1-host-survey-20261026/result.json)、[隔离探针文本](perf-4.1-host-survey-20261026/probe.mts.txt)、[摘要清单](perf-4.1-host-survey-20261026/SHA256SUMS.txt)。复现时把文本还原到仓库忽略的 `tests/artifacts/host-survey-20261026/probe.mts`，使用锁定依赖执行 `node tests/artifacts/host-survey-20261026/probe.mts`；只在隔离浏览器和VM内执行，不载入真实游戏。16份输入源摘要由基线git对象复核。

首次计数失败22≠21；调用栈确认额外一项是Playwright的 `InjectedScript._setupGlobalListenersRemovalDetection`，不是产品泄漏。仅预热locator不足（另一realm）；最终先初始化主世界addScriptTag助手，再计数，保留未知来源拒绝和销毁归零断言。原失败诊断仅在本机忽略目录，未反复运行挑选较低计数。

## 4. 候选及最小边界

| ID／分类 | 建议与最小接口／接入 | 收益假设、代价与前后验证 |
| --- | --- | --- |
| HC-01／P1，现有A2内 | **UI内部更新批次**：先验证首次天气挂载/标记写与可见性读分批，复用visualScope，不新增Host接口；只让有证据的消费者使用同一有效批次 | 已有style热点；省时尚未证明。无探针交错测量style/layout、同步处理、后续间隔；保留100/80ms、即时输入阻挡、焦点交接和动态替换。Host无能力替所有宿主定义“可见” |
| HC-02／P2，后续可选 | **复用既有Host场景/Binding**：已挂载消费者优先评估 `context.onScene(fn)`／`context.binding()`，替换真正同义的直接passageend订阅；不为收订阅造空mount，不立即新增全局onScene | 少原生订阅主要是维护收益；Host仍同步扇出N个listener，未证明省刷新。先订阅再在binding有效时做初读，异步前后复核；pending时等待ready，不重放旧事件。验证晚Host/晚jQuery、loadsave pending、重复ready、原节点局部替换和退出后不再接入 |
| HC-03／P2，后续版本评审 | **任意owner资源释放**：mount内继续用onCleanup，UI内用visualScope。只有多个独立参与者确实需要根资源时，才评审可选 `Participant.onCleanup(fn)`一类最小能力；释放句柄语义须另定 | 当前participant没有通用own/listen/timer接口。SDK桥接局部scope即可，勿把所有定时/RO移进Host。需能力协商、逆序/幂等、迟到登记、部分初始化失败与peer异常隔离；旧Host缺能力时保留原释放路径 |
| HC-04／P2，4.1备用调查 | **共享浅发现／精准dirty集合**：先在现有UI Runtime内部共享body/父级发现，保留每条目scope过滤；候选内部接口 `subscribeRootIdentity(callback) → off`，不是新增Host DOM协议 | 新census证明9条目的全刷新扇出，未进入真实游戏耗时归因，暂不升P1。共享观察也可能使更多记录进入每次回调；记录目标变化、每条目refresh/查询数与总耗时，测试body/root替换、portal、异步Phone、多条目同帧变化及撤销 |
| HC-05／P2，维护候选 | **消费者侧接入模板与环境订阅**：包的API探测/ready/handle释放可提炼构建期SDK；UI内部可用 `subscribeEnvironment(fn) → off`共享visibility/resize通知。均先不进Host | 维护收益可由同一生命周期合同覆盖多个入口证明，性能待测。保留各包重试/部分注册策略、每owner动画取消；不能新增强制Host依赖。兼容构建目前仅允许type import及确切visualScope，扩展允许集需单独审查和负例 |
| HC-06／P2，后续有规模再测 | **Host自身观察索引**：[watch](../../framework/host.ts#L60)每次清理重建mount祖先并重新observe，通知无schema过滤地扇出；保留现有API，先测mount/订阅数量增长 | 大量mount退出可能重复重建索引；当前未测得热点。以1/10/100受控mount和撤销波次测watch次数/时间，再决定索引或批次；不能延迟当前同步abort/claim释放、漏掉祖先移除，亦不能预先全局观察document subtree |
| HC-07／P2，独立可靠性候选 | **官方UI根退出短路**：[release:25](../../framework/official-ui/main.ts#L25)顺序调用stopMotion→stopHub→shelf→destroyUi，finally只保证owner退出/属性恢复。对基线AST中的原release表达式注入stopMotion抛错，实际跳过后三项 | 已证明异常控制流缺口，**尚未证明普通玩家会触发或量化完整UI泄漏**。建议单独评审“各阶段独立清理并汇总异常”，无需Host迁移；验证peer不受影响、根监听/帧归零、失败重连和原生恢复。此次仅记录，未修复 |

HC-01沿用既有A2优先级，不添加新P1 Host迁移；**目前没有同时满足“Host集中化直接位于性能证据中＋低风险方案＋收益对照”的项目。** HC-04/05如不能证实收益，应停留调查或保持现状。

负责人于2026-10-26确认将 **HC-07 官方UI根退出清理短路** 纳入4.1问题记录。状态为「已记录／待独立修复方案审阅」，保留P2分类，不阻塞现有性能主线；这次确认不代表批准修复、Host迁移或协议变更。

## 5. 必须保留的合同与集中化风险

- **公共接缝**：Host协议/声明版本范围、`window.DoLUiHost`及ready/stopped、参加者ID/资源ID、Source/View/Command和binding失效语义已是可被外部使用的实验合同；不是随意可改的内部Map。UiApi v1、WardrobeApi v1、runtime-ready、style标记与各兼容包指纹也有真实消费者。visualScope、navigationMount、DOM索引、native source/guard与DoLWardrobeUI等内部入口不因被自有包引用就自动成为新公共协议；优化包的内部依赖要明确留作耦合债务。
- **注册/退出**：Host重复participant/mount拒绝，claim先到先得且不排队/抢占；View撤销关闭其全部实例，旧Source/Command句柄不能命中同名新注册。订阅通知不是持久事件日志、不是自动初始快照；不能在合并队列后吞init/loadsave或把旧binding变成新binding。各包先清自己handle再重接，清理仅恢复仍由自己拥有的属性，不覆盖第三方新改动。
- **故障/降级**：未知Host不覆盖；缺Host、协议不符、方法/能力缺失、初始化失败由connect诊断并退让，官方UI不启动、原生游戏保留，不是悄悄安装另一Host。Host停止触发官方UI退出，消费者包仍可等待下一Host，明确dispose才取消等待。兼容包缺UI时不强制接管原页；不存在任意旧浏览器保证。`:onloadsave`是已验证DoL接缝，不是泛SugarCube保证。
- **Source/View/Command**：Source返回有限大小、复制冻结的按需JSON，不做整个State实时镜像；View只拿自己的挂载上下文；Command的busy按声明隔离，已分发后异常/失效返回unknown，绝不自动重试。不能把购买、保存、装备、ModHub安装/更新塞入通用Command并宣称事务安全。UI内部的各个source并未全部实现Host Source协议，不强制迁移。
- **自愿参与有边界**：外观包有destroy，ReOverfits有mapping销毁；Host作者可自愿register/withdraw/dispose。未参与第三方不受claim保护。当前Lyra嘴部包的目标char.use没有本包提供的反注册入口，整包停用需依Loader/重启，不能承诺所有兼容逻辑安全热退出。没有理由给它强加Host或UI依赖。
- **中心化成本**：Host的同步notify会让慢listener阻塞其余消费者；异常隔离不隔离CPU耗时。场景/变更合并增加顺序、重入、初始通知和缓存失效复杂度；共享MO可能扩大记录分发，引用计数失误可使所有消费者失效。共享状态只保留owner、能力、代次等机制元信息，不集中DOM业务索引、游戏变量、几何快照或第三方状态。现有Host的祖先索引和JSON复制也会随规模增长，新增机制前必须测它本身。

单UI Mod分发与内部Host解耦**原则上兼容，但当前未实现单包**。若未来批准，只改变装配可同时保留独立内部机制：统一启动/退出顺序、单实例发现、已有外部Host优先且不覆写、旧双包混装策略、Loader身份/依赖迁移均需专门设计和实测。不能仅把两份index拼起来或把依赖从manifest删除。本轮维持双包与既有范围。

## 6. 阶段建议与不合并项

| 阶段 | 建议 |
| --- | --- |
| 适合4.1现有安排 | HC-01只作为现有A2；HC-04可低优先补真实adapter刷新归因，HC-05可先审查维护合同，HC-07单独提交候选审阅。都不抢占A/B主线，不因本报告直接排开发任务 |
| 后续版本更合适 | HC-02跨独立消费者的场景协议使用收敛、HC-03 participant级资源扩展、HC-06大规模Host索引；单包分发策略。先拿消费者、规模、失效与迁移证据，再决定API/版本，不要求本轮一起做 |
| P3，当前保持独立 | ModHub依赖推断/签名/更新缓存与异步current()；第三方状态/叠穿/日期修复/嘴部映射；具体动画、天气规则/材质、绘图时钟、焦点策略、购买/存档/穿戴事务；不同宿主的可见性/坐标算法；默认未启动的历史入口。低共享收益或业务/隐私/生命周期耦合成本超过收益 |

后续每个候选需沿用已有framework-connect/startup/commands、ui-runtime-compat/regressions、evolution-owner-resources、panels-framework/official-game-motion及兼容包合同，选择受影响子集并补真实旧缺陷负例。对照固定源码、Mod组合/同场景/视口/偏好：先核对单次原事件、注册/清理与失效，再无探针交错测查询/通知/重绑定次数、style/layout和主线程耗时；分析器归因另采，父子片段不重复相加。不因观察器数少就宣布成功。

**未解决**：真实活跃adapter/participant规模、重复监听的现场时间占比、共享发现的总记录成本、场景回调顺序依赖、根退出异常的完整残留/重连影响、单包迁移策略。缺现场数据的项均为假设，Mac隔离检查不替代Windows、Android WebView或完整多Mod验收。

本轮实际执行基线差异/调用点检索、源码阅读、隔离probe退出0、16份基线SHA及快照核验、文档链接/差异检查。此前179c80f的两套成功CI仅复用为未变运行实现背景，不算本调查新CI；没有改产品/Host/兼容源码、锁、包、协议或依赖，没有新触发CI、Issue任务、合并或发布。调查记录为文档候选，等待后续取舍。
