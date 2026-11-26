# Soft & Wet 5.0 安装、升级与回退

## 新装

适配游戏版本为 DoL 0.5.12.13。使用 ModLoader 2.100.0 或更新版本，并启用 TweeReplacer 1.0.0 或更新版本。

1. 在 Loader 导入 `StoneFreeHost-1.0.0.mod.zip` 和 `DoLGameUI-5.0.0.mod.zip`，两个 ZIP 都保持原样。
2. 将 Framework Host（`StoneFreeHost`）排在主 UI（`DoLGameUI`）之前。每个技术包名只启用一份。
3. 有需要时再加下表的选装包，排在对应的目标 Mod 和主 UI 之后。重启游戏，从侧栏打开「界面设置」。

| 已经安装的内容 | 对应选装包 | 用处 |
| --- | --- | --- |
| ModHub | ModHubSoftWet | 模组管理、市场和帮助窗口外观 |
| MapleBirch | MapleBirchSoftWet | 云存档页面外观 |
| 原版优化 | DolOptimizationSoftWet | 存档页和衣柜叠穿管理 |
| Cheat Extended | CheatExtendedSoftWet | 作弊扩展界面外观；原作者版和独立维护的 rebuild.30 任选其一 |
| ReOverfits | ReOverfitsSoftWet | 在衣柜和服装店接入额外衣槽 |
| 指定 Lyra 0.5.12.13 整合环境 | LyraMouthCompat051213 | 对应版本的嘴部资源；安装前核对包名里的 Lyra 版本 |

## 从 4.5.2 升级

先保留原 Host、主 UI、正在用的选装 ZIP 和加载顺序，再通过游戏的存档导出功能备份需要的进度。在同一个游戏配置中替换 Host 和主 UI，按上面的顺序重启。继续使用原来的浏览器配置或 App，已有显示偏好与悬浮球位置保存在这里。

核对选装包的名称和版本；已装且与本批一致的包可以沿用。下载目录中的 `SHA256SUMS.txt` 可用来核对八个 ZIP。只有 Host 和主 UI 是必装项。

## 已试用早期 5.0 候选

用 1.0.0 Host 替换候选 Host，同时重新导入本批的 `DoLGameUI-5.0.0.mod.zip`。RC 与正式主 UI 的版本号和文件名相同，内容和所需 Host 版本不同。请核对本批 SHA-256，确认两项技术 ID 各只启用一份，Host 在前，然后完全关闭并重新打开游戏。曾选用已撤下的浅色预设时，更新后的界面回到默认深色；手调颜色按深色规则显示，本机字体与其他偏好保留。

## 回退到 4.5.2

停用 5.0 主 UI，恢复 `StoneFreeHost-0.1.5-experimental.mod.zip`、`DoLGameUI-4.5.2.mod.zip` 和原来使用的选装包。恢复顺序并重启，打开「界面设置」确认偏好。回退不需要清空 App、浏览器数据或存档。其它 Mod 也使用 Host 时，请先核对它们对 Host 的版本要求。[4.5.2 稳定版及原安装包](https://github.com/102326/DoL-Game-UI/releases/tag/v4.5.2)
