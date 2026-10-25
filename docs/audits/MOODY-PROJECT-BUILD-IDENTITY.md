# Moody Blues — Project / Build Identity

2026-10-23；输入 f318241。用户授权以稳定项目身份和实际构建溯源替代产品版本冻结。当前产品版本未改动，Catalog 由 1.1.1 升至 1.2.0；旧证据保留原身份，不使用新 Catalog 回判历史运行。

本文记录身份层初次实现（Catalog1.2.0）；后续V1.2可信度整改已以Catalog1.3.0合入研发，身份政策继续保留。当前验收与跨设备步骤见[V1.2交接](MOODY-CI-V1.2-HANDOFF.md)。

## 永久项目身份

根目录 `project-identity.json` 是 Project ID 的唯一声明来源，schema 1，UUID `005d5d5f-6a83-42bb-a5e4-211033e5f03c`。该 ID 随项目永久保留，产品改名、组件升级、重新构建或 CI 重跑都不能重新生成。Catalog、运行 identity、包合同及构建 receipt 均绑定它；下载验证器从当前源码读取期望值，不接受附件自行声明的其它项目身份。

## 独立组件版本

| 组件 | 实际来源 | 检查 |
| --- | --- | --- |
| 官方 UI | 根 `package.json.version` | 官方 wrapper 直接导入；浏览器启动与默认值检查读取同一来源，ZIP 文件名/Manifest 必须一致 |
| Core | `src/main.ts` 中 Core runtime 的版本声明 | Core 入口的实际浏览器身份与该声明一致，不要求与 UI 同号 |
| Host | `scripts/package-framework.py` 的 `host_version` | Host ZIP 文件名/Manifest 与来源一致；继续满足当前 Host 0.1 协议和 UI 的既有兼容范围 |
| 六个可选包 | 各自 `compat/*/boot.json.version` | 源 Manifest、ZIP Manifest、文件名和实际成员字节一致 |

产品版本允许使用 3.0.4、3.5.0、4.0.0 等标签；不添加版本递增政策，不强行统一组件号。版本字符串仍须可安全用于文件名。UI→Host `>=0.1.2-experimental && <0.2.0`、协议 `0.1-experimental`、GameVersion、ModLoader、TweeReplacer 和各目标 Mod 的兼容断言继续独立执行；产品主版本更改不自动修改这些技术合同。

README 展示版本不再阻断构建；仅当 `docs/RELEASE_<当前UI版本>.md` 实际存在时才入包并逐字节核对。UI 设置说明、可选包说明、类型、替换文件、许可证及第三方 NOTICE 仍是必需成员。

## 构建身份与 Hash 绑定

构建键为 `{projectId, commit, runId, attempt}`：GitHub 使用实际 checkout SHA、GitHub Run ID 和 Attempt。本地无 GitHub Run 时使用证据运行 ID，Attempt 为 local。Commit 相同而重跑的 Attempt 不同；同一次运行的两轮可重复构建共享该键，各有独立 invocation UUID。

每次 receipt 在同一对象中记录构建键、完整源码身份和八包 `{name,file,sha256}`。合同报告绑定相同键，记录两轮冻结快照与实际 ZIP SHA-256；上传索引进一步绑定文件大小、Hash、nonce、Catalog 和运行身份。因此完整溯源是构建键与实际制品 Hash 的关联，不是仅凭可重复使用的产品版本号，也不把随机数据写进玩家 ZIP 破坏字节可重复性。

标准/研究下载验证都核对 Project ID；包汇总另核对来源、两轮完整 receipt、Commit/Run/Attempt 和 Hash。显式 CI 运行不能接管旧 receipt 的 Run ID；本地分开执行 build / packages 时仅复用刚生成的本地运行，源码或环境变化仍拒绝。两次编译/打包必须实际发生，invocation 不得复用。

## 验证与边界

回归包含 UI 三种标签、独立 Core/Host 版本、无版本说明文件的正常来源，以及错误运行绑定、Host 兼容、协议/依赖、ZIP 版本/成员/字节、Project/Commit/Run/Attempt 和 Hash 反例。原 F1–F3、标准及研究必需入口、124/241 设备夹具计划保留。精确提交、实际本地命令与最终 GitHub Run/下载验证见 PR、#22 和专项交付；文档存在不等于通过。

这是 CI 可信度与版本来源改造，未改变业务或视觉行为，未创建 Release，未修改分支保护；受控浏览器/ZIP 检查不替代真实 DoL/ModLoader、Windows 或移动设备验收。
