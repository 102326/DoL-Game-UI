# Soft & Wet 4.0 — Evolution

**更有表现力的交互，延续熟悉的黑灰 Acrylic。**

Evolution 为 Soft & Wet 带来回旋驱动的悬浮工具、更细致的玻璃天气和连贯的窗口转场。衣柜、服装店与常用菜单继续保持统一的材质与操作反馈，游戏原有的购买、穿戴、战斗结算和存档规则保持。

[下载主 UI](https://github.com/102326/DoL-Game-UI/releases/download/v4.0.1/DoLGameUI-4.0.1.mod.zip) · [下载 Framework Host](https://github.com/102326/DoL-Game-UI/releases/download/v4.0.1/StoneFreeHost-0.1.5-experimental.mod.zip) · [安装说明](https://github.com/102326/DoL-Game-UI/blob/v4.0.1/docs/INSTALL_EVOLUTION_CANDIDATE.md) · [动态预览](https://github.com/102326/DoL-Game-UI/blob/v4.0.1/docs/media/evolution-rain-header/android-settings-rain.mp4) · [反馈问题](https://github.com/102326/DoL-Game-UI/issues)

> 普通玩家需要 **主 UI + Framework Host** 两个 ZIP。对应兼容包按自己安装的 Mod 选用，均无需解压。

![Android 实机：设置双布局与黑灰 Acrylic](https://raw.githubusercontent.com/102326/DoL-Game-UI/v4.0.0/docs/media/evolution-rain-header/android-horizontal.png)

*Android 测试版实机画面，采集于正式打包前；[素材来源与版本对应](https://github.com/102326/DoL-Game-UI/blob/v4.0.1/docs/media/evolution-rain-header/provenance.json)。*

## 本次更新

### 回旋驱动的 Floating Hub

悬浮球以金属光照、表面纹理和高速残影呈现回旋；蓄势后带出真实工具菜单，关闭时工具与背景共同收束。

- 保留拖动、侧边停靠、快捷工具与键盘操作。
- 快速打开、关闭或反向时，沿当前状态继续过渡。
- **新安装默认显示**；已有隐藏偏好保留，可在界面设置中关闭或找回入口。

### 双布局设置与玻璃天气

上下、左右两种设置布局共用实际控件、偏好和实时预览。窗口采用短开合过渡，分类保留连贯转场；长内容可以滚动，打开时阻挡背后的游戏输入，修改后自动保存。

新的设置玻璃响应 **DoL 游戏内天气**：雨珠附着和滑落，细雨与霜羽随环境变化。血月呈现红色月面与云影，异世界使用紫色流云，极热与严寒增加对应雾光；这些环境效果可与原有雨雪共同出现，雨中血月仍使用普通雨滴。

普通雨珠主要覆盖设置标题、布局选择及横向分类区，向下渐隐，保留背景折射。新玻璃模型当前用于设置窗口，其它已适配窗口保留原有天气表现。天气装饰不接收点击，减少动态或关闭动画时使用静态表现。

### 窗口与导航修整

- 导航焦点适应滚动和缩放，角色窗口保持原链接、表单和语义颜色。
- 修复窄屏战斗底栏偏移、关窗后背景残留，以及一条衣柜离场刷新路径。
- 优化 ModHub 等已适配窗口中雨幕动画造成的持续重绘，保留雨量、雨滴和材质效果。
- 新安装默认开启动画、**平铺全部战斗选项**；聚焦编辑仍可手动开启，已有偏好保留。

### 商店、衣柜与存档兼容

商店保留商品选择反馈、详情过渡和原购买路径。衣柜保持单击穿戴、角色预览、参照比较与衣物详情抽屉；已识别的原版优化叠穿列表可以显示多件衣物，继续使用作者的顺序调整和卸下操作。

存档、导出／载入和已适配云存档共用存档管理页头。原版优化附加日期无效时，只在能确认存档时间的情况下修正文字；正常日期保留，上游恢复后自动让位，**不改存档数据**。

存档操作会区分正常空槽和异常数据，无法确认时停止该次转发并保留原版入口；未知扩展行继续使用原生控件，不自动修复存档内容。

本版同步 ModHub、MapleBirch、原版优化和万能手机 Alpha 等适用兼容包。第三方主 Mod 需要另行安装；CE 原作者版与独立维护的 rebuild.30 技术名相同，只能启用一个。

## 画面与动态预览

| 预览 | 内容 |
| --- | --- |
| [Android 原速录屏 · 24 秒](https://github.com/102326/DoL-Game-UI/blob/v4.0.1/docs/media/evolution-rain-header/android-settings-rain.mp4) | 双布局、分类、实际控件、开关与顶栏雨效 |
| [Floating Hub](https://github.com/102326/DoL-Game-UI/blob/v4.0.1/docs/media/evolution-rc1-hub/desktop-1x.mp4) | 金属球回旋、真实工具展开与回收 |
| [设置与特殊天气](https://github.com/102326/DoL-Game-UI/blob/v4.0.1/docs/media/evolution-special-integrated/desktop-1x.mp4) | 玻璃天气、特殊环境与窗口交互 |
| [窄屏设置](https://github.com/102326/DoL-Game-UI/blob/v4.0.1/docs/media/evolution-special-integrated/narrow-1x.mp4) | 窄视口下的设置展示 |

<details>
<summary>更多 Android 实机画面：左右布局与血月</summary>

![Android 设置：左右布局](https://raw.githubusercontent.com/102326/DoL-Game-UI/v4.0.0/docs/media/evolution-rain-header/android-vertical.png)

![Android 设置：血月环境，普通雨保留](https://raw.githubusercontent.com/102326/DoL-Game-UI/v4.0.0/docs/media/evolution-rc1-game/android-blood-moon.png)

</details>

截图与第一段视频来自 Android 测试 App，其余视频为真实组件的受控原速演示。素材采集早于正式包，展示效果保留；不是正式 4.0.0 包的新录屏。详细来源见[媒体与验证记录](https://github.com/102326/DoL-Game-UI/blob/v4.0.1/docs/evolution/EVO-RC2-VALIDATION-2026-10-24.md)。

## 安装与升级

| 项目 | 要求与范围 |
| --- | --- |
| DoL | 当前适配与代表性验收基线为 **0.5.12.13** |
| ModLoader | **>=2.100.0**，本轮使用 2.101.1 |
| TweeReplacer | **>=1.0.0**，本轮使用 1.7.0 |
| Framework Host | **>=0.1.2-experimental 且 <0.2.0**；随本版提供 0.1.5-experimental |
| 平台 | Android 平板 WebView 与 Windows Edge 有代表性验证 |

最低要求与实测版本分别说明，不要求把前置固定在本轮版本；满足最低要求也不代表全部未来版本和整合包都已经验证。

1. 备份需要保留的存档，保存原包与加载顺序。
2. 停用旧同名 UI，每个技术身份只启用一份。
3. 导入 **Framework Host** 和 **主 UI**，不要解压 ZIP，Host 排在 UI 前。
4. 按目标 Mod 选装兼容包，放在对应目标 Mod 和 UI 之后。
5. 重启后检查版本、入口与设置，再载入自己的进度。

已有显示偏好保留，存档格式不变。`StoneFreeHost` 是 Framework Host 保留的技术包名。玩家不需要安装 Node；本版维护代码及测试、构建工具已按 TS First 整理。

需要回退时，停用当前 UI 及只适用于它的兼容包，恢复保留的原包和顺序，再重启。其它 Mod 仍使用 Host 时保留 Host。**不要清空存档或整个 App 数据。** 详细步骤和目标 Mod 范围见[安装、升级与回退](https://github.com/102326/DoL-Game-UI/blob/v4.0.1/docs/INSTALL_EVOLUTION_CANDIDATE.md)。

## 下载文件

前两个包必装，其余七个兼容包按需选择。包名里的目标版本用于识别，不表示所有后续版本均已验证；具体依赖以包内声明及安装说明为准。兼容包不包含第三方主 Mod，万能手机包不适用于 Omega。

| 下载 | 用途 |
| --- | --- |
| [主 UI · 4.0.1](https://github.com/102326/DoL-Game-UI/releases/download/v4.0.1/DoLGameUI-4.0.1.mod.zip) | 必装 |
| [Framework Host · 0.1.5-experimental](https://github.com/102326/DoL-Game-UI/releases/download/v4.0.1/StoneFreeHost-0.1.5-experimental.mod.zip) | 必装，排在 UI 前 |
| [ModHubSoftWet · 1.0.2](https://github.com/102326/DoL-Game-UI/releases/download/v4.0.1/ModHubSoftWet-ModHub-1.3.0-plus-v1.0.2.mod.zip) | ModHub 管理器、市场、帮助与已识别浮层 |
| [MapleBirchSoftWet · 1.0.1](https://github.com/102326/DoL-Game-UI/releases/download/v4.0.1/MapleBirchSoftWet-maplebirch-5.2.3-plus-v1.0.1.mod.zip) | MapleBirch 云存档页面外观 |
| [DolOptimizationSoftWet · 1.0.3](https://github.com/102326/DoL-Game-UI/releases/download/v4.0.1/DolOptimizationSoftWet-Optimization-1.1.1.2-plus-v1.0.3.mod.zip) | 原版优化存档、日期显示与衣柜叠穿管理 |
| [CheatExtendedSoftWet · 1.0.0](https://github.com/102326/DoL-Game-UI/releases/download/v4.0.1/CheatExtendedSoftWet-CheatExtended-1.20.3-plus-v1.0.0.mod.zip) | 原作者 CE／rebuild.30 外观，二选一 |
| [ReOverfitsSoftWet · 1.0.0](https://github.com/102326/DoL-Game-UI/releases/download/v4.0.1/ReOverfitsSoftWet-ReOverfits-4.1.1-plus-v1.0.0.mod.zip) | 额外服装槽位接入 |
| [LyraMouthCompat051213 · 1.0.0](https://github.com/102326/DoL-Game-UI/releases/download/v4.0.1/LyraMouthCompat051213-Lyra-0.5.12.13-1.0.1a-1004.1-goose-ucb-v1.0.0.mod.zip) | 指定 Lyra 环境的嘴部资源适配 |
| [SmartPhoneSoftWet · 1.1.1](https://github.com/102326/DoL-Game-UI/releases/download/v4.0.1/SmartPhoneSoftWet-SmartPhoneAlpha-0.3.91-plus-v1.1.1.mod.zip) | 万能手机 Alpha 外观，不适用于 Omega |
| [SHA256SUMS.txt](https://github.com/102326/DoL-Game-UI/releases/download/v4.0.1/SHA256SUMS.txt) | 九个 Mod ZIP 的完整性校验 |

安装说明、截图、视频和技术报告在页面与仓库中提供；Assets 保留玩家安装包和校验清单。

## 已知问题与限制

- 部分 Android 环境在复杂天气下仍可能偶发慢帧，原因尚未确定。
- 部分第三方页面会保留原外观；ModHub 全部安装／更新场景的卡顿与闪烁尚不作完全解决承诺。
- 本版修复的衣柜路径不代表全部历史同名异常都已归因。
- 长时间、多 Mod 资源变化仍需观察，当前没有完整 FPS 或长期无泄漏结论。
- 物理手机、iOS、全部 WebView、商品、战斗和 Mod 组合未穷举。ReOverfits 本轮核对了包和合同，未新增目标 Mod 实机验证。

具体测试环境、覆盖和性能记录保留在[验证与已知限制](https://github.com/102326/DoL-Game-UI/blob/v4.0.1/docs/evolution/EVO-RELEASE-GATE-2026-10-24.md)，便于需要时核对。

## 反馈与许可

请在 [GitHub Issues](https://github.com/102326/DoL-Game-UI/issues)提供游戏、Loader、UI／Host 与相关 Mod 版本、设备、复现步骤和实际表现。截图、日志与存档可选；公开反馈前请检查是否包含账号凭据、敏感数据或无权分发的内容。

项目原创代码使用 [MIT](https://github.com/102326/DoL-Game-UI/blob/v4.0.1/LICENSE)，版权署名为 DoLWorkbench contributors。衣柜衍生渲染及四项游戏 Twee 替换来自 Vrelnir 及 Degrees of Lewdity 贡献者，适用 **CC BY-NC-SA 4.0**；见[来源与修改说明](https://github.com/102326/DoL-Game-UI/blob/v4.0.1/UPSTREAM-RENDERER-NOTICE.md)及[完整许可](https://github.com/102326/DoL-Game-UI/blob/v4.0.1/UPSTREAM-RENDERER-LICENSE)。MIT 不替代这些代码的原许可。Vue、Tailwind CSS、GSAP 等依赖的声明随包保留。

## 4.0.1 修复内容

- 修复服装店打开时因分页脚本行注释被 Widget 压缩而报 `Unexpected end of input` 的问题。

- 侧栏与已适配的兼容窗口只保留一套开窗演出，避免存档、作弊等窗口重复入场；兼容识别更新不再重新播放。
- 侧栏和已识别兼容窗口与设置共用 100ms 打开过渡，去掉旧材料展开以及叠加的导航／正文淡入；背景以 80ms 退场，原生关闭动作保持即时。天气绘制集中到完整顶栏和分类区域。
- 修复悬浮工具选择扇形后仍显示网格的问题；空间不足时仍回退为可操作的网格。
- 关闭悬浮工具后移除不可见菜单的绘制，避免残留黑色底板。

已安装 4.0.0 的玩家只需替换主 UI ZIP；Framework Host 与七个兼容包沿用原包，无需重复导入。原 4.0.0 保留，可用于回退。
