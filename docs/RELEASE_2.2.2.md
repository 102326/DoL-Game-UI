# DoL Soft & Wet Game UI 2.2.2 · Crazy Diamond

这一版放宽四个官方兼容包的目标 Mod 版本限制。同一 Mod 更新后，只要版本达到最低要求、页面结构和接口仍然符合条件，就可以继续使用适配，不必每次小更新都更换兼容包。

## 主要变化

- ModHub：允许 **1.3.0 及以上**。
- MapleBirch：允许 **5.2.3 及以上**。
- 原版优化：允许 **1.1.1.2 及以上**。
- ReOverfits：允许 **4.1.1 及以上**。
- 同步加载器声明和运行时检查，保留页面结构、API 能力、衣柜数据及原版回退保护。

最低版本限制不代表后续所有版本都已验证。若未来更新改变了页面结构或接口，适配会减少或退出；确认新的兼容范围后，再更新最低版本号。

### 兼容包补充更新

ReOverfits 兼容包更新为 **0.2.2**：修正服装店首页“头套 / 外套上衣 / 外套下衣”的重复按钮边框，并恢复原分类图标。仅调整样式，原链接和购买行为不变。UI 主包继续使用 2.2.2，无需重复更新已安装的主包。

## 下载与安装

普通玩家只需 UI 主包。已使用以下兼容包时，请一并升级；新的四个兼容包需要 **UI 2.2.2 及以上**。

| 文件 | 用途 |
| --- | --- |
| `DoL-SoftWet-GameUI-2.2.2.mod.zip` | UI 主包。 |
| `ModHubSoftWet-ModHub-1.3.0-plus-v0.2.4.mod.zip` | ModHub 1.3.0 及以上的外观适配。 |
| `MapleBirchSoftWet-maplebirch-5.2.3-plus-v0.2.4.mod.zip` | MapleBirch 5.2.3 及以上的云存档外观适配。 |
| `DolOptimizationSoftWet-OriginalOptimization-1.1.1.2-plus-v0.1.5.mod.zip` | 原版优化 1.1.1.2 及以上的存档界面适配。 |
| `ReOverfitsSoftWet-ReOverfits-4.1.1-plus-v0.2.2.mod.zip` | ReOverfits 4.1.1 及以上的衣柜与商店适配，修正首页分类样式。 |
| `LyraWardrobeMouthSoftWet-Lyra-0.5.11.9-1.0.0a-0815-goose-ucb-v0.1.4.mod.zip` | 指定旧 Lyra 版本的衣柜嘴部适配，仅补充 UI 2.2.2 依赖。 |
| `LyraMouthCompat051213-Lyra-0.5.12.13-1.0.1a-1004.1-goose-ucb-v0.1.1.mod.zip` | 指定新 Lyra Goose 版本的嘴部修复，本轮未改动。 |
| `SHA256SUMS.txt` | 下载校验文件，无需导入游戏。 |

`plus` 表示目标版本及以上。兼容包不包含目标 Mod 本体，须在 UI 和目标 Mod 之后加载。

UI 主包仍适配 **DoL 0.5.11.9 / 0.5.12.13**。四个放宽的兼容包仍限定 **DoL 0.5.12.13**；本轮没有放宽游戏版本或 Lyra 嘴部包的资源版本限制。需要 ModLoader **2.100.0+** 和 TweeReplacer **1.0.0+**。

升级前建议备份存档。导入 ZIP，**不要解压**；替换旧版同名包，不要同时启用多个版本，然后重载游戏。无需改变显示偏好。

## 已知限制

- 新版本被允许尝试适配，不等于它的全部功能均已验证。目标版本低于最低要求、接口缺失或结构不匹配时保留回退。
- 原版优化存档兼容视图仍不提供 UI 搜索、详情侧栏及“存档 V2”布局。
- ReOverfits 缺失的分类图标仍使用文字标签；套装部件遵守原游戏规则。

<details>
<summary>开发者资料</summary>

从 UI 2.2.2 起，Style Adapter 和衣柜槽位扩展的 `target.versions` 支持精确版本及 `>=数字版本`。比较复用 ModLoader 的版本 API，能力缺失时不猜测匹配结果。现有精确版本调用保持不变。

- [API 使用文档](https://github.com/102326/DoL-Game-UI/blob/main/docs/UI_RUNTIME.md)
- [兼容包说明](https://github.com/102326/DoL-Game-UI/blob/main/docs/OPTIONAL_ADAPTERS.md)

</details>
