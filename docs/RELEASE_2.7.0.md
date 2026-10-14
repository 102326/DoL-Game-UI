# DoL Soft & Wet Game UI 2.7.0 — Crazy Diamond

2.7 主要整理界面设置，修复战斗操作栏与服装店说明的遮挡，并完善可选工具在小窗口里的表现。衣柜、商店、战斗和存档继续沿用原有游戏操作；已经使用 2.6 的用户可以直接升级。

**普通玩家只需 UI 主包。兼容包按实际安装的 Mod 选用，不需要全部安装。**

## 主要变化

- 界面设置按阅读、材质、字体与按钮、侧栏和页面回退分组。工具配置、兼容实验和问题诊断默认收起。
- 保留旧显示偏好。已完成 2.6 缩放迁移的用户不会再次被重置；“恢复 100%”只改字号和按钮，“重置悬浮球位置”只改位置。
- 战斗操作栏在支持的浏览器中保持在可视窗口底部，避免受到祖先滤镜或变换影响；原版继续操作和回合规则不变。
- 服装店特质说明显示在筛选面板前方，修复“书包”等说明被遮挡的问题。
- 增加可选悬浮球，**新安装默认关闭**。可在“界面设置 → 高级快捷工具”开启，使用扇形或网格打开界面设置和开发检查；支持长按移动、位置保存、隐藏与找回。菜单避开已识别的战斗操作区。
- 原版动作底栏原型不随 2.7 启用。本版不包含 Widget、自定义布局编辑器或全局动作增强。

## 下载

### UI 主包

**[下载 Soft & Wet UI 2.7.0](https://github.com/102326/DoL-Game-UI/releases/download/v2.7.0/DoL-SoftWet-GameUI-2.7.0.mod.zip)**

适配 **DoL 0.5.11.9 / 0.5.12.13**，需要 ModLoader **2.100.0+** 与 TweeReplacer **1.0.0+**。模组不包含游戏本体、APK 或游戏图片。

### 官方兼容包：按需选装

以下四包沿用已发布版本，仅用于 **DoL 0.5.12.13**，要求 UI **2.2.2+**，不包含目标 Mod 本体。已经安装相同版本的兼容包时，无需重复更新。

| 你使用的 Mod | 最低目标版本与用途 | 下载 |
| --- | --- | --- |
| ModHub | 1.3.0+，管理界面外观 | [外观包 0.2.4](https://github.com/102326/DoL-Game-UI/releases/download/v2.7.0/ModHubSoftWet-ModHub-1.3.0-plus-v0.2.4.mod.zip) |
| MapleBirch | 5.2.3+，已识别界面外观 | [外观包 0.2.4](https://github.com/102326/DoL-Game-UI/releases/download/v2.7.0/MapleBirchSoftWet-maplebirch-5.2.3-plus-v0.2.4.mod.zip) |
| 原版优化 | 1.1.1.2+，存档界面 | [存档适配 0.1.6](https://github.com/102326/DoL-Game-UI/releases/download/v2.7.0/DolOptimizationSoftWet-Optimization-1.1.1.2-plus-v0.1.6.mod.zip) |
| ReOverfits | 4.1.1+，衣槽与商店分类 | [衣柜与商店适配 0.2.2](https://github.com/102326/DoL-Game-UI/releases/download/v2.7.0/ReOverfitsSoftWet-ReOverfits-4.1.1-plus-v0.2.2.mod.zip) |

`plus` 表示最低目标版本及以上，不表示所有后续版本和组合均已验证。

### 特定 Lyra 资源适配

- [Goose 主角色嘴部修复 0.1.1](https://github.com/102326/DoL-Game-UI/releases/download/v2.7.0/LyraMouthCompat051213-Lyra-0.5.12.13-1.0.1a-1004.1-goose-ucb-v0.1.1.mod.zip)：仅用于 Lyra `0.5.12.13-1.0.1a-1004.1-goose-ucb` / MapleBirch 5.2.3，不依赖 UI，不是通用嘴部修复。
- [旧 Lyra 衣柜嘴部包 0.1.5](https://github.com/102326/DoL-Game-UI/releases/download/v2.7.0/LyraWardrobeMouthSoftWet-Lyra-0.5.11.9-1.0.0a-0815-goose-ucb-v0.1.5.mod.zip)：仅用于 Lyra `0.5.11.9-1.0.0a-0815-goose-ucb` / DoL 0.5.11.9，UI 依赖放宽为 **2.2.2+**，可配套 2.7。资源范围和路径代码不变，**不用于 0.5.12.13**。

[SHA256SUMS.txt](https://github.com/102326/DoL-Game-UI/releases/download/v2.7.0/SHA256SUMS.txt) 是下载校验文件，无需导入游戏。

## 安装与升级

1. 升级前建议备份存档。导入主包 ZIP，**不要解压**，替换旧版同名包，只启用一个 UI 主包。
2. UI 建议放在内容 Mod 之后；普通兼容包放在 UI 和目标 Mod 之后。
3. 重启游戏。内部标识仍为 `DoLGameUI`，原有显示偏好继续保留。

关闭 Soft & Wet 总开关后直接回到原版，重新启用会恢复显示选择。各专用页面也可独立回退。衣柜操作处理中需等待结束；设置无法打开时，可在加载器中禁用 UI 并重启。

## 兼容与限制

- 继续使用 UI Runtime API v1，不改变原游戏状态与操作语义。未知私有衣槽和陌生页面结构保留原版或第三方入口。
- 不支持 Popover 的旧浏览器沿用原战斗栏固定定位，仍可能受其它页面滤镜或变换影响。
- 悬浮球是可选入口，不负责识别所有第三方浮层；出现冲突时可关闭它，不影响主要界面。
- 原版优化兼容视图沿用原节点，不提供主包的存档搜索、详情 Drawer 或存档 V2；游戏内日期仍可能由原 Mod 延迟读取。
- 不保证所有 Mod、设备和 WebView 组合。手机横屏与平板小窗口已有代表性检查，不代表所有系统分屏方式都相同。

<details>
<summary>测试范围与开发者资料</summary>

本轮通过现有 Windows / Edge 桌面发布回归；定向检查包括新旧偏好、首次及重复迁移、局部恢复、总开关回退、API v1、悬浮球开关与清理、战斗操作栏和商店说明层级，以及衣柜与商店隔离集成。Android 0.5.12.13 独立测试版补查手机 400×821 / 821×352 和平板横竖屏、520px 真实小窗口；原始现场收据和失败采样留在开发记录，不作为玩家下载附件。

战斗、商店的本轮平板证据与未改动的已有结果按影响范围复用，没有在本轮真机执行购买、回合结算或存档写入，也没有穷举第三方组合。

- [UI Runtime API](https://github.com/102326/DoL-Game-UI/blob/v2.7.0/docs/UI_RUNTIME.md)
- [兼容包说明](https://github.com/102326/DoL-Game-UI/blob/v2.7.0/docs/OPTIONAL_ADAPTERS.md)
- [2.7 开发与验证记录](https://github.com/102326/DoL-Game-UI/blob/v2.7.0/docs/VALIDATION_2.7.0.md)

</details>
