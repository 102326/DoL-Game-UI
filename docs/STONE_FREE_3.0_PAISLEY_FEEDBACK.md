# Paisley Park 6.1：Stone Free 首轮开发使用反馈

2026-10-16，仅记录本轮真实使用。没有修改工具包，也没有重新跑工具全套验收。

## 使用路径

已安装 Skill 的 resolver 定位到本机 6.1.0 White Snake；使用其 CLI help、Doctor 和 Environment。真实 UI 验证需要精确读取三个原数值、临时加载自己刚构建的资源以及保证清理，所以按 DEVELOPMENT_FLOW 的出口调用已有 `execution-context.cjs`，显式绑定设备/App/PID/Document，以 CDP 完成只读对照、自有按钮点击和截图。源码、Vue 类型检查、Vite、ZIP 和浏览器反例仍使用 UI 项目工具链。

普通只读和自有 UI 操作没有建立 Goal 或使用 Gameplay；没有修改 Store、处理历史 Unknown 或重放业务效果。步骤较短、数据相关断言很具体，所以本轮没录 Journey，也没调用 Full Evidence、Perfetto、bugreport。当前项目报告能关联输入资源、结果和清理，未因形式完整增加采集。

## 通用经验与归属

| 实际情况 | 判断与适合保留的经验 |
| --- | --- |
| 首次 Doctor 的 ADB 为 ENOENT，但 Android CLI 可用 | 环境 PATH 问题。Skill 已给出临时 DOL_ADB 的现有 SDK 路径出口，足以解决；不需要工具安装或自动修复。 |
| 零尺寸宿主包含可见的固定定位按钮，Playwright 对宿主的 visible 等待失败 | 项目测试选择错误。布局诊断应区分根节点矩形与真实交互节点；失败不直接等于按钮不可见，也不应自动 force-click。 |
| 真实游戏新上下文中，原生年龄窗口让自有根 aria-hidden | 原版正常交互边界。DOM/截图才确认原因，不能把“包已加载”“节点存在”当作可操作，不能为完成调试绕过窗口。 |
| 平板原值显示一字段缺失 | 项目适配器字段写错，已有原状态服务可核对。现场帮助暴露错误，但不因此记为 Tools 或原游戏问题。 |
| CLI 顶层提示 GameVersion Mod 为 unknown，但 StartConfig 来源可用 | 按来源读取 Environment JSON，保留两种元数据来源；不是游戏版本不存在的证明，也不使用包装 App 版本替代。当前文档已解释，不提出 Runtime 改造。 |

建议 **P1**：如果将来完善通用 UI 诊断提示，可以用本轮“宿主零尺寸/子控件可见”的例子说明，先检查真实 hitbox 和 overlay，再判断点击失败。是指引候选，不是已证实实现缺陷。

建议 **P2**：继续保持 Standard CLI 优先和直接 CDP 的明确出口。本轮没有重复造 CDP 绑定器，复用了现有绑定/释放；不必把每个投影断言强行改成通用 Journey。

## 只留在 UI 项目

`DoLUiHost` 的实验协议、三个状态字段、源码配方、官方 Drawer API v1 的接法及各原型资源摘要均属项目知识，不建议写入通用 Skill。没有证明这一套是其它项目应复制的架构。

## Coverage 与结论

物理手机、真实 IME、多设备、其它 Provider、正式持久安装、真实 Gameplay 及完整跨 Passage 生命周期不属于本次 Tools 使用证明。它们不会自动变成工具开发任务。未发现明确的 Paisley Park 实现缺陷；这轮有帮助的主要是安装定位、环境分层和精确的真实文档绑定。没有量化通用速度或成本收益。

以上为反馈和候选建议，不请求在工具项目自动开工。
