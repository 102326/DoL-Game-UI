# Soft & Wet — 跨设备交接

更新：2026-10-19。接手先核对实际 Git / Actions；本文是阶段快照。

## Current — 当前做什么

- 负责人已 Accept P0、MB-GH-01 与 CJ-3C 研发候选，并授权继续完成 P0/协作合并流程。
- PR #3 已由负责人合并到 main：`cac52c198b1992530edb6a8910dbb7921fb566a8`，保留原 P0 头 `1739c17`。PR #4 随后合入 P0 分支 `a820145ddae3437767639ce94f093e7cea1a1a3a`，并未进入 main。
- 当前 `collab/moody-blues-gh-01-main` 从 a820145 转交协作差异到 main，不重写两次已完成合并。本文随转交提交更新；实际 HEAD 以 `git rev-parse HEAD` 为准。需要实际 PR CI 与默认分支表单验收，不能用旧手动运行替代。
- CJ-3C 在独立 `ci/moody-blues-cj3c`：实现 `b32c022c8158016f86f0408e1aa0e5b1ca27d8f2`，文档 `672fe65e3f00b582d82f242b6957ffd151ec29c9`。接下来按合并后的 main 核对差异、更新交接/职责表述、独立开 PR。没有扩大布局矩阵的计划。
- 本轮基线检查时各工作区干净；旧研究/原型分支与忽略产物均保留。交付后应提交推送干净，接手仍需重新核对未同步内容。

## Decided — 已经确定什么

- [P0](MOODY_BLUES_P0.md) 的 CJ-3A/B、[CJ-3D](MOODY_BLUES_CJ3D.md) 和 push 范围修补已完成。#78 转场与 #79 几何/CSS 反例保留，第三案不凑数。工作流 Kraft Work CI / job validate 名称不变、只读权限、无 CD。
- [P0 PR CI](https://github.com/102326/DoL-Game-UI/actions/runs/39234097956) 成功，测试 merge `ef8648636aff64ae1505649567edae4b0368c5c0` 与原 head 树相同。#4 [手动检查](https://github.com/102326/DoL-Game-UI/actions/runs/39234937375) 为准确 head `63de7d5`；它不是 main PR 检查。
- CJ-3C [最终候选 push CI](https://github.com/102326/DoL-Game-UI/actions/runs/39238808024) 成功5m16s：准确checkout672fe65；14单元/21浏览器入口、124/124、七个制品测试方法，八包两次实际编译/打包相同，59项365,013B及八ZIP+报告9条SHA全验、遗漏0。
  本机 macOS arm64 / Node24.18.0 / Python3.12.14 七阶段实际PASS，summary正确PARTIAL（没有GitHub setup outcomes）；云端Linux x64 / Node22.23.3 / Python3.12.15。新目标 main 的 PR 证据仍要重新取得。
- Python 制品检查器执行精确版本、依赖及ZIP成员/字节合同；整轮汇总器检查报告身份、规定的完整结构和两轮一致性，不是第二套独立解包重验器。
- [协作约定](GITHUB_COLLABORATION.md)：六类双语表单、独立兼容许愿/兼容Bug、Unknown、附件可选及PR六部分保留。本地结构/预览通过不等于GitHub服务端生效；默认分支验收需打开原生页面，不批量建测试Issue。八项建议标签尚未批准/创建。
- CJ-4 已有只读调查；目前活动ruleset只有更新/删除/非快进规则，没有必需CI。admin/Connector/DeployKey类别有always bypass。真实check validate，Actions App15368。新增必需检查、strict策略及bypass仍需具体批准；不能把CI成功当作强制门禁已启用。
- 3.0.1 Tag仍是 `9c162939dca50b11549b8a88aefa0069e4ea1896`，不更换Release附件。macOS不等于Windows，Chromium/Actions不等于Android WebView、Safari、真实DoL/ModLoader或物理触控。
- 两台自有设备及五项Apple目标实测仍pending（viewport/DPR=null）；采集由用户主动完成，不阻塞CJ-3C。Artifact保存7天，本机路径只放忽略的HANDOFF.local.md。

## Next — 下一步做什么

1. 将已批准协作变更经main目标PR与实际PR CI完成转交；合并后验证New Issue六入口、双语字段/独立兼容入口及新PR模板原生展示。
2. CJ-3C与最新main安全合并，不覆盖双方HANDOFF；仅保留制品增强及相关文档差异，独立PR、准确测试merge与全量证据校验，交负责人评审。保持Python检查器/汇总器职责分工，不复制全部ZIP合同逻辑。
3. CJ-4准备具体可审阅的JSON和影响说明，授权后才写远端规则。真实设备资料继续由用户在方便时主动采集。
4. 新设备先status、branch、HEAD、remote、fetch，保护本地独有内容，再核对Node>=22.12、Python>=3.10及python命令、lockfile/浏览器。最低npm ci、ci:check/unit/build/packages和锁定浏览器ci:browser；所有stage共享MOODY_EVIDENCE_ID，记录真实环境/提交/Run。

更新约定：交接前维护Current/Decided/Next，标明未提交/未推送和测试对应源码；详细历史放专项报告。主动提供且授权的存档只在源码树外隔离复现，自动CI不读/上传或纳入公开Artifact。凭据、敏感设备标识、大段日志不进仓库，机器路径仅在本机补充。
