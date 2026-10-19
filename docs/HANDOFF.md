# Soft & Wet — 跨设备交接

更新：2026-10-19。当前快照；接手必须核对本机 HEAD、工作树、依赖和实际环境。

## Current — 当前做什么

- 当前专项：MB-GH-01 V1.2。分支 `collab/moody-blues-gh-01`，基准 HEAD
  `1739c17cd9327063985d21097619ddf5cefed73f`；实际候选 HEAD 用 `git rev-parse HEAD`。
  表单/PR 模板、结构检查与协作约定随本快照提交推送；交付时应无未提交或未推送内容。
- 依赖 `ci/moody-blues-p0` 的 P0 与触发修补，未混为同一个提交。默认 main 仍为
  `9c162939dca50b11549b8a88aefa0069e4ea1896`（v3.0.1）。原研究/原型工作区保持原样。
- 协作候选：六表单、PR 模板、本地检查已完成；PR 未创建、未合并、线上入口未生效。
  八个新增标签只是建议，未修改远端；具体见 [协作约定](GITHUB_COLLABORATION.md)。
- P0 触发修补 `1739c17` 的真实 push [Run 39230872314](https://github.com/102326/DoL-Game-UI/actions/runs/39230872314)
  成功5m27s：标准124/124、14单元/21浏览器入口，58项证据237,676字节、哈希匹配、遗漏0。
  event=push、源码身份与完整计划已下载核对，未用手动运行替代自动触发。

## Decided — 已经确定什么

- 只交已授权范围：CI/受控测试/文档和协作模板。未合并 main、建 PR、改保护规则/bypass、
  修改 Release/Tag/正式 ZIP、启用 CD 或 AI 服务。Discussions/Projects 原开关保持原状。
- [P0 证据合同](MOODY_BLUES_P0.md)：未执行、缺失、陈旧、超时、取消、身份/计划不符
  不得 PASS；原始状态和断言保留。上传受控白名单、体积上限与七天保存期限不放宽。
- CJ-3A/B：`1e8010808a7d1c71f0cfe1d3049227df1258ea8b`，
  [P0 Run](https://github.com/102326/DoL-Game-UI/actions/runs/39222671934) 成功。
  历史 [Run 39161341795](https://github.com/102326/DoL-Game-UI/actions/runs/39161341795)
  的合法延迟/取消/残留和 [Run 39161721706](https://github.com/102326/DoL-Game-UI/actions/runs/39161721706)
  的旧定位/遗漏生产 CSS 有精确反例；无第三案完整对应。
- CJ-3D 实现 `6f3c982b2e89c5b39e53eb7239ba673073b83abb`，
  [深度](https://github.com/102326/DoL-Game-UI/actions/runs/39226899118) 241/241、8m7s；
  文档 HEAD `79b1d7fdff9809a296585b0fc3ba37972429ae59` 的
  [标准](https://github.com/102326/DoL-Game-UI/actions/runs/39228132750) 124/124、5m19s。
  Linux x64、Node 22.23.3、Python 3.12.15、Playwright 1.63.0，14 单元/21 浏览器入口。
  两轮各 58 项证据哈希已核对、遗漏 0；深度实现可复用至仅文档差异的 79b。
- 本机 macOS arm64、Node 24.18.0、Python 3.12.14 的七阶段命令 PASS；
  标准 124/124；本机 summary 为 PARTIAL，因为没有 GitHub setup action outcome。
  环境与范围详见 [CJ-3D 结果](MOODY_BLUES_CJ3D.md)，不将他机结果等同本机通过。
- MB-GH-01 本地 Ruby 2.6.10 / Psych 3.1.0 结构检查、六个错误反例通过；
  六表单各 360/1280 本地排版共 12 份无横向溢出。自建预览不是 GitHub 原生 renderer。
  这类模板/文档检查没有扩展 CI 矩阵或重跑游戏构建。
- 两个独立兼容入口、Unknown 版本、可选设备/证据/对照、中文或英文填写、空白 Issue、
  不强制先建 Issue 的 PR 均保留。默认标签只引用真实已有 bug / enhancement。
- 玩家主动提供并授权的存档可用于针对性隔离复现，不自动纳入公开 CI Artifact。
  自动采集仍限受控白名单，不读取/上传玩家存档。授权输入放源码树外隔离目录，
  避免 JSON 等非忽略文件进入源码摘要读取；本轮没有收到或使用任何玩家存档。
- 私密日志/构建/报告路径仅记被忽略的 `HANDOFF.local.md`；另一设备不能假定可访问。
  不提交凭据、敏感设备标识或大段敏感日志。Artifact 过期后按提交重跑。

## Next — 下一步做什么

1. MB-GH-01 候选推送后，待负责人批准创建 PR 和八个标签；P0 未进 main 时注明分支依赖，
   不创建包含全部 P0 改动而未解释依赖的 PR。不自动合并；原生表单在默认分支生效后再验证。
2. CJ-3C 制品合同可立即与两台自有设备采集并行，不以手机/平板参数为前置条件。
   不继续扩张模拟矩阵，不要求收齐未持有 Apple 设备。现有七目标均 pending，不能补猜测值；
   按 [采集说明](DEVICE_MEASUREMENT.md) 获取同一宿主观察值后校准回归输入。
3. 新设备先 status / branch / HEAD / remote / fetch，保护独有工作。CI 改动的最低验证为
   dependencies、check、unit、build、packages、browser-install、browser 七阶段；
   模板改动运行 `ruby scripts/check-github-collaboration.rb` 并核对默认分支及真实标签。
   `ci/moody-blues-*` push 标准模式自动检查，深度手动；检查 event、SHA、Run/Artifact。
4. 保留深度报告的 256 KiB 明确报错，不截断为 PASS。CJ-4 仅准备质量门禁建议，
   改规则/bypass、合并或正式发布均需另行授权；Windows、Android/WebView、Safari、
   真机触控/键盘/下拉框、真实游戏/ModLoader 的验收仍独立未验证。

交接前更新以上三部分，注明实际提交/推送与证据对应版本；机器绝对路径仅放本机补充。
