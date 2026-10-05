# Soft & Wet 2.2.0 · Crazy Diamond

这一版主要整理 Soft & Wet 自有代码、官方兼容包和公开 API 类型。界面沿用 2.1 的布局与材质，不改变游戏规则、存档格式或第三方 Mod 的业务。

## 主要变化

- 自有运行时、主题、页面适配、bridge、官方兼容包及两个提前注入入口统一使用 TypeScript。
- 主包附带 `types/ui.d.ts`，供 Mod 作者检查 UI API、Adapter、Surface 和诊断数据的类型。
- 公共接口仍为 **API v1 / 诊断 Schema v1**，保留原有能力检测、异常隔离、未知内容显示与原版回退。
- 加载器继续执行 JavaScript；玩家不需要安装 TypeScript 或更改加载方式。
- 官方兼容包仍独立选装，不编入主包，不接管目标 Mod 的状态或事件。

## 下载哪个文件

普通玩家只需下载主包；兼容包按已安装的目标 Mod 选择。文档与类型不需要导入游戏；示例包供开发者选装，普通玩家不用安装。

| 文件 | 用途 |
| --- | --- |
| `DoLGameUI-2.2.0.mod.zip` | UI 主包，替换旧版同名 UI。 |
| `ModHubSoftWet-ModHub-1.3.0-v0.2.2.mod.zip` | ModHub 1.3.0 外观兼容。 |
| `MapleBirchSoftWet-maplebirch-5.2.3-v0.2.2.mod.zip` | MapleBirch 5.2.3 云存档外观兼容。 |
| `DolOptimizationSoftWet-OriginalOptimization-1.1.1.2-v0.1.3.mod.zip` | 原版优化 1.1.1.2 的存档界面兼容，保留原节点及扩展描述。 |
| `LyraMouthCompat051213-Lyra-0.5.12.13-1.0.1a-1004.1-goose-ucb-v0.1.1.mod.zip` | 指定新版 Lyra Goose 嘴部路径修复，仍不依赖 UI。 |
| `LyraWardrobeMouthSoftWet-Lyra-0.5.11.9-1.0.0a-0815-goose-ucb-v0.1.2.mod.zip` | 指定旧版 Lyra 衣柜嘴部适配，不用于 0.5.12.13。 |
| `SoftWetSurfaceDemo-DoLGameUI-2.2.0-v0.1.1.mod.zip` | Mod 作者使用的 Modal / Drawer 示例，默认不弹出。 |
| `UI_RUNTIME.md` / `ui.d.ts` | API 文档与类型声明，给 Mod 作者使用。 |
| `OPTIONAL_ADAPTERS.md` / `TYPESCRIPT_2.2.md` | 选装说明、迁移范围及验证记录。 |
| `SHA256SUMS.txt` | 下载文件的完整性校验，不需要导入游戏。 |

## 安装与兼容

适配 DoL **0.5.11.9 / 0.5.12.13**，需要 ModLoader **2.100.0+**、TweeReplacer **1.0.0+**。导入 ZIP，不要解压；替换已有同名 Mod，不同时启用多个版本，之后重载游戏。升级前建议备份进度。

使用官方兼容包时，请同时更新为上表对应版本；旧包的依赖声明可能只允许 UI 2.1.0。目标 Mod 版本没有扩大。关闭 Soft & Wet 总开关后使用原版界面，显示偏好继续保留。

原版优化兼容视图保留双列原节点卡片、扩展日期、描述编辑和分页，暂不启用 UI 搜索、详情 Drawer 或存档 V2 双栏详情。禁用兼容包后恢复主包界面。

## 给 Mod 作者

读取 `window.DoLGameUI?.ui` 前仍需检测 API 版本和所需能力。声明仅供编译检查，不能替代运行时校验，也不是另一套 UI Runtime。

- [API 文档](UI_RUNTIME.md)
- [职责与接入边界](UI_INFRASTRUCTURE.md)
- [TS 迁移与验证记录](TYPESCRIPT_2.2.md)
- [独立兼容包说明](OPTIONAL_ADAPTERS.md)

<details>
<summary>技术细节与验证边界</summary>

自有代码保留原 DOM 所有权、事件和状态源；第三方未知字段以 `unknown` 接入，沿用已有校验和降级。上游派生的衣柜渲染文件继续由生成器维护，构建工具与测试脚本不强制改为 TS。

已完成严格类型检查、构建、打包契约和类型擦除一致性检查；0.5.11.9 桌面候选回归通过。0.5.12.13 平板已验证完整包重载、三个外观兼容包、原版回退、Inspector、Surface 示例及新版嘴部显示。实机检查没有执行存档读写或云端操作，相关存档业务在隔离桌面测试中验证。详细记录见迁移清单；未记录的环境不视为已验证。

</details>
