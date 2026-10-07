# DoL Soft & Wet Game UI 2.2.2 — Crazy Diamond

这次主要放宽四个官方兼容包对目标 Mod 的版本限制，减少小版本更新后必须重新发布兼容包的情况；仍保留页面结构、接口和数据检查。另补充 ReOverfits 兼容包的首页分类样式修正，**不是一次大型 UI 功能更新**。

**普通玩家只需 UI 主包。使用对应第三方 Mod 时，再选装相应兼容包，不需要全部安装。**

## 哪些需要更新

- **UI 主包：2.2.2**，增加兼容包所需的最低版本匹配能力。使用新兼容包时，旧 UI 用户需一并升级；已安装 UI 2.2.2 的用户不用重复下载主包。
- **ModHub 0.2.4 / MapleBirch 0.2.4 / 原版优化 0.1.5 / ReOverfits 0.2.2**：放宽目标 Mod 范围，均需 UI **2.2.2+**。已安装相应旧兼容包时，替换为下方版本。
- **ReOverfits 补充修正 0.2.2**：移除服装店首页“头套 / 外套上衣 / 外套下衣”卡片内的重复按钮边框，恢复原分类图标；原链接与购买行为不变。仅装了兼容包 0.2.1 时，更新这个包即可。
- **旧 Lyra 衣柜嘴部包 0.1.4**：仅补充 UI 2.2.2 依赖，资源适配范围不变。**新 Lyra 主角色嘴部修复 0.1.1** 本次未修改，不依赖 UI，不用因本次更新重复安装。

## 下载

### UI 主包

**[下载 Soft & Wet UI 2.2.2](https://github.com/102326/DoL-Game-UI/releases/download/v2.2.2/DoL-SoftWet-GameUI-2.2.2.mod.zip)**

文件：`DoL-SoftWet-GameUI-2.2.2.mod.zip`。支持 **DoL 0.5.11.9 / 0.5.12.13**，需要 ModLoader **2.100.0+**、TweeReplacer **1.0.0+**。

### 官方兼容包：按目标 Mod 选装

下列四包只用于 **DoL 0.5.12.13**，需 UI **2.2.2+**；不包含目标 Mod 本体。

| 你使用的 Mod | 最低目标版本与用途 | 下载 |
| --- | --- | --- |
| ModHub | **1.3.0+**，管理器外观 | [外观包 0.2.4](https://github.com/102326/DoL-Game-UI/releases/download/v2.2.2/ModHubSoftWet-ModHub-1.3.0-plus-v0.2.4.mod.zip) |
| MapleBirch | **5.2.3+**，云存档外观 | [外观包 0.2.4](https://github.com/102326/DoL-Game-UI/releases/download/v2.2.2/MapleBirchSoftWet-maplebirch-5.2.3-plus-v0.2.4.mod.zip) |
| 原版优化 | **1.1.1.2+**，存档界面 | [存档适配 0.1.5](https://github.com/102326/DoL-Game-UI/releases/download/v2.2.2/DolOptimizationSoftWet-OriginalOptimization-1.1.1.2-plus-v0.1.5.mod.zip) |
| ReOverfits | **4.1.1+**，衣柜槽位与商店分类 | [衣柜与商店适配 0.2.2](https://github.com/102326/DoL-Game-UI/releases/download/v2.2.2/ReOverfitsSoftWet-ReOverfits-4.1.1-plus-v0.2.2.mod.zip) |

文件名中的 `plus` 表示最低目标版本及以上，**不代表全部未来版本已验证**。

### 特定 Lyra 版本适配：不要跨版本安装

- **旧版衣柜嘴部适配**：[下载 0.1.4](https://github.com/102326/DoL-Game-UI/releases/download/v2.2.2/LyraWardrobeMouthSoftWet-Lyra-0.5.11.9-1.0.0a-0815-goose-ucb-v0.1.4.mod.zip)。仅用于 **Lyra `0.5.11.9-1.0.0a-0815-goose-ucb`**，支持 UI 2.2.2；**不用于 0.5.12.13**。
- **新版 Goose 主角色嘴部修复**：[下载 0.1.1](https://github.com/102326/DoL-Game-UI/releases/download/v2.2.2/LyraMouthCompat051213-Lyra-0.5.12.13-1.0.1a-1004.1-goose-ucb-v0.1.1.mod.zip)。仅用于 **Lyra `0.5.12.13-1.0.1a-1004.1-goose-ucb` / MapleBirch 5.2.3**，不依赖 UI。

### 校验文件

[SHA256SUMS.txt](https://github.com/102326/DoL-Game-UI/releases/download/v2.2.2/SHA256SUMS.txt) 用于核对下载文件，**无需导入游戏**。完整兼容条件见 [独立兼容包说明](https://github.com/102326/DoL-Game-UI/blob/main/docs/OPTIONAL_ADAPTERS.md)。

## 安装与升级

1. 升级前建议备份存档。导入 ZIP，**不要解压**，替换旧版同名包，不要同时启用多个版本。
2. UI 建议在内容 Mod 之后加载；普通兼容包在 UI 和目标 Mod 之后加载。旧 Lyra 衣柜包使用提前注入，按其安装说明设置。
3. 重启游戏。无需重新设置显示偏好；遇到界面问题，可关闭对应新版页面或回退原版。设置无法打开时，在加载器中禁用 UI 并重启。

## 图标与兼容限制

- **首页与商品列表不同**：ReOverfits 商店首页的三项外层分类已恢复原资源图标；商品列表中，对应的无文字图标分类按钮仍改用**文字标签**。这不是首页图标仍被隐藏，也不表示兼容包提供或修复了所有缺失图片。
- **版本达到最低要求，只代表可以尝试适配**。页面结构、API 或数据不匹配时，适配可能减少或退出；不保证全部整合包与 Mod 组合。
- **原版优化存档兼容视图**目前不提供 UI 搜索、详情侧栏和“存档 V2”布局。
- ReOverfits 的套装与剪开部件仍遵守原游戏规则。指定 Lyra 嘴部包的资源范围没有放宽，不能当成通用嘴部修复。

<details>
<summary>Mod 作者与开发者资料</summary>

从 UI 2.2.2 起，Style Adapter 和衣柜槽位扩展的 `target.versions` 支持精确版本及 `>=数字版本`。比较复用 ModLoader 的版本 API，能力缺失时不猜测匹配结果；现有精确版本调用保持不变。

- [UI Runtime API](https://github.com/102326/DoL-Game-UI/blob/main/docs/UI_RUNTIME.md)
- [Adapter 与兼容边界](https://github.com/102326/DoL-Game-UI/blob/main/docs/OPTIONAL_ADAPTERS.md)

ReOverfits 兼容包补丁源码：[ad517a1](https://github.com/102326/DoL-Game-UI/commit/ad517a17cc876568a9ca3e6f67c6f340f973f462)。UI 主包和原发布标签保持不变。

</details>
