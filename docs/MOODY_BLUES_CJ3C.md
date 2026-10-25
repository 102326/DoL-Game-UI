# Moody Blues — CJ-3C 制品合同

> 2026-10-23：下文的冻结版本政策和具体版本号属于 CJ-3C 历史快照。当前采用[固定 Project ID、动态组件版本与唯一构建身份](audits/MOODY-PROJECT-BUILD-IDENTITY.md)，取代产品版本硬编码、README 版本匹配及强制版本号命名的发布说明。依赖兼容、成员/字节、负例、双轮构建及证据完整性合同继续生效；历史 Run 不重标新 Catalog。

2026-10-19；独立候选 `ci/moody-blues-cj3c`，起点 P0 `1739c17`；合入前整合最新 main，协作模板不计入本专项差异。正式 3.0.1 Release 和附件不变。本文件描述合同；实际命令、提交、Run 和耗时见 HANDOFF 与交付报告，不将文档存在视为通过。

## 版本来源与独立政策

| 来源 | 当前合同 | 验证关系 |
| --- | --- | --- |
| 根 `package.json` | UI `3.0.1` | 官方包装脚本从根版本取值；检查器独立固定本版本线政策 |
| `framework/official-ui/main.ts` | `visualVersion='3.0.1'` | 与根版本、ZIP Manifest 对照 |
| `scripts/package-framework.py` | Host `0.1.4-experimental` | Host 独立版本，与 Host README、ZIP 身份对照 |
| `framework/contracts.ts` | 协议 `0.1-experimental` | 独立政策、Host 源码合同；不能强制与产品同号 |
| UI → Host | `>=0.1.2-experimental && <0.2.0` | 包装脚本、UI README、ZIP 依赖逐项比对 |
| 旧 core/early 入口 | 内部 `2.7.0` | 官方 wrapper 设置产品版本；不把旧内部入口误当正式 UI 来源 |

生产器不导入检查器政策。只同时修改根/运行版本、或源 Manifest 与 ZIP 的同一个错误值，不能通过独立政策。版本升级需要明确更新政策及对应测试，不能自动接受任意一致值。

## 八个当前候选包

| 包 | 目标 / 版本范围 | 其它合同 |
| --- | --- | --- |
| DoLGameUI 3.0.1 | GameVersion `=0.5.12.13` | Host 范围如上；ModLoader、TweeReplacer、商店替换/声明/许可证原合同保留 |
| StoneFreeHost 0.1.4-experimental | ModLoader `>=2.100.0` | 独立 Host 版本、精确入口与许可证 |
| ModHubSoftWet 1.0.0 | ModHub `>=1.3.0` | UI `>=3.0.0`；GameVersion `=0.5.12.13` |
| MapleBirchSoftWet 1.0.0 | maplebirch `>=5.2.3` | 同上 |
| DolOptimizationSoftWet 1.0.0 | 原版优化 `>=1.1.1.2` | 同上 |
| CheatExtendedSoftWet 1.0.0 | cheat extended `>=1.20.3` | 同上 |
| ReOverfitsSoftWet 1.0.0 | ReOverfits `>=4.1.1` | 同上 |
| LyraMouthCompat051213 1.0.0 | Lyra `=0.5.12.13-1.0.1a-1004.1-goose-ucb` | maplebirch `>=5.2.3 <6.0.0`；GameVersion 同上；没有 UI 依赖 |

六个可选包逐项核对源/ZIP Manifest、文件名、依赖/入口列表、精确成员白名单、编译 JS 与 CSS/README/本包 LICENSE 字节。拒绝缺失、额外、重复、不安全路径、失效编译产物及错误字节。旧 `compat/lyra-wardrobe-mouth-soft-wet`（0.5.11.9）不进入当前八包构建和上传。包合同通过不代表第三方 Mod 已在真实游戏全面兼容。

## 确定性及两轮构建

复用现有 Framework 和 adapter 打包器。按成员名排序；固定 ZIP 时间 `2026-01-01 00:00:00`、DEFLATE/level 6、Unix create_system=3、权限 0600、version/extract=20、空 extra/comment，UTF-8 标记按名称需要设置。level 6 是写入器参数，ZIP 本身不编码完整压缩等级。候选 ZIP 因元数据规范化可能与旧 Release SHA 不同，不更换已发布附件。

`ci:build` 实际编译后调用 `check-ci-packages.py build`，生成八包及绑定源码/Run/唯一 invocation 的 receipt。adapter 编译前只失效本次 TS 入口对应的生成 JS，编译后必须存在；不清空其它构建、日志或整个 dist。`ci:packages` 检查第一轮 receipt 与全部实际 ZIP 后，立即冻结每包字节、成员顺序、内容/压缩字节哈希及全部比较元数据，再重新执行 Framework 编译和八包打包。第二轮要求新的 invocation、相同源码/Run、完整八包 receipt。报告定位成员内容、元数据、顺序、压缩字节及整包 SHA 差异。不是重复哈希同一个旧文件。

同一环境/源码的双构建相同，不承诺不同 OS、Python、zlib 或工具链必然相同。报告记录 Python/zlib 和 CJ-3A 环境身份。

## 负向验证与证据

复用 unittest，当前七个方法包含多组 subTest，不把七个方法包装成七个设备或七次构建：

- 原 UI/Host 的依赖、入口、许可证、字节、不安全/额外/重复成员负例保留。
- 六包正常检查及每包九类实际 ZIP 变异；源 Manifest 和 ZIP 同改坏仍拒绝；旧 Lyra 不能冒充当前包。
- 根/运行/Host/协议/依赖范围错配；元数据、顺序、成员集和内容差异有精确定位。
- mtime/权限变化的受控真实打包：修改前成员字节相同但整包 SHA 不同（RED），规范化后相同（GREEN）。
- 编译器退出 0 但漏写 JS 且存在旧 JS：原行为错误接受（RED），失效预期输出后拒绝（GREEN），无关日志保留。
- 陈旧源码/Run、缺失 invocation、缺包/错误哈希 receipt 和报告超限均拒绝。

精确版本、依赖、成员白名单、许可证和实际 ZIP 字节合同由 Python 制品检查器执行。整轮汇总器不重新打开 ZIP 或执行第二套独立合同检查；它核对检查器结果的源码/运行身份、规定的完整结构、必要测试执行情况及两轮一致性。两者保留此职责分工，不复制完整检查逻辑。

`package-contracts.json` 绑定实际源码/Run，含八包合同、两次冻结快照、版本来源、七方法实际计划和结果。报告上限 **256 KiB**，超限失败，不截断后宣称 PASS。汇总器不只信 exit 0：缺失/陈旧、错误类型、缺包、缺成员元数据、无关反例计划、跳过反例、少一轮构建均不能 PASS。沿用 CJ-3A 白名单上传、16 MiB 总上限和七天保存；开发制品上传仅八 ZIP、PACKAGE_CHECKS.json、SHA256SUMS.txt，不是 Release/CD。

## 运行与维护边界

完整验证顺序：`npm ci` → `ci:check` → `ci:unit` → `ci:build` → `ci:packages` → 安装锁定 Chromium → `ci:browser`。使用现有 stage runner 时所有阶段共享一个 `MOODY_EVIDENCE_ID`。`ci:packages` 需要该源码的最新首轮 receipt；改源码后必须重跑 build，不能挪用旧包。

新增成本是一次真实 Framework/adapter 重编译和七方法 ZIP 变异，布局标准/深度计划仍为 124/241，未扩大矩阵。耗时以实际 Run 为准。没有真机、Windows、游戏存档/ModLoader 联合验收；受控输入不包含玩家存档、游戏 HTML 或未知制品。主动授权的存档仅在源码树外隔离复现，不自动进入 CI。

## 2026-10-19 实际验证快照

实现提交 `b32c022c8158016f86f0408e1aa0e5b1ca27d8f2`；本节和 HANDOFF 随后只更新文档。源码内容 SHA `773360d00f992d15eab8ccf63dff155279ca8457cc891ba49e6f6f2564a1d2b7` 在本机测试输入、提交后源码及云端报告一致。

- 本机 macOS arm64 / Node24.18.0 / npm11.16.0 / Python3.12.14 / Playwright1.63.0：七阶段命令均 PASS，14 单元/21 浏览器入口、124/124；build4.943s、packages5.155s、浏览器216.339s。summary 为 PARTIAL（没有 GitHub setup action outcome），59 项证据345,512B、哈希全验、遗漏0。
- [实际 push Actions 39237922746](https://github.com/102326/DoL-Game-UI/actions/runs/39237922746)：准确 checkout b32c022，Linux x64 / Node22.23.3 / npm10.9.9 / Python3.12.15 / Playwright1.63.0，整轮 PASS，validate5m24s。build7.786s、packages8.763s、浏览器259.067s，14/21 入口、124/124。
- 云端下载验证59项受控证据365,025B、八个实际开发ZIP和PACKAGE_CHECKS的9条SHA，全部匹配、遗漏0。报告118,096B，两个唯一invocation、八包完整、两轮内容/压缩字节/元数据/ZIP SHA一致，七个负例方法全执行、无跳过。开发制品和证据保留7天，首次运行证据到2026-10-26。

这次观察中本机与云端八包 hash 也相同；这只是已测两种环境的结果，不扩大为所有 OS/zlib 组合保证。正式Release仍保留原附件；CJ-3C未合并main、未创建第三PR。

## main 集成时发现的关闭采样问题

协作合入后的 [main Run39243023242](https://github.com/102326/DoL-Game-UI/actions/runs/39243023242) 在 settings-ci.cjs 固定450ms关闭采样失败；保留失败证据与后续BLOCKED结果。集成分支改用最多3秒的真实关闭终态等待，仍检查open=false及生命周期清理。受控慢关闭证明旧采样会误报而合法完成通过；显式断言关闭动画实际paused，再证明超时拒绝。仅改测试/快照，不改生产动画、不放宽几何断言、不扩大设备矩阵；不包装成第三个产品缺陷。新HEAD的PR和main结果以本轮交付报告为准。
