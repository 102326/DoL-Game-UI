# Evolution：发行候选与剩余关卡

**当前阶段：最终候选验收材料就绪，等待负责人整体裁决；暂不发布。** TS First方案一243/243已完成；2026-10-25负责人转述小鸥独立复核Accept，GB40-TS-F1／P2关闭，恢复本轮技术范围Completed。不是新的迁移或视觉研发批次。

更新2026-10-25。内部候选 **4.0.0-rc.2**，拟正式4.0.0。受验代码为`178f8b2b5b1828038b7c3ec304e8995bbe99ee38`；后续文档提交不冒称该代码CI的执行对象。旧8033b7f RC2与d8430保留各自历史身份，不能替代当前UI包。

## 当前入口

- [TS First完成与范围](EVO-TS-FIRST-VALIDATION-2026-10-25.md)、[P2修复、实机复验与独立Accept](EVO-SAVE-REVISION-P2-2026-10-25.md)
- [最新冻结九包、依赖与SHA-256](EVO-SAVE-REVISION-P2-PACKAGES-2026-10-25.json)
- [安装与回退](../INSTALL_EVOLUTION_CANDIDATE.md)、[Release草稿](../RELEASE_EVOLUTION_DRAFT.md)、[首页稿](../README_EVOLUTION_DRAFT.md)
- 未改行为的历史依据：[实际游戏与Mod回归](EVO-PRERELEASE-2026-10-24.md)、[RC2雨幕与实机结果](EVO-RC2-VALIDATION-2026-10-24.md)、[雨幕归因](EVO-MODHUB-RAIN-PERF-2026-10-24.md)

[标准40175814517](https://github.com/102326/DoL-Game-UI/actions/runs/40175814517)与[研究40175811238](https://github.com/102326/DoL-Game-UI/actions/runs/40175811238)完整success，独立报告均准确绑定178f8b2、dirty=false、Node26.12.1、PASS/COMPLETE。下载10项摘要、9ZIP的结构/元数据/依赖/许可/成员与双构建通过。相比d8430仅UI/index.js改变，其余八包字节不变；UI ZIP SHA-256为`43f61524eaadc35715f0ba548ac324d6afdba18bd5ff92d04aa0779f810dfaa6`。

Android只替换UI并原生重启，8个适用包全部实际成员与新CI一致，顺序、禁用列表、偏好及存档摘要保留；Windows与Android只读存档入口开关/读取通过。四个Android扩展摘要槽继续保留可见原生行。32项真实模块联合合同覆盖正常可用、畸形拒绝及零存储写入，不冒称完整SugarCube业务。未改设置、Hub、天气、业务和兼容路径按专题报告明确范围复用历史证据；未重新操作私人长期存档。

## 三道关卡

| 关卡 | 当前技术证据 | 负责人裁决 |
| --- | --- | --- |
| G1 架构 | A2/A3消费者迁移、六类明确例外、释放与历史反例，见[A2/A3](EVO-A2-A3-CONSUMERS.md)及[覆盖](EVO-P0-COVERAGE.md)；TS First完成，独立复核P2关闭，新两套CI通过 | 整体架构裁决Pending；TS First本轮技术范围Completed |
| G2 视觉 | 已认可设置、球体、雨雪及B01/S01；实际设置整合复验；本次雨幕只改合成方式 | 整体候选Pending，不自行宣布通过 |
| G3 整合 | 原游戏/Mod组合及TS迁移后的代表性Windows/Android场景；178f8b2精确九包、新UI实际加载与只读存档复验，未改业务按原范围复用 | 最终候选裁决Pending |

CI中的moody-gate是技术检查，P2的独立Accept是局部缺陷验收，两者均不替代整体G1/G2/G3及发布授权。RC1、8033b7f、d8430及更早九包保留历史，不作为当前UI下载集合。

## 候选交付与负责人验收

当前试用集合直接复制178f8b2的已验证CI负载：主UI、Host、七个可选兼容ZIP及仅含九包的SHA256SUMS。没有重新构建或改写ZIP；内部PACKAGE_CHECKS、源码身份、原始日志和媒体不混入玩家集合。候选路径属本机状态，见忽略的HANDOFF.local；跨设备从上述标准CI的构建Artifact取得原包，再与当前冻结清单核对。尚无公开下载链接。

包文档检查发现当前UI ZIP的README仍提及未装入包的旧版更新说明文件，而实际已含`docs/RELEASE_4.0.0-rc.2.md`。本批仅将README源文改为指向包内对应版本的说明，未改冻结ZIP；正式版本获批重建时拾取该修正并重新核对摘要。这是说明路径问题，不涉及运行代码或存档P2验收。

负责人可使用已安装的新候选确认整体效果及操作：设置双布局与长内容滚动、Hub展开/关闭背景、窄屏战斗底栏、ModHub管理/帮助、衣柜叠穿详情，以及存档/导出载入页的一致性。此列表供整体体验裁决，不把所有未覆盖环境追加成实现阻塞，也不要求覆盖或删除已有存档。

需要负责人明确的仅剩：整体G1/G2/G3是否接受、拟正式4.0.0是否确认，以及是否授权正式标记重建、main/Tag/Release。此前P2 Accept不自动提供这些授权。

## 已冻结范围

新Canvas天气模型用于设置：血月、异世界、极热、严寒与原有雨雪共存。雨中血月保留普通雨，不启用血雨/血滴。其它匹配窗口保留CSS/SVG天气，本轮修复其中共享雨幕的持续重绘；不宣称新模型已全局替换。未知第三方页面不强行接管，READ01不纳入。

Host独立，使用0.1.5-experimental，公共协议与最低依赖范围不变。兼容包7项按目标选装；ReOverfits仅包/合同检查，本轮无设备目标。MapleBirch现场5.5.5，本轮不声明云端业务完整验收。

## 余下发布步骤

1. 负责人确认G1/G2/G3、拟正式4.0.0、上述范围与已知限制。
2. 获得正式授权后切换正式版本标记并重建，核对最终ZIP、依赖与摘要，完成启动和受影响场景最小复验。
3. 核对首页、Release正文与媒体链接后，按授权合入main、Tag并发布。公开下载与最终SHA清单对应；图片/视频仅在正文展示。

当前没有本轮范围内尚未修复的已知阻塞缺陷。长期资源来源Unknown、无完整FPS、自然特殊事件/iOS/全部Mod组合等边界继续保留；本次没有注入真实畸形存档或执行新存档写入。扩展摘要行的原生回退是已知合同边界。短时雨效改善不承诺根治所有ModHub安装/更新问题。

**发布前技术准备与TS First：Completed；GB40-TS-F1：Accepted / Closed；整体Owner Acceptance：Pending；Release Authorization：未授权。**
