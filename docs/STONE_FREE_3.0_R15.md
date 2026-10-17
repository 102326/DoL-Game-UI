# Stone Free R15：产品闭环与版本韧性

2026-10-17。本轮范围 **Completed，覆盖有限**。研究分支 `research/stone-free-3.0-framework`，从入场干净的 R14 提交 `7a38b6d7dd300194335f2bc4127907ff7a0e2c88` 继续。保留 R14 lab14 ZIP 及其 SHA `8e2787efb48ccf80035e2abb80ffded6595aa9dd1b0effe2ef98c55a9b3aa463`，正式 2.7 对照仍为 `965afcf119260886319f5beb6616362acb306a09`。

本轮完成原生存读档、两处已明确的生命周期风险加固、代表性业务扩展和生态准备。没有推送、合并、Tag、Release，也没有替换正式用户安装。lab15 不是正式 3.0 RC。

## Delivered

| 主线 | 本轮结果 | 实现 / 依据 |
| --- | --- | --- |
| M0 | 扩展既有功能矩阵；保留正式高频与低频能力及原版入口 | [同一覆盖矩阵的 R15 增补](STONE_FREE_3.0_R14_COVERAGE.md#r15-增补2026-10-17)，不重复造总表 |
| M1 | 三个隔离宿主完成原保存、原读取、存档码导出/导入，以及消费者退出后的原版读取 | `tests/framework-official-r15.cjs`，空槽身份与清理保护；没有新保存系统或格式修改 |
| M2 | 设置打开/关闭；Inspector 关闭、再入、主消费者退出清空；读档后场景资源重建、同伴继续读取 | 复用现有统一 destroy；未为每个成熟服务增加空 Host mount |
| M3 | 购买并穿戴的原扣款/装备变化；不同机制的触手测试回合和受控退出 | 没有扩展不可靠的结果确认，不制造自然遭遇或胜利结论 |
| M4 | Host 启动待场景同步；晚到 jQuery 有限重试、部分订阅回滚、失败关闭；衣柜仅清理自有 State/模式 | `framework/boot.ts`、`src/wardrobe/main.ts` / `native.ts`；三份新增定向测试及原基础测试 |
| M5 | 持久公开参考视图离场后实时显示来源可能过时，衣柜/商品副本独立清除 | `framework/official-ui/reference-shelf.ts`；保留原 motion / Ocean / Acrylic，CSS 本轮未变 |
| M6 | 从真实加载清单整理候选、依赖和机制；A/B/C/D 固定方法 | [生态准备](STONE_FREE_3.0_R15_ECOSYSTEM.md)，没有宣布复杂混装已通过 |
| M7 | Host0.1.2 + 官方 lab15 明确配对；作者配方精确依赖同步、MotionHub0.1.3 避免覆盖旧包；当前经典构建仍独立 | 既有打包工具与锁文件；本地源码固化，报告和证据不放进安装包 |

衣柜主操作仍然单击穿戴，没有恢复浏览模式实验。未新增 Framework、状态代理、交易引擎、全局动作底栏或 Widget。

## Validated

### 环境与固定输入

- 工具：已安装 Paisley Park 6.1.0 White Snake；标准 execution-context、web-click、restart，CDP 原状态断言，Android 原生 screencap；Windows 项目 Playwright/Edge156。没有升级或重装工具。
- 平板：M367FC，Android17，WebView154.0.8037.58，独立包 `com.vrelnir.dol.lyra.uicompat051213`。固定当前0.5.12.13，Loader2.101.1，SugarCube2.36.1+34。
- Windows：真实编译0.5.12.13 HTML SHA `c6441487307e66b79f34b62a75497bd4cdca911a6ab60beb90a329d7233d65f0`；第二版0.5.11.9 HTML SHA `3104933a6e5cd3c7876caa057556bd467e60c90460faddca62d1e36b6cbcabd6`。同一 Loader2.101.1、SugarCube2.36.1+34，独立临时浏览器/HTTP来源。仅在内存中替换标准内嵌 Mod 清单，不改原 HTML 文件。
- 现有 Node26.12.0、npm11.20.0、Python3.14.7、Vite7.3.6、锁文件与 node_modules。不安装依赖。

### 本轮收据

均在本地 `tests/artifacts/stone-free-r15/`，原始截图与状态不随安装包分发：

| 收据 | 结果 / 证明范围 |
| --- | --- |
| `desktop-1792236346989/result.json` | 0.5.12.13 保存/读回/文本导入导出/无UI读取、购买并穿戴、触手回合、设置/Inspector退出及清理 |
| `desktop-1792236376830/result.json` | 同一组运行资源在0.5.11.9完成保存/读回/文本导入导出/无UI读取、设置/Inspector及清理；不含本轮新商店/战斗业务 |
| `android-1792236606459/result.json` | 最终 Host0.1.2 + lab15 运行资源，在平板完成保存/读回/文本导入导出/无UI读取与设置/Inspector |
| `android-1792236606459/result.json` / `restore-verification.json` | 自有测试槽清理与其它存档details相等记在result；原Mod活跃/隐藏清单和UI偏好重启读回记在restore-verification |
| `classic-smoke.json` | 新构建经典入口真实游戏 Start 运行，2.7.0 / API1 / 无Host，destroy正常；不是新一轮全部2.7验收 |
| `package-audit.json` | 条目、依赖、关键资源摘要、文档修订前包体精确重构及R14包保全 |

存档恢复均核对金额1734、测试名称及 Wardrobe。metadata 的 gameTime 为 `2022/9/4 07:00`，来自实际游戏时间。读取后旧 Binding、State 对象和旧 Passage DOM 均失效，新衣柜只有一次挂载；公开同伴 Source 仍可读。

平板选用原先为空的4号槽；Windows为新浏览器的空1号槽。测试前不覆盖原槽，删除前复核测试标记。其余原槽只比较 `getSaveDetails()` 的前后摘要，不读取/改写其完整私人 payload，也不声称私人存档逐字节一致。存档码仅保留测试页面内存，导入走原文本控件和原 handler，不复制到系统剪贴板或发布证据正文。运行结束恢复原Mod和偏好，游戏停在重启后的原入口，不声称恢复到用户先前内存中的游戏场景。

### 业务结果

Windows0.5.12.13 一次原“购买并穿戴”：head / beanie，价格3000，金额101734→98734，worn从hairpin→beanie。UI没有额外显示confirmed；其它目的地不套用送回衣柜公式。只读后态支持这次操作结果，未声称覆盖套装、任意条件或全部目标衣槽。

战斗通过原 `Hypnotist Test` → `Hypnotist Test Tentacles` 链接和原宏初始化，8条触手，UI存在，原继续使 passageCount7→8。active仍为8，未预测“每回合必减少”。退出由Engine准备原Finish Passage、执行原结束宏后点原Back home，combat恢复0；这不是自然胜利或结算验证。没有拼造私人战斗 State，历史 GER Pending/Unknown 不动。

### 定向源码 / 组件验证

- `npm run typecheck`、`npm run framework:check`、`npm run lab:check`；现有构建与打包；经典 `vite build --outDir tests/artifacts/stone-free-r15/stable-build`；`render-state-fields.cjs --check`。
- `tests/framework-bridge.cjs`：无桥不执行场景、load之后晚到jQuery、两段订阅分别失败后的撤销/重试、读档失效、persistent同伴及解除订阅异常的fail-closed。是明确标记的故障夹具，不冒充两个真实版本都遇到过相同故障。
- `tests/wardrobe-mode-cleanup.cjs`：同State同模式正常恢复；State替换不写旧/新对象；后继模式保留。
- `tests/framework-reference-shelf.cjs`：持久参考来源更新、独立清除和卸载。
- `tests/framework.cjs`：32项既有公共基础合同通过；静态组件夹具显式完成自己的 synthetic scene，无桥pending另断言，真实桥由新测试和真实游戏证明。最终收据 `stone-free-foundation/browser-1792236705240`。
- `tests/framework-connect.cjs` 本轮已通过，收据 `stone-free-connect/browser-1792236237283`。
- `tests/framework-author-kit.cjs`：因Host配对版本改变，重新核对源码包摘要、生成的精确依赖、作者修改保留、类型/构建/打包及390px浏览器挂载/退出；收据 `stone-free-foundation/author-kit-1792236747260`。不是新作者 Mod 的真实Loader验收，也不是物理触控。

未改的原Source、交易确认、低频导航和motion反例复用R14有效证据，不逐项重复。构建成功不替代上述真实业务结果。

## Experience Findings

实际读档返回衣柜后可继续使用，旧状态引用没有延续到新界面。原菜单、存档面板和Inspector按原有方式使用。公开会话快照在其它布局保持打开时也能提示来源过时，避免“仍来自本场景”的误导；不会恢复旧购买/穿戴操作。

截图 `android-1792236606459/native-load-restored.png` 为同设备原生截图；Windows另有购买和触手回合图。没有观察到本轮序列的新遮挡或明显操作失败，但这不是新一轮审美/所有尺寸/长期性能验收。既有Ocean/Acrylic及motion继续保留，本轮没有新主题或无依据的动画改造。

## Architecture Findings

Host核心、公开协议和API v1未改。引导桥只解决公共对象可用与安全场景的时间差：初始binding无效，接到真实完成事件或核对已渲染Passage才就绪；100ms重试最多30秒。到期仍无桥则相关场景操作保持退让，不自动扫描/接管其它运行时。订阅失败先撤销部分绑定；撤销也抛错时关闭核心，残留包装回调因closed不再操作。

`:onloadsave` 真正来源已核对：DoL `game/01-config/sugarcubeConfig.js` 的 `onLoad(save)` 调用 `$.event.trigger(':onloadsave',{save})`，经 `Save.onLoad.add(onLoad)` 接入。0.5.11.9本地源码第70/73行及当前编译0.5.12.13均存在。它不是SugarCube自身的稳定公共事件；跨游戏版本须复核。

衣柜await后原先无条件写旧variables的模式；现在同时核对当前State对象和预期模式，loop也拒绝State替换。没有取消原本正确的正常恢复，没有新业务状态镜像。具体模式和原inventory结构留在官方领域，不移入Host。

正式2.7制品/安装保留。研究经典输出共享这项安全修正，因此不能说与已发布2.7逐字节相同；其Start和API1独立性已核对。

## Compatibility Findings / 配对与安装

本轮研究配对：`StoneFreeHost-0.1.2-experimental.mod.zip` + `DoLGameUI-3.0.0-lab.15.mod.zip`。Host协议仍0.1-experimental。NativeStatus等本轮消费者按Host0.1.2精确声明；独立MotionHub为0.1.3，作者Kit为0.1.2。Host无需官方UI，独立发行不等于任意版本混装或整包热卸载。

隔离测试安装：启用对应Host与官方UI，并满足原ModLoader/TweeReplacer依赖；停用旧DoLGameUI/其它官方研究UI，保留自己的Mod列表与存档备份；按原Loader方式重启确认。普通试用不用安装所有样例、MotionHub、WardrobeReference或作者源码包。不称一键安装。该步骤是研究试用说明，不代表正式发布已授权。

## 制品身份与源码关系

| 对象 | 字节 | SHA-256 |
| --- | --- | --- |
| Host0.1.2 ZIP | 11616 | `34e0df095fbca7793878fcd8171187c215bea586e4820309fce5365097017aae` |
| 官方lab15 ZIP | 190117 | `c21ad41a57e2d936cf3659d01416064383ef6824258a90b6b33d86bb8831b9a3` |
| 官方index.js | — | `fbced5c42876b47eb4733a1b206a118b9a6f7405ce38bfaf393b118b6254cc4d` |
| 官方style.css | — | `5068b271180bc7d5675890dbed4d07e676170560085fb220a54b3f9ebac6a346` |
| Host index.js | — | `5b7818db0802255c535db6ae73fcd6d7cb15b224fc0c9711ed71fce46cc2b495` |
| AuthorKit0.1.2源码ZIP | 13339 | `a6e3db87bcd7ae00f24c483fbae7017a174f4f5eecaafbecca707a3154ef5ef2` |

Windows收据的Host/NativeStatus ZIP分别为 `d7b91a…` / `0a0384…`，最终Android为 `34e0df…` / `162803…`；差异仅通用README更新。两端实际官方ZIP为 `dafab9…`，最终 `c21ad4…` 仅更正README的本轮存读档范围。审计用相同固定ZIP条目元数据、最终全部条目和之前README精确重构，得到收据记录的完整旧SHA；因此运行资源相同，不是仅凭文件名判断。第一次重构忽略Git LF与Windows CRLF差异失败，修正为当时实际字节后吻合；不是运行代码漂移。

包仅含运行资源、原四项补丁、早期脚本、API声明、设置/适配说明及必要许可，未含测试数据/截图/APK/收据。构建自当前研究源码后本地提交固化；没有从提交另建环境独立重建，不称固定提交字节级复现或正式发布验收。

## Failed / Unknown

- `desktop-1792236051984` 为调用方eval顶层await语法错误，发生在写入前。`desktop-1792236080097` 修改V后未提交原游戏历史时点，原IDB保存metadata名称为空，等待标记失败；删除保护正确拒绝清理身份不符槽。仅独立临时浏览器内，保留cleanup-failed收据并关闭浏览器，没有对同一槽盲目重试。之后在新隔离游戏通过原Engine提交历史再保存。此项是项目测试准备错误，不是UI或Tools保存缺陷。
- `android-1792236346988`、`android-1792236416741` 在启动绑定时超时。原生事实是睡眠/锁屏/NotificationShade，标准unlock返回需人工认证；未安装测试包、未写存档。用户手动解锁后新绑定正常。不是已确认Tools缺陷，不绕过锁屏。
- Host故障夹具首次类型缩窄和handler条目数断言错误已纠正；基础fixture原先假定无游戏桥也能有当前binding，改为显式synthetic scene。保留中间失败，不把它们写成真实宿主故障。
- Windows仍有启动泛化Event与缺图片资源的历史限制，原因Unknown；没有因此宣称真实Android预览失效。Doctor输出父目录问题与之前反馈重复，不新增已确认工具Bug。

## Release Gaps / Not validated / Known limitations

本轮范围无剩余阻塞实现。正式发行仍需确定最终协议/API支持承诺、Host/UI正式版本及升级/偏好验收范围、玩家说明和正式发布决策。当前两版结果只覆盖所列固定游戏资源、Loader和操作，不证明未来版本或全部业务。

Additional coverage：物理手机/IME、新WebView、文件导入/系统分享/云端写入、自然遭遇/胜利结算、套装等交易、第三方库存语义、长期性能和A/B/C/D复杂社区混装。它们不自动成为R15未完成工作。R14未复现的动物演示源码疑点仍不升格为真实Bug。

已加载元数据与生态兼容结论分开；[生态准备](STONE_FREE_3.0_R15_ECOSYSTEM.md)尚未跑组合矩阵。[独立工具反馈](STONE_FREE_3.0_PAISLEY_FEEDBACK.md#第十五轮增补锁屏历史快照与有限工具出口)没有提出新Runtime或Provider改造。历史GER未决Effect、正式App和私人长期存档保持不动。
