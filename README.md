# Soft & Wet 4.2

[![最新版本](https://img.shields.io/github/v/release/102326/DoL-Game-UI)](https://github.com/102326/DoL-Game-UI/releases/latest) ![适配基线](https://img.shields.io/badge/DoL-0.5.12.13-blue)

> 4.2 正在准备中，性能验收尚未完成。公开稳定版请从[最新发布页](https://github.com/102326/DoL-Game-UI/releases/latest)下载。

Soft & Wet 为 Degrees of Lewdity 带来黑灰 Acrylic 界面，让游戏背景融入半透明玻璃，重新组织衣柜、服装店、角色信息与常用窗口。

4.2 为设置、属性窗口和悬浮工具加入手势反馈，并减少部分重复的界面工作。

[4.x文档](docs/README.md) · [下载稳定版](https://github.com/102326/DoL-Game-UI/releases/latest) · [4.2 更新说明](docs/RELEASE_4.2.0.md) · [安装与升级](#安装与升级) · [反馈问题](https://github.com/102326/DoL-Game-UI/issues)

> 普通玩家需要 **主 UI + Framework Host** 两个 ZIP。兼容包按自己安装的 Mod 选用，所有 `.mod.zip` 均无需解压。

## 核心体验

### 自己决定玻璃的通透度

“Acrylic 通透度”从 **0–100** 连续调节，默认 **60**。向左更沉稳，适合专注阅读；向右更通透，让背景自然融入玻璃。文字、图标与按钮始终保持清楚。

官方窗口与已适配的兼容页面跟随同一套材质设置，保留黑灰 Acrylic 的统一风格。

### 按自己的节奏阅读

正文行距、段落与选项间距、正文宽度分别调整，默认跟随原版。选项文字可靠左或居中，字体与按钮大小也能独立设置。

设置继续提供上下、左右两种布局，修改立即生效并自动保存。普通页面直接切换，设置分类只保留短促淡入；衣柜直接进入，减少等待。

设置和属性窗口可从标题空白处拖动，玻璃外壳随手势产生轻微受力和回弹；按钮、输入框和正文滚动保留原有操作。

### 回旋驱动的 Floating Hub

金属球体加速回旋，纹理、光照与残影带出工具菜单。**扇形模式的主按钮独立悬浮，停靠、重置与隐藏放在内圈**；网格模式保留整齐的面板布局。

拖动球体后可原地放下；持续顶住屏幕边缘蓄力，沿边移动调整方向，松手后球体带着短金色尾迹弹出并碰撞反弹。飞行中可以直接接住；停靠、快捷工具和找回入口继续可用，已有隐藏偏好保留。

### 玻璃随天气变化

窗口响应 DoL 游戏内天气：雨珠与细雨、雪粒与霜羽、日照与云影，都成为玻璃上的环境反馈。血月、异世界及极端冷热也有各自的气氛，雨中血月保留普通雨滴。

4.2 合并同一帧的连续拖动更新，减少重复天气状态写入，并复用稳定霜层路径和固定雨珠位移图。关闭动画或使用系统减少动态效果时，仍可正常操作。

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

## 安装与升级

| 项目 | 要求 |
| --- | --- |
| DoL | 适配基线 **0.5.12.13** |
| ModLoader | **2.100.0 或更新** |
| TweeReplacer | **1.0.0 或更新** |
| Framework Host | **0.1.2-experimental 至 0.2.0 之前**；推荐使用本版附带包 |
| 平台 | Windows 浏览器、Android WebView |

1. 保留需要的存档和原版本安装包。
2. 从[最新发布页](https://github.com/102326/DoL-Game-UI/releases/latest)下载 **Framework Host** 与 **DoLGameUI**，导入 Loader，不要解压。
3. 每个 Mod 只启用一个版本。Host 放在主 UI 前，兼容包放在目标 Mod 与 UI 后。
4. 重启游戏，打开“界面设置”调整通透度、阅读与悬浮工具。

已有显示偏好会继续保留。`StoneFreeHost` 是 Framework Host 的安装包名称。4.2 的详细步骤见[安装、升级与回退](docs/INSTALL_4.2.md)。

## 可选兼容包

| 包 | 用途 |
| --- | --- |
| ModHubSoftWet | 模组管理器、市场、帮助中心与工具浮层 |
| MapleBirchSoftWet | 云存档页面 |
| DolOptimizationSoftWet | 存档页面、日期显示与衣柜叠穿管理 |
| CheatExtendedSoftWet | Cheat Extended 外观 |
| ReOverfitsSoftWet | 额外服装槽位接入 |
| SmartPhoneSoftWet | 万能手机 Alpha 外观 |
| LyraMouthCompat051213 | 指定 Lyra 环境的嘴部资源适配 |

没有安装目标 Mod，就不需要对应兼容包。CE 原作者版与独立维护的 rebuild.30 只能启用一个；万能手机适配包用于 Alpha。具体版本与下载统一见[最新发布页](https://github.com/102326/DoL-Game-UI/releases/latest)。

## 设置、回退与反馈

各页面可以独立切回原版，总开关会保留显示偏好。需要整包回退时，恢复保存的旧包与顺序并重启；无需清空存档或 App 数据。

遇到显示或操作问题，请到 [GitHub Issues](https://github.com/102326/DoL-Game-UI/issues) 附上版本、设备、复现步骤和截图。开发资料见[UI 接入文档](docs/UI_RUNTIME.md)、[构建与 CI](docs/CI.md)和[当前交接](docs/HANDOFF.md)。

## 许可与致谢

原创代码采用 [MIT](LICENSE)。游戏衍生代码来自 Vrelnir 与 Degrees of Lewdity 贡献者，保留 [CC BY-NC-SA 4.0 与来源说明](UPSTREAM-RENDERER-NOTICE.md)。ModHub 片段保留[原作者许可](MODHUB-PERFORMANCE-NOTICE.txt)，Vue、Tailwind CSS、GSAP 等依赖的声明随包提供。
