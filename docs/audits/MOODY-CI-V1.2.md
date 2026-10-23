# Moody Blues CI可信度整改V1.2

2026-10-23；依据[负责人正式实施令](../references/MOODY_CI_TRUST_V1.2_ORIGINAL.md)。继续原PR #24，不重建CI平台。输入为0a9e628的Project/Build Identity能力，合入研发7d531a0后的工作基线2df0e3d；旧V1.1和旧CI证据保持原身份。最终候选SHA、实际Actions/Attempt与下载复验以[PR #24](https://github.com/102326/DoL-Game-UI/pull/24)、Issue #22专项记录和交付附件为准，本文不自行证明自身提交已通过。

最终验证前又整合研发ef3c15c的SNOW01接线：保留其实际源码、原始媒体和W01新雪天断言，冲突合并保留双方身份/终止收据及文档；重新生成包含助手的父入口Hash。该产品变更来自已授权研发提交，本CI专项未另行设计雪效。

## 实施范围

- 严格、原生可擦除TS负责合同/锁读取与生成、Standard/Research调度、案例记录、分片、研究族/依赖、实际图形上下文、上传分类和隔离构建。新增仅开发依赖`@types/node`；不引入TS运行加载器。Node22.12显式strip-types已验证，下载验收器不需npm。既有CJS兼容证据、CLI、Node preload/reporter及测试不机械迁移。
- `@ci-contract`与源码标签生成并审查`expected.lock.json`；CI重生成比较。源代码/被包含助手字节Hash、可静态提取断言数和案例下限进入锁。原人工native/research/device三份案例JSON在逐项相等比较后移除；不是人工再维护一份期望。锁不能独自证明关键断言语义，仍保留精确反例、F1–F3和审查。
- 结果按必需分片保存，suite为紧凑索引。保留既有失败关闭、身份/Hash/附件集合校验，新增SEALED、Expected Lock Hash和执行后源码。源码漂移拒绝PASS，只有汇总模式允许沿用同一Run/Profile/合同/环境的原身份生成失败证据，执行入口继续严格拒绝漂移。已有产品FAIL不因证据破损或上传故障被覆盖。
- 工作流在实际上传后登记outcome，独立job下载复核Manifest锚、全部必需文件、案例、源码/PR合并身份及上游job结论。下载失败后验收步骤仍执行；最终gate不因producer失败/跳过而消失。上传故障归ERROR/evidence_upload，证据缺损保留evidence_incomplete。保留原job/check名称和治理边界。

## 覆盖与增量边界

| 范围 | 当前要求 | 粒度说明 |
| --- | --- | --- |
| Standard Unit | 21入口、25声明案例 | 19个entry、1个checkpoint、1个native；包含新的V1.2合同回归 |
| Standard Browser | 36入口、80声明案例 | 29个entry、5个checkpoint、2个composed |
| 布局子计划 | Standard124、Deep241 | 独立布局报告逐ID、状态与场景证据；不与上述entry简单相加宣称总行为数 |
| Research | 保留38命令；25个声明源码入口、95个声明案例 | 含与Standard重叠入口及工具入口，不能直接当38个独立浏览器用例 |
| 原native案例 | 3文件10案例 | 原Node exact ID/无skip/todo校验保留；附原生耗时/路径/失败签名，单案例断言数不可得时记null，不伪造计数 |
| 原命名研究案例 | 6组45案例 | 标签逐项保留；另保留全部45张必要研究PNG |

设置/天气/Hub原已由`settings-ci`和`evolution-owner-resources`调用，先前“遗漏覆盖”的判断已纠正。现在只组合记录健康路径（15和12案例），仍运行原精确注入反例；没有为增加入口数重复跑三套集成脚本。父入口剩余资源/行为断言保留在entry中。内部命名/检查点案例实际记录状态、耗时、Node断言调用数、路径、必要检查点及失败签名；未执行、缺ID、重复、SKIP、零断言均不能完整PASS。48个Standard入口仍为entry粒度，这是渐进迁移边界，不宣称所有旧脚本均已内部穷举。

独立Unit/Browser继续调度，seed和实际顺序保存。Unit180秒、Browser720秒、Research900秒；剩余不足停止调度并记录NOT_RUN/UNVERIFIED，当前进程实际超时为ERROR。构建/类型/安装仍依赖失败即停。研究按真实依赖拆为Hub7、Settings5、Production14、Weather12，各有独立报告/封存；Hub运行自启Vite，不依赖无关prototype-build，静态天气研究确实依赖weather-build。production为Contract，其余为Candidate；支持Exploratory类型，但未把原必需研究降为可失败项。一个族失败不阻断无关族，完整研究PASS仍需要原必需全集。

## 渲染、身份与构建

当前认可球体/Hub实际为Canvas2D；天气含Canvas2D、CSS/SVG材质与明确的静态fallback。探针观察实际getContext调用，不主动创建GL上下文，不把CSS.supports当像素通过。声明的sphere:2d/weather:2d必须命中；支持记录实际GL版本/renderer/vendor及失败上下文，但本项目没有因此新增WebGL产品要求。实际天气集成同时验证glass-scatter和受控构造失败static路径，不授权自动降画质或产品视觉修改。

沿用永久Project ID `005d5d5f-6a83-42bb-a5e4-211033e5f03c`（本轮可选不撤销前次已批准身份），UI/Core/Host各读实际来源，Host协议和真实兼容范围不放宽。保留Commit、Tree、Dirty/内容Hash、lockfile、工具链、Runner镜像、PR Head/Base/实际merge、Workflow、Run/Attempt/Profile和Expected Lock锚。Tree相同不代替完整验证条件；合入目标改变仍需对应CI，PR绿色不授权合并。

二次构建改为独立Git工作目录/源覆盖，明确核对源码身份、锁定依赖，使用独立编译与npm缓存/输出，改变TZ/Locale及POSIX Umask。复用锁定node_modules依赖本体，不声称重装编译器或跨平台复现；无第一次输出复用。初次实现把node_modules符号链接当成额外源码被收据拒绝，已改为实际忽略目录及逐包链接，保留拒绝检查。八包完整ZIP字节、成员与元数据仍严格比较，易变Run身份只在旁路。

## 验证与状态

保留G01–G12/F1–F3、必要文件遗漏/超限/身份/Hash/native skip精确拒绝；新增未封存、终端源码变化、锁Hash/声明漂移、案例不足/零断言、渲染路径错配、上传故障、预算/独立调度、导入助手作用域及12组固定种子的实际索引字节变异。静态检查解析实际工作流并执行gate shell，覆盖上游failure/skipped/cancelled/timeout/missing、always下载复核及事件并发隔离。

本轮已执行的定向记录含原生Node22.12无npm下载验收、21 Unit初轮、实际组合15/12案例、独立二次八包构建/9个Python合同测试。后续整轮及远端验收结果必须绑定最终源码并记录于PR和交付，不能用这些中间结果替代最终GitHub上传/下载验证。

- Implemented：本报告所列代码和渐进粒度已落地。
- Tested：仅以对应实际命令/源码/Actions及下载记录支持；本报告不预填尚未完成的最终运行。
- Integrated：CI专项仍在Draft PR #24，未合入研发/main。
- Release Ready：否；无正式游戏/ModLoader、Windows/Android/iOS真机或视觉总体验收。本轮不改视觉、Host API、分支保护、required checks或bypass，不发布。

构建/标准证据7天、研究/远端结果14天；长期验收需到期前导出并重验Hash的原始附件、Manifest和实际job结论。不建新归档服务；取消/未封存残片仅用于诊断。
