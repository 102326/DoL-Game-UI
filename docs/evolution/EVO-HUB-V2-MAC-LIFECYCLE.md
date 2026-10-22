# EVO-HUB-V2-MAC — 跨设备同步与生命周期补强

2026-10-22，`dev/evolution-4.0`。本机从 `5a656c6` 开工，发现 Windows 已推送 `21509a89b20f43bec4798b370f31fc6c63d59b69` 后安全快进，以它作为本批最终输入。精确交付提交与云端结果见 [Issue #22](https://github.com/102326/DoL-Game-UI/issues/22) 的本批记录。Implemented / macOS Controlled Tested；完整 Hub 视觉、生产整合与 G1/G2/G3 均未据此通过。

## 做了什么

| 编号 | 实际交付 |
| --- | --- |
| EVO-SYNC-01 | 保留 Windows 的唯一 V2 适配器、原生键盘聚焦、样式所有权恢复、输入测试和媒体；本机独立替代方案保存到本地 `research/mac-hub-v2-alternative` / `5ed6569`，未推送、未采用，不作为当前验收结果 |
| EVO-HUB-V2-RELEASE | 工具按下后移到球体上松开：原球体会阻止 pointerup 冒泡，原 window 监听因而漏收，菜单停在按住状态。释放监听改用捕获阶段，取消或松开均退出 press；原组件事件只执行原生路径，不重放业务 |
| EVO-HUB-V2-HIDDEN | 隐藏后场景失效，新创建的菜单与球体时间线也必须暂停。沿用现有 holdInput 入口统一 hidden / 无效尺寸 / reduced 判断；球体新增 owner pause，wake 同时保护 document.hidden。可见后按最新逻辑状态接续 |
| EVO-HUB-V2-ZERO | 根节点宽高为零时暂停两层时钟，禁止以零 scale 写入变换；球体跳过极小尺寸 resize/draw，避免 Canvas 负半径。恢复尺寸后由真实布局重新测量，原工具可以再次激活 |
| CJ-3B / EVO-HUB-V2-REGRESSION | 新增三组真实组件回归，并加入既有研究测试命令。`--baseline` 只替换 Vite 加载的固定旧适配器和球体模块，不覆盖工作树；缺 Git 对象不能算有效负例 |
| CI-HANDOFF-01 | 更新交接、Mac 受控证据和 #22 当前 CI 事实；保留 Windows 媒体的原始源码身份 |

未改真实 `MotionHub.vue`、工具排序/终态布局、Host/API/公开版本、设置 V2.3 或天气 C5.2/R10。球体绘制正文除极小尺寸 guard 外与输入相同，play/recover 的阶段代码逐字一致；没有调节视觉材质、运动轨迹或演出时长。V0 历史摘要不回写。当前球体源码有明确的生命周期增量，不能再称整个球体文件与 V0 字节相同。

## 实际验证与证据

macOS / Node 24.18.0 / Playwright Chromium 153.0.8010.12：

- `node tests/golden-spin-hub-lifecycle.cjs --baseline`：固定 `21509a8` 三项均 FAIL，非零退出。释放停住、隐藏替换后 q 继续变化、零尺寸后 q 继续变化均被实际拒绝；失败现场另包含零尺寸 Canvas 报错。
- `node tests/golden-spin-hub-lifecycle.cjs`：三项 PASS；核对捕获释放无业务重放、隐藏时 q/速度/能量/角度/绘制均停止、零尺寸安全恢复且真实入口再次激活。
- 原有 `npm run prototype:golden-spin:test` 四套入口：球体 5、完整 Hub 6、窗口 5、输入 8，共 24 项通过。新增三项单独通过后，命令已追加生命周期入口；最终 CI 将直接执行全部 27 项。
- `npm run prototype:golden-spin:check`、`npm run prototype:golden-spin:build`、`npm run ci:check`：通过。研究产物仍是开发网页，不是安装包或 Release。
- [公开受控摘要](../media/evolution-hub-v2/lifecycle-mac.json)：固定负例与修复正例、实际环境及逐文件摘要；不含本机绝对路径或大段原始日志。原日志/截图保留在 Git 忽略目录。
- 独立只读复核发现上述边界后，先复现再修复；最终复核及最终提交云端结果见 #22，不将已启动或未完成的 Run 写成通过。

跨设备旧提交 CI 已重新核对：`21509a8` 的 [研究 push 39795026297](https://github.com/102326/DoL-Game-UI/actions/runs/39795026297) 成功；[标准手动 39795032787](https://github.com/102326/DoL-Game-UI/actions/runs/39795032787) 的 validate 超时取消、moody-gate 失败。浏览器安装消耗约 11 分钟，浏览器阶段未完成，不能复用为整轮通过，也不据此判定产品断言失败。后续 Run 另按实际源码与结论记录。

## 媒体、未做与接续

Windows [桌面](../media/evolution-hub-v2/hub-input-v2-desktop.mp4) / [窄屏](../media/evolution-hub-v2/hub-input-v2-narrow.mp4) 原速媒体及 manifest 保持原样，六个媒体文件重算摘要一致；它们属于 `21509a8` 的历史输入演示，不冒充本批修复后的精确录制。本批未采用本机独立替代方案的原速对照，也未重录或覆盖这些媒体。

当前操作页为 `npm run prototype:golden-spin` 后的 `/hub.html`，真实组件、模拟业务正文，无玩家存档。完整 Hub 视觉/手感仍需负责人确认；本机检查不代替 Windows 新修复、Android/iOS/WebView、真实游戏/多Mod、长期多表面性能。没有生产接入、main 合并、发布、规则/bypass 调整或存档操作。

下一步优先处理最终提交 CI 的真实失败；随后等待本批 Hub 视觉反馈，同时按已批准 P0 消费者表继续 A2/A3。天气、设置原型认可与本批交互技术结果分别保留，不能直接标为全量 Integrated 或 Release Ready。
