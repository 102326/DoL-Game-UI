# Soft & Wet 4.1 — 跨设备当前交接

更新：2026-10-27。总跟踪 Issue #31，顺序 **7→6→5→3→2→1→4→8→9**，第9项必要检查贯穿各批。前置性能快照见[旧交接](HANDOFF-2026-10-26-perf41-before-ui765.md)，不另建路线图。

## Current — 当前状态

- 分支 `feature/4.1-ui-material-hub`；材质 `ee36aaf`、居中 `699a7a2`、共享选择框/HC-07 `3554456`、ModHub hybrid研究 `f1beec5`、菜单响应 `557f9f7`、picker Escape `76afc72`。文档提交HEAD以实际Git为准。已推送前置源码0ede042且双手动CI成功；后来新增76afc72 Escape修复，最终双CI准备执行，不能沿用前置绿色结果。
- [UI报告](evolution/EVO-4.1-UI-765-2026-10-27.md)：负责人已通过60%材质/居中排版，默认仍60%/左对齐。材质仅review标记启用，未全局推广。新共享原生选择框及取消半秒等待的菜单响应已本机验证，**尚待负责人体验**。
- 正式版本仍4.0.1 / main `ff428b4`；未改版本、Tag、Release、Host API、保护/bypass。ModHub候选是评审patch，未改vendor/兼容包运行代码，未安装到游戏。
- 预览：`node scripts/preview-ui41.mjs`，默认5204；先锁定Node26依赖、tooling:build与Framework构建。服务不随Git跨机。本地绝对路径与原始公开目录仅在忽略目录/`HANDOFF.local.md`，另一设备不可假定可访问。

## Decided — 已确定与证据

1. V1 ZIP身份与174负载摘要已核对；通透度低档中性灰、默认60%原V1平衡、100%回到4.0.1透底条件。正文/窗口opacity不变，保存/默认/关玻璃及双布局保留。旧50%证据是历史，不覆盖。
2. 设置撤销compactStats且保留false读值；手机紧凑/宽幅正文保留。高级实验继续安全默认/回退，不无条件开启。扇形外五＋内三无公共背板，网格有面板；菜单正常空间相对球心居中，边界避让。
3. 天气C1合写减少记录却耗时更高，已撤回归档；C2保守碰撞预筛保留，模型/像素等价，仅有小幅受控收益。旧A1无时间收益、A2小幅受控收益和大目录负结果均保留，不冒充真实游戏收益。
4. [ModHub B3](evolution/EVO-4.1-MODHUB-B3-2026-10-27.md)：target/lazy/union历史正负结果不变；新增原预算1024/256内B2、预算外union组合。196等价、缓存路由/淘汰/清空、完整闭包6类迟到变化及同摘要公开145项对照通过。400合成热10次原/B2/hybrid114.25/115.90/76.80ms；公开145项热整批97.90/46.25/45.05ms。仅算法计时，未实际安装。原始公开JSON不在Git，换机复算必须核对输入摘要。
5. EVO41-UI-SELECT-01：原select渐进美化覆盖8类自有/完全匹配ModHub结构，44px选项、深灰展开、长文本/禁用。未支持引擎保留系统选择器及dark提示；排除multiple/size/未知第三方。320/1100结构合同与实际设置4组排版/输入/保存恢复通过，不能据此宣称Android/Windows弹层已验收。
6. HC-07：根退出逐阶段隔离、幂等、原顺序和所有权恢复；旧实现先实际失败，修复后12场景通过。测试插桩观察root内部AggregateError；真实connect仍固定警告。只证明故障后其它阶段继续，不能证明失败阶段内部任意中途泄漏都修复，更不保证任意同步ready立即重入成功。
7. EVO41-HUB-RESPONSE-01：原V1与旧当前均500ms等待＋240ms展开/650ms收起。新候选并行开始、240ms展开/220ms收起，反向按剩余距离最低60ms；球体回旋不变。8项Hub/8输入/3生命周期、12项集成/48布局通过。指针q=.821494、键盘q=.717312时确为moving+paused；未以已完成动画假证暂停。待负责人体验。
8. 76afc72补齐实际picker Escape：设置和layout兼容窗口路径先在旧入口超时失败，修复后第一次收picker、第二次正常关窗/原生overlay；商店实际组件同样保留详情后再关闭。没有改变Host/第三方业务或backbutton协议。见[补充收据](evolution/ui41-mac-20261027/escape-receipt.json)。
9. 本机macOS arm64 / Node26.12.1 / Playwright1.63.0 / Chromium153.0.8010.12。ci:check、Framework实际构建、startup/connect、居中与上述Hub套件通过；两个新helper纳入composed源声明锁。首次npm framework:build因缺`python`命令退出127，已单独用python3完成打包；不记为该npm命令成功。源码、命令、范围及独立审查见[本机收据](evolution/ui41-mac-20261027/receipt.json)。

## Next — 下一步

1. 接手先核对branch/HEAD/工作区、领先落后、Node26及锁定依赖、实际浏览器；不覆盖本机未推送工作，不把旧dev/main当本批。双手动CI完成后更新本页的准确SHA/Run/Attempt与下载复核。
2. 负责人体验新菜单响应与深色选择框；保留已通过的默认60%/左对齐。材质跨窗口推广按消费者验证，不以新控件样式替代整体视觉裁决。
3. **回家优先**：核对真实游戏/Loader/完整ModHub及实际归一化catalog；按同操作交错对照列表/统计/异步变化、窗口/焦点/原版天气、多Mod业务与回退。只有实际证据支持才决定安装组合候选或内置实验策略。
4. Android/WebView真机触控/软键盘/系统选择框/旋转/安全区与玻璃GPU总体性能；Windows原生弹层另测。Actions与Mac通过都不替代这些检查；无需为收口补所有未持有设备。
5. Host其余HC候选仍为调查，CJ-4规则另行批准；不自动合并main、不发布4.1、不改真实业务或存档。
