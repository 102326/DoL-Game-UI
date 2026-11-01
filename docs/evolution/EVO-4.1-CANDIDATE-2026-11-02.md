# Soft & Wet 4.1：评审候选冻结

2026-11-02。按负责人“执行到候选阶段”的要求整理。**已形成可安装、可核对的评审候选；动态性能关卡未通过，尚未达到可发布RC。** 本次没有通过修改口径关闭性能主线，也没有加入试验失败的视觉降级。

## 冻结身份与交付

运行源码：`a5982ecb158a6028913451e2b3fcb45f97a255f6`。准备时记录HEAD为5bfa144，此后只有工程文档变化，产品输入未改。九个Mod ZIP直接取自该源码的标准CI制品，保留原字节、成员、依赖、许可证和技术版本。主UI仍显示4.0.1，以源码与摘要区别于公开发行包，不冒充正式4.1版本。

本机汇总包`SoftWet-4.1-review-candidate-a5982ec.zip`，包含主UI、Host、七个可选兼容包，以及README、验证说明、候选身份清单和SHA256SUMS。原始Mod包无需解压；汇总包需要先解压，不能直接导入Loader。汇总包只在本机交付，没有上传公开Assets；截图、设备身份、游戏、存档、原始trace和检查日志均不包含在内。

汇总包SHA-256：`8dca9cbd67d02f4a7310c7d951546ccd68bac14d08bd94623079ef8c277516ba`（369898字节）。九包SHA、成员、boot依赖、许可证、CRC与ZIP元数据重新核对；汇总包从相同输入二次生成字节相同，13项负载/校验表读回复核通过。

| Mod技术身份 | 候选内技术版本 | 原ZIP SHA-256 |
| --- | --- | --- |
| StoneFreeHost | 0.1.5-experimental | `6f221a29f9a042e9c5f32b4b9be9894d6941df4bebd29a5d326a44a8377cb8b8` |
| DoLGameUI | 4.0.1 | `858ed702b8c6f346a7e5e2a19ea71d8bc7d34990bed4bd7fccb989751638eda2` |
| ModHubSoftWet | 1.0.2 | `674dd1065d633dc236191a9759862d0581cd237300b7dda5609591af0a43967c` |
| MapleBirchSoftWet | 1.0.1 | `ab2c8c41bce8ffee4a1ae4e226fa700671602dfe4546213d380adfc179d43e00` |
| DolOptimizationSoftWet | 1.0.3 | `f1120c18c8e058b0647d84676b217d278557b66c3611d9643f8ebf3213510f1f` |
| CheatExtendedSoftWet | 1.0.0 | `a1e9b85c10d78e94384632835b0faf13a0aa95ffff36933386118853f4925f6d` |
| ReOverfitsSoftWet | 1.0.0 | `d83df5b9685496be7069e7ac3f955dc82a0123a0bbac2841b33b886b73b255f2` |
| LyraMouthCompat051213 | 1.0.0 | `ce46b497ef8d35b307bb7e4530b661662d66bd80cd9c45193120d59720a4a827` |
| SmartPhoneSoftWet | 1.1.1 | `2e140cddfb66bf7226a00b4bb52a57db289cc62a57849bca0c31e78437ee285c` |

## 证据与当前关卡

| 项目 | 状态及边界 |
| --- | --- |
| Integrated | 已冻结当前研发实现，V1/default60/left、认可雨雪、球体与业务/Host合同保留；本批无产品源码修改。 |
| Validated | 复用a5982ec的[标准41323469961](https://github.com/102326/DoL-Game-UI/actions/runs/41323469961)、[研究41323475873](https://github.com/102326/DoL-Game-UI/actions/runs/41323475873)，均Attempt1/success、独立PASS/COMPLETE，标准moody-gate通过。九包合同/负例/双构建有效。本轮没有重跑未改输入的全套CI。 |
| 当前实机 | Android17/WebView155，八个已装自有包全部成员匹配候选，ReOverfits未装。设置双布局/分类/实际字号滑杆100→115后恢复、ModHub五页签两轮、存档/导出载入/云存档展示及退出，共19组窗口状态受检：零宏错误、零内容横溢、单renderer。 |
| Performance | **Blocked**：ModHub雷雨动态rAF间隔P95约41.6–41.7ms，静态/UI总开关关闭约8.4ms。不是FPS，也未归因原版或ModHub。 |
| Owner Acceptance | Pending。原局部认可继续有效，本轮未代替负责人判断4.1整体视觉/性能。 |
| Release Authorization | 无4.1发布授权。未合main、改公开版本/依赖合同、Tag或Release。 |

采后自有UI全部偏好、布局偏好、Mod版本/加载顺序/停用状态和Start与采前一致，窗口/renderer/诊断style归零，自有CDP资源退出。实际字号使用Android触控，不用API赋值冒充真实控件输入；恢复偏好不涉及游戏存档。ModHub默认档原生截图已查看，无新增视觉通过声明。

当前固定目标组合包括ModHub1.8.3、MapleBirch5.5.6、原版优化1.1.2.1、CE1.20.3.1-rebuild.30、SmartPhone Alpha0.3.91.1。ModHub页面提示部分目标有更新，本候选没有更新它们，不宣称支持最新所有上游版本。游戏仍为0.5.12.13；最低依赖沿原ZIP合同，Node26.12.1仅是开发工具要求，玩家端不增加Node依赖。

## 本批性能试验为何没有进入候选

接续[PERF-GLASS-02](EVO-4.1-UI-765-2026-10-27.md#perf-glass-02--动态绘制隔离与浏览器时间线2026-11-02)。新做动态→移除静止透视→移除→动态短对照，P95约50/41.7/41.7/41.8ms，未得到稳定收益。另一组将使用相同材质参数的底面临时移至独立伪元素，P95由动态基线41.7ms恶化到75.1/83.4ms，恢复后回到41.7ms，已撤回。不能把样式/脚本累计减少当作整体变快，未据此修改运行代码。

图层快照采到30层，但后续compositingReasons查询被CDP拒绝，保留partial和错误，不冒称完成全图层归因。所有临时样式已退出。源报告中的早期负结果、两段无效滤镜隔离和脚本失败继续保留；本次不通过降低雨滴数量/分辨率/速度/通透度来制造收益。

## 未验证与剩余工作

- **正式RC前必须继续的工作**：动态绘制/合成卡顿的安全优化及实机对照，候选整体视觉裁决；随后按原消费者表完成当前范围的整合关卡，不能用本汇总包代签。性能没有接受结论时不标Release Ready。
- **已知问题**：#33的Ray衣柜预览与祭坛溢出没有对应当前Mod现场，未修复/未关闭。旧combat-resize额外入口仍停在历史色值断言，后续步骤未执行，原断言保留。
- **本轮未执行**：保存/载入/文件导入导出/云端写入、交易/穿戴/战斗结算、全部特殊天气逐消费者及长期资源。原受控合同和历史实机证据分列复用，不能写成这些流程的本轮全通过。
- **覆盖限制**：CE独立菜单、可用手机主体、ReOverfits业务、更多物理手机/iOS、其它WebView和本轮UI卸载/最小Mod/GPU counter对照未新增验证；嘴部资源包没有窗口材质验收项。没有为扩大覆盖修改玩家数据或安装新目标Mod。

本轮候选准备与代表性装机核对已完成；性能任务及4.1整体关卡仍开放。候选原ZIP、收据和实机原始资料在本机Git忽略的`tests/artifacts/ui41/candidate-20261102-a5982ec/`，新性能负结果在`perf-glass-20261102/`；没有随Git同步到Mac。跨机接续以[HANDOFF](../HANDOFF.md)和Issue #31为入口。
