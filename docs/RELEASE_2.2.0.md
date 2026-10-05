# DoL Soft & Wet Game UI 2.2.0 · Crazy Diamond

这一版沿用 2.1 的界面布局和柔雾玻璃风格，主要整理了内部代码与兼容包，方便后续维护。游戏规则、存档格式和安装方式保持不变。

## 主要变化

- 正式名称统一为 **DoL Soft & Wet Game UI**，短称 **Soft & Wet UI** 或 **Soft & Wet**。主包文件名也已更新，可以直接替换旧版。
- 自有代码和官方兼容包统一使用 TypeScript，玩家无需安装额外工具。
- 为 Mod 作者补充 API 类型声明和接入示例。
- 兼容包继续独立选装，按已安装的 Mod 选择即可。

## 下载哪个文件

普通玩家只需下载 **UI 主包**。其余兼容包按需安装，不需要全部下载。

| 文件 | 用途 |
| --- | --- |
| `DoL-SoftWet-GameUI-2.2.0.mod.zip` | **UI 主包**，替换已有的旧版 UI。 |
| `ModHubSoftWet-ModHub-1.3.0-v0.2.2.mod.zip` | 使用 ModHub 1.3.0 时选装，统一模组管理页面外观。 |
| `MapleBirchSoftWet-maplebirch-5.2.3-v0.2.2.mod.zip` | 使用 MapleBirch 5.2.3 时选装，调整云存档页面外观。 |
| `DolOptimizationSoftWet-OriginalOptimization-1.1.1.2-v0.1.3.mod.zip` | 使用原版优化 1.1.1.2 时选装，兼容它的存档列表和额外信息。 |
| `LyraMouthCompat051213-Lyra-0.5.12.13-1.0.1a-1004.1-goose-ucb-v0.1.1.mod.zip` | 修复指定 0.5.12.13 Lyra Goose 版本的嘴部显示，可独立使用。 |
| `LyraWardrobeMouthSoftWet-Lyra-0.5.11.9-1.0.0a-0815-goose-ucb-v0.1.2.mod.zip` | 指定 0.5.11.9 Lyra 版本的衣柜嘴部适配，不用于 0.5.12.13。 |
| `SHA256SUMS.txt` | 下载文件的完整性校验，无需导入游戏。 |

## 安装与兼容

适配 DoL **0.5.11.9 / 0.5.12.13**，需要 ModLoader **2.100.0+**、TweeReplacer **1.0.0+**。

1. 升级前建议备份存档。
2. 在模组管理器中导入 ZIP，**不要解压**。
3. 替换已有的旧版 UI，不要同时启用多个版本。
4. 如已使用兼容包，请一并更新为上表对应版本，然后重载游戏。

兼容包只针对文件名中标明的目标版本，其它版本不保证兼容。

在界面设置中关闭 Soft & Wet 总开关后，可直接使用原版界面。重新开启时会保留显示偏好。

## 已知限制

使用原版优化兼容包时，存档页会保留它的双列列表、扩展日期、描述编辑和分页；暂不提供 UI 搜索、详情侧栏和“存档 V2”布局。禁用该兼容包后恢复主包的存档界面。

<details>
<summary>开发者资料</summary>

制作其它 Mod 的作者可通过 API 复用主题、弹窗和外观适配能力。接入前请先确认当前 UI 版本支持所需功能；类型声明用于辅助开发，实际运行时仍需检查。普通玩家无需配置这些接口。

- [API 使用文档](UI_RUNTIME.md)
- [接入示例](../examples/ui-surfaces/README.md)
- [类型声明源码](../src/public/ui.ts)
- [兼容包说明](OPTIONAL_ADAPTERS.md)

</details>
