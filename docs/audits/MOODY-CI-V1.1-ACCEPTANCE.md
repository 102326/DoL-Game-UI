# Moody Blues V1.1 独立验收复核整改

2026-10-23。输入为《SoftWet_MoodyBlues_V1.1_独立验收复核》，冻结评审 Head `bc7b35e`、研发基线 `d3f04ee`、PR 合并检出 `5a340f6`。报告意见经过实际复现后采用；不把文档中的建议当作新增产品、合并或发布授权。仍在 Draft PR #23 的 CI 专项内。

## 三项问题与修复

| 项目 | 已复现的旧行为 | 当前保证与验证 |
| --- | --- | --- |
| F1 / P1 | 真正终止断言或 TypeError 登记后自然退出零，执行器误判 PASS | 仅采信绑定 schema、执行 ID、PID 的终止收据。合同断言为 FAIL，基础设施及工具内部断言为 ERROR；保留 exitCode=0 与矛盾标记。标准/研究汇总及下载后复算重新读取收据，不能被外层 PASS 覆盖。 |
| F2 / P2 | official-game-motion、game-first-motion、panels-framework 的零断言替代命令通过研究执行和合成完整汇总 | execution=contract 的执行与汇总均要求有效断言或完整原生 case。三个叶合同逐项检查执行、汇总、上传及下载复算；健康断言与合法零断言编译工具作对照。 |
| F3 / P2 | Inspector 分组在真实未处理 window error 后仍退出零；Surfaces 同样缺少成功边界检查 | 所有 Runtime 分组在成功边界检查 pageerror 集合。Inspector、Surfaces 各自注入真实异步 window error，保留 DOM 正常断言，并精确要求 AssertionError / UI_RUNTIME_PAGEERROR / 对应注错消息。 |

F1 还覆盖已捕获诊断、非断言基础设施错误、工具内部断言，以及终止断言之后超时/取消。独立代码复核发现汇总曾把后两者变回 FAIL；现与原执行分别保持 ERROR/CANCELLED，原始状态不变。错误 schema、PID、执行 ID 的收据为 UNVERIFIED。研究 dependencies/browser-install 和原三项 unit 子入口也重算终止状态。finalizeUpload 接收生产调用方刚算出的汇总；下载后 verifier 是另一个完整性/语义复算边界，并非独立实现的语义裁判。

研究 Catalog 升至 1.1.1。settings-prepare、framework-build、inventory、evolution-unit 明确为准备、构建、采集、调度工具；真实旧工件显示其本身零产品断言。没有伪造断言以满足规则：inventory 原始报告仍必需，evolution-unit 原三项独立 unit、原生 case 计划及 subEntries 仍必需。原38命令、23报告、45必要 PNG 和所有产品叶合同不删除。

原五类 Runtime 精确源码反例（identity/privacy/events/surfaces/rebind）继续执行；已捕获的 showModal/onClose 异常仍是合法控制组。未改变产品代码或视觉实现。同步并保留研发 afc78bb 的 H01 更新，只在冲突处合并测试终止收据路径。

## 验证与证据边界

- 先复现失败再修复：F1 PASS→FAIL/ERROR；F2 PASS→UNVERIFIED；F3 真实页面异常退出0→精确断言退出1；超时重算 FAIL→ERROR。
- `node tests/ci-gate.test.cjs`、`node tests/ci-evidence.test.cjs`、`node tests/research-evidence.test.cjs`：G01–G12、真实终止收据、身份/附件、原生两文件九 case、零断言与工具边界、汇总及下载复算。
- `node tests/ui-runtime-regressions.cjs`：原五反例及两个真实页面异常反例；独立 inspector/surfaces 和 all 正常对照。
- `npm run ci:unit`：标准20入口；`ruby scripts/check-ci-gate.rb`、`ruby scripts/check-github-collaboration.rb`、`git diff --check`。

本机 macOS / Node24.18 / Chromium153，构建使用显式 Python3。最新完整标准/研究 Actions、PR Head/Base/Merge、Catalog/附件哈希及下载验证结果见 PR #23 / Issue #22 的专项记录和本次交付附件。旧 run 39904074796 / 39904074261 的真实成功继续只对应旧冻结源码，不能代替本次新 SHA。

本整改不自判最终负责人验收、视觉验收、设备/游戏或 G1/G2/G3，不合并研发/main、不发布/CD、不修改保护、required checks 或 bypass。Git 作者及提交者继续使用 GitHub 匿名身份102326。
