# Soft & Wet 4.5 跨设备交接

2026-11-18，公司 Mac 交接已由 Windows 在现有4.5分支接续。本批先处理指导修正和中性Hub工程试点。

## Current — 从哪里接手

- 研发分支 `feature/4.5-diamond-glass-hub`，目标分支 `main`，[PR #38](https://github.com/102326/DoL-Game-UI/pull/38) 为 Draft。Windows经正常fetch从交接头 `1f1df13e047c344874e392296434ab8068d9edb7` 接续，最后一个改动产品运行代码的提交仍为 `fd35a737a4add0cf7f6c7f482e8021075f47e927`。本批修改指导与针对性回归，不重复实施下面五批成果。
- 研发版本为 4.5.0，已发布的稳定版为 4.2.0。当前入口为蓝灰菱形玻璃，支持自由拖放和主动停靠。设置支持五种颜色和本机字体的预览、保存及恢复默认外观。架构取舍见[4.5 研发记录](RELEASE_4.5.0.md)，既有外观见[视觉基线](VISUAL_BASELINE_4X.md)。
- **公司 Mac 独有、未提交**：`scripts/build-standalone-surfaces.mjs`、`tests/standalone-surfaces.cjs` 已原样保留。它们不在远端交付中。忽略目录里的截图、原始日志及设计转交包也只在本机；跨设备验证可使用下表的 Actions 证据。
- **设计偏好待定**：负责人目前偏向Claude的C方案，希望中心整体更大；尚未定稿。原稿身份、已转达描述及正式文件缺口见[4.5研发记录](RELEASE_4.5.0.md#2026-11-18-windows-c参考准备)。核对原源码和截图后再改变正式外观，不能按描述声称已对齐。
- **范围更新**：4.5不再为万能手机Mod扩大兼容开发。已有历史包及共享合同不在本批删除范围。

## Decided — 五批代码与证据

各行链接都是该行提交实际触发并成功完成的 PR 检查。Mac 本地使用 Node 26 和中性 Chromium 夹具；第五批环境为 Node 26.13.0、Chromium 153.0.8010.12。

| 批次及提交 | 本机实际验证 | 证据边界 | GitHub Actions |
| --- | --- | --- | --- |
| 1 · 字体偏好 `3728e9f` | 设置 7 项及设置回退回归。字体、字号保存后，受测的存档和侧栏布局回调均为 0 次；另测调用方字体、旧键与写入失败重试。 | 未测绘制耗时或设备帧率。 | [标准](https://github.com/102326/DoL-Game-UI/actions/runs/44266684096) · [研究](https://github.com/102326/DoL-Game-UI/actions/runs/44266684075) |
| 2 · 页面请求值 `af83a1f` | 总开关与 13 项页面选择归入统一存储。设置 8 项及回退回归覆盖模块缺席、忙态拒绝且零写入、失败后保留选择、同值重试与应急恢复。 | 衣柜忙态由受控接口注入。 | [标准](https://github.com/102326/DoL-Game-UI/actions/runs/44272630005) · [研究](https://github.com/102326/DoL-Game-UI/actions/runs/44272630283) |
| 3 · 共享控件 `ddc26d9` | 设置 9 项、Hub 13 项含 48 组布局。覆盖自有与原生设置、Hub 和 ModHub 安装弹窗。检验 150% 缩放、标签换行及未接管按钮的原生内边距。 | `80acbae` 曾在 [Linux 长标签检查](https://github.com/102326/DoL-Game-UI/actions/runs/44279224938)失败。最终提交改为按文字实际高度排版；48 组布局为模拟视口。 | [标准](https://github.com/102326/DoL-Game-UI/actions/runs/44282056756) · [研究](https://github.com/102326/DoL-Game-UI/actions/runs/44282056787) |
| 4 · ModHub `5629be5` | 设置 10 项、Hub 13 项。主窗、工具菜单、恢复弹窗共 12 组记录，安装弹窗另行回归。通过实际 UI Runtime 识别并退出；工具菜单使用留存的原生键盘和关闭函数。 | 安装与恢复业务使用无副作用替身，未操作真实包。 | [标准](https://github.com/102326/DoL-Game-UI/actions/runs/44288997942) · [研究](https://github.com/102326/DoL-Game-UI/actions/runs/44288997834) |
| 5 · 衣柜 `fd35a73` | 设置与窗口集成 11 项、独立详情抽屉、Hub 13 项含 48 组布局。主窗、抽屉和参照面板覆盖 1280×800／390×360、100%／150%，验证字体恢复、滚动、点击、回焦、原节点返还及场景退出清理。 | 使用中性服饰与纯色占位图。真实换装、库存操作、人物渲染及 Ray 美化的衣柜显示问题待家庭设备验收。 | [标准](https://github.com/102326/DoL-Game-UI/actions/runs/44296142892) · [研究](https://github.com/102326/DoL-Game-UI/actions/runs/44296142241) |

设置的请求值和页面运行状态分别查询，忙态、故障重试及原版回退继续由各页面决定。外部调用见 [UI Runtime](UI_RUNTIME.md#产品偏好查询)。Host 公共协议、正式发行、保护规则及 bypass 均沿用既有安排。

## Windows工程试点

`UI45_WINDOWS_RESUME_20261118_C_PILOT` 仅处理一次。保留Mac两份未同步文件的缺失状态，不生成替代文件。仓库指导已移除过时的4.2优先级约束，并区分现行实现、Claude参考与用户待定偏好。

新增回归复用 `tests/evolution-hub-integration.cts`：从真实Canvas像素检查中心与按钮中心一致，绘制层不拦截输入；覆盖自由悬浮、绘制表面尺寸变化、停靠与恢复。一次初始检查在关闭动画未完成时过早断言静止，失败现场保留；修正为等待现有关闭完成状态，不降低静止或命中要求。该检查不等同于C造型实现或视觉验收。

Windows本批使用Node 26.13.0与本机Edge 158.0.4370.26的中性页面。工具链严格类型检查与生成、Framework构建、Hub 14项检查及其中48组布局通过；新增绘制检查覆盖四种状态。Expected Lock只新增该检查并更新源码身份，原断言与反例保留。PR检查由本批推送触发，具体状态从[PR #38 Checks](https://github.com/102326/DoL-Game-UI/pull/38/checks)按提交核对，不以Mac旧成功代签。

本批没有运行真实游戏、设备或包安装，也没有视觉定稿、main合并或发布。正式原稿不可读仍是采用C前的具体输入缺口；不影响本批工程回归完成。

## Next — 当前小批之后

1. 接续时先检查状态与唯一工作树，再正常fetch并以当前远端头核对，避免与其它机器双写。继续使用同一4.5分支，不在旧main叠改或创建重复工作区。
2. 核对本机 Node 26、锁定依赖、浏览器和实际加载的 UI／Host／兼容包版本。需要复算时，在锁定依赖就绪后依次运行 `npm run ci:check`、`node scripts/build-framework.mjs`、`node tests/evolution-settings-integration.cjs`、`node tests/wardrobe-details-drawer.cjs`、`node tests/evolution-hub-integration.cjs`。本地证据由各脚本生成。
3. Windows、Android WebView、原生选择器与触控、真实多 Mod 加载及渲染仍待验。针对 Ray 美化，优先在相同配置下比较侧栏完整画面与衣柜预览，记录包版本、视口和复现步骤。实际安装、恢复及库存业务的验收另需安全样本。
4. C造型实施前先从正式可读原文件核对实际源码和截图；再沿现有Hub实现可回退小步，协调放大中心星与菱线。商店、战斗窗口保留为后续候选，Host扩展仍属调查，不自动扩成下一批。视觉定稿与发布仍需负责人安排。
