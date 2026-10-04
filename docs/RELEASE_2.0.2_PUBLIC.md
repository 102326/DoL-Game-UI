# Soft & Wet 2.0.2 正式更新报告

日期：2026-10-05。

## 适配版本

- **适配 DoL 0.5.11.X**，实际主要验证环境为原版与 Lyra **0.5.11.9**，没有逐一测试每个 0.5.11 补丁版。
- **DoL 0.5.12.13：兼容性未知，尚未验证，不保证可用。** 不在本包声明的版本范围内。
- 依赖 SugarCube 2 ModLoader **2.100.0+**、TweeReplacer **1.0.0+**。
- 当前 MapleBirch 已识别云存档界面只做外观兼容；认证、云端读写仍由原 Mod 执行，不声明所有 MapleBirch 版本兼容。

## 从 1.x 到 2.0

- 建立 Soft & Wet 材质层级：主游戏内容稳定实底；二级菜单柔雾 Acrylic；详情 Drawer 与小浮层更明确地浮起。玻璃表达空间层级，正文优先可读。
- 内部实体使用轻卡片，设置和特质优先美化原节点；普通按钮保持中性，选中使用局部 Ocean，减少整块主题色、完整亮边与厚重按钮外壳。
- 统一存档、社交、特质、统计、成就、日志、设置、商店、衣柜和战斗工具等已接管区域。服装说明保留 V1 内容与行为，只统一外观。
- 存档默认宽屏双列；开启存档 V2 才切换列表／详情布局。详情 Drawer、导入导出及已识别云界面统一材质，存档格式与原版读写逻辑不变。
- 新增可选手机紧凑按钮间距，默认关闭，保留至少 44px 点击区域；大屏不受影响。
- **“启用 Soft & Wet 2.0 界面”是总开关**：关闭直接回原版，不回到旧 1.x。重新开启恢复显示偏好与单页选择；衣柜忙碌时拒绝切换。
- **1.1.0 保留为独立 1.x LTS**，2.0 不同时维护两套主题。

## 原版与 2.0 对比

以下为同一隔离新游戏、同一 1500×1000 视口的真实页面截图；未使用用户存档。原版列为总关闭后的游戏原界面，2.0 列为 Fancy 档。游戏原文为英文，新 UI 的自有提示为中文；这不是翻译功能。材质随背景和设备变化。

### 存档管理

| 原版 | Soft & Wet 2.0.2 |
| --- | --- |
| ![原版存档管理](https://raw.githubusercontent.com/102326/DoL-Game-UI/v2.0.2/docs/screenshots/2.0.2/saves-native.png) | ![2.0.2 默认双列存档](https://raw.githubusercontent.com/102326/DoL-Game-UI/v2.0.2/docs/screenshots/2.0.2/saves-v2.png) |

新版存档详情：

![2.0.2 存档详情 Drawer](https://raw.githubusercontent.com/102326/DoL-Game-UI/v2.0.2/docs/screenshots/2.0.2/saves-detail-v2.png)

### 社交

| 原版 | Soft & Wet 2.0.2 |
| --- | --- |
| ![原版社交](https://raw.githubusercontent.com/102326/DoL-Game-UI/v2.0.2/docs/screenshots/2.0.2/social-native.png) | ![2.0.2 社交与内部轻卡片](https://raw.githubusercontent.com/102326/DoL-Game-UI/v2.0.2/docs/screenshots/2.0.2/social-v2.png) |

## 升级与回退

下载 `DoLGameUI-2.0.2.mod.zip`，在加载器中替换已有 `DoLGameUI`，不要解压，也不要同时启用多个版本。重启后从侧栏“界面设置”调整。独立旧包 `DoLMidnightTheme`、`DoLCombatUI`、`DoLShopPageExperiment` 应先禁用，避免重复接管。

界面设置保留单页回退、Smooth、关闭玻璃、减少动态；总关闭直接使用原版。若设置入口也不可用，可禁用模组并重启。偏好保存在本机，不写入游戏存档。升级前建议自行备份存档。

## 验证与边界

已有构建、单元、原版／汉化整合专项和手机／平板代表性验收；2.0.2 总开关关闭、重开、偏好恢复、原节点恢复与存档详情已在两类设备补验。复用仍有效的集中回归结果，未重复无关测试。详细范围见仓库 `docs/RELEASE_2.0.2.md` 与 `docs/RELEASE_2.0.1.md`。

正式发行仅更新文档及 GameVersion 范围，四个运行资产与已验收的 2.0.2 候选包逐字节一致，原冻结包保留。

未覆盖全部整合包、未知 DOM 修改、远程云端业务或长期 GPU／功耗／温升表现。已记录的前次 `sciencechance` 重载差异根因未解决，按用户决定暂不作为本 UI 发版阻塞项；不宣称已修复。反馈请附游戏／UI／相关 Mod 版本、设备、截图与复现步骤。
