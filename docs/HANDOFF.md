# Soft & Wet — 当前交接

更新：2026-11-04。**4.1.0已发布；4.2 Study 02隔离原型完成本机定向检查，视觉待评审，源码与媒体已同步研发分支。**

## Current — 当前做什么

- 分支`prototype/4.2-first-samples`，本批开始HEAD/基点`c7d8bac67fd04d0a81e59cf4c49800a510a39a11`。11月4日fetch确认origin/main仍同SHA。旧4.1分支保留；Tag v4.1.0的9c26b00与main文件树相同，提交身份分开。
- 本批包含前批R0/决议/计划、首版工程探针，以及Study 02原型/定向测试/原速媒体。本批运行源码提交[`8da7f44`](https://github.com/102326/DoL-Game-UI/commit/8da7f44648b16930f8a8df28d135af8500f9ed54)已推送；本快照随后只更新文档回执，分支最新HEAD以Git为准。生产src/framework/compat、依赖/锁、正式版本和工作流未改。
- GitHub接续：[4.2研究 #35](https://github.com/102326/DoL-Game-UI/issues/35)；承接已关闭的4.1/4.0历史，不重开旧Issue或复制路线图。新Issue正文已回读匹配，源码提交的author/committer均由GitHub关联到Codex bot。
- 入口：[计划V1.4](superpowers/plans/2026-11-02-soft-wet-4.2-r1-review-plan.md) · [R1实际实现/原方案对应/失败](evolution/EVO-4.2-R1-2026-11-02.md) · [本批媒体与证据摘要](media/evo42-study02/validation.json) · [原型运行README](../prototypes/evolution42/README.md)。本机预览5206；对照页`/prototypes/evolution42/compare.html`。机器路径、临时进程和原始日志留忽略的HANDOFF.local.md。

## Decided — 已经确定什么

- **延续Claude设计思路，收束落地范围**：优先Hub和部分界面。JELLY仅为果冻运动子项，不覆盖Claude全部方案。本次源包与具体映射见R1；不假定一个附件等于此前全部研究。黑灰Acrylic、紧凑默认、真实业务语义保留；不做全局自由布局编辑器或默认自动降质。
- **E42-JEL-01 / P-B**：实际MotionHub的隔离适配FreeHub，保留原工具、View/焦点与球体渲染。自由二维停留，A直接跟手、B有限惯性；显式停靠可用，松手不强制吸边。丝线牵引真实球体到明确默认锚点，重新抓取可接管。只写独立研究位置键，不写生产旧键，不是生产迁移已完成。
- **E42-ACR-01 / P-A**：实际设置窗口增加烟色层次、暖冷边光、内凹阅读井；B外壳有限伸缩，真实内芯最大7px滞后并反向缩放补偿，速度驱动光带。通透度复用现有变量，原控件/节点保留，无正文副本或实时DOM纹理折射。
- 一窗口/一heavy雨/一次拖动联合探针保留。稳定后Canvas相对外壳偏移差值为0；不代表GPU成本、完整天气矩阵或第二角色已验。商店目前仅参考入口。
- Mac arm64 / Node26.12.1 / 锁定Chromium153.0.8010.12：完整原型检查9条PASS（3生命周期+6材质/视口），自由Hub6组PASS，pageerror空；vue-tsc及严格Node工具tsc通过。两个结果分别绑定12/8个实际输入摘要，复核与交付源码一致；在未提交树执行，不冒称已在干净提交执行。
- 失败保留：旧球中央放手回侧边被拒绝；审查发现中途点击未保存、边缘边界不一致、缩放速度换算和隐藏中断并修正。边缘刷新修前FAIL/修后PASS。回弹检查曾在驱动返回后错过状态，改为预挂实际帧内命中+原生HTMLElement激活，没有延长动画。独立审查复核无新具体阻断，未替代实际执行。
- 四段1280×900原速WEBM、四张截图与validation.json随源码同步，媒体约4.74MB；原始完整报告、首版快照、失败和诊断仅本机。三材质使用同一拖动操作台，4.1原发行没有此拖动功能；独立录制不是性能配对基准。
- CI仍沿精准选测/集中报告决议和既有C0–C4研究，尚未迁移producer/verifier/gate；当前required、strict、完整catalog/证据和按批手动政策保持。本轮没有新远端整轮CI，原型检查未自动纳入workflow，不把4.1成功Run替候选签字。
- GitHub已实时核对#31/#32/#33均closed，#31已正确记录4.1发布；不重复打开。#33没有新Ray复现/修复证据，仍Unknown。正式4.1发行证据见[Release记录](releases/4.1.0/RELEASE_RECORD.json)。

## Next — 下一步做什么

1. 负责人在可操作页比较4.1/静态层次/受力材质，自由拖放、甩动并召回球体。第一版区分不足的判断保留；Study 02尚未取得视觉采用裁决。按反馈选方向后补商店详情第二角色与完整消费者覆盖，不以设置成功代替全局完成。
2. 非Hub需求继续沿现有记录发现，先比较默认改进与选择必要性，允许零新增设置；不另建路线图。完整P-C后续决定，保留早期最小联合探针。
3. 目标Windows/Android WebView、真实游戏、GPU/功耗留对应现场。受控document.hidden事件不是物理后台验证；动态命中为实际浏览器帧内elementFromPoint+HTMLElement.click，不是物理触摸；缩放惯性已有代码修正/审查，未单独取得运行指标。
4. CI下一最小候选仍是离线映射/报告校验；未批准直接迁移producer/summary/upload/remote或保护规则。该研究不阻塞视觉候选反馈。
5. 新设备先核对Git HEAD/工作区/远端、项目固定Node26.12.1和锁定依赖，按README重建。媒体可直接从研发分支取，临时服务/原始日志不假定可见。当前授权为研发提交推送，不涉及main、Tag或发布。
