# Stone Free R17：RC 就绪评审

2026-10-17。结论：**RC Ready with Limitations，限本地候选与下述配对**。本轮没有新的产品阻断缺陷；可以交由负责人决定正式 RC 的版本、支持范围和发布。没有推送、合并、Tag 或 Release，也没有把实验协议自动冻结为稳定合同。

## Delivered

- 固定 R16 最终源码 `957122d541e7c33619882d65b23f854e5eaf0f57`，入场干净；R16 H/U/AuthorKit 的原摘要复核不变。正式2.7源仍为 `965afcf119260886319f5beb6616362acb306a09`。
- 新候选：Host `0.1.3-experimental` + UI `3.0.0-lab.17`，精确配对。公共协议仍为 `0.1-experimental`，原 UI API v1 保留。具体支持建议和偏好分类见 [政策](STONE_FREE_3.0_R17_POLICY.md)。
- 玩家只需要 H/U 两个 Mod。增加玩家用 Host 说明、重写官方 UI 安装/升级/回退说明；`--players-only` 可仅打两包。同步可选作者配方的 Host 依赖与文档，未添加运行能力。
- 完成 Windows 和 Android 的实际2.7升级、重启、原存档读取、偏好检查、回退与读回。原版优化等来源 Mod 业务状态保留。
- 沿用[功能矩阵](STONE_FREE_3.0_R14_COVERAGE.md#r17-增补2026-10-17)。没有重做衣柜、商店、战斗或低频页面，没有恢复衣柜浏览模式、全局动作底栏或 Widget。

## 固定来源与最终双包

最终制品源码：`3c9782595a06f7b1e73e6c0c9e66af730b88e35b`。在 `tests/artifacts/stone-free-r17/fixed-source-3c97825` 中通过 `git archive` 导出该提交，使用现有 node_modules junction；没有安装依赖或修改全局环境。锁文件 SHA-256：`b5c2ffb5e596baed79a9da099f0cdaa81d5f030216427f0191ff488618b0467b`。

环境：Node26.12.0 / npm11.20.0 / Python3.14.7 / Vite7.3.6。实际命令：`npm run framework:check`、`node scripts/build-framework.mjs`、`python scripts/package-framework.py`；打包前由既有构建脚本重新生成早期商店脚本与公共类型。可选作者配方版本变化另跑 `node tests/framework-author-kit.cjs`，独立解压、作者编辑保全、类型检查、构建/打包和390px运行通过；这不冒充真实作者 ModLoader 安装。

| 玩家制品 | 字节 | SHA-256 |
| --- | ---: | --- |
| StoneFreeHost-0.1.3-experimental.mod.zip | 5771 | `b90b7766f00972e661e9edcc89e0a708a7def163f54e81d85f769741d8af7df5` |
| DoLGameUI-3.0.0-lab.17.mod.zip | 189688 | `c9fecc686429e1382719b2c595581a289f9cf52fbc80b5e5fd7f1bb81c114a37` |

交付目录：`dist/rc-r17/`，仅这两份运行ZIP和 INSTALL、manifest、SHA256SUMS。研究样例和 AuthorKit 留在独立构建目录，不放入玩家必需列表。

关键成员：Host index.js `5b7818db0802255c535db6ae73fcd6d7cb15b224fc0c9711ed71fce46cc2b495`；UI index.js `8c23c36024dc25cf6da426a5dbd3ef75d5ab604c01917576cb658c8bea6e63d6`；UI style.css `5068b271180bc7d5675890dbed4d07e676170560085fb220a54b3f9ebac6a346`。

Host 运行成员与R16逐字节一致，仅README和boot身份变化。UI运行脚本只把 lab16 版本字面量变为 lab17；CSS、早期脚本、四项Twee补丁、API声明、说明附件及许可与R16逐字节一致。ZIP结构、boot、依赖、唯一且安全路径、全部清单成员和无证据/图片/APK/游戏内容通过检查。

216e8be、45faebd和最终3c97825的固定导出分别重建，最终H/U字节相同；没有仅重命名旧ZIP。Windows与Android安装的是45faebd生成的这组最终字节，实际Loader运行成员摘要与最终3c97825包逐项相同。后续报告提交不改变包内README或候选身份。这证明当前依赖环境中的固定源码重建和实测包一致，不是全平台、独立依赖环境的可复现构建保证。

## Validated：升级与回退

| 平台 | 2.7 → 候选 → 回退 | 新增证据 |
| --- | --- | --- |
| Windows Edge/Playwright，真实0.5.12.13 HTML + Loader2.101.1 | 35 → 36 → 35个实际加载包 | `windows-upgrade-1792240427706/result.json` |
| M367FC / Android17 / WebView154.0.8037.58，独立测试App com.vrelnir.dol.lyra.uicompat051213 | 39 → 37 → 39个实际加载包 | `android-upgrade-1792240427706/result.json` |

收据均位于 `tests/artifacts/stone-free-r17/`。Windows复用R16固定34包输入；2.7使用从平板实际加载的正式2.7 reader重新封装的ZIP（SHA `2f511e293ad1ba5cc2caf632e16be1efb18c2024f62e4651564abd641e1c66c4`），不冒充作者发行ZIP的原始字节。Android直接从原2.7安装起步，原存储包不覆盖，候选使用自有临时安装键，旧UI与三个外观包暂时停用；实际boot技术名始终只加载一份DoLGameUI。没有依赖同名冲突的赢家行为。

两平台都从新建游戏进入衣柜，在空槽保存本轮标记，升级后原控件读回，回退后再读回。金钱、存档名、衣柜、主装备、叠加数组及options与2.7测试前态相等；gameTime保留。不是仅看UI提示成功。测试档删除后其它原details相等；Android重启后原启用/隐藏清单和原偏好逐项相等。正式App和私人长期槽没有读写或迁移。

代表偏好涵盖字号110、按钮90、Fancy、玻璃/动态效果、宽阅读、紧凑状态、存档V2、分页实验关闭、悬浮入口隐藏，以及已有各页键和独立工作台哨兵键。2.7重启、候选升级及回退均保留。只证明这些代表值及既有键，不宣称任意无效旧JSON可恢复。没有新增偏好迁移；旧悬浮x/y继续保留，新Hub位置另存。

候选实测只安装Host/UI，无NativeStatus、独立MotionHub、WardrobeReference或AuthorKit运行依赖。界面总开关关闭恢复原内容，再开启衣柜可用。原有上装目录可实际打开参照、对照、返回，关闭动态效果后仍可操作；Hub开关3循环挂载数不增长，关闭无Hub残留。此次未切换系统prefers-reduced-motion，相关合同复用R14/15证据。自动操作不是物理触控证明。

Windows390px时文档宽度390，无页面横向溢出；截图保留了展开的原侧栏，因此不能将其用作正文可读或触控完成证明。窄容器布局与中断/离场证据复用R14–16，CSS和组件运行逻辑未变。Android截图保留完整像素素材和实际页面；Windows缺部分游戏图片，不将这些404归为UI包缺资源。

## 原生动作合同的定向核对

| 接缝 | 本轮结论及依据 | 限制 |
| --- | --- | --- |
| 穿戴/脱下/毛巾 | src/wardrobe/native.ts 保留R16的wearlink_norefresh选择入口、capture上下文和单次点击；基准原Widgets与原版优化补丁核对 | 生成原Widget链接不等于所有第三方祖先DOM委托事件都兼容 |
| 整理/修理/转移/剪开 | 原入口在这些模式中为选择索引、模式/目的地后调用updatewardrobe；当前operations和State新鲜度检查保留，已知Optimization选择补丁明确排除非wear | 未证实新的语义绕过；复用R15/16定向与旧真实夹具，不冒充全部社区批量业务新验收 |
| 商店 | src/shop/source.ts保留实际原按钮；校验State、definition、报价、原range和一次消费；原handler仍执行前置业务 | R16单件/第三方及R14多件、R15购买并穿戴复用，不扩大到未知目的地/套装 |
| 战斗 | src/combat/source.ts保留原radio/select/目标与继续，阻止同步重入而不阻断下一回合 | R14–16真实原演示/触手回合证据复用，不复制结算、不宣称自然胜利 |
| 存档 | src/saves/source.ts复核真实槽位/控件/revision后原按钮单次执行；metadata不改格式，读档使旧绑定失效 | R17新增升级/回退真实存读；文本传输复用R15，文件/云未测 |

本轮检查了当前原游戏Widgets Wardrobe及R16固定来源补丁，没有依据把所有操作重构为临时Widget，亦没有创建统一Action框架。framework-connect、framework-bridge、wardrobe-native-link、wardrobe-operations定向检查通过；未重跑与本轮无关的全项目回归。

## 生态告警处置

`configuration-different`现在有更具体的证据：Windows实测运行顺序与保存顺序不同，同时银商启动的addonPlugin运行档案与ZIP声明不同。Android恢复2.7后同样存在。逐项比较确认差异是ModdedClothesAddon给12个衣槽项加入解析后的data；移除这些运行期data后，addonPlugin与ZIP声明完全相同。固定 `18-ModdedClothesAddon.zip` 的 dist/ModdedClothesAddon.js 有 `c.data = JSON5.parse(data)`。因此该boot比较项不能直接证明“UI升级没重启”或“用户安装损坏”。顺序仍需分别看加载器实际处理，不保证所有配置告警都是同一原因。证据：configuration-difference-summary.json；原始对照只留本地。

共同天气/图像错误、TypeError、Twee未匹配、五项共同修改目标及LyraMouth范围暂不能核对继续保留。R16 C/D已证明核心任务和这些告警可以同时存在，但没有证明所有相关业务无害。未触发分支/具体TypeError因果仍为Unknown，不关闭日志、不修第三方来凑全绿。旧外观包/API1兼容复用R16实际安装；Maple云端未进入，不扩大声明。

## Failed 与诊断纠正

所有失败收据保留，没有反复重跑未经改变的操作至绿：

- android-upgrade-1792239998724：2.7偏好写入后立即force-stop，UI偏好和独立哨兵键都未保留。加入1.5秒等待后的2.7基线和后续重启均保留。支持当前WebView存在立即强停的持久化时序风险；不证明所有设备的底层原因，不把它当3.0迁移缺陷。正常Loader重载与立即强停不要混称。
- windows-upgrade-1792239998725：ModHub延后出现的日志遮罩拦截开始按钮；等待原通知、关闭原窗口并选稍后重载，没有force-click或停日志。
- android-upgrade-1792240069315及windows-upgrade-1792240093789：脚本刚改当前变量就保存，未推进原moment，存档名为空。按已有R16流程先经Engine进入Wardrobe后再保存成功。Android空槽4由写入前空槽、实际单次按钮、创建时间和其它槽未变证据确认归属后仅删除该测试档；不是按空名称删除任意存档。旧失败收据中的cleanup-failed仍保留，后续cleanup-known-test-slot记录补充恢复。
- 两平台1792240230626：默认头饰库存为空，脚本误以为必有参照按钮；1792240347816改选实际有衣物的上装后发现两个按钮，原selector仍不唯一。最后使用当次观测节点的唯一标记，不强制点击，不改产品逻辑/断言。Android“Web target unavailable”在本例不能推断成断连；现场App与CDP仍可读。

## M8：就绪分类

| 维度 | 判断 | 决策边界 |
| --- | --- | --- |
| 独立架构、H/U交付、原操作所有权 | Ready | 正式UI无研究同伴运行依赖，公共合同不变 |
| 2.7升级与回退、测试数据保全 | Ready | 两个平台真实路径通过，原安装恢复 |
| 高频/低频功能完整性 | Ready，复用有效证据 | 沿用R14矩阵与R15/16补充；成熟服务仍部分由主消费者destroy释放 |
| API稳定承诺 | Known Limitation / 待负责人决定 | 实验协议和精确配对，未承诺任意独立升级 |
| Windows/Android与版本 | Ready with scoped coverage | R17新包两平台0.5.12.13；0.5.11.9主要复用R15，未安装本轮精确配对 |
| 社区生态 | Known Limitation + Unknown | 固定组合代表性成功，不自动兼容所有Mod；共同告警未全部归因 |
| 视觉、交互、运行质量 | Ready，覆盖有限 | 动态/关闭动态、总开关、参照、Hub短循环；非长期性能/物理手机结论 |
| 制品来源、依赖、许可、安装材料 | Ready | 固定提交重建，最终字节与安装成员核对，玩家仅两ZIP |
| Widget、任意布局、全局动作增强、热升级 | Deferred | 非首个RC范围，不构成当前缺失实现 |

**Needs Fix：本轮没有剩余产品阻断项。** 建议进入正式RC决策；先由负责人确认首版精确配对和实验协议支持措辞，再另行授权Tag/上传/发布。本地候选就绪不等于3.0稳定版全面验收。

Not validated：物理手机、IME、新WebView/旧浏览器、完整0.5.11.9候选安装、全部低频交互/第三方功能、自然战斗结算、未知新衣槽、远程服务/云端/文件选择、长期性能。Host需要AbortSignal.any等当前实验环境能力，不承诺所有旧WebView。没有扩展社区数量，没有Full Evidence/Perfetto/bugreport或GER Store变更。
