# Kraft Work 3.0.4 安装与回退

## 必装两包

需要基础游戏环境、`StoneFreeHost-0.1.5-experimental.mod.zip` 和 `DoLGameUI-3.0.4.mod.zip`。Host为P0修复的新版本，技术身份不变；必须同时更新Host和UI。

| 项目 | 要求与范围 |
| --- | --- |
| DoL | 当前适配与主要验收基线 0.5.12.13 |
| ModLoader | >=2.100.0；代表性实测 2.101.1 |
| TweeReplacer | >=1.0.0 |
| Framework Host | >=0.1.2-experimental 且 <0.2.0；推荐并实测 0.1.5-experimental |

最低要求允许进入相应合同检查，不表示所有更新版本已实测。Loader 的预发布比较存在限制，不承诺任意未来预发布 Host 可用。

1. 备份存档，保留旧 UI 和配套包，便于回退。
2. 停用旧 `DoLGameUI`，导入新主 UI 和所需 Host；不要解压 ZIP。
3. Host 排在 UI 前；按已安装的目标 Mod 选择兼容包，放在目标 Mod 与 UI 后。
4. 每个技术身份只启用一个版本，重启游戏后检查界面与版本。

## 可选兼容包

当前 ModHubSoftWet 与 DolOptimizationSoftWet 为 1.0.1，SmartPhoneSoftWet 为 1.1.0，其余四个为 1.0.0；没有目标 Mod 就不安装对应包。已安装旧版 ModHub 外观包的玩家，只需替换该兼容包并重启。

| 包 | 作用与目标最低声明 |
| --- | --- |
| ModHubSoftWet | ModHub >=1.3.0；本轮手机实测 1.8.0，包含管理器、帮助中心和已核对的工具菜单 |
| MapleBirchSoftWet | MapleBirch >=5.2.3；此前平板 5.5.0，云存档外观 |
| DolOptimizationSoftWet | 原版优化 >=1.1.1.2；叠穿管理主要验证官方 1.1.2、回归 1.1.1.5，保留原存档与穿戴业务 |
| CheatExtendedSoftWet | CE >=1.20.3；结构基线原作者 1.20.3.1，另接受独立维护 1.20.3.1-rebuild.30 |
| ReOverfitsSoftWet | ReOverfits >=4.1.1，额外衣槽复用主衣柜；此前平板未安装其目标 |
| LyraMouthCompat051213 | 指定 Lyra 0.5.12.13 资源环境；MapleBirch >=5.2.3 且 <6.0.0 稳定版 |
| SmartPhoneSoftWet | SmartPhone Alpha =0.3.91、UI >=3.0.2；不适用于 Omega，原手机与 PhotoPack 需另行安装 |

前五项要求 UI >=3.0.0。嘴部资源包不依赖 UI，必须核对指定资源环境。CE 原作者与 rebuild.30 同名，二选一；独立维护版单列，不代表所有作弊功能已验收。未知版本或结构无法确认时保留原界面。

## 偏好与回退

无需迁移游戏存档格式。显示偏好保存在当前浏览器或应用中，与存档分离。新偏好默认显示 Floating Hub，战斗全部展开并启用动画；已有关闭偏好保留。聚焦编辑仍可选，模式按钮会保存选择。

存档、导出／载入和已匹配云存档共用“存档管理”页头；云端业务仍由 MapleBirch 执行。

回退时停用新 UI 和相应兼容包，恢复保留的旧包并重启。其它 Mod 仍使用 Host 时保留 Host；不要清空游戏数据。停用 UI 后返回原游戏界面，不会切换到封存主题。

从[本版本发布页](https://github.com/102326/DoL-Game-UI/releases/tag/v3.0.4)下载，用同页 SHA256SUMS.txt 校验。详细支持边界见[兼容说明](OPTIONAL_ADAPTERS.md)。

## 从 3.0.x 更新

3.0.4 启动热修复需要主 UI 和 Host 0.1.5-experimental。2026-10-21 的 ModHub 兼容补丁只更新 ModHubSoftWet 至 1.0.1，不需要重复更新其它包。DolOptimizationSoftWet 保持 1.0.1，SmartPhoneSoftWet 保持 1.1.0，其余四个兼容包保持 1.0.0。

3.0.4修复Host兼容启动并增加启动诊断，保留3.0.3的波纹样式、强度及对齐修正。原版优化 1.1.2 默认关闭叠穿，请在其设置中按需启用。所有现行 UI 设计继续使用 3.X 基线。

## 启动诊断与环境

Host0.1.5不再需要AbortSignal.any，但仍需基础AbortController、MutationObserver等浏览器能力。只更新外部Chrome不保证内置WebView已更新；请以游戏实际宿主为准。UI已执行而Host缺失/协议不符/初始化失败时会显示可关闭提示；若连提示都没有，先确认Loader确实启用并注入了新UI脚本，再核对基础依赖及日志，不清空存档/应用数据。实际游戏注入与所有旧内核兼容尚未在本轮实机验收。
