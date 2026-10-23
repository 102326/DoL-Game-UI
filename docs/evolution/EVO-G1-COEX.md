# EVO-G1-COEX：设置、天气与Hub共存的受控验证

2026-10-23，输入 `afc78bb`＋本轮工作区，分支 `dev/evolution-4.0`。负责人复看当前修复后预览暂未发现问题，允许继续。这只对应本次预览，不替代G1/G2/G3整体裁决。最终提交与两套CI见Issue #22。

## 做了什么

- **EVO-H01-PREVIEW**：预览main和按钮样式限定到场景，真实设置正文不再零宽；120vh改为100dvh。预览根和实际Hub隐藏轨道，保留滚动。原生计数只绑定三个受控按钮。认可外观、设置分类及240/650ms Hub节奏不变。
- **EVO-H01-REGRESSION**：复用现有owner入口，新增旧main选择器精确回注拒绝。正常Hub为11场景组，原13根入口与原三项反例保留，现在共四项反例。矮屏要求实际scrollTop>0且停靠按钮可命中，不能用overflow:hidden制造美观。
- **EVO-G1-COEX**：新增手动命令 `node scripts/check-evolution-coexistence.cjs`，复用真实预览和所有者，没有新Runtime、生产诊断API或默认CI矩阵。1280×900与390×844、DPR1，各12轮Hub→设置→材质/页面→阅读→关闭，各15秒稳定雨天。设置可见时Hub按原规则暂停；这是共存生命周期，不是两个可见窗口叠加。
- **EVO-A2-EMPTY-SCOPE**：诊断发现经典Floating未挂载时额外分配空liveScope；回注旧表达式后，销毁仍有活动空作用域。初值复用根scope，只在实际挂载时创建liveScope，避免无用分配。它未持有帧、监听或观察器，不称作已证明的持续内存泄漏。

## 怎样验证及判读

等待主题启动重试完成、球体idle，并以相同阅读分类比较反复操作后的作用域/清理项/帧/DOM数量。检查单个天气renderer/poll、隐藏停止与恢复、经典Floating实际设置入口、模态卸载/恢复、禁用/重启与最终销毁。销毁后所有插桩作用域必须disposed，帧/清理项为0，等待后不重新取得工作。

Vite插桩保留读取闭包，不做堆内存结论。rAF、天气JS绘图耗时与Long Task只是观测值，不是GPU耗时、真实FPS保证或性能验收阈值。合成document.hidden事件不等同于系统后台调度。输入摘要覆盖UI、Floating、导航/Host与工具，结束时再次核对，变化必须失败。

本机macOS / Node24.18.0 / Chromium153.0.8010.12，执行：

- `npm run ci:check`；`node scripts/build-framework.mjs`。
- `node tests/evolution-owner-resources.cjs`：13入口、11场景组与4项精确拒绝。
- `node scripts/check-evolution-coexistence.cjs`：手动完整观察，结果见[证据摘录](EVO-G1-COEX-EVIDENCE.json)。
- `node scripts/check-evolution-coexistence.cjs --teardown-only --old-floating-placeholder`：聚焦回注旧空初始化，预期被销毁断言拒绝；正常执行不带这些反例标志。

初版诊断曾比较不同分类，以及球体回落/启动3秒重试尚未完成时的快照。这是诊断前置不足，不包装成产品缺陷；未放宽资源阈值。空scope问题独立保留精确回注和正常结果。早期H01移动采样时间窗超时仍保留，本批不宣称修复其竞争。

## 未做和仍待验收

- 旧 `floating-tools.test.cjs` / `floating-boundaries.test.cjs` 因本机缺Edge未启动，且依赖缺失游戏fixture，不计通过。`floating-preferences.test.cjs`通过。新受控经典Floating检查不替代原完整游戏用例。
- 未验证真实游戏/ModLoader、多Mod、存档语义、Windows/Android/iOS/WebView、系统后台、真触控/软键盘/系统select及多小时/多表面并窗性能。24轮和两段15秒不是长期验收。
- 不推广其它窗口天气；雪天、其它材质角色与G1/G2/G3仍待对应裁决。未改CI工作流/Runner/保护规则/版本/Host API，未合并main或发布。

接手先核对HEAD、工作区、未推送内容及依赖。公开摘录不代表本地完整日志已跨机同步；手动命令可重新生成结果。研究push与标准手动分别记录，未执行不计通过。
