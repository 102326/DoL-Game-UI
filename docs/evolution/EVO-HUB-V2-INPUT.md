# EVO-HUB-V2-INPUT — 悬浮球演出中的真实输入

2026-10-22，分支 `dev/evolution-4.0`，输入 `5a656c602cdf5d9bf569ba9364ee46f5475e5c66`。本批推进已批准的 V2 / H1–H4，修复隔离 Hub 演出期间整段禁用工具的旧策略。精确提交和最终 CI 见 [Issue #22](https://github.com/102326/DoL-Game-UI/issues/22) 本批记录。

## 实际变化

### 2026-10-23 已确认的展开速度

负责人在本地 `/hub.html` 试用后确认“就按这个速度”。本次先合入另一台电脑的生命周期修复 `c014cbb1dcc393dca4f00c97da97ae69d0121c8d`，再整理以下调整：

- 菜单取消原1060ms蓄势等待，点击后立即开始展开，完整展开时长240ms。中途反向仍从当前进度接续。
- 球体通过既有 `configure({duration:.65})` 缩短演出35%，与菜单并行；金属表面、光轨、强度和真实工具布局保留。恢复或重新创建球体时使用同一倍率；独立球体页不改速。
- 菜单关闭时长仍为650ms；减少动态、关闭动画、输入保持、后台暂停和零尺寸保护沿用。
- 回归断言改为检查菜单在球体蓄势期间已经展开、可见工具已经可操作；旧“等待球体期间必须禁用”的断言不再适用。首次旧断言失败记录保留本地，没有产品异常被隐藏。

最终组合在 Windows / Edge 上通过：`node tests/golden-spin-hub.cjs` 六组、`node tests/golden-spin-hub-input.cjs` 八组、`node tests/golden-spin-hub-lifecycle.cjs` 三组，以及 `npm run prototype:golden-spin:check` 和 `npm run prototype:golden-spin:build`。这是本次源代码组合的本机证据，云端CI另按精确提交核对。Mac输入 `c014cbb` 的[研究CI](https://github.com/102326/DoL-Game-UI/actions/runs/39802074961)与[标准CI](https://github.com/102326/DoL-Game-UI/actions/runs/39801939839)均已核对成功，不能代替本次提交的CI。

本次认可仅覆盖隔离Hub的展开节奏。下面的V2输入记录和媒体保留原始身份；旧录像仍为 `21509a8` 的1060ms等待/850ms展开，不代表当前240ms效果。本次未重录媒体，也未修改旧manifest或旧验证结果。当前效果请运行源码查看。

接续：拉取 `dev/evolution-4.0`，运行 `npm ci`、`npm run prototype:golden-spin`，打开 `/hub.html`。默认端口5181；若被占用可用 `npm run prototype:golden-spin -- --port 5182`。没有生产接入、main合并或发布；实际游戏和手机真机仍未验证。

### 2026-10-22 V2 输入首批记录

- **V2-INPUT**：工具达到可辨识的展开位置后即可点击或聚焦，不再等待整个时间线完成。完全隐藏或仍挤在球心的控件不接收输入；收束时沿用原组件的 `inert` 语义，球体仍可接受反向。
- **V2-PRESS / FOCUS**：按下工具或键盘聚焦时暂停当前菜单姿态，球体保留自己的旋转余韵；松开、取消或移开焦点后按最新意图接续。原组件直接处理点击、详情、返回及关闭，不排队、不克隆按钮、不重放业务事件。
- **V2-LIFETIME**：拖动期间不再因每次位置变更反复重启球体收束；工具移除、减少动态、动画总开关、隐藏/恢复、场景失效及卸载有明确释放。撤销装饰时恢复原内联属性与优先级，保留后来被外部接管的值。
- **V2-EXIT**：原型唯一生效路径退出“moving 时一律 pointer-events:none / tabindex=-1”；没有另留一个可启用的旧锁定模式。冻结旧提交只用于负例，不是第二份正式实现。

保持原工具、排序、最终网格/工具带、点击与 Host 合同。没有改动 `sphere.ts` 的球体外观与演出、正式 MotionHub 组件、设置 V2.3、Acrylic 或生产天气读取；六份受保护文件的 LF 正文摘要与 V0 相同。V0 的旧 Hub 适配器摘要作为历史输入保留，本次被明确授权的 V2 改动不回写成旧基线通过。

这是隔离真实组件原型，尚未在正式 `startOfficialHub` 中启用。不宣称全量 A2/A3、G1/G2/G3 或生产交付完成。

## 观看与复现

![悬浮球展开途中按下真实工具](../media/evolution-hub-v2/hub-input-v2-desktop-input.png)

- [桌面原速演示](../media/evolution-hub-v2/hub-input-v2-desktop.mp4)
- [390px 窄屏原速演示](../media/evolution-hub-v2/hub-input-v2-narrow.mp4)
- [结果摘要](../media/evolution-hub-v2/validation.json) / [源码、受保护输入与媒体摘要](../media/evolution-hub-v2/manifest.json)

运行 `npm run prototype:golden-spin` 后打开 `http://127.0.0.1:5181/hub.html`。录像展示 H1 展开、H2 收束、H3 中途真实点击/键盘/反向/拖动、H4 停靠与正常使用；保留等待与原始播放速度，没有剪辑或变速。工具按钮和 Host 是真实组件，详情文字与场景是第一方模拟，不读取玩家存档。

## 验证与失败记录

Windows / Node26.12 / Edge：

- `node tests/golden-spin-hub-input.cjs --baseline` 在固定旧适配器上实际失败：可见工具 `pointer-events:none`、`tabindex=-1`、真实点击未命中，原生激活计数为 0。只替换测试服务器加载的适配器模块，不覆盖工作树。浅克隆需先取得上述固定提交；缺 Git 对象不是有效反例。
- `node tests/golden-spin-hub-input.cjs` 八组检查通过：真实指针单次激活且原节点不变、按下姿态稳定、移出松开取消且继续展开、键盘激活/取消、连续反向与终态布局、拖动/停靠、窄屏中途模拟触控与125%缩放、活动时关闭动画/减少动态、隐藏/恢复、场景与owner退出、重新挂载。
- 既有球体和 Hub 检查通过。窗口工作区首次因 Mac 风格 `/@fs` 拼接在 Windows 下无法加载模块而失败；只修正测试 URL 斜线后，原五组断言通过，没有改窗口实现或放宽门槛。失败 JSON/截图保留本地忽略目录。
- `npm run prototype:golden-spin:check`、`npm run prototype:golden-spin:build`、`npm run ci:check` 通过。新增输入检查纳入既有研究命令与白名单 Artifact；不替换原检查名称。云端结果按最终提交另核对，不将本机通过写成 CI 通过。

录制时的 Windows 源码为 CRLF，Git 按现有 `.gitattributes` 规范化为 LF；manifest 同时记录实际工作树与 LF 正文摘要。媒体来源未因换行差异冒充逐字节相同；球体等冻结输入以 LF 正文及 Git diff 核对，代码语义没有变化。

## 当前状态与接续

Implemented / Windows Controlled Tested；本批完整 Hub 的视觉与手感等待负责人确认。球体、设置及天气的既有认可各自保留，不自动延伸为本批或整个 4.0 的认可。

没有生产整合、main 合并、公开版本/API变化或发布。实际游戏、Android/iOS/WebView、多Mod、Mac本机及多表面长期性能尚未覆盖；不把390px模拟触控称为真机。后续继续已批准 A2/A3 消费者迁移，Hub 的生产接入需连同正式宿主、偏好和退出路径单独验证。
