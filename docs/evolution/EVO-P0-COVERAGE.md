# EVO-P0：建议冻结的架构覆盖与迁移清单

2026-10-22，**负责人原则通过并批准作为A2/A3范围**。授权见[原文](../references/SOFT_WET_4.0_EVOLUTION_V1.2_ORIGINAL.md)，批准覆盖当前表中的自有纳管项和必要例外；新增范围仍不得自动加入。首轮A1及隔离天气V1已另行获施工授权。

## 身份与审计方式

main=`6a6e3c00b705dc67d37c1780b27f585847da5d1a`，公开3.0.4源码=`915dcb9e85f3266a73a3e7ce38d769edd0c29ff4`；main包含后续兼容包修复，不与Tag混称。研究输入=`baf0d48d3d4b63cae1e17ff324d233b9a37e16b4`（main之后16提交），沿用已有独立worktree，新分支`dev/evolution-4.0`。继承的运行差异只有5文件：MotionHub、official motion、设置控制器/组件、sourceMotion；其余原型及证据单独存在。

[词法普查](EVO-P0-inventory.json)固定上述研究输入，在src、official-ui、motion-hub、compat及两类研究原型中检索动画、生命周期、几何和材质线索，逐文件含SHA256；共89个命中文件。词法命中**不是消费者纳管证明**，也不能识别所有间接CSS变量消费。下表按实际入口和职责归组，未宣称全仓100%覆盖；将来增加入口必须登记而不是计入已完成。

## 建议范围

表中“纳管”指共同所有权/失效/取消/坐标/资源合同，不强制换引擎、统一组件或改变视觉。A1已施工，其余纳管项为已获批的A2/A3范围，须逐项验证并退出旧路径，不等于已经完成。

| 消费者及正式入口 | 输入基线的管理/实现 | 决定及例外理由 | 验收与旧路径退出条件 |
| --- | --- | --- | --- |
| 属性 src/characteristics/main.ts | 独立overlay发现、Vue/Host挂载、observer、租约；sourceMotion专属卡片/接力 | A1收敛基础，保留原生正文、识别和演出 | 双端真实Host测试、原节点/事件、Zoom、快速意图、故障；旧基础代码删除，薄配置入口保留 |
| 社交 src/social/main.ts | 与属性同构但租约/异常代码已漂移；专属高亮 | A1同一适配器，不强制同一Vue组件 | 同上，保留社交分组与显示语义；不得重建关系宏 |
| 通用原生页 src/panels/main.ts | 多PanelKind、独立overlay/正文发现与取消 | 纳管共同作用域；原生/非overlay宿主保留专用控制器 | journal/traits/statistics/feats/cheats/attitudes/settings各kind覆盖后方可退出旧基础；未知页不接管 |
| 原生窗口呈现 framework/official-ui/motion.ts | 自有代理、输入标记/observer/帧调度，含缩放与重定向 | 纳管自有层，不接管游戏窗口动画 | native事件单次、无错误恢复、隐藏/关闭重开；撤销旧代理路径须与对应场景对照 |
| 原生导航 framework/official-ui/navigation.ts | sidebar/tabs/CE分组、自有Vue OrbitFocus、原属性还原；消费headerWeather | 共享租约/清理，已审白名单识别独立保留 | 原生按钮/第三方原事件、精确属性还原、group退出后零owned节点 |
| OrbitFocus src/ui/OrbitFocus.vue | 独立Resize/Mutation/RAF与sourceMotion；已有局部坐标换算 | 纳管作用域/坐标，保留局部滚动与圆角 | CJ-3B反例、NaN/Infinity、生产CSS、缩放/滚动和卸载；迁移后不得绕回自有定时器 |
| GameButton / SettingsToggle | Vue控件、CSS波纹/hover/focus | CSS/Vue可继续使用，登记所有者而非禁止声明式能力 | 点击/键盘/disabled/reduced、卸载；非必要无物理积分 |
| 设置 src/theme/controller.ts | 正式研究src仍b507基础，V2.3当前仅隔离生成副本 | 纳管窗口生命周期；**最终必须保留100/80ms及立即可用** | 整合时搬迁已认可方案，旧开关代理才可退出；不拿原型代替生产集成 |
| 设置分类/布局/预览 SettingsPanel.vue、SettingsNavigation.vue、SettingsPreview.vue | sourceMotion与Vue过渡、layout observer，多作用域 | 保留V2.2分类视觉；收敛作用域/失效和坐标 | 最新意图、隐藏/卸载/Zoom、布局/偏好与原事件；原生成副本不永久充当正式入口 |
| 主题/侧栏布局 src/theme/layout.ts、sidebar-layout.ts、theme.ts | 部分共享，多个observer/RAF，原样式恢复 | 纳管自有布局任务，不替代游戏布局语义 | 移动/滚动、恢复/重复挂载；保留布局fallback直到等价验证 |
| 天气 framework/official-ui/weather.ts | readGameWeather权威读取、headerWeather表面Map/轮询、sourceMotion交叉退出 | 复用读取与neutral fallback，V1研究新材质参数；生产升级后退出旧paint/粒子路径 | W1–W4及天气字段边界/隐藏/减少动态；旧CSS/SVG删除须所有消费者已迁移 |
| Acrylic/theme CSS及天气SVG src/theme/*、runtime/surfaces.css | 共享tokens/角色样式，多个局部blur/天气选择器 | 按角色纳管材质；必要嵌套blur例外，不能无差别删除 | 分角色可读性/多窗口采样/静动态对照；无消费者前不删样式或背景层 |
| 公共表面 src/runtime/ui.ts、surfaces.ts、inspector.ts | 既有Surface/owner、DOM observer、焦点/模态合同 | 复用而非另造中央Runtime；公开UiApi v1不变 | ui-runtime、modal/focus/恢复、owner释放；共享原语证据成立前保留适配 |
| 公共管理 master/presentation/sugarcube | 已共享开关、隔离失败、Vue释放、场景适配 | 继续复用，按具体消费者补故障测试 | 不重试原生业务事件；不得扩大成为游戏事件运行时 |
| 正式Hub framework/official-ui/hub.ts、motion-hub/MotionHub.vue、geometry.ts | 真实Host视图/工具/拖停靠与布局，专用生命周期 | 纳管资源与坐标但保留真实工具/终态布局 | H1–H4，焦点/拖停靠/反向/owner；候选通过后退出冗余动效路径 |
| Golden Spin prototypes/golden-spin-b/{sphere,hub-motion}.ts | 已认可球体，独立GSAP/Canvas；Hub联动仍研究且工具曾整段禁用 | 冻结球体外观；V2必须处理动画期间操作，不继承旧禁用策略 | H1–H4实际工具，不以单球测试替代；星形刻纹/新轨道/菜单布局未经许可不引入 |
| 旧Floating src/floating/main.ts、FloatingTools.vue/Settings.vue | 经典入口及偏好，official renderSurface=false | 作为经典fallback例外保留，先共享偏好/释放 | 正式/经典双路径均可用后评估退出；不因官方Hub存在直接删除 |
| 商店 src/shop/main.ts、ShopReference.vue、Toolbar.vue | 专属source/transaction、Host/Resize/布局/波纹、sourceMotion | 只共享视觉生命周期/坐标；购买和事实读取语义保留 | 单次原事件、比较关闭/重入、分页、窄屏、已提交业务不可回滚 |
| 衣柜 main/WardrobePanel/ReferenceDock/outfit-layout | 真实节点搬移、专属异步渲染/缓存/observer/动画 | 纳管自有作用域；原生穿戴/预览/restore边界例外 | 原节点不复活、穿戴/搜索/抽屉/预览恢复、异步迟到；原渲染器不重写 |
| 衣柜 renderer/sidebar-preview/vendor | Canvas/render jobs；上游isolated-model与像素算法 | 自有wrapper资源纳管，上游vendor例外冻结 | 取消/缓存/卸载；不将第三方渲染算法算成自有纳管比例 |
| 战斗 src/combat/* | 多session/真实动作/选择框、Host挂载、专用RAF/Resize | 纳管自有视觉资源，真实战斗业务/系统选择器例外 | 原动作单次、恢复/聚焦/多region、实机选择框；不克隆或吞原事件 |
| 存档 src/saves/* | panel Resize、传输/元信息及Host生命周期 | UI任务纳管；导入导出及玩家数据语义例外 | 保存/载入不由动画完成代替，传输生命周期/异常/焦点；禁止自动采集私人存档 |
| referenceShelf / wardrobe-reference | Host贡献/比较、异步来源与视图 | 复用Host合同，表面/任务可纳管，来源语义保留 | 撤销/迟到/重复标识/卸载；不新增外部API |
| compat ModHub/MapleBirch/Optimization/CE/SmartPhone/ReOverfits | 自有外观适配、原属性保存/还原、源Mod入口白名单 | 仅本工程装饰层纳管，第三方业务/未知页明确例外 | 已有adapter/material/native事件测试；无专用识别不接管第三方动画 |
| compat Mouth/Lyra mouth | 资源映射，无窗口动画 | 排除视觉纳管统计，保留包合同 | 资源测试；不为了统一管理强加UI依赖 |
| story-actions | 当前默认退役能力，仍保留历史/回退代码 | 不重新启用；若未来明确批准再纳入迁移 | 默认开关/历史合同；不能将死代码算成已纳管消费者 |
| Framework Host/connect/contracts | 已有owner/mount/claims/cleanup，多个独立参与者 | 作为共用基础复用；本轮**不改对外Host API** | framework契约/peer隔离/故障清理，不建设新Host版本 |
| Framework workspace/factory/examples/component-lab | 开发与作者工具，非正式玩家UI入口 | 此次玩家视觉范围外例外；可能消费共享内部修复但不自动重做 | 原类型/构建保持；新增作者API需单独授权 |

## 已批准范围与关卡

负责人已批准上表自有视觉/生命周期纳管项及列明例外。**本表已获批准，A2/A3允许继续**，新增消费者不能默默加进范围。商店、衣柜、战斗、存档和原生dialog各自保留业务/宿主控制器；统一的是管理合同。上游游戏、第三方Mod与玩家存档不计自有资源。

性能阈值暂只使用已有确定性几何/释放门槛与本机原型观察；Windows、Android WebView、真实设备DPR/系统缩放及并窗长期性能尚未建立4.0数值基线，不编造FPS目标。现有手机/平板只有型号报告，没有实测viewport，不能按英寸推导。A0后与负责人确认设备测试安排。

A1通过只是路线验证；V1原型只有Implemented/Tested候选身份；G1/G2/G3均未通过。所有旧路径退出要求：真实消费者已转入共用实现、正负及回退证据成立、Host/原生/第三方合同保持，再删除，不能以“以后整理”永久并行，也不能在未迁移前抢删。

## 当前迁移增量

[EVO-A2 焦点坐标与反向检查](EVO-A2-ORBIT-CONTINUITY.md)使OrbitFocus迁移起点/终点共用 `navigationRect`，修复边框重复计入和失效定位；保留原动作及事件。组件/原生导航的完整资源作用域收敛尚未完成，不借本次坐标增量将该行标为全部退出旧管理路径。

[EVO-A2-L01](EVO-A2-MOUNT-LIFECYCLE.md)让属性/社交、通用面板overlay及passage实际共用导航挂载事务；保留专用发现、内容索引、演出和宿主生命周期，退出旧独立claim/mount清理路径。这里只更新已迁移族的状态，不重写上表冻结输入身份，不宣称其余消费者或整个A2/A3/G1完成。

[EVO-HUB-V2-INPUT](EVO-HUB-V2-INPUT.md)已在隔离真实Hub组件退出整段输入禁用，完成H1–H4受控输入/生命周期检查；球体与终态布局冻结。它是V2研究增量，不将正式Hub标为已迁移或Integrated，也不更改上表的原始输入身份。
