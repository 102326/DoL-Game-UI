# Soft & Wet — 跨设备交接

更新：2026-10-20。接手先核对远端 Git、Actions 和 Release，不从历史阶段快照推断当前状态。

## Current — 当前做什么

- 手机设置全局缩放缺陷 #10 已由 [PR #11](https://github.com/102326/DoL-Game-UI/pull/11) 修复并合入 main：8e1785c12dc51c034ac0e2caffe3cf9fb50ef2ea。
- 3.0.2 已正式发布，Tag/main 当时为 cf53c20bde99218bb1cd000b3d5514a6136ec4e8；PR12及其main CI通过，九个附件摘要和重新下载字节核对通过。保留 v3.0.1。
- [Issue #13](https://github.com/102326/DoL-Game-UI/issues/13) 已由 PR #15 合入 main：78889f98343f4b80d8626f6eefb72ab016811054；DolOptimizationSoftWet 1.0.1 与校验清单已更新到既有 v3.0.2 Assets，其余七个运行附件与旧 Tag 保留。主要验证作者 v1.1.2、回归固定 1.1.1.5；详见[兼容验证](OPTIMIZATION_WARDROBE_1.0.1.md)。设备后续安装已核对加载身份。
- 当前分支 fix/wardrobe-wear-ripple-position，准备 3.0.3 正式补丁。负责人已批准公开发布；[Issue #16](https://github.com/102326/DoL-Game-UI/issues/16) 在技术验证后以 completed 关闭。实现 `566f748` 改为列表本地坐标并换算缩放，保留原波纹和业务。80%／100%／125% 缩放、内外滚动、单次原事件、连续点击和清理通过；Android 同场景相对偏移由约 138px 降至不足 1px。正式候选只在该实现上更新产品版本和文档，发行范围见[3.0.3 说明](RELEASE_3.0.3.md)与[验证记录](KRAFT_WORK_3.0.3_VALIDATION.md)。最终发布状态以远端回读为准。
- 万能手机兼容已由独立任务发布 SmartPhoneSoftWet 1.1.0 到 v3.0.2，关联 Issue #14 已关闭；源码固定在独立分支提交 de95ad4a2ae2fc62b04690e062ab4c2e889dfe23，未合入 main。本轮仅原样沿用公开 ZIP，保留衣柜入口隐藏限制，不覆盖其改动或删除独立分支。

## Decided — 已经确定什么

- 所有现行 UI 设计统一使用 [3.X 基线](VISUAL_BASELINE_3X.md)，1.X／2.X 设计封存，不再作为运行主题或设计来源。保留原游戏回退与配置迁移。
- DoLGameUI 正式候选 3.0.3；Host 0.1.4-experimental，协议 0.1-experimental，UI 依赖 >=0.1.2-experimental 且 <0.2.0。原版优化兼容包沿用 1.0.1，万能手机沿用 1.1.0，其余五包沿用 1.0.0；逐项使用 3.0.2 当前冻结附件，不重新打包同版本负载。3.0.2 保留供回退。
- 修复 PR [Run39283083644](https://github.com/102326/DoL-Game-UI/actions/runs/39283083644) 与 main [Run39287583419](https://github.com/102326/DoL-Game-UI/actions/runs/39287583419) 的 validate、moody-gate 均通过，App15368；两提交树一致。
- 当前独立 CI 规则要求 validate、moody-gate，strict=true、无 bypass；原 jijizi 更新锁保留。仅在所需 CI 已成功后使用原有管理员维护权限合并，不修改规则或跳过失败检查。
- 实际 Android 17 / WebView 155 复现并复验全局缩放；Windows 受控测试覆盖两方向、输入、长内容及清理。合成触控不是物理手指验收，真实 iOS 与报告者原配置 Unknown。详细条件见验证说明。
- 3.0.2 运行逻辑与手机已验证候选相同，仅产品版本字符串不同，CSS／早期脚本／Twee／声明／许可证相同。正式 ZIP 不冒充已在手机安装。
- Windows 包合同反例夹具的默认编码问题已改为 UTF-8；保留失败，不弱化断言。旧构建回执拒绝仍有效。
- 源码仓库保留既有 Moody Blues CI 与协作成果。之前 CJ-3A/B/C/D、CJ-4 的历史记录见对应专项文档；它们不代替本轮精确输入和环境证明。

## Next — 下一步做什么

1. 完成 3.0.3 最终源码、合同、制品摘要和精确 CI 核对后，按本次授权合入 main，创建 v3.0.3 正式 Release；不改写旧 Tag 或接管独立万能手机任务。
2. 核对九个运行 ZIP 与校验清单共十个玩家附件及下载回读；内部身份与验证报告只留在源码中。保留首次测试包入口错误及原存读字段顺序比较失败记录，不用更改口径隐藏失败。
3. 未覆盖设备和特殊游戏／Mod 业务留作后续证据；不扩大本次补丁范围。所有后续 UI 设计沿用 3.X。

本地原始截图、设备标识、第三方包和失败日志不公开，机器路径仅放忽略的 HANDOFF.local.md。不得把 CI／受控浏览器结论写成物理输入或全平台证明。
