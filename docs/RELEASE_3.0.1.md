# Soft & Wet 3.0.1 — Kraft Work

**黑灰 Acrylic，连贯的界面，更顺手的操作。**

本次更新补齐存档与 Mod 窗口的视觉统一，修复 ModHub 排版和战斗聚焦滚动，并统一配套兼容包。游戏的穿戴、购买、存读档及战斗规则保持原有路径。

## 本次更新

### 战斗：默认全部展开，聚焦也能顺畅滚动

- 新偏好默认开启战斗界面与动画，全部原生动作平铺展开。
- “全部展开／聚焦编辑”会保存选择，避免下次打开又回到聚焦。
- 聚焦编辑恢复正常上下翻页，保留原动作控件、选择与继续按钮。
- 修复口部动作下拉框文字和箭头挤压。在支持的引擎中使用深色 Acrylic 原生菜单；不支持的 WebView 保留系统选择器。

聚焦编辑仍是可选模式；已有关闭偏好不会被覆盖。

### 存档：三页统一，底部操作可达

存档、导出／载入及已匹配的 MapleBirch 云存档共用“存档管理”页头。导出页移除旧灰色叠层，文件、存档码和操作按钮同步当前材质。

修复低高度窗口中内容撑出视口、底部操作无法滚动到达的问题。原版优化仍保留自己的卡片、描述编辑和槽位操作；云端业务由 MapleBirch 处理。

![Kraft Work 3.0.1 存档管理与导出／载入](https://raw.githubusercontent.com/102326/DoL-Game-UI/v3.0.1/docs/media/3.0.1/KraftWork-3.0.1-transfer.png)

### ModHub 与配套兼容包

- 修正更新提示文字被压成竖列、管理按钮挤压和滚动内容穿过工具栏的问题。
- 补齐帮助中心、统计卡片和已核对的“更多工具”菜单外观。
- 六个当前兼容包统一为 **1.0.0**，按自己安装的 Mod 选装。
- 本轮平板复验基于 **ModHub 1.7.6、MapleBirch 5.5.0、原版优化 1.1.1.5、CE rebuild.30**；最低依赖保持范围声明，不锁死为这些实测版本。

CE 主要面向原作者版，并单列支持独立维护的 rebuild.30。两者技术名相同，只能启用一个。外观兼容不代表全部作弊或管理业务都已穷举测试。

### 统一的 3.X 基线

公共窗口和普通控件的默认兼容展示使用 Kraft Work 3.X。日志中的 Mod 页签等内容可继承当前外壳与控件外观；旧 1.X／2.X 视觉来源封存，不再作为运行主题或默认回退。

保留当前衣柜、商店、天气与空间交互。Floating Hub 新偏好默认显示，可在“界面设置 → 入口”关闭；已有隐藏选择保留。持续集成只检查与构建，不自动发布。

## 下载与安装

**必装：主 UI + Framework Host。不要解压 `.mod.zip`。**

| 文件 | 用途 |
| --- | --- |
| [DoLGameUI-3.0.1.mod.zip](https://github.com/102326/DoL-Game-UI/releases/download/v3.0.1/DoLGameUI-3.0.1.mod.zip) | 主 UI |
| [StoneFreeHost-0.1.4-experimental.mod.zip](https://github.com/102326/DoL-Game-UI/releases/download/v3.0.1/StoneFreeHost-0.1.4-experimental.mod.zip) | Framework Host；已安装此原包可沿用 |

可选附件按目标 Mod 选择：**ModHubSoftWet、MapleBirchSoftWet、DolOptimizationSoftWet、CheatExtendedSoftWet、ReOverfitsSoftWet、LyraMouthCompat051213**。不包含游戏本体、APK 或第三方原 Mod。`SHA256SUMS.txt` 用于核对下载完整性。

当前游戏适配基线 **DoL 0.5.12.13**；需要 **ModLoader >=2.100.0、TweeReplacer >=1.0.0**。Host 要求 **>=0.1.2-experimental 且 <0.2.0**，推荐 0.1.4-experimental。最低要求不代表所有后续版本已实测，Host 协议仍为实验性，Loader 的预发布比较限制仍在。

备份存档与旧包，停用同身份旧版本，按 **Host → UI → 对应兼容包** 的顺序导入并重启；兼容包也应排在目标 Mod 后。无需清除游戏数据或转换存档。回退时恢复保留的 UI 和配套包即可，其它 Mod 使用 Host 时保留 Host。

详细版本、安装与回退见[安装指南](https://github.com/102326/DoL-Game-UI/blob/v3.0.1/docs/INSTALL_3.0.1.md)。

## 已知限制与反馈

- 系统选择器能否使用自定义外观取决于浏览器／WebView；当前优先适配已核对的战斗口部动作下拉框。
- 2K／平板尺寸的存档布局经过 Windows 受控回归；真实 iPad Safari 尚未复验。
- 本轮 Android 检查是实际 WebView 中的程序控制与合成触控，不是物理手指输入；不代表所有回合、商品、云服务或作弊功能已测试。
- `selectedWardrobe` 历史异常、部分社区告警和长期资源变化中尚未归因的部分继续保留。第三方自定义组件不保证自动美化。

反馈请前往 [GitHub Issues](https://github.com/102326/DoL-Game-UI/issues)，附游戏／Lyra、Loader、UI／Host、相关 Mod 版本、系统与 WebView、复现步骤及截图或日志。不要公开上传私人存档、账号信息或未经许可的第三方包。

感谢原项目、上游渲染器与依赖作者。许可证和必要署名随运行包保留；[完整验证范围](https://github.com/102326/DoL-Game-UI/blob/v3.0.1/docs/KRAFT_WORK_3.0.1_TABLET_COMPAT_20261019.md)放在仓库，发行附件只提供玩家需要的文件。
