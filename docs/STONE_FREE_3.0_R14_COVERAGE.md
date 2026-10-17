# Stone Free R14：正式功能覆盖与发布差距

2026-10-17。正式2.7源码基准为本地标签 `v2.7.0` 指向的 `965afcf119260886319f5beb6616362acb306a09`。R14从R13提交 `1d77b4d8a57df66e4961e3c3294488624bd05bf8` 继续。工作树 `experiments/stone-free-framework-30` / `research/stone-free-3.0-framework`；入场干净。

`experiments/stone-free-30`仍停在上述2.7提交；`publish/DoL-Game-UI`的main仍为`937dad7`（2.2.2历史主线）。本轮未切换、合并或修改这些工作树，不把其main误当作2.7源。其它实验工作树保留原归属。

状态只针对本行：**Preserved**保留实现；**Migrated**自有UI接入公开生命周期；**Redesigned**有新增交互；**Deferred**明确延后；**Unknown**缺少足够来源。Migrated不意味着接管原内容、数据或业务；源码保留也不等于所有交互重新跑过。

| 正式功能 | 当前状态 | 实际来源 / 本轮范围 | 证据与边界 |
| --- | --- | --- | --- |
| 衣柜 | Migrated | `src/wardrobe/main.ts`、`WardrobePanel.vue`、`ReferenceDock.vue`；原Source、快穿、整理、未知入口保留 | R14比较/自然离开/重入；修复全局弹层被收进隐藏原版区；未遍历全部整理和衣槽 |
| 服装店 | Migrated | `src/shop/main.ts`、`source.ts`、`ShopReference.vue`；原商品/配色/价格与按钮保留 | R14真实数量滑块、普通2件送回、余额不足拒绝；只读比较/分页/窄Drawer |
| 交易反馈 | Redesigned | `src/shop/transaction.ts`；普通1–10件精确合同，不能套用于套装 | R13单件历史证据 + R14两件原业务；部分入库/陈旧/不支持为定向夹具；不额外确认套装、其它目的地 |
| 战斗 | Migrated | `src/combat/main.ts`、`source.ts`；原控件、继续及算法保留 | R13单人演示回合；R14双人目标切换、连续回合、退出/准备页重入；不等于自然遭遇或结算 |
| 社交 | Migrated | `src/social/main.ts`自有导航persistent mount；原关系区不重建 | R13实际overlay和R14整合；原控件身份/事件及替换由定向测试 |
| 属性 | Migrated | `src/characteristics/main.ts`自有导航persistent mount | R14原characteristics页及替换/owner退出/peer/经典定向测试；不是属性业务重写 |
| 游戏设置 | Migrated | `src/panels/main.ts`自有overlay导航和Settings/Attitudes passage导航 | R14原options页、开关回退、Settings Passage挂载与失效；原设置值不重建 |
| 官方界面设置 | Preserved | `src/theme/controller.ts`、`SettingsPanel.vue`、`preferences.ts` | 与2.7源码一致；R14打开/关闭、总开关和已存在偏好；迁移/局部恢复复用2.7记录，未本轮全跑 |
| 侧栏 | Preserved | `src/theme/layout.ts`、`sidebar-layout.ts`、`sidebar.css` | 与2.7相关源码一致；整合原入口/总开关/消费者退出；未覆盖全部触摸手势 |
| 存档列表/详情/V2 | Migrated | `src/saves/main.ts`自有persistent mount；原槽位/Source不变 | R14打开/隐藏释放/V2切换/再入，组件详情与200%布局；不声称存读档业务通过 |
| 存档metadata和原操作 | Preserved | `src/saves/metadata.ts`、`source.ts`，与2.7一致 | gameTime/字段合并不改；本轮source定向测试；真实私人存档不读写、不迁移 |
| 导入/导出 | Preserved | `src/saves/transfer.ts`补识别原export key；原节点和值/事件保留 | 原export页能进入外观适配；回退身份/值由定向测试；未生成、导入、复制或导出存档 |
| 特质 | Migrated | `src/panels/main.ts` + `presentation.ts`；仅导航和原条目呈现 | R14原traits页、重复关闭/返回；unknown/hidden由既有逻辑和测试，不解析重建Trait |
| 统计 | Migrated | 通用面板导航；原统计宏保留 | R14原statistics页显示/关闭；未点击全部统计展开/剧透项 |
| 成就 | Migrated | 通用面板导航；原gameFeats列表保留 | R14原gameFeats页；不读取隐藏定义或重写成就状态 |
| 日志 | Migrated | 通用面板导航；原journal/notes输入保留 | R14原journal页；未编辑或保存笔记 |
| 态度/特殊设置 | Migrated | 已接入passage mount的同一模块 | Settings定向/真实代表；Livestock/Attitudes特殊场景未逐个实机验证 |
| 阅读 | Preserved | 原Passage + `src/theme/layout.ts`、`midnight.css` | 不拆原动作/正文；2.7宽阅读偏好和响应式保留，未设计新的全局动作底栏 |
| 主题/视觉档位 | Preserved | `eyes.css`、`visual.css`、`controller.ts` + 官方 `stone-free.css` | Ocean/Acrylic、减少动态效果及轻内容；R13有效主题采样复用；R14快照沿用同套token |
| 响应式 | Preserved | 原容器断点与`mobile.css`；Host只加自有UI挂载层 | R14受控390px和宽窗、Android平板；不称物理手机/IME证明 |
| 快捷键 | Preserved | 原游戏编号及原控件事件；API1 Surface/快捷键租约 | 原快捷键不重写；R9–R13同伴/命令合同复用，本轮只验证所用原输入与退出 |
| UI API v1 / Inspector | Preserved | `src/public/`、`runtime/ui.ts`、`runtime/inspector.ts` | 源码与声明不改；R14新鲜经典入口仍API1；不新建v2或SDK |
| 早期注入 | Preserved | `shop-page-experiment.ts`、`scripts/build-early.cjs` | 同经典构建逐字节一致，默认关闭 |
| TweeReplacer补丁 | Preserved | `scripts/shop_package.py`、四项twee资源 | 实际装配并比较四项资源；真实原分页，未改变补丁顺序 |
| 生命周期 | Migrated | 衣柜/商店/战斗/社交基础上，新增属性、面板、存档自有UI挂载 | 当前scope覆盖；主题、侧栏、API服务仍由官方主消费者统一destroy，不为标记Migrated造空mount |
| 兼容和原版回退 | Preserved | Source/guard、`restoreNative`、逐页与总开关 | 原未知内容不丢；R14总开关、局部设置与owner退出、peer保留；非任意Mod组合保证 |
| 跨场景参考 | Redesigned | `framework/official-ui/reference-shelf.ts`两份会话显示快照 | 衣柜和商店独立清除、离场明确标注，只读无旧业务句柄 |
| Widget/任意布局/全局动作增强 | Deferred | 历史研究保留，不进本轮交付 | 不阻塞R14，也不冒充正式3.0已完工 |

## 实际缩小的差距

- 原包已有而研究包缺少的设置/可选适配说明已加入ZIP；未把2.7旧Release或内部报告全部打包。
- 属性、通用面板和存档的自有UI进入公开Host生命周期；没有为了包装原内容而新增DOM搬家。
- 原衣柜归拢内容时会将已知`#customOverlayContainer`收进折叠原版区，造成菜单有DOM却不可见。本轮与原header/footer一样保留其原位置，Windows/平板流程直接在衣柜中验证菜单，不用离开衣柜规避。
- 原存档菜单隐藏后旧自有节点仍驻留，本轮改为关闭时释放、重开再挂载；metadata业务和格式保留。
- 原导入导出使用`export`，旧适配只接受`saves`。补充已知标识，其它云端/未知入口仍退让。
- 原多件滑块原地更新控件，旧防陈旧绑定会持续拒绝。仅允许原range在其它报价上下文不变时刷新，已消费句柄不能复活。
- 已确认交易在重新浏览商品后清除旧成功提示；unknown不会因选择新商品被静默清除。固定A的商品文本可在离场后从Hub只读查看。

## 下一阶段覆盖，不是本轮新增实现承诺

自然遭遇/战斗结算、动物/其它战斗、套装/其它配送、全部第三方衣槽和复杂Mod、物理手机/IME、长期性能，以及全部存读档业务仍需各自目标与数据授权。原动物演示源码存在`animal`/`bestial`分支不一致的疑点，仅为源码结论，未复现；不为本轮手工拼造动物战斗状态。

最终范围及收据见 [R14报告](STONE_FREE_3.0_R14.md)。


## R15 增补（2026-10-17）

上表保留 R14 当时的证明范围；以下更新当前结论，不另造重复总表。基线为 R14 提交 `7a38b6d7dd300194335f2bc4127907ff7a0e2c88`。

| 既有行 | R15 新增证据 / 变化 | 当前边界 |
| --- | --- | --- |
| 存档列表、metadata、原操作 | Windows 0.5.12.13 / 0.5.11.9、Android 0.5.12.13 真正保存至空槽、改变状态、原 UI 读回；名称、金额、gameTime 核对 | 不改存档格式或 metadata；只删除本轮带标记槽，其余 details 前后相等，不称私人存档逐字节审计 |
| 导入/导出 | 三个宿主都完成原存档码生成与原文本输入/handler 导入；关闭官方 UI 后仍可原生读档 | 未走文件选择、系统剪贴板/分享、云端；导出正文只保留测试页内存，不装包 |
| 生命周期 / Inspector / 设置 | Inspector 关闭、再入、消费者退出清空；设置打开/关闭；读档旧 binding / State / Passage DOM 失效，新衣柜仅一挂载；同伴 Source 仍可读 | R14 已覆盖的低频导航不重跑；未把每个服务机械包装成 Host mount |
| 衣柜 | 批处理 loop 校验 State 身份；finally 仅恢复仍属本操作的同一 State / 模式 | 定向反例覆盖 State 替换、模式接管、正常恢复；不承诺取消已派发的原业务 |
| 交易反馈 | Windows 0.5.12.13 原“购买并穿戴”：beanie 扣款 3000，worn 从 hairpin 改为 beanie | 无额外 confirmed，未扩大送回衣柜的确认公式到此目的地 |
| 战斗 | Windows 原 Hypnotist Test 触手入口、原初始化和一回合；Finish 原宏退出 | 不等于自然遭遇、击败或战斗结算；退出入口用 Engine 准备，未伪造胜利 |
| 跨场景参考 | 已挂载的公开只读视图随场景更新来源提示，两份参考独立清除 | 保留显示副本，不保留业务动作；定向组件证明，Hub 原有离场关闭行为继续保留 |
| Host | pending scene、晚到 jQuery、订阅回滚/有限重试、失败关闭、退出清理；两版实际游戏对照 | Host 0.1.2 精确配对，协议不变；不是未来版本自动适配 |
| 经典构建 | 共享衣柜清理修复可编译；当前 classic Start 入口仍 2.7.0 / API1 / 无 Host，退出正常 | 是研究树的经典输出，不覆盖已发布稳定 2.7；不重做 2.7 全业务验收 |
| 生态 | 记录当前加载版本、依赖和插件声明，拟定 A/B/C/D 对照 | 仅准备，未把当前社区组合与 lab15 完整业务验证混为一谈 |

当前缺口集中在正式支持/配对承诺、偏好升级路径及按发布目标选择的业务/设备覆盖。自有页面主要能力仍沿用；Widget、任意布局、全局动作底栏没有恢复。详见 [R15](STONE_FREE_3.0_R15.md)及[生态准备](STONE_FREE_3.0_R15_ECOSYSTEM.md)。
