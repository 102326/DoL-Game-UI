# Soft & Wet / #22 — 当前研发交接

2026-10-21。接手先核对 HEAD、工作区、依赖、实际运行环境和远端 #22；旧快照不代表现在仍在等待球体认可。

## Current — 当前做什么

- 主任务 [#22 全局 UI 特效改造与重做](https://github.com/102326/DoL-Game-UI/issues/22)。负责人已认可球体，并授权继续分批升级、每批完成后在该 Issue 简短更新；不因此关闭总任务。
- 主线已同步到 `6a6e3c00b705dc67d37c1780b27f585847da5d1a`，公开 UI3.0.4 / Host0.1.5-experimental / ModHub兼容1.0.1。研发分支 `prototype/golden-spin-b`，本批基线 `50b491dc0acb3d8af2fc6f18e7d0093dc49140bf`；最终提交与实际 CI 链接见分支 HEAD 和 #22 最新本批更新。
- SW31-MOTION-03 第一批：真实窗口与设置工作区、共享动画隐藏/卸载清理。已认可球体的绘制不变，真实 MotionHub 的独立完整样片保留。窗口视觉与完整 Hub 仍需负责人判断，实际游戏整合尚未完成。
- 源码、受控截图/自制视频随本分支同步；忽略目录中的原始失败、验证输出、node_modules 和本机预览进程不会同步。机器路径写入忽略的 HANDOFF.local.md。

## Decided — 已经确定什么

- 共享取消与偏好能力，各场景保留运动语义；不让整个 UI 使用球体旋转，不恢复旧菜单多圈轨道。设计继续使用3.X基线，游戏业务、事件、存档、Host合同不变。
- 本批设置分类短程方向交接，离场内容 inert；窗口由材质层展开，真实控件保持最终坐标。补充材质层 body zoom 换算，验证80/100/125%；不裁切控件或移动原生业务节点制造通过。
- 共享 sourceMotion 在隐藏页取消，卸载后不重启。旧实现隐藏后仍 running 的反例被拒绝；审阅补充的80%窗口材质坐标反例也先失败。原生回归发现并修复焦点代理重复清理。首次夹具导入/选项字面值、TS可选参数错误只算测试设置问题，保留而不冒充行为反例。
- macOS arm64 / Node24.18.0 / Playwright1.63.0 Chromium 已实际运行原有球体、完整Hub、新窗口检查；类型、UI/Framework合同、真实设置、历史反例与原生窗口定向回归通过。精确命令与最终CI见[本批计划](superpowers/plans/2026-10-21-motion-evolution-batch1.md)和#22。Mac成功不等于Windows/Android/iOS或游戏通过。
- 不新增生产依赖；球体GSAP仍为原型devDependency，窗口复用WAAPI。没有升级正式版本、合并main、创建Tag或替换公开ZIP。本轮授权是研究分支开发/推送与Issue进度。

## Next — 下一步做什么

1. 新设备先安全获取研究分支并 `npm ci`，Mac 首次 `npx playwright install chromium`；执行 `npm run prototype:golden-spin:check`、`npm run ci:check`、`npm run prototype:golden-spin:build`、`npm run prototype:golden-spin:test`。修改真实展示代码还需 Framework 构建与settings-ci、moody-historical-regressions、official-game-motion定向回归。
2. `npm run prototype:golden-spin` 后打开 localhost:5181：`/`已认可球体、`/hub.html`完整Hub、`/windows.html`本批窗口与设置。默认页只含球体，不能用它判断其它入口没有实现。
3. 后续批次处理导航/按钮/结果反馈、商店/衣柜、战斗、天气；按实际交互和成本选择技术，不盲目扩大矩阵或重写所有业务。
4. 实际游戏整合、设备表现与最终视觉验收另外记录；新批次技术绿灯不等于全部UI完工。main合并与正式发行须取得对应授权。

当前没有需要另一设备访问的私人存档或第三方包；自动证据保持受控白名单。不要上传凭据、设备标识、原始设备日志。
