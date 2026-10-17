# R15：社区组合挑战准备

2026-10-17。来源为平板独立测试版、安装 R15 前的 `modUtils.getModListNameNoAlias()` 公开清单，收据 `tests/artifacts/stone-free-r15/android-1792236606459/result.json`。这是当时已加载的元数据，不是作者最新版本调查，也不是全部已导入/启用包的权威持久清单。原始包来源、原始 ZIP SHA 及作者发布身份没有因此得到证明。

本轮原生存读档检查临时启用 Host / NativeStatus / 官方 UI / TweeReplacer 的选定清单，最后恢复原列表。下面这些社区 Mod **未因此完成 lab15 混装行为验收**。基础整合仍可能内嵌 Loader 支持 Mod，不能将测试环境称为绝对纯原版。

## 已有、可追踪的候选起点

依赖和插件列只抄录当前 boot 声明；不能用它们证明 Patch/Hook 已实际执行或所有传递依赖已被正确解析。SDK/Loader 自带插件不按独立社区内容 Mod 凑数量。

| 名称 | 现场版本 | 声明依赖 | 声明插件目标 |
| --- | --- | --- | --- |
| TweeReplacer | 1.7.0 | ModLoader ^2.60.1 | ConflictChecker |
| ReplacePatcher | 1.3.0 | ModLoader ^2.31.2 | 无声明 |
| ModdedClothesAddon | 1.6.3 | ModLoader ^1.6.1 || ^2.0.0; TweeReplacer ^1.0.0; ReplacePatcher ^1.0.0; ModLoader DoL ImageLoaderHook ^2.3.0 | TweeReplacer, ImageLoaderHook2BeautySelectorAddon |
| ModLoader DoL ImageLoaderHook | 2.101.0 | ModLoader ^2.100.0; GameVersion >=0.5.6 | 无声明 |
| BeautySelectorAddon | 2.9.0 | ModLoader ^2.33.0; ImageLoaderHook ^2.22.0; ModLoaderGui ^1.6.0; ModSubUiAngularJs ^1.1.0 | 无声明 |
| ModHub | 1.7.0 | TweeReplacer ^1.0.0 | TweeReplacer |
| maplebirch | 5.4.3 | ModLoader >=2.0.0; ModLoaderGui >=1.0.0; ModSubUiAngularJs >=1.0.0; ConflictChecker >=1.0.0; BeautySelectorAddon >=2.0.0; ReplacePatcher >=1.0.0; TweeReplacer >=1.0.0; GameVersion >=0.5.12.13 | 无声明 |
| cheat extended | 1.20.3.1-rebuild.28 | ModLoader >=2.17.0; TweeReplacer >=1.0.0; ReplacePatcher >=1.0.0; GameVersion >=0.5.12.13; maplebirch >=3.2.5 | TweeReplacer, ReplacePatcher |
| 特姿拓展 | 1.2.2 | SweetAlert2Mod ^1.0.0; maplebirch >=3.0.15 | ReplacePatcher |
| 银商启动 | 1.5.6 | ModLoader ^2.16.11 | ModdedClothesAddon, BeautySelectorAddon, TweeReplacer |
| 美化修正 | 1.0.1 | 未声明 | TweeReplacer |
| 原版优化 | 1.1.1.5 | TweeReplacer ^1.0.0; BeautySelectorAddon ^2.0.0; maplebirch >=2.0.0 | TweeReplacer, ReplacePatcher, BeautySelectorAddon |
| CombatStatusDisplay-Lyra | 1.0.1 | TweeReplacer ^1.2.0 | TweeReplacer |
| ModHubSoftWet | 0.2.4 | ModHub >=1.3.0; DoLGameUI >=2.2.2; GameVersion =0.5.12.13 | 无声明 |
| MapleBirchSoftWet | 0.2.4 | maplebirch >=5.2.3; DoLGameUI >=2.2.2; GameVersion =0.5.12.13 | 无声明 |
| DolOptimizationSoftWet | 0.1.6-rc.1 | 原版优化 >=1.1.1.2; DoLGameUI >=2.2.2; GameVersion =0.5.12.13 | 无声明 |

`Lyra` 现场标识为 `0.5.12.13-1.0.1a-1004.1-goose-ucb`，官方旧 UI 为 2.7.0。LyraMouthCompat051213 0.1.2 另有精确 Lyra/GameVersion 和 MapleBirch 范围依赖，保留为条件性美化覆盖，不为凑规模强装。当前清单没有可确认身份的独立剧情 Mod；剧情及更复杂服装/战斗扩展候选为 Unknown，等合法、可核对的实际包。

## 机制与初步检查点

| 机制 | 固定输入候选 | 后续最小观察 |
| --- | --- | --- |
| TweeReplacer / Widget / Passage | TweeReplacer、原版优化、Cheat Extended、CombatStatusDisplay-Lyra | 先定位真实补丁及目标版本；检查原生菜单/行动，不能只看静态冲突 |
| ReplacePatcher / Hook | ReplacePatcher、maplebirch、特姿拓展、原版优化 | 在已固定包上查声明与实际钩子；不全局拦截 DOM 写入 |
| 服装定义/库存/资源 | ModdedClothesAddon、银商启动、美化修正 | 类别发现、原列表、原操作、未知回退分别记结果 |
| DOM/CSS/自定义菜单 | ModHub、官方可选外观包 | 原按钮、焦点、关闭和层级；原业务仍由来源拥有 |
| 存档结构/扩展 | 原版优化及其外观包 | 额外字段可见性、原槽位身份、回退与同一测试槽读回 |
| 依赖/生命周期 | 上述已知链和 Host 精确配对 | Loader 报告与实际入口分别观察；单消费者退出不影响其它来源 |

这些是候选风险交叉点，不是本轮已复现缺陷。不能把 boot 插件声明直接写成“冲突已调查/修复/学习”。

## A / B / C / D 的固定方法

- A：固定游戏 HTML/APK、Loader 和最小有效依赖。记录内嵌项，建立独立新测试初态。
- B：相同 A 加明确配对 Host/UI；需要时增加 Host-only 以区分归属。
- C：同一宿主、固定社区 ZIP 清单与装配顺序；保存每包来源、SHA、技术名、版本、依赖和插件声明。
- D：复制 C 的同一初态，再加 Host/UI；官方旧 UI 与研究 UI 不同时启用，第三方包保持一致。

执行前只需一个现有 JSON 清单与原生备份，不新建兼容数据库。版本、资源和初态不同的两次游戏不能作严格 A/B。每组记录实际执行清单、关键业务前后结果、未知内容、Console 与恢复读回。一次失败先归属到原版/第三方/UI/环境/工具/Unknown，不通过禁用发生问题的 Mod 将 D 宣称通过。

## 本轮结束点 / Additional coverage

候选及声明来源、机制覆盖、四组方法已整理。还没有建立带原始发行 SHA 的完整 C 清单，也没有运行四组矩阵；因此不宣称“16 个 Mod 兼容通过”。15–20 个组合是未来覆盖规模，不阻塞 R15。未联网搜新包、未修改第三方发行包、未在正式 App 安装，未推进停止的自研 Mod 管理器。
