# Kraft Work 3.0：正式发行授权与冻结记录

2026-10-19。负责人完成文案终审，并明确授权本次 3.0 正式发行所需的 Git 固化、推送、Tag 与 GitHub Release。授权仅针对已审查的 Kraft Work；不扩充功能，不发布其它项目，不重建或静默替换已验收运行 ZIP。

## 源码与 Tag

发布 Tag 为 `v3.0.0`，以本轮源码固化提交为准，不能使用旧研究 HEAD。研究分支 `research/stone-free-3.0-framework` 在无远端分歧的前提下快进推送；main 不合并、不覆盖。2.7 及公开 RC 保留原 Release 和附件。

已验收运行源码的源树摘要为 `a71929feccea15a717dbd7023a8dd630fc74b5f139867940fbecc326a20b90ed`，源码快照 ZIP 摘要为 `6a661d9d13c5fb5cb08411c3e56b2e2f166db923a070bf88701525928e6cbd87`。Git 的文本换行规范与快照原始字节摘要分别记录；核对内容时不把正常 CRLF／LF 转换视为业务修改。

固化提交保留运行源码、构建入口、必要测试及开发历史文档。相对已验收快照，只更新发行正文、安装指南、README／CHANGELOG 和本记录等文档；不改运行代码。实际 Git 提交和逐包／逐成员摘要在 Release 的 `SOURCE_IDENTITY.json` 中发布，`git rev-parse v3.0.0^{commit}` 可核对源码。

## 当前附件

| 技术身份 | 版本 | 来源与处理 |
| --- | --- | --- |
| DoLGameUI | 3.0.0 | 最终验收 ZIP，原字节 |
| StoneFreeHost | 0.1.4-experimental | 已公开冻结 Host 原 ZIP，不替换同版本字节 |
| ModHubSoftWet | 0.2.5 | 本轮已验收新外观包 |
| MapleBirchSoftWet | 0.2.5 | 本轮已验收新外观包 |
| DolOptimizationSoftWet | 0.1.7 | 本轮已验收新外观包 |
| CheatExtendedSoftWet | 0.1.0 | 原作者 CE 优先；独立维护 rebuild.30 单列 |
| ReOverfitsSoftWet | 0.2.2 | 沿用已固定原包，不宣称本轮新目标环境验收 |
| LyraMouthCompat051213 | 0.1.2 | 沿用独立维护的指定资源包；不声称由本工作树旧版嘴部源码重建 |

旧 Lyra 0.5.11.9 专用包不在当前附件或安装组合中，继续从历史 2.7 Release 独立获取，不更新旧 Release。普通玩家只必装 UI 与 Host；外观包按目标 Mod 选择，研究包与作者工具不附带。

其它附件是安装说明、验证范围、身份清单、五张真实 Android 截图与约 12 秒原速天气录像。所有附件负载列入 `SHA256SUMS.txt`；清单自身摘要记录在发布回执中，避免自引用。素材按实际采集原字节提供，不使用采样加速录像或合成变形截图。

## 支持版本与依赖

当前游戏基线为 DoL 0.5.12.13。ModLoader 最低 2.100.0、实测 2.101.1；TweeReplacer 最低 1.0.0。Host 为 `>=0.1.2-experimental && <0.2.0`，推荐并实测 0.1.4-experimental；协议仍是 `0.1-experimental`，官方 UI API 为 v1。

前三个新版外观包分别以 ModHub >=1.3.0、MapleBirch >=5.2.3、原版优化 >=1.1.1.2 为最低声明，本次实际为 1.7.0／5.4.3／1.1.1.5。新版外观包要求 UI >=3.0.0。CE 安装声明 >=1.20.3，实际接口基线为原作者 1.20.3.1，已知 rebuild.30 明确接受；这是对 Loader 四段预发布比较限制的处理，不是全部后续版本承诺。结构检查不匹配时退让。指定 Lyra 资源包保持其必要精确依赖。

## 验证与限制

本次发布不重复已成立的业务矩阵，复用 [整合 Gate](KRAFT_WORK_3.0_RELEASE_GATE.md) 和 [兼容 Gate](KRAFT_WORK_3.0_COMPAT_GATE.md)。两份报告的 Pending／未授权描述记录候选阶段，不覆盖本页后续授权事实。

- 当前最终六个核心／新外观包在 Windows 原作者 CE 和 Android rebuild.30 组合中实际 Loader 成员摘要一致。CE 原分类事件、游戏状态守恒、ModHub／存档外观、总开关与清理通过；Android 原列表与偏好重启恢复。
- 商店指定购买、衣柜穿脱／叠穿／详情抽屉、原战斗回合、存读档、代表性 2.7 升级回退复用整合 Gate，相关业务代码没有改变。Windows 文本导出／导入有最终证据；Android 该项保留历史与定向证据边界。
- 没有穷举所有设备、物理触控、IME、游戏版本、交易／战斗结算、衣槽、CE 操作或社区 Mod。普通作弊入口本次未出现内嵌 CE 目录，不把该路径列为真机通过。云端上传／下载、系统文件选择未验收。
- selectedWardrobe／Wardrobe Widget 历史异常未复现，根因仍 Unknown。社区告警和 Windows 资源增长未完成归因；不宣称无泄漏。Android gfxinfo 无有效帧样本，不提供 FPS 结论。

许可按各包保留：项目 MIT；DoL 衍生渲染及四项 Twee 替换为 CC BY-NC-SA 4.0，另附上游声明；依赖 NOTICE 与 CE 来源／维护归属不省略。没有分发游戏本体、APK、私人存档、账号或第三方原 Mod 包。

## 公开核对

发布前核对暂存清单、提交内容、Tag、ZIP 元数据、SHA、运行成员、LICENSE／NOTICE、正文与素材。先整理全部文件和文案，再快进推送源码与 Tag、创建 GitHub draft、上传并逐项核对附件，最后公开为正式 Release。遇到实质性身份或内容差异即暂停，不静默替换；旧 Release 的状态和附件保持原样。

发布回执保存实际 Release URL、Commit、Tag、附件摘要及旧 Release 保留检查；正文入口见 [正式说明](RELEASE_3.0.0.md)，具体安装见 [安装指南](INSTALL_3.0.0.md)。
