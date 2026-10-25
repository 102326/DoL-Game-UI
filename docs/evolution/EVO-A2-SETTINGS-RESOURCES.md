# EVO-A2 — 共享动效与设置布局资源迁移

2026-10-23，`dev/evolution-4.0`，输入 `98936442f11899e97aea49595ffda580f4af923b`。本批继续已批准的 A2/A3，沿用导航批次的内部 `visualScope`。没有改变已认可的设置、天气或球体视觉，也没有接入这些隔离原型。

## 实际改动

| 消费者 | 共同所有权与当批退出的路径 |
| --- | --- |
| `sourceMotion` | 滚动轮询帧、开关观察器和环境监听纳入作用域；动画与装饰代理仍按真实节点管理，由作用域调用原取消入口释放。删除独立 RAF ID 管理、disposed 标记和逐项 dispose 序列。保留单节点取消、同所有者其它节点、peer、WAAPI、原生滚动和回调语义。 |
| `SettingsPanel` | 布局测量帧、Resize/Mutation 观察器、两个子动效所有者和过渡标记纳入组件作用域；删除局部 layoutFrame 与独立卸载清理序列。异步布局继续使用 revision，并检查作用域有效性。关闭中的窗口不提交测量结果。 |

`visualScope.cancelFrame(task)` 只取消当前所有者的一个帧任务。已取消、被替代或已释放的投递不能执行，也不能删除替代任务。它是内部呈现原语，不改变 Framework Host API，不调度或结算游戏操作。

受控反例读取输入提交的真实 `source-motion.ts`：取消后手动投递旧回调，原实现留下3个排队帧，当前实现为预期的2个。断言精确拒绝额外轮询，未放宽容差。此证据检验迟到回调防护，不宣称正常浏览器每次取消都会发生这一投递。

## 验证

Windows / Node26 / Edge，当前工作树：

- `node --test tests/visual-scope.test.cjs`：所有者隔离、取消后重新排帧、迟到回调不能执行或删除替代帧、完整异常清理通过。
- `node tests/source-motion-lifecycle.cjs`：实际 sourceMotion 的同节点替换、单节点取消、peer 独立、目标脱离、代理与监听/观察器/帧释放通过。帧队列受控，滚动提交在夹具内设为即时，不作为原生平滑滚动或性能证据。
- `node tests/source-motion-lifecycle.cjs --baseline`：旧源码被 `cancelled delivery cannot queue a second arrival loop` 断言拒绝（3不等于2）。正常版本通过。JSON及原始失败日志保存在本地忽略的 `tests/artifacts/evolution/`。
- `node tests/game-first-motion.cjs`：真实浏览器平滑滚动只完成最新请求，原节点/单次事件、非交互代理、resize、关闭动态及系统减少动态后的取消通过。沿用原测试，只把硬编码Edge改为已有跨平台浏览器选项，并接入两套CI。
- `node tests/settings-ci.cjs`：实际设置控制器/组件的双布局、长内容滚动、背景输入阻挡、键盘、连续分类、偏好重挂载及Zoom通过。卸载前主动排入实际测量帧；卸载后及重新投递旧Resize回调后，帧和workspace观察器均为0。
- `evolution-orbit.cjs`、`evolution-navigation.cjs`、`official-game-motion.cjs`、`selection-motion.cjs`、`combat-focused.cjs`、`header-weather.cjs`通过真实组件/原生导航/Framework Host的受控回归。`wardrobe-wear-motion.cjs`、`shop-ripple-motion.cjs`通过原生回调和表现清理；不替代完整穿戴或购买业务验收。
- `moody-historical-regressions.cjs`通过正常控制与原有历史错误精确拒绝。`npm run ci:check`、`npm run build`、`node scripts/build-framework.mjs`通过。

新生命周期测试和原生滚动测试接入标准浏览器套件及研究工作流，设置清理断言进入现有设置套件；研究Artifact保存两项资源JSON。首次构造旧源码反例时误用了esbuild同步插件API，夹具在加载前失败；已改用同库异步API。该报错日志保留，未计为历史缺陷拒绝证据。

追加设置资源JSON后的复验曾因先运行UI build清空dist而缺少Framework生产CSS，在读取样式前失败；重建Framework后同一检查通过。这是本机准备顺序问题，未修改断言或产品代码。

## 状态与下一步

Implemented / Windows Controlled Tested；推送后的精确提交和完整CI状态见 [Issue #22](https://github.com/102326/DoL-Game-UI/issues/22)。本批A3已随两个消费者退出对应重复路径；不把使用sourceMotion的每个页面都计为完成整体迁移。

正式设置开关仍300/220ms和原代理，分类仍原实现；已认可V2.3的100/80ms与V2.2分类尚未正式接线。正式天气及球体整合、其它消费者A2/A3、真实游戏/ModLoader和设备回归继续按覆盖表推进。当前资源计数不证明FPS、长期内存或全局G1/G2/G3通过。无main合并、发布或私人存档操作。
