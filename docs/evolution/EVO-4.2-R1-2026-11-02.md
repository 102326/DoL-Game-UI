# Soft & Wet 4.2 — 首批小样、最小联合探针与CI研究

初始日期：2026-11-02；Study 02更新：2026-11-04。承接 [计划V1.5](../superpowers/plans/2026-11-02-soft-wet-4.2-r1-review-plan.md) 和 [R0](EVO-4.2-R0-2026-11-02.md)，不另建路线图。分支 `prototype/4.2-first-samples`，基点main c7d8bac。旧文档工作安全带入；Study 02已于11月4日随运行源码提交8da7f44推送，后续文档仅补交付回执；实际结果在本页更新，不由原型存在推导通过。**负责人指出首版差异难以感知；本页早先的“小样已实现”只指工程试验已交付，不表示区分度或视觉方向达标。以下校准为后续设计依据。**

## E42-PERF-02 第五批 / CI42-S2隔离探针（2026-11-04）

接续 `dffc98d`。继续本体性能第一，同时完成已授权的CI隔离样本验证；没有推进第三优先的新视觉小样。

### 本体可见性读取合并

`headerWeather.refresh()`原先在读取天气、更新各surface、决定下一次轮询时重复调用showing。实际设置稳定雨态8次refresh，标题getClientRects调用24次；新回归在24≠8失败。现在每轮先取得可见surface集合，再更新renderer/属性，后续使用同轮集合与仍存活surface交集决定轮询。每轮仍重新查询前景和几何，不引入跨轮可见性缓存。

最终同一输入：标题查询8次、同值属性写入0次；已有resize探针仍0次画布重置/8次绘制/像素一致。这里只证明查询调用减少，不代表每次查询都会强制布局，也没有测量总体帧率/布局耗时。常规删除、暂停恢复、legacy/material共存与轮询周期保留。同轮处理中的后续可见性变化在下一refresh/观察回调重新判断；静态审查未发现常规写入会同步改变另一surface可见性的路径。

Mac arm64/Node26.12.1/锁定Chromium：`evolution-weather-integration.cjs`9项W01、`header-weather.cjs`、`npm run ci:check`、测试vue-tsc及diff检查通过。Terra/high独立只读审查无阻断；shared header测试保留原生输入、共享天气、尺寸变化、timer stop及清理。Expected Lock只更新天气集成entry摘要及断言数。无远端整轮CI、真实游戏/Windows/Android、GPU/功耗结论或发行。

### CI42-S2：人工计划/依赖/统计离线校验已落地

新增隔离脚本 `scripts/research/ci-selection-probe.mts`，不由workflow、runner或gate调用，不自动选择真实diff。复用生成catalog及其research.dependencies，统一research前缀；检查ID存在/重复、人工声明消费者、传递前置、终态集合与计数。输出事实源SHA-256和缺失前置路径。

有效**合成**样本8 selected / 8 terminal / 6 executed：5个settings研究链PASS、source-check FAIL、framework-build与settings-ci BLOCKED。这里的6是虚构样本字段，实际没有启动任何CI测试。有效指样本结构被接受，并非CI成功（样本本身含FAIL/BLOCKED）。7类负例分别拒绝：漏间接baselines、漏人工消费者、未知ID、重复ID、漏终态、重复终态、错误计数；遗漏baselines保留两条study→build→…路径。

复现：项目Node26下先`npm run tooling:build`，再`node scripts/research/ci-selection-probe.mts`。主代理实际运行退出0，并以`tsc --noEmit --module nodenext --moduleResolution nodenext --target es2022 --allowImportingTsExtensions --skipLibCheck scripts/research/ci-selection-probe.mts`检查通过。子代理初稿直接导入CTS被strip-only限制拒绝，改用既有生成CJS；初次CLI类型检查发现catalog联合类型，增加运行时research dependencies断言并收窄后通过。没有更改全局类型配置或引入依赖。

边界：仅研究profile的人工示例，**不证明真实变更消费者完整性，不验证源码身份真伪、执行顺序、PASS证据或安全门禁**。输出SHA供复核，不是身份认证；standard尚未适配；7类结构负例不等于既定14场景影子验收完成。下一CI切片应将实际改动的人工影响清单作为输入，与现完整profile离线对照，扩展缺报告/零断言/错误身份等已有故障样本；接门禁仍需另行评审。

最终SHA-256：weather.ts `b0ea7d3989efb3cdfe3c8fe4c1dabd86dc82907f342bbb5f4ffd37f23dcd3373`；天气集成测试 `cbaba62679d9edc587ae4e81a35b4ecd405fcfadef74fedb8862243ee864fb61`；离线探针 `547c1e85597f0b5302ec9353ec5966fb298848ae7753c14ecceb325e428542e1`。Git/Issue #35记录实际提交身份。

## E42-PERF-02 第四批与CI并行调查（2026-11-04）

接续 `79ae13d`。负责人确定三条线优先级：**UI Mod本体性能第一、CI优化第二、新UI设计第三**；独立研究允许并行，不能挤占高优先级修复。计划V1.7同步此顺序，兼容Mod专项仍后置。

### 本体：天气共享刷新同值写入

`headerWeather.refresh()`在每次共享刷新时无条件写入material canvas的data-weather、data-rain、data-special。真实设置、稳定雨态8次owner.refresh，MutationObserver记录24次属性写入；旧代码在新增0次断言上失败。现在逐项比较DOM现值，只在不同才写，继续执行renderer.refresh，保留源状态变化和被改写属性恢复，不使用可能失效的外部缓存。

最终受控值：写入0次；将data-weather改为tampered后refresh恢复rain。此前同尺寸resize仍是0次重置、8次绘制、samePixels=true。Mac arm64/Node26.12.1/本机锁定Chromium：`node tests/evolution-weather-integration.cjs`全部9个W01 checkpoint通过，`npm run ci:check`、`vue-tsc -p tsconfig.test-tools.json --noEmit`和diff检查通过。Expected Lock仅该entry摘要及断言数287→289变化。没有整体帧率/实机收益结论，没有远端整轮CI、main合并或发布。

最终源码SHA-256：weather.ts `fbeae62c78df01ffb4c46602ff831c5ae3a3bbc4d084f23204095453ce9d424b`；evolution-weather-integration.cts `97426a8700ce768e6ea50d84c26233659e1a5a3a1251e8519474aade21786488`。

### 第二优先：CI42-S2依赖边界复核（离线，不是CI运行）

Terra/high只读调查后，主代理读取实际代码并用Node26导入现有catalog/dependenciesFor离线复算：

- research catalog ID含`research.`前缀，dependenciesFor返回不带前缀的执行ID；standard没有同类dependencies字段，不能直接套同一个键集合。
- settings-study的前置闭包为settings-build、settings-prepare、settings-baselines、settings-types（此为集合，执行仍须按前置拓扑顺序）。漏settings-baselines时有两条缺失路径：study→build→prepare→baselines及study→build→types→prepare→baselines。
- `scripts/ci/research-runner.ts`当前用`dependenciesFor(check.id).filter(id=>selectedIds.has(id))`再判断canSchedule；离线重算缺baselines子集，settings-prepare看到的dependencies变成空数组。因此“支持传checks子集”不等于已保证选测安全。未调用runner/执行测试，未证明实际Actions发生过漏选或假绿；现完整profile不因此判故障。
- 此依赖图只表达部分直接执行前置，没有源码影响图/间接消费者发现；不能拿前置闭包冒充覆盖完整性。standard/research同命令不代表同合同。

下一最小隔离切片：复用catalog检查人工场景ID/重复项、递归执行前置、人工列明的间接消费者和终态数量守恒；输出缺项及路径。不另建协议/路线图，不接workflow/gate。至少保留三类负例：漏间接baselines、漏人工已声明消费者、未知/重复ID或终态重复/缺项。该样本校验不是全局影响分析器；依然需要14场景影子结束条件与源码/结果身份核对。

本批CI只有源码调查与离线图复算，无选测器实现/CI迁移/时间收益声明。第三优先视觉未新增小样，继续原作来源对齐，作废候选不复活。

## E42-PERF-02 第三批：本体天气画布重复重置（2026-11-04）

接续 `3405a52`，研发分支 `prototype/4.2-first-samples`。负责人明确先完成UI Mod本体性能，再向兼容Mod扩展；共用路径仍维护兼容合同，本批未专项修改兼容包。

- **真实复现**：实际设置天气集成夹具，reduced-motion稳定雨态，连续8次同尺寸window resize，`weatherSurface.resized()`每次重设Canvas width/height，`wetGlass.draw()`又裁回雨天标题区。旧代码24次backing-store赋值、8次绘制，前后像素完全一致，新回归在24≠0失败。
- **修改**：记录上次成功应用的目标像素宽高及DPR；仅首次/目标变化才重设backing store和transform。比较目标而不是当前canvas.height，避免将材质主动裁剪误认为尺寸漂移。零尺寸时不更新已应用缓存。每次有效resize仍调用draw/request，保留既有布局失效及资源管理机制。
- **最终证据**：相同8次通知得到0次重置、8次绘制、前后画布像素完全一致。新增DPR变化但像素宽度取整相同的回归，transform正确更新。不得将重置次数减少外推为整体帧率、GPU内存或耗电收益；没有做这些测量。
- **验证**：Mac arm64 / Node26.12.1 / 锁定Playwright Chromium；`node tests/evolution-weather-integration.cjs`通过全部9个W01 checkpoint，涵盖四档雨量、雨雪中断、正文与关闭按钮像素保护、原生偏好输入、缩放/窄屏旋转、零尺寸恢复、隐藏/关闭重开、销毁、静态降级及抛异常清理。`npm run ci:check`、`vue-tsc -p tsconfig.test-tools.json --noEmit`、`git diff --check`通过；Expected Lock仅此测试条目摘要/断言数282→287更新。
- **审查**：Terra/high只读追踪settingsWeather→wetGlass及雪/特殊天空的context save/restore，未发现依赖每次resize重置的状态；保留首次有效尺寸初始化和DPR更新。现有固定像素测试不等于任意控件移动保护验收；Canvas context loss/外部改写不在本次覆盖范围，未新增恢复协议。
- **范围**：没有调整天气密度/质量/动画时长或Host协议，没有向兼容Mod扩展新设计。未跑远端整轮CI、真实游戏、Windows/Android/WebView或GPU/功耗基准；性能主线仍未收口，下一步继续本体刷新扇出和后台工作核对。

最终源码SHA-256：`src/ui/weather/surface.ts` = `379eb93605d0dee6fe9d611cdc5bb6c1375d91690400269525ed02ec1ababac3`；`tests/evolution-weather-integration.cts` = `cd1573ecbb0464dfd9c5874691634c0860d6cc0dc4eed40e11ae2de5ef92647c`。提交身份以Git和Issue #35回执为准。

## E42-PERF-02 第二批：重复反馈与Hub等待实测（2026-11-04）

接续 `cafaf87`，仍在 `prototype/4.2-first-samples`；主代理实施，Terra/high独立只读核对Hub门槛与最终diff。

### 本批修正与反例

1. **同位置重复焦点装饰**：Hub同一按钮收到pointerover后再收到focusin，会生成一次无位移的560ms moving-focus；移至第二按钮再focusin，又取消/重建同位置装饰。现在只有新旧矩形不同时启动移动装饰。受控真实Chromium、合成事件复现：旧累计动画数 `same=1 / moved=2 / repeated=3`，修正后 `0 / 1 / 1`；真正跨位置的反馈仍执行。运动中矩形确有变化仍允许执行，此结果不代表所有重复特效已经消除。
2. **关闭动效仍做样式读取**：`response()`在`sourceMotion.animate`检查enabled前已读取两次装饰用computedStyle。现在提前复用同一`motion.enabled()`条件，旧测试`disabledStyleReads=2`、新测试`0`。只跳过装饰，原生点击、窗口识别、焦点恢复与业务动作路径保留。新增负例直接覆盖visualMotion关闭；reduced/页面隐藏条件来自同一已有enabled实现。

### 等待分类与本机证据

- 共用开窗100ms、关闭80ms是opacity反馈；原生关闭立即执行，现有官方窗口合同继续通过。`settle`双rAF用于事后窗口核对，未据此推断业务动作被阻塞。设置分类20ms渐入前先清inert，leave立即done，本批只复核源码，没有新增设置端到端延迟采样。
- Hub没有等待650ms球体动画结束才显示工具。240ms工具展开与球体并行；工具t>=.65且几何有效/仍在展开时恢复命中，辅助按钮q>=.85。按下/键盘focus-visible暂停位置是防止目标在输入事务中移动的安全机制，本批保留这些阈值和时间。
- 在现有Hub输入夹具内，程序化ball.click启动，逐rAF检查pointer-events、tabIndex、祖先inert和中心点实际命中，三次最终样本（ms）：

| 样本 | 首个工具可命中 | 首个辅助按钮可命中 | 展开收束 |
|---|---:|---:|---:|
| 1 | 65.6 | 99.0 | 248.8 |
| 2 | 63.0 | 96.3 | 246.3 |
| 3 | 63.2 | 96.5 | 246.4 |

这些是有仪器开销的Mac受控页面帧粒度观测，不是物理输入端到端基准，不含真实游戏/Android结论。没有修改Hub运行时代码，不能声称本批缩短了Hub等待。只采首个工具/辅助按钮，未遍历全菜单。独立审查指出繁忙主线程可能在同帧观察到可命中与收束，因此移除初稿严格“必须早于收束”的时间断言；诊断不充当性能门禁，原有真实输入合同保持。

### 验证与接续

Mac arm64、Node26.12.1、本机锁定Playwright Chromium：`official-game-motion.cjs`旧代码在新断言上失败、新代码通过；`golden-spin-hub-input.cjs`最终8组输入合同通过（鼠标单次动作、键盘、取消、连续反向、拖动停靠、窄屏触摸模拟/缩放、reduced/隐藏恢复、销毁重挂）。`npm run ci:check`通过；最终测试工程vue-tsc、Expected Lock检查、diff检查通过。锁只更新两项测试摘要与官方动效断言数135→136，Hub既有39处断言不减少。没有新增远端整轮CI，仍按批次集成/封板门禁执行；未合main或发布。

最终来源SHA-256：motion.ts `ce613abd9ec542e279db8d269769c52339650b9594882c6bf13af1f582316ff7`；official-game-motion.cts `4b0c330bd1694cb17c87f0bdfa665a49c730693673c2002b44ccbe78b23719af`；golden-spin-hub-input.cts `cbd877844326d5502ed51e41f1c3298bfed1165ec81e856bfad8b60576d496e5`。

下一批优先追踪实际重复刷新、观察器/布局读写、天气后台开销及低帧率下命中体验；全链路延迟和帧率收益仍待测。不以本批两个小修正宣称性能专项完成。原始截图/日志在忽略的tests/artifacts，本页保留可跨机复现的命令、摘要和数字。

## E42-PERF-02 首项修正：合并同帧窗口核对（2026-11-04）

接续源码 `994fcab`，研发分支 `prototype/4.2-first-samples`。本批修改真实共用窗口路径，不涉及被否决的视觉小样。

- **复现与根因**：`startOfficialMotion` 的 `later(callback)` 每次创建新的包装函数，破坏 `visualScope.frame` 已有的按函数身份去重。受控 Chromium 中同帧 8 次独立 MutationObserver delivery，旧实现执行 8 次 `syncOverlay` 入口查询，并分别进入导航刷新；并非 8 个必需业务动作。
- **修正**：实例私有 WeakMap 保留 callback 的守卫函数身份。稳定的 `syncOverlay`/`sidebar` 可合并同帧任务，仍在执行时检查 live；既有取消、释放、重新排队和 settle 双帧语义不变。不新增框架、定时器或 Host API。
- **观测结果**：同一受控输入从 8 次核对降至 1 次；取消后第一帧重排一次，场景收束在第二帧另执行一次。这里是工作次数证据，不能外推为整体加速87.5%、帧率改善或Android耗电结论。取消测试核对执行时序和次数，未直接断言每个属性变化对应的最终业务DOM。
- **已执行验证**：Mac arm64 / Node26.12.1 / 本机锁定 Playwright Chromium；`node tests/official-game-motion.cjs`（先旧实现8≠1失败，再新实现1通过；最终包括取消重排断言）、`node tests/source-motion-lifecycle.cjs`、`npm run ci:check`、`vue-tsc -p tsconfig.test-tools.json --noEmit`、`git diff --check`通过。真实浏览器合同保留原生单次动作、100/80ms窗口反馈、关闭中断、master/reduced gates及资源清理。
- **过程失败**：首次浏览器启动被沙箱MachPort权限阻止，获准沙箱外运行受控夹具后完成；首次ci:check因测试源码变化触发ExpectedLockDrift，生成后只该entry摘要与断言数133→135改变；曾误用普通tsc检查Vue测试工程产生模块解析错误，改用项目指定vue-tsc通过。均未通过重跑掩盖产品失败。
- **独立审查**：Terra/high只读检查实际调用、去重/取消/释放边界、测试时序及锁摘要，无阻断意见；未代替运行测试。
- **覆盖限制/下一步**：未跑远端整轮CI、Windows/WebView、真实游戏、GPU/功耗及端到端延迟基准；当前只是第一项可验证的重复工作修正，性能专项未收口。继续测量重复装饰反馈、Hub可操作门槛以及适配器/天气刷新，不凭动画总时长判定输入等待。主分支、版本、发行、保护规则未改。

最终代码/测试身份（文档提交号以Git和Issue #35回执为准）：

| 文件 | SHA-256 |
|---|---|
| framework/official-ui/motion.ts | `2b0284be829e716d6c73c09dbd5b7825415dca6c9ee56814cb759d54637bc7d2` |
| tests/official-game-motion.cts | `9e8238faf3acd79c5a0e9658c0dd2f2f9f0ac45f6960a55fe69392a286989fbb` |

## 性能优先接续与首轮路径核对（2026-11-04）

负责人提升优化优先级，并澄清本轮没有具体外部反馈材料：当前入口是负责人观察到不必要特效、隐藏加载延时和整体性能问题。更新同一计划为V1.6，先性能诊断/有证据的局部优化，后续视觉重提；不等外部报告、不默认关闭天气或降低画质。

本轮读源基点6048a6c，src及现役official-ui/motion-hub运行路径与正式main c7d8bac一致；4.2作废原型不进入4.1基线。以下只证明实现/调用位置，不证明实际生效成本或卡顿根因。

| 候选 / 位置 | 已读到的实现 | 下一最小验证与边界 |
| --- | --- | --- |
| W01 共用开窗：framework/official-ui/motion.ts:25–26、84–123；src/ui/window-fade.ts | 点击后的补充sync走两次rAF，观察器另可调度；共用开/关为100/80ms，并非统一600ms等待 | 记录原动作、首个可见/可操作、各sync触发与实际读写；两帧调度可能是稳定布局前置，不能直接删除 |
| E01 重复/长尾反馈：official-ui/motion.ts:110–141；source-motion.ts:40–45 | 广泛点击有360ms反馈，部分tab路径720ms；Hub工具间/Bedroom→商店存在560ms移动焦点装饰调用 | 一次实际动作的动画/几何/绘制记录，区分必要点击确认与重复装饰；时长不等于阻塞时长；未作移除决定 |
| I01 Hub输入门槛：src/ui/golden-spin/hub-motion.ts:52–70、94 | 工具t>=.65才interactive，辅助按钮q>=.85，展开/收束满程240/220ms | 动态坐标/命中与键盘核对，测实际可操作时点；缓动进度不是固定毫秒，不能凭乘法算等待或取消防误触 |
| R01 扇出刷新：src/runtime/ui.ts:176–179 | 同一rAF内surfaces.refresh并对全部entries.refresh | 固定活跃适配器与变化输入，测调用/查询/样式成本及失效正确性；未证明是当前热点，不自动移入Host |
| B01 天气/资源：official-ui/weather.ts:41–75；src/ui/weather/surface.ts | 已有共享500ms/legacy2000ms更新、hidden暂停、foreground处理、释放；surface可独立轮询 | 检查遮挡/静止/隐藏/重开与多窗口的真实资源；不能因看到定时器就认定重复或永远后台运行 |

排除误判的例子：SettingsPanel.vue:39–46现为20ms分类淡入，leave立即done、enter先解除inert；shop/main.ts:226/236的0ms任务承载原购买结果/数量核验；Host有限启动重试、消息2200ms消退、图片15s超时各有不同语义。source-motion中的820ms relay/helper或遗留480/560/620ms CSS，须先证明现役调用及样式生效，不能按源码最大数值汇总为加载延时。

已查GitHub现有Issue/记录，未获得与本轮观察一一对应的新增4.1外部卡顿复现；不把旧#28、已发布#31或已关闭#33当作新案。旧4.0.1 trace、ModHub1.8.3数据与4.1已集成缓存/分层分别记录。没有改产品运行代码、计时器、默认特效、Host或CI；没有运行新的性能基准/浏览器/实机，不宣称以上候选已被复现或优化。

## 最新负责人裁决：当前设计作废（2026-11-04）

负责人明确“这版的设计作废”，并质疑背景白色柱状/条块与Claude来源的关系。**当前Study 02/03视觉候选停止推进，不再作为待采用方案或后续迁移基线。** 下方实现、测试及媒体保留为历史实验；工程PASS不能撤销视觉否决，也不能通过只删亮条就宣布新方案通过。

来源核对：当前预览的标题、按钮、说明与合成正文由Codex编写；浏览器可见这些内容经过backdrop-filter透入设置窗口，形成发白条块。`prototypes/evolution42/style.css`另外含Codex编写的舞台重复线、镜面光带及应力条纹。Claude附件确有镜面带、应力条纹和窗光的设计元素，但本版具体画法、比例、层级及最终组合由Codex适配，不能把当前全部视觉归为Claude原作，不能认定用户看到的“白柱”是原方案要求。对用户所指每一根亮条没有截图逐根对应，本次只记录实际观察，不冒称已定位所有像素来源。

后续先重建原附件→本项目适配→Codex新增的明确对应，回看原方案实际效果后再提出小范围候选。尚未新建替代方案，也未授权把作废候选合入正式UI。原4.1生产代码、Release和Claude附件不变；Hub与恢复等工程成果保留评估，不由本轮视觉裁决自动认定正式采用。

## Study 03：第二窗口与本机恢复合同（2026-11-04）

负责人继续授权不依赖Windows/实机的工作；本批提前补第二结构的工程可行性，不代表已选定或视觉认可A/B方向。沿同一分支接续e368f1d，实际执行于未提交树，下面的输入摘要绑定受测文件；源码及媒体已推送为[`a0fda0f`](https://github.com/102326/DoL-Game-UI/commit/a0fda0fd87706067c08914e1d860cab2c8208af9)，GitHub作者/提交者均为Codex bot；[#35](https://github.com/102326/DoL-Game-UI/issues/35#issuecomment-6623655879)已同步，后续回执仅改文档。

### 第二角色：实际商店详情

- `prototypes/evolution42/main.ts`按实际DOM分别纳管设置、商店工具栏、目录、详情；沿用同一materialStudy，不新建生产公共协议。工具栏/目录只承载静态材质，不写位移/缩放，避免改变窄屏固定详情的定位祖先；详情标题可拖，真实详情正文作内芯。
- `material.ts`允许角色、实际core和静态承载；商店详情采用CSS伪元素光层。真实商店会收编未识别的直接子节点，故不向详情插入装饰DOM，不夺取原节点所有权。所有原事件、购买回调和控件保留；购买仅为合成回调、钱值不变，不是实际交易验收。
- `shop-fixture.ts`只补隔离合成页面缺失的真实`#shop-list-pages`载体、长说明和配色控件。生产商店控制器仍负责列表/详情、原生picker和窄屏popover。研究舞台高度按实际顶部位置计算，三种材质相同；不改游戏布局。
- Hub新增旧位置键只读初始化、损坏/未来版本位置回退、研究键setItem受控抛错后继续操作及重载恢复。旧键字节保持不变，不宣称已完成生产存储迁移或物理存储故障覆盖。

### 实际结果与保留的失败

macOS arm64、Node26.12.1、锁定Chromium153.0.8010.12。最终设置9项PASS／13个输入摘要；Hub8组PASS／9个摘要；商店7组PASS／5个摘要。pageerror均空；vue-tsc及严格Node工具tsc通过。命令见[原型README](../../prototypes/evolution42/README.md)，逐项结果及源摘要见[Study 03验证记录](../media/evo42-study03/validation.json)。这不是原有全量CI或干净提交上的新远端Run。

商店覆盖1280/390 CSS px × baseline/edge/force六组，另有390px强制showPopover失败的受控回退。断言核对实际详情owner、非零位移、受力内芯、拖动当时几何、原生picker及顶层/回退、原节点/单次动作、切回基线、关闭重开、活动拖动切设置和销毁。原生API受控失败不等于所有旧WebView已验。

失败及修正未隐藏：

1. 前批只有商店参考，没有真实材质owner，新断言直接失败；本批补实际角色。
2. 泛用合成夹具缺真实列表载体，商品被收进原生头部；仅修隔离夹具。预览详情初始超出舞台，首次小拖动被向上约83px夹回；修共用舞台可用高度后，三种宽屏材质同样输入均为x=25/y=8，不再首拖跳变。
3. 一次详情拖动断言失败、同输入诊断又通过，最初原因仍未完全确定。现先滚动标题并检查实际命中；另以短详情正文+底部滚动构造标题被裁剪的反例。没有靠加sleep、放宽移动阈值或反复重跑冒称解决所有flaky。
4. 审查指出空集合every与重开后几何可能假通过，已改成显式owner存在、实际移动和重开前的拖动矩形；跨窗前明确断言dragging=true。独立审查未发现新实现阻断，未代替实际测试。

[商店评审页](../../prototypes/evolution42/shop-review.html)提供三材质静态图和两段B方向宽窄原速视频，共3,281,550字节媒体；不是旧/新配对性能基准。Study 02媒体保持原样。商店仍用原有天气路径，未补详情独立天气renderer，不冒称完整P-C或全角色天气通过。

### C0/C1只读补充：现有catalog与历史成本

复用现有`ci-catalog.cts`、`research-families.ts`与Expected Lock。当前标准88个entry、研究41个entry，其中12对执行命令向量相同。**同命令不等于可安全删掉重复合同，也不等于已经节省时间**：profile、结果身份、case与证据路径需分别核对。标准settings是composed、含19个case；其checkpoints空数组不代表零断言，研究settings的settings-resources检查点也不能直接替代19个case。

现声明依赖：settings-ci、source-motion-lifecycle均经framework-build依赖source-check；golden-spin-hub-input目录声明无前置，不代表运行环境无前置。本批原型检查尚未进入catalog；现全量工作流不会自动给本候选签字。机器可复算的清单/12对命令及事实源摘要已放入上述validation.json的offlineCiSurvey，未引入执行选择器。

| 历史样本 | 首个job开始至最后job结束 | 主要已记录step耗时 |
| --- | --- | --- |
| main标准 [41401340265](https://github.com/102326/DoL-Game-UI/actions/runs/41401340265) | 707秒 | 类型27、单元33、构建89、包94、浏览器397秒 |
| PR标准 [41352769456](https://github.com/102326/DoL-Game-UI/actions/runs/41352769456) | 817秒 | 类型34、单元39、构建111、包122、浏览器434秒 |
| PR研究 [41352769411](https://github.com/102326/DoL-Game-UI/actions/runs/41352769411) | 531秒 | 受控研究466秒 |

数据重新计算自既有[R0快照](EVO-4.2-R0-SNAPSHOT-2026-11-02.json)，不是本批新运行；链路包括已开始job间等待，不包括提交前后排队、Codex阻塞或修复轮次。证据核验step分别1/2/1秒，不能把它说成主要提速来源；包内子阶段没有独立计时。尚无新选测端到端收益数据，不估算节省比例。

下一最小候选仍是离线计划/报告样本校验，另行选定后实施；本批未改catalog、Expected Lock、runner、producer/verifier/gate、工作流或保护规则。保持既有14场景影子结束条件与有效变更端到端指标，不新增平行路线图。

### 边界与接续

本设备已补第二角色、恢复/回退及对应原速媒体；尚待负责人视觉比较，随后决定是否正式采用及消费者迁移。Windows原生弹窗、Android/WebView触控/软键盘、真实游戏业务、GPU/功耗和完整P-C保持未验证。未合main、发布、更改Host合同或增加强制依赖。

## Study 02：自由悬浮与Claude材质适配（2026-11-04）

负责人明确继续并同步GitHub。本批在既有研发分支实施，没有进入生产src/framework/compat、Host协议或CI迁移。11月4日fetch确认origin/main仍c7d8bac，前批未提交内容完整保留后接续；源码与媒体已随[`8da7f44`](https://github.com/102326/DoL-Game-UI/commit/8da7f44648b16930f8a8df28d135af8500f9ed54)推送，GitHub回读commit及#35正文一致，作者与提交者均关联Codex bot；随后文档回执不改受测代码/媒体。

### 实际做了什么

- **E42-JEL-01 / P-B**：`FreeHub.vue`是实际MotionHub的隔离消费者适配，继续使用原Host/View、球体与工具动作。A直接自由拖放；B允许有限甩动、阻尼和边界衰减。球体松手不自动回侧边；内侧停靠按钮仍可主动使用，键盘左右改为24px微调。中央与四角菜单沿现有可用空间几何展开。
- 丝线现在牵引**真实球体**，具有锚点、延线与牵引阶段。页面“召回到默认位置”或内侧“恢复位置”明确指定默认锚点，重新抓取立刻接管；没有装饰替身。二维归一化位置只写`Evo42.hub.position.v1`，可读旧位置作为初值，不写旧位置键，不是已完成生产迁移。
- **E42-ACR-01 / P-A**：实际设置外壳增加烟色厚度、暖/冷边光、轮廓与阅读井；B让真实外壳作有限面积守恒伸缩，实际内容芯最多7px滞后、反向缩放补偿，速度驱动反光带和应力层。原文字/控件节点保留，未克隆正文。材质填充沿原通透度变量，关玻璃使用原不透明回退。
- **最小联合探针**：仍只一个实际设置窗口、一档heavy雨、一次拖动。原雨Canvas与外壳同域，稳定后相对偏移差值为0；没有取得实时DOM纹理/GL折射，也没有测量GPU成本。商店仍只是参考入口，不当作第二角色已验。
- 同一研究入口提供4.1、静态层次、受力材质及Hub自由移动/召回；[四段原速媒体、四张截图和验证摘要](../media/evo42-study02/validation.json)共约4.74MB媒体随研发分支保存。录像独立录制、1280×900、playbackRate=1，共同操作台的拖动不冒称4.1原发行功能；不是配对性能基准。

### 实际检查与失败

macOS arm64 / 项目Node26.12.1 / 锁定Chromium153.0.8010.12；`vue-tsc -p tsconfig.evo42.json`及README严格Node工具tsc通过。`node prototypes/evolution42/check.mts`完整9条结果通过（3生命周期＋6宽窄材质循环），12个输入摘要；`node prototypes/evolution42/free-check.mts`6组结果通过，8个输入摘要。均无pageerror，最终摘要与工作区源码逐项复核；本次检查在未提交源码上执行，附输入摘要，不改称已在干净提交执行。

- 自由位置首次断言对旧小样真实失败：中央放手仍停在x≈29侧边；换成隔离二维位置后通过。
- 独立审查发现并修正：运动中点击截停未保存、拖放与保存边界相差12px、惯性速度未换算本地比例、隐藏时自身运动未取消。边缘保存/刷新反例修前失败，修后通过；新测试包含实际召回移动20px后点击/刷新、受控隐藏、活跃拖动退出。审查复核未发现新具体阻断，审查者未自行运行完整CI。
- 回弹期间在驱动返回后点击并取样，曾因错过非零状态断言失败；诊断单次又捕获到非零，未据此抹去原失败。改为预挂浏览器帧观察：在实际非零core帧，先用`elementFromPoint`核对控件中心命中，再以原生`HTMLElement.click()`验证同一checkbox激活。不是物理触摸测试，没有延长动画、增加sleep或放宽运动断言；原驱动失败与诊断日志留本机。
- 关玻璃同时检查装饰隐藏、实际背景不透明和backdrop-filter为none；CSS不支持滤镜的回退有源码路径，尚未在旧WebView运行。减少动态、宽窄控件/原生popup、雨层稳定几何、快速反向/关闭、原生Hub设置动作恰好一次、静止停帧、旋转与销毁继续定向检查。

完整本地命令见 [原型README](../../prototypes/evolution42/README.md)；失败/原始结果留忽略的`tests/artifacts/evo42`及本机临时日志，不能假定跨机存在。媒体校验摘要包含两个检查结果与源文件摘要，可重新生成而不依赖本机缓存。

### 这批没有做什么 / 下一步

- 未将候选合入正式UI、修改Host/存储公共合同、全局编辑/完整自定义、完整P-C或CI runner/gate/保护规则；未合main、改Tag或Release。
- 尚待负责人视觉反馈，再选方向补第二角色和完整消费者覆盖。自动化不是视觉通过。目标Windows/Android WebView、真实游戏、GPU/功耗未验；可见性检查是受控事件，缩放惯性目前为代码修正/审查，没有独立运行指标。
- Github本次同步研发源码、旧决议/调查、计划与这批媒体/交接，保持现有手动按批CI政策。本次定向原型尚未纳入现workflow的独立任务，未触发新的远端整轮CI，不把旧4.1 Run签给4.2。
- 实时核对发现#31/#32/#33均已关闭；#31已正确记录4.1发布，不再重复纠正。#33仍缺新的Ray复现或修复证据，关闭不证明原因已明。4.2跟踪为[#35](https://github.com/102326/DoL-Game-UI/issues/35)，只关联本计划，不另建路线图。

## Claude原方案校准（2026-11-02）

负责人明确：**延续设计思路，收束落地范围。** Floating Hub与部分界面是首批应用范围；不是把Claude方案换成独立“JELLY设计”。JELLY仅指果冻运动子项。本次附件名为 `SoftWet-JELLY-Prototype-20261027.zip`，自身标题亦为JELLY，但不能据此覆盖此前Claude全部研究。这里仅对照该包的真实文件；未取得的其它提案不猜测、不冒称已经完整还原。

### 来源与实际试用

- ZIP SHA256：`7f09cb06e86d6447da8b69960ba81446492c59ed471dcccc4621342e64686074`。14个目录/文件条目，解压内容123,536字节；路径/链接/体积检查后在忽略的 `tests/artifacts/claude-jelly-20261027/` 隔离解包。原包9个 `SHA256SUMS` 文件逐一匹配。附件和其文档的建议是研究资料，不是执行、迁移或发布授权。
- 浏览器本地参考页实际打开，查看静态玻璃/阅读井和原球体，进入编辑态拖动模块并触发归位；出现未保存与立即归位状态。这是定向试用，不是完整输入合同、目标WebView或画质验收。其全局舞台、布局编辑、合成业务内容没有接入正式UI。
- 原测试使用CommonJS；在本仓库 `type: module` 下直接运行失败（`require is not defined`）。原样复制到无父级ESM配置的临时目录、校验物理核心和测试摘要一致后，Node26.12.1 / macOS arm64运行 `node test/physics.test.js`，8组、39条原断言通过。未修改原测试/物理代码；随机样本只是该次执行，原断言也不是完整产品合同。
- 代码检索未见外部网络请求；预览使用独立本机端口，布局只使用原包 `jelly.layout.v1.land|port` 本源存储，与正式产品存储分开。该检索不等于完整安全审计。源码包、临时路径和试用日志为本机资料，跨机需重新取得附件；位置见忽略的HANDOFF.local.md。
- 原DESIGN中的软件光栅fps、移动端默认mid、自动降档和WebView描述保留为原作者陈述，不当作本项目实测。原包确有自动降档代码（app.js:187、203–205），本项目默认不自动降质的决定不随附件改变。

### 具体设计与P-A/P-B对应

下列源码位置均相对**附件解压根目录**，不指正式src。数值是原包实现，不是已冻结的产品规格。

| 原方案及源码证据 | 对应方向与处理 | 当前小样实际差距 / 下一原型需要呈现 |
| --- | --- | --- |
| Quartz烟色填充、暖受光/冷回光、双边界、阅读井及控件内外层次：css/jelly.css:1–17、38–60、75–96 | P-A A沿用材质层次；调整为黑灰偏好、紧凑密度与现有偏好；指针局部湿光是当前新增 | 首版底材仍4.1，只有微弱高光，未证明原材质已迁移。先让静止层次/厚度可辨，不拿换色充当完整方向 |
| 硬壳有限应变、正文内芯相对滞后、逆速度反光带、应力光与固定世界光源：DESIGN§一/四；app.js:69–98；css/jelly.css:55–74 | P-A B沿用核心因果，调整到一个实际窗口；与A共用同一材质体系，可组合 | 首版仅外缘轻微skew，不是外壳/软芯联动。下一版需可见的抓起/急停/反向/恢复；文字不拉歪不等于禁止内芯运动，真实命中必须与所见位置一致 |
| 弹簧/阻尼、尺寸质量、有限反弹及休眠：physics.js参数及World；DESIGN§二 | P-A B/P-B共用运动语言，参数允许按操作重新标定 | 保留已有中断/休眠探针，不照抄全部碰撞世界。原包编辑态内芯不可操作，不能据此保证生产表单运动中的点击正确 |
| 球体固定高光、刻线按自旋转、抓取阈值与有限运动：orb.js；app.js:80–85；input.js:5–71 | P-B A沿用直接操控/球体照明；将“模块软芯”借到球上是调整/新增，不是原Orb已有设计 | 首版用4.1球体加装饰软芯，未移植原包运动。下一版实际球自由拖放，并比较有限软化是否有价值；不先推翻已认可的球体外观 |
| 锚点、延线、绷紧、光珠、真实牵引、可立即接管：app.js:138–154；fx.js:87–136；DESIGN§六 | P-B B沿用召回因果；调整为明确归位/找回动作与有限惯性，可与A组合 | 首版仅余像/丝线，真实球仍在4.1位置。下一版必须让真实球移动/可重抓，不能把装饰影子当召回已完成 |
| 浏览态noCharge，Orb `dock=10`，最终侧边停靠：app.js:45；input.js:22、28–37；physics.js:140–150 | **负责人调整：自由悬浮优先，不强制吸边**；不是原包已有能力 | 正式MotionHub和当前原型同样仍侧边定位。下一版验证二维位置、中心/四角菜单、越界恢复/找回、键盘及旧停靠数据读取；不借此做全局编辑器 |
| Spin Charge边膜、瞄准、自旋、双股尾迹、碰撞反馈：input.js释放；fx.js:charge/trail；DESIGN§五 | 保留Hub局部实验价值；是否采用依据可操作收益，而非因为已写出就纳入 | 原型阶段可大胆试，但不默认撞动业务窗口、不要求全部特效一起上，也不把“首批收束”写成永久否决 |
| 全舞台布局/网格、6模块碰撞、保存撤销、整体缩放：app.js:21–67、100–154；input.js编辑态；css/jelly.css:24–35 | **首批暂缓**全局编辑与完整自定义；只借鉴明确的操作和恢复机制 | 保持业务/存档分离，原包旧阅读开关和整场景缩放不照搬。减少落地对象，不减少设计目标 |

### 自由悬浮的工程边界与接续顺序

正式位置模型 [geometry.ts](../../framework/motion-hub/geometry.ts#L2) 为 `{side,y,docked}`；[MotionHub.vue](../../framework/motion-hub/MotionHub.vue#L122) 释放后通过locate回侧边，说明自由悬浮不是改一个动画参数。现有 `docked=false` 仍为靠侧球形，不是任意二维坐标。

下一隔离原型先使Hub可在可用区域自由停留，保留工具动作/焦点/取消/清理，演出与真实命中同位；位置模型/保存与原4.1对照隔离。显式停靠可保留，近边磁吸只作辅助候选；不必为此先加模式开关。旋转/软键盘/安全区挤压时限定在可达区域，不能把恢复规则变成每次强制吸边。召回目标需清晰比较“显式默认锚点”和“上次有效位置”，选定前不静默覆盖用户自由位置。

在同一原型内补一个实际设置窗口的原材质层次和受力联动，再做一窗口/一雨态/一次拖动探针；先用少量足以看出区别的操作对照，不铺四套完整产品。控制顺序为4.1 → 附件参考 → 新适配，保持新旧同视口/同操作/原速；附件若保留舞台缩放，明确其比例，不假称与正式窗口一比一。方向有价值后才补商店详情与完整中断/消费者覆盖。

**本次实际修改仅计划/研究记录/交接与原型说明，未改运行代码；自由悬浮、硬壳软芯联动和真实召回尚未实现。** 既有9条工程结果继续绑定原输入，不作为新设计的通过证据。正式集成、main、发布和CI迁移边界不变。

## 原型边界和比较方式

入口 `node scripts/preview-evo42.mts`，本机默认5206；Node固定26.12.1，复用锁定Vue、GSAP、Vite和Playwright，不新增依赖。源码在 [prototypes/evolution42](../../prototypes/evolution42/main.ts)，生产src/framework/compat和正式打包入口不改。

- P-A：4.1原材质／A静态玻璃局部湿光／B受力光学外缘，实际Settings组件和原控件。两者可组合，当前先做区分性小样，不是两套产品。
- P-B：4.1球体／A软芯贴手／B丝线与召回余像，实际MotionHub保留真实动作、输入/停靠/持久位置。**B目前仅临时装饰姿态，不是惯性移动已完成；不把余像当可点击球体。** 新输入取消装饰余像；真实球体始终留在真实命中位置。
- 共用标题拖动是研究操作台，不是4.1已有的窗口拖拽功能；各材质使用同一操作台公平比较。模态遮罩不移动，只移动实际玻璃外壳，其文字、控件、雨Canvas保持同一坐标系。
- 背景使用真实CSS backdrop-filter，没有取得DOM纹理或实现实时GL折射；不以渐变高光宣称真实折射。
- 最小联合探针仅一个设置窗口、一档heavy雨、一次标题拖动及恢复；不提前完成完整P-C雨量/雪霜/特殊天空矩阵。
- 新材质保持黑灰方向和紧凑默认，未新增玩家设置；研究选项仅在演示页。默认偏好仍为生产60/left，不修改游戏或现有玩家存档。

复现检查：`node prototypes/evolution42/check.mts`；静态检查 `node node_modules/vue-tsc/bin/vue-tsc.js --noEmit -p tsconfig.evo42.json`。对照媒体、几何和结果默认在忽略的 `tests/artifacts/evo42/`，不假定跨设备可见。媒体为原速捕获，演示停顿相同，不是性能基准。

### 本批实际结果

- M0/P-A/P-B首版工程小样与最小联合探针已实现；视觉区分度不足，按上方校准重做设计表达。Mac arm64 / Node26.12.1 / 锁定Chromium153.0.8010.12；前次交付fetch确认origin/main仍c7d8bac，没有覆盖本地工作。
- 最终 `check.mts` 为 `mode=full-prototype`、PASS、9条结果（3条生命周期＋3材质×2视口1280/390），pageerror为空；生成3段1280×900原速WEBM与6张截图。结果保存9份实际原型输入SHA，源码基点c7d8bac＋未提交原型，不称干净提交已验。
- 实际控件/展开原生选择框、开关/分类/快速开关、一次原生Hub动作、真实pointerup/重抓中断、reduced-motion、旋转/可触达、空闲停帧和退出释放通过。联合探针原按钮/Canvas保持同一节点，拖动前后Canvas相对玻璃偏移差值均0；这只证明受控几何/输入可行，不是GPU/重绘成本或全部设备结论。
- `vue-tsc -p tsconfig.evo42.json` 与README中的严格Node工具/检查脚本tsc命令均通过；使用实际TS源码，没有改Expected Lock/CI catalog或新增CI必需任务。
- 离线检查确认薄映射引用的13个现有catalog入口存在、合成报告8个终态/5个实际启动计数守恒；不是选择器或gate新实现的证明。
- 对照页 `/prototypes/evolution42/compare.html` 已能播放三段录像；操作页可组合材质与Hub方向。负责人已反馈差异不明显，首版不能按视觉达标收口；惯性/自由悬浮/真实召回、第二角色候选验收、全局推广、完整P-C和实际设备/游戏均未完成。

### 失败、修复和证据边界

1. 首版误拖全屏dialog而不是实际玻璃shell，导致越界；正确读取DOM/天气父节点后改为共用shell操作台，未放宽边界。首轮失败在本机保留。
2. 新Hub装饰监听被原组件stopPropagation隔离，释放后held仍真；补实际pointerup断言先红，再改为capture只读观察，不取消/重派原动作。
3. 独立审查提出原生Escape/lost-capture未同步、退出后API可重建资源、手动关闭后旧序列可能打开商店。3条真实浏览器回归先均FAIL，修后均PASS。新输入/媒体/原生取消与销毁有明确终态，序列手动中断也观察原有4.1秒演示时域内不出现迟到商店。
4. 审查指出最初只记录雨层offset、不比差值，已补实际前后差值断言；lifecycle-only另写lifecycle-result.json并明确mode，不能覆盖完整报告冒称6场景都跑过。
5. 最终检查曾在媒体切换后立即拖动时取得echo=0；增加事件诊断后当轮通过，没有据此抹去失败。原测试没有等待MediaQueryList异步change交付，而owner在该通知中会reset；最终增加实际change交付前置后保留精确echo=1断言并通过。该竞态窗口是已修正的测试前置不足，未宣称已经证明所有偶发情况根因或无限稳定性；原失败与诊断日志保留本机。

首次沙箱启动本机端口被EPERM拒绝，按已授权的隔离预览/测试使用受支持执行权限成功运行；不是产品或测试通过的替代。没有新远端Actions、发行包重建、实机/GPU/功耗或性能提速结论。完整视频不是自动视觉接受。独立审查者只读检查，未自行运行测试。

## 非Hub需求发现（保留，不自动转开发）

| 记录 / 依据 | 操作痛点与默认方案 | 是否需要新增选择 / 当前结论 |
| --- | --- | --- |
| UH-01，历史负责人反馈 | 阅读/选项留白过大，开关差异小；4.1已默认原版密度并提供三滑杆 | 先复用现偏好与紧凑默认，不再加“舒适/宽幅”重复选项；不是新发现的缺陷 |
| UH-02，历史负责人反馈 | 文字简单居中造成控件割裂；4.1已通过独立居中排版 | 用户左右选择有真实依据且已存在；本轮实际下拉/切换检查，不新增对齐模式 |
| UH-03，历史负责人反馈＋本轮控件操作 | 原生下拉展开需一致材质与可读性；窗口变形可能损伤popup/命中 | 优先修默认/浏览器原生语义，不为每个窗口新增“美化开关”；候选成本应包括键盘/Escape及失败回退 |
| UH-04，历史跨窗口遗漏 | 设置成熟但其它界面未统一，用户不能用多个开关补偿漏做 | 沿原消费者表统一默认和已有偏好；不增加每窗口皮肤选择 |
| UH-05，本轮操作台观察 | 模态打开后外部研究选项不可点击，需要关闭/快捷键比较 | 属评审工具易用性，不是玩家产品需求；采用页面入口/快捷键及原速录像，不扩成玩家布局编辑器 |

后续继续记录Hub之外重复操作及长期差异；每项回答默认可否解决、为什么需要选择、保存/恢复/兼容成本。当前没有足够新证据要求再加玩家设置，不把“未新增”当需求研究缺席。

## CI成本与薄映射研究（没有接入门禁）

现有事实沿用R0快照：main样本browser396.182秒、布局169.048秒、build88.394秒、packages93.414秒；verify步骤1秒/job16秒。样本不是可比优化前后，不能得出省时比例。packages内部准备/编译/打包/快照/比对/负例尚无独立计时；本批不为填表改producer。新增观测应先使用既有日志，不可观察的子段保留Unknown。

### L1/L2/L3共享实现，按影响决定深度

| 意图 | 薄映射实例与现有entry | 研究选择理由 / 扩围 |
| --- | --- | --- |
| L1 独立材质参数 | acrylic → official-defaults、adapter-materials、实际设置/适用材质消费者 | 独立颜色参数无需全部历史天气。CSS选择器/几何/滤镜变化不是同一种风险；布局变化升L2 |
| L1 局部Hub视觉 | sphere/hub-motion → golden-spin-hub、input/lifecycle与官方owner资源 | 保留新输入/隐藏/终态历史回归；共享输入核心变化不能只测球体 |
| L2 共享输入/窗口 | source-motion/navigation/偏好 → settings-ci、official-game-motion、source-motion-lifecycle、evolution-navigation/panels、实际独立/兼容消费者 | 同时纳入间接消费者、焦点、命中和资源。范围不能证明完整就保守扩大 |
| L2 构建/打包 | build/package/锁/NOTICE → ci:check、构建、九包合同/独立双构建与影响到的浏览器 | 普通RC并不按名称全量；构建体系重大变化有理由提前完整验证 |
| L2 CI规则自身 | catalog/选择身份/summary/remote → ci-v12、ci-evidence、research-evidence及选择漏项负例 | 现CI入口的子集参数不是已具备安全选测；未知映射、规则变更默认现完整路径 |
| L3 大版本封板/发布责任 | 本版本现役支持承诺、完整约定布局/回归、九包/独立重建/证据及必要实机视觉 | 完整集合事先冻结；已否决且无现役共享责任的实验不因存在永久必需 |
| 封板后差异 | 已封板SHA→修复SHA的直接/间接影响＋新产物/必要包合同 | 写明旧证据适用部分与新身份，不冒签新SHA；仅因小修不默认从头全量 |

映射复用 [catalog](../../scripts/ci-catalog.cts)、[family/dependencies](../../scripts/ci/research-families.ts) 和 [现有CI合同](../CI.md)。此表是人工研究，不是可执行选择器，未修改catalog/Expected Lock。暂不为每批加一层协议。

### 集中报告样例（合成，未运行，不是Actions回执）

示例identity：`illustrative-change-A / mock-run-1 / attempt-1`，不指向真实Commit/Run。选中8项，其中实际启动5项：PASS 2、FAIL/ERROR 2、结果不确定1；BLOCKED 2、NOT_RUN 1。8=2+2+1+2+1，已执行5是交叉统计，不再与终态数相加。未选3项另列不适用理由，不计通过。

| 唯一检查ID | 终态 | 证据/归因示例 | 行动 |
| --- | --- | --- | --- |
| types | PASS | 本轮实际执行报告完整（示意） | 无 |
| input | FAIL | 断言证明一次点击触发两次；暂定产品根因A | 核对重复注册/派发，复测输入与实际消费者 |
| packages | ERROR | 构建工具缺失，基础设施根因B | 恢复锁定工具链，重测构建及包合同 |
| popup | UNVERIFIED | 进程退出0但所需报告缺失，根因Unknown | 保留原日志，不归入A/B，不能按退出码通过 |
| models | PASS | 本轮完整结果（示意） | 可按身份复用 |
| package-repro | BLOCKED | 明确依赖packages，无有效首轮产物 | 关联B，不再算一个产品缺陷 |
| artifact-contract | BLOCKED | 明确依赖packages | 关联B，保留缺产物事实 |
| long-layout | NOT_RUN | 总预算耗尽，未启动 | 预算/顺序单独调查；非PASS |

示例根因：产品A、基础设施B各1组；popup维持未知，缺报告不能仅因发生在后面就归给B。阻塞项、断言数、原日志均保留。整体gate必须拒绝成功，因为存在必需失败、错误、不确定和未完成；根因去重只减少重复叙述，不删除原失败。这里展示报告格式，不宣称新聚合器已经实现。

### 有界影子对照：14个预定场景，不永久双跑

批准隔离选择器实现后，以相同实际源码/base/head/merge、依赖、工具链和适用范围冻结下列输入：

正向S1–S8：独立颜色参数、局部Hub视觉、设置共享偏好、共享输入、rename/delete、构建/依赖、普通RC、封板后小修。

负向N1–N6：遗漏间接消费者、遗漏必需前置、错误base/merge/源码身份、生产者排除清单被篡改、退出0但零断言/pageerror、取消或缺失必要报告。

以上为8个正向场景＋6个负向场景，N5/N6的故障变体在实施前冻结，不能采样后选有利结果。用既有历史真实缺陷、夹具竞态与反假绿受控用例回放；这里只证明已知样本的拒绝能力，不统计全局缺陷发现率。新旧比较记录明确范围差异，不能把少测计为同能力提速。

**结束条件**：全部固定场景取得可解释结果；承诺覆盖无未解释漏项；N1–N6仍被拒绝；新计划/结果/gate统计一致；现完整入口能回退。达到后结束影子期。修复只重测受影响样本；若两轮修正仍有未解释漏项，停止启用并报告具体未决点，不把双跑变成永久政策，不削弱标准让对照结束。

**端到端账本**：以一个有效变更达到可集成结论为单位，记录风险/档位、提交到首个可行动反馈、达到可集成结论总时间、Codex实际被阻塞的区间、运行次数、取消实际消耗、修复轮数及误报/逃逸。并行工作与等待分开；单Run缩短但补跑/迭代增多不能判成功。没有实际新选测运行，本轮这些收益字段均未测，不估算token/百分比。成本与维护收益分列，低成本报告收敛不冒充主要运行提速。

## 下一最小实现建议

CI下一步提名“离线计划/报告样本校验”，仅复用catalog ID验证上述人工映射、依赖闭包与统计守恒，输出到隔离目录，不改变producer/verifier/gate。此项仍是候选，不因本批研究完成自动接入PR。C0–C4可交错，保持现完整CI和规则，不阻塞UI视觉方向评审。
