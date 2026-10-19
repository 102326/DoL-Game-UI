# CJ-4 只读调查与建议

调查时间：2026-10-19 18:06–18:08（Asia/Shanghai；API Date 为 10:06–10:07 UTC）。仓库：`102326/DoL-Game-UI`。本报告仅调查和建议；未修改 ruleset、bypass、标签、PR、main、Projects、Discussions、Release、Tag 或部署设置，未运行游戏测试。

## 结论

main 当前有一个活动 ruleset，但没有配置必需 CI 检查。现有规则限制删除、非快进更新和普通更新；管理员、ChatGPT Codex Connector 及 DeployKey 类别都拥有 `always` bypass。因此“CI 成功”与“远端已经强制 CI 成功才能合并”是两回事。

已核实可用检查的准确名称为 `validate`，来源 GitHub Actions，App ID `15368`；`Kraft Work CI` 是工作流名称，不应未经核对当成 required-check context。普通 required status 也不足以保证“缺失、取消、失败、skipped 都不得 PASS”，尤其 GitHub 会接受部分 skipped/neutral 结果。此轮不实施聚合门禁或远端规则修改。

## API 证据与权限

以下 endpoint 均为只读。REST 表中省略前缀 `/repos/102326/DoL-Game-UI`；HTTP 状态来自 `gh api --include`，不是根据 CLI 文案猜测。

| Endpoint | HTTP | 核实结果 |
| --- | --- | --- |
| `/rulesets` | 200 | 返回一个仓库 ruleset：`25352119`、`jijizi`、`branch`、`active`。响应无下一页 Link。 |
| `/rulesets/25352119` | 200 | 规则、适用分支、bypass 与当前用户 bypass 权限可读。 |
| `/rules/branches/main` | 200 | main 有效规则仅 `deletion`、`non_fast_forward`、`update`，均来自该 ruleset。 |
| `/branches/main/protection` | 404 | JSON 明确为 `Branch not protected`。这指经典 branch protection，不能推出 ruleset 不存在。未重复请求此失败端点。 |
| `/branches/main` | 200 | `protected=true`；经典 `protection.enabled=false`，`required_status_checks.enforcement_level=off`，`contexts=[]`、`checks=[]`。 |
| 仓库根 endpoint | 200 | 当前凭据有 `admin=true`；合并策略字段可读。报告不包含凭据或原始认证响应。 |
| `/pulls/3`、`/pulls/4` | 各 200 | PR 身份与状态见后文。 |
| `/actions/runs/39234097956`、`/actions/runs/39234097956/jobs` | 各 200 | `pull_request` Run 与 `validate` job 均 completed/success。 |
| `/commits/1739c17cd9327063985d21097619ddf5cefed73f/check-runs` | 200 | 两个 `validate` 成功结果，分别来自 PR Run 与先前 push Run；均为 GitHub Actions App `15368`。 |
| `/commits/ef8648636aff64ae1505649567edae4b0368c5c0/check-runs` | 200 | `total_count=0`；不能据此否定 PR CI 已执行。 |
| `/commits/ef8648636aff64ae1505649567edae4b0368c5c0/status` | 200 | `total_count=0`、`statuses=[]`、组合状态 `pending`。它不是已有 job 的实际执行结论。 |
| `/actions/jobs/117998873791/logs` | 成功读取 | 日志确认 checkout 的实际测试 merge 为 `ef864863…`。此调用仅筛选 SHA/checkout/证据身份行，未保存完整日志。 |
| `/keys` | 200 | 当前 DeployKey 总数 0，写入 key 数 0；报告不包含 SSH key 内容。 |
| `/graphql`（只读 query） | 200 | `repository.rulesets(includeParents:true)` 返回同一 ruleset；解析 bypass App 名称和 RepositoryRole 名称成功，无 GraphQL errors。未发 mutation。 |

最初受限网络下 `gh auth status` 误报 token 无效，API 则无法连接，没有 HTTP 响应。经已授权只读网络升级后请求成功；不能把此前连接失败记为远端权限不足。此次目标规则、仓库策略与 bypass 均可读，没有因 403/认证失败而无法核实的目标配置。

## 当前 ruleset 和 bypass

[规则页：jijizi / 25352119](https://github.com/102326/DoL-Game-UI/rules/25352119)。适用条件：include `~DEFAULT_BRANCH`，exclude 空；仓库默认分支为 main。

| 项目 | 当前值 | 影响 |
| --- | --- | --- |
| enforcement | active | 当前生效。 |
| deletion | 启用 | 限制删除。 |
| non_fast_forward | 启用 | 限制非快进更新。 |
| update | 启用 | 更新限制；仅有相应 bypass 的主体可更新匹配分支。 |
| required_status_checks | 未出现在有效规则中 | 目前未强制要求 `validate` 或其他 CI context。 |
| pull_request / review / merge_queue / required_linear_history | 未出现在有效规则中 | 不能宣称当前规则已强制 PR、审批、队列或线性历史。 |

`update` 的官方语义是限制匹配分支的更新资格，并非要求测试通过；解释见 [GitHub 可用规则](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets#restrict-updates)。

| bypass 主体 | REST actor 标识 | 模式 | 核实方式 |
| --- | --- | --- | --- |
| 仓库 admin 角色 | RepositoryRole `5` | always | GraphQL 明确解析为 `repositoryRoleName=admin`。不是某一个固定用户名。 |
| ChatGPT Codex Connector | Integration `1144995`；slug `chatgpt-codex-connector` | always | GraphQL App 解析成功。 |
| DeployKey 类别 | DeployKey，actor_id 为 null | always | REST 与 GraphQL `deployKey=true` 一致；当前没有已登记 key。 |

规则还返回 `current_user_can_bypass=always`。本次只观察权限，没有使用 bypass 更新分支。未枚举 admin 个人成员或 App 安装权限明细；规则类别不等于已验证每个主体实际执行过旁路。DeployKey 当前为空也不等于这条豁免没有未来影响。

## CI 名称、源码身份与 PR 状态

| 项目 | 已核实值 |
| --- | --- |
| main | `9c162939dca50b11549b8a88aefa0069e4ea1896` |
| PR #3 | open、draft=false、merged=false；head `1739c17cd9327063985d21097619ddf5cefed73f`，base main；测试 merge `ef8648636aff64ae1505649567edae4b0368c5c0`。 |
| PR #3 mergeability | `mergeable=true`、`mergeable_state=blocked`。前者只说明无合并冲突；后者不能单独证明 CI 失败，也不构成合并授权。未通过任何写入试探合并。 |
| PR #4 | open、draft=true、merged=false；base `ci/moody-blues-p0`，head `63de7d5a8be61ade5c7476a78feeef116393a437`。 |
| 工作流 | `Kraft Work CI`，`.github/workflows/build.yml` |
| 检查 / job 准确名称 | `validate` |
| 来源 App | GitHub Actions，slug `github-actions`，App ID `15368` |
| PR Run | [39234097956](https://github.com/102326/DoL-Game-UI/actions/runs/39234097956)，event `pull_request`，completed/success。 |
| PR job / check run | `117998873791`，completed/success；该 Run 七个必要阶段及 summary/upload 步骤均 success。 |
| API 关联提交 | Run/check-run 的 `head_sha` 是 PR head `1739c17…`。 |
| 实际执行提交 | checkout 日志明确为 `refs/pull/3/merge` 的 `ef864863…`；源码证据与 Artifact 名称同样使用 `ef864863…`。 |

必需检查**当前未配置**，所以不存在已启用的“required context → App”关联；`validate` → GitHub Actions `15368` 是本次读取到的真实结果来源，供将来审批配置时使用。将来应区分 ruleset 的 `integration_id` 与经典保护的 `app_id` 字段。

PR #4 的目标尚不是 main。当前 workflow 的 `pull_request.branches` 只匹配 main，push 也不匹配 `collab/*`；不能把 stacked Draft PR 没有新 CI 自动等同失败，或用 PR #3 的成功覆盖 #4 新增内容。转向 main 或改变 head/base 后，应重新核对对应事件和提交的证据。

## 仓库合并策略

仓库 API 当前允许 merge commit、squash merge、rebase merge 三种方式；`allow_auto_merge=false`、`allow_update_branch=false`、`delete_branch_on_merge=false`。现有有效规则没有另外指定允许合并方式、线性历史或 merge queue。

这些仓库能力字段不代表任意主体都能更新 main；main 的 `update` 与 bypass 仍适用。关闭 auto merge 也不等于已设置 CI 质量门禁。此轮未尝试合并、更新分支或修改策略。

## 建议：缺失、取消、失败、skipped 均不得误判 PASS

以下仅为负责人可审阅的配置/实现建议，尚未实施：

1. 经单独批准后，才将真实 context `validate` 及 GitHub Actions `15368` 设为 main 必需检查，并明确 strict/up-to-date 策略。不要选择名称相近的工作流或接受任意 App。同一 App 绑定仍不能区分 PR/push/workflow 路径，证据应继续核对 event、Run、attempt、head/base/测试 merge 身份。
2. 现有 P0 summary 已把阶段 skipped 记 BLOCKED、取消记 PARTIAL、缺失/陈旧/不完整证据记未验证，且 summary 非 PASS 时返回非零。应保留这层语义与原始结果，不能退回只看 workflow 绿色标记。只读源码依据：`scripts/ci-evidence.cjs:146–184`、`scripts/test-ci.cjs:36–43`。
3. GitHub 自身会把 `success`、`skipped`、`neutral` 视为可满足 required check 的结论；整个 workflow 因过滤未触发和单个 job 因条件跳过的行为也不同。因此仅启用普通 required status，不能承诺所有 skipped 都被挡住。[官方说明](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks#handling-skipped-but-required-checks)
4. 若要求平台层面也严格拒绝跳过，可另行设计独立、稳定命名、始终调度的聚合 job：等待所需 job，明确要求每项为 completed/success，校验完整计划和同一 Run/attempt/源码身份；任何 missing、queued、in_progress、cancelled、failure、timed_out、action_required、neutral、skipped、API 不可读或陈旧记录都不给 PASS。候选门禁使用 `always()` 等调度条件，但不能把“always 调度”当成“取消时一定完成”。整轮被取消时，required gate 必须保持未通过；不得从旧成功补绿。此轮不新建或修改 workflow。
5. 新增 CI 门禁时不要自动继承现有锁定 ruleset 的全部 always bypass。可将分支更新锁与质量门禁分开评审，分别决定 admin、Connector、DeployKey 是否能旁路、是否仅 PR 模式、紧急操作如何留证。尤其自动化 Connector 已有 always 权限，不能把“已启用门禁”写成“包括该 App 在内无人可绕过”。本轮不调整任何 bypass。
6. 合并前重新读取最终 PR head/base 与实际 check source；推送新提交、变更目标分支或测试 merge 改变后，旧证据不可自动沿用。`mergeable=true`、Draft 状态变化、标签或负责人批准文字，都不能替代必要 CI 执行结果。保持 CI 与 CD/正式发布分离，不扩大设备矩阵。

## 已知边界

本次是时间点快照，不保证调查后配置不变。PR #3 的 `blocked` 没有通过写入试探或规则实际拒绝事件来做因果归因；现有 update 限制确实生效，但不把某个单一 API 状态归咎于未经证明的唯一原因。没有验证绕过实际行为、外部服务私有权限、后续 CJ-3C、游戏/真机或正式发布。

调查用 agent-reach 的 GitHub/gh 路由与只读 REST/GraphQL query。没有收集 token、SSH key 内容或个人成员清单；本文件仅包含公开仓库规则、App/角色标识、必要提交及 Run 身份。
