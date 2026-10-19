# Soft & Wet 3.0.3 — Kraft Work

**衣柜穿戴波纹，跟随衣物列表保持对齐。**

本次修复衣柜中的动效错位：启用原版优化叠穿后，新增的叠穿记录会撑高管理区域，原先的波纹却停在旧的屏幕位置，看起来向上偏移。现在波纹会跟随衣物列表，适应布局变化、滚动与缩放。

## 本次更新

- 修复穿戴后波纹相对衣物区域向上错位。
- 保留已认可的波纹样式、强度和持续时间。
- 保留原游戏及原版优化的穿戴、卸下、层级调整逻辑。
- 补充缩放、滚动、连续点击和清理回归，并接入现有 CI。

搭配 **DolOptimizationSoftWet 1.0.1**，衣柜会保留主装备，并分别列出同部位的叠穿衣物，支持原生卸下与换层。原版优化 1.1.2 默认关闭叠穿，需要在其设置中开启；兼容包不会强制打开。

## 更新与安装

**已安装 3.0.x 的玩家只需更新主 UI；已有对应版本的 Host 和兼容包可以沿用。** 若仍在使用原版优化兼容包 1.0.0，请同时更新到 1.0.1。

| 文件 | 用途 |
| --- | --- |
| [DoLGameUI-3.0.3.mod.zip](https://github.com/102326/DoL-Game-UI/releases/download/v3.0.3/DoLGameUI-3.0.3.mod.zip) | 主 UI，本次更新 |
| [StoneFreeHost-0.1.4-experimental.mod.zip](https://github.com/102326/DoL-Game-UI/releases/download/v3.0.3/StoneFreeHost-0.1.4-experimental.mod.zip) | Framework Host，已有原包可沿用 |

其余附件为按需安装的兼容包：ModHub、MapleBirch、Cheat Extended、ReOverfits 与指定 Lyra 嘴部资源包均沿用 1.0.0，原版优化兼容包沿用 1.0.1。没有对应目标 Mod 就无需安装。万能手机兼容仍独立开发，不包含在本次发行中。

备份存档并保留旧包，停用同身份旧 UI，导入新 ZIP 后重启；不要解压。顺序为 **Host → UI → 对应兼容包**，兼容包还应排在目标 Mod 后。每个技术身份只启用一个版本。无需转换存档或清空数据，回退时恢复保留的 UI 和配套包。

当前适配与主要验收基线为 **DoL 0.5.12.13**。需要 **ModLoader >=2.100.0、TweeReplacer >=1.0.0**；Host 要求 **>=0.1.2-experimental 且 <0.2.0**，推荐并实测 **0.1.4-experimental**。最低要求不代表所有后续版本已实测，Host 实验性协议及 Loader 预发布版本比较限制仍在。

详细步骤见[安装与回退](https://github.com/102326/DoL-Game-UI/blob/v3.0.3/docs/INSTALL_3.0.3.md)。`SHA256SUMS.txt` 可用于核对下载完整性。附件不包含游戏、APK 或第三方原 Mod。

## 验证范围与已知限制

修复已在 Android 独立测试 App 中以程序点击复验；Windows 受控浏览器覆盖 80%／100%／125% 缩放、窗口与列表内部滚动、重复穿戴和释放清理。正式版在已验证实现上更新产品版本与发行文档，具体制品对比及 CI 记录见[验证说明](https://github.com/102326/DoL-Game-UI/blob/v3.0.3/docs/KRAFT_WORK_3.0.3_VALIDATION.md)。

本轮不代表物理触控、真实 iOS、全部衣物套装或全部 Mod 组合均已验证。第三方自定义界面、历史 `selectedWardrobe` 异常、部分社区告警及长期资源变化仍沿用已披露的覆盖限制。

问题反馈请前往 [GitHub Issues](https://github.com/102326/DoL-Game-UI/issues)，提供游戏／Lyra、Loader、UI／Host、相关 Mod、设备及 WebView 版本，附复现步骤和适用的截图或日志；显示问题请注明游戏全局缩放与 UI 字体大小。不要公开上传账号凭据、敏感数据或未经许可的第三方包。

项目原创代码使用 MIT；衣柜衍生渲染及游戏 Twee 替换保留 CC BY-NC-SA 4.0 和原有署名。详见[许可与来源](https://github.com/102326/DoL-Game-UI/blob/v3.0.3/README.md#许可与来源)。
