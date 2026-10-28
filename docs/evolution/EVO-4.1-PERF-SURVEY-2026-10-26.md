# 4.1 性能热点调查与首轮基线

接续索引：首轮现场数据保留如下；后续见[深度复核](EVO-4.1-PERF-DEEP-2026-10-26.md)、[Mac浏览器/A2结果](EVO-4.1-MAC-BROWSER-A2-2026-10-26.md)及低优先的[Host公共能力整合调查 EVO41-HOST-S01](EVO-4.1-HOST-SHARED-SURVEY-2026-10-26.md)。Host项只补充现有计划，未改变主线顺序或自动批准候选开发。

2026-10-27更新：第7项通透度已获视觉认可，默认60%；按Issue #31新顺序接续第3项的[天气C1/C2结果](#第3项持续天气首轮c1c22026-10-27)。以下首轮调查保持原始日期和样本口径。

第2项已继续[ModHub B3与公开目录校准](EVO-4.1-MODHUB-B3-2026-10-27.md)：保留B2和无状态合并规则的取舍，不把合成大目录收益覆盖当前公开快照中B2更快的结果。均为隔离评审输入，未改玩家ModHub/视觉Adapter业务。

2026-10-26。范围为负责人批准的调查与基线采样，未修改产品运行代码、Mod 包、偏好、启用组合或发布内容。此报告提出实施顺序，不表示优化已经实现。

## 建议先做什么

首批建议处理 **共用开窗流程的样式／几何检查与焦点交接**，以及 **ModHub 列表说明和更新统计的重复依赖推断**。前者由我们控制且影响多个窗口，后者是本轮调用栈中明确的第三方计算热点。

持续天气成本排第二批，保留当前视觉。游戏自身天气 Renderer 与宏渲染可以深入研究，但当前多 Mod 现场不足以判断哪些成本属于未经修改的原版，也不足以保证重构收益。

## 本轮输入与方法

| 项目 | 本轮实际输入 |
| --- | --- |
| 源码 | `ff428b4d385b79f6c14fada9a65301157978aa6f`，4.0.1 |
| UI ZIP | SHA-256 `d7417963c75636bf60f3263536ed7cae15866005f0fcecc8bd8f3f890502d3c3` |
| 实际加载核对 | ZIP 18 个文件成员与 WebView 中 Loader 持有的 UI 包逐成员 SHA-256 全部相同 |
| 设备 | M367FC，Android 17，WebView 155.0.8059.43，独立测试 App |
| 页面 | Bedroom；所有业务观察保持该 Passage 与 turns 不变 |
| 游戏／Mod | DoL 0.5.12.13，运行列表报告 47 个 Mod |
| 主要组合 | ModHub 1.8.3、maplebirch 5.5.5、CE 1.20.3.1-rebuild.30、原版优化 1.1.2.1、Host 0.1.5-experimental |
| 对应适配 | ModHubSoftWet 1.0.2、DolOptimizationSoftWet 1.0.3；全部报告版本保存在本地环境 JSON |
| 视口 | 1363 × 876 CSS px，DPR 2.5 |
| 天气 | 游戏实际 storm／rain／intensity=2，采样前后相同 |
| UI 偏好 | 字体和按钮 100%，玻璃、动画、高光开启；其余保持设备原值。`compactStats` 与 `savesV2` 当时为 true |
| 设备条件 | 起始读取 USB 供电、电量 38%、电池 27.9°C；结束 37%、27.7°C；读取到 low_power=0，显示模式约 120Hz，结束 Thermal Status=0 |

刷新率是系统报告值，不是实际游戏呈现 FPS；热状态没有做连续监控。本轮没有启动录屏，未另行核验外部录屏进程。系统条件的起始读取来自本轮命令输出，未保存完整起始 dumpsys；结束原始输出已保存，不能补写不存在的起始 trace。

采样分开执行，避免混合分析器开销：

1. **开窗基线**：11 个侧栏窗口各 3 次，共 33 次，按正序、反序、轮换顺序执行。每次从已关闭状态进入，通过原按钮 `.click()` 调用业务路径，观察点击处理及随后 1.2 秒的 rAF、Long Task、限定窗口 Mutation 和 CDP Performance 指标。
2. **调用栈**：属性、ModHub、作弊、成就、设置各 2 次，共 10 份 V8 CPU profile，采样间隔 1000µs。单独运行，不将其耗时混入上述基线。
3. **稳态基线**：关闭窗口、ModHub、设置各 2 次，每次打开稳定后观察 4 秒，共 6 组；第二轮逆序。保持自然雷雨和所有 Mod，不临时关闭效果。
4. **细查**：设置天气层单独被动观察 2 秒；读取实际加载代码片段，将压缩函数与自有源码、ModHub 源码和游戏天气 Renderer 对照。

样本按时间顺序执行，没有完全随机化。关闭后再开是同一进程内的重开，不是冷启动测试。MutationObserver、rAF、CDP 与 CPU profiler 都有观察开销；没有替换产品方法或包装第三方业务 Hook。

## 开窗基线

单位均为 ms。每行是该窗口 3 次样本的中位数；“最长间隔”先取每次观察中的最长 rAF 间隔，再对 3 次取中位数，不是总体 p95。

| 窗口 | 同步点击处理 | 开窗观察内最长 rAF 间隔 |
| --- | ---: | ---: |
| 属性 | 104.3 | 124.9 |
| 社交 | 49.0 | 66.6 |
| 特质 | 34.8 | 66.6 |
| 日志 | 38.7 | 83.3 |
| 统计 | 39.7 | 75.1 |
| 成就 | 35.7 | 100.1 |
| 作弊 | 69.4 | 241.6 |
| 选项 | 48.9 | 74.9 |
| 存档 | 22.8 | 75.0 |
| ModHub | 27.7 | 250.1 |
| 界面设置 | 36.9 | 49.9 |

ModHub 的后续准备成本明显大于同步按钮处理。不能只测 `.click()` 返回就宣称开窗很快。作弊也存在后续阶段的长间隔；其窗口有 1849 个后代元素，数量只是背景条件，不能直接认定节点都应删除。

这些是主线程回调间隔和同步业务路径耗时，不是物理触控延迟、INP 或实际呈现 FPS。没有将 rAF 换算成完整游戏 FPS。每页仅 3 次，适合作为热点筛选基线，不是稳定的尾延迟分布。

## 热点排序与候选改造

### 第一批 A：共用开窗中的样式／几何检查与焦点交接

**实测依据：** 作弊两份 CPU profile 中，自有 `visible` 对应的压缩函数 `Zs`，self sampled time 分别为 49.3／48.0ms；从共用面板索引路径调用。自有官方开窗流程触发的原生 `focus` 分别为 64.2／63.2ms。成就也出现相同的自有可见性路径；多个窗口另有原生 jQuery `:visible` 检查。

**源码依据：** `src/panels/main.ts` 的 `index` 在挂载和装饰后读取可见标题；`src/panels/visibility.ts` 调用 `getComputedStyle` 和 `getClientRects`；`framework/official-ui/motion.ts` 的 `syncOverlay` 设置焦点。CPU 的 sampled time 包括被调用原生操作的成本，不能当作这些短函数自身有大量纯 JS 运算。存在布局写入后同步读测／焦点触发刷新这一优先嫌疑，但尚未逐条隔离每次样式失效的来源。

**建议改造：** 按实际更新批次梳理挂载、标记、读测与焦点交接，减少重复读测与写读交错。缓存限定于有效的节点和更新批次，随 Mod 替换、筛选和布局变化失效。不得直接删除可见性校验、输入阻挡或焦点恢复，也不能仅凭存在 Observer 就认定重复挂载。

**验收：** 属性、作弊、成就及两个已适配窗口，重复同场景开关与键盘／触控；对照同步处理、最长间隔、样式／布局耗时，核对焦点、命中、动态内容与原生关闭语义。

### 第一批 B：ModHub 的重复依赖推断

**实测依据：** 两份 ModHub profile 中 `inferRequiredDependencies` 按全部调用路径汇总的 self sampled time 为 131.4／61.6ms。它出现在两条真实调用链：

```text
modHubRenderModManageUI
  → modHubGetModSubtext → findMarketModByLocalName
  → checkModInstallStatus → getModUpdateInfo
  → getModUpdateSignature → getRequiredDependencies
  → inferRequiredDependencies

modHubRenderModManageUI
  → modHubUpdateGeneralInfo → getUpdatableMods
  → checkModInstallStatus → 同一依赖推断路径
```

**源码依据：** 当前加载的 ModHub `javascript/modhub-market.js` 在推断时重建 catalog 名称／别名映射，并按描述句段和候选名构造、执行多个正则。管理列表说明和更新汇总会进入该路径。

**建议改造：** 调查将 catalog 身份索引与匹配规则复用，并对同一元数据修订复用推断结果。缓存失效须覆盖目录、描述、身份／别名和相关安装状态变化；结果应保留原作者的判定与数据所有权。具体走上游补丁或可撤销适配，实施前再确定。

**验收：** 先建立优化前后输出等价用例，覆盖必需／可选、否定、别名歧义、版本限制、目录更新与安装状态变化；再比较相同库存下的开窗和翻页。不能省略依赖校验、固定更新数量或跳过 Mod 初始化来换速度。

### 第二批：持续天气与玻璃表面的更新成本

本次稳定 4 秒样本如下；数值给出两次范围。CDP 耗时按 `Performance.Timestamp` 实际指标采集跨度归一化，跨度约 4.26–4.30 秒，包含边界检查开销，不把它硬算成恰好 4 秒。

| 场景 | Script ms/s | RecalcStyle ms/s | Layout ms/s | 观察窗口内 rAF p95 |
| --- | ---: | ---: | ---: | ---: |
| 窗口关闭，UI 仍启用 | 87.9–89.3 | 23.0–24.2 | 0 | 8.4ms |
| ModHub 稳态雷雨 | 68.0–69.9 | 157.3–158.4 | 0 | 8.4ms |
| 设置稳态雷雨 | 149.0–149.2 | 86.1–90.8 | 13.2–13.8 | 16.6–16.7ms |

六组稳态样本均未观察到 >50ms 的 Long Task。设置最长 rAF 间隔约 33.3ms，ModHub 约 16.7–16.8ms；这不证明设备呈现没有掉帧。

设置两次 4 秒天气节点 Mutation 分别为 23438／23758 条。另一次 2 秒细查中，水珠 style 记录 10457 条、水痕 style 951 条；涉及 25 个节点。结束时 90 个水珠节点中 70 个隐藏，但采样中的 style 记录主要落在显示中的节点，不能说是隐藏节点空转造成了大部分写入。

`src/ui/weather/wet-glass.ts` 每帧为水珠和水痕写入多项 style；`src/ui/weather/surface.ts` 管理绘制调度。候选方向是减少不变属性写入、分离几何与外观更新、审查读测和重绘范围，并保持折射、密度、轨迹与现有视觉。DOM Mutation 不是 Vue 重渲染次数，不能将这组记录称为“Vue 每秒重渲染数千次”。

ModHub 稳态观察没有 DOM Mutation，但样式重算成本仍高，说明不能仅靠减少 DOM 写入覆盖全部问题。其 CSS 天气、Orbit Focus 和玻璃表面共同存在；缺少逐项对照，本轮不将全部差值归给雨效或某个滤镜。

### 后续研究：游戏天气 Renderer 与原生宏渲染

CPU 调用栈持续出现游戏 `Weather.Renderer` 的 `drawEffects`、粒子 `draw`、`drawImage` 与图层合成。实际加载脚本中的对应片段已核对，不是把同名 UI 天气函数混在一起。属性开窗的同步调用栈另有 SugarCube `Wikifier`／Widget 路径。

这些路径值得纳入原版逻辑研究，特别是图层缓存、重复颜色计算、粒子绘制与调度。但现场始终保留全部 Mod，不能据此断言是未经修改的 DoL 原版缺陷。CPU profile 中还有大量 `(program)` 时间，不能将其直接算作 GPU、天气或某个 Mod。

建议在需要进入该项改造时，补同版本最小组合与当前组合的交错对照，保留天气状态和可见场景。任何对 Renderer 的重构都须保留其它 Mod 注册的 effect、回调、时间推进和销毁语义；不能全局停掉背景 rAF 或不明 Canvas。

## 本轮完成与未覆盖

**已完成：** 当前 UI 实际加载身份核对；33 次开窗、10 份 CPU profile、6 组稳态及一次细查；热点与对应源码匹配；原始数据和复算脚本保留。最终 Passage、turns、UI 偏好、天气及报告的 Mod 版本与起始快照相同，窗口已关闭，测量 Observer／rAF／Profiler 和自有 CDP 转发已结束。

**未修改：** 产品源码、原版或第三方运行逻辑、安装包、存档、启用 Mod、UI 偏好、版本和公开发行。没有执行购买、换装、战斗继续、载入／导出／写入存档或安装更新。

**未验证：** 停用 UI、最小 Mod 组合、晴雪等其它天气、Windows／iOS、真正触控 INP、冷启动、商店／衣柜／战斗／Passage 切换的新基线，以及长期资源趋势。本轮开窗中的“存档”只打开窗口，未验证存档业务。其它 Mod 只核对了报告版本，没有对全部 47 个包逐成员验货。

**测量限制：** 新样本是 rAF／Long Task／CDP／V8 调查，没有新增完整系统或 GPU trace。结束 gfxinfo 是 App 自进程启动以来的累计值，没有对应本轮独立采样区间，不用于宣称本轮实际 FPS。DOM／Heap 变化受临时节点、保留内容与 GC 影响，不构成内存泄漏结论。历史 RC2 性能数字没有混入本轮表格，也不代替当前 4.0.1 样本。

本轮没有运行 CI 或重建包，因为没有运行代码变动。调查用分析器曾误将自己的汇总文件当作原始 profile；已将输入限定为两轮原始 profile 并成功重算，原始样本未修改，也未删除失败来制造采样通过。原始数据保存在忽略目录 `tests/artifacts/4.1-perf-baseline-20261026/`，不自动公开上传。

## 交付与复算

- `environment.json`、`package-identity.json`：加载成员、版本、偏好和环境。
- `openings-raw.json`、`openings.csv`、`openings-summary.json`：33 次原始开窗与汇总。
- `cpu-0-*.json`、`cpu-1-*.json`、`cpu-summary.json`、`stacks.json`：10 份原始 profile 与调用链。
- `idle-raw.json`、`idle-summary.json`、`refine.json`：稳态与天气节点细查。
- `source-inspect.json`、`original-slices.json`：当前加载代码的限定片段，用于归属核对。
- `before.json`、`after.json`、`final-state.json`、各 `*-cleanup.json`：状态与清理。
- `baseline.mts`、`profile.mts`、`idle.mts`、`analyze.mts`：本地测量与复算；这些是忽略目录中的调查工具，不进入产品包。

在本仓库根目录执行 `node tests/artifacts/4.1-perf-baseline-20261026/analyze.mts` 可复算开窗与稳态汇总，检查原始数据的数量与 CPU profile 结构。另附 `SHA256SUMS.txt` 记录本次本地证据身份。复算不连接设备，也不重放操作。

2026-10-26 负责人已同意将上述优先顺序计入 4.1，已同步至规划 Issue #31。首批为 A／B，持续天气列第二批，游戏 Renderer 与原生宏渲染列后续研究批。下一步收敛首批具体方案、量化目标与兼容验收，再按授权实施；本次确认不启动运行代码修改。负责人后续已授权保存到 GitHub；报告和[可跨机复核资料](perf-4.1-evidence-20261026/README.md)在独立研究分支 `research/perf-4.1-baseline` 保存，原始证据仍保留在忽略目录。

后续已补 UI 总开关交错对照、浏览器时间线和 Mac 离线用例，见[深度复核与 Mac 接续](EVO-4.1-PERF-DEEP-2026-10-26.md)。本报告表格保持首轮独立样本，不将两批数据混算；这里的未覆盖项按首轮口径记录。

## 第3项：持续天气首轮C1/C2（2026-10-27）

分支 `feature/4.1-ui-material-hub`，实现 `41b094a9cafba1f2765af3621001f845d5b5f3d0`，对照311f5fb。**保留C2小幅受控收益候选，拒绝C1；没有宣称天气热点已全部解决。** 通透度视觉接受见[当前UI报告](EVO-4.1-UI-765-2026-10-27.md)。未推送，无本批远端Run。

已在[Issue #31更新本批简报](https://github.com/102326/DoL-Game-UI/issues/31#issuecomment-6433350304)。本地证据8个文件共27,607字节；归档C1补丁在临时目录重建后的摘要与实测候选一致，C2测量摘要也与提交源码一致，7项负载摘要复算通过。

| 候选 | 实际改动与结果 | 裁决 |
| --- | --- | --- |
| C1 样式合写 | 水滴/湿痕每帧整段style提交；60帧属性记录18,646→4,657，单节点最多8→1次；但240帧受控TaskDuration中位374.95→398.24ms，6/6配对上升，样式重算34.58→88.01ms。 | **Reject，运行源码已撤回**；[补丁](perf-4.1-weather-20261027/c1-rejected.patch)、[全部测量](perf-4.1-weather-20261027/c1.json)与失败反例保留，不能将减少Mutation称作提速。 |
| C2 碰撞轴预筛 | `src/ui/weather/rain-model.ts`仅在既有圆形检测前排除X/Y已分离的对，保留hypot终判、循环/合并顺序、种子、时间和轨迹。8×1000步完整快照逐帧相同，模型内hypot调用合计1,762,753→4,745。240帧TaskDuration中位367.85→357.86ms（约2.7%），配对差值中位−8.95ms，4/6对更小、2/6对更大。 | **Implemented / Mac Controlled Tested，研发候选**；[逐对结果](perf-4.1-weather-20261027/c2.json)。样本较少、收益较小，不能宣称统计显著性、Android提速或总体性能验收。 |

两个实验分别交替顺序、2对预热舍弃＋6对有效样本；不可将两轮绝对耗时相减。环境Mac arm64 / Node26.12.1 / Playwright1.63.0 / Chromium153.0.8010.12，960×700夹具、DPR1，固定240个1/60s模型步；每步强制布局flush以观察脚本/样式/布局总成本，无MutationObserver在计时区。它是受控同步重放，不是实时FPS、触控INP、GPU或完整游戏测试。C2没有减少DOM写入或样式重算次数，玻璃合成与原版天气仍未解决。

C1的4,657条记录来自初轮写入探针；随后发现光照expando差异并恢复旧行为，最终归档patch与耗时结果是修正后的版本。两阶段源码摘要分别记在收据和c1.json，不混称同一源码验证。两次初期画面对照因此先被拒绝，修正光照及改用实际计算样式后，七组模型/像素比较才通过；未靠放宽原有断言取得通过。

七组full-heavy/header-light/header-heavy/rain-to-snow/snow/rain-return/dry的模型、有效计算样式、Canvas像素及整页截图摘要严格相同；纯模型另覆盖两种种子、自然/线性轨迹、runoff开关、四档雨量、干湿切换和两次resize，共8000步。不是七种实机。C1研究曾发现旧`--drop-light`只是JS expando，未进入CSS；已保持旧行为，不将其顺手修成光照变化。单属性与整段解析还有约0.00001px的CSSOM文本序列化差别，故新增比较采用有效计算样式/像素严格判等；原有几何断言没有放宽。

完成命令：`npm run ci:lock`；`npm run ci:check`；`node scripts/build-framework.mjs`；`node tests/evolution-rain-model.test.cjs`（7项）；`node tests/weather-dom-writes.cjs`（6项）；`node tests/evolution-weather-integration.cjs`（9检查点）；`node tests/ui41-weather-paint.cjs`。均最终退出0。最初静态检查检测到测试源码声明锁漂移，更新后仅源码摘要和断言位点38→39变化，没有删减用例。末尾预览说明文字更新后再次完成`npm run tooling:build`，不重复测量未变天气源码。见[源码/验证收据](perf-4.1-weather-20261027/receipt.json)及[摘要](perf-4.1-weather-20261027/SHA256SUMS.txt)。

复现C2：锁定Node26与依赖，`npm run tooling:build && node tests/ui41-weather-paint.cjs`；需本地存在311f5fb对照提交。C1仅供隔离worktree复查：从311f5fb应用归档patch，使用当前测量工具的`--paint-only`模式；`weather-dom-writes --coalesced`是该已拒绝方案的定向探针，不是正式运行源码必须满足的新合同。不要在有未保存工作的目录应用研究补丁。

接续：保留C2并按第2项检查已有ModHub候选的集成条件和大目录负结果；持续天气的真实游戏采样、GPU/合成、长期运行以及其它原版/Mod路径仍待对应环境。没有改天气模型规则、已认可雨雪材质/数量/速度、Host API、业务或存档；没有全局材质推广、main合并、版本修改或发布。


## 第3项：C3保护矩形临时对象假设（2026-10-28）

接续4506134，当前分支与远端一致；另一个perf分支仅补旧排序文档，无新运行代码，不合入旧HANDOFF。Issue #31／#32正文已补当前实现及视觉通过状态，原始委托保留为历史。正式main仍ff428b4／4.0.1。Node26.12.1／锁定Playwright1.63.0保持；本机浏览器缓存缺失，首次比较在启动前失败，恢复官方revision1243（Chromium153.0.8010.12）后才执行有效实验，未更新依赖锁。

**EVO41-WEATHER-C3，本轮不采用。** 原wet-glass.safe为每次保护区检查构造临时扩边Box。仅在现有研究工具的内存版本中改为标量比较，保留每一步浮点加减的分组、严格不等式、padding、裁剪和检查顺序，未修改产品源码。代码少一个对象字面量不等于V8实际少分配对象或减少GC。

七个场景的完整快照、有效样式、Canvas及整页像素严格相同。沿用2对舍弃预热＋6对交错顺序、每次240固定模型帧和逐帧layout flush的协议；无MutationObserver或分配探针在计时区。TaskDuration原／候选中位373.996／376.313ms，配对差值中位 **+3.257ms**，4/6对更慢；各对样式重算／布局均231→231。包含候选+156.432ms的未解释大波动，完整保留，不删除、不重跑挑绿，也不凭本轮判定候选在所有环境本质上更慢。现有证据不支持运行代码改造，不进入产品。

这不改变C2此前的小幅受控收益和C1拒绝结果；未改变DOM提交、雨量、速度、轨迹、霜层、材质、Host、业务或发行。剩余玻璃合成、原版天气和真实多Mod热点仍需游戏／设备证据，不能用此次固定时钟测试替代FPS、INP、GPU、Android或长期泄漏结论。

复现：`npm run tooling:build`，再运行 `node tests/ui41-weather-paint.cjs --scalar-protection`。该模式要求当前产品文件与本机HEAD相同，只在内存构造候选；旧默认C2和`--paint-only`模式保留。严格工具编译和声明锁检查通过，无新CI必需项或全量CI。归档patch已在临时目录check/apply并逐字节核对测量候选，未应用到产品。原始截图保留忽略目录，不假定另一台设备可访问。

证据：[完整比较](perf-4.1-weather-20261027/c3-scalar-result.json)、[源码／命令与六对数据](perf-4.1-weather-20261027/c3-scalar-receipt.json)、[已拒绝patch](perf-4.1-weather-20261027/c3-scalar-rejected.patch)。原C1/C2证据保持不变。
