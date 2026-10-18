# Soft & Wet 3.0 — Kraft Work

**全新的视觉，更自由的交互。**

Kraft Work 重新整理了 DoL 的界面材质、导航和动态反馈：黑灰 Acrylic 让游戏背景自然参与窗口，常用操作有更连贯的空间转场，商店和衣柜的信息也更容易查看。购买、穿戴、角色数值与存档仍由原游戏和对应 Mod 处理。

## 本次更新

### 黑灰 Acrylic 与动态交互

属性、社交、特质、成就、日志等已适配窗口采用协调的外壳、导航和内容层级，保留原游戏的重要语义颜色。窗口展开与退场、导航焦点、按钮按压、商品选中波纹和详情过渡按各自用途呈现。材质与动画可关闭，系统减少动态效果时自动退化。

### 游戏天气响应

窗口随 **DoL 内部天气** 改变表面氛围，不使用现实天气服务。当前实现包括晴天柔和暖光、多云明暗漂移、雨天细雨与玻璃水珠、雷雨局部环境照明，以及雾、雪的装饰表现。雨量会影响节奏；玻璃水珠与细雨使用不同层次。效果可延伸到窗口内部，装饰层不接受点击。

晴、雨、暴雨、雷雨有实际游戏环境中的受控演示；雾与雪有定向检查，未宣称全部自然天气过程均已观察。

### 可选 Floating Hub

星簇与工具带提供悬浮快捷入口，支持展开、收起、拖动、侧边停靠和已支持窗口的工具交接。**新安装默认关闭**。在“界面设置 → 入口 → 高级快捷工具”开启“启用悬浮球”；点击展开，拖动移动，也可使用键盘方向键调整。找回入口与重置位置仍在同一设置区域。

### 设置双布局

“上下”使用横向分类导航，“左右”使用纵向分类导航。两者共享真实控件、当前分类、偏好和预览，修改后自动保存。设置打开时阻挡背后游戏输入，长内容可以滚动。

### 商店与衣柜

商店提供商品信息参照、比较与详情展示，保留原报价和购买路径。衣柜仍然单击直接穿戴，“衣物详情与特质”使用独立抽屉，支持穿搭预览与参照比较。R16-W01 修复使快穿沿用当前原穿戴入口，保留已验证的第三方服装叠加语义。

战斗继续默认使用原版控件。“战斗聚焦编辑（实验）”是默认关闭的可选项。本版不包含 Widget、自由布局编辑器或全局动作底栏。

### 可选外观兼容包

本次更新 ModHubSoftWet **0.2.5**、MapleBirchSoftWet **0.2.5**、DolOptimizationSoftWet **0.1.7**，并增加 CheatExtendedSoftWet **0.1.0**。它们只在已识别的目标页面应用外观，保留原控件与事件；不要求所有第三方窗口改成同一风格。

Cheat Extended 主要适配 **chris81605 原作者版**，实测 1.20.3.1；另行验证 **102326 独立维护的 1.20.3.1-rebuild.30**。后者不是原作者发行版。二者技术名相同，只能启用其中一版。没有验收 Modernization／CE-R1 或 DoLCheatReboot，也未穷举所有作弊功能。

ReOverfits 0.2.2 与当前 Lyra 0.5.12.13 嘴部适配 0.1.2 沿用已固定的原包。旧 Lyra 0.5.11.9 衣柜嘴部包单独保留，**不要用于当前 0.5.12.13 安装**。

## 画面与预览

以下为最终发行 ZIP 在 Android 独立测试版中的真实画面，使用隔离新进度；背景和部分状态来自现场社区组合。

![设置上下布局](https://github.com/102326/DoL-Game-UI/releases/download/v3.0.0/KraftWork-3.0-settings-horizontal.png)

<details>
<summary>设置左右布局、角色信息与 Floating Hub</summary>

![设置左右布局](https://github.com/102326/DoL-Game-UI/releases/download/v3.0.0/KraftWork-3.0-settings-vertical.png)

![角色信息](https://github.com/102326/DoL-Game-UI/releases/download/v3.0.0/KraftWork-3.0-character.png)

![Floating Hub](https://github.com/102326/DoL-Game-UI/releases/download/v3.0.0/KraftWork-3.0-floating-hub.png)

</details>

![游戏天气响应](https://github.com/102326/DoL-Game-UI/releases/download/v3.0.0/KraftWork-3.0-weather.png)

[观看 Android 原速天气视频（约 12 秒）](https://github.com/102326/DoL-Game-UI/releases/download/v3.0.0/KraftWork-3.0-weather-android.mp4)。录像使用原游戏 Weather 接口准备雷雨，保留原时间尺度；不作为 FPS 或物理触控测量。

## 安装要求

| 项目 | 要求与实测范围 |
| --- | --- |
| DoL | 当前适配基线与主要验收版本为 0.5.12.13；其它版本未扩大支持声明 |
| ModLoader | 最低 2.100.0；本次实际 2.101.1 |
| TweeReplacer | 最低 1.0.0 |
| Framework Host | `>=0.1.2-experimental && <0.2.0`；推荐并实测 0.1.4-experimental |
| 平台 | Windows Edge／Chromium 与 Android 平板 WebView 有代表性验证；不代表所有设备与版本 |

最低要求、推荐版本和实测组合含义不同。无需把所有前置锁在本次实测版本；后续版本仍须满足对应接口与页面结构。Loader 对预发布版本的比较有已知限制，满足表达式不代表所有未来预发布均获支持。

公共协议仍为 `0.1-experimental`，官方 UI API 仍为 v1。`StoneFreeHost` 是保留的技术包名；对外版本代号为 Kraft Work。

## 安装、升级与回退

1. 备份存档，保留可以回退的旧 UI 与兼容包。
2. 停用旧 `DoLGameUI`，每个技术身份只启用一份。
3. 安装 Host，再安装 `DoLGameUI-3.0.0.mod.zip`，不要解压 ZIP。
4. 可选兼容包放在对应目标 Mod 和 UI 之后；没有相应 Mod 就不安装。
5. 重启游戏，检查版本与界面后再载入自己的进度。

加载关系：基础游戏依赖 → Host → UI；对应第三方 Mod 与 UI → 其外观兼容包。Host 与 UI 是普通玩家需要的两个运行包，开发样例、Factory、Author Kit 和独立研究包均不是必装项。

2.7 的主题、字号、密度、侧栏、页面与存档显示偏好有沿用路径，已完成代表性升级／回退验证；未穷举所有历史配置，不迁移存档格式。新兼容包要求 UI 3.0，回退 2.7 时一并恢复旧兼容包。停用 3.0、重新启用原 2.7 包并重启即可回退。其它 Mod 仍使用 Host 时保留 Host。不要删除整个游戏数据，不承诺热卸载。

## 已知问题与限制

- 部分第三方页面保留原外观；社区组合的部分 Patch、资源与启动告警尚未归因。
- `selectedWardrobe`／Wardrobe Widget 历史异常在指定路径未复现，根因仍为 Unknown。
- Windows 资源观察中 UI 组和对照组均有增长，尚未完成最终归因；不宣称无泄漏。Android 没有有效 gfxinfo 帧样本，不提供 FPS 结论。
- 没有覆盖所有手机、IME、WebView、交易、战斗结算、衣槽或社区 Mod。云端实际上传／下载、系统文件选择和全部 CE 操作不在本次验证范围。
- 当前 CE 实际验收覆盖独立 CE 窗口；普通作弊入口未出现内嵌 CE 目录，不把该路径列为真机通过。
- Host 公共协议仍是实验性协议，产品版本不代表 API 永久冻结。

## 下载文件

| 文件 | 用途 |
| --- | --- |
| [DoLGameUI-3.0.0.mod.zip](https://github.com/102326/DoL-Game-UI/releases/download/v3.0.0/DoLGameUI-3.0.0.mod.zip) | 主 UI，必装 |
| [StoneFreeHost-0.1.4-experimental.mod.zip](https://github.com/102326/DoL-Game-UI/releases/download/v3.0.0/StoneFreeHost-0.1.4-experimental.mod.zip) | Framework Host，必装 |
| [ModHubSoftWet-ModHub-1.3.0-plus-v0.2.5.mod.zip](https://github.com/102326/DoL-Game-UI/releases/download/v3.0.0/ModHubSoftWet-ModHub-1.3.0-plus-v0.2.5.mod.zip) | ModHub 外观，选装 |
| [MapleBirchSoftWet-maplebirch-5.2.3-plus-v0.2.5.mod.zip](https://github.com/102326/DoL-Game-UI/releases/download/v3.0.0/MapleBirchSoftWet-maplebirch-5.2.3-plus-v0.2.5.mod.zip) | MapleBirch 云存档外观，选装 |
| [DolOptimizationSoftWet-原版优化-1.1.1.2-plus-v0.1.7.mod.zip](https://github.com/102326/DoL-Game-UI/releases/download/v3.0.0/DolOptimizationSoftWet-%E5%8E%9F%E7%89%88%E4%BC%98%E5%8C%96-1.1.1.2-plus-v0.1.7.mod.zip) | 原版优化存档外观，选装 |
| [CheatExtendedSoftWet-cheat extended-1.20.3-plus-v0.1.0.mod.zip](https://github.com/102326/DoL-Game-UI/releases/download/v3.0.0/CheatExtendedSoftWet-cheat%20extended-1.20.3-plus-v0.1.0.mod.zip) | Cheat Extended 外观，选装；原作者／rebuild.30 二选一 |
| [ReOverfitsSoftWet-ReOverfits-4.1.1-plus-v0.2.2.mod.zip](https://github.com/102326/DoL-Game-UI/releases/download/v3.0.0/ReOverfitsSoftWet-ReOverfits-4.1.1-plus-v0.2.2.mod.zip) | ReOverfits 槽位兼容，沿用原包，选装 |
| [LyraMouthCompat051213-Lyra-0.5.12.13-v0.1.2.mod.zip](https://github.com/102326/DoL-Game-UI/releases/download/v3.0.0/LyraMouthCompat051213-Lyra-0.5.12.13-v0.1.2.mod.zip) | 指定 Lyra 0.5.12.13 嘴部资源适配，沿用原包，选装 |
| [INSTALL.md](https://github.com/102326/DoL-Game-UI/releases/download/v3.0.0/INSTALL.md) | 安装、兼容包与回退 |
| [VALIDATION.md](https://github.com/102326/DoL-Game-UI/releases/download/v3.0.0/VALIDATION.md) | 验证范围与 Known limitations |
| [SOURCE_IDENTITY.json](https://github.com/102326/DoL-Game-UI/releases/download/v3.0.0/SOURCE_IDENTITY.json) | Git／冻结输入／包成员及素材身份 |
| [SHA256SUMS.txt](https://github.com/102326/DoL-Game-UI/releases/download/v3.0.0/SHA256SUMS.txt) | 全部下载负载的 SHA-256，校验清单自身除外 |

旧 Lyra 0.5.11.9 专用包继续从 [2.7 历史 Release](https://github.com/102326/DoL-Game-UI/releases/tag/v2.7.0) 获取，不属于当前主安装。研究制品、作者工具、游戏本体、APK 与第三方原 Mod 不随本次运行附件分发。

## 反馈与许可

请在 [GitHub Issues](https://github.com/102326/DoL-Game-UI/issues) 提供 DoL／Lyra、ModLoader、Host、UI、相关第三方 Mod 版本，Windows／Android 与浏览器／WebView 环境，以及复现步骤、实际和期望表现。适用时附日志片段或截图；**不要公开上传私人存档、账号信息、敏感数据或未获授权分发的 Mod 包**。

项目代码保留 DoLWorkbench contributors 的 MIT 许可。部分衣柜渲染代码和四项游戏 Twee 替换衍生自 Vrelnir 与贡献者的 DoL，适用 CC BY-NC-SA 4.0；MIT 不替代这些代码的原许可。各包保留 LICENSE、第三方 NOTICE 与上游声明。Vue、Tailwind 及其它依赖的署名随包提供。Cheat Extended 外观包不包含原 Mod，保留原作者来源，另行标注 rebuild.30 的维护归属。
