# Soft & Wet 4.0 — 跨设备当前交接

更新：2026-10-25。分支 `dev/evolution-4.0`。本快照包含Android游戏内回归及修复；精确提交以 Git / Issue #22 为准，不能用文档自证工作区或 CI 通过。旧累计记录已移到[历史快照](HANDOFF-2026-10-23-history.md)。

## Current — 当前做什么

- **当前TS First：100/243，剩余143项。** 当前实现5f13a42；新增六个CTS测试已严格编译，其中五项代表性检查通过；Hub综合检查在280×320被原战斗菜单挡住，迁移前原脚本同样失败，尚未修复，不算本批通过。79项之后的CI报告/文件发现边界、球体/Hub和游戏控件测试已继续迁移；新增窗口返回顺序、角色预览生命周期和公开参考视图检查。侧栏节点与恢复锚点改为配对存储，实际回退/第三方后插内容检查通过。最新已完整下载验收的远端源码仍为5798d85（79项）：[标准40111940612](https://github.com/102326/DoL-Game-UI/actions/runs/40111940612)与[研究40111938675](https://github.com/102326/DoL-Game-UI/actions/runs/40111938675)success，准确HEAD、Node26.12.1、九ZIP/十摘要、九项反例与双构建通过；不覆盖后续94项。88项118b803已推送，[标准40114928222](https://github.com/102326/DoL-Game-UI/actions/runs/40114928222)与[研究40114927005](https://github.com/102326/DoL-Game-UI/actions/runs/40114927005)均已失败。标准CI确认研究上传遗漏 filesBelow 导入；已补回，原测试越过该失败点后在本机符号链接权限处停止，反例不删。研究CI尚缺生产证据，不能仅凭同源推定原因；94项及修复已作为d1ff5d8推送，标准40116943879、研究40116942898正在运行；95–100项本地提交尚未推送，避免取消正在验证的研究批次。Android仅新采集当前独立App环境/DOM基线，未安装本批源码，DOM深度截断，不宣称新源码真机回归通过。Windows符号链接EPERM及H01历史间歇原因Unknown继续保留。详见[执行记录](evolution/EVO-TS-FIRST-IMPLEMENTATION-2026-10-24.md)。

- **TS First方案一已授权执行，发布继续暂停**：负责人选择覆盖全部仍维护自有代码的方案一，不采用原建议的125项有界终点。[执行记录](evolution/EVO-TS-FIRST-IMPLEMENTATION-2026-10-24.md)列明批次及验收；[评估](evolution/EVO-TS-FIRST-ASSESSMENT-2026-10-24.md)、[清单](evolution/EVO-TS-FIRST-INVENTORY-2026-10-24.json)、[CTS路线](evolution/EVO-TS-FIRST-CTS-2026-10-24.md)保留为决策依据。基线ff7942d / 4.0.0-rc.2。迁移、行为修复分开提交，原RC2证据不自动覆盖新源码；未授权正式版本、main、Tag或发布。

- **TS First持续推进，最终采用Node26 Only**：最低26.12.1且<27，两套Actions读取`.node-version`，preinstall/工具/CI引导检查实际版本；7c61002补Windows Git stat严格验证后的刷新，本机九包双构建/9项制品反例已通过；Node24及早期26.0不在当前支持范围。累计30/243个独立JS来源迁移，剩余213项及内联/既有TS边界仍在方案一内。受验52f4179的标准40097525373、研究40097524269及各自独立证据复核全部成功，实际Node26.12.1；9ZIP/10项摘要已回读。该结果覆盖Node Only及30项迁移，后续代码继续分批验证。实际安装、原生/编译互操作和反例已验证；本地H01有hidden导航locator超时仍在诊断，不记通过。该历史批次尚有Vite开发依赖告警；最新修复见上方477ec23批次。新源码未装Android、未发布；[执行记录](evolution/EVO-TS-FIRST-IMPLEMENTATION-2026-10-24.md)保留分批证据及失败，[Node专项报告](evolution/EVO-NODE26-ONLY-2026-10-24.md)区分当前完成与整体剩余范围。

- **TS First决策前的RC2验收记录**：[技术报告](evolution/EVO-RC2-VALIDATION-2026-10-24.md)、[冻结九包](evolution/EVO-RC2-PACKAGES-2026-10-24.json)、[雨幕归因与修复](evolution/EVO-MODHUB-RAIN-PERF-2026-10-24.md)。受验源码8033b7f已推送；标准40075729443、研究40075728194及独立证据均success。4.0.0-rc.2取代RC1，拟正式4.0.0。ModHub自然雷雨的共享旧雨幕改为独立纹理transform，保持原雨滴/速度/材质；平板配对rAF中位约33.4→8.3ms，不是完整FPS。最终CI包原生重启后8个适用包全部成员、顺序/禁用列表、150%设置滚动和阻挡通过；Windows实际Loader复验通过。候选、安装、玩家草稿和媒体来源已整理；未合入main、Tag、发布或改公开Assets。整体G1/G2/G3和正式授权待负责人。目标Mod若确认有缺陷，可作可停用/回退的针对兼容修复；不改变其业务和存档所有权。

- **本批特殊天气原型已获负责人视觉认可，普通雨已恢复。** 负责人明确要求撤回血色雨与滑落血滴，退回原普通雨后本批通过。当前5196页移除BR01/BR02全部调色、滴体和血痕注入，Alt+3为血月＋普通雨；血月泛光及S01三种环境绘制保持。血雨代码/媒体仅保留为已停用研究，不进入当前预览。

- **I01接线历史**：[整合报告](evolution/EVO-SPECIAL-INTEGRATION-I01.md)。认可绘制正文不变，原普通雨保留，首次需要才建纹理并随窗口释放。其未提交/未装机的状态现已由上方最终RC2替代；原3.0.4本地ZIP摘要继续保留，不冒称当前候选。

- **前批发布准备，原特殊天气视觉已否决。** 当前[关卡与剩余项](evolution/EVO-RELEASE-GATE-2026-10-24.md)和[c215239最新九包工程快照](evolution/EVO-CANDIDATE-CURRENT-2026-10-24.json)为入口。重新核对10项CI下载摘要、9包合同及8个记录安装身份；未重打包、未重跑实机。该批只整理文档，产品实现保持c215239。当时负责人要求稍后再讨论特效，未改视觉或剔除当前效果；其后血月单项授权见上方B01。G2仍Blocked，不是RC。安装说明、Release草稿及[首页替换稿](README_EVOLUTION_DRAFT.md)已同步日期修复和实际天气范围，仓库现行公开首页未替换。

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
2. 核对Node 26.12.1+且<27（两套Actions读取.node-version）、npm、Python及浏览器实际环境；按锁 `npm ci`，有需要再 `npx playwright install chromium`；录制脚本需系统PATH可用FFmpeg，媒体时长核对使用ffprobe。Python仅有python3时，运行打包器用显式python3；不要把旧Mac日志算新设备通过。
3. 先按TS First方案一继续T1/T2/T3：当前94项已迁移，149项及既有TS边界仍在范围内；12个维护HTML内联程序已收敛，Twee仍待处理；逐批检查调用、导出、启动、生成锁和原反例，完成即退出对应重复JS。不要拿冻结清单的文件数当工程百分比，也不要仅完成当前CI入口就宣布全仓完成。
4. 保留Windows Edge H01原始超时，继续有依据地归因；带记录的诊断通过不能抹去失败。Vite7.3.7已单独修补，旧审计为历史。每批做受影响验证，最终迁移源码再做两套CI、九包与代表Windows/Android实际宿主回归。旧RC2/8033b7f只能复用未改行为的有效证据，不替代新候选。
5. TS First完成后更新候选冻结、依赖/许可/摘要与玩家材料，再提交负责人验收。4.0.0-rc.2保持内部版本；未授权正式版本变更、main、Tag、Release或公开Assets。READ01仍隔离，不主动新增视觉研究；额外设备及全Mod穷举不自动成为阻塞项。

交接更新约定：每批主要任务更新 Current / Decided / Next，记录实际输入SHA、命令/环境/范围、CI链接和未同步内容。绝对路径、服务会话、临时文件仅放Git忽略的 `docs/HANDOFF.local.md`；本文件保持一至两页，历史细节链接到专题报告。
