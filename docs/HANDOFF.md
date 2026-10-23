# Soft & Wet 4.0 — 跨设备当前交接

更新：2026-10-23。分支 `dev/evolution-4.0`。本快照随本次 READ01 交付提交；精确提交以 Git / Issue #22 为准，不能用文档自证工作区或 CI 通过。旧累计记录已移到[历史快照](HANDOFF-2026-10-23-history.md)。

## Current — 当前做什么

- 负责人要求本轮提交后收口，切换其它设备继续；不再扩展新实验。研发基线已从 `d60ccc8` 安全快进到 `3e6e0396f70dacf5dc6c730fec8fb73cfd7360c2`（CI PR #24 合入）。本批新增为隔离研究脚本、媒体和文档，默认产品材质保持。
- **EVO-INT-FROST02：已视觉通过并已接入研发设置。** 认可源码 `5a0f244`，新增边霜浓度0.56；验收交付 `d60ccc8`，保留霜羽、雨天和设置/Hub节奏。不是其它窗口或全局 G2/G3 通过。
- **EVO-MAT-READ01：研究交付，接入阻塞。** 单层24px Acrylic候选压低背景文字高频边缘，但桌面短时rAF中位间隔由约16.7ms升至33.3ms。未获得材质视觉验收，也未接入默认设置；不能因功能PASS宣布性能通过。详见[完整报告](evolution/EVO-MAT-READ01.md)。
- 本轮提交/推送完成情况及新 Actions 以 #22 和实际远端核对；未推送/未提交项目必须重新 `git status` / upstream 比较。本机原始日志、临时实验及运行中的预览服务不随Git同步，不假定新设备可访问。

## Decided — 已确定与已有证据

- 保留已通过设置V2.3（100/80ms开关、620ms分类）、认可球体/实际Hub、C5.2/R10雨天、原A霜羽与本次边霜。A2/A3消费者/六类例外按[P0覆盖](evolution/EVO-P0-COVERAGE.md)；阶段边界见[无实机收口](evolution/EVO-NONDEVICE-CLOSEOUT.md)。
- FROST02：16边霜像素、48原A冻结＋4实际表面、完整settings-ci含S01/W01/原迟宿主反例、ci:check通过。准确浓度[媒体/摘要](media/evolution-frost-s02-approved/manifest.json)6文件3,197,000B。研发交付 d60 的[标准39947630976](https://github.com/102326/DoL-Game-UI/actions/runs/39947630976)与[研究39947630276](https://github.com/102326/DoL-Game-UI/actions/runs/39947630276)成功；标准90文件552,298B在Mac下载核验并语义复放，研究仅本地核对独立下载验收结果，未本地全量下载研究大媒体。
- CI PR #24 已由CI聊天依据其独立负责人授权合入研发（3e6e039）；真实PR两套检查/同树关系及后续运行见[专项交付](audits/MOODY-CI-V1.2.md)、PR24和#22。本聊天只安全同步，没有改 required checks / bypass。旧Catalog1.1.1证据仍只证明旧提交。
- READ01只复用实际设置与W01九组健康检查，覆盖1280×900 /390×844、DPR1、晴雨雪、控件、玻璃关闭像素同一性、布局和关闭后原动作；不是默认S01无blur合同或整个设备矩阵。检查PASS只表示这些断言完成。证据来源、脚本/源码hash及新旧帧数据见[报告](evolution/EVO-MAT-READ01.md)。macOS / Node24.18 / Playwright Chromium153；不代表Windows、Android/iOS或WebView。
- 未修改main、发行版本、Host API、Tag/Release或正式ZIP。未读取玩家存档；主动授权的存档可隔离复现，不自动公开进Artifact。

## Next — 接手顺序

1. 先读 AGENTS、本文件和 READ01 报告；只读核对 `git status --short`、branch、HEAD、remote，`git fetch origin --prune`；列出独有提交/日志/修改。干净且无冲突才 `git merge --ff-only origin/dev/evolution-4.0`；禁止覆盖未提交工作或强推。
2. 核对Node >=22.12（22需启用 `NODE_OPTIONS=--experimental-strip-types`）、npm、Python及浏览器实际环境；按锁 `npm ci`，有需要再 `npx playwright install chromium`。Python仅有python3时，运行打包器用显式python3；不要把旧Mac日志算新设备通过。
3. 核对最终提交的Actions状态，区分研究push与手动标准。CI合入后39950006354及本批新run状态见#22；未触发/运行中/取消都不是通过。先核对现成证据再选择最小充分验证，文档修改不重复全量矩阵。
4. 本次提交不要求马上接入READ01。若继续研究，先在目标浏览器复核桌面帧退化，使用报告的成对对照和短时观测命令；不要仅减弱已认可天气、移除断言或把减少模糊半径当修复。性能证据与负责人材质评审分别通过后，才决定实际接入范围。
5. 完整游戏+ModLoader、多Mod/真实宿主、设备触控/软键盘/系统选择框、长期并窗性能仍未验证；G1/G2/G3正式裁决、其它窗口新天气/材质推广、main/Release及CJ-4规则另行决定。设备型号不等于实测viewport。

交接更新约定：每批主要任务更新 Current / Decided / Next，记录实际输入SHA、命令/环境/范围、CI链接和未同步内容。绝对路径、服务会话、临时文件仅放Git忽略的 `docs/HANDOFF.local.md`；本文件保持一至两页，历史细节链接到专题报告。
