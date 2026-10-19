# MB-GH-01 — GitHub 协作（GitHub Collaboration）

V1.2 首批候选，更新于 2026-10-19。中文或英文均可填写，不要求玩家双语或翻译日志。
本专项只交 GH-0 / GH-1 / GH-2，以及 GH-3 引用约定，不引入写权限自动化。

## GH-0：现状审计（Repository Audit）

只读 `gh api` / `gh pr list` 与 fetch 后的源树核对：

| 项目（Item） | 实际状态（Observed State） |
| --- | --- |
| 默认分支（Default Branch） | `main`，`9c162939dca50b11549b8a88aefa0069e4ea1896` |
| Issues | 已启用 / Enabled |
| Issue / PR 模板（Templates） | 默认分支原先均无；`.github` 仅有 `workflows/build.yml` |
| 开放 PR（Open Pull Requests） | 审计时 0；获取的分支历史未发现同类模板提交 |
| Labels | 现存 10 个，见下文；本表为初次审计快照；后续已获准新增八项，见下文 |
| Discussions / Projects | 原有开关均为 true；本轮未开启、关闭或配置任何对象 |
| HANDOFF | P0 开发分支已有；默认分支尚无，未声称已部署 |
| 稳定 CI（Existing CI） | `Kraft Work CI` / `validate`；PR→main、push→main/ci/kraft-work-*，手动运行 |
| 触发修补（Trigger Repair） | 独立 P0 提交 `1739c17cd9327063985d21097619ddf5cefed73f` 增 push→ci/moody-blues-*，保留原检查名/权限/CI-CD 隔离 |

开始时工作区干净，`79b1d7f` 与远端一致，无未提交/未推送的源码工作；本机独有日志仍被忽略。
复用已有隔离 worktree，建立 `collab/moody-blues-gh-01`，P0 分支及其提交保留。
触发修补单独提交推送后，本协作分支快进到 `1739c17`，再继续表单候选，未混入同一个提交。
因此本候选依赖 P0；以后 PR 应在 P0 进入 main 后以 main 为 base，或明确以 P0 分支作
堆叠评审 base。当前只提供建议，不自动建 PR、合并或修改保护规则。

## GH-1：六类表单（Issue Forms）

文件位于 [.github/ISSUE_TEMPLATE](../.github/ISSUE_TEMPLATE)。

| 入口（Form） | 必填内容（Required） | 默认已有标签（Existing Default Labels） |
| --- | --- | --- |
| 功能错误反馈（Bug Report） | 实际结果、预期结果、复现步骤 / Actual, expected, steps | `bug` |
| 希望支持的 Mod（Compatibility Request） | Mod 名称、希望的支持、场景 / Mod, requested support, use case | `enhancement`、`compatibility-request` |
| Mod 兼容问题（Compatibility Bug） | Mod 名称、实际异常、步骤 / Mod, actual, steps | `bug`、`compatibility-bug` |
| 功能建议（Feature Request） | 当前问题、希望功能 / Problem, feature | `enhancement` |
| 界面与交互反馈（UI / UX Feedback） | 界面、问题、理想效果 / Screen, problem, desired behavior | `ui-ux` |
| CI 与工程问题（CI / Engineering） | 实际问题、预期结果 / Actual, expected | `ci-quality` |

所有版本允许留空或 Unknown；截图/日志/存档、设备详细参数、Mod 对照均可选。
UI 反馈不强制 DPR / CSS viewport。兼容许愿不承诺支持；兼容报告也不预先判定责任。
保留空白 Issue，PR 不强制关联 Issue；无须卸载必要依赖、破坏存档或危险排查。
附件 textarea 保持 Markdown 模式，不使用会关闭附件支持的 `render` 属性。
没有增加 Projects/自动指派/自动关闭/机器人权限。

### 标签配置（Labels — Approved）

现有 10 项：`accessibility`、`bug`、`documentation`、`duplicate`、`enhancement`、
`good first issue`、`help wanted`、`invalid`、`question`、`wontfix`，均原样保留。
2026-10-19负责人授权完成剩余事项后，已创建以下八项并回读确认；原十项颜色/说明均未改变。
四类别标签加入对应表单；表单YAML本身不会替远端创建标签。

| 建议 ID（Proposed ID） | 用途（Purpose） |
| --- | --- |
| `compatibility-request` | 希望支持的 Mod / Requested mod support |
| `compatibility-bug` | 多 Mod 兼容异常 / Mod interaction report |
| `ui-ux` | 界面与交互 / UI and interaction |
| `ci-quality` | CI、构建、断言 / CI, build and assertions |
| `needs-repro` | 待复现 / Reproduction needed |
| `needs-info` | 待补充信息 / More information needed |
| `confirmed` | 已确认 / Confirmed |
| `blocked` | 存在阻塞 / Blocked |

后四项为维护状态，不自动贴到新Issue；前四项进入相应类别表单。

## GH-2：PR 模板（Pull Request Template）

[PR 模板](../.github/pull_request_template.md) 包含 Changes / Related Issues / Validation /
Compatibility Impact / Rollback / Limitations 六部分。Issue 可填 N/A；小改动回退可简写。
验证必须写命令、实际环境、范围、结果、Commit / Run 及未验证项；不能只写“全部通过”。
文档改动的兼容影响可填 N/A。合并不等于所有平台/真实游戏通过，也不授权正式 Release。

## GH-3：引用约定（Evidence References）

- 持续追踪：Issue → 开发分支 → PR → Moody Blues → 人工审查 → 合并。
  小型明确修改允许从开发分支开始，不把 Issue 变成强制审批入口。
- Issue 用 `#编号` 或完整 URL；PR 没有 Issue 时写 N/A。不要求先有 Issue；PR 创建和生效状态以 GitHub 为准。
- 代码证据用完整 Commit SHA；复用结果时指出两个提交之间的相关实现是否变化。
- CI 用确切 Run URL、Commit SHA、event 和深度，必要时注明 attempt；链接到文件时优先固定 SHA。
  未执行为 BLOCKED，缺失/尚无证据为 UNVERIFIED，部分范围为 PARTIAL；不得冒充 PASS。
- HANDOFF 只保留 Current / Decided / Next 的当前快照，链接详细报告，不堆叠长篇历史或原始日志。
  另一设备先检查本机 HEAD/工作树/依赖/实际环境，不能把其他平台的通过结果当成本机通过。
- 自动证据收集始终使用受控白名单，不自动读取或上传玩家存档。
  玩家主动提供且授权的存档可以针对性隔离复现，不自动纳入公开 CI Artifact。
  存档输入放源码树外的隔离目录：源码摘要会读取 tracked/非忽略源码文件，JSON 不一定被忽略。
  只记录必要的授权范围、对应版本/提交、隔离环境和结果摘要，不自动复制存档正文进报告或制品。
  公开 Issue/附件可见性在表单中说明；仍不得提交密码、Token 或敏感设备标识。

## 验证与上线状态（Validation and Deployment）

本地命令：`ruby scripts/check-github-collaboration.rb`，仅使用本机 Ruby/Psych，不新增项目依赖。
检查六表单、唯一 ID/名称、原生字段结构、布尔 required、双语字段、Unknown 版本、可选技术
证据、两个独立兼容入口、空白 Issue 与 PR 六章节。六个内存反例验证重复 ID、错误布尔类型、
非法控件、强制证据、英文单语标签及重复选项会被拒绝。
这是局部结构检查，不能代替 GitHub 服务端验证；没有为模板改动重跑游戏构建或矩阵。

六类表单各以 360/1280 宽度做本地 HTML 控件排版预览，共 12 份，检查页面/字段越界；
标题、字段和说明可换行。此预览不是 GitHub 原生 renderer，也没有向 GitHub 提交测试 Issue。
原生展示和交互仍需候选进入默认分支后验证；本地成功不称线上部署成功。

本地文件、结构与排版检查已完成。负责人于2026-10-19批准合并协作变更；原PR #4已合入P0分支，并未因此进入main。后续经main目标PR完成转交，必须核对该PR的实际检查及默认分支原生页面，不以历史手动成功代替。当前状态见[HANDOFF](HANDOFF.md)和GitHub实际提交。

P0的独立触发修补已由真实push [Run39230872314](https://github.com/102326/DoL-Game-UI/actions/runs/39230872314)验证；协作head63de7d5的[手动Run39234937375](https://github.com/102326/DoL-Game-UI/actions/runs/39234937375)也通过，但两者均不是本次转交main的PR检查。

依据：[GitHub Issue Form语法](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-issue-forms)、[原生字段与附件规则](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-githubs-form-schema)、[默认分支生效](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/configuring-issue-templates-for-your-repository)。

合并后验收New Issue六入口及各表单原生字段、独立兼容入口和PR模板，不批量创建测试Issue。标签、Ruleset/bypass与Release/CD是独立事项；协作模板合并不构成这些操作的授权。

2026-10-19收口：原生六表单与PR自动填充已实际验收；本次新增类别标签以合入默认分支后的YAML/API回读核对，不创建测试Issue。CJ-4和标签获得负责人后续明确授权，最新实施及验证见HANDOFF和专项报告；初次审计表保留历史时间点。
