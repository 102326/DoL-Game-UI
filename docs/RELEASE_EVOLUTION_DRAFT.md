# Soft & Wet 4.0 — Evolution

> 发布正文草稿，更新2026-10-25。正式版本文件4.0.0已从源码4ebe0bb实际构建，两套CI、下载制品核对及Android最小装机复验通过，尚未公开发行。当前顶栏方案与披露的性能尾帧已获接受；最终九包见[正式版本准备清单](evolution/EVO-4.0.0-PACKAGES-2026-10-25.json)。

Evolution 继续使用 Soft & Wet 的黑灰 Acrylic 风格，重点改进窗口、焦点和悬浮工具的动态表现，并整理它们在缩放、滚动和快速切换时的行为。

## 本次变化

### 更有力量感的 Floating Hub

金属球体通过加速回旋、表面纹理与运动残影带出工具菜单。球体先响应，菜单留出一段特效时间后展开；关闭时工具与背景一起收束。原有拖动、停靠和快捷工具继续保留。

### 设置与环境材质

上下、左右两种布局共用真实控件和偏好。窗口快速开合，分类内容保持连贯转场；设置窗口接入新的玻璃雨珠、降雨和雪天霜羽效果。天气来自游戏内部，不使用现实天气服务。

设置玻璃还响应血月、异世界、极热与严寒：红色月面和云影、紫色流云、暖热雾与冷雾结晶可与原有雨雪共存。雨中血月保留普通雨滴。设置普通雨珠集中覆盖标题、布局选择和横向分类区，底部渐隐；尺寸、流速和背景折射保留。新模型当前用于设置窗口，其它已适配窗口保留现有天气表现，并修复雨幕动画在ModHub等窗口造成的持续重绘卡顿。雨量、雨滴和材质效果保留。

### 更稳定的导航与窗口

角色窗口的焦点位置适应滚动和缩放。修复窄屏战斗底栏偏移、关闭窗口后的残留背景，以及衣柜离开时的一条失效刷新路径。游戏原有操作、数值和存档业务继续由原游戏处理。

新安装默认显示 Hub、开启动画并平铺全部战斗选项；已有偏好保留。需要聚焦编辑时仍可手动开启。

### 当前 Mod 组合的兼容维护

同步 ModHub、MapleBirch、原版优化和 SmartPhone Alpha 的适用外观包。ModHub 包含管理器和帮助中心等已识别页面；原版优化叠穿列表可显示多件衣物，并沿用原顺序调整与卸下操作。存档、导出／载入和已匹配云存档共用存档管理页头。

修复原版优化部分存档附加日期显示为无效文字的问题。仅在能够确认存档时间时修正显示，正常日期保留；不改存档数据，上游恢复正常后自动让位。

存档操作前增加异常数据检查，避免把无法识别的数据当成空槽。信息无法确认时停止该次操作转发并保留原版入口；正常槽位仍沿原按钮路径处理，不自动改写存档。带有未知扩展内容的行继续保留原生展示与操作。

兼容包按需安装，不包含第三方主 Mod。Cheat Extended 原作者版与独立维护的 rebuild.30 需要二选一。

## 安装与回退

主 UI 与 Framework Host 仍是两个独立包，Host 先加载；对应兼容包放在目标 Mod 和 UI 之后，每个技术名只启用一个版本。无需解压 ZIP。

当前适配基线为 DoL 0.5.12.13，Loader 和其它依赖的最低要求及实测版本见[安装说明](INSTALL_EVOLUTION_CANDIDATE.md)。先备份存档并保留原包；回退时恢复旧包和顺序、重启即可，不需要清空游戏数据。

本次维护代码已转入TypeScript工具链，便于持续检查与维护；玩家不需要安装Node，浏览器与游戏端依赖、存档格式保持原约定。

## 已知限制

- 部分Android环境的复杂天气下仍可能出现偶发慢帧。
- 未知第三方页面可能保留原外观，未知结构会退让。
- ModHub 所有安装／更新场景的卡顿与闪烁尚未作完全解决的承诺。
- 已修复的衣柜路径不代表全部历史同名异常都已归因。
- 长时间、多 Mod 资源变化仍需持续观察；当前短时结果不作为完整 FPS 或无泄漏证明。
- 物理手机、iOS、所有 WebView、商品和战斗场景未全部覆盖。

[验证范围与已知限制](evolution/EVO-RELEASE-GATE-2026-10-24.md)保留在仓库，便于核对具体测试环境与未覆盖内容。

Framework Host继续使用`StoneFreeHost`技术名，公共合同保持不变。

## 分发文件

正式文件已经准备，公开下载入口尚未建立；以下文件名与实际分发目录一致。

| 文件 | 用途 |
| --- | --- |
| `StoneFreeHost-0.1.5-experimental.mod.zip` | Framework Host，必装 |
| `DoLGameUI-4.0.0.mod.zip` | 主UI，必装 |
| `ModHubSoftWet-ModHub-1.3.0-plus-v1.0.2.mod.zip` | ModHub外观，选装 |
| `MapleBirchSoftWet-maplebirch-5.2.3-plus-v1.0.1.mod.zip` | MapleBirch云存档外观，选装 |
| `DolOptimizationSoftWet-原版优化-1.1.1.2-plus-v1.0.3.mod.zip` | 原版优化存档与叠穿兼容，选装 |
| `CheatExtendedSoftWet-cheat extended-1.20.3-plus-v1.0.0.mod.zip` | Cheat Extended外观，选装；原作者／rebuild.30二选一 |
| `ReOverfitsSoftWet-ReOverfits-4.1.1-plus-v1.0.0.mod.zip` | 额外衣槽接入，选装 |
| `LyraMouthCompat051213-Lyra-0.5.12.13-1.0.1a-1004.1-goose-ucb-v1.0.0.mod.zip` | 指定Lyra嘴部资源，选装 |
| `SmartPhoneSoftWet-SmartPhone Alpha-0.3.91-plus-v1.1.1.mod.zip` | 万能手机Alpha外观，选装 |
| `SHA256SUMS.txt` | 九个Mod ZIP的SHA-256 |

安装说明、截图和视频在页面与仓库中提供。

## 画面与动态预览

[Android设置原速录屏（24秒）](media/evolution-rain-header/android-settings-rain.mp4)，展示双布局、分类、控件和开关。视频采集早于正式包，运行成员的复用关系见[媒体记录](media/evolution-rain-header/provenance.json)。

![当前Android设置：上下布局](media/evolution-rain-header/android-horizontal.png)

![实际Android设置：血月环境，普通雨保留](https://raw.githubusercontent.com/102326/DoL-Game-UI/dev/evolution-4.0/docs/media/evolution-rc1-game/android-blood-moon.png)

- [设置与特殊天气原速预览](https://github.com/102326/DoL-Game-UI/blob/dev/evolution-4.0/docs/media/evolution-special-integrated/desktop-1x.mp4)
- [悬浮球与工具原速预览](https://github.com/102326/DoL-Game-UI/blob/dev/evolution-4.0/docs/media/evolution-rc1-hub/desktop-1x.mp4)
- [窄屏设置预览](https://github.com/102326/DoL-Game-UI/blob/dev/evolution-4.0/docs/media/evolution-special-integrated/narrow-1x.mp4)

血月截图来自Android测试App；后三段视频为真实组件的受控原速演示。它们录制于TS First最终候选之前，展示效果保留，不是正式4.0.0包的重新录制。完整来源见[媒体与版本记录](evolution/EVO-RC2-VALIDATION-2026-10-24.md)。

## 许可与署名

项目原创代码使用[MIT](../LICENSE)，版权署名为DoLWorkbench contributors。衣柜衍生渲染及四项游戏Twee替换来自Vrelnir及Degrees of Lewdity贡献者，适用**CC BY-NC-SA 4.0**；见[来源与修改说明](../UPSTREAM-RENDERER-NOTICE.md)及[完整许可](../UPSTREAM-RENDERER-LICENSE)。MIT不替代这些代码的原许可。Vue、Tailwind CSS与GSAP等第三方声明随包保留。

如遇问题，请在[GitHub Issues](https://github.com/102326/DoL-Game-UI/issues)附上版本、平台和复现步骤；不要公开账号凭据或敏感数据。
