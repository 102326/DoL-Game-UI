# 独立兼容包（Kraft Work 3.x）

当前源码的六个配套包统一为 **1.0.0**，属于本地维护候选，尚未发布。公开 v3.0.0 的附件、版本和历史验证不因此改变；玩家下载仍以正式发布页为准。

UI 负责通用界面；兼容包按目标 Mod 选装，不包含目标 Mod，也不代管其业务。视觉以 [3.x 基线](VISUAL_BASELINE_3X.md) 为准。

| 技术名 | 最低目标与必要边界 | 作用 |
| --- | --- | --- |
| ModHubSoftWet | ModHub >=1.3.0，UI >=3.0.0 | 管理器外壳、内容与按钮 |
| MapleBirchSoftWet | MapleBirch >=5.2.3，UI >=3.0.0 | 云存档外观，保留原控件及云端业务 |
| DolOptimizationSoftWet | 原版优化 >=1.1.1.2，UI >=3.0.0 | 原存档卡片、描述编辑、日期与分页 |
| CheatExtendedSoftWet | CE >=1.20.3；接口基线原作者 1.20.3.1，明确接受独立维护 rebuild.30；UI >=3.0.0 | 两级目录与控件外观，不改作弊逻辑 |
| ReOverfitsSoftWet | ReOverfits >=4.1.1，UI >=3.0.0 | 额外衣槽复用主衣柜与商店 |
| LyraMouthCompat051213 | 指定 Lyra 0.5.12.13-1.0.1a-1004.1-goose-ucb；MapleBirch >=5.2.3 <6.0.0 稳定版 | main 嘴部路径，不依赖 UI，也没有需要美化的窗口 |

当前游戏基线为 DoL 0.5.12.13。最低版本不表示全部后续版本已经实测，结构或 API 不匹配时退让。CE 原作者与 rebuild.30 技术名相同，只启用其中一个；CE-R1 与 DoLCheatReboot 不在此包范围。

## 安装与回退

先安装 Host 与 UI，每个身份只保留一个启用版本。选择需要的兼容包，放在 UI 和目标 Mod 之后加载并重启，不解压 Mod ZIP。嘴部包只需其目标环境，不强加 UI 依赖。

停用外观包并重启可撤销外观；关闭 UI 总开关也会撤销活动适配。MapleBirch 云端操作、ModHub 安装管理、CE 作弊、原版优化存读档仍由原控件与事件管理。不要通过清空游戏数据回退。

原版优化兼容视图保留其原卡片和分页，不开启主 UI 搜索、详情抽屉或 V2 双栏；主 UI 的相应偏好保持不变。旧 Lyra 0.5.11.9 专用包封存，不进入当前构建和安装组合。

## 开发与验证

自有入口位于 `compat/`，仅通过类型引用公共合同，不捆绑第二份 Runtime。例如 `python scripts/package-adapter.py compat/modhub-soft-wet` 会生成该目录下的 `dist/` ZIP 与校验清单。

1.0.0 四个外观包对齐当前 Acrylic、内容层及按钮；ReOverfits 的界面由主 UI 提供。嘴部包恢复本树此前遗漏的已公开 0.1.2 版本门槛，资源路径不变，不把 1.0.0 号当作扩大支持范围的依据。

当前用例与现场覆盖见 [本地维护验证](KRAFT_WORK_3X_MAINTENANCE_20261019.md)。旧发行和早期实验的范围见 [历史兼容说明](archive/OPTIONAL_ADAPTERS_PRE_1.0.0.md)，不得把旧包真机结果写成新包已安装验收。
