# Soft & Wet — 跨设备交接

更新：2026-10-20。接手先核对远端 Git、Actions 和 Release，不从历史阶段快照推断当前状态。

## Current — 当前做什么

- 手机设置全局缩放缺陷 #10 已由 [PR #11](https://github.com/102326/DoL-Game-UI/pull/11) 修复并合入 main：8e1785c12dc51c034ac0e2caffe3cf9fb50ef2ea。
- 3.0.2 已正式发布，Tag/main 当时为 cf53c20bde99218bb1cd000b3d5514a6136ec4e8；PR12及其main CI通过，九个附件摘要和重新下载字节核对通过。保留 v3.0.1。
- 当前分支 fix/optimization-wardrobe-layering，处理 [Issue #13](https://github.com/102326/DoL-Game-UI/issues/13)。DolOptimizationSoftWet 1.0.1 接入原版优化叠穿管理，主要验证作者最新 v1.1.2、回归固定 1.1.1.5；详见[兼容验证](OPTIMIZATION_WARDROBE_1.0.1.md)。负责人授权通过后更新既有 v3.0.2 Assets 的该包与校验清单，不替换主 UI／Host／其它包或旧 Tag。实际发布状态以远端回读为准。
- 万能手机兼容在独立对话／独立工作区并行，关联 Issue #14；不覆盖其改动，不把本项的 Assets 授权扩大为该项发布授权。

## Decided — 已经确定什么

- 所有现行 UI 设计统一使用 [3.X 基线](VISUAL_BASELINE_3X.md)，1.X／2.X 设计封存，不再作为运行主题或设计来源。保留原游戏回退与配置迁移。
- DoLGameUI 3.0.2；Host 0.1.4-experimental，协议 0.1-experimental，UI 依赖 >=0.1.2-experimental 且 <0.2.0。原版优化兼容包本次前进到 1.0.1，其余五包保持 1.0.0；不使用重新打包字节覆盖沿用的同版本附件。最初3.0.2身份快照与后续兼容更新记录分开。
- 修复 PR [Run39283083644](https://github.com/102326/DoL-Game-UI/actions/runs/39283083644) 与 main [Run39287583419](https://github.com/102326/DoL-Game-UI/actions/runs/39287583419) 的 validate、moody-gate 均通过，App15368；两提交树一致。
- 当前独立 CI 规则要求 validate、moody-gate，strict=true、无 bypass；原 jijizi 更新锁保留。仅在所需 CI 已成功后使用原有管理员维护权限合并，不修改规则或跳过失败检查。
- 实际 Android 17 / WebView 155 复现并复验全局缩放；Windows 受控测试覆盖两方向、输入、长内容及清理。合成触控不是物理手指验收，真实 iOS 与报告者原配置 Unknown。详细条件见验证说明。
- 3.0.2 运行逻辑与手机已验证候选相同，仅产品版本字符串不同，CSS／早期脚本／Twee／声明／许可证相同。正式 ZIP 不冒充已在手机安装。
- Windows 包合同反例夹具的默认编码问题已改为 UTF-8；保留失败，不弱化断言。旧构建回执拒绝仍有效。
- 源码仓库保留既有 Moody Blues CI 与协作成果。之前 CJ-3A/B/C/D、CJ-4 的历史记录见对应专项文档；它们不代替本轮精确输入和环境证明。

## Next — 下一步做什么

1. 回读当前兼容 PR 与 main 的实际 CI；必要检查失败先诊断，不反复重跑至绿。Windows 符号链接权限失败不通过改断言掩盖，云端单独核对。
2. 授权范围内核对新增兼容包与校验清单后更新既有 3.0.2；若已经更新先读回，不重复覆盖或重新生成同版本包。
3. 未覆盖设备和特殊游戏／Mod 业务留作后续证据；不扩大本次补丁范围。所有后续 UI 设计沿用 3.X。

本地原始截图、设备标识、第三方包和失败日志不公开，机器路径仅放忽略的 HANDOFF.local.md。不得把 CI／受控浏览器结论写成物理输入或全平台证明。
