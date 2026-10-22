# EVO-A2 — 导航视觉资源作用域首批

2026-10-23，`dev/evolution-4.0`，输入 `9807e0b93302d9ba4eb4cb87ed7e4f34ac16e0e5`。修复共用历史反例生成器后，继续已批准的 A2 导航资源管理。此批没有正式接入设置、天气或球体原型，也没有改动已认可的动作与速度。

## 实际接线与同步退出

新增内部 `src/ui/visual-scope.ts`，只管理本工程的待执行帧与清理回调，不是新 Runtime、Host API或业务任务队列。相同作用域中的同一布局任务每帧合并一次；释放后禁止重新排帧，已投递的迟到回调不能复活所有者；清理按逆序执行，单项异常不阻止其它资源释放，最终用 AggregateError 报出原错误。

两个实际消费者已接入：

| 消费者 | 资源所有权 | 当批退出的重复路径 |
| --- | --- | --- |
| OrbitFocus | 对齐帧、Resize/Mutation观察器、滚动/resize监听和子sourceMotion清理交给同一作用域；Vue watch继续使用组件生命周期 | 删除局部frame标记、独立request/cancelAnimationFrame及分散的卸载清理；保留异步定位revision和坐标/目标识别 |
| 原生导航 nativeNavigation | 刷新帧、全局发现观察器、分组释放及天气子服务纳入作用域 | 删除局部frame/dead和独立顶层dispose序列；分组仍按原生宿主变化独立恢复节点、属性和Vue实例 |

不是仅新增未使用的helper；两个入口实际调用同一作用域。分组观察器仍在原有 `release` 中断开，由作用域拥有该释放入口，没有为统一而改写原生分组规则。原按钮、事件、租约、天气读取和第三方白名单不变；不声明其它消费者已经迁移。

A3随这两个消费者当批执行，原生回退和明确例外保留。其它布局、sourceMotion内部滚动帧、商店/衣柜/战斗/存档、正式原型接线仍按已批准覆盖表继续，不把此首批写成完整A2/A3或G1通过。

## 针对性验证

Windows / Node26 / Edge：

- `node --test tests/visual-scope.test.cjs`：作用域/peer隔离、排帧合并、已投递迟到回调、释放后排帧、迟到资源立即清理、回调再次排帧、异常时全部清理与重复释放通过。使用受控帧队列检查所有权，不冒充真实帧率。
- `node tests/evolution-orbit.cjs`：真实组件、生产CSS、三档Zoom、带边框display:contents定位、滚动/原事件、减少动态、隐藏与零尺寸恢复通过。卸载后主动投递迟到Resize回调并触发resize，实际观察器与帧计数均为0，未复活焦点节点。
- `node tests/official-game-motion.cjs`：实际官方motion/nativeNavigation组合及原生按钮、侧栏/标题、主开关、减少动态、中断和退出通过。
- `node tests/kraft-work-adapters.cjs`、`node tests/adapter-materials.cjs`：CE原作者/rebuild.30和ModHub、MapleBirch、原版优化等装饰合同、原事件、未知版本/结构回退及清理通过；不是当前所有Mod版本的实机覆盖。
- `node tests/evolution-navigation.cjs`：真实属性/社交＋Framework Host组合通过；`settings-ci.cjs`、`selection-motion.cjs`、`combat-focused.cjs` 对设置、社交/衣柜表现和战斗聚焦的代表性覆盖通过。衣柜夹具不证明实际穿戴业务。
- `node tests/moody-historical-regressions.cjs`：正常实现通过，旧非有限几何和缺生产CSS仍被原错误码拒绝；设置历史正反例保留。
- `node scripts/build-framework.mjs`、`npm run ci:check`通过。新单测接入标准unit清单与研究工作流，焦点资源统计进入既有研究Artifact。

本批宿主验证包含真实Vue组件、正式导航入口和实际Framework Host的受控组合，不是完整游戏/ModLoader或真机。资源观察证明本次关闭清理，没有建立FPS、长期内存或多表面性能结论。没有读取、写入或上传玩家存档。

## 状态与接续

Implemented / Windows Controlled Tested。先核对本批精确源码两套CI；不要拿反例修复提交的成功替代本批结果。CI、源码与后续状态统一更新 [Issue #22](https://github.com/102326/DoL-Game-UI/issues/22) 当前快照。

继续按消费者推进A2与正式原型接线，每项验证后立即退出对应重复路径，并把宿主、输入、资源与必要性能验证放在当批；最后才是完整设备/多Mod回归。设置V2.3、天气C5.2/R10和球体认可不变。无main合并、正式发布、公开版本或Host API修改。
