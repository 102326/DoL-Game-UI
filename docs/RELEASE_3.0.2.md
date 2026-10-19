# Soft & Wet 3.0.2 — Kraft Work

**缩放之后，设置窗口也能保持完整。**

本次是手机设置界面的修复更新。调整游戏内“全局缩放”后，设置窗口的玻璃背景可能比内容缩小一圈，部分控件落在外壳之外，背景点击遮罩也无法覆盖整个画面。3.0.2 修复了这组错位问题，保留现有黑灰 Acrylic、双布局、原设置控件和动态效果。

## 本次更新

### 10 月 20 日兼容包补充：原版优化叠穿管理

**DolOptimizationSoftWet 1.0.1** 在衣柜接入原版优化的叠加装备列表、卸下和层级调整，使用已加载 Mod 的原控件及事件，展示同步 Kraft Work 3.X。主要验证作者最新正式版 [原版优化 v1.1.2](https://github.com/ANLINSTUDIO/Degrees-of-Lewdity-DolOptimization/releases/tag/v1.1.2)，并回归固定 1.1.1.5。

原版优化 v1.1.2 将叠穿默认关闭，请在其设置中自行启用；兼容包不强制开启。已有原版优化兼容包的玩家停用旧同名包，导入 1.0.1 并重启即可。本次补充只更新该兼容包和校验清单，主 UI、Host 及其它附件不变。未知模板退回原版及扩展信息入口。

### 设置：外壳、内容与点击范围保持对齐

- 修复游戏全局缩放造成的玻璃外壳重复缩放。
- 设置打开时，点击遮罩覆盖完整视口，阻挡背后游戏操作。
- 限制窗口和内部布局的可用尺寸，长内容仍可向下滚动。
- 保留上下／左右布局选择、字号偏好、原控件操作和关闭后的清理。

游戏的“全局缩放”与 UI 的“字体大小”是两个独立设置。本轮在真实 Android 手机中通过全局缩放重现并复验；不需要清空偏好或游戏数据。

### 3.X 是当前统一设计基线

所有现行 UI 设计、默认兼容展示和后续外观维护统一以 Kraft Work 3.X 为准。1.X／2.X 设计仅封存用于追溯，不再作为运行主题或设计来源。原游戏回退、配置迁移和已有兼容逻辑继续保留。

### 持续集成

类型、Framework 合同、业务、动效、兼容及安装包检查继续运行。本次也修复 Windows 历史回归测试的路径匹配，使旧错误实现能够被正确注入并拒绝。持续集成只检查和构建，不自动发布。

## 下载与安装

**必装：主 UI + Framework Host。不要解压 `.mod.zip`。**

| 文件 | 用途 |
| --- | --- |
| [DoLGameUI-3.0.2.mod.zip](https://github.com/102326/DoL-Game-UI/releases/download/v3.0.2/DoLGameUI-3.0.2.mod.zip) | 主 UI，本次更新 |
| [StoneFreeHost-0.1.4-experimental.mod.zip](https://github.com/102326/DoL-Game-UI/releases/download/v3.0.2/StoneFreeHost-0.1.4-experimental.mod.zip) | Framework Host，已有此原包可沿用 |

可选兼容包按已安装的目标 Mod 选择：DolOptimizationSoftWet 为 **1.0.1**；ModHubSoftWet、MapleBirchSoftWet、CheatExtendedSoftWet、ReOverfitsSoftWet、LyraMouthCompat051213 维持 **1.0.0** 原包。没有对应目标 Mod 就无需安装。附件不含游戏本体、APK 或第三方原 Mod。`SHA256SUMS.txt` 用于核对下载完整性；本次补充的业务结果来自隔离 Windows 真实游戏／Loader，不冒充 Android／iOS 实测。

当前游戏适配基线为 **DoL 0.5.12.13**；需要 **ModLoader >=2.100.0、TweeReplacer >=1.0.0**。Host 要求 **>=0.1.2-experimental 且 <0.2.0**，推荐 0.1.4-experimental。最低要求不代表所有后续版本已实测；Host 协议仍为实验性，Loader 的预发布版本比较限制仍在。

备份存档并保留旧包，停用同身份旧 UI，导入新 UI 后重启。顺序为 **Host → UI → 对应兼容包**，兼容包还应排在目标 Mod 后。无需转换存档或清除数据；需要回退时恢复保留的 UI 和配套包即可。其它 Mod 使用 Host 时保留 Host。

详细步骤和版本范围见[安装与回退](https://github.com/102326/DoL-Game-UI/blob/v3.0.2/docs/INSTALL_3.0.2.md)。

## 验证范围与已知限制

- 真实 Android 17 / WebView 155、DoL 0.5.12.13、Loader 2.101.1：UI 字体 80%，游戏全局缩放 80%／90%／100%／125%，检查材质对齐、遮罩覆盖、控件、滚动及关闭清理。
- Windows 受控浏览器覆盖手机竖屏和横屏布局；GitHub Actions 覆盖类型、业务、浏览器交互、动效、兼容及八个运行包合同。具体记录见[本轮验证说明](https://github.com/102326/DoL-Game-UI/blob/v3.0.2/docs/KRAFT_WORK_3.0.2_VALIDATION.md)。
- Android 滑动使用程序控制和合成触控；真实 iOS、物理手指输入及报告者原设备配置未验证。本轮未重新测试全部游戏业务或社区组合，未修改游戏规则、存档及 Host 公共合同。
- 系统下拉菜单外观仍受浏览器／WebView 能力限制。第三方自定义组件不保证自动采用当前样式；`selectedWardrobe` 历史异常、部分社区告警和长期资源变化中尚未归因的部分继续保留。

反馈请前往 [GitHub Issues](https://github.com/102326/DoL-Game-UI/issues)，提供游戏／Lyra、Loader、UI／Host、相关 Mod 版本、系统与 WebView、复现步骤及截图或日志。显示问题请同时注明**游戏全局缩放和 UI 字体大小**。不要公开上传私人存档、账号信息或未经许可的第三方包。

感谢原项目、上游渲染器与依赖作者。许可证与必要署名随运行包保留，详见[许可与来源](https://github.com/102326/DoL-Game-UI/blob/v3.0.2/README.md#许可与来源)。
