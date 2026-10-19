# Soft & Wet — 跨设备交接

更新：2026-10-20。接手先核对远端 Git、Actions 和 Release，不从历史阶段快照推断当前状态。

## Current — 当前做什么

- 手机设置全局缩放缺陷 #10 已由 [PR #11](https://github.com/102326/DoL-Game-UI/pull/11) 修复并合入 main：8e1785c12dc51c034ac0e2caffe3cf9fb50ef2ea。
- 3.0.2 已正式发布，Tag/main 当时为 cf53c20bde99218bb1cd000b3d5514a6136ec4e8；PR12及其main CI通过，九个附件摘要和重新下载字节核对通过。保留 v3.0.1。
- [Issue #13](https://github.com/102326/DoL-Game-UI/issues/13) 已由 PR #15 合入 main：78889f98343f4b80d8626f6eefb72ab016811054；DolOptimizationSoftWet 1.0.1 与校验清单已更新到既有 v3.0.2 Assets，其余七个运行附件与旧 Tag 保留。主要验证作者 v1.1.2、回归固定 1.1.1.5；详见[兼容验证](OPTIMIZATION_WARDROBE_1.0.1.md)。设备后续安装已核对加载身份。
- 当前本地分支 fix/wardrobe-wear-ripple-position，处理 [Issue #16](https://github.com/102326/DoL-Game-UI/issues/16)：叠穿管理区增高时，固定在屏幕上的穿戴波纹相对衣物列表向上错位。改为列表本地坐标并换算缩放，保留原波纹和业务。80%／100%／125% 缩放、内外滚动、单次原事件、连续点击和清理定向检查通过；Android 同场景相对偏移由约 138px 降至不足 1px。测试修正版已安装并核对正式入口及成员摘要；当前测试穿搭通过原存读接口恢复。源码未推送，未替换公开 UI，负责人视觉验收待确认。
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

1. 等待本地穿戴波纹修复的负责人试用意见；本轮仅本地构建、定向回归和 Android 程序点击复验，不冒充物理触控或新的云端 CI。该回归已接入浏览器检查清单。
2. 后续源码推送与主 UI 发行另按明确授权处理，不以同版本测试包替换冻结公开附件。保留首次测试包入口错误及原存读序列化字段顺序比较失败记录；正式入口重新构建、成员集合检查及对象语义比较分别证明修正结果。
3. 未覆盖设备和特殊游戏／Mod 业务留作后续证据；不扩大本次补丁范围。所有后续 UI 设计沿用 3.X。

本地原始截图、设备标识、第三方包和失败日志不公开，机器路径仅放忽略的 HANDOFF.local.md。不得把 CI／受控浏览器结论写成物理输入或全平台证明。
