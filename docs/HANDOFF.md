# Soft & Wet 4.x — 当前交接

更新：2026-11-04。4.1.0已发布。本分支只交付旧代封存与4.x文档分离，不含4.2原型实现。

## Current — 当前做什么

- 分支`docs/4x-legacy-main`，直接基于origin/main的c7d8bac67fd04d0a81e59cf4c49800a510a39a11。源研究线的清理提交2776773及文档复核0f0a31d保存在docs/4x-legacy-separation；此处只应用清理差异，不携带被否决的4.2原型。纯清理实现提交6cb4a4a已推送，后继仅补交付文档回执，最新HEAD以Git为准。准备独立PR取得自己的检查，尚未合main或发布。
- [DoL-Game-UI-old](https://github.com/102326/DoL-Game-UI-old)已私有Archived只读，Actions关闭，归档HEAD61990df08986cf1cc9f8b9cd2ab998bb1b4863c4。26个旧Tag/17个旧分支对象一致，212份原文与25份Release正文已核对远端blob及SHA256。原仓库历史/Tag/Release/正式ZIP不改。
- 清理198个旧代专属文件；其main基线字节与源研究清单逐项相同。14个共用/过渡说明先保存原文再改为4.x。当前指导：[文档入口](README.md)、[视觉合同](VISUAL_BASELINE_4X.md)、[Host](HOST_4X.md)、[UI API](UI_RUNTIME.md)。[迁移记录](LEGACY_ARCHIVE.md)/[机器清单](LEGACY_ARCHIVE.json)保留完整范围。
- 本机源冻结2776773已通过ci:check、38项ci:unit、九包两轮独立构建/合同/负例及修改的视觉回归；其后只改非打包说明。main对照分支仍需自己的PR检查，不把源线结果冒签新HEAD。机器路径、Python入口和原日志在忽略的HANDOFF.local.md。

## Decided — 已经确定什么

- 正式4.1入口：[发布](https://github.com/102326/DoL-Game-UI/releases/tag/v4.1.0)、[安装](INSTALL_4.1.md)、[最终记录](releases/4.1.0/RELEASE_RECORD.json)。已取得的Windows/Android/Actions证据保持各自原身份，不因本次封存重新宣布实机通过。
- 4.x用自己的当前规范，旧代文档仅在old库追溯。实际Host/API/兼容包的独立版号与UI主版本不同；现役公共接口、early入口、4.x回归及必要历史反例保留。没有更改运行时、业务、依赖或公共协议。
- 修改的测试仍检查现役配色、原节点/单次动作、语义色及窄屏布局；仅将旧样式本地存在性改为封存清单/迁出检查。Expected Lock只更新该项源码摘要与assertionSites21→31，catalog/规则/required checks不改。
- 独立复核确认212原文及198删除路径匹配；已补回重写时遗漏的wardrobe API注册、getSlotSupport与业务边界，Lab说明改为4.x。Kit内三个原有相对链接按源码包根上下文使用，不更改其打包路径。
- 4.2仍为未来研究，当前Study 02/03已被负责人否决。源码与研究记录在prototype/4.2-first-samples及#35，不属于本PR实现，也不授权继续采用或发布。未改变既有性能/CI研究优先级或门禁政策。

## Next — 下一步做什么

1. 此纯清理分支差异/链接检查与源码推送已完成；接续实际PR验证，运行结果和交付链接在Issue #35集中回执。成功后仍由负责人决定main合入。不要把docs/4x-legacy-separation的整个研究祖先合入main。
2. 后续4.x任务先查新文档入口、当前源码与#35；回看旧资料时只作明确历史参考，不能把归档AGENTS或发布授权当作现行指令。4.2方向先对齐原作/适配/新增再提小样。
3. 新设备先核对HEAD/工作区/远端、Node26.12.1/锁定依赖/实际浏览器与Python；本机日志、依赖、临时服务和私人材料不假定跨机存在。本次无Windows或真机必要验证，不新增或修改发布包。
