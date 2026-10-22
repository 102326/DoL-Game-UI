# EVO-A2 — 导航焦点坐标与反向检查收敛

2026-10-23，分支 `dev/evolution-4.0`，输入 `5b028d0bc5fc9de2e0245d22a925a47b6c325286`。本批继续已批准的 OrbitFocus 消费者迁移，保留当前悬浮球速度和各页面视觉动作；不是全量 A2/A3 完成。

## 导航焦点实际修改

`src/ui/OrbitFocus.vue` 的迁移起点原本没有扣除定位容器边框，而终点扣除了。使用带12px边框、`display:contents` 导航和真实组件复现时，起点由 `(32,32)` 跳到 `(44,44)`。固定输入的 `node tests/evolution-orbit.cjs --baseline` 因这个12px偏移失败，不是缺依赖或页面未加载失败。

起点和终点现在都使用 `src/ui/navigation-geometry.ts` 的 `navigationRect`，同一处处理 CSS Zoom、滚动、边框、有限数值与有效尺寸。已有 `navigationScrollTop` 的跳转余量语义保留。组件每次定位先递增失效编号，隐藏或无效目标会取消迁移动画并隐藏焦点，旧的 `nextTick` 不得重新启动它。

保留原580ms迁移、SVG光圈、圆角、按钮节点和原生事件。没有新增管理框架、Host API或依赖；当前只收敛坐标和待执行定位失效，组件与 sourceMotion 的其它资源管理仍需按原覆盖表继续，不宣称已完成通用作用域迁移。

## 研究 CI 失败与检查修正

输入提交的[标准 CI39812927308](https://github.com/102326/DoL-Game-UI/actions/runs/39812927308)成功，[研究 CI39812905053](https://github.com/102326/DoL-Game-UI/actions/runs/39812905053)在快速反向的进度差断言失败。旧检查分两次通过驱动读取状态，中间再发点击；240ms展开时，正常时间推进会被混入跳变。

受控复现中，90ms驱动间隔的进度差为0.710332；同一浏览器任务内，原按钮点击前后进度差为0。新增共用测试探针 `tests/hub-reversal-probe.cjs` 在真实按钮的 `click()` 和原类名观察器处理之间采样。两套检查都改用该探针，进度容差由0.30/0.25收紧至0.015，同时实际检查球体角度连续。原有真实鼠标、键盘、取消和单次业务事件检查保留，不把程序点击称作真实指针输入。

只在测试服务器注入“关闭时进度归零”的故障，探针观察到0.213699跳变并被现有门槛拒绝。原CI失败、受控复现及故障记录保留本地；不通过重跑旧检查直到绿色掩盖问题。悬浮球适配器、240ms展开和0.65倍球体时长没有因此改动。

## 验证与接续

Windows / Node26 / Edge受控检查：

- `node tests/evolution-orbit.cjs`：真实组件在1、1.25、0.85倍Zoom的迁移起点/终点对齐，滚动、单次原生点击、减少动态、隐藏/零尺寸恢复、待执行定位卸载通过。
- `node tests/evolution-navigation.cjs`：属性和社交两端通过。
- `node tests/evolution-panels.cjs`：日志、特质、统计、成就、作弊、选项六类通过。
- `node tests/settings-ci.cjs`、`node tests/selection-motion.cjs`、`node tests/combat-focused.cjs`：设置控制器、社交/衣柜选择表现和战斗聚焦受控检查通过；衣柜夹具不证明实际穿戴业务。
- `node scripts/build-framework.mjs`、`npm run ci:check`通过。新增焦点检查纳入标准浏览器清单、研究工作流和研究结果Artifact；最终提交云端结果另记 #22。
- `npm run prototype:golden-spin:test` 单独运行时五套入口、27项全部通过。此前与其它Vite测试并行时，输入套件首项等待超时，失败采样未取得控制器状态；当时多个服务器共用优化缓存，疑似发生页面重载，但根因未确认。保留该失败，不把一次隔离通过称为并行运行问题已修复；当前CI仍按既有方式串行执行这五套入口。
- `node --test tests/ci-evidence.test.cjs tests/test-workflow.test.cjs`：工作流选择检查通过；证据测试在 Windows 创建文件符号链接时报 `EPERM`，本机未通过。没有改权限、删断言或将该项记为PASS，Linux CI另核对。
- 本机没有Ruby，`check-ci-gate.rb` 与 `check-github-collaboration.rb` 未能启动；它们保留在标准Linux工作流，不为本次任务安装系统依赖或绕过检查。
- 旧 `tests/settings-orbit.cjs` 依赖本机不存在的 `tests/fixture.html`，在加载前失败；不当作有效产品反例。使用现有自包含 `settings-ci.cjs` 和新焦点夹具验证，没有补造或提交私人游戏夹具。

焦点夹具首轮遗漏正式导航类、并使用了另一Vue导入入口，导致等待超时；修正为正式类与同源Vue模块后，才取得上述固定源码12px反例。基础设施失败与产品失败分开记录。

当前状态：Implemented / Windows Controlled Tested。新受控结果输出到 `tests/artifacts/evolution/orbit.json`，固定反例输出 `orbit-baseline.json`。这些目录由Git忽略；CI上传白名单结果，不依赖另一设备拥有本机原始文件。无main合并、正式发布、玩家存档或第三方业务操作；实际游戏、Android/iOS和长期多表面表现未验证。下一批继续覆盖表中尚未迁移的自有资源与作用域，不再重调已确认速度。
