# EVO-INT-H01：实际 Hub 接线与无实机工程收口

2026-10-23，输入 `d3f04ee4569082d22d30c43dc066a786de1c605d`，分支 `dev/evolution-4.0`。负责人要求先完成暂不需要实机的工作；本批完成认可球体/Hub在研发实际入口的接线、受控回归、构建交付及[G1技术/剩余验收清单](EVO-NONDEVICE-CLOSEOUT.md)。精确最终提交与两套Actions见Issue #22和Git，不把本报告输入HEAD写成输出提交。

## 1. 做了什么

- **EVO-INT-H01 / A2/A3**：实际 `startOfficialHub → MotionHub` 启用 Golden Spin；`src/ui/golden-spin` 成为原型/研发共用实现，原研究文件仅薄导出/样式导入，退出两份实现。设置/Inspector及存档/社交/属性仍走既有directActions和白名单；第三方Host视图及原网格/终态布局保留。作者默认Hub和经典Floating不强制换视觉。
- **EVO-H01-LIFE**：自有绘图/重排帧归visualScope，逐实例拥有GSAP timeline、监听、观察器、DOM和样式恢复；不全局停掉GSAP ticker。保留认可球体绘制、240ms工具落位、650ms收束、0.65球体倍率与中途输入。MotionHub的视觉清理与其它输入/Host清理独立，异常不能跳过其它释放。
- **EVO-H01-GEOM**：修复隐藏时零尺寸除零，以及隐藏期间resize后恢复仍停留屏外的问题。无效测量保留上次有效坐标，根观察器恢复时重新同步；有效坐标恢复当次临时取消位置transition，再恢复普通动画，避免从屏外演出480ms。新检查采样有效恢复后的六帧，不以长sleep掩盖越界。原生框架回退和独立作者入口继续保留。
- **EVO-H01-PREF**：新工具壳遵守已有 `visualGlass`，关闭时为不透明底和无模糊；没有新增玩家设置。关闭动态、减少动态、隐藏与场景变化延续原合同。
- **CJ-3C-H01**：GSAP仍为已锁定3.15.0依赖，无新安装或版本变更；实际UI bundle保留其版权/许可横幅，ZIP声明附来源横幅，独立制品检查器精确核对。GSAP包没有LICENSE*文件，读取其真实源码声明，不能按MIT假定。没有修改Host声明、包版本、成员清单或正式Release。
- **EVO-G1-TECH / CI-HANDOFF-01**：梳理全部批准消费者族、共享实现、六类保留调度边界、现有受控证据与剩余外部验收。更新交接与#22；CI专项继续独立，本批未改工作流、Runner、合并规则或bypass。

## 2. 当前实际入口检查

`tests/evolution-owner-resources.cjs` 沿用原标准/研究CI入口，仍严格检查13个真实根入口销毁及迟到投递后帧/计时器/观察器/全局监听归零，并调用新增 `evolution-hub-integration.cjs`：

1. 实际官方入口出现且仅出现一个认可球体；不会只测原型注入。
2. 移动中的设置工具按下保持当前姿态、一次激活真实设置，并与W01雨天共存。
3. 实际玻璃偏好关闭/开启切换新工具壳的模糊与不透明回退。
4. 白名单原生动作一次、disabled入口提示不执行、独立第三方视图挂载与撤回。
5. 键盘激活/焦点、Escape最新意图、拖动取消、停靠与恢复。
6. 390×844/844×390与80%/125% CSS Zoom，有限坐标、控件命中和无屏外终态。
7. 隐藏/换景、零尺寸、隐藏期间900×700 resize、有效恢复后六帧、减少动态、销毁/迟到/重挂。
8. sphere观察器observe抛错：回到可用经典实际Hub，画布和标记均清理。
9. 观察器构造抛错：已追加canvas仍须清理；不能只保护observe而遗漏构造。
10. disconnect原生完成后抛错：错误可观察，所有自有节点/时钟退出；peer球体的角度及GSAP驱动speed仍变化，避免用停全局ticker制造归零。

这十组是场景组，非十台设备。原生按钮是第一方受控入口，不保存/载入游戏。预览Inspector仅模拟通知，未把它写成真实Inspector业务验收。

## 3. 反例、复核与验证

接线前第一条断言明确失败：实际Hub无认可球体（0≠1），这是目标未接线，不包装成旧产品缺陷。独立复核另发现并实测确认隐藏resize和玻璃偏好两项；修复后复核无新增重要阻断。

新增两项精确负向验证，每项只执行必要场景以限制CI成本：

- `--unsafe-construction` 将实际共用适配器的try恢复到构造器之后，必被“constructor fallback must remove the already appended canvas”拒绝，残留canvas=1。
- `--old-geometry` 固定输入d3f04ee的真实MotionHub，与当前视觉适配器配合，必被屏外边界或NaN原点断言拒绝；不是语法/依赖失败凑反例。

固定d3f04ee组件作为受控夹具保存，SHA256=`7cafc9ef5c93caa53c4c3684757e163e48fcdc42a78f051fd039705e90c2b324`，CI无需额外历史fetch；内容已与原提交逐字节核对。两项由现有owner入口以精确 `assert.rejects` 执行，其它异常不会自动视作反例成功；结果记录注入标识、覆盖源码SHA及当前输入摘要。受控故障结果的FAIL为预期拒绝，不冒充当前正常产品失败。

本机macOS / Node24.18.0 / Chromium153.0.8010.12 / 显式Python3.9.6。执行范围：

- `npm run ci:check`；`node scripts/build-framework.mjs`。
- `node tests/evolution-owner-resources.cjs`：13入口、十组H01当前检查、两项精确拒绝。
- `npm run prototype:golden-spin:test`：原单球、真实Hub、工作区、H1–H4输入与生命周期检查。
- `node tests/settings-ci.cjs`、`node tests/official-game-motion.cjs`：已整合S01/W01和原生输入边界。
- `node --test tests/visual-scope.test.cjs tests/evolution-resource-contract.test.cjs`。
- 先当前源码构建，再 `MOODY_EVIDENCE_ID=hub-h01-final python3 scripts/check-ci-packages.py build` 和同ID的 `python3 scripts/check-ci-packages.py`；八包合同、第二轮实际编译打包、ZIP内容/压缩/元数据与七项负例。

最终执行与Actions结果以#22更新为准；尚未完成的运行不能按已启动记PASS。早期包检查曾正确拒绝旧dist首轮与当前源码重建的差异；另一轮因checker源码变化拒绝过期receipt。已保留失败日志，之后从固定最终源码构建，不能复用旧receipt。新增横幅断言初放在成员存在检查前，使缺entry负例KeyError；现按先基础成员合同、再横幅检查顺序恢复原精确拒绝，未放宽负例。

### 首轮研究CI的既有反例竞争

`7a1ee5b` 的研究push [39905612387](https://github.com/102326/DoL-Game-UI/actions/runs/39905612387)在已有历史检查“controlled close animation must actually be paused”失败，后续消费者/天气研究阶段未执行，不能记通过。失败用例在输入d3f04ee与7a1ee5b完全相同。分类ready并不保证100ms开窗fade完成；透明度仍0时立即关闭可能生成零时长动画，构不成暂停关闭现场。

独立CI分支 `b00226b` 已有同一前置条件修复；本分支仅同步其中三行条件等待：shell透明度为1且没有running/pending动画，再创建stuck关闭。保留暂停断言、150ms内必须拒绝未完成关闭及全部几何负例，不引入固定sleep、不更改产品时长。未同步该分支Runner/receipt/工作流等平台改动。本机完整 `moody-historical-regressions.cjs` 通过；最终精确提交两套CI仍按#22实际结果报告。

本批运行源码仍为7a1ee5b；后续只改此测试前置条件和本段交接说明，原媒体与十组当前/两项精确反例摘要依其20项输入校验继续有效，不伪装成重新录制或设备验收。

## 4. 实际入口原速展示

`node scripts/preview-evolution-hub.mjs`，默认5194。真实研发Hub、设置/天气和Host；无游戏或存档。运行 `node scripts/record-evolution-hub.cjs` 录制1280×900与390×844、DPR1，H1展开、H2收束、H3反向、实际设置及雨天、H4原生单次入口/左移/停靠/恢复。

- [桌面原速](../media/evolution-hub-h01/desktop-1x.mp4) / [窄屏原速](../media/evolution-hub-h01/narrow-1x.mp4)
- [桌面截图](../media/evolution-hub-h01/desktop.png) / [窄屏截图](../media/evolution-hub-h01/narrow.png)
- [实际时间、输入与环境](../media/evolution-hub-h01/result.json) / [媒体摘要](../media/evolution-hub-h01/manifest.json) / [验证与反例摘要](../media/evolution-hub-h01/validation.json)

五项媒体合计1,264,977字节，桌面15.20秒/窄屏14.68秒，20项输入文件摘要重算一致。原速、不剪等待；不是冻结旧新版对照，不替代新一轮负责人视觉裁决。媒体上限12MiB，超限报错，不截断。机器绝对路径和原始日志仅在忽略的本地补充中。

## 5. 未做与剩余关卡

本批为Implemented / Controlled Tested / Integrated（研发官方Hub）；球体及节奏的既有认可保留，实际完整H1–H4与G2裁决仍由负责人决定。雪天、全局其它窗口新天气、实际游戏/ModLoader、多Mod、Android/iOS/Windows目标环境、真触控/系统键盘/选择框、真实缩放和长期并窗性能均未借本片宣布通过。

不等待手机即可补的后续外部事项包括负责人看实际入口演示、准备桌面真实游戏/ModLoader验收材料；它们与实机验证分列。已有ui-runtime诊断版本旧问题仍由CI专项处理；不改公开版本来绕过断言。

没有修改main、Tag、正式ZIP/Release、公开版本、Host/API或远端保护规则；没有自动采集玩家存档。授权存档只能隔离定向复现，不进入公开Artifact。完整剩余任务见[无实机收口清单](EVO-NONDEVICE-CLOSEOUT.md)，不自行宣布G1/G2/G3或Release Ready。
