# Soft & Wet 4.0 — 跨设备当前交接

更新：2026-10-23。分支 `dev/evolution-4.0`。本快照包含Android游戏内回归及修复；精确提交以 Git / Issue #22 为准，不能用文档自证工作区或 CI 通过。旧累计记录已移到[历史快照](HANDOFF-2026-10-23-history.md)。

## Current — 当前做什么

- **游戏内回归及Hub收尾修复**：[现场与修复记录](evolution/EVO-ANDROID-GAMEPLAY-2026-10-23.md)。最终产品cea3bf7已推送并实际安装 / 重启核验：战斗底栏按真实CSS zoom换算且无空闲resize循环；衣柜失效列表不再刷新；Hub去掉重复背景层，球体立即响应、菜单等待500ms再沿原240ms展开。真实Android触控约549ms出现，关闭材质消退及三次快速取消通过。衣柜三次原生退出、原版教程单次继续和390px / 四缩放 / 两模式证据按未改模块复用，受控窄视口不冒称物理手机。最终设备保留新候选在标题Start，原偏好、位置 / 视口恢复；具体衣柜修复不代表所有历史同名异常已解决。
- **本批CI**：c120首轮标准39974214664因15分钟总预算取消；cb8baff仅将总预算改35分钟，其标准39976922115 / 研究39976917265成功，未删断言。最终Hub的[标准39980206625](https://github.com/102326/DoL-Game-UI/actions/runs/39980206625) / [研究39980204002](https://github.com/102326/DoL-Game-UI/actions/runs/39980204002)均completed / success，独立下载校验通过，标准moody-gate成功；bb44374标准39978381903 / 研究39978375981也成功。Windows Hub集成、输入 / 生命周期、ci:check及八包构建通过，原失败保留。最终Run受测源码为cea3bf7，后续文档HEAD不能冒称重新完成整轮。
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
3. 核对最终cea3bf7的标准39980206625和研究39980204002终态及后续文档HEAD，区分研究push与手动标准。旧实现成功不能替代新修复结果；未触发 / 运行中 / 取消都不是通过。先复用有效证据，再选择最小充分验证，文档修改不重复全量矩阵。
4. 本次提交不要求马上接入READ01。若继续研究，先在目标浏览器复核桌面帧退化，使用报告的成对对照和短时观测命令；不要仅减弱已认可天气、移除断言或把减少模糊半径当修复。性能证据与负责人材质评审分别通过后，才决定实际接入范围。
5. 已补上述Android真实Loader安装、设置 / Hub、角色窗口、衣柜代表性业务与教程战斗受控窄屏检查；已补一个正常教程回合，下一批按实际需求补商店交易、更多战斗 / 结束及存档流程。物理手机 / iOS、多Mod完整业务和长期性能仍未验证。G1/G2/G3正式裁决、其它窗口新天气/材质推广、main/Release及CJ-4规则另行决定，不将受控视口扩大为所有设备通过。

交接更新约定：每批主要任务更新 Current / Decided / Next，记录实际输入SHA、命令/环境/范围、CI链接和未同步内容。绝对路径、服务会话、临时文件仅放Git忽略的 `docs/HANDOFF.local.md`；本文件保持一至两页，历史细节链接到专题报告。
