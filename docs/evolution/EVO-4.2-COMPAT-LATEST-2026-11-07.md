# 4.2 兼容目标版本核对

核对日期：2026-11-07。平板列是本轮开始时的版本快照。ModHub随后更新到2.0.2；主UI4.2.0与ModHubSoftWet1.0.4已经原生重启并核对实际加载成员。其余六项未发现更新的对应作者发行，不为统一版本号改包。

| 目标与适配包 | 基线平板 | 作者最新发行及来源 | 复验判断 |
| --- | --- | --- | --- |
| ModHub / ModHubSoftWet 1.0.4 | 2.0.1 → 2.0.2 | [2.0.2 正式版](https://github.com/JohnLiao501/ModHub/releases/tag/v2.0.2)，2026-11-06 | 新增内嵌 Mod 识别、安装预检及还原预览说明。作者包静态检查保留原主页面和常规模态指纹；独立时间点还原面板不在旧包适配范围。实机确认还原面板未跟随材质轴后，新增独立完整指纹及清理；1.0.4配合UI >=4.2.0接入同一材质和控件设置。管理、帮助、还原窗口、主开关回退与关闭已验；安装/还原业务未执行。 |
| MapleBirch / MapleBirchSoftWet 1.0.1 | 5.6.2 | [5.6.2 正式版](https://github.com/MaplebirchLeaf/SCML-DOL-maplebirchFramework/releases/tag/maplebirch-release-v5.6.2)，2026-10-30 | 与基线一致；本版说明主要涉及战斗同伴，未发现新增云存档界面合同。无需仅因版本号修改；既有页面实机证据有其原范围。 |
| 原版优化 / DolOptimizationSoftWet 1.0.3 | 1.1.2.1 | [1.1.2.1 正式版](https://github.com/ANLINSTUDIO/Degrees-of-Lewdity-DolOptimization/releases/tag/v1.1.2.1)，2026-10-23 | 与基线一致；发布说明涉及快速存档行、排序及关闭按钮。已有版本范围和结构检查不证明所有存档操作；无新版本证据要求改包。 |
| Cheat Extended 原作及独立维护版 / CheatExtendedSoftWet 1.0.0 | 独立维护版 1.20.3.1-rebuild.30 | 原作者 [1.20.3.1](https://github.com/chris81605/Degrees-of-Lewdity_Cheat_Extended/releases/tag/1.20.3)，2026-10-09，tag 为 `1.20.3`；独立维护版 [rebuild.30](https://github.com/102326/Degrees-of-Lewdity_Cheat_Extended-Modernization/releases/tag/v1.20.3.1-rebuild.30)，2026-10-17 | 两者独立发行、技术名相同，只能启用一个。原作者版的 Tab 横向滚动和服装管理更新已是适配基线；没有找到更新发行引出的新合同。最低版本声明不代表未来版本已验证。 |
| ReOverfits / ReOverfitsSoftWet 1.0.1 | 未安装 | [4.1.1 正式版](https://github.com/mirrormirroronwall/Dol-Miyako-Mods/releases/tag/4.1.1)，2026-09-30；作者发布说明修正位于前景背景之前时报错 | [ModHub 市场索引](https://dolmod-release-index.johnliao381658675.workers.dev/release-index.json) 的 `overfits-slots` 指向此维护仓库，署名猫猫教传教士、Mamon、miyako4828、枫桦叶及锁链_蝴蝶。`>=4.1.1` 与衣槽映射是现有合同，平板未安装，未证明真机业务；原 miyakoAki4828 仓库的 2.0 不是当前版本依据。 |
| SmartPhone Alpha / SmartPhoneSoftWet 1.1.2 | Alpha 0.3.91.1 | [v0.3.91 正式发布](https://github.com/ANLINSTUDIO/Degrees-of-Lewdity-DolSmartPhone/releases/tag/v0.3.91)，2026-10-16，正文含 0.3.91.1 修订 | 与基线一致。Alpha 正常外壳和 debug 窗口按已识别结构适配；未知页面保留原样。PhotoPack 是独立资源，[Omega 1.0](https://github.com/ANLINSTUDIO/Degrees-of-Lewdity-DolSmartPhone/releases/tag/v.omega.1.0) 是另一技术身份，不属于 Alpha 适配范围。 |
| 指定 Lyra 嘴部资源 / LyraMouthCompat051213 1.0.0 | Lyra `0.5.12.13-1.0.1a-1004.1-goose-ucb`，MapleBirch 5.6.2 | [Lyra 1004.1](https://github.com/DoL-Lyra/Lyra/releases/tag/v0.5.12.13-1.0.1a-1004.1)，2026-10-04，GitHub 标记 prerelease；最新非预发布版本属于旧 0.5.11.9 | 当前补丁严格匹配指定 Lyra 技术版本和稳定 MapleBirch `>=5.2.3 <6.0.0`，不推广到其他 Lyra 或 Maple 6。当前 Maple 5.6.2 满足声明；不以版本声明替代加载和画面验证。 |

ModHub 2.0.2 作者 ZIP 的SHA-256 `f3402d41eba332656565caf85de3a0fd15b7e682d7fe082b0becae00efbbaf7a`；已安装到独立测试App并实际运行。市场备用索引生成时间为 `2026-11-07T05:10:44Z`：上述可识别条目与作者发行版本一致；未找到独立 rebuild.30 或 Lyra 整合本体的精确条目，缺条目不代表没有更新。

本批只更新ModHubSoftWet。旧MapleBirch包中历史候选措辞另留文档维护项，不静默重打同版本发布包。安装预检沿原模态结构做静态核对；本轮没有执行市场安装、更新或实际还原。完整失败及收口状态见[Android与兼容跟进回执](evidence/2026-11-07-android-compat-followup.json)。
