# Soft & Wet 4.1 — 跨设备当前交接

更新：2026-10-29。总跟踪[#31](https://github.com/102326/DoL-Game-UI/issues/31)，顺序 **7→6→5→3→2→1→4→8→9**；必要验证贯穿各批。本文件只保留接手快照，历史过程沿[UI实施与失败记录](evolution/EVO-4.1-UI-765-2026-10-27.md)及Git历史读取。

## Current — 当前做什么

- 分支：`feature/4.1-ui-material-hub`。当前运行代码 **`42269972b5b304e0a74973fa6c5dc9c8926127c8`** 已提交/推送，接续`e909eaf`补齐真实存档导出页的呈现租约及页签交接。后续文档HEAD以实际Git为准。未合main、改版本/Release、Host公共协议或远端保护规则；开发包版本仍4.0.1，不是新的正式发行。
- **WORKSPACE-03**：紧凑默认与剩余自有表面接入已形成研发候选。设置、九个原生语义入口、独立存档/详情、商店、衣柜/参考/自有drawer、战斗及已审兼容宿主，沿[同一消费者表](evolution/EVO-P0-COVERAGE.md#41统一交付覆盖补充2026-10-28)区分实现、受控测试、视觉认可与游戏/设备整合。不能宣称4.1全局验收完成。
- 无等待负责人才能继续的本机工程阻塞；下一关是本批视觉裁决、实际游戏/多Mod/设备和持续性能证据。#33两案未修复；已重新读取Issue，暂无新增Ray版本/复现数据。
- 原日志、原图、本机补充与5204服务没有同步到其它设备；路径见Git忽略的`HANDOFF.local.md`。不自动采集或上传玩家存档、游戏HTML或凭据。
- **Windows/Android新证据**：Windows Edge157宽窄受控预览通过；独立Android测试App已加载主UI修补包及七个未变的CI包，八包成员逐项核对、Loader顺序/停用列表保持。真实设置触控、双布局/滚动、ModHub五页签、存档三页签及原生选项/标题页成就、Hub扇形/网格与关闭清理已检查；不代替保存/载入/交易/战斗结算。新提交双CI均success、独立证据复核PASS/COMPLETE：[标准40719759793](https://github.com/102326/DoL-Game-UI/actions/runs/40719759793)、[研究40719767518](https://github.com/102326/DoL-Game-UI/actions/runs/40719767518)；九包/十项负载摘要已下载重算，八个已装包成员与新CI一致（ReOverfits未装）。
- **性能限制**：e909eaf在真实ModHub雷雨场景的短ABBA中，开动态的rAF间隔P95约41.7–41.8ms，关动态约8.4ms。已保存原始记录、Perfetto/SQL/CSV；此开关同时影响多种动画，不能全归因雨滴。尚无本轮停用UI/最小Mod对照，未认定原版或目标Mod根因；详情见原UI实施报告新增Windows/Android段。

## Decided — 已确定什么

1. **产品基线**：保留默认60%/默认左对齐、认可黑灰Acrylic、C5.2/R10雨滴/斜雨/四档雨量、FROST02浅霜、球体和Hub响应时序。设置是共享呈现来源，不因实现不同允许视觉各自成套。侧栏compactStats已撤销；三阅读滑杆取代旧舒适/宽幅开关。
2. **紧凑排版**：默认收紧标题/说明/well及已识别表单内距，主要命中保留44px；正文默认继承原版。原有“段落与选项间距”额外值同时驱动自有表单/列表留白，默认0，不新增间距开关；保持用户已有偏好和恢复语义。原生select渐进美化保留节点、原事件、键盘/Escape及不支持引擎的系统回退，排除multiple/size和未知第三方。
3. **呈现与所有权**：主自有表面接轴与适用完整天气，模态前景暂停背景完整renderer；legacy CSS peer保留原共享更新。内部呈现租约不是Host/第三方新协议。inline详情、只读副本及经典网格用reading well；reference保留单一原空间动画；SmartPhone虚拟屏幕/debug不铺雨，不涂改其他作者frame。原生窗口立即关闭，只有背景80ms退出；无旧业务页离场副本，不延迟业务或克隆旧控件强造一致性。栏目只闪已有标题，旧分组Orbit/relay不恢复。
4. **本机证据**：Mac arm64 / Node26.12.1 / Playwright1.63.0 / Chromium153。构建/类型/声明锁、原select/adapter/motion/weather/资源/业务合同与受控预览通过。最终e909eaf干净树再跑1280/390×四个独立主场景及详情、原生/无API/外部popover、原事件/退出子路径，构建摘要匹配；原九入口/五类表单、材质与Hub集成证据沿报告。均为真实源码＋合成输入，不能代替真实保存/载入/交易/换装/战斗结算。旧Edge测试仅隔离替换launch到Mac Chromium，不计Windows已验。
5. **实际失败保留**：65189f7首轮标准40698571933/研究40698579022均失败。修正自Canvas被保护导致雨滴全隐、modal误删legacy peer，按已批准行为更新过期社交Orbit巡检。商店fixed/query容器定位、宽视口窄shop详情、combat底栏定位、reference双动画及Hub重复背板也有反例/定向证据。未通过延长sleep、放宽断言、删门禁或扩矩阵处理。审查者只读复查无剩余明确发现，未自行运行测试。
6. **最终远端证据**：下列同e909eaf、Attempt1、workflow_dispatch，均success，独立下载证据复核PASS/COMPLETE，标准工作流内moody-gate也成功；不是PR检查或新保护规则。

| 工作流 | Run | 本次实际总耗时 |
| --- | --- | --- |
| 标准：源码/业务、九包、ZIP合同/负例/双构建、浏览器/布局 | [40702217590](https://github.com/102326/DoL-Game-UI/actions/runs/40702217590) | 16分28秒 |
| 研究：完整受控研究与独立证据复核 | [40702225001](https://github.com/102326/DoL-Game-UI/actions/runs/40702225001) | 10分51秒 |

Mac只下载两份小型remote-verification结果核对GitHub ZIP摘要、源码及PASS/COMPLETE；未再次本机重算全部ZIP/研究文件。完整下载证据重算由Actions独立job完成。耗时不是产品性能结果，未作配对归因。

7. **性能主线保留**：天气C1/C3负结果撤回，C2仅小幅受控收益；[ModHub B3](evolution/EVO-4.1-MODHUB-B3-2026-10-27.md)等价/缓存与合成、公开catalog研究保留，尚未实际安装接入，不把算法计时当游戏收益。HC-07已有局部退出故障修复，其余Host候选仍为[调查](evolution/EVO-4.1-HOST-SHARED-SURVEY-2026-10-26.md)，不另建路线图。前期采样入口见[性能前置交接](HANDOFF-2026-10-26-perf41-before-ui765.md)。

## Next — 下一步做什么

1. 换机先核对branch/HEAD、工作区、领先落后、Node26、锁定依赖与实际浏览器；保留本机独有工作。前批a4e1320/47a6a1e/c3b280f的Run只覆盖各自源码。应用build会清空dist，正确预览构建顺序：`npm run tooling:build` → `npm run build` → `node scripts/build-framework.mjs`（最后执行）。
2. `node scripts/preview-ui41.mjs`启动本机5204：`/?settings&weather=heavy`看紧凑设置；默认页九入口；`/?independent=saves|shop|wardrobe|combat&weather=heavy`看独立窗口（`|`表示选择一个值）。先做本批视觉裁决，再按表逐项记录，不用设置成功代替其它窗口。
3. **回家优先**：真实原版间距/br/复杂嵌入、多Mod与原版回退；真实存档/工具、交易、换装/搜索/分页、战斗多region/结算、参考/drawer与全部特殊天气逐消费者。#33先确认Ray衣柜实际preview-source、源/副本bitmap/CSS与图层，再调查祭坛原元素，禁止全局img/canvas缩放掩盖。
4. Android/WebView触控/系统选择框/软键盘/旋转/安全区、Windows原生弹层；相同档位和操作下交错测GPU/持续帧率/功耗。Actions/Mac通过不代签。保留天气/ModHub正负证据，真实热点验证后才决定优化候选接入。
5. 最终4.1用同一集成源码核对全部消费者、CI/制品身份与负责人验收；分支分开不等于可以漏整合。CJ-4及bypass另批，不自动合main、发布或更改游戏/玩家数据。
