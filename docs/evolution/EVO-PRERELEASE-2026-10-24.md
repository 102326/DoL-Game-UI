# Evolution：发布前整合与当前 Mod 组合

2026-10-24，分支 `dev/evolution-4.0`。本轮约定的工程整合、Mod 更新、代表性回归、候选核对与交接材料已完成；覆盖有限，整体发布 Gate 仍待负责人裁决。没有合并 main、改公开版本或发布。

后续日期专项已按负责人授权接续为 DolOptimizationSoftWet 1.0.3 的条件显示回退，详见[修复装机记录](EVO-SAVE-DATE-FIX-2026-10-24.md)。下方1.0.2及37da596九包仍指原批次冻结，不用新包覆盖历史证据。

## 冻结实现与候选

受验实现为 `37da59637e42e53bc0ccc73973c87fe39b3231e3`。它包含当前兼容整合及 CI 九包证据修复，UI 运行代码沿用已装机的 cea3bf7；本报告之后的文档提交不冒充重新完成整轮测试。

- [标准 CI 39992958236](https://github.com/102326/DoL-Game-UI/actions/runs/39992958236)：validate、独立下载 evidence-verify、moody-gate 均 success。
- [研究 CI 39992955737](https://github.com/102326/DoL-Game-UI/actions/runs/39992955737)：prototype 和独立下载 evidence-verify 均 success。
- 本机已下载标准证据、九包构建与研究验证收据，核对全部 SHA256SUMS 项、包身份及版本。研究完整媒体由 Actions 独立下载验证，本机没有重复下载约 123 MB 媒体。
- [冻结包身份](EVO-PRERELEASE-PACKAGES-2026-10-24.json)记录源码、九包 SHA-256、文件大小和作者更新输入；技术资料保留在源码仓库，不作为玩家 Assets 附件。

候选保持 Host + UI 双包，技术版本仍是 UI 3.0.4 / Host 0.1.5-experimental。它是 Evolution 研究候选，不能与公开 v3.0.4 混称。公开版本切换、Tag 和 Release 属于后续明确发布决定。

## ModHub 更新与兼容

以独立测试 App 的 ModHub 可更新列表为准；四项更新均核对作者发布资源后安装，重启后确认实际版本。

| 目标 | 原版本 → 当前版本 | 本轮兼容候选 |
| --- | --- | --- |
| [ModHub](https://github.com/JohnLiao501/ModHub/releases/tag/v1.8.3) | 1.7.6 → 1.8.3 | ModHubSoftWet 1.0.2 |
| [MapleBirch](https://github.com/MaplebirchLeaf/SCML-DOL-maplebirchFramework/releases/tag/maplebirch-release-v5.5.4) | 5.5.1 → 5.5.4 | MapleBirchSoftWet 1.0.1 |
| [原版优化](https://github.com/ANLINSTUDIO/Degrees-of-Lewdity-DolOptimization/releases/tag/v1.1.2.1) | 1.1.2 → 1.1.2.1 | DolOptimizationSoftWet 1.0.2 |
| [SmartPhone Alpha](https://github.com/ANLINSTUDIO/Degrees-of-Lewdity-DolSmartPhone/releases/tag/v0.3.91) | 0.3.91 → 0.3.91.1 | SmartPhoneSoftWet 1.1.1 |

保留 CE 1.20.3.1-rebuild.30、PhotoPack 和其它非更新项。银商启动按负责人决定保留。APK 内置 Loader、汉化和 Lyra 资源不以市场同名包替换。刷新市场后四项更新提示清除；公开 UI 3.0.4 因与研究包成员不同仍可显示更新，不用公开包覆盖研究成果。

操作前备份原包成员、顺序和禁用列表；顺序保持原样，禁用列表仍为空。作者 ZIP 只用于本地测试，不随我们的候选重新分发。

SmartPhone 适配从独立维护分支 de95ad4a 纳入当前构建，增加已核对的 0.3.91.1，保留原结构合同和 0.3.92 拒绝反例。其它三个兼容包延续现有结构识别，没有重写安装、云端或穿戴业务。CE 和嘴部包的旧安装与候选差异只有换行格式，也已统一到候选字节。

最终 Android 已从 CI 的规范 ZIP 安装八个自有包，重启后逐个检查全部成员 SHA-256，与下载候选完全一致：Host、UI 和六个适用兼容包。ReOverfits 未安装目标，仅完成构建与合同检查，没有为了凑覆盖安装新 Mod。

本机 Windows 构建与 Linux CI 的 ZIP 容器摘要可能因压缩和换行不同；逐成员区分后，以下载的 CI ZIP 作为冻结候选，未混用本机构建摘要。CE / 嘴部旧安装的格式差异也经文本同一性核对后更新。

## 代表性回归矩阵

环境：Android 17 / WebView 155 的已连接平板与独立测试 App；Windows / Node 26.12.1 / Edge 157.0.4341.10 的隔离浏览器。游戏基线 0.5.12.13 / ModLoader 2.101.1。Windows 使用同一 APK 的未改 HTML 和真实 Loader；四个新目标及对应兼容包实际加载，不代表完整复制 Android 的全部社区组合。

| 范围 | 当前证据 | 结论与限制 |
| --- | --- | --- |
| 设置、Hub、角色窗口 | Windows 实际设置双布局、开关恢复、Hub 调用设置，属性 / 社交 / 特质 / 日志 / 成就开关；Android 历史同代码装机证据复用 | 本轮代表场景通过；认可的设置、霜羽与球体保留，READ01 未接入 |
| ModHub 1.8.3 | Android / Windows 管理、说明、日志、帮助切换；Android 市场、body 工具浮层和 390×844 受控视口 | 结构匹配、原操作节点保留、列表无横向溢出；不宣称所有安装 / 更新卡顿根因已解决 |
| MapleBirch 5.5.4 | 实际云存档页及统一页头，适配 full match | 未读凭据、未连接、上传或修改云端 |
| 存档与转移 | 原空槽 4 保存后重开可读；原存档码生成 / 载入；Android 系统保存对话框实际导出 128752 B 文件；Windows 原文件输入载入该测试文件，从 Mirror 返回 Bedroom | 仅使用本轮新建进度，未覆盖已有槽位 1–3；原文件 SHA-256 与业务回执留本地 |
| 原版战斗 | 新组合真实教程，双手击打 / 踢的原选项，九次原 Continue 推进至 Tutorial Finish | 每次仅一次可信点击且回合 +1；结束 combat=0，面板 / 底栏 / 占位均为 0；其它战斗仍是扩展覆盖 |
| 窄屏战斗与默认 | 复用未改的上一批真实 Android 390px、四缩放、两模式及本批 CI；新偏好默认动画 + 平铺，已有偏好保留 | 受控视口不等于物理手机；测试临时平铺偏好已恢复 |
| 商店 | 当前原生报价 £5、数量 1、原购买并送回家控件；资金 500→0，库存 0→1，可信点击一次，UI 原结果确认；毛线帽试穿 / 返回和原商店退出 | 实际业务通过，未写钱或库存；只覆盖所选普通单件 |
| 衣柜 / 原版优化 1.1.2.1 | 更衣室实际新 UI；连续穿入校服衬衫、睡衣衬衫，叠穿列表显示两件；原 ▶ 调整顺序、原名称链接卸下一件；退出回商店再离开 | 原叠穿业务与列表通过；穿戴 / 详情抽屉等未改代码复用前批与当前 CI，不穷举全部衣物 |
| SmartPhone 0.3.91.1 | 实际外壳、备忘录、debug 结构匹配；390px 中原备忘录输入对象不变、一次 input、边界未溢出 | 手机由作者原 debug 测试入口准备，不冒充商店购买；检查后以本轮存档恢复，未执行 debug 命令或验证全部手机业务 |
| 生命周期 | 同场景 33 次原窗口 / 设置 / ModHub / Hub 开关及一次 Android 后台返回 | 回合与资金不变、挂载退出、错误节点为 0；短时结果见下节 |

最终候选重启后八包成员再次一致；原生读取本轮槽 4 返回 Bedroom，测试准备与试穿状态退出，临时视口清除、原 UI 偏好恢复。没有将这些测试进度写入原有槽位。

最终演示录屏保留在本地，展示真实 Hub 展开、设置工具调用和关闭。曾出现一张 CDP 截图顶部压扁的采集异常；同次原生录屏及重启后的 Android 原生截图标题、关闭按钮均正常，DOM 几何也正常。本轮没有据该截图改动已认可的材质，媒体仍待负责人审阅，不作视觉通过证明。

## 稳定性与资源

后续同一候选完成[99次开关与空闲回落复测](EVO-RESOURCE-FOLLOWUP-2026-10-24.md)：观察到Graphics/PSS明显回落，第二、第三批静息占用接近；长期来源仍有边界。以下保持首次33次采样原始结论，不用后续观察覆盖旧失败或Unknown。

33 次开关后属性 / 社交 mounted=false、无战斗残留。即时节点 87749→98626、监听器 1871→2376；稍后自然回收的独立采样回落至节点 88675–89239、监听器 1863。没有强制 GC，也没有采集 heap 正文或证明保留链。

| 指标 | 开关前 3 组 | 开关后 3 组 |
| --- | --- | --- |
| App PSS（KiB） | 531880–565388 | 638863–649009 |
| JS heap used（B） | 244480780–262359828 | 239775484–259600024 |
| 有效 gfxinfo 帧样本 | 0 | 0 |

PSS 仍高于基线，来源未归因；这些采样不证明长期泄漏已解决，也没有有效 FPS 结论。当前短时功能闭环完成，长期资源与完整 renderer 分摊留为 Known limitation，未扩建性能框架。

## 失败记录与覆盖清单

- 42aefd6 的标准 39990377617：九包构建通过，最终证据端仍按八包 / 旧反例名拒绝；已更新生产者、校验者、夹具及缺手机包反例。8b49b50 的 39991787677 因 Windows CRLF 与 Git LF 的精确源码锁不一致拒绝；37da596 使用规范 LF 重新生成并核对暂存源码，最终两套门禁成功。没有删反例、放宽断言或修改保护规则。
- 本地首次 Vite fixture 导航被 83 MB 临时游戏 HTML 的自动入口扫描拖住；原失败保留，游戏副本移至本地忽略的 __tests__ 后设置完整检查通过。随后历史关闭时序反例在 Edge 未准确拒绝旧采样，未反复重跑到绿；Linux 当前完整反例检查通过。Windows 本地全量 unit 仍有路径 / file URL / 符号链接权限失败，不冒称本机全量 CI 通过。
- Windows 的此 APK HTML 将 Save.export 直接绑定 Cordova 插件，导出未收到浏览器下载事件；Android 原生导出和 Windows 原文件载入已验证。独立标准 Windows 游戏发行 HTML 的文件导出是 Additional coverage。
- Not validated：物理手机、iOS、macOS 当前候选、全部 Mod 组合、所有商品 / 战斗、第三方云端和长期资源。ReOverfits 当前无目标。以上不自动扩大本轮交付。
- selectedWardrobe 的已修复失效刷新路径与本轮更衣室退出通过，不代表所有历史同名异常已归因。ModHub 全部安装 / 更新闪烁及卡顿也不作已根治声明。

## Gate 与交付

| 状态 | 本轮结论 |
| --- | --- |
| Delivered / Integrated | 已完成所列工程、四项目标更新、对应兼容候选、九包冻结及发布前文档 |
| Validated | 精确源码两套 CI 与独立下载；代表性 Windows / Android；实际八包成员一致 |
| Known limitations | 上方资源、宿主、历史异常与覆盖边界 |
| Owner Acceptance | G1 / G2 / G3 的负责人最终裁决仍 Pending，局部历史认可照旧保留 |
| Release Authorization | 本轮只到发布前；未授权 main / Tag / 正式发布或代签 Visual Gate |

日期异常后续核查已定位原版优化附加显示的首帧取值问题，见[专项归因](EVO-SAVE-DATE-REVIEW-2026-10-24.md)。当前组合尚未安装日期修复，是否需追加产品适配仍待决定；不能据此前工程收口表述认定没有待修行为。安装 / 回退见[候选指南](../INSTALL_EVOLUTION_CANDIDATE.md)，面向使用者的描述见[发布草稿](../RELEASE_EVOLUTION_DRAFT.md)。公开版本、最终媒体与发布决定由负责人确认；READ01 和其它未批准视觉研究不进入候选。
