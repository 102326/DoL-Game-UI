# Soft & Wet — 跨设备交接

更新：2026-10-19；当前快照，接手先重新核对本机与远端，不从本文推断最新 HEAD。

## Current — 当前做什么

- 正在交付独立 CJ-3C：`ci/moody-blues-cj3c`，起点 P0 `1739c17cd9327063985d21097619ddf5cefed73f`。
  本快照编写时实现和文档尚未提交/推送，正在本机验证；实际 HEAD 用 `git rev-parse HEAD` 核对。
  提交与云端结果完成后更新本节；原 P0、协作分支和其它研究工作区均保留。
- [P0 PR #3](https://github.com/102326/DoL-Game-UI/pull/3)：main ← ci/moody-blues-p0，head `1739c17`，Ready，未合并。
  [实际 PR Run](https://github.com/102326/DoL-Game-UI/actions/runs/39234097956) 成功 4m49s；checkout 为测试 merge `ef8648636aff64ae1505649567edae4b0368c5c0`，与 head 树相同，不能把两 SHA 混写。
- [协作 PR #4](https://github.com/102326/DoL-Game-UI/pull/4)：ci/moody-blues-p0 ← collab/moody-blues-gh-01，head `63de7d5`，Draft，未合并，差异仅 11 个协作相关文件。
  [手动 Run](https://github.com/102326/DoL-Game-UI/actions/runs/39234937375) 成功 4m46s、checkout `63de7d5`。当前 stacked base 不匹配 PR 触发条件，PR check rollup 为空；这不是原生 PR 必需检查通过。
- main / `v3.0.1^{commit}` 核实为 `9c162939dca50b11549b8a88aefa0069e4ea1896`；没有自动合并或正式发布授权。当前无待决实施阻塞，负责人合并决定单独等待。

## Decided — 已经确定什么

- [P0](MOODY_BLUES_P0.md) CJ-3A/B 与 [CJ-3D](MOODY_BLUES_CJ3D.md) 已交付：未运行/缺失/取消/超时不混作 PASS；#78 转场终态、#79 几何/共享 CSS 反例保留；未经证实的第三案不计产品缺陷。
  `1739c17` 补入 `ci/moody-blues-*` push；工作流 Kraft Work CI、job validate、只读权限及 CI/CD 隔离保持。
- 两个新 Run 均已下载核对全部 58 项证据哈希、遗漏 0；14 单元/21 浏览器入口、标准布局 124/124。
  深度代码仍对应 `6f3c982` 的 [Run 39226899118](https://github.com/102326/DoL-Game-UI/actions/runs/39226899118)，241/241、8m7s；没有伪称本轮重新深度测试。
- [CJ-3C 合同](MOODY_BLUES_CJ3C.md)：独立版本政策、UI/Host+六个当前可选包、规范 ZIP 元数据、两次真实构建对照、精确负例和必要制品报告。当前本机相关七方法/汇总器负例通过；完整七阶段和云端尚待记录。
  本机环境 macOS arm64 / Node 24.18.0 / npm 11.16.0 / Python 3.12.14 / Playwright 1.63.0。
- [CJ-4 只读调查/建议](MOODY_BLUES_CJ4_PROPOSAL.md)：活动 ruleset 有更新/删除/非快进限制，目前没有必需 CI 规则；admin、Connector、DeployKey 类别有 always bypass。真实检查名 validate / Actions App 15368。没有修改规则、bypass、标签、合并策略或 CD。
- 六类双语表单、兼容许愿/兼容 Bug 独立入口、版本 Unknown、可选附件和 PR 模板在 PR #4；未进默认分支，GitHub 服务端上线/渲染尚未验收。八个建议标签尚未创建。
- 两台自有 Redmi K90ProMax、Xiaomi pad9 pro max 及五项 Apple 目标实测仍 pending，viewport/DPR 为 null。采集由用户主动执行，型号/代际待确认。设备数据不阻塞 CJ-3C，不再扩大模拟矩阵。
- macOS 不代表 Windows；Chromium/Actions 不代表 Android WebView、Safari/iOS、真实游戏/ModLoader、软键盘/系统控件或物理触控。Artifact 七天后会过期，按提交重跑；本机日志位置只记忽略的 HANDOFF.local.md。

## Next — 下一步做什么

1. 完成 CJ-3C 本机七阶段、独立审阅、提交推送和对应 push Actions；核对源码身份、八包两轮快照、负例、Artifact 全量哈希/遗漏及耗时。不要创建未授权第三 PR。
2. 等负责人决定 PR #3。合并后 fetch 并核对提交图（特别 squash）；安全调整 PR #4 base 到 main，核对只剩协作差异，重新运行真实 PR CI，再交负责人决定合并。当前不要提前 retarget 或合并。
3. PR #4 获准合并后再验收 GitHub New Issue 六入口、双语字段/独立兼容入口及新 PR 模板，不批量造测试 Issue。CJ-4 实际规则修改需要单独批准。
4. 新设备先 `git status --short`、`git branch --show-current`、`git rev-parse HEAD`、`git remote -v`、`git fetch origin --prune`，核对本地独有内容，保留后再同步。核对 Node >=22.12、Python >=3.10（需 python 命令）、lockfile/浏览器；最低 npm ci、ci:check/unit/build/packages 和锁定浏览器的 ci:browser。保留实际环境/提交/Run，不把另一设备 PASS 当成本机结果。

更新约定：阶段变化/交接前更新 Current / Decided / Next，明确未提交/未推送、测试对应提交与文档沿用关系；详细历史放专项报告。主动提供并授权的存档可以针对性隔离复现，置于源码树外；自动证据只取受控白名单，不自动读/上传玩家存档或纳入公开 Artifact。凭据、敏感设备标识、大段日志不进仓库，绝对路径仅放本地补充。
