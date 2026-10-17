# Stone Free R17：版本配对与公共合同建议

2026-10-17。本文件是本地候选政策，不构成正式稳定支持承诺。

## 三种版本

| 对象 | R17 本地候选 | 意义 |
| --- | --- | --- |
| Host 包 | 0.1.3-experimental | 安装身份；Runtime 与 R16 的 0.1.2 保持相同，更新玩家说明与装配身份 |
| Host 公共协议 | 0.1-experimental | framework/contracts.ts；本轮不改协议 |
| 官方 UI | 3.0.0-lab.17 | 独立消费者；只要求上述精确 Host 包 |
| 原 UI API | v1 | DoLGameUI.ui；与 Host 协议分开 |

建议首个正式 RC 采用 Host 0.1.3-experimental 与 UI 3.0.0-rc.1 精确配对、同步发布，并继续标注 Host 协议为实验合同。正式冻结协议、扩大版本范围及稳定维护期限由项目负责人确认；本轮不实施该重命名，也不预占 Tag。若决定冻结稳定协议，应另行评审真实消费者迁移，不以改版本字符串代替兼容证明。

## 作者接入边界

消费者通过 framework/connect.ts 检查全局访问、协议、必要方法、disposed 与能力，再注册自己的 Participant。读取和初始化均在异常保护内；缺少、不支持、异常 getter 或初始化失败时不启动，释放自身。不能把 Loader dependenceInfo 当成自动阻断执行的保证。

Host 公开能力限于有归属的 Mount、Claim、Source、Command、View 与场景 Binding。官方 UI 也使用公开 Participant，没有隐藏提权入口。Host 不加载 Mod、不保存第三方业务状态、不接管游戏结算或存档。getCapabilities 只声明 views/commands，不能推断业务动作或任意渲染组件可用。

Source.read 的失败为 missing / stale / failed / invalid-value；Command.invoke 为 returned / missing / stale / busy / unknown。returned 只说明 handler 返回 JSON，不是原游戏业务成功。unknown 不可自动重试。Binding 的 generation、AbortSignal、isCurrent 与原对象/报价校验各有职责；API ready 不代表场景就绪。

参与者负责自身代码、输入与原游戏结果核对；Host 负责资源归属、场景失效和局部释放。消费者退出不关闭其它消费者，Host 退出使所有绑定失效。整包停用后重启与主动 dispose 分开；不承诺加载器热卸载、任意独立升级、多 Host 仲裁或第三方业务自动兼容。

当前合同来源：framework/contracts.ts、connect.ts、host.ts、boot.ts、official-ui/main.ts。R9–R16 的正负例继续有效；R17 没有破坏性公共 API 修改。正式能力覆盖沿用 STONE_FREE_3.0_R14_COVERAGE.md，不另建功能平台。

## 偏好策略

| 项目 | 策略 | 实现 |
| --- | --- | --- |
| 主题、视觉档位、字号、密度、侧栏、存档 V2 | Preserved | src/theme/controller.ts，同一 DoLMidnightTheme.preferences.v1 和 _scaleBaseline26 标记 |
| 各页面开关、商店默认类别、存档显示别名 | Preserved | src/{wardrobe,shop,combat,saves,panels,social,characteristics} 原键 |
| 悬浮入口启用/隐藏/模式 | Preserved | DoLGameUI.stoneFree.floating.v1 |
| 旧悬浮 x/y/tools | Retired for new Hub，原数据保留 | 不强行转换；回到2.7仍读取旧位置与工具 |
| 新 Hub 位置 | 新增独立 UI 数据 | StoneFreeMotionHub.position.v1，不写游戏存档 |
| 实验工作台偏好 | 独立保留 | StoneFreeWorkspace.*；不是官方 UI 运行前置 |
| 已退休实验开关 | Retired | statusPreview/startupCacheLazy/storyActions 在既有读取逻辑中关闭，不恢复旧实验 |
| 未知第三方/其它键 | 不接管 | 不扫描迁移任意私有状态；是否为旧UI数据，未知则Unknown |

本轮没有新增迁移。旧版已存在的2.6比例迁移规则不重写；实际2.7升级与回退结果在R17报告记录。新UI不改变存档格式；gameTime显示字段及有效附加字段继续按既有合同保留。
