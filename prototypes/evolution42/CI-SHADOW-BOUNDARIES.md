# CI42 C1：14 场景离线边界核对

接续更新：已有[真实Git输入C1候选](../evolution42-ci-c1/README.md)。三条路径的消费者映射补齐了已审计名单，组合源码样本经现有runner实际执行12项通过；S1–S8计划级检查和N1–N6的15个固定本地负例通过。下文表格保留最初核对快照；本轮层次如下，不能将计划级检查和组合执行冒称14轮完整profile验收。

| 类别 | 本轮已验证 | 仍缺 |
| --- | --- | --- |
| S1/S2/S4 | Acrylic/正式Hub/官方动效各自真实路径计划及前置保留；三路径组合12项检查，另独立安装依赖、5个标准准备阶段、9个browser及独立材质检查 | 分别的行为变更与完整profile对照、消费者图完备性 |
| S3/S5/S6/S7/S8 | 未知共享偏好、增删改名、锁文件、候选版本文件和封板后未映射文件均完整回退 | 这些full回退场景没有各自执行全套profile；RC/封板策略尚非正式实现 |
| N1/N2 | 删消费者或必需前置被独立重算计划拒绝 | 尚不能发现人工映射从一开始就遗漏的全部消费者 |
| N3/N4 | 独立base、Attempt、进程ID/PID、顶层状态、阶段曾观察到源码漂移、同时删计划/结果等实际报告负例被拒绝 | 另以两套合成完整standard包验证固定锚点、shard交换、PR三身份；真实Actions运输/汇总和可信selected计划尚未实现 |
| N5/N6 | 真实零断言退出0、浏览器pageerror退出0、取消、超时和移走实际必需报告/布局报告均拒绝；恢复后正常报告再通过。受控依赖失败只阻塞后继、独立分支继续，取消不出现PASS | 尚未接入正式上传/远端gate链路 |

2026-11-05；源码 HEAD `65e39bcb136b27ae83dc051319f527a5d9a45d68`，工作区另有未提交交接文档。此记录不改变工作流、catalog、Expected Lock 或现有完整门禁。计划类别见 [4.2 计划第五节](../../docs/superpowers/plans/2026-11-02-soft-wet-4.2-r1-review-plan.md) 和 [R1 影子对照](../../docs/evolution/EVO-4.2-R1-2026-11-02.md#有界影子对照14个预定场景不永久双跑)。

## 现有探针实际做了什么

本机 Node 26.12.1 执行 `node scripts/research/ci-selection-probe.mts`，退出 0；输入脚本 SHA-256 `bd1995a85b9ed7cf902e3c8bcffccc9aeb6c36571c7edc1b7edf6053825265d3`。它对三个手写文件/消费者清单检查现有 standard/research catalog ID 和 research 执行前置；缺消费者、前置、重复 ID、缺终态等是受控合成输入。它输出所有例子回退完整 profile 的声明，并不读取真实 diff 或执行选测。8 selected / 8 terminal / 6 executed 也是合成字段，非实际测试启动次数。

唯一调用真实现有汇总实现的选测相关负例：构造 research 报告，让 producer 的 expected/results 同时去掉 `evolution-weather-shower--scatter`，重建家族报告，`researchSummary` 返回 `UNVERIFIED` / `Missing/incomplete research plan`。这是现有**完整 profile**检查，不是将来选测计划的独立认证。

上轮 Windows 隔离克隆的实际 standard unit 结果可复用作相关防线的局部证据：`ci-gate.test.cjs`、`source-identity-boundary.test.mts`、`receipt-boundary.test.mts`、`checkpoint-boundary.test.mts` 和 `expected-lock-boundary.test.mts` 各自 PASS；整组 36/38，另两项文件符号链接触发 `EPERM`，所以不能说整组 PASS。原结果在本机忽略目录 `tests/artifacts/ui42/ci-preparation/unit-result.json` 和 `unit.log`；这些检查是现有完整合同的受控用例，并非 14 场景端到端影子运行。

## 固定类别逐项核对

下表的“局部”只说明相近的受控检查或人工清单存在；不表示该场景已通过。计划冻结的是以下类别；具体源码/base/head/merge、期望消费者及 N5/N6 全部故障变体目前没有固定的可执行清单，不能在事后挑样称完成。

| ID | 计划类别 | 当前证据 | 尚缺的场景证明 |
| --- | --- | --- | --- |
| S1 | 独立颜色参数 | 未执行；R1 仅有 acrylic 人工映射示例 | 具体变更、实际消费者及完整 profile 对照 |
| S2 | 局部 Hub 视觉 | 未执行；R1 有人工候选入口 | 具体变更、输入/生命周期历史负例和完整对照 |
| S3 | 设置共享偏好 | 未执行 | 具体偏好变更及间接消费者闭包 |
| S4 | 共享输入 | 局部：探针列 `official-motion` 人工候选并核对 ID/前置 | 不是自动影响分析，尚未证明消费者完整或真实共享输入差异 |
| S5 | rename/delete | 局部：探针仅输出“完整回退”文字 | 真实 Git rename/delete、旧/新路径和 base/merge 输入处理未执行 |
| S6 | 构建/依赖 | 未执行；既有完整双构建与下载核验仍生效 | 构建文件差异、全部受影响合同及计划身份对照 |
| S7 | 普通 RC | 未执行 | 明确本次 RC 输入、风险/覆盖及完整 profile 比较 |
| S8 | 封板后小修 | 未执行 | 冻结基线、差异、必要复测与完整回退身份 |
| N1 | 漏间接消费者 | 局部：手写消费者被删时探针拒绝 | 未发现真实变更的全部消费者，也未检测未声明消费者 |
| N2 | 漏必需前置 | 局部：删除 `settings-baselines`，探针给出两条依赖路径 | standard 没有同类依赖图；真实选测执行和 gate 未验证 |
| N3 | 错误 base/merge/源码身份 | 局部：已有 source 断言验证原始字节变化，完整汇总测试拒绝旧 source/run | base/merge/计划身份与实际 diff 绑定尚无选测验证 |
| N4 | 篡改生产者排除清单 | 局部：现有完整汇总拒绝同时删减 expected/results | 不是新选测独立验证；可信消费者、排除清单及来源绑定未实现 |
| N5 | 退出 0 但零断言/pageerror | 局部：既有 `ci-gate` 实际子进程检查空断言和终态失败，原始退出 0 不抹平错误 | pageerror 的选测贯通变体未冻结或执行；不能用工具类零断言代替合同类 |
| N6 | 取消或缺失必要报告 | 局部：既有 `ci-gate` 检查取消终态、缺 package 报告与缺浏览器结果 | 对固定选测计划的取消、缺报告及 gate 贯通未执行 |

## 具体停点

`scripts/ci/research-runner.ts` 在构造依赖时先按 `selectedIds` 过滤；子集本身漏掉前置时不能由它单独证明安全。当前探针只核验人已经声明的消费者，不能发现遗漏的间接消费者；standard profile 也没有对应的 research 前置字段。真实选测还缺 base/head/merge 与未提交输入身份、可信独立计划、报告与远端 gate 绑定。不能把调用 runner 的子集当作影子验收，也不能用本表充当 PASS。

本批不新增选择器框架，不安排实际选测或更改门禁。下一步若继续，应先逐项固定可复核的真实变更、人工预期、N5/N6 故障变体及完整入口对照；只有具体实现和核验边界经过评审，才可进行影子运行。已有完整 profile、独立第二次 fresh-build 与下载核验保留。
