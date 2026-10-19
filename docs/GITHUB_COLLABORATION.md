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
| Labels | 现存 10 个，见下文；本轮未创建或修改远端标签 |
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
| 希望支持的 Mod（Compatibility Request） | Mod 名称、希望的支持、场景 / Mod, requested support, use case | `enhancement` |
| Mod 兼容问题（Compatibility Bug） | Mod 名称、实际异常、步骤 / Mod, actual, steps | `bug` |
| 功能建议（Feature Request） | 当前问题、希望功能 / Problem, feature | `enhancement` |
| 界面与交互反馈（UI / UX Feedback） | 界面、问题、理想效果 / Screen, problem, desired behavior | 暂不设置 / None yet |
| CI 与工程问题（CI / Engineering） | 实际问题、预期结果 / Actual, expected | 暂不设置 / None yet |

所有版本允许留空或 Unknown；截图/日志/存档、设备详细参数、Mod 对照均可选。
UI 反馈不强制 DPR / CSS viewport。兼容许愿不承诺支持；兼容报告也不预先判定责任。
保留空白 Issue，PR 不强制关联 Issue；无须卸载必要依赖、破坏存档或危险排查。
附件 textarea 保持 Markdown 模式，不使用会关闭附件支持的 `render` 属性。
没有增加 Projects/自动指派/自动关闭/机器人权限。

### 标签建议（Proposed Labels — Approval Pending）

现有 10 项：`accessibility`、`bug`、`documentation`、`duplicate`、`enhancement`、
`good first issue`、`help wanted`、`invalid`、`question`、`wontfix`，均原样保留。
当前配置只引用真实存在的 `bug`、`enhancement`。以下八项尚未存在，须负责人批准后
才创建并补入相应表单；表单 YAML 本身不会替远端创建标签。

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

后四项为维护状态，不自动贴到新 Issue；前四项批准前不假装已生效。

## GH-2：PR 模板（Pull Request Template）

[PR 模板](../.github/pull_request_template.md) 包含 Changes / Related Issues / Validation /
Compatibility Impact / Rollback / Limitations 六部分。Issue 可填 N/A；小改动回退可简写。
验证必须写命令、实际环境、范围、结果、Commit / Run 及未验证项；不能只写“全部通过”。
文档改动的兼容影响可填 N/A。合并不等于所有平台/真实游戏通过，也不授权正式 Release。

## GH-3：引用约定（Evidence References）

- 持续追踪：Issue → 开发分支 → PR → Moody Blues → 人工审查 → 合并。
  小型明确修改允许从开发分支开始，不把 Issue 变成强制审批入口。
- Issue 用 `#编号` 或完整 URL；PR 没有 Issue 时写 N/A。当前没有为本专项创建 Issue/PR。
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

本地文件、结构与排版检查已完成；本候选将独立提交推送，具体 SHA 以 Git 和交付报告为准。
P0 的独立触发修补已由真实 push [Run 39230872314](https://github.com/102326/DoL-Game-UI/actions/runs/39230872314)
验证成功（1739c17、标准124/124、5m27s），不冒充本候选的表单服务端验证。
PR 未创建、未合并，Issue 新建页未生效。待批准的动作只有 PR 创建与上述标签变更，
Ruleset / bypass / Release / CD 不在本轮操作范围。

依据：[GitHub Issue Form 语法](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-issue-forms)、
[原生字段与附件规则](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-githubs-form-schema)、
[进入默认分支后生效](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/configuring-issue-templates-for-your-repository)。

### 待批准的 PR 候选（Proposed PR — Not Created）

建议标题：`协作：新增双语反馈表单与 PR 验证模板`。

变更摘要：新增六类中文（English）Issue Forms 与 PR 模板，独立保留兼容许愿/兼容报错；
版本可 Unknown，技术附件可选，保留空白反馈及无关联 Issue 的小型 PR。
新增本地结构检查和协作引用约定，更新存档授权/隔离及 HANDOFF。

验证摘要：Ruby/Psych 结构与语法、六个结构负例、12 份本地排版预览和独立审阅通过；
原生 GitHub 表单尚未部署验证。此提交不改 CI 脚本、工作流、依赖或生产 UI。
以 `1739c17` 为评审边界检查本专项差异；向 main 提 PR 前须处理 P0 分支依赖。
