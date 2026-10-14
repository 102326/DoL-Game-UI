# Paisley Park：2.7 收口实用反馈

2026-10-15；工具实际为本地 4.0.1，未改工具仓库。只记录本轮新增经验，早前服装店反馈继续保留，不重新采证。

本轮使用标准 CDP transport 做 scoped DOM、Computed Style、节点身份和命中检查，显式 ADB 绑定 user/package/PID/socket/Document，并用 Android CLI 截图查看真实画面。原生旋转和任务小窗口使用 ADB；没有把模拟视口当作实际手机或分屏。

## 值得反馈的两点

1. **超时文案需标明命令。** 手机横屏的截图路径没有返回；`cdp.cjs` 的通用 `send()` 超时均显示 `CDP evaluation timeout`，容易误以为 Runtime.evaluate 卡住。分离截图与 DOM 后，DOM/触控可正常完成，Android CLI 截图也正常。截图根因仍 Unknown；建议错误包含原 method，不将其推断成 UI/Runtime/Provider 缺陷。这是通用提示候选，不授权改工具。
2. **旋转/窗口观察适合分步骤留证。** 原来把旋转、多个采样与 finally 恢复放在一次项目探针中，失败时完整结果没返回，只有部分图片和错误。原生切换后重新绑定再观察更容易保留边界；只有复用频繁时再整理成 Journey，不为本轮重新建设工作流。项目还应保证 UI 清理失败不会阻止原生配置恢复。

## 归属与不扩张

- 悬浮菜单被战斗栏遮挡是 UI 项目真实回归，已在项目修正；不是 Tools 缺陷。
- 首帧尚处于动画中属于采样时机，需等待目标状态，不凭首帧推断样式损坏。
- `am task` 无子命令的帮助尝试被拒，改读 `am help` 后按已支持的 freeform/resize 执行；这是调用方式问题。Android CLI 安装版本的 `layout --diff` 文档与 help 有差异，本轮未使用该选项，不将它记成运行缺陷。
- 2.7 的类名、退役偏好、原控件布局和旧 Lyra 私有接口限制只留在 UI 文档，不塞进通用 Skill。
- 未用 GER、Journey、Full Evidence、Perfetto 或 bugreport：本轮无需业务目标、重复长路径或性能调查。额外设备与 Mod 组合为 coverage，不自动升级成当前任务。

建议优先级：先让超时错误包含 method；分阶段留证作为 Skill/项目配方提示；其它候选只登记。没有发现需要重构 Runtime 或 Provider 的证据。
