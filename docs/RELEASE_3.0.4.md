# Soft & Wet 3.0.4 — P0启动热修复

## 2026-10-21：ModHub 兼容包 1.0.1

- 修复手机 Mod 列表与可用更新提示中的大块空白。
- 同步 ModHub 1.8.0 顶栏的 Kraft Work 材质与按钮颜色。
- 改用 ModHub 原有圆环加载动画，减少安装／更新时的持续布局开销。

已安装 3.0.4 的玩家只需替换 ModHubSoftWet 并重启，主 UI、Host 与其它兼容包无需重复更新。仍支持 ModHub >=1.3.0、UI >=3.0.0，本轮主要验证 ModHub 1.8.0。安装核验仍可能短暂停顿，闪烁的完整原因继续跟踪于 [Issue #20](https://github.com/102326/DoL-Game-UI/issues/20)。

## 原始 3.0.4 更新

**本次关键更新：StoneFreeHost 0.1.5-experimental。只更新 UI 不能修复旧 Host 的启动退出，请务必更新前置。**

修复Host在缺少AbortSignal.any的环境直接退出、主UI没有设置入口的已复现路径。配套StoneFreeHost更新为0.1.5-experimental；使用局部信号合并保留场景与挂载取消，不给浏览器全局打补丁。

UI增加可关闭的启动提示：缺少Host、协议不符、Host停止或初始化失败不再只留控制台告警；Host恢复后提示移除。不会清空数据或执行存读档。

**请同时更新Host和UI两个包。** 只更新UI不能让旧Host在缺少any的环境启动。停用旧同名版本，Host排在UI前，按加载器提示重启；无需清空存档或应用数据。兼容包沿用3.0.3公开冻结版本，原版优化1.0.1、万能手机1.1.0、其它五项1.0.0，不更换同版本字节。

需求保持DoL0.5.12.13、ModLoader>=2.100.0、TweeReplacer>=1.0.0，协议0.1-experimental和Host依赖范围不变。浏览器仍需基础AbortController、MutationObserver等能力；本修复不保证任意旧内核或所有第三方组合兼容。报告者具体环境尚未确认。

负责人按P0授权跳过实机等待直接发布；本次依靠本机受控浏览器、回归、制品合同和CI，不冒充真实Android/iOS/Windows/游戏联合验收。3.0.3和历史Host原包保留供回退。具体运行与摘要见KRAFT_WORK_3.0.4_VALIDATION.md和Release。
