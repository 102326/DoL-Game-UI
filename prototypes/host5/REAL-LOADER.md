# 5.0 原型在发行 Loader 中的接入

Windows Chrome 157.0.8103.79，独立临时 Profile，DoL 0.5.12.13、Loader 2.101.1。固定发行 HTML 为 64,576,232 字节，SHA-256 为 `9ecc02d91e481054bed564a4fe1975dd5c2e38edc051e9fac350ae5bebe282a5`。正文只挂载这一份 HTML。该环境适合查导入、脚本和真实交互，未测全部游戏图片或帧时。

## #41 · 工作台和观测台

用原生 Loader GUI 的文件导入方法导入原 ZIP，整页重载，从 Loader 回读实际顺序、版本、声明依赖和包内文件摘要。基础发行页自带 23 个包，以下每组都核实未加载 DoLGameUI。各包精确 SHA-256 固定在[复验入口](run-real-loader.mts)。

| 实际安装组合（依次接在发行包之后） | 真实操作和观察 |
| --- | --- |
| Host、工作台、天气能力、观测台 | 工作台直接挂载一份天气画面，另一份由观测台挂载。点雨再点雪，两块画布均显示雪状态。关闭回焦入口，重开仍是雪，再关闭后天气挂载数为零、Host 错误数为零。 |
| 卸载观测台、重载，保留 Host、工作台、天气能力 | 观测台控件消失。剩下的一块画布仍可拖动、关闭和重开。 |
| 重新导入观测台、卸载原工作台并重载 | 天气能力和观测台视图仍注册。此时没有展示入口，玩家不能单独打开观测台。 |
| 在上一组合加入替代工作台并重载 | 从「侧边工作台」打开，两块画布恢复，雨雪切换、关闭回焦、重开和清理均通过。观测台可随展示入口迁移。 |

实际包版本和核对的文件数为 StoneFreeHost 0.1.5-experimental（4）、StoneFreeWorkspace 0.1.4-experimental（6）、Host5Atmosphere 0.1.0-prototype（5）、Host5Observatory 0.1.0-prototype（4）。替代入口为 StoneFreeAlternateWorkspace 0.1.4-experimental。在基线 `0d128b9`，原工作台直接关闭对话框，只验到关闭后重开。天气由预览命令驱动。

### 关闭中途重开

研究工作台使用 [Host 消费端过渡工具](../../framework/motion/reversible-transition.ts)。组件仍负责打开原生 dialog、决定哪些元素能响应快捷键、持有场景 binding 和模态认领。首次打开时挂载视图，进场与退场共用一条 180 ms 的 WAAPI 时间线。点击关闭后，原按钮变为「重新打开」，焦点留在窗口内；点击它或按工作台的 K 会从当前画面反向。Escape 始终请求关闭。到达退场终点才关闭 dialog、释放临时视图及模态认领，并在焦点仍在窗口内时归还入口或先前控件。切页失效、主动释放工作区和卸载直接结束这一代。常驻入口、区域与快捷键由原有所有者保留。

Windows 复用了上述同一份发行 HTML、独立 Chrome Profile、发行 Host、天气提供者和观测台。原生导入新 StoneFreeWorkspace 后重载，从 Loader 回读了工作台全部六个文件。包仍为研究版 0.1.4-experimental，以 SHA-256 `21b1349c2411edc756277dd22c0b365b3dee39d2daabffd50743ac99f46a3a19` 区别于前次包。在复验入口的最新文档绑定上执行 `reversal` 即可单跑此项。

- 真实键盘 K 在退场中重新打开。随后在同一动画的 65、115、75、105 ms 四个位置逐次点击按钮，方向依次为负、正、负、正。翻转瞬间时间、计算透明度与位移连续，dialog、画布节点及 Host 挂载身份相同。这四个时间是测试指定的播放位置。
- 最终 Escape 后，全部挂载和认领列表恢复到打开前，焦点回到入口。系统减少动态、退出中改为减少动态、单独屏蔽该 dialog 的 animate 方法时均到达正确终态。
- Windows Edge 的工作台定向回归另验了主工作台与替代工作台协商、场景立即失效、卸载与布局偏好。旧用例曾在按下 Escape 后立刻操作背景，此时退场仍在进行；用例现等待原生 dialog 关闭再检查原有焦点与背景行为。真实 Loader 的反向采样针对主工作台，未测 Android、屏幕实际呈现耗时或视觉偏好。

## #42 · 真实游戏侧栏与原作者 CE

单独导入原作者 Cheat Extended 1.20.4 后，启动被它自己的缺少 MapleBirch 提示挡住。验证侧栏时先导入 MapleBirch 5.6.2，再导入 CE 并重载，两包分别在位置 27、28（从 0 起计），核对了 151、103 个文件。没有使用云存档或账户。

在真实游戏文档内将侧栏布局原型挂到已启动的发行 Host 上。该原型通过诊断入口注入，尚未作为独立侧栏 ZIP 导入。真实 StoryCaption 原文已含 CE 的条件宏。点击原生链接从 Start2 经 Orphanage Intro 到 Bedroom，侧栏与折叠按钮对象保持，原生收起和展开正常。在卧室另行聚焦 CE「作弊拓展」，启用布局后按钮和焦点保持。两次点击执行其自带处理函数，状态翻转后恢复；撤回布局时仍是 CE 当时的按钮，焦点保留，原型的挂载和认领数均回到零。

该配置实际显示的是 CE 状态栏按钮。另一个由设置控制的 CE 菜单图标没有出现，其弹窗未验。rebuild.30 的中性证据仍见[侧栏研究](sidebar/README.md)，本次真实混装使用原作者版。

### Android · 接管、切页与撤回

M367FC，Lyra 独立测试副本 0.5.12.13，已装 StoneFreeHost 0.1.5-experimental、DoLGameUI 4.5.1 和 MapleBirch 5.6.2。通过原生 Loader 临时导入原作者 CE 1.20.4（ZIP SHA-256 `980ba672661b0171923343dd03a242670fd3553208438355b5270e101ab8e134`）。侧栏使用 `d4ccc13` 的 [createSidebar](sidebar/sidebar.ts)，在实际文档内调用现有 Host。按钮使用 WebView 注入触摸。

| 观察点 | 接管前 | 接管中 | 撤回后 |
| --- | --- | --- | --- |
| 原生折叠按钮 | 折叠、展开 | 折叠、展开 | 折叠、展开 |
| CE 状态按钮，两次点击 | 0 → 1 → 0 | 0 → 1 → 0 | 0 → 1 → 0 |
| 侧栏正文左内边距（CSS px） | 24 | 12 | 24 |
| 本原型的挂载 / 区域认领 | 0 / 0 | 1 / 1 | 0 / 0 |

从 Start2 的原生「继续」进入 Orphanage Intro。只在这次切页收到一次 `:passageend`，实际 StoryCaption 的 `processText` 和 CE 的 `CEstatebox.handler` 各执行一次。接管和撤回两步的增量均为零。侧栏根节点与折叠按钮保持原对象，撤回后接管标记消失。观察计数仅覆盖上述调用。复测时在页面内临时包装这两个原函数，转发原参数、返回值和异常，在结束时恢复。首次检查把 CE 按钮引用记在 CE 自身的两次操作之前，比较失败；改在每次接管或撤回的紧前、紧后取引用，两次均保持同一按钮。

独立副本原有 CE 为 rebuild.30。临时切换前后比对原包字节（SHA-256 `92db93acb221731334d72ef0922adf5c5f777550f621f09cc51b609236b91e89`）及 15 项侧载顺序。还原后再次启动，实际加载的版本回到 1.20.3.1-rebuild.30，核对原摘要和顺序一致，平板已返回桌面。该副本实际装入的 UI 主脚本 `index.js` SHA-256 为 `74b7cee661420171637e29cbda58f32774639006a4c5374b7152efcb63c74732`，与平板 TTF 候选的 `5138d79bba9aa536b8be13d60b0a425dc8c8c13ef4970678bb2f09e5b083e6af` 不同，因此未从 Lyra 选取字体。未安装测试 APK 或复制临时字体。

## 复验顺序

1. 在仓库根目录使用 Paisley Park 的 `pc-start`，指定上述 HTML、独立输出目录 `tests/artifacts/host5-real-loader/<本轮目录>`、本地 HTTP 端口 19753 和新建的自有 Chrome Profile。保留工具生成的绑定记录。只连接这台测试浏览器。
2. 以 `node prototypes/host5/run-real-loader.mts <绑定记录> <操作> [参数]` 驱动。先用 `import` 按表中顺序提供 ZIP 路径，执行 `reload` 后用 `pc-bind` 为新文档生成绑定。等 Loader 完成启动，用 `verify` 传入该组 ZIP，再用 `workspace both` 走原工作台双视图。两个研究 ZIP 可按[分包说明](workspace-weather/README.md)生成。
3. `remove Host5Observatory`、重载、重新绑定及核对后运行 `workspace direct`。重新导入观测台并移除 `StoneFreeWorkspace`，重载检查视图注册与展示入口。再导入替代工作台、重载、核验并执行 `workspace alternate`。
4. 按依赖顺序装好 MapleBirch、CE，重载和重新绑定。通过原生界面到达 Start2 后，给 `sidebar` 传入两个实际可见的 passage 链接选择器（依次指向 Orphanage Intro 和 Bedroom）。在卧室再执行无参数 `sidebar` 检查 CE 按钮。所有检查完成后用 `stop` 关闭自有 Chrome，并核对该 Profile 进程和 HTTP 监听已释放。

本轮实测结束后，独立实例正常退出，Profile 所属 Chrome 进程和 19753 监听均为零。
