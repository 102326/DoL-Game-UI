# Soft & Wet — 跨设备交接

更新：2026-10-20。接手先核对远端 Git、Actions 和 Release，不从历史阶段快照推断当前状态。

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
