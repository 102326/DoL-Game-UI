# Soft & Wet — 跨设备交接

更新：2026-10-20。接手必须先核对本机 HEAD、工作区、依赖、运行环境和远端状态。

## Current — 当前做什么

- [Issue #18](https://github.com/102326/DoL-Game-UI/issues/18) P0：官方 Host/UI 无反应。基线 main/v3.0.3 `450e86042fb5ca2d419d251cfc66a1044c730999`；分支 `fix/startup-host-compat`，本快照写入时尚未提交/推送，HEAD 仍为基线。提交、PR、main 与 Release 的最终身份以远端及交付报告为准。
- 实现 Host 局部取消信号合并，移除 `AbortSignal.any` 强制依赖；UI 增加可关闭启动诊断。准备正式 UI 3.0.4 + Host 0.1.5-experimental，负责人已授权修复并发布、跳过实机等待。
- 报告者实际环境 Unknown；不把一个已复现路径当成所有报告的最终归因。本机证据目录/原始失败日志只在忽略的 HANDOFF.local.md 记录，另一台设备不能假定可访问。

## Decided — 已经确定什么

- 保留 3.X 设计、原游戏事件与存档业务。协议 0.1-experimental、Host 依赖 >=0.1.2-experimental 且 <0.2.0 不变。只改 Host 的后续发行只升 Host；本次 UI 有诊断功能变更，故升 3.0.4。
- macOS 受控复现先对旧构建失败，修复后八启动场景、两种取消及清理通过；类型与 14 个单元/源码脚本通过。精确包与 CI 结果关联 [3.0.4 验证](KRAFT_WORK_3.0.4_VALIDATION.md)及最终交付报告。初次 Host README 版本格式合同失败保留并修正，不冒充首次全绿。
- 七个可选兼容包沿用 3.0.3 公开冻结字节：原版优化 1.0.1、万能手机 1.1.0、其余五包 1.0.0。万能手机源码固定独立分支 `de95ad4a2ae2fc62b04690e062ab4c2e889dfe23`，本轮不合并、不重打同版本包。只上传两个新包加七个冻结 ZIP 和校验清单。
- CI 规则要求 validate、moody-gate，strict=true、无 bypass；原 jijizi 更新锁与维护权限保留。只能在实际所需 CI 成功后维护合并，不调整规则或跳过失败检查。
- 自动证据继续受控白名单；主动授权的存档只能隔离复现，不自动公开 CI Artifact。本轮无需存档。旧 Release/Tag 不改写。

## Next — 下一步做什么

1. 完成本轮最终包合同、共享 Framework 回归、静态审阅和真实 PR CI；通过后按已获授权合并，取得 main CI 后创建 v3.0.4 Release，回读九个 ZIP 和 SHA256 清单。
2. 用具体提交、Run、附件摘要更新 Issue #18 和本地完整报告；实机跳过必须保持明确，等待报告者反馈后再判断其原问题是否完全消失。
3. 新设备先查实际 Git 与 Release，不把本快照的“准备”理解为已发布。macOS/Actions 通过均不等于 Windows、Android、iOS 真机或原游戏业务通过。

后续每次交接更新 Current/Decided/Next，不提交凭据、设备标识或大段原始日志。机器绝对路径写入 Git 忽略的 HANDOFF.local.md。
