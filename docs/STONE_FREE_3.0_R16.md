# Stone Free R16：真实社区生态对照与发行差距

2026-10-17。本轮范围 **Completed，覆盖有限**。研究分支 `research/stone-free-3.0-framework`，入场为R15最终本地提交 `a95a3ba88e4571b16bc7717f559074595d164e08`，工作区干净。固定输入、实际四组对照、一项行为兼容修复及代表性Android复验已完成。没有推送、合并、Tag或Release，不宣布正式3.0 RC。

## Delivered

- 固定34个真实加载包的导出ZIP、成员摘要、依赖和插件声明；实际装配与Mod数量分开统计，来源限制明确。
- 执行Windows A/B/C/D，加入旧外观包的独立补充条件；Android补复杂D，测试槽、Mod清单和UI偏好恢复已核对。
- 修正衣柜快穿绕过来源Mod叠加规则的问题。`src/wardrobe/native.ts` 在wear/strip/毛巾路径生成并执行原 `wearlink_norefresh` Widget链接，使用原 `selectWardrobe()` 和捕获的临时上下文。现有Source在前复核；不重写叠加、库存或战斗业务。
- 原入口结构未知、错误节点或不唯一时拒绝，不退回旧低层调用来盲目执行。链接是临时生成的原Widget入口，不冒称直接复用了原页面DOM节点。
- 官方候选前进到lab16；Host0.1.2、协议0.1-experimental、作者Kit和UI API v1保持。更新既有覆盖矩阵、安装说明与工具反馈。

没有修改第三方原ZIP或Tools仓库，没有新增通用兼容框架、Runner、数据库、GER目标或状态代理。

## Input Identity

详见[固定输入、摘要与执行入口](STONE_FREE_3.0_R16_INPUTS.md)。原ZIP和现场材料保留本地忽略目录，不提交上游包或私人数据。

- A：23个Loader基础插件 + Lyra整合标识，共24包。
- B：A + Host / NativeStatus同伴 / 官方UI，共27包。
- C：34包；比A增加10项社区/整合/兼容扩展，包含MapleBirch5.4.3、ModHub1.7.0、CE1.20.3.1-rebuild.28、银商启动1.5.6、原版优化1.1.1.5等。
- D：相同C + 3个Stone Free包，共37包。
- D-adapters：再加入三项未改声明的旧外观包，共40包。不是C/D主对照的一部分。
- Android D：相同受测社区成员，另保留已安装ModI18N平台条件，实际加载38包；不能把APK与Windows HTML称为同一字节输入。

34包中23个是基础插件，不宣传成34个内容Mod。导出重封装ZIP不冒充作者Release；CE明确是本地已装重制版本。依赖按原声明和实际加载核对，没有改门禁强行通过。ModHub仍报告部分范围不能核对；不能把“提供者存在”扩大为全部插件接口/依赖语义已证明。

宿主固定0.5.12.13、Loader2.101.1、SugarCube2.36.1+34。Windows为Edge156与编译HTML；Android为M367FC、Android17、WebView154.0.8037.58及独立测试包。HTML和APK各自SHA在输入文档及本地收据中。没有再下载另一套工具或游戏。

## A/B/C/D Findings

各组独立浏览器/HTTP来源，从原新游戏开始。A/B、C/D的初始金额500、时间2022/9/4 07:00及各槽库存数量分别完全相等；没有用购买后的A继续做B。外观/随机NPC未强行设成同一随机种子，不按绝对随机战斗结果比较。两对采用同类任务；A/B买原版beanie，C/D买真实第三方商品，不把跨两对商品差异当作UI效果。

| 组 / 实际收据目录 | 结果与边界 |
| --- | --- |
| A `desktop-A-1792237905096` | 原购买、普通穿戴、保存/读回、原演示回合及清理通过；24实际加载包 |
| 原B lab15 `desktop-B-1792238021901` | 旧UI基线普通穿戴、比较、存读档、回合和Hub通过；不含叠加合同 |
| 原D lab15 `desktop-D-1792238103547` | 当时脚本标pass，只证明旧“主装备替换”假设；与C原行为比较后确认语义不一致，**不能作为叠加兼容通过** |
| 最终B lab16 `desktop-B-1792238347591` | 修复后普通穿戴、比较3循环、存读档、回合和Hub通过，27包 |
| 最终C `desktop-C-1792238347595` | 来源原衣柜把商品加入叠加，主装备hairpin不变；原生保存/读取、回合、ModHub菜单通过，34包 |
| 最终D lab16 `desktop-D-1792238347591` | 与C相同原叠加结果、扣款和扩展状态读回；Fancy比较/Hub/同伴保全，37包 |
| D-adapters `desktop-D-1792238494358` | 40包加载；原版优化/ModHub外观命中并保留原生操作；云页未测 |
| D-fallback `desktop-D-1792238789336` | 展开原版扩展信息，点原链接卸下叠加衣物，再从UI重新叠加；之后保存/读取与其余流程通过 |
| Android D `android-D-1792238414063` | 最终原样ZIP实际加载，第三方购买、叠加、扩展状态读回、回合、Hub及原配置恢复通过 |

以上目录均在 `tests/artifacts/stone-free-r16/`。`comparison-summary.json` 对照实际结果；每次 `result.json` 记录ZIP身份、实际运行版本、原状态和动作，截图来自对应浏览器或同设备原生screencap。Windows还从实际Loader reader读回声明JS/CSS/Twee成员摘要；这不能证明每条Twee规则命中。Android未另跑A/B/C三组，已明确仅作D代表性补测。

## Compatibility Findings：R16-W01

**真实缺陷：lab15快穿绕过原版优化的叠加语义。**

固定原版优化1.1.1.5导出包在 `twee/replace/叠加服装部件衣柜链接.twee` 修改原 `wearlink_norefresh`：开启WornStacking、当前主装备非空且模式为wear时，把选择项移入 `V.wornStacking`，不设置主装备的wear索引。后续仍调用原updatewardrobe。

旧UI直接设置wear索引并调用updatewardrobe，只复用了下半段，因而同一操作在C叠加，在D替换主装备。原C失败截图保留实际叠加说明和状态；旧D收据保留主装备变为第三方帽子。这不是仅凭“共享同一Widget”推断的冲突，也不是购买失败。

修复只改官方UI的操作入口；原选择、规则、扣除库存、叠加与更新仍由当前游戏Widget执行。B无此扩展时保持普通穿戴；C与修复D在WornStacking开启时都保持主装备hairpin并加入同一第三方帽子。Android复验相同。原扩展入口可卸下/排序，UI不复制叠加管理状态；不承诺所有依赖原DOM祖先委托事件的第三方也会自动兼容。

### 负对照及保留告警

ModHub已有检查在C/D分别列出83/87项声明目标、相同5组共享目标；StoryCaption、overlayReplace等重叠并未阻止受测菜单、存档和回合。这里只能说明列明功能共存，不能将静态交集都判成冲突或宣布全部规则正确。

C/D都存在天气/资源错误、TweeReplacer未匹配及TypeError相关提示，另有配置/运行不同、部分版本范围不能核对。Windows服务器未提供完整原图片，网络被CSP限制；资源错误有直接环境条件，但不能把所有TypeError/Patch错误都一并归为缺图片。其余未触发业务的影响、具体组合根因仍为Unknown。没有删日志、吞异常或永久关闭业务Mod来制造全绿。

## White Snake Findings

- **调查**：使用已安装6.1.0 Skill，冻结resolver位置、初始条件知识摘要及输入（`challenge-input.json`）。借助原Loader成员、C/D后态、ModHub现有声明检查及源码，识别原动作边界差异；没有另写Patch分析平台。
- **修复**：UI消费者的有限原入口修正，类型/构建、单次派发反例、普通业务负对照、真实复杂D和Android闭环通过。原Mod及其它入口保留，不以停用业务代替修复。
- **经验**：记录R16-W01的版本、WornStacking条件、负对照、原Widget选择段和已知限制；适合作为后续条件知识。没有向工具仓库写入经验，没有独立盲测或新版本迁移试验；不能用重复同题和另一个平台就宣称泛化学习成功。

本轮没有确认的Paisley Park实现缺陷。JSON5解析、测试中的名称/换回库存假设、不可见卡片选择都是调用方/项目脚本问题；首次说明和日志遮罩是正常现场条件。详见[独立工具反馈](STONE_FREE_3.0_PAISLEY_FEEDBACK.md#第十六轮增补操作入口语义与负对照)。

## Gameplay Findings

- **商店**：A/B的beanie价格3000，金额100500→97500、库存+1；C/D/Android的银商启动帽子价格1500，金额100500→99000、库存+1。每次只派发一次原送回控件，D显示confirmed。既有合同只确认该受支持交易，不外推套装/未知配送。
- **衣柜**：C/D/Android原叠加后的主装备hairpin保持，第三方帽子进入wornStacking；A/B为普通主装备穿戴。D保留3次公开参照比较，真实库存没有因只读比较改变。D-fallback进一步证明扩展入口可见、原卸下生效和UI重新叠加。
- **存档**：独立空槽记录本轮标记；改变金额后读回99000或97500、名称、主装备及叠加数组。C/D的原版优化选项存在性保持，D旧State/DOM/Binding失效，新binding有效。没有修改metadata格式或读取/迁移私人旧档。清理前核对标记，只删自己的槽，其余details前后相等，不称私人payload逐字节审计。
- **菜单/旧外观包**：原ModHub实际打开关闭。DolOptimizationSoftWet0.1.6-rc.1在存档页full/active，原编辑标题与原槽位控件保留，保存/读取通过；ModHubSoftWet0.2.4在ModHub页Style Only/full/active。MapleBirchSoftWet0.2.4在普通存档页unknown/safe-fingerprint-mismatch，不将尚未进入云页的状态判成云端失败。
- **战斗**：原Combat Demo准备一个人类，原继续使计数8→9，combat保持1；原返回后combat0。第三方CombatStatusDisplay-Lyra实际同时加载，但并未单独证明其所有显示分支或特姿战斗功能。不是自然遭遇、胜利或结算。
- **隔离**：消费者退出后只剩NativeStatus同伴且公开来源可读；ModHub仍存在。Android不覆盖社区原包，恢复原活跃/隐藏列表及UI偏好并重启核对；游戏停在重启入口，不声称恢复原内存场景。历史GER Pending/Unknown未动。

## Experience & Performance

Fancy档位、visualMotion开启，系统reduced motion为false；没有通过关闭动画换取通过。衣柜参照比较和Hub各3个开关循环，Hub前后公共mount均2，退出清理成立。平板实际图像显示第三方帽子，保留Eyes/Ocean/Acrylic及现有空间运动。Windows缺完整原图片，因此头像/天气表现不能充当完整视觉验收。

受测操作均可命中并完成；没有定量测量触控延迟、FPS或长时间堆增长。没有采集全局监听器趋势，不将短序列mount相等写成长期无泄漏。Android截图中出现来源Mod的小型衣柜提示，没有据此认定主界面遮挡缺陷；更多提示与输入情境属Coverage。未使用物理手指输入，未验证手机/IME。

## Build / Product Coverage

`npm run typecheck`、`npm run framework:check`、研究构建/打包、新 `tests/wardrobe-native-link.cjs`、既有 `wardrobe-mode-cleanup.cjs` 和 `wardrobe-operations.test.cjs` 通过。新测试检查原入口单次执行、临时上下文、未知/多入口/错误节点拒绝，无动作回退重试。

共享穿脱接缝改变，另做独立经典构建并运行 `tests/wardrobe-features.test.cjs`：真实0.5.11.9隔离夹具中的毛巾/浴巾、原整理/修理/转移及模式恢复通过。它含受控测试状态准备，不是私人存档或完整2.7 Gameplay回归。没有覆盖已发布2.7 ZIP，经典输出仍独立，无Host依赖。

既有[功能矩阵](STONE_FREE_3.0_R14_COVERAGE.md#r16-增补2026-10-17)已补本轮证据；其余成熟模块及R15的文本导入导出/生命周期证据因相关实现未变而复用。本轮主要收口真实兼容接缝，没有恢复衣柜浏览模式、Widget或全局动作底栏。

## 制品与源码

| 对象 | SHA-256 |
| --- | --- |
| Host0.1.2 ZIP，不变 | `34e0df095fbca7793878fcd8171187c215bea586e4820309fce5365097017aae` |
| 官方lab16 ZIP，190429字节 | `58ed39d70e37b0232b709bdbbb0a47363e04ff57b4d5f911d8a3b04b13930975` |
| 官方index.js | `dba0d5bbacae4e42eb27c845da04597c92e772bb22cf4a6467f325cda4d46db9` |
| 官方style.css，不变 | `5068b271180bc7d5675890dbed4d07e676170560085fb220a54b3f9ebac6a346` |
| 保留lab15 ZIP | `c21ad41a57e2d936cf3659d01416064383ef6824258a90b6b33d86bb8831b9a3` |
| AuthorKit0.1.2，不变 | `a6e3db87bcd7ae00f24c483fbae7017a174f4f5eecaafbecca707a3154ef5ef2` |

`package-audit.json`验证可解析、无重复/异常路径及实际内容；相对lab15仅README、boot.json、index.js变化。四项Twee补丁、早期脚本、声明、设置说明、许可和CSS相同，不包含证据/截图/APK。Windows最终B/D与Android实际加载的就是上表最终ZIP，没有借历史README等价包冒充重装。本轮源码本地提交固化；没有固定提交的第二次独立重建或正式发布证明。

## Release Gaps

R16本轮无剩余阻塞修复。可以进入有限3.0 RC规划评估，但**不是立即全绿发布**。发行决策需要：

1. 确定首版Host/UI正式配对、实验协议是否及如何承担稳定维护承诺；没有因本轮自动升级API。
2. 确定支持的具体宿主/组合，以及C/D共同Patch/范围/配置告警中哪些作为已知限制、哪些业务需发布前专项验证。不能把未排查的社区功能宣传为全面兼容。
3. 明确2.7升级偏好、安装/回退与目标设备的最终RC验收范围。现有Android恢复证明和R14/15证据可复用，不能替代正式清单决定。

无需兼容所有Mod才能发布；也不要求为这些决定新增平台或再次全项目重写。稳定版、历史制品、原Mod和私人长期数据保留。

## Failed / Unknown / Not Validated

- `desktop-A-1792237748959`大小写名称匹配失败；`desktop-A-1792237832146`误以为换上同variable发卡后库存必少一，忽略旧发卡换回。两项为脚本错误，后续选不同主装备且核对明确结果；没有重派同一未知购买。
- `desktop-B-1792237937207`按variable查UI展示文本时大小写不符；`desktop-C-1792237937207` / `desktop-C-1792238021901`首次框架说明、ModHub日志/重载遮罩拦截，按实际原控件处理，无force-click。关闭诊断窗不是停用日志，原告警保留。
- `desktop-C-1792238085098`错误期待主装备替换，实际显示来源叠加成功；随后与lab15 D后态对照形成R16-W01。旧D脚本的pass不能推广为合同一致。修复后C/D明确核对主装备和叠加数组。
- `desktop-D-1792238403963`补充旧外观包时选中被该包有意隐藏的UI卡片；未派发保存，清理保持。改选可见原生按钮后通过，不修改来源CSS或强制点击。
- ZIP导出的ModI18N reader缺少生成对象，具体原因Unknown；初次“另一种容器”推断已撤回。JSON5尾逗号及Windows默认编码造成的本地解析失败不归为Tools缺陷。
- Windows Console有上限160且滤选，Android脚本未收全量Console事件；不能从空数组或核心通过声称所有日志无错。C/D共同天气/资源/Patch/配置告警及未触发分支仍保留Unknown。

Not validated：全部第三方功能、自然结算、未知新衣槽、云端/账号/远程服务、长期运行、物理手机/IME、新WebView、其它DoL版本的完整社区组合。没有Full Evidence、Perfetto、bugreport或新学习评测。这些不自动扩为R16未实现工作；遇到实际发布目标再定范围。
