# Evolution 候选：安装、升级与回退

本指南用于研发验收，尚未正式发布。目标产品为 Soft & Wet 4.0 — Evolution；当前冻结包的技术版本仍是 UI 3.0.4 和 Host 0.1.5-experimental。请按[冻结身份](evolution/EVO-PRERELEASE-PACKAGES-2026-10-24.json)核对文件，不能只凭版本号区分公开版和研究版。

## 安装

1. 备份需要保留的存档，并保存原 UI、Host、兼容包及加载顺序。
2. 停用旧的同名 UI，导入本轮核对的 Host 与主 UI ZIP，无需解压。
3. Host 放在 UI 前。按已有目标 Mod 选装兼容包，放在目标 Mod 与 UI 后；每个技术名只启用一个版本。
4. 重启后确认设置入口、Hub 和所需页面可用，再读取测试进度。验收阶段优先使用独立测试 App。

| 环境 | 要求与当前验收范围 |
| --- | --- |
| DoL | 当前包合同与测试基线为 0.5.12.13 |
| ModLoader / TweeReplacer | 最低声明 >=2.100.0 / >=1.0.0；本轮代表环境为 2.101.1 / 1.7.0 |
| Framework Host | >=0.1.2-experimental 且 <0.2.0；本轮使用 0.1.5-experimental |
| 平台 | Android 平板 WebView 与 Windows Edge 代表界面；完整边界见验证报告 |

最低版本和结构合同共同决定是否适配，不保证任意未来版本或预发布版本都兼容。不需要为安装 UI 更新所有无关 Mod。

## 可选兼容包

| 包 | 作用与当前核对范围 |
| --- | --- |
| ModHubSoftWet | 管理器、市场、说明、日志、帮助及已识别工具浮层；本轮 1.8.3 |
| MapleBirchSoftWet | 云存档页面外观；本轮 5.5.4，云端业务仍由原 Mod 管理 |
| DolOptimizationSoftWet | 存档与原叠穿管理；本轮原版优化 1.1.2.1 |
| SmartPhoneSoftWet | 原 SmartPhone Alpha 外壳和已识别组件；接受 0.3.91 / 0.3.91.1，不适用于 Omega |
| CheatExtendedSoftWet | 原作者 CE 与已单列支持的 rebuild.30 外观；当前设备保留 rebuild.30，二者只能启用一个 |
| ReOverfitsSoftWet | 额外衣槽；本轮未安装目标，未作新实机声明 |
| LyraMouthCompat051213 | 指定 Lyra 0.5.12.13 嘴部资源适配，须核对资源环境与 MapleBirch 范围 |

具体候选版本和依赖以冻结 JSON 及 ZIP 的 boot.json 为准。除嘴部资源包外，通常还需要 UI；SmartPhone 要求 UI >=3.0.2，其它外观包沿用已有最低合同。没有目标 Mod 就不安装对应包；主 Mod 与 PhotoPack 另行获取，本候选不打包第三方主 Mod。

原版优化叠穿是否开启由其原设置决定，兼容包不强制开启。已识别的叠穿项目、顺序和卸下操作使用作者原逻辑。

## 偏好与回退

显示偏好保存在浏览器或 App 内，已有选择保留；新偏好默认显示 Hub、开启动画、战斗全部平铺，聚焦编辑仍可选。游戏存档格式不由 UI 迁移。

回退时停用候选 UI 与相应兼容包，恢复原来保存的包和加载顺序，再重启。其它 Mod 仍依赖 Host 时保留它。不要清空存档或整个 App 数据。

当前研究包和公开 UI 可能显示相同技术版本但字节不同。ModHub 的“一键更新全部”可能把研究 UI 换回公开包；本轮只更新已确认的四个目标，不用公开 UI 覆盖候选。

最终公开版的版本号、下载链接与安装图将在负责人批准发布后按实际制品填写。技术报告、源码身份、原始测试资料不混入玩家 Assets；截图与视频放页面展示区。
