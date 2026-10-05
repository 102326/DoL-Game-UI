# DoL Soft & Wet Game UI 2.2.1 · Crazy Diamond

这一版主要补充 ReOverfits 的衣柜与商店兼容，沿用现有界面风格。UI 主包仍适配 DoL **0.5.11.9 / 0.5.12.13**；ReOverfits 兼容包针对 **ReOverfits 4.1.1 + DoL 0.5.12.13**。

## 主要变化

- 安装 ReOverfits 兼容包后，外层头饰、外套上装和外套下装可以使用新版衣柜的分类、卡片、搜索、详情、预览和整理功能。
- 修正图片加载器环境下商店分类入口的识别，外层服装入口也使用现有分类布局。
- 新增衣柜槽位扩展 API，供服装 Mod 接入原生已有的槽位。
- 更新官方可选兼容包的 UI 版本声明，避免升级主包后出现旧依赖警告。

购买、穿脱、剪开等操作继续由原游戏和对应 Mod 执行，不改变存档格式或服装规则。

## 下载与安装

普通玩家下载 **UI 主包**即可。使用 ReOverfits 时，还需安装下表的 ReOverfits 兼容包；其它包按实际使用的 Mod 选择，不需要全部下载。

| 文件 | 用途 |
| --- | --- |
| `DoL-SoftWet-GameUI-2.2.1.mod.zip` | **UI 主包**，替换旧版 UI。 |
| `ReOverfitsSoftWet-ReOverfits-4.1.1-v0.2.0.mod.zip` | ReOverfits 4.1.1 衣柜与商店兼容，需要 UI 2.2.1；不包含 ReOverfits 本体。 |
| `ModHubSoftWet-ModHub-1.3.0-v0.2.3.mod.zip` | ModHub 1.3.0 外观兼容。 |
| `MapleBirchSoftWet-maplebirch-5.2.3-v0.2.3.mod.zip` | MapleBirch 5.2.3 云存档外观兼容。 |
| `DolOptimizationSoftWet-OriginalOptimization-1.1.1.2-v0.1.4.mod.zip` | 原版优化 1.1.1.2 存档界面兼容。 |
| `LyraMouthCompat051213-Lyra-0.5.12.13-1.0.1a-1004.1-goose-ucb-v0.1.1.mod.zip` | 指定 0.5.12.13 Lyra Goose 版本的嘴部修复，可独立使用。 |
| `LyraWardrobeMouthSoftWet-Lyra-0.5.11.9-1.0.0a-0815-goose-ucb-v0.1.3.mod.zip` | 指定 0.5.11.9 Lyra 版本的衣柜嘴部适配，不用于 0.5.12.13。 |
| `SHA256SUMS.txt` | 下载文件校验，无需导入游戏。 |

需要 ModLoader **2.100.0+**、TweeReplacer **1.0.0+**。升级前建议备份存档。导入 ZIP，**不要解压**；替换旧版同名包，不要同时启用多个版本，然后重载游戏。已安装官方兼容包时，请一并更新为上表对应版本。

ReOverfits 兼容包在 UI 主包和 ReOverfits 之后加载。它不能搭配 UI 2.2.0，也不保证其它 ReOverfits 版本兼容。关闭 Soft & Wet 总开关后仍可使用原版界面。

## 已知限制

- ReOverfits 分类图标在已验证环境中未正常加载，兼容包使用文字分类；缺图服装沿用“衣物”占位。
- 完整套装的关联部件遵守原规则，剪开后可作为独立卡片显示。
- 原版优化存档兼容视图保留原列表、描述编辑和分页，暂不提供 UI 搜索、详情侧栏和“存档 V2”布局。
- 测试中曾出现原游戏天气横幅回调报错，后续同场景未再出现，原因尚未确认，本版未修复该问题。

<details>
<summary>开发者资料</summary>

Mod 作者可使用衣柜槽位扩展 API，为游戏中已有的服装槽位添加分类名称。库存和穿脱操作仍由原游戏及对应 Mod 处理。

调用前确认当前版本支持需要的接口；具体用法见下方文档。普通玩家无需配置 API。

- [API 使用文档](https://github.com/102326/DoL-Game-UI/blob/main/docs/UI_RUNTIME.md)
- [衣柜 API 类型](https://github.com/102326/DoL-Game-UI/blob/main/src/public/wardrobe.ts)
- [ReOverfits 兼容包源码与说明](https://github.com/102326/DoL-Game-UI/tree/main/compat/reoverfits-soft-wet)
- [其它兼容包说明](https://github.com/102326/DoL-Game-UI/blob/main/docs/OPTIONAL_ADAPTERS.md)

</details>
