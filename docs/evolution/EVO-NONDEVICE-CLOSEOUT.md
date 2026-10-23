# EVO：无需实机的工程收口与剩余验收

2026-10-23，输入 `d3f04ee`，研发分支 `dev/evolution-4.0`。负责人要求优先完成暂时不依赖实机的工作。这里区分代码工程、负责人视觉裁决、受控宿主验证和真实设备验收；不能把所有未完成项都写成“等实机”。不合并main、不升级公开版本、不发布。

## 可独立推进的工程

| 编号 | 工作和证据入口 | 当前结论 |
| --- | --- | --- |
| EVO-A2/A3 | [消费者迁移](EVO-A2-A3-CONSUMERS.md)、[冻结覆盖与例外](EVO-P0-COVERAGE.md) | 既有迁移已完成本轮共同资源接线及相应重复路径退出；保留各原生业务控制器和六类调度例外。不是所有业务场景已验收。 |
| EVO-INT-S01 | [实际设置](EVO-INT-SETTINGS01.md) | 设置V2.3实际研发入口已完成，5组当前正例与固定旧行为4拒绝/1通过；本批共存时复验。 |
| EVO-INT-W01 | [实际设置天气](EVO-INT-WEATHER01.md) | C5.2/R10实际设置入口已完成，9组正例及像素精确反例；其它原生窗口天气仍有消费者，不能删除旧CSS/SVG。 |
| EVO-INT-H01 | [实际Hub](EVO-INT-HUB01.md) | 本批接线：真实Host工具、认可球体与联动共用实现；原型退出独立实现。接线、输入、几何、短屏滚动、生命周期、异常fallback和制品合同均可在本机完成。最终结果以链接报告为准。 |
| EVO-G1-COEX | [实际共存诊断](EVO-G1-COEX.md) | 手动24轮、两段15秒雨天、隐藏恢复和经典Floating/最终作用域归零；只属本机短时受控观察，长期和设备性能仍待验收。 |
| EVO-G1-TECH | 下方覆盖复核 | 本机/CI能完成静态共同消费者证据、作用域正负例、实际组件受控回归和独立代码复核；保留业务场景与真实宿主限制，负责人G1结论单列。 |
| CJ-3C / 构建交付 | Python精确制品检查器 | 本批GSAP进入UI bundle，必须保留源横幅与独立声明；保持八包、两轮实际构建、ZIP内容/压缩/元数据及原负例，不改Host、UI版本和发行物。最终结果见H01报告。 |
| CI-HANDOFF-01 / #22 | HANDOFF、任务报告、精确提交和两套Actions | 本批完成时记录；标准CI与研究CI分列。CI平台由另一聊天处理；其PR #23已并入研发分支799b07d，本批安全整合，不另改规则。 |

## G1技术复核：按真实消费者核对

| 消费者族 | 共用实现及退出证据 | 可自动核对与不能替代的验收 |
| --- | --- | --- |
| 属性、社交、通用原生页 | navigation adapter / navigationMount；见A1、A2-L01报告 | navigation/panels/framework受控入口、原节点/单次动作/撤销；真实游戏不同页仍待宿主验证。 |
| OrbitFocus、导航、sourceMotion、设置布局 | navigationRect / visualScope，保留CSS/Vue动画 | orbit反例、source-motion-lifecycle、settings-ci及隐藏/迟到；不承诺未知第三方布局。 |
| 设置、侧栏、原生呈现、天气 | 相同资源所有者，S01/W01退出其已迁移旧路径 | settings-ci、header-weather、official-game-motion、13入口归零；原生其它窗口天气保留例外，不伪称全迁移。 |
| 正式Hub、Golden Spin、经典Floating | H01共用球体/适配器；经典fallback与作者默认Hub保留 | 原型H1–H4、实际Hub单次工具/焦点/拖停靠/隐藏缩放/构造故障；真实触控、系统输入不由模拟代替。 |
| 商店、衣柜、战斗、存档、自有兼容装饰 | visualScope包装自有任务，保留交易、穿戴、战斗、传输和第三方业务边界 | 现有shop/wardrobe/combat/save-transfer/adapter受控回归；系统select、真实存档导入导出、多Mod业务仍须目标环境。 |
| UiApi、master/presentation、Host/工厂 | 复用原共享服务，对外API不变 | framework/connect/commands及资源回归；不是另一套中央运行时。版本诊断旧问题由CI专项处理。 |

`evolution-resource-contract` 防止迁移消费者恢复私有原生调度；`evolution-owner-resources`覆盖13个实际根入口。词法扫描只是审计线索，不当作100%消费者覆盖率。GSAP是现有锁定依赖，timeline属于各实例；不得全局停ticker来制造单实例资源归零。

六类明确保留调度：visualScope本身、既有UiApi注入Window调度、SugarCube状态服务、Inspector下载URL回收、默认退役story-actions、衣柜原生批次yield。上游vendor算法不纳入自有迁移统计。CSS/Vue合法声明式能力继续保留。

## 尚不能宣布完成的项目

- **真实宿主而非“手机专属”**：完整游戏+ModLoader、真实页面发现和恢复、Host+UI新安装、多Mod组合、原生业务与授权存档语义；当前Mac缺旧 `tests/fixture.html`，不能把受控壳计作完整游戏。可在后续桌面环境补，不必等Android。
- **真机/目标环境**：Redmi、小米平板实际viewport/DPR/缩放；Android WebView、真触控、软键盘、系统选择框、iOS/Windows目标浏览器与长期并窗性能。无需补齐没有实机的所有苹果型号。
- **负责人视觉裁决**：H01当前实际入口的H1–H4展示、雪天及全局材质角色；原型雨天通过不等于全部窗口、雪天或G2通过。此项也不必等实机，但必须由负责人判断，Codex不能代签。
- **其它窗口新天气**：仍需角色/保护区设计与对应视觉对照；本批不机械推广设置材质，不删活跃旧路径。属于后续视觉整合范围，不假称设备阻塞。
- **CI独立任务**：PR #23已修正Runner/证据与旧Core/正式包身份合同，并入研发分支799b07d；合并后新CI仍按实际结果记录。旧失败保留，不继续标为未修身份问题。CJ-4规则/bypass仍单独审批。
- **G1/G2/G3与发布**：技术证据可逐步完备，但未由Codex自动裁定全局通过；本批无main合并或Release。
