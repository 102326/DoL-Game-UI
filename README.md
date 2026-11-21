# Soft & Wet 4.5.1

[![最新版本](https://img.shields.io/github/v/release/102326/DoL-Game-UI)](https://github.com/102326/DoL-Game-UI/releases/latest) ![适配基线](https://img.shields.io/badge/DoL-0.5.12.13-blue)

Soft & Wet 是《Degrees of Lewdity》的界面 Mod。它给游戏窗口换上可调通透度的黑灰玻璃，为衣柜和服装店整理了挑选、配色和预览界面。穿戴、购买和存档仍由游戏及对应 Mod 处理。

**[下载最新正式版](https://github.com/102326/DoL-Game-UI/releases/latest)** · [4.5.1 完整更新说明](https://github.com/102326/DoL-Game-UI/releases/tag/v4.5.1) · [安装、升级与回退指南](docs/INSTALL_4.5.md)

## 安装 4.5.1

- **第一次安装**　下载 [Framework Host](https://github.com/102326/DoL-Game-UI/releases/download/v4.5.1/StoneFreeHost-0.1.5-experimental.mod.zip) 和 [Soft & Wet 主 UI](https://github.com/102326/DoL-Game-UI/releases/download/v4.5.1/DoLGameUI-4.5.1.mod.zip)。两个 ZIP 直接导入 Loader，无需解压。把 Host 排在主 UI 前，再重启游戏。
- **从 4.2 升级**　备份旧包，用 4.5.1 主 UI 替换旧 UI。随 4.2 安装的 Host 0.1.5-experimental 可以继续用，原有显示偏好也会保留。
- **已经装了兼容包**　ModHub、MapleBirch、原版优化、Cheat Extended 和 ReOverfits 各有对应更新，只下载自己用到的包，排在目标 Mod 和主 UI 之后。指定 Lyra 的嘴部资源包可以沿用。

## 4.5.1 有哪些变化

- **逛服装店时可以接着挑。** 宽屏上，点一件衣服就能在列表右侧查看款式和配色，再点另一件比较。手机窄屏从底部打开详情，收起后回到刚才的位置。
- **悬浮工具有两种展开方式。** 双菱形入口可以拖动、贴边。在侧栏「界面设置」里选列表或弧形抽屉。选弧形时，工具会从入口上方或下方依次排向屏幕内侧。
- **颜色和字体可以先试再存。** 在「界面设置 → 材质 → 颜色与字体」里调整底色、面板、文字和强调色，或填入本机字体名称。看过预览再点「应用并保存」，也可以单独恢复默认外观。
- **切页和键盘操作更连贯。** 设置、特质、成就和 ModHub 切页时保持窗口大小，长内容在窗口内滚动。用键盘切换衣柜详情后，焦点会落回新衣物的详情入口。

## 画面预览

下面是 4.2 的 Android 设置界面与 Windows 动态演示，可用来了解玻璃材质和天气效果。

![4.2 Android 设置界面](assets/releases/4.2/android-settings.png)

[观看 Windows 动态预览](https://raw.githubusercontent.com/102326/DoL-Game-UI/v4.2.0/assets/releases/4.2/soft-wet-4.2-windows.mp4) · [更多预览画面](docs/RELEASE_4.2.0.md#画面与动态预览)

## 核心体验

### 自己决定玻璃的通透度

“Acrylic 通透度”从 **0–100** 连续调节，默认 **60**。向左更沉稳，适合专注阅读；向右更通透，让背景自然融入玻璃。文字、图标与按钮始终保持清楚。

官方窗口与已适配的兼容页面跟随同一套材质设置，保留黑灰 Acrylic 的统一风格。

### 按自己的节奏阅读

正文行距、段落与选项间距、正文宽度分别调整，默认跟随原版。选项文字可靠左或居中，字体与按钮大小也能独立设置。

设置继续提供上下、左右两种布局，修改立即生效并自动保存。普通页面直接切换，设置分类只保留短促淡入；衣柜直接进入，减少等待。

设置和属性窗口可从标题空白处拖动，玻璃外壳随手势产生轻微受力和回弹；按钮、输入框和正文滚动保留原有操作。

### 玻璃随天气变化

窗口响应 DoL 游戏内天气：雨珠与细雨、雪粒与霜羽、日照与云影，都成为玻璃上的环境反馈。血月、异世界及极端冷热也有各自的气氛，雨中血月保留普通雨滴。

关闭动画或开启系统的「减少动态效果」后，窗口仍可照常操作。

### 衣柜、服装店与常用窗口

| 界面 | 主要体验 |
| --- | --- |
| 衣柜 | 分类、搜索、当前穿搭、角色预览、参照比较与衣物详情抽屉；单击直接穿戴 |
| 服装店 | 商品选择、配色、报价与购买集中展示，窄屏使用详情抽屉，宽屏使用右侧详情 |
| 属性、社交与特质 | 协调的玻璃外壳、内容分组与导航焦点 |
| 成就、日志与统计 | 分类导航与清楚的正文阅读 |
| 战斗 | 默认展开全部原选项，聚焦编辑可选 |
| 存档、导出／载入与云存档 | 共用存档管理页头，保留原有操作 |
| 游戏选项与作弊 | 统一控件风格，修正多箭头步进按钮的尺寸与图标挤压 |

购买、穿戴、战斗结算与存档继续使用原游戏及对应 Mod 的规则。原版优化的叠穿项目可在衣柜中查看和管理。

## 运行要求

| 项目 | 要求 |
| --- | --- |
| DoL | 适配基线 **0.5.12.13** |
| ModLoader | **2.100.0 或更新** |
| TweeReplacer | **1.0.0 或更新** |
| Framework Host | **0.1.2-experimental 至 0.2.0 之前**；推荐使用本版附带包 |
| 平台 | Windows 浏览器、Android WebView |

## 可选兼容包

| 包 | 用途 |
| --- | --- |
| ModHubSoftWet | 模组管理器、市场、帮助中心与工具浮层；需要主 UI 4.2 或更新 |
| MapleBirchSoftWet | 云存档页面 |
| DolOptimizationSoftWet | 存档页面、日期显示与衣柜叠穿管理 |
| CheatExtendedSoftWet | Cheat Extended 外观 |
| ReOverfitsSoftWet | 额外服装槽位接入 |
| LyraMouthCompat051213 | 指定 Lyra 环境的嘴部资源适配 |

没有安装目标 Mod，就不需要对应兼容包。CE 原作者版与独立维护的 rebuild.30 只能启用一个。具体版本与下载统一见[最新发布页](https://github.com/102326/DoL-Game-UI/releases/latest)。

## 设置、回退与反馈

各页面可以独立切回原版，总开关会保留显示偏好。需要整包回退时，恢复保存的旧包与顺序并重启；无需清空存档或 App 数据。

遇到显示或操作问题，请到 [GitHub Issues](https://github.com/102326/DoL-Game-UI/issues) 附上版本、设备、复现步骤和截图。开发资料见[UI 接入文档](docs/UI_RUNTIME.md)、[构建与 CI](docs/CI.md)和[当前交接](docs/HANDOFF.md)。

## 许可与致谢

原创代码采用 [MIT](LICENSE)。游戏衍生代码来自 Vrelnir 与 Degrees of Lewdity 贡献者，保留 [CC BY-NC-SA 4.0 与来源说明](UPSTREAM-RENDERER-NOTICE.md)。ModHub 片段保留[原作者许可](MODHUB-PERFORMANCE-NOTICE.txt)，Vue、Tailwind CSS、GSAP 等依赖的声明随包提供。
