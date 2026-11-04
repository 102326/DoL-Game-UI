# Soft & Wet — 当前交接

更新：2026-11-04。**4.1.0已发布；4.2 Study 03已补商店第二角色与本机恢复合同，定向检查通过，视觉待评审。**

## Current — 当前做什么

- 分支`prototype/4.2-first-samples`。本批从已推送e368f1ddda54d579708929d36f9399240f5a902f接续；11月4日fetch确认origin/main仍c7d8bac67fd04d0a81e59cf4c49800a510a39a11。Tag v4.1.0与main树相同、提交身份不同。旧工作保留。
- Study 03源码与媒体已随[`a0fda0f`](https://github.com/102326/DoL-Game-UI/commit/a0fda0fd87706067c08914e1d860cab2c8208af9)推送；GitHub确认author/committer均关联Codex bot。[#35进展](https://github.com/102326/DoL-Game-UI/issues/35#issuecomment-6623655879)已同步。本快照随后只补文档回执，分支最新HEAD以Git为准。实际检查在未提交树执行，输入逐项摘要绑定文件；不改称干净提交执行。生产src/framework/compat、依赖锁、正式版本和CI工作流未改。
- 入口：[计划V1.5](superpowers/plans/2026-11-02-soft-wet-4.2-r1-review-plan.md) · [R1 Study 03及历史](evolution/EVO-4.2-R1-2026-11-02.md) · [本批验证摘要](media/evo42-study03/validation.json) · [原型命令](../prototypes/evolution42/README.md) · [GitHub #35](https://github.com/102326/DoL-Game-UI/issues/35)。不另建路线图、不重开旧Issue。
- 本机预览5206；第二角色`/prototypes/evolution42/shop-review.html`，前批设置/Hub对照`/prototypes/evolution42/compare.html`。机器路径、服务进程和原始日志只放忽略的HANDOFF.local.md。

## Decided — 已经确定什么

- **延续Claude设计思路，收束落地范围**：优先Hub与部分界面；JELLY仅为运动子项，不覆盖Claude全部提案。保留黑灰Acrylic、紧凑默认、原生业务；不做全局自由布局编辑器、默认自动降质或Host协议扩容。
- **E42-JEL-01 / P-B**：真实MotionHub隔离适配FreeHub，保留工具/View/球体；自由二维停留、有限惯性、真实丝线召回和重新抓取接管。只写研究位置键、只读旧键，未做生产迁移。本批补损坏/未来版本数据回退、受控存储失败继续操作及重载恢复，旧键字节不改。
- **E42-ACR-01 / P-A**：设置已有烟色厚度、暖冷边光、阅读井、真实内芯滞后与受力光带。本批商店工具栏/目录作静态承载，详情真实正文作内芯；不位移整个目录、不复制正文。详情用伪元素装饰，保留原生节点所有权与实际控件/事件。合成商品、钱值与购买回调不代表真实交易通过。
- 既有一设置窗口/一heavy雨/一次拖动联合探针继续通过；商店保留原天气路径，未给详情新建天气层，不是完整P-C或全角色天气验证。
- Mac arm64 / Node26.12.1 / 锁定Chromium153.0.8010.12：设置9项PASS、Hub8组PASS、商店7组PASS，pageerror空；vue-tsc和严格Node工具tsc通过。分别绑定13/9/5个源输入摘要，已对当前文件复核。商店包括1280/390三材质、受控popover失败回退、实际位移/受力、picker、单次原动作、重开/跨窗/清理。
- 失败保留：首拖因研究舞台高度越界向上夹回约83px，修共用可用高度后同输入y=8；泛用夹具缺列表载体仅在研究夹具补齐；一次早期拖动间歇失败原因未完全确定，现加实际命中前置与受控裁剪反例。审查发现的空集合/重开后矩形假通过已修正。旧Study 02失败与全部限制见R1，不靠重跑隐藏。
- 本批六图、两段商店原速视频与验证摘要随源码交付，媒体3,281,550字节；宽窄B方向演示不是新旧性能配对。旧Study 02四段录像保持原样。视觉方向仍待负责人裁决，自动化不代签。
- CI只读补充：标准88entry/研究41entry、12对同命令；同命令不代表可删合同。settings标准19case，checkpoint差异已记录。历史job链707/817/531秒仅为已有样本复算，不含完整提交等待与修复轮次，不宣称收益。未改catalog/Expected Lock/runner/gate/规则，按批手动政策不变。
- 原型仍未纳入现workflow必需任务，本批没有新远端整轮CI；旧4.1成功Run不覆盖4.2候选。#33 Ray无新复现/修复证据，仍Unknown。正式发行证据见[Release记录](releases/4.1.0/RELEASE_RECORD.json)。

## Next — 下一步做什么

1. 负责人比较设置/Hub与商店第二角色，决定材质及运动的采用方向。第二结构已做工程探针，正式迁移尚未开始；沿原消费者覆盖表逐项验证，不能把两角色通过当作全局完成。
2. 非Hub需求继续沿R1记录发现，比较默认改进与选择的价值，允许零新增设置；完整P-C后续决定，不新增平行路线图。
3. Windows原生弹窗、Android WebView触控/软键盘、真实游戏业务、GPU/功耗留对应现场。受控隐藏/存储/API失败和Chromium模拟不代替实机。早期间歇拖动若再现，保留现场再定位，不自动重试至绿。
4. CI下一最小候选仍为离线计划/报告样本校验；未经选定不迁移producer/verifier/gate。沿14场景有界影子对照与有效变更端到端指标，不把旧命令重复直接删除。
5. 新设备先核对HEAD/工作区/远端、固定Node26.12.1、锁定依赖及实际浏览器，再按README运行；媒体可随分支获取，临时服务/原日志不可假定跨机存在。本轮仅研发分支交付，不涉及main、Tag或发布。
