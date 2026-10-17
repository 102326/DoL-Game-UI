# Stone Free R11：多场景官方消费者候选

2026-10-17。研究分支 `research/stone-free-3.0-framework`，继承 R10 本地提交 `324f1199115f67dd0aa004e69982e8accc975a2f`。R9 固定提交 `1990a12` 和原制品备份保留。本轮没有推送、合并或发布。

## Delivered

运行组合仍是独立 Host 加官方 UI：`StoneFreeHost-0.1.1-experimental.mod.zip` + `DoLGameUI-3.0.0-lab.11.mod.zip`。测试组合另加 TweeReplacer 1.7.0 和 NativeStatus 参考消费者。普通玩家候选不要求另装 Hub、Reference、Factory 或 Author Kit。

| 主线 | 本轮实现 | 源码 |
| --- | --- | --- |
| M1 衣柜 | 宽容器的参照标签和比较面板进入自有侧栏；比较时暂收穿搭预览，返回后恢复。浏览列不被盖住。窄容器保留底部面板，按实际容器判断。差异字段有独立揭示动效，仍可立即中断。 | `src/wardrobe/ReferenceDock.vue`、`reference.css`、`WardrobePanel.vue` |
| M2 商店 | 从原商品 Source 复制名称、价格文字、名称行标记，固定 A、选择 B、比较、关闭 B 或清除 A。保留分类、筛选和原购买控件。A 只是临时快照，不能据此判断实时价格或购买成功。 | `src/shop/main.ts`、`source.ts`、`Toolbar.vue` |
| M3 战斗 | 自有视图通过公开 claim/mount/binding 接入 Passage 生命周期；原动作、原菜单和底部 popover dock 保留。选择反馈来自原控件，不移动待点击按钮。 | `src/combat/main.ts`、`style.css` |
| M4 Hub | 官方消费者可选挂载 Motion Hub，读取所有参与者的公开视图。固定 A 后发布临时衣柜参照视图，Hub 可将焦点带回原参照，不创建第二份目录。设置与只读 Inspector 也通过公开视图进入。 | `framework/official-ui/hub.ts`、`src/wardrobe/reference.ts` |
| M5 功能覆盖 | 恢复原商店早期入口、四项 TweeReplacer 补丁和 API v1 声明。经典打包和研究包共用相同补丁定义；经典路径不要求 Host。 | `scripts/shop_package.py`、`package.py`、`package-framework.py` |

未增加 Host 公共方法、协议、业务状态总线、全局输入管理器或第二套装备状态。官方模块仍拥有领域适配和内部 Vue 组件。商店比较暂未接入交易反馈；本轮交付的是允许的只读路径。

## 正式 2.x 功能覆盖

状态依据当前源码和构建装配；Preserved 不代表本轮逐项重新进行游戏业务验收。

| 能力 | 分类 | 保留方式与边界 |
| --- | --- | --- |
| 衣柜快速穿戴、整理、预览、来源新鲜度、未知入口 | Redesigned | 原 Source/原操作保留，增加参照侧栏与公开视图。没有恢复先查看再穿戴实验。 |
| 商店原商品、颜色、报价保护、详情/窄屏 Drawer | Migrating | 原节点/事件和恢复锚点保留，工具栏改由公开 Passage mount 承载。对照只复制显示字段。 |
| 战斗多行动区、连续选择、底部操作、原版回退 | Migrating | 原模块继续处理业务，公开 Host 只管理自有资源。真实回合见覆盖限制。 |
| 存档及导入导出、metadata/gameTime | Preserved | 原 `startSaves()` 继续由官方入口启动；未改格式与保存逻辑，本轮不执行存档读写。尚未逐面板 Host 化。 |
| 社交、特质、统计、成就、日志、态度、原版设置等 | Preserved | `startSocial/startCharacteristics/startPanels` 保留，尚沿用模块内部生命周期。没有因未迁移而删除。 |
| 侧栏、阅读布局、主题、响应式、视觉档位 | Preserved | 原 layout/theme、偏好键、总开关和 CSS 装配保留。新宽度逻辑不引入全局 containing block。 |
| UI API v1、衣槽映射及公开类型 | Preserved | API 未升版；包内恢复 `types/ui.d.ts` 与 `types/wardrobe.d.ts`。 |
| 商店早期注入、分页补丁 | Preserved | 与经典包逐条/逐字节对照；实验仍默认关闭，不改变稳定路径的执行阶段。 |
| 悬浮球 | Redesigned | 经典 2.7 保留原表面。研究消费者沿用启用/隐藏/展开方式/重置入口，使用公开视图 Hub；不会同时挂载两套球。Hub 位置独立保存，旧位置和旧工具配置不迁移、不删除。研究设置隐藏已不适用的固定工具勾选项。 |
| 装配、资源和许可证 | Preserved | 原模块仍经 `startGameUI()` 统一启动和销毁；新增候选不内嵌 Host。Vue/Tailwind/renderer 许可证保留。 |
| 全页面 Host 生命周期 | Migrating | 本轮深入衣柜、商店和战斗，不能宣称所有旧模块已逐页迁移。 |
| Widget/自由布局、全局剧情动作底栏 | Deferred | 不属于本轮交付；原停用研究不恢复。 |

独立 Motion Hub 因共用组件调整，另生成 `0.1.2-experimental`，仍配对 Host 0.1.1。旧 0.1.1 制品保留。Framework 合同与 Host 资源未变，不重跑 R9 依赖矩阵。

## Validated

源码检查：`npm run typecheck`、`npm run framework:check`、`npm run lab:check`。使用已有 Vite/TypeScript/锁文件构建研究与经典入口，没有安装依赖。

定向检查：

- `tests/wardrobe-reference-panel.cjs`：同源 40 条目组件，滚动、焦点、相同字段、快速中断、来源过期、无动效及释放；明确属于组件夹具。
- `tests/shop-stone-free.cjs`：只复制冻结的显示值；实际 startShop 的 Host 失效/恢复、原节点位置与身份、关闭 B 保留 A、经典路径不显示新控件。
- `tests/combat-stone-free.cjs`：多行动区、原 radio 身份及一次事件、顶层 dock 原继续链接事件、无动效、启停重入、场景失效和经典路径；不构成真实战斗结算证明。
- `tests/shop-pagination-package.test.cjs`：经典包四项补丁、默认关闭的早期 API 及严格布尔/重复初始化合同。共享定义另与 R10 经典脚本的 AST 常量精确比较。
- ZIP 检查：根 boot、版本/依赖、路径唯一性、实际资源和声明、许可证；与经典包的早期 JS 和补丁逐字节相同。不包含 APK、截图、存档或验收收据。

真实整合使用 `tests/framework-official-r11.cjs`：Windows Edge + 原 DoL 0.5.12.13 HTML + 真实 ModLoader 2.101.1 导入/重载；Android M367FC（0509B830099C3540）独立包 `com.vrelnir.dol.lyra.uicompat051213`、Android 17、WebView Chromium 154.0.8037.58。Android 每次重启重新绑定 PID/文档。没有修改正式 App。

衣柜通过原 Start → Start2 → Orphanage Intro → Bedroom → Wardrobe 路径进入。商店使用已初始化的新游戏，经原 Engine 直接准备 Clothing Shop 场景，再点击原 View All 和商品控件；这是实际游戏场景准备，不称为自然城镇导航。对照前后原库存、穿搭和金钱一致，没有派发购买或试穿。分页实验另检查开启后只生成一页，原翻页使游戏页码变化且只保留目标页。

两端检查参照/返回、Hub 公共视图与无重复表面、位置重置、自然离开、主消费者退出后 T 仍可读。Windows 补查受控 390×844 布局和 reduced motion；不称为物理手机或 IME 验收。经典入口维持 2.7.0/API v1、无参照按钮、无官方 Host participant。

最终收据及制品摘要在本文件后续“收据”节列出。Android 原 Mod 清单、隐藏清单和 UI 偏好以入场备份作恢复依据，重启后逐项读回；历史清理失败不改写为通过。

## Experience Findings

衣柜比较共用自有侧栏，列表和原退出按钮有稳定位置；宽屏检测以面板左边与浏览列右边不交叠为直接证据。窄容器仍会暂时占用部分屏幕，不宣称零遮挡。临时快照与当前读取、差异与不可比较继续区分。

商店的收益是保留 A 后继续使用同一原商品目录，不必记忆之前的价格文字。没有数值价格排名、折扣计算、购买条件推断或成功动画。没有人类偏好研究或计时，不能宣称比普通按钮更快。

Hub 消费公开视图，参照区可直接使用，也可从 Hub 返回；固定参考不要求先启用 Hub。其默认关闭，原版动作不依赖它。

## Failed / Unknown

- 两次桌面检查分别选中了被原 div-link 容器覆盖的子链接，以及多页中重复的 nth-child 目标。保留失败收据，改为观察当前可见商品并点击真实原 div-link 容器；未使用 force-click。
- 后续补丁检查错误地从运行期 Story 读取 widget Passage。该名称当前已不可读取，`Story.get()` 返回错误占位文本，因此关键词缺失不是补丁失败的证据。具体移除该 Passage 的宿主机制仍 Unknown；改查真实按需分页行为，并保留诊断日志。
- 打包新增类型声明时局部变量覆盖了包名，产生 FileNotFoundError；修正局部变量名后重建并检查完整 ZIP，不使用旧文件充当成功产物。
- 一次 Android 功能流程通过，但恢复后悬浮球位置偏好不同且残留 Hub 位置键，标记 cleanup-failed。使用原备份停止 UI 消费者、恢复精确键值、留提交时间、原生重启并读回，修复收据独立保留。偏差的具体原因 Unknown，不能直接归因于 WebView 或 Tools。
- 当前新游戏卧室没有相应行动入口（源码存在 comfy bed 条件），未为此改家具、造战斗或执行回合。战斗保留组件接入证明；真实遭遇战、结算和高频动态行为未验证。
- 桌面 HTML 服务器没有完整图片资源，原角色/物品图有加载失败；不能据此判断实际 Android 图片缺陷。初始通用 Event 错误原因仍 Unknown；不宣称整套游戏 Console 无错误。

## Not validated / Next

未覆盖物理手机/IME、全部第三方组合和衣槽、真实交易/战斗结算、其它 DoL/Loader/WebView、长时间性能和所有低频页面迁移。这些是覆盖边界；本轮允许的战斗阶段性成果不包装为真实回合验收。

下一步优先实际试用当前多场景候选，并在可安全触达的真实行动页补查战斗接入。正式发布准备前仍需确认完整功能覆盖、配对版本和最终制品；不重开已收口的 Framework 矩阵，不自动启动 Widget/Factory 重构。

## 最终收据与制品
以下现场材料留在忽略目录，不装入运行包。
- 最终 Windows 原游戏整合：`tests/artifacts/stone-free-r11/desktop-1792220922055/result.json`，passed。
- 最终 Android 原游戏整合：`tests/artifacts/stone-free-r11/android-1792221019934/result.json`，passed。
- 最终重启后恢复逐项核对：`tests/artifacts/stone-free-r11/android-1792221019934/restore-verification.json`，passed。
- 40 条目组件：`tests/artifacts/stone-free-r11/panel-1792221035100/result.json`，passed。
- 历史清理失败后的独立修复：`tests/artifacts/stone-free-r11/android-1792220774729/restore-repair.json`，passed。

| 制品 | 字节数 | SHA-256 |
| --- | ---: | --- |
| DoLGameUI-3.0.0-lab.11.mod.zip | 172980 | `89ce9c680462630fbfb2199a7abef895e7988dafc7abad73621733e67372e3af` |
| StoneFreeHost-0.1.1-experimental.mod.zip | 11224 | `7f393f438111a2679d329e3301ba6b7456e88a21a3ac606da2bc995d2815902c` |
| StoneFreeMotionHub-0.1.2-experimental.mod.zip | 37617 | `89d1335e053d4a2fd363921eaa539f2a8d53ca249c16e4f99f985eb1aa7c1c47` |

运行 JS：`fa609b1a6a9c370cd1ca4b92825cddef8381ab2e143a8ab587849baac557d8f0`；CSS：`081bea6f398c9ff8a9a6d2c0ac00efcf2a52ef21318718c8e1bda82ad02da536`。完整清单及资源摘要：`tests/artifacts/stone-free-r11/package-audit.json`。Windows 和 Android 的最终 U 摘要与该清单一致。

结论：R11 五条主线已形成约定的实际成果；战斗按允许的组件接缝阶段交付、覆盖有限。当前不宣布正式 3.0 发布候选完成。工具反馈另见 `STONE_FREE_3.0_PAISLEY_FEEDBACK.md` 的第十一轮增补。
