# Soft & Wet 3.0 — Kraft Work：Release Integration & Regression Gate

2026-10-18。本轮整合已有视觉成果，增加负责人临时指定的衣柜详情抽屉，停止其它视觉扩展。**Stable Gate Pending，Owner Acceptance Pending，Release Authorization 未获得。** 本报告取代旧 Stable Gate 的当前状态，历史轮次结论保留。

## 1. 交付与身份

| 状态 | 结果 |
| --- | --- |
| Integrated | 运行源码、双包及内容摘要已冻结；保留 Acrylic、双布局、Hub、天气、游戏动效和原版回退 |
| Validated | 当前双包 Windows / Android 代表性业务通过；类型、构建、定向测试及 ZIP / 实际 Loader 成员核对通过 |
| Known Issues | 社区组合存在资源增长和未归因告警；selectedWardrobe 未复现，原因仍 Unknown |
| Not Validated | 无限时长运行、物理触控、全部交易/结算、全部 Mod、云端及系统文件选择；逐项边界见下文 |
| Owner Acceptance | Pending；不由 Codex 代替负责人判定 Visual Gate 或 Stable |
| Release Authorization | 未授权；未推送、合并、Tag 或发布 |

工作树 `E:/daima/DoL/experiments/stone-free-framework-30`，分支 `research/stone-free-3.0-framework`，Git HEAD 仍为 `014f469f4092d246cdcd22098fc9b5a943d029b6`。入场 34 项 tracked 修改、46 项未跟踪源码/文档/测试。保留原工作树、其它 checkout、Stable 2.7、公开 RC 和历史 dist，没有清理换取表面干净。

本轮没有创建 Git 提交。旧 HEAD 不能代表候选，准确依据是独立导出的 516 文件源码快照及逐文件摘要：

- 源码：`tests/artifacts/kraft-work-release-gate-20261018/source-final.zip`。
- ZIP SHA-256：`b0086c02f1849f7445f18dd83ca23558e9236300883bd07579d641d3c437e702`。
- 源树 SHA-256：`cfdda52d0cc92d1a8f70c16f3cb5c22ec789e9180c0ca278e119649449de0058`。
- 清单：同目录 `source-final-manifest.json`；入场状态、原差异和最初快照见 `entry/`。

该快照先于本轮最终报告。之后仅补充报告、覆盖矩阵和当前入口，不静默替换已验收的包内说明或运行文件。公开发行前仍需单独完成 Git 固化及标签指向核对；目前具备可追溯的本地候选，不是已提交/已公开源码。

收尾工作区为 40 项 tracked 修改、48 项未跟踪源码/测试/文档，暂存区为空；变更和证据都保留，没有 reset/clean。`runtime-freeze-verification.json` 确认冻结之后只有四份报告/入口文档变化，运行源码和包内文档未漂移。

| 制品 | 字节 | SHA-256 |
| --- | ---: | --- |
| DoLGameUI-3.0.0.mod.zip | 229052 | `f4ce2c208fd76d2d4398237bd0d72ad332c35614b4230766414620b736b11e4b` |
| StoneFreeHost-0.1.4-experimental.mod.zip | 6326 | `ad78fca929e3819fce4da6f0d10affb4fc91318661583e4dacec896b64936153` |

候选在证据目录 `final-candidate/`，附 `SHA256SUMS.txt`。UI 的 3.0.0 是本地包版本，不表示 Stable 已批准。

| 关键运行成员 | SHA-256 |
| --- | --- |
| UI index.js | `8ac6fe117c05efcddc9b655382aa75c7cc76beddcb2dfc6f6ff44f00d494ee67` |
| UI style.css | `4cd02eadde254e8d8fe8c41544ef2ac30a6af4b150f0619ea205940b3840efe9` |
| UI shop-page-experiment.js | `99b65b1abe7d8f2fd01f3788915926bbf078d1817cdd2d763840e1b64a6aa268` |
| Host index.js | `5b7818db0802255c535db6ae73fcd6d7cb15b224fc0c9711ed71fce46cc2b495` |

`final-candidate-identity.json` 保存 boot、完整清单和逐成员摘要；`package-validation.json` 记录 CRC、无重复/异常路径、许可/NOTICE、无截图/APK/测试证据，以及实际 Windows / Android Loader 运行成员逐项匹配。四项 Twee 补丁和公开类型保持。

## 2. 整合及构建

保留已认可的最终级联，不因两处样式声明就判定存在双重活动动画。R5 等独立研究路径保留为未启用研究，不装进玩家包。官方设置不展示旧三档质量模型，旧偏好值留作回退。`combatFocused` 默认 false，战斗 B 未自动启用。

本轮新增变更：

- Hub、Loader 昵称及玩家说明统一为 Soft & Wet 3.0 — Kraft Work；DoLGameUI、StoneFreeHost、公共协议和 API v1 不变。
- `衣物详情与特质` 使用已有 Surface 抽屉。移动原节点，关闭后归还，保留原事件、详情展开偏好及焦点；Passage 离开、装备变化和模块关闭先释放。单击衣物仍直接穿戴。见 `src/wardrobe/extras.ts`、`src/wardrobe/main.ts`。
- `tests/kraft-work-product.cjs` 的旧侧栏 0px 断言与已认可的当前 11px 微圆角及较新 `official-game-motion.cjs` 冲突。更新当前检查合同，没有修改产品 CSS 迎合断言，旧失败保留。

在内容寻址的独立源码目录构建，现有 node_modules 仅联接复用，锁文件保留，没有安装依赖。Windows x64，Node 26.12.0、npm 11.20.0、Python 3.14.7、Vite 7.3.6、TypeScript 5.9.3、Vue 3.5.43、Playwright 1.63.0。

执行通过：

```text
npm run typecheck
npm run framework:check
node scripts/build-framework.mjs
python scripts/package-framework.py --players-only
```

共享与 Framework 类型检查通过；最终独立目录重新检查 Framework、构建及打包，见 `final-check.log`、`final-build.log`、`final-package.log`。经典输出只为旧夹具在独立目录补建，没有清除原工作树 dist。

重建 Host 与公开原包只有 README 换行差异，运行 JS 相同。候选继续使用公开冻结 Host 原 ZIP，未在同版本下替换字节。包内容可由冻结源码及原 Host 重建/核对，未宣称 ZIP 时间戳、元数据及字节级可复现。

## 3. 功能与兼容矩阵

以下证据均在 `tests/artifacts/kraft-work-release-gate-20261018/`。Windows 使用真实 0.5.12.13 HTML、ModLoader 2.101.1，在隔离本地来源的 Edge 中运行，驱动控制不称物理输入。Android 为授权独立测试版 `com.vrelnir.dol.lyra.uicompat051213`，M367FC / Android 17 / WebView 154.0.8037.58，CSS 1363.2×876。

| 范围 | 当前结果与证据 | 边界 |
| --- | --- | --- |
| 设置 | 新旧配置、迁移/重复迁移、局部重置、总开关、双布局、长页滚动及输入阻挡定向测试；实际两端多次布局/控件开关恢复 | 单测/夹具不叫物理触控；负责人视觉批准单列 |
| 属性、社交、特质、成就、日志、统计 | 稳定性循环轮换真实原窗口及关闭/Passage，天气和装饰层在关闭后归零 | 不声称每个低频业务按钮都点过 |
| 商店 | 最终双平台实际原报价、一次购买扣款和入库、原退出 | 指定商品及送回路径，不推广全部交易/试穿/结算 |
| 衣柜 | 原穿戴/第三方叠加、原版入口卸下、新 UI 再叠加、参照/比较、详情抽屉；抽屉不改金额/库存/装备，按钮关闭和 Passage 释放 | 指定社区衣物及已支持槽位，未知内容保留原版入口 |
| Hub | 两端展开/收起/关闭，挂载数稳定，消费者退出后 Host 和 ModHub 保留；长序列重复开关 | 新 Hub 位置持久化任意设备矩阵未补 |
| 战斗 | 最终双平台原 Combat Demo 人类回合，原继续使 passageCount 前进，Bedroom 退出清理 | 非自然遭遇/胜负结算；B 只按可选范围定向检查，默认关闭 |
| 存读档 | 最终两端空槽保存、金额扰动后读回，叠加和状态一致；只删除自有槽，其它 details 一致 | 不操作私人长期存档，不迁移格式 |
| 文本导出/导入 | Windows 最终包原控件/处理器，117444 字符，金额/装备/库存/可序列化选项恢复，槽位不变；`windows-transfer-D-1792338524927` | Android 复用 R15 同机制历史证据和当前 transfer 单测；文件/云端未测 |
| 升级/回退 | 本轮 Windows、Android 实际 2.7→整合候选→2.7，原存读档/偏好保持；`windows-upgrade-1792336066716`、`android-upgrade-1792336219424` | 抽屉加入前整合包；保存/迁移代码未再改，抽屉和最终业务另有当前证据 |
| 天气/动效 | 强度、静态降级、reduced motion、输入/焦点、中断/定时器停止定向通过；实际晴/雨/暴雨/雷雨循环 | 用原 Weather 接口准备天气，不冒称自然时间推进观察 |
| 响应式 | Windows 390×844、844×390、1363×876；Android 平板，实际抽屉边界/命中 | 窄视口不等于真实手机/IME/分屏全矩阵 |

最终业务：`windows-final-D-1792337433801/result.json`、`android-final-D-1792337458315/result.json`。Android 临时键、Mod/隐藏列表、UI 偏好及原版优化设置恢复并核对，原社区包未覆盖。

结束时另做正式技术键安装检查：`android-final-installed-1792338985210/result.json`。先备份原 UI reader ZIP，只替换授权独立测试版的 DoLGameUI，Host 原包不动；原有 40 个 Loader 成员以及 ModHubSoftWet 0.2.4、MapleBirchSoftWet 0.2.4、DolOptimizationSoftWet 0.1.6-rc.1 保留。重启后 UI/Host 实际运行成员与冻结候选逐项相同，原列表/隐藏列表/偏好/存档 details 一致；新建未保存测试进度验证详情为真 modal、关闭正常。最终候选留在测试版，页面回到 Bedroom，没有保存或覆盖槽位。

Windows 沿用 R16 固定 34 包，CE rebuild.28；Android 实际约 40 个 Loader 成员，CE rebuild.30。清单含基础插件，不能宣传为 40 个内容 Mod 逐项验收。现场 CE 只读导出及成员摘要在 `community-current/`，这是 Loader reader 重序列化导出，不称作者原 ZIP，不进入玩家附件。

首次发现 CE 成员不同于旧 R16 输入后停止该路径，确认是现场 CE30 并固定输入，没有降级 CE 或删除摘要检查。叠穿先备份并启用原版优化已有 WornStacking 设置，结束恢复，不改其它 Mod 业务源码。

### 已知问题

`selectedWardrobe` / Wardrobe Widget：原版优化衣柜扩展引用该变量；本轮指定商品、叠穿、原版回退和读档未复现。**Unknown / 未复现，不宣称已修复。** 源码命中见 `wardrobe-source-hits.json`。

Windows 当前业务保留两条启动 `Event` 错误及社区 Patch/资源告警；未归因告警不统一视作无害。Android 业务结果未捕获异常，不等于全应用控制台无错或所有 Mod 兼容。

## 4. 稳定性与资源

Windows 整合包 726.7 秒、94 循环；无 UI/Host 的同社区控制组 480.6 秒、58 循环。都经过衣柜、商店、原窗口和 Passage；UI 组另含设置/Hub，控制组用等待近似节奏。数值检查点显式 GC，未做堆快照。

| 指标 | UI 组首次→末次 | 无 UI 控制组首次→末次 |
| --- | --- | --- |
| JS heap bytes | 127670612→207741916 | 123094308→175766324 |
| DOM counters nodes | 55201→91799 | 52660→73929 |
| JS listeners | 371→513 | 174→262 |
| 自有天气/装饰/Host 挂载 | 末次均 0 | 无 UI/Host |

按完成循环粗略归一，UI / 控制组约 +852 / +908 KB heap、+389 / +367 nodes、+1.51 / +1.52 listeners 每循环。工作量不完全相同，不能精确扣除泄漏；只能确认去掉 UI 仍有增长，不能全部归因于 Kraft Work，也不能据此宣布无泄漏。正文 DOM 未同等增加，自有代理清理成立；保留对象及更长时长风险仍 Unknown。Windows 此序列早于抽屉加入，最终抽屉释放由两端业务和 Android 后续循环补证。

Android 最终包完成 **485.0 秒、24 循环**，`android-final-soak-1792338386737/result.json` 为 passed，重启后入场清单和偏好恢复核对通过。每轮实际打开/关闭衣柜详情抽屉、衣柜、商店、原窗口、设置和 Hub；检查点抽屉、天气、装饰代理、Host 挂载均 0，战斗 B 始终 false。首次→末次 heap 214618216→217278352 bytes，nodes 82503→79973，listeners 490→505，documents 3→5。这段观察没有出现 Windows 同幅度增长，但不据此宣布无限时长无泄漏。

先前 `android-final-soak-1792337691010` 因采样脚本四分钟 execution-context 总期限，在第 11 轮中止，恢复也被拒绝。新上下文已清理，`android-soak-recovery.json` 核对入场列表和偏好；保留原失败。后续八分钟观察明确配置十五分钟总期限，没有改业务代码或断言求绿。

`android-perf-mid/` 有 PSS/RSS、热状态和 WebView 数值，但 gfxinfo 有效 sampledFrames 为 0，**没有 FPS 验证结论**。累计帧不代替游戏帧率，PSS 单点不用于判定泄漏。

## 5. 检查合同与失败记录

24 个定向源码/浏览器测试在处理入口问题后通过，新增抽屉及最终原生穿戴/衣柜操作另通过。未执行旧 `npm run test:release` 全流程，该入口针对经典 2.7 / 0.5.11.9；本轮是 Framework 构建、定向合同和真实 0.5.12.13 两端业务，不冒充旧全套脚本通过。

失败均保留：

- 第一批 PowerShell 拼接成 `tests/+name`，24 项未加载；纠正后 17 过，7 项缺忽略的 fixture。补入原 fixture 并记录摘要后继续。
- 旧 product 微圆角断言、settings-workspace 所需经典 dist 分别以当前合同及独立夹具构建处理。
- 资源脚本定位器拼写错误、窄屏原侧栏遮挡改采样步骤，不 force-click 或改产品布局。
- 无 UI 原生窄屏溢出不套用 UI-only 响应式断言，UI 组保留该检查。
- 文本导入首轮要求 `undefined` 选项键原样保留而失败；原生序列化省略这些键。后续比较完整可序列化数据，原控件/业务断言保留，未改保存实现。
- CE 版本漂移、叠穿配置未准备及 Android 总期限失败保留原输出，不写成产品首次全绿。

## 6. 安装、回退与决策

普通玩家仍是 **DoLGameUI + StoneFreeHost 双 Mod**。推荐 Host 0.1.4-experimental，最低 0.1.2-experimental，依赖 `>=0.1.2-experimental && <0.2.0`；协议 0.1-experimental，UI API v1。本轮实际配对 0.1.4，最低版复用 RC-01 证据，不承诺未来预发布兼容。

游戏声明只支持 0.5.12.13，Loader >=2.100.0、TweeReplacer >=1.0.0，实测 Loader 2.101.1。升级先备份，停用旧 UI，Host 在 UI 前，只启用一份。回退恢复 2.7 包并重启、保留偏好/存档；无其它消费者时才停 Host，不承诺热卸载。

提交本地材料供负责人决定。资源归因、告警及未覆盖范围作为风险披露；未获 Stable 批准前不对外发布，第三方页面未美化不作为新视觉阻塞项。

**本地候选与代表性技术验收材料已准备，可交负责人评审；不等同于长期资源问题已解决或 Stable Gate Passed。** 本轮没有已复现的当前业务阻断需要强行改代码；资源和告警风险由本报告明确保留。
