# Soft & Wet 4.x — Golden Spin工程与回归场景

本目录由4.x当前工程、受控研究与回归消费；保留球体、真实MotionHub适配、输入/中断/生命周期及宽窄场景，不是旧3.x实施路线。早期说明原文已封存，精确来源见docs/LEGACY_ARCHIVE.json。

当前正式体验以[4.x视觉合同](../../docs/VISUAL_BASELINE_4X.md)、[设置](../../docs/UI_SETTINGS.md)和[交接](../../docs/HANDOFF.md)为准。原型中的版本/参数仅对各自冻结输入有效，不能覆盖现役产品或变成继续编码、main合并、发布授权。已否决菜单研究保持历史身份，不作为默认视觉。

`npm run prototype:golden-spin`启动隔离Vite场景；`prototype:golden-spin:check/build/test`检查对应源码。浏览index.html、hub.html或windows.html时，合成菜单/业务不等于实际宿主通过。现役研究catalog中的golden-spin-b、golden-spin-hub、motion-workspace及input/lifecycle继续保留。

生产代码仍有对此目录渲染/运行模块的现役引用，不因最初开发日期删除它们；4.x历史比较媒体与负例保持原身份。正式消费者迁移必须独立核对原生动作、命中、布局与资源释放，不能以球体单场景成功代替全局。
