# EVO-A1：属性＋社交共享导航首片

2026-10-22。Implemented / Controlled Tested；**不是G1完成，也不是实际游戏Integrated**。

两个正式入口仍为src/characteristics/main.ts和src/social/main.ts，均调用同一`src/ui/native-overlay-navigation.ts`。共同承担overlay/正文发现、Host claim/mount事务、Vue创建释放、observer/RAF、偏好、失败恢复、原生滚动定位、世代/最新意图失效。消费者保留分组、组件、专属CSS、属性卡片接力和社交局部高亮，没有万能WindowShell或新Host API。

## 实际修复与退出

- 基线baf0d48的实际属性消费者在隐藏后仍持有区域租约，受控测试以`characteristics: leaseReleased`正确失败。社交基线也存在独立租约释放路径漂移；没有伪称已独立执行旧社交的同一负例。
- 共享release现在同时释放Vue、Host mount/claim、自有导航、滚动任务与装饰，并保留原生正文/事件。claim先于DOM修改；争用后可显式refresh恢复；mount失败进入原生fallback，重新启用可恢复；owner退出不重挂。
- 两端统一把物理矩形差换成滚动容器CSS坐标，保留16 CSS px标签余量。属性固定层接力经共同adapter换算body Zoom，不改全局sourceMotion或其它消费者。
- 两个旧main中独立的挂载/observer/租约/偏好/调度/失败恢复基础代码已经删除，保留薄配置与专属演出。不是在旧代码旁新增未使用模块。

[本机受控结果](../media/evolution-weather-r1/navigation.json)及[源码/媒体摘要](../media/evolution-weather-r1/manifest.json)记录本轮实测工作树；干净提交身份以对应CI为准。

## 实际验证

`node tests/evolution-navigation.cjs`使用真实Vue组件、真实Host和真实生产CSS，在两个消费者分别检查隐藏/重挂、租约争用、overlay替换、owner退出、controlled mount failure/恢复、经典无Host路径、原节点身份/原事件单次、快速切换后取消、无关DOM变动不扫描，以及Zoom 1 / 1.25 / .85。

两端运行记录均输出implementation=`native-overlay-navigation/v1`，各自consumer身份不同。最后一次本机滚动标签余量：属性15.61/20.28/13.59px，社交15.52/19.67/13.45px，对照目标16/20/13.6px，容差3px；属性真实接力层在生产CSS及1.25倍Zoom下定位通过。

排查保留：社交组件没有属性组件的data-section属性，测试改为真实按钮标签；固定层测试最初遗漏生产CSS造成错误静态定位，现加载实际官方样式。采样定位到缓动后的0.78关键帧，而非把墙钟78%当关键帧。没有通过改UI属性或扩大几何容差消除这些夹具错误。

本机类型/Framework构建、既有设置及天气回归见[P0首报](EVO-P0-REPORT.md)。CI加入现有Moody浏览器suite，研究工作流也运行该检查并白名单保留navigation.json。不将隔离夹具称真实游戏/Windows/Android验收；完整游戏section语义、设备原生输入和第三方混合运行仍须G3。

## 剩余边界

全局sourceMotion的其它固定代理、不同宿主和属性争用尚未迁移；不能拿本adapter的局部换算宣布全局坐标已统一。更多消费者按[P0矩阵](EVO-P0-COVERAGE.md)确认后再推广。没有更改已认可设置V2.3或球体外观。
