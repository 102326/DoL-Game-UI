# C1 离线候选

这是研究候选。`candidate.mts`只读取Git变化并输出计划；`shadow-run.mts`可在新建隔离快照中实际执行消费者检查。它们都不接入正式CI。三条实际源码路径的映射经过人工审阅，直接、组合及独立入口的依据见 `consumer-map.mts`。空变更、未知路径、新增、删除和重命名回退完整 standard/research catalog；full仅指这两份catalog。

在仓库根目录运行（Node 26、已安装仓库依赖）：

```powershell
node prototypes/evolution42-ci-c1/candidate.mts <base-commit>
node prototypes/evolution42-ci-c1/candidate.test.mts
node prototypes/evolution42-ci-c1/policy-cache.test.mts
node prototypes/evolution42-ci-c1/shadow-plans.test.mts
node prototypes/evolution42-ci-c1/dependency-shadow.test.mts
node prototypes/evolution42-ci-c1/standard-evidence.test.mts
node prototypes/evolution42-ci-c1/remote-shadow.test.mts
node prototypes/evolution42-ci-c1/shadow-run.mts
# 等上一条完成并输出PASS后，使用其快照路径执行固定负例：
node prototypes/evolution42-ci-c1/shadow-faults.mts <snapshot-checkout>
$ciSources = @(Get-ChildItem prototypes/evolution42-ci-c1 -Filter '*.mts' | ForEach-Object FullName)
node node_modules/typescript/bin/tsc --noEmit --strict --noUncheckedIndexedAccess --skipLibCheck --target ES2022 --module preserve --moduleResolution bundler --allowImportingTsExtensions --types node @ciSources
```

`verify(root, expectedBaseRef, plan)`由调用方独立提供预期基线。identity包括base/head、Git差异、未跟踪文件、已识别路径的原始字节及策略输入。文件采集并非原子快照；除下述隐藏索引标志路径外，Git未识别为变更的路径和忽略文件不在原始字节扫描范围内。

同一进程在候选模块加载后若发现策略输入发生变化，会拒绝重新生成计划，避免把新文件摘要与旧的模块缓存混用；核验也会拒绝。该检查不是原子加载证明，也不认证在候选模块加载之前已被其他模块缓存的策略。

Git 索引中任意 assume-unchanged 或 skip-worktree 标志也触发完整 catalog 回退，并将标志和对应路径的原始字节、缺失或符号链接目标绑定到身份；无法读取则拒绝生成。完整 catalog 不包含所有独立入口。

research前置使用现有catalog递归保留。standard计划保留unit的dependencies/check，以及browser的dependencies/check/build/packages/browser-install。最初的`shadow-run.mts`复用已有锁定依赖和浏览器，实际执行source-check、framework-build和映射消费者，没有执行fresh npm ci或独立双构建。下文standard专项单独补准备阶段；两者均不是完整标准/研究门禁。

## 当前实证

2026-11-05，冻结当前工作区源码到新的本地Git快照，记录原HEAD/输入摘要及派生base/head，对三条源码做等价表示变更。快照复用已安装依赖，不包含游戏或私人存档，也不修改原工作区。通过现有`runResearch`、`runSuite`及`runCommand`执行12项：源码检查、Framework构建、设置、正式动效、动效生命周期、资源所有权、导航、面板、适配材质、设备布局、适配器及独立材质合同。使用现有`context()`及原生standard预算/报告路径；独立入口不冒称已被原catalog覆盖。

八类S1–S8已固定并通过**计划级**检查，增删/改名和未知文件保守完整回退。这不是八轮完整执行；真正执行的是上述三路径组合样本。N1–N6最新固定为15个本地故障变体，覆盖漏消费者/前置、错误base/Attempt、同时删计划/结果、零断言和真实pageerror退出0、缺报告、取消/超时、进程收据ID/PID不符、顶层状态矛盾、缺布局覆盖报告及阶段曾观察到源码变化后又恢复。阶段原始状态/sourceAfter/原因也必须通过，不能只看最终文件恢复或各子进程退出0。

其中 S7 仅以 RC 版本的 `package.json` 变更验证未知路径回退，S8 仅以未映射源码小修验证回退。候选没有 RC 阶段、冻结基线或封板后差异的可信输入：同一已映射源码差异仍按普通候选处理，因此这两项不证明 RC 或封板复测政策已实现。

独立复核曾复现成功收据串用、顶层状态矛盾；又发现手工上下文没有收回standard必需布局报告，以及汇总可能覆盖阶段源码变化。均已补核验，旧结果按当时覆盖保留，不再作为最终影子结论。首次10/13负例、缺报告的中间结果和无结束回执的中断记录均保留。原始证据在本机忽略目录，跨机接续须另取。

另用现有研究执行器做受控调度测试：source-check故意失败时，其构建/设置消费者被阻塞，独立prototype-check仍实际执行通过；取消后均不出现PASS。该测试使用source-less fixture，只证明调度，不表示产品源码检查失败或通过。

## 标准准备与传输专项

`standard-shadow.mts`仅允许在`tests/artifacts/ui42/ci-standard/`下的独立源码checkout运行。先将脚本纳入隔离基线，再冻结三条已审阅路径的等价变更；不可把新增脚本本身混进样本差异，也不能对共享node_modules junction执行npm ci。从该checkout运行：

```powershell
node prototypes/evolution42-ci-c1/standard-shadow.mts <independently-frozen-base>
```

本轮实际五阶段、9个browser消费者及独立材质检查通过，九包独立双构建及9个包合同负例通过，127项布局报告完整。执行中补强了内层包核验，最终核验器对保留的原报告通过；五阶段没有为这次核验修改重复执行。

它调用原`test-ci.cjs stage`依次执行五个准备阶段，再以原`runSuite`执行计划中的browser消费者及独立材质入口。准备失败即停止后续消费者；这不是Actions完整依赖图或失败并行策略的替代。阶段原始报告、源码身份和正式汇总器的嵌套包合同都需通过，整个子集仍必须被完整profile汇总拒绝。`standard-evidence.test.mts`专门验证外层成功但内层FAIL、少一次独立构建或身份不符的拒绝行为。

`remote-shadow.test.mts`复用正式`finalizeUpload`/`verifyRemote`，构造两套明确的合成完整standard profile。两套正向包通过后，固定外部manifest摘要、nonce、Run/Attempt和PR锚点，再测试整包/真实shard交换、改写字节并重写index、PR head/base/merge各自错配。最终两正八负通过；早期拒绝原因顺序断言失败保留。它证明现有正式核验器的受控边界，不表示C1选测包已支持远端认证或真实Actions之间已经运输验证。

## 仍需收敛

人工消费者名单不等于全仓库完备影响图。普通RC/封板小修策略、完整标准/研究profile对照、跨Run/Attempt汇总、真实Actions上传/远端核验及可信选测计划分发仍须沿C2/C3研究。预期base由调用方提供，当前没有另行认证PR平台的base/merge。当前shadow不是远端认证器；不能将局部故障通过写成全部14类的完整profile对照完成。正式门禁仍保持完整执行。

## 本地跨进程运输与消费者补全（2026-11-06）

`transport-shadow.mts`读取一次**已完成的真实隔离执行**，先用原`verifyShadow`核验，再复制计划、报告和证据到新的接收目录；每个正向/故障样本由新的Node进程读回。外部控制器固定base、源码/策略、Run/Attempt、计划/报告摘要和证据目录摘要，接收方重新计算候选并复用原核验器。包内自带锚点不能代替独立调用方输入。这里只研究本地受控文件运输，不是新增正式CI协议、远端认证器或可复用缓存。

```sh
node prototypes/evolution42-ci-c1/transport-boundaries.test.mts
node prototypes/evolution42-ci-c1/shadow-run.mts
# 上一命令完整结束并输出PASS后，使用它刚创建的checkout；只对独占的快照执行：
node prototypes/evolution42-ci-c1/transport-shadow.mts <snapshot-checkout>
```

驱动在执行前固定18个场景：初始/恢复后的两次正向，以及缺计划、损坏JSON、自带锚点、计划字节篡改、错base/head/attempt/run、同时删除计划和结果中的消费者、错报告身份、取消报告、重复结果、缺失/篡改证据、源码/策略漂移。用于验证语义拒绝的部分负例由控制器明确重锚，单独确认不是只靠字节摘要拒绝。源码/策略故障只修改独立快照并在finally恢复；禁止对共享工作树或并发使用中的快照运行。证据读取限制16 MiB/2000文件，拒绝符号链接与非普通文件；文件采集仍不是原子快照。

接收目录的source/run不从生产者提供的绝对工作路径重建。调用方锚点来源、真实PR base/merge、跨Actions身份及传输权限仍未认证；拥有控制器和源码的同一恶意进程不在该隔离实验的防护范围。原完整research汇总器必须继续拒绝选测子集，不把本地运输PASS提升为完整gate。

本次还沿实际运行链发现旧人工映射漏掉四个现有research入口：Hub的`golden-spin-hub`、`golden-spin-hub-input`、`golden-spin-hub-lifecycle`通过`hub.html → HubApp.vue → prototype re-export`调用生产`sphereHub`；`motion-workspace`通过`windows-main.ts`调用正式窗口动效和主题控制器。后者对acrylic也保守保留，但不声称它有独立材质输出断言。已补单路径真实Git回归，旧映射首先在acrylic缺workspace处失败，修正后通过；这不代表全仓库消费者完备性已经证明。早期13项执行和对应运输结果绑定旧策略，修正后的新策略必须另建快照验证，不拼接旧报告冒充新执行。

本批实际结果：旧策略13项执行＋18场景运输通过；发现上述映射缺口后另建新快照，补齐后的17项真实执行及同样18场景运输通过（2正向、16负向）。四个新增独立消费者均实际执行，不是只在计划数组中出现。完整research汇总仍为UNVERIFIED；八类计划检查、策略缓存旧错新拒绝、读取边界及严格TypeScript检查通过。结果及两轮源码/策略摘要见[既有CI影子证据](../../docs/evolution/evidence/2026-11-05-ci-shadow.json)的macSelectedTransport20261106；本机原始快照路径未同步，其他设备按上面命令重建。
