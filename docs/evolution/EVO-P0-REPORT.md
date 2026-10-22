# EVO-P0：4.0开工首份反馈

2026-10-22，依据[正式授权V1.2](../references/SOFT_WET_4.0_EVOLUTION_V1.2_ORIGINAL.md)。独立研发分支`dev/evolution-4.0`，阶段提交/CI精确身份见#22及Git；所有阶段状态分别记录，不视为整版完成。

## 当前身份与冻结

main `6a6e3c0`、研究输入`baf0d48`、公开3.0.4源码`915dcb9`已fetch/核对，原研究分支不覆盖。复用现有linked worktree建立新分支；正式包仍UI3.0.4/Host0.1.5-experimental，不擅自改发行版本或Host API。[V0基线摘要](EVO-V0-baselines.json)固定设置6510a1d及其CI、球体/Hub、Acrylic和天气读取的逐文件摘要。

设置开100/关80ms、正文立即可交互、V2.2分类保留。球体外观与真实工具/终态布局保留；不加星纹、轨道、新菜单。现有Hub研究adapter含整段演出期间工具禁用，已登记为V2要修的交互问题，不能当作4.0已合格基线行为。

## 已经做了什么

| 工作包 | Implemented | Tested | Visually Accepted | Integrated | Release Ready |
| --- | --- | --- | --- | --- | --- |
| EVO-P0 | 范围矩阵、基线、原文归档及实验入口 | 源码差异/身份/普查/类型核对 | 仅继承明确获批旧基线 | 否 | 否 |
| EVO-A1 | 属性/社交正式入口改用同一适配器；旧基础逻辑退出 | 两端受控实际Host/Vue及生产CSS，Zoom/异常等通过 | 不改变既有视觉决定；不以技术测试代替游戏观感 | 正式源码接线，真实游戏未验证 | 否 |
| EVO-V1 | 真实设置表面的Canvas天气候选及连续重定向 | W1–W4受控测试，含60秒使用及释放 | 待负责人 | 否 | 否 |
| EVO-A2/A3/V2/INT | 未执行全量迁移、Hub新联动或正式整合 | 未验证 | 未获新视觉验收 | 否 | 否 |

P0的[消费者矩阵](EVO-P0-COVERAGE.md)覆盖导航、设置、通用窗口/表面、材质/天气、官方/经典Hub、商店、衣柜/渲染、战斗、存档、reference、兼容装饰、退役功能和Host/开发工具例外，而非只登记属性/社交。[89文件词法普查](EVO-P0-inventory.json)固定输入基线，不等于89个真实消费者或100%纳管。

现有共用基础包括Host owner/mount/claims、presentation隔离/释放、UiApi surface、sourceMotion、OrbitFocus、nativeNavigation和readGameWeather/headerWeather。没有另建万能WindowShell、四个新包或公共Judge/动画插件平台。

[A1详细实现与失败记录](EVO-A1.md)：原属性隐藏后租约不释放被实际负例拒绝；共同release/坐标修复对两个真实消费者生效，运行implementation均为native-overlay-navigation/v1。专属组件、分组、动画与原生事件保留。

[V1原型、原速录像与边界](../../prototypes/evolution-weather/README.md)：同一玻璃表面持续湿润/凝露/水痕、霜纹与光照参数变化；不是旧天气层淡化。画面和质量仍需负责人判断，不称完成高保真视觉验收。

## 验证记录

- 基线`npm run ci:check`通过。
- 修改后`npm run ci:check`、Framework构建及Evolution TypeScript/静态构建通过。
- `node tests/evolution-navigation.cjs`两端通过；租约争用、重挂、故障恢复、原节点/事件、三档Zoom、属性接力层坐标及零残留覆盖见A1。
- `node tests/header-weather.cjs`、`node tests/settings-ci.cjs`通过既有天气/材质/隐藏释放及设置布局/输入/分类中断/持久化检查。`node --test tests/ci-evidence.test.cjs tests/test-workflow.test.cjs`两文件通过。CI链接回填#22；不把命令启动记为完成。
- `EVO_WEATHER_ENDURANCE_MS=60000 node tests/evolution-weather.cjs --record`通过4个受控场景组；视频/截图/JSON保留对应源码摘要。DPR1/Chromium并非真机。
- CI测试列表加入A1；现有研究工作流扩展4.0分支触发及天气步骤/白名单证据，不改变main检查名称、保护规则或bypass。完整标准CI通过手动途径获取，未触发不算通过。

本机日志、绝对路径及原始WebM留在忽略的HANDOFF.local.md/测试目录；公开媒体只含受控第一方场景。没有私人存档、完整游戏HTML或未知第三方制品。

## 需要负责人决定

1. 确认[EVO-P0建议迁移范围与例外](EVO-P0-COVERAGE.md)，作为后续A2/G1依据。首片A1和隔离V1已由授权书允许，不因此停止这些有界工作；确认前不全量推广。
2. 观看天气首候选，确定湿润/霜纹/光照的视觉方向与下一轮取舍；核心W1–W4/H1–H4未删减。
3. 后续设备阶段补实际环境/viewport与真机安排；当前不要求等待设备才能继续已授权的工程研究。不申请合并或发布。

下一轮继续按实际审阅修正A1/V1、准备V2真实Hub交互联动；完整A2/A3待范围冻结。G1/G2/G3均未通过，4.0不可申请正式发布。
