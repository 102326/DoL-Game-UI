# Soft & Wet 3.0.0 — Stone Free

本地整改候选，**Stable Gate 仍因视觉验收待定而阻断，尚未公开发布为稳定版**。当前公开 RC 为 [3.0.0-rc.1](https://github.com/102326/DoL-Game-UI/releases/tag/v3.0.0-rc.1)，[2.7.0](https://github.com/102326/DoL-Game-UI/releases/tag/v2.7.0) 继续保留为稳定版本。

## 主要变化

- 官方 UI 与 Framework Host 独立发行。玩家安装两包；作者可以只使用 Host，不依赖官方 UI。
- 保留 Soft & Wet 2.x 的 Ocean、柔雾 Acrylic、轻卡片及视觉档位，加入可关闭的空间转场。
- 衣柜保留单击直接穿戴，支持暂存参照与比较；商店支持商品显示信息对照，原颜色、报价及购买行为保持。
- 衣柜、商店、战斗、存档及常用面板接入场景失效和资源清理，保留 API v1、原版回退及未知内容入口。
- 保留 R16-W01 叠加语义修复：快穿执行当前原穿戴入口，不另行重写第三方叠加规则。
- Floating Hub 是默认关闭的可选入口。本版不包含 Widget、自由布局编辑器或全局动作底栏。

## 安装与回退

需要 DoL **0.5.12.13**、ModLoader **>=2.100.0**、TweeReplacer **>=1.0.0**；实际 Loader 验证版本为 2.101.1。

安装 `DoLGameUI-3.0.0.mod.zip` 和 `StoneFreeHost-0.1.4-experimental.mod.zip`，不要解压。最低 Host 为 0.1.2-experimental，依赖为 `>=0.1.2-experimental && <0.2.0`；0.1.4 为推荐版本，不是所有消费者必须采用的下限。

升级前备份存档并保留 2.7 包。停用旧 DoLGameUI，Host 排在新 UI 前，只启用一份同名 Host/UI，重启后载入进度。开发样例和作者工具不是运行前置。

主题、字号、密度、侧栏、页面和存档显示偏好沿用，不迁移存档格式。需要原版界面时关闭总开关；回退 2.7 时停用新 UI、恢复旧包并重启，没有其它消费者时可停用 Host。不要清空存档或偏好，不承诺热卸载。

## 支持与限制

代表性 Windows Chromium / Android WebView 的安装、业务、存读档及升级回退已有证据，复杂社区组合研究不等于全部 Mod 兼容。本轮最终包的验收结果见外部 Stable Gate 报告，不能仅凭版本号判断完成。

Framework 继续使用 **0.1-experimental**，官方 UI API 仍为 v1。产品 Stable 不代表公共接口永久冻结；作者应核对当前协议和能力，关注破坏性变化通知。Host 服务实际 UI 需求，不管理第三方业务与生命周期。

Loader 的预发布比较存在限制：部分 0.2.0 预发布可能满足依赖表达式，但不在支持范围，未来版本不自动获得兼容认证。不支持的环境应回退；版本和能力检查不能保证阻止所有错误组合。

物理手机/IME 的完整设备矩阵、全部第三方衣槽及功能、所有交易和战斗结算、长期性能、云端及系统文件选择未完整覆盖。新 Hub 位置落盘/回退读回未补测。社区组合的部分 Patch、资源及 TypeError 告警仍保留 Unknown，不能统一视作无害。

## 反馈

请通过 [GitHub Issues](https://github.com/102326/DoL-Game-UI/issues) 提供 DoL/Lyra、Loader、Host/UI、相关 Mod 版本、平台/WebView、复现步骤、实际与期望表现，以及适用的日志片段或截图。不要公开上传私人存档、账号、敏感数据或未经授权的第三方 Mod 包。

<details>
<summary>技术与许可</summary>

正式 2.7 功能对照继续使用已有覆盖矩阵；稳定性承诺不要求将成熟模块全部改写为新的内部结构。原业务和保存格式不变，继续保留 gameTime 及有效附加 metadata。玩家实测后的本地整改还修复了商店玻璃层遮住原生内容与退出入口的问题，统一首页/游戏内导航及设置分组，并修正 Hub 提示、展开几何和快捷入口。Host、公共协议和游戏业务保持原有所有权；最终视觉仍需负责人验收。

Host 复用已公开 0.1.4 原包，不在同版本下替换字节；包内 RC 描述记录其冻结时点。许可及来源声明见各包 LICENSE、THIRD-PARTY-NOTICES.txt 和 UPSTREAM-RENDERER 文件。玩家包不包含内部验收收据、截图、游戏本体、APK 或存档。

</details>
