# Soft & Wet 4.1：评审候选冻结记录

2026-11-02。负责人反馈修复已实现并在本机及独立 Android 验证；本批集中双 CI 尚待执行，Owner Acceptance Pending，未发布。当前入口见[反馈修复](#负责人反馈修复2026-11-02)。下列 8d66038、afa8457、a5982ec 均保留原身份，作为被后续修改替代的历史候选。

## 前批a5982ec：冻结身份与交付

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


## 当前候选：afa8457

**当前技术范围完成，交付为REVIEW_ONLY；Owner Acceptance与整体性能Gate仍Pending，未授权发布。** 未合main、改公开版本/Host合同、Tag或Release。没有因本轮未覆盖所有游戏场景而否定已完成的性能修复，也没有把局部通过写成4.1全部发布验收完成。

冻结源码`afa8457fbea3375c4f44942bf19211c913c9cb02`。运行修复来自`f294855`；后一个提交只修正动画交接取样、声明锁及记录，产品字节相同。九个Mod ZIP直接复制该冻结点标准CI的原始字节，主UI研发技术版仍4.0.1；不替换公开4.0.1附件。原a5982ec汇总包及其摘要保持不变。

- 汇总包：`SoftWet-4.1-review-candidate-afa8457.zip`，357865字节、13项成员；SHA-256 `c19c396270f9e38a5a244048c506c2bbb8fa7ed766012667e33ee8138e9811c3`。在本机Downloads提供及读回校验，相同输入重复封装字节一致。
- 新主UI原ZIP SHA-256：`ce03139ff2901d5e44ada7b42f5d1e81289fafb1105f2d9b4526e5a35bd06226`。相对上表a5982ec只改变index.js/style.css，boot/版本/依赖/许可与其余16成员不变。其它八个原ZIP逐字节相同，摘要沿用上表。
- 实机使用的本地UI ZIP SHA b2c822d1…与新CI容器摘要不同，**18个成员完全相同**；当前实际Loader的八个自有包全部成员与本候选匹配，ReOverfits未安装。没有用文件名或相同版本号代替成员核对。

[标准41336939223](https://github.com/102326/DoL-Game-UI/actions/runs/41336939223)和[研究41336944764](https://github.com/102326/DoL-Game-UI/actions/runs/41336944764)均精确对应afa8457、Attempt1/success，独立证据均PASS/COMPLETE，标准moody-gate成功。本机下载两份小型独立结果、标准检查和构建原ZIP，重算GitHub原摘要、194项标准索引文件及10项构建负载；九包合同/CRC/元数据/成员/许可/依赖及双构建/反例PASS。完整研究媒体未再次本机下载，其图由远端独立job复核；不冒充本机全图重算。

首轮f294855研究41335001674通过、标准41334996695在header-weather轮廓时钟前进断言失败，后续门禁连锁失败。原结果保留。修正后等待实际可见前景时钟，保留前进/迁移/暂停/清理断言，并检查原时钟退役而新时钟前进；没有通过固定sleep、删断言或调整运行效果变绿。首轮失败的f294855没有封汇总包。

### 本批实现与代表性验证

认可的玻璃参数、雨量/速度/光学水珠、导航节奏和真实控件保留。已审窗口的天气/轮廓联合移到同父并列前景，原控件、值、回调及Orbit几何所有者不动；设置/partial和构造失败保留嵌套回退。实际控制器×8类窗口×1280/390共16组，通过晴雨雪单renderer、原单回调、无横溢与退出；内容为合成夹具，不是实际游戏业务。

同一Android17/WebView155固定Mod组合：真实设置输入/双布局、ModHub五页签两轮、存档/传输/云存档展示，手势滚动、ModHub上设置弹层返回、动态关闭/恢复及六次快速开关通过；偏好/顺序/停用/Start和所有装饰恢复，原生截图已查看。没有新增真实存档、交易、穿戴或云端写入。

### 性能结论与剩余边界

ModHub1.8.3、自然storm/rain强度2、Acrylic60：旧包两次3.5秒采样rAF P95为41.7/41.7ms，新包16.7/16.6ms；不是呈现FPS。正式包顺序为旧旧→重启新包→新新，前置诊断另有ABBA。Chrome短trace的原壳体Paint255→14，绘制转至独立装饰；总Paint与样式累计时间没有全面下降，不宣称CPU/GPU/功耗全面降低。源报告保留正负结果、原始条件及失败，未把参数降级当优化。

当前交付完成的是本批修复与候选整理。负责人整体视觉/性能确认及既定后续整合继续按#31推进；#33仍缺对应现场，Unknown/open。上文实际业务、特殊天气逐消费者、更多设备、长期资源/功耗、GPU、UI卸载/最小Mod等覆盖限制继续适用，不能用本候选或CI代签。固定目标Mod没有升级，不扩大上游版本支持。

本机原始记录在`tests/artifacts/ui41/foreground-plane-20261102/`，新CI下载在其`ci-afa8457/`，候选和原始摘要在`candidate-20261102-afa8457/`。包/私有截图/trace/设备身份未上传Git或公开Assets；Mac通过源码、报告和Run获取当前状态。当前工程记录HEAD可能继续更新文档，CI受验源码始终按上述afa8457读取。


## 当前候选4.1.0（8d66038）

负责人授权推进到正式版准备，最终体验验收后才推出。冻结源码 `8d660382685230a8af74516c307fa97168e13913`；运行优化 `bdc9e92` 与版本/文档冻结分开提交。4.1.0仅在本地和研发分支准备，公开版仍4.0.1；未合main、创建Tag、改公开附件或发布。

### Delivered

- V1默认60、官方/完整兼容材质与设置联动、阅读三滑杆、对齐、双布局、悬浮工具和已认可视觉一并进入同一源码。
- 保留PERF-GLASS-03的动态前景分离及战斗观察器过滤；新增完整匹配ModHub1.9.2的原闭包有界规则缓存，不改作者ZIP、依赖结果、请求代次、安装或游戏业务。
- 只有有样式变化的三包递增：ModHubSoftWet1.0.3、ReOverfitsSoftWet1.0.1、SmartPhoneSoftWet1.1.2。Host、MapleBirch、原版优化、CE和嘴部包的成员与公开版相同，分发沿用公开原字节，不覆盖同版本。
- 玩家设置/适配说明、[安装与回退](../INSTALL_4.1_CANDIDATE.md)、[Release草稿](../RELEASE_4.1.0_DRAFT.md)已同步。[首页待验收稿](../releases/4.1.0/HOMEPAGE.md)已准备，公开首页尚未替换。技术材料留在仓库，公开Assets计划仅九个Mod ZIP与SHA256SUMS；素材不放Assets。

负责人汇总包 `SoftWet-4.1.0-owner-review-8d66038.zip`：347370字节、11成员（九Mod ZIP、玩家README、九包SHA清单），SHA-256 `105bf1c82c6805a65c91c26bdaea00075b5439b62871922d0880184da227c773`。重复封装字节相同、ZIP/清单/Downloads副本读回通过。外层汇总包先解压，各`.mod.zip`不解压。完整九包文件名、摘要、成员、依赖及原字节来源见[制品清单](EVO-4.1.0-PACKAGES-2026-11-02.json)。不含游戏HTML、存档、设备身份、trace或内部验证日志。

### Validated

- [标准41341589416](https://github.com/102326/DoL-Game-UI/actions/runs/41341589416)与[研究41341592938](https://github.com/102326/DoL-Game-UI/actions/runs/41341592938)均8d66038、Attempt1、workflow_dispatch、success；独立PASS/COMPLETE，标准moody-gate成功。Node26.12.1，Playwright1.63.0；没有删反例或弱化断言。
- 下载两份小型独立结果及标准原构建/检查artifact，全部与GitHub摘要相符；196项标准索引逐项重算、SEALED sourceAfter与源身份相同，十个构建负载、九ZIP的元数据/成员/依赖/许可及9项负例/双构建通过。124MB研究媒体由远端独立job复核，本机没有重复全量下载。
- 最终UI CI原ZIP为 `e78f1f38a3e4d1670a4c4d851751af46ec7a566c87388502cc69802d5d53f9e4`；本地装机ZIP为 `3da6395dd82500aa4e2d34b6f0edb3490b34bfe85276225d1f48b2627a192be2`，容器不同、全部成员相同。八个实际加载包的全部成员与最终CI一致；未安装ReOverfits不冒充已装。
- Android17/WebView155、1363×876 CSS视口、47项Loader组合。ModHub1.9.2、MapleBirch5.6.2、原版优化1.1.2.1、CE rebuild.30和SmartPhone Alpha0.3.91.1在当前组合；偏好、顺序及停用列表保留。设置双布局/分类/真实字号输入、ModHub五页签两轮、存档三页展示、触控滚动/模态返回/动态恢复和快速关闭清理通过。
- 原生重启后额外核对运行API与页面标记均4.1.0、ModHub内部推断已命中规则缓存。最终两种布局和0/60/100材质端点已原生截图检查，预览结束恢复偏好。22.04秒、1704×1136原生录屏已在本机交付，无变速、仅裁去末尾空闲；分类/布局用原生触控，Acrylic端点用原UI偏好API切换，不宣称全程手动拖动滑杆。
- 复用仍有效的f294855/afa8457前景/光学/生命周期、8类源控制器宽窄16组及现有原业务合同。新1.9.2组合的两段雷雨rAF P95仍16.7/16.6ms；真实142项目录的只读克隆8轮交错计算中位125.35→38.35ms，输出一致。最终4.1运行JS相对该候选只换版本常量，CSS和早期脚本相同，另验身份/输入；不把这些计时写成FPS、端到端或CPU/GPU/功耗保证。

### 失败与修正

此前f294标准时钟夹具失败等历史不改写。本批首次完整闭包夹具缺DOM/可见状态已按1.9.2真实后台暂停语义补齐，原迟到响应断言保留；早期本地构建后改测试导致身份变化，被合同正确拒绝，另起全新构建身份。

版本整理时，我先只运行Python重封包，漏掉Framework重编译，导致ZIP元数据4.1.0但运行API仍4.0.1。该本地包和失败日志保留、明确拒绝，不作为最终验收。随后执行完整 `npm run ci:build`、重新安装/原生重启，并检查API、页面标记、全部成员和交互；最终包匹配完整远端CI。一次过早连接还在Bootstrap阶段，未操作游戏即因SugarCube未就绪退出；现场脚本增加明确就绪检查，不延长固定sleep或修改产品。原版本不一致断言保留，新增运行身份核对；修正构建和就绪前置后通过。两套远端本批均Attempt1成功。

### Not validated / Known limitations

当前代表性能力已完成，不把未穷举所有环境改写成全部未实现。没有新增覆盖全部安装/更新/启停/排序、云端写入、文件选择、所有交易/穿戴/战斗结算；CE独立业务、可用手机主体和ReOverfits实机业务保留覆盖限制。更多物理手机/iOS/WebView、长期资源/功耗、卸载UI或最小Mod对照未作为本批新增证明。不认定原版或任何Mod承担全部卡顿根因。

#33 Ray预览与祭坛问题仍Unknown/open，缺可靠目标/场景，不宣称修复。A1调用次数降低但未测得耗时改善、未证明收益的原版/Host候选没有强行加入；不以调查项目数量扩大发行范围。

| 状态 | 结论 |
| --- | --- |
| Integrated | 当前承诺源码与九包已整合冻结 |
| Validated | 精确双CI/独立证据、包合同与代表性实机通过，边界如上 |
| Formal preparation | Completed；负责人包、安装/Release材料和追溯清单已准备 |
| Owner Acceptance | Pending，保留此前局部认可，不代替本次整体验收 |
| Release Authorization | 未取得4.1公开授权；不自动合main/Tag/Release |

后续只需负责人验收本候选；若提出本范围内实际缺陷则定向修复并复验受影响部分。认可后再执行公开文件/页面和发布核对，不主动追加视觉功能或扩大生态矩阵。本机私有原始证据在`tests/artifacts/ui41/release-prep-20261102/`，没有上传私人材料。


## 负责人反馈修复（2026-11-02）

8d66038 候选未获整体通过，本轮按实际反馈修改；旧 ZIP、视频、摘要和 CI 保留为历史证据。

### 本轮交付范围

- 删除共享 620ms 三维翻页路径及官方/兼容页专用提交观察器、rAF 与超时。设置、官方与兼容页签、商店分类、战斗分组、衣柜分类不再旋转、裁切或模糊。
- 普通换页直接显示；UI 设置分类仅 20ms opacity 淡入，离场立即移除，不重叠绘制两个大页面。设置双布局直接切换，不再测量各卡片做 420ms FLIP。
- 衣柜取消注册窗口的 100ms 淡入及卧室入口飞框，直接呈现。保留真实预览生成状态、原生业务和穿戴点击反馈。
- 商店改用内容区宽度判断窄屏，与 CSS query 容器一致。实机原内容宽约 780.8px，含内边距约 814px，旧控制器误判宽屏，使 CSS 固定抽屉缺少脚本对应的 narrow/popover 约束。修复后抽屉宽 896px、左右在 1363px 视口内，正文 653px/可视 482px 可滚动，未发现原生错误节点。
- 保留商品选中波纹，撤销详情正文/购买区的长距离侧滑；不克隆控件，不更改报价、购买或穿戴规则。

### 验证与失败记录

原始现场材料保留在本机 `tests/artifacts/ui41/review-fixes-20261102/`，包含修改前截图、原生序列化测试进度、旧 UI 备份、安装与成员身份、失败日志；不公开私人存档数据。

- 原生导出只保留本地测试进度，未写入持久存档槽。`Save.deserialize` 返回元数据而非 boolean；第一次返回值断言错误保留，进度已恢复，不盲目重复加载。后续按实际 passage/DOM 验证结果。
- 首次实机验证发现另一路注册窗口的 100ms 衣柜入场，未把仅删除分类动画写成全部完成；已补修该入口。
- 单独旧 `settings-workspace` 手工入口仍查询已移到其它分类的控件，`shop-current-baseline` 手工入口要求旧单包文件名，本轮未将其失败写成通过，也未为过时断言恢复旧设计。当前设置使用真实组件的 Moody 与 integration 合同验证。
- 衣柜穿戴几何测试在本机 RPC 返回前 1250ms 动画已经完成，原面板对照同样失败；诊断记录真实开始/结束。夹具现在在真实动画 90ms 暂停，仍断言原 1250ms 时长、原生回调、位置、缩放和清理，不更改产品时序或放宽几何断言。
- 一次构建期间安装说明正在更新，包合同拒绝了旧 `docs/UI_SETTINGS.md` 成员，未把该次构建标记通过；文档完成后重新固定输入构建，不修改成员一致性断言。
- 本轮不以旧候选 CI 代替新代码；候选冻结后集中运行标准与研究 CI。尚未取得的新结果不预填为成功。

### 本地候选与已验证结果

本地最终 UI ZIP SHA-256 `0ced45c0191e8d32363e0719fa8cef4e516d2a2bda4127d0e5af768996488f0f`，300364 字节；独立测试 App 运行 API 4.1.0，19 个加载成员全部与该包一致。Host 与兼容包未修改，沿用上一候选，不扩大版本支持。

- Node26.12.1 严格工具/产品/Framework 检查通过；完整双包及七兼容包构建合同通过。
- 定向 `official-game-motion`、Moody 历史反例、`wardrobe-wear-motion`、`shop-ripple-motion` 通过；更新后的设置集成六个命名场景全部通过。第一次集成仍要求两页 620ms 旋转，被新实现正确拒绝；已按负责人最新行为改验一页、20ms、纯透明度，保留输入/反向/中断/释放断言。
- Android17/WebView155，1363×876 CSS：真实服装店抽屉有界、正文滚动；五个设置分类都捕获到纯透明度20ms，结束仅一节、无残留 inert；衣柜原生进入及三个分类切换没有页级动画。首轮漏掉的100ms注册入口修复后重装复验通过。
- 重启早期WebView尚无页面的一次连接失败及原生控件命中保护拒绝保留，未绕过遮挡点击；待真实就绪后使用新上下文复验。测试App进度与UI包有本地备份；未碰私人长期App/存档或云端。

当前候选的标准/研究 CI 与整体 Owner Acceptance 仍分别记录。无 main/Tag/Release 操作。


## 最终补修与发布授权（2026-11-02）

负责人已确认当前效果，授权修复箭头尺寸、验证后直接发布4.1；首页和发布页沿4.0.0的玩家格式，测试、代码细节及防御性说明留在技术记录。

- 实机作弊页 font/button均100%、全局zoom1；32px宽步进按钮错误继承7px/11px普通按钮内边距，三箭头压缩换行，行高约54.6px。修正为至少44px的方形步进控件、零文本内距、图标不换行；随字号/按钮比例调整，不修改原步进回调，也不改普通按钮。
- 临时CSS预览观测为44×44px，三图标均留在框内；最终仍需安装正式构建复验，临时样式不作为发行制品证据。
- 新增宽窄视口、100/150%字号及50/100/150%按钮组合的实际多箭头几何检查，保留一次原生事件与未知节点不接管断言。夹具首次media选择器低于原按钮规则、外部按钮漏掉border-box均已明确纠正，未放宽产品几何要求。
- 先前d5228d1的标准41347623864／研究41347629777在新增修复进入同批后主动取消，避免为已过期源码重复跑完整链。它们不是通过证据；最终冻结后重新手动派发一次双CI。

### Final stepper/device and media checkpoint

- The final installed UI ZIP is SHA-256 `89b66f3fb22ee4ded2e74259a3e499ecd4f8214be7b14b6a7006bc537ce93ca5`; all 20 loaded package members match, including the final player documentation. The previous 19-member checkpoint predates the packaged Release document and is historical.
- Real native cheats show 44×44px steppers, zero text-button padding, no temporary preview stylesheet, no error elements and unchanged money. No stepper action was invoked for this geometry check. The targeted contract also covers narrow/wide viewports, mixed font/button scaling, icon containment and unchanged foreign steppers.
- The final Android settings, wardrobe and shop images and original-speed 23.99-second video are stored under `docs/media/softwet-4.1/`, with sanitized source/member/capture provenance. They are presentation evidence, not FPS or manual-touch measurements. No device identifier or serialized game progress is included.
- Local strict checks, tooling build, final nine-package build and targeted contracts passed. Final exact-source standard/research CI and package rehash remain the public-release gate.
