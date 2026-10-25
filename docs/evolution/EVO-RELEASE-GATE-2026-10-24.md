# Evolution：发行候选与剩余关卡

> 2026-10-25整体验收补充：[窗口与性能巡检](EVO-FINAL-REVIEW-PERF-2026-10-25.md)及已确认冗余写入修复完成。35a5bb5的两套CI、精确九包和Android实际加载已核对。设置动态雨效仍有较高帧回调间隔，不宣称实际FPS或卡顿已解决；整体性能/视觉由负责人裁决。TS First Completed及存档P2 Closed保持。

**当前阶段：最终候选验收材料就绪，等待负责人整体裁决；暂不发布。** TS First方案一243/243已完成；2026-10-25负责人转述小鸥独立复核Accept，GB40-TS-F1／P2关闭，恢复本轮技术范围Completed。不是新的迁移或视觉研发批次。

更新2026-10-25。内部候选 **4.0.0-rc.2**，拟正式4.0.0。受验代码为`35a5bb579ed07469a77d604c2b18e4f74ae7dfaf`；后续文档提交不冒称该代码CI的执行对象。178f8b2为TS First/P2独立Accept的历史基线；8033b7f RC2与d8430保留各自历史身份，不能替代当前UI包。

## 当前入口

- [TS First完成与范围](EVO-TS-FIRST-VALIDATION-2026-10-25.md)、[P2修复、实机复验与独立Accept](EVO-SAVE-REVISION-P2-2026-10-25.md)
- [最新冻结九包、依赖与SHA-256](EVO-FINAL-REVIEW-PACKAGES-2026-10-25.json)、[窗口与性能巡检](EVO-FINAL-REVIEW-PERF-2026-10-25.md)
- [安装与回退](../INSTALL_EVOLUTION_CANDIDATE.md)、[Release草稿](../RELEASE_EVOLUTION_DRAFT.md)、[首页稿](../README_EVOLUTION_DRAFT.md)
- 未改行为的历史依据：[实际游戏与Mod回归](EVO-PRERELEASE-2026-10-24.md)、[RC2雨幕与实机结果](EVO-RC2-VALIDATION-2026-10-24.md)、[雨幕归因](EVO-MODHUB-RAIN-PERF-2026-10-24.md)

[标准40180281867](https://github.com/102326/DoL-Game-UI/actions/runs/40180281867)与[研究40180280556](https://github.com/102326/DoL-Game-UI/actions/runs/40180280556)完整success，独立报告均准确绑定35a5bb5、dirty=false、Node26.12.1、PASS/COMPLETE。标准192份及研究478份索引文件逐份核对大小/SHA，无遗漏；10项下载摘要、9ZIP的结构/元数据/依赖/许可/成员与双构建通过。相比178f8b2仅UI/index.js及README改变，其余八ZIP字节不变；UI SHA-256为`08d0bf77903099638aef501cd80bbd9e35480b910707b79ed53441fd73069986`。README带入前次包内说明链接修正，运行补丁只有三处dataset条件写入。

Android只替换准确CI UI并原生重启，8个适用包全部实际成员与新CI一致，顺序、禁用列表及偏好保持；Hub开闭、设置动效开关、ModHub原页签/触控滚动及关闭清理完成。Windows实际DoL/Loader设置双布局、真实控件、390px及受控特殊天气通过。两平台受验本地包与CI运行成员相同，仅UI两份Markdown换行不同，证据按此范围复用。窗口巡检的游戏状态及存档摘要保持；未操作存档业务。

178f8b2的只读存档入口、32项正常/异常/零写入合同、四个扩展摘要槽原生回退及独立Accept仍有效；本补丁未改其输入。未改业务和兼容路径按专题报告范围复用，不重新操作私人长期存档。

## 三道关卡

| 关卡 | 当前技术证据 | 负责人裁决 |
| --- | --- | --- |
| G1 架构 | A2/A3消费者迁移、六类明确例外、释放与历史反例，见[A2/A3](EVO-A2-A3-CONSUMERS.md)及[覆盖](EVO-P0-COVERAGE.md)；TS First完成，独立复核P2关闭，新两套CI通过 | 整体架构裁决Pending；TS First本轮技术范围Completed |
| G2 视觉 | 已认可设置、球体、雨雪及B01/S01；本次未改特效参数，保留实际设置整合证据；设置动态额外开销与流畅度限制见性能巡检 | 整体候选及性能感知Pending，不自行宣布通过 |
| G3 整合 | 原游戏/Mod组合及TS迁移后的代表性Windows/Android场景；35a5bb5精确九包、准确CI UI实际加载与窗口巡检，未改存档/业务按原范围复用 | 最终候选裁决Pending |

CI中的moody-gate是技术检查，P2的独立Accept是局部缺陷验收，两者均不替代整体G1/G2/G3及发布授权。RC1、8033b7f、d8430及更早九包保留历史，不作为当前UI下载集合。

## 候选交付与负责人验收

当前试用集合直接复制35a5bb5的已验证CI负载：主UI、Host、七个可选兼容ZIP及仅含九包的SHA256SUMS。没有重新构建或改写ZIP；内部PACKAGE_CHECKS、源码身份、原始日志和媒体不混入玩家集合。候选路径属本机状态，见忽略的HANDOFF.local；跨设备从上述标准CI的构建Artifact取得原包，再与当前冻结清单核对。尚无公开下载链接。

旧178f8b2 UI README遗留的包内说明链接修正已随35a5bb5候选构建带入，实际包含`docs/RELEASE_4.0.0-rc.2.md`。旧冻结ZIP保持原字节和历史身份；说明修正不改变存档P2验收。

负责人可使用已安装的新候选确认整体效果及操作：设置双布局与长内容滚动、Hub展开/关闭背景、窄屏战斗底栏、ModHub管理/帮助、衣柜叠穿详情，以及存档/导出载入页的一致性。此列表供整体体验裁决，不把所有未覆盖环境追加成实现阻塞，也不要求覆盖或删除已有存档。

需要负责人明确的仅剩：整体G1/G2/G3是否接受、拟正式4.0.0是否确认，以及是否授权正式标记重建、main/Tag/Release。此前P2 Accept不自动提供这些授权。

## 已冻结范围

新Canvas天气模型用于设置：血月、异世界、极热、严寒与原有雨雪共存。雨中血月保留普通雨，不启用血雨/血滴。其它匹配窗口保留CSS/SVG天气，本轮修复其中共享雨幕的持续重绘；不宣称新模型已全局替换。未知第三方页面不强行接管，READ01不纳入。

Host独立，使用0.1.5-experimental，公共协议与最低依赖范围不变。兼容包7项按目标选装；ReOverfits仅包/合同检查，本轮无设备目标。MapleBirch现场5.5.5，本轮不声明云端业务完整验收。

## 余下发布步骤

1. 负责人确认G1/G2/G3、拟正式4.0.0、上述范围与已知限制。
2. 获得正式授权后切换正式版本标记并重建，核对最终ZIP、依赖与摘要，完成启动和受影响场景最小复验。
3. 核对首页、Release正文与媒体链接后，按授权合入main、Tag并发布。公开下载与最终SHA清单对应；图片/视频仅在正文展示。

本轮已定位的冗余写入已修复，其它原合同未见新增确认缺陷。设置动态雨效仍有较高回调间隔，性能与主观流畅度不宣称整体通过；长期资源来源Unknown、无完整FPS、自然特殊事件/iOS/全部Mod组合等边界继续保留。本次没有注入真实畸形存档或执行新存档写入。扩展摘要行的原生回退是已知合同边界。短时雨效观察不承诺根治所有ModHub安装/更新问题。

**发布前技术准备与TS First：Completed；GB40-TS-F1：Accepted / Closed；整体Owner Acceptance：Pending；Release Authorization：未授权。**
