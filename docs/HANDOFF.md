# Soft & Wet 4.0 — 跨设备当前交接

更新：2026-10-24。分支 `dev/evolution-4.0`。本快照包含Android游戏内回归及修复；精确提交以 Git / Issue #22 为准，不能用文档自证工作区或 CI 通过。旧累计记录已移到[历史快照](HANDOFF-2026-10-23-history.md)。

## Current — 当前做什么

- **发布准备继续，特殊天气视觉已否决。** 当前[关卡与剩余项](evolution/EVO-RELEASE-GATE-2026-10-24.md)和[c215239最新九包工程快照](evolution/EVO-CANDIDATE-CURRENT-2026-10-24.json)为入口。重新核对10项CI下载摘要、9包合同及8个记录安装身份；未重打包、未重跑实机。本批只整理文档，产品实现保持c215239。负责人要求稍后再讨论特效，因此不改视觉、不推广、不悄悄剔除当前效果；G2明确Blocked，仍不是RC。安装说明、Release草稿及[首页替换稿](README_EVOLUTION_DRAFT.md)已同步日期修复和实际天气范围，仓库现行公开首页未替换。

- **本轮实现固化 `c215239`**：[标准40018291181](https://github.com/102326/DoL-Game-UI/actions/runs/40018291181)与[研究40018289042](https://github.com/102326/DoL-Game-UI/actions/runs/40018289042)均success，含独立证据校验及标准moody-gate。下载构建10项摘要、实际UI及最终日期包全部成员核对一致；ZIP容器跨环境摘要分列。后续本提交仅补交接/报告，不冒充重跑检查。代码任务完成、视觉/正式发布仍待负责人。

- **特殊天气补充已接入研发候选，视觉未通过**：[实际范围与证据](evolution/EVO-SPECIAL-WEATHER-2026-10-24.md)。负责人新增授权血月及原生特殊环境适配，增加暗红月晕、异世界紫色天空、原生极端热/冷响应，保留雨雪共存；节日雪复用现有雪效。新增标准专项、本地类型/构建/专项/原顶栏/资源通过，平板持久安装及临时只读天气输入通过。自然特殊事件和实体手机/iOS未覆盖。负责人看过静态及原速完整预览后否决当前视觉，要求先搜索参考，随后暂停具体特效讨论。旧/新源码本机W01均有3500ms过渡超时，未放宽；完整CI结果另记。

- **存档日期条件回退已完成**：[修复、装机与边界](evolution/EVO-SAVE-DATE-FIX-2026-10-24.md)。DolOptimizationSoftWet 1.0.3只读解码活动帧，替换已识别异常日期；正常上游结果零读取、不覆盖，未来修复自然让位。标准CI新增专项，本地类型/专项/衣柜/材质/资源通过；平板持久安装重启、成员核对及偏好停用/恢复通过，同槽存档与metadata摘要不变。旧九包冻结不改写；新兼容包身份另记，整体G3仍Pending。原归因见[历史调查](evolution/EVO-SAVE-DATE-REVIEW-2026-10-24.md)。

- **资源复测补充**：[99次开关与空闲回落](evolution/EVO-RESOURCE-FOLLOWUP-2026-10-24.md)基于未改的37da596候选。Graphics峰值会延迟回落，第二/第三批空闲PSS与监听器接近，未见短时静息基线继续明显抬升；首次访问后的残余占用及长期保留来源仍未归因。没有改产品、偏好、存档或构建，不把此结果当长期无泄漏/FPS证明。最终仍停在本轮测试进度Bedroom。

- **发布前工程与Mod更新收口**：[完整报告](evolution/EVO-PRERELEASE-2026-10-24.md)、[九包冻结身份](evolution/EVO-PRERELEASE-PACKAGES-2026-10-24.json)、[安装/回退](INSTALL_EVOLUTION_CANDIDATE.md)、[玩家发布草稿](RELEASE_EVOLUTION_DRAFT.md)。受验实现37da596，保留cea3bf7的Hub背景退出、500ms蓄势、战斗缩放及衣柜修复。按测试App ModHub清单更新四个目标及兼容包，CE保留rebuild.30，银商启动不另行查找。Android实际八个适用自有包全部成员与下载候选一致、顺序和禁用列表不变；Windows实际Loader/新目标组合代表界面通过。新建槽4、存档码、Android文件导出/Windows载入、九次原生战斗推进及结束、一次实际购买/试穿/退出、两件叠穿/原顺序调整/卸下、33次开关和后台返回均已记录。最终App恢复本轮测试槽的Bedroom及原偏好，原槽1–3未覆盖。
- **前批冻结CI**：37da596的[标准39992958236](https://github.com/102326/DoL-Game-UI/actions/runs/39992958236)和[研究39992955737](https://github.com/102326/DoL-Game-UI/actions/runs/39992955737)含独立下载验收均success；标准moody-gate成功。42aefd6遗漏九包最终校验、8b49b50精确源码锁的CRLF/LF差异均有失败记录，37da596已修正，未缩减断言。Windows本地全量unit与旧采样反例仍有失败，不能冒称本机全量CI通过。资源短时节点/监听器回落，PSS仍偏高且gfxinfo有效帧为0，不宣称泄漏或FPS已验收。G1/G2/G3负责人裁决、正式版本/Tag/main/发布仍Pending；READ01保持隔离，不作为本轮未实现任务。
- **首批Android设置 / Hub验证**：[实际安装与触控记录](evolution/EVO-ANDROID-SMOKE-2026-10-23.md)。受测源码56ffb00，M367FC / Android17 / WebView155，独立测试App持久安装后重启，加载成员与候选一致；设置双布局/真实触控、150%字体滚动、实际Hub工具与快速反向通过。晴天映射及临时诊断输入的雨雪呈现分别记录，原偏好与天气绑定恢复；首批未测游戏业务 / 自然天气转换或长期性能，后续现场已由上方cea3bf7候选接续，原始设备材料不公开。
- 前批READ01按交接范围收口；负责人随后授权继续现有开发和设备验证，没有启动新视觉实验。研发基线已从 `d60ccc8` 安全快进到 `3e6e0396f70dacf5dc6c730fec8fb73cfd7360c2`（CI PR #24 合入），其后设备批次见上方记录，默认产品材质保持。
- **EVO-INT-FROST02：已视觉通过并已接入研发设置。** 认可源码 `5a0f244`，新增边霜浓度0.56；验收交付 `d60ccc8`，保留霜羽、雨天和设置/Hub节奏。不是其它窗口或全局 G2/G3 通过。
- **EVO-MAT-READ01：研究交付，接入阻塞。** 单层24px Acrylic候选压低背景文字高频边缘，但桌面短时rAF中位间隔由约16.7ms升至33.3ms。未获得材质视觉验收，也未接入默认设置；不能因功能PASS宣布性能通过。详见[完整报告](evolution/EVO-MAT-READ01.md)。
- READ01历史实现提交 `9421d1d02409fa38fe5004f1e92296259d97cd50` 的[研究39951290333](https://github.com/102326/DoL-Game-UI/actions/runs/39951290333)含独立下载验收已成功/Attempt1，不能替代上方新修复的CI。最终文档HEAD以Git/#22核对；未同步项目必须重新 `git status` / upstream 比较。本机原始日志、临时实验及运行中的预览服务不随Git同步，不假定新设备可访问。

## Decided — 已确定与已有证据

- 保留已通过设置V2.3（100/80ms开关、620ms分类）、认可球体/实际Hub（本批按新反馈增加500ms蓄势等待）、C5.2/R10雨天、原A霜羽与本次边霜。A2/A3消费者/六类例外按[P0覆盖](evolution/EVO-P0-COVERAGE.md)；阶段边界见[无实机收口](evolution/EVO-NONDEVICE-CLOSEOUT.md)。
- FROST02：16边霜像素、48原A冻结＋4实际表面、完整settings-ci含S01/W01/原迟宿主反例、ci:check通过。准确浓度[媒体/摘要](media/evolution-frost-s02-approved/manifest.json)6文件3,197,000B。研发交付 d60 的[标准39947630976](https://github.com/102326/DoL-Game-UI/actions/runs/39947630976)与[研究39947630276](https://github.com/102326/DoL-Game-UI/actions/runs/39947630276)成功；标准90文件552,298B在Mac下载核验并语义复放，研究仅本地核对独立下载验收结果，未本地全量下载研究大媒体。
- CI PR #24 已由CI聊天依据其独立负责人授权合入研发（3e6e039）；真实PR两套检查/同树关系及后续运行见[专项交付](audits/MOODY-CI-V1.2.md)、PR24和#22。本聊天只安全同步，没有改 required checks / bypass。旧Catalog1.1.1证据仍只证明旧提交。
- **CI跨设备入口**：[Moody Blues V1.2交接](audits/MOODY-CI-V1.2-HANDOFF.md)统一记录实际合入3e6e039、五次成功运行、105声明案例/124布局和研究四族、匿名身份、新机准备及已知风险；[小型证明](audits/moody-v12-evidence/README.md)随Git同步。完整研究原档另已全量保存/校验，临时链接和本机日志目录不作为跨设备依赖。本轮追加仅文档与历史收据，新的文档HEAD不冒称旧Run已验证。
- READ01只复用实际设置与W01九组健康检查，覆盖1280×900 /390×844、DPR1、晴雨雪、控件、玻璃关闭像素同一性、布局和关闭后原动作；不是默认S01无blur合同或整个设备矩阵。检查PASS只表示这些断言完成。证据来源、脚本/源码hash及新旧帧数据见[报告](evolution/EVO-MAT-READ01.md)。macOS / Node24.18 / Playwright Chromium153；不代表Windows、Android/iOS或WebView。
- 未修改main、发行版本、Host API、Tag/Release或正式ZIP。未读取玩家存档；主动授权的存档可隔离复现，不自动公开进Artifact。

## Next — 接手顺序

1. 先读 AGENTS、本文件和 READ01 报告；只读核对 `git status --short`、branch、HEAD、remote，`git fetch origin --prune`；列出独有提交/日志/修改。干净且无冲突才 `git merge --ff-only origin/dev/evolution-4.0`；禁止覆盖未提交工作或强推。
2. 核对Node >=22.12（22需启用 `NODE_OPTIONS=--experimental-strip-types`）、npm、Python及浏览器实际环境；按锁 `npm ci`，有需要再 `npx playwright install chromium`；录制脚本需系统PATH可用FFmpeg，媒体时长核对使用ffprobe。Python仅有python3时，运行打包器用显式python3；不要把旧Mac日志算新设备通过。
3. 核对当前实现c215239、两套成功CI、候选JSON及实际加载成员；37da596九包是历史冻结，不能替代新代码检查。日期提交2ef3d68标准40015157577的夹具时序失败及后续修复保留，另补同帧实时开关保护反例。未触发、运行中或取消不算通过。
4. 本次提交不要求马上接入READ01。若继续研究，先在目标浏览器复核桌面帧退化，使用报告的成对对照和短时观测命令；不要仅减弱已认可天气、移除断言或把减少模糊半径当修复。性能证据与负责人材质评审分别通过后，才决定实际接入范围。
5. 发布准备本批已完成最新候选核对、关卡报告和玩家文案；特殊天气视觉明确未通过，具体修改等待负责人继续讨论。之后按关卡报告确定天气覆盖范围、G1/G2/G3、正式版本与发布决定。当前快照不是RC；不要把旧九包身份或旧“等待观看”当最新结论。未获新授权前不合并main、不改公开版本、不创建Tag/Release；最终合格媒体仍需选定。物理手机/iOS、长期资源、未知组合属于Coverage Ledger，不自动追加无限回归。

交接更新约定：每批主要任务更新 Current / Decided / Next，记录实际输入SHA、命令/环境/范围、CI链接和未同步内容。绝对路径、服务会话、临时文件仅放Git忽略的 `docs/HANDOFF.local.md`；本文件保持一至两页，历史细节链接到专题报告。
