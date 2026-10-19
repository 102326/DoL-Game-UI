# Soft & Wet — 跨设备交接

更新：2026-10-19。此文档是当前快照；接手时必须重新核对本机事实。

## Current — 当前做什么

- 目标：Moody Blues P0：CJ-3A 失败证据、CJ-3B 两案反例、CI-HANDOFF-01。
- 工作分支：`ci/moody-blues-p0`；起点 HEAD：
  `9c162939dca50b11549b8a88aefa0069e4ea1896`，与重新获取的 `origin/main`
  和 `v3.0.1^{commit}` 一致。当前实施尚未提交、尚未推送，未同步到另一设备。
- 已隔离原有研究分支。旧工作区、忽略的构建/夹具/日志仍在原机，未复制入 Git。
- 当前待办：提交前复核与分支 Actions；没有待负责人决策的实施阻塞。

## Decided — 已经确定什么

- 本轮只增强 CI 脚本、受控测试和交接文档；保留既有测试/打包合同及 CI/CD 隔离。
  不合并 main，不修改 Release、Tag、ZIP、ruleset 或 bypass；不引入 AI 服务。
- 证据绑定 HEAD、非忽略源码内容摘要、lockfile、平台/运行版本、Actions Run/Attempt。
  必需检查未执行、报告缺失或身份不符均不能 PASS；具体格式见
  [Moody Blues P0](MOODY_BLUES_P0.md)。
- 原始 3.0.1 本机验证：macOS arm64，Node 24.18.0、Python 3.12.14、
  lockfile 的 Playwright 1.63.0 / Chromium。
  `npm ci`、`npm run ci:check`、`ci:unit`（原 12 项）、`ci:build`、`ci:packages`
  通过；原 `ci:browser` 在 `header-weather.cjs` 失败，其后检查未运行。
  已定位为媒体匹配先更新、JS change 后投递的测试竞态；修正测试等待事件，
  保留全部动画停止断言，不计作第三个产品缺陷。
- 增强后的本机七阶段已通过：dependencies / check / unit（13 项）/ build /
  packages / browser-install / browser（19 项），含两个历史反例。
  本机 summary 因没有 GitHub setup action 的真实 outcome 正确显示 PARTIAL，
  七个实际命令均 PASS。独立审阅指出的夹具 JSON 最终字节上限问题已修正，
  64 KiB 写入/上传边界及 Runner 的失败、超时、取消、漏跑、陈旧报告用例均通过。
  当前为未提交工作，源码内容摘要保存在本地报告，提交和 Actions 证据待补充。
- 两案目标验证已通过：#78 合法延迟完成、真实取消/连续切换及残留节点反例；
  #79 健康几何、旧定位计算非有限值反例、遗漏生产共享 CSS 反例。
  未修改生产 UI 源码。最终对应提交与 Actions 结果待补充。
- 历史依据：[成功基线](https://github.com/102326/DoL-Game-UI/actions/runs/39162456554)、
  [#78](https://github.com/102326/DoL-Game-UI/actions/runs/39161341795)、
  [#79](https://github.com/102326/DoL-Game-UI/actions/runs/39161721706)。
  第三案证据未对应，不据此增加产品缺陷结论。
- 本地原始日志和构建只在原机；路径记录于被忽略的 `HANDOFF.local.md`。
  另一本地原型的两条提交已核对可达 `origin/test/paisley-park-component-lab`，
  原型工作区保持原样，未带入本轮分支。
  开发分支 CI 制品保留 7 天；过期后须按提交重跑，不假定另一台设备可访问本地文件。
- Windows、本轮 Android 实机、真实游戏/ModLoader 联调均未验证。
  macOS 通过不等于 Windows 通过，Actions 通过不等于 Android 通过。

## Next — 下一步做什么

1. 完成 P0 整轮验证，审阅后提交、推送开发分支；显式手动触发已有 workflow，
   记录源码提交、Run 链接和证据清单。未触发不得报告 CI 通过。
2. 新设备先运行 `git status --short`、`git branch --show-current`、
   `git rev-parse HEAD`、`git remote -v`、`git fetch origin --prune`；
   核对本地独有提交/文件，保留后再同步，禁止覆盖尚未上传工作。
3. 最低验证：`npm ci`，`npm run ci:check`、`ci:unit`、`ci:build`、
   `ci:packages`；安装 lockfile 浏览器后运行 `ci:browser`。
   先核对 Node >=22.12、Python >=3.10 和 `python` 命令及实际平台。
4. 接续 CJ-3C 版本/可选包/确定性合同；CJ-4 只准备必需检查、缺失阻断和 bypass
   配置建议。修改远端合并政策须负责人明确批准；当前没有待确认的 P0 实施决策。

更新约定：交接前用当前事实更新三个部分，注明未提交/未推送及验证对应提交；
仅文档更新时说明代码验证沿用的提交。禁止私人存档、凭据、设备标识和大段日志。
