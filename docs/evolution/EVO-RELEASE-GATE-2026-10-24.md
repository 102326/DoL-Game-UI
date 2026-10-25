# Evolution：正式版本准备与公开发行关卡

2026-10-25。负责人已接受当前顶栏雨效及披露的残余慢帧，继续下一步后，本轮完成4.0.0实际重标、重新构建、两套CI和准确CI包的Android最小装机复验。**正式版本准备：Completed。公开发行：已获负责人有条件授权，正在执行。**

## 最新公开发行授权

负责人本次明确授权“确认无误后，执行发布”。前述“尚未授权”属于准备阶段历史快照。当前已进入有条件公开发行执行：替换首页、同步main、核对最终源码CI／九包身份后Tag并发布，上传后读回校验。未完成前不把此记录写成已经发布；最终状态以GitHub Release和Issue #22公开发行回执为准。

## 最终源码与制品

- 运行源码：`4ebe0bb9f543e53849604f17555ae2523f423c7f`，研发分支`dev/evolution-4.0`。后续报告提交不冒称此CI受验源码。
- UI：`DoLGameUI-4.0.0.mod.zip`；SHA-256：`191dbd2b06a45b2e194999a1fed7178346a44b53bac5f4626fffd8f05a04f738`。
- Host继续`0.1.5-experimental`，七个适用兼容包版本不变；[九包／成员／依赖身份](EVO-4.0.0-PACKAGES-2026-10-25.json)为当前入口。
- 历史[RC2准备](EVO-RELEASE-PREP-2026-10-25.json)及[原始成员清单](EVO-RAIN-HEADER-PACKAGES-2026-10-25.json)原字节保留，不用其摘要替代4.0.0。

对照已接受`1c0cade`：UI的`index.js`只将产品版本字符串从4.0.0-rc.2替换为4.0.0一次；其它运行成员字节相同。`boot.json`与README同步版本，包内版本说明从RC2文档换成4.0.0文档。其余八个Mod ZIP的SHA-256全部不变。不是把RC2文件改名，未追加视觉或业务功能。

## 已完成的验证

[标准40198610876](https://github.com/102326/DoL-Game-UI/actions/runs/40198610876)与[研究40198608411](https://github.com/102326/DoL-Game-UI/actions/runs/40198608411)完整success，包含远端独立下载校验与标准moody-gate。下载五份原始Actions artifact，逐一核对GitHub摘要；summary、独立验收和包合同均绑定4ebe0bb、dirty=false、Node26.12.1、PASS／COMPLETE。标准192份、研究478份索引文件的大小与SHA均核对；它们是文件数，不是业务断言数。

九包CRC、完整成员、元数据、依赖与许可证通过，既有包反例和两次独立构建一致性通过。本地`ci:check`、`ci:build`及九包合同也通过；本地Windows压缩容器摘要与Linux CI分列，最终交付只取准确CI原包。

Android独立测试App已仅替换准确CI UI，原生重启后八个适用包的全部成员与清单一致，实际UI版本为4.0.0。原顺序、禁用列表与偏好保留；两次真实触控切换控件、顶部雨效范围和关闭清理通过。设置关闭、Hub收起、天气层归零，游戏／存档元数据摘要保持，没有执行新存档写入或云端业务。

未变的Windows实际Loader、设置双布局／390px、特殊天气、业务与生命周期证据按原范围复用；正式版本的最小安装复验在Android执行，未新增Windows重新装机或性能采样。[既有业务回归](EVO-PRERELEASE-2026-10-24.md)、[RC2实机](EVO-RC2-VALIDATION-2026-10-24.md)、[TS First完成](EVO-TS-FIRST-VALIDATION-2026-10-25.md)及[存档P2独立Accept](EVO-SAVE-REVISION-P2-2026-10-25.md)保留各自身份。

## 性能证据与归因

[性能小型证据包说明](EVO-PERF-SMALL-BUNDLE-2026-10-25.md)按小鸥请求整理既有CSV、触控原始记录、重建查询、复算脚本和条件缺口，不含完整系统trace，不是重新跑整套验收。它源于与冻结RC2运行成员等价的临时包，不冒称新4.0.0重新采样。

11.06／32.14ms与120／88ms已从原记录复算。设备刷新率、省电状态、逐Mod版本的采样绑定等缺口保留；未解析帧总量没有独立分母统计。没有停用UI或最小Mod对照，静态设置样本只是UI开启、动画关闭。不能据此认定原版游戏有问题，也不能把停用UI仍卡等同于原版归因；其它Mod、WebView和设备调度仍需分离。

[顶栏效果与性能记录](EVO-RAIN-HEADER-PERF-2026-10-25.md)保留长尾、失败实验和百分位勘误。GB40-PERF-F1由负责人接受解除本轮阻塞，不代表根因已修复、全设备满帧或长期无泄漏。报告交付不等于小鸥新的独立复核已经完成。

## 分发与文案

本地正式准备集合只含九个原始CI Mod ZIP及九项SHA256SUMS。安装、Release正文、首页稿、媒体和技术记录在附件目录之外；不重新压缩Mod，不把图片、视频、报告或本性能证据包放进Release Assets。

[安装说明](../INSTALL_EVOLUTION_CANDIDATE.md)、[Release正文草稿](../RELEASE_EVOLUTION_DRAFT.md)、[首页替换稿](../README_EVOLUTION_DRAFT.md)与实际4.0.0文件一致。媒体保留拍摄来源；正式4.0.0仅版本字符串变化的复用关系单列，不冒称重录。公开首页仍未替换，公开下载链接尚未建立。

本轮又完成[公开发行前核对与执行顺序](EVO-PUBLISH-CHECKLIST-2026-10-25.md)：main／Tag／Release冲突预检、面向玩家正文、首页根路径预览及许可说明。九包输入和摘要保持不变，未重跑不相关验收。

## 当前状态与剩余步骤

| 状态 | 结论 |
| --- | --- |
| Integrated | 4.0.0源码及必要包内文档已固化，Host／UI双包与既有公共合同保持 |
| Validated | 两套准确源码CI、下载证据、九包合同／双构建及Android最小装机复验通过；未变行为按原范围复用 |
| Owner Acceptance | 当前顶栏效果及残余尾帧已接受；整体公开发行已获授权，待实际执行回执 |
| Release Authorization | main／Tag／公开Release／Assets已获有条件授权，完成状态以实际回执为准 |

剩余发行步骤：按负责人授权核对拟合入main的实际树与最终文件身份，再更新公开首页、正文与有效下载链接，执行main／Tag／Release并读回附件与SHA。若届时运行代码或包内输入改变，按差异补验，不复用失效包摘要。

其它设备、iOS、长期资源、自然特殊事件和所有Mod组合保持原覆盖边界；ReOverfits本轮仅包／合同检查，目标未在设备安装；MapleBirch云端业务未新增写入验证。存档异常拒绝、未知扩展行退让及日期Unknown保持。不重开已接受P2，不扩展视觉范围。
