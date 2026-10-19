# Soft & Wet — 跨设备交接

更新：2026-10-20。接手先核对远端 Git、Actions 和 Release，不从历史阶段快照推断当前状态。

## 当前分支：万能手机兼容

- Current：`compat/smartphone-3x` 从正式 3.0.2 的 `cf53c20bde99218bb1cd000b3d5514a6136ec4e8` 创建；当前独立可选包 SmartPhoneSoftWet 1.1.0 已完成本轮本地交付并更新到平板测试 App，源码保存于本独立分支，未合并 main；本分支名称不触发现有 push CI，无本分支 CI 链接。没有修改主 UI、Host 或其它 Mod 源码。
- Decided：作者 NEEDMEET遇欲／ANLINSTUDIO，主包技术名 SmartPhone Alpha，当前正式版 0.3.91。本包仅接受该版本及核实的正常手机结构，使用 3.X 基线。预览、特殊窗口及未识别结构保持原样。详见 [范围、输入身份与验证](SMARTPHONE_COMPAT_3X.md)。
- Validated：受控布局／原事件／延迟创建／退让／清理、适配器类型检查、打包合同和 Windows Edge 156 中 DoL 0.5.12.13／Loader 2.101.1 的代表性真实手机操作通过。命令及覆盖边界见专项报告；后续 Android 与 PhotoPack 现场见下述记录，全业务矩阵未验证。
- Next：用户已授权将源码提交并推送到 `compat/smartphone-3x`；不合并 main，不重复部署或修改既有 Assets。远端精确提交以 Git 分支为准。此前已授权直接添加 3.0.2 Assets，1.1.0 已发布并核验重新下载字节，发布说明与校验清单已同步；其它运行附件未变。本机 ZIP、摘要、最终回执与保留的失败证据路径只记录在忽略的 `HANDOFF.local.md`。
- 后续安装：用户已另授权安装与测试；同一候选已持久安装到核实的独立 Android 17／WebView 154 平板测试 App，运行脚本和样式 SHA 匹配。原生点击／滑动、输入与设置、锁屏重开和视觉检查通过；清理脚本异常已专项恢复，失败与恢复回执均保留。原手机状态还原、无临时备忘录、其它游戏变量未变；候选保留安装。本段记录安装阶段，后续 Assets 与源码授权见上文。
- 设计融合：用户随后授权将 3.X 细边、卡片、导航反馈融入手机，并适配 debug；当前 1.1.0 无动态天气。Windows 真实游戏与平板的手机／debug 代表操作、滚动及清理通过。发现主 UI 3.0.2 的新衣柜会将手机和 debug 开关收入隐藏原版区，本包保留 hidden 所有权；通过原“关上衣柜”返回卧室后验收，不改并行衣柜源码。候选摘要、原始失败与最终通过回执见本机交接及专项报告。

以下保留创建本分支时继承的主线 3.0.2 交接记录；它不是本兼容候选的发布状态。

## Current — 当前做什么

- 手机设置全局缩放缺陷 #10 已由 [PR #11](https://github.com/102326/DoL-Game-UI/pull/11) 修复并合入 main：8e1785c12dc51c034ac0e2caffe3cf9fb50ef2ea。
- 负责人已授权测试无误后发布 3.0.2，本轮准备版本、玩家说明与九个附件（主 UI、沿用 Host、六个沿用兼容包、SHA256SUMS）。不替换 v3.0.1。
- 发布分支 release/kraft-work-3.0.2；最终源码、包身份与验证范围见 [3.0.2 验证](KRAFT_WORK_3.0.2_VALIDATION.md)、[源码身份](releases/3.0.2/SOURCE_IDENTITY.json)。发布是否完成、精确提交和 CI 需从远端回读；本文不提前宣称 Release 已发布。

## Decided — 已经确定什么

- 所有现行 UI 设计统一使用 [3.X 基线](VISUAL_BASELINE_3X.md)，1.X／2.X 设计封存，不再作为运行主题或设计来源。保留原游戏回退与配置迁移。
- DoLGameUI 3.0.2；Host 0.1.4-experimental，协议 0.1-experimental，UI 依赖 >=0.1.2-experimental 且 <0.2.0。六个兼容包保持 1.0.0，公开沿用包必须与 v3.0.1 SHA 匹配，不用本地重新打包字节覆盖同版本。
- 修复 PR [Run39283083644](https://github.com/102326/DoL-Game-UI/actions/runs/39283083644) 与 main [Run39287583419](https://github.com/102326/DoL-Game-UI/actions/runs/39287583419) 的 validate、moody-gate 均通过，App15368；两提交树一致。
- 当前独立 CI 规则要求 validate、moody-gate，strict=true、无 bypass；原 jijizi 更新锁保留。仅在所需 CI 已成功后使用原有管理员维护权限合并，不修改规则或跳过失败检查。
- 实际 Android 17 / WebView 155 复现并复验全局缩放；Windows 受控测试覆盖两方向、输入、长内容及清理。合成触控不是物理手指验收，真实 iOS 与报告者原配置 Unknown。详细条件见验证说明。
- 3.0.2 运行逻辑与手机已验证候选相同，仅产品版本字符串不同，CSS／早期脚本／Twee／声明／许可证相同。正式 ZIP 不冒充已在手机安装。
- Windows 包合同反例夹具的默认编码问题已改为 UTF-8；保留失败，不弱化断言。旧构建回执拒绝仍有效。
- 源码仓库保留既有 Moody Blues CI 与协作成果。之前 CJ-3A/B/C/D、CJ-4 的历史记录见对应专项文档；它们不代替本轮精确输入和环境证明。

## Next — 下一步做什么

1. 回读本版本 PR 与 main 的实际 CI；必要检查失败先诊断，不反复重跑至绿。
2. 授权范围内核对 Tag、九附件和 SHA 后发布 3.0.2；若已经发布，先检查实际远端状态，不重复创建或覆盖。
3. 未覆盖设备和特殊游戏／Mod 业务留作后续证据；不扩大本次补丁范围。所有后续 UI 设计沿用 3.X。

本地原始截图、设备标识、第三方包和失败日志不公开，机器路径仅放忽略的 HANDOFF.local.md。不得把 CI／受控浏览器结论写成物理输入或全平台证明。
