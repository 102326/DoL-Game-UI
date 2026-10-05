# Soft & Wet UI Runtime / UI Compatibility Runtime 方向与边界

确认于 2026-10-05。长期定位是 DoL 的 UI 基础设施层：统一页面、组件、视觉、浮层、适配、兼容、降级和 UI 扩展能力。MapleBirch 等通用 Mod 基础设施负责游戏扩展；Soft & Wet 负责这些能力如何稳定、统一地出现在界面里。两者不互为 Core 硬依赖。

本文件是后续设计约束，不是当前版本的功能清单。

## 当前阶段：2.1.0

2.1.0 加强兼容护栏，并开始实现最小 Style Only Runtime：只读主题/档位/能力查询、声明式指纹与 selector fallback、角色样式标记、范围限定的监听、撤销和诊断。MapleBirch / ModHub 独立兼容包已接入这一层；实际接口见 [UI Runtime 接入说明](UI_RUNTIME.md)。

本轮增加按需只读 Runtime Inspector、结构诊断和有上限的 UI 事件；没有全局日志、任意执行器或业务状态修改。

本轮增量开放原生 dialog 的 `openModal / openDrawer` 请求和关闭句柄，仅容纳调用方新建内容，不接管已有第三方页面。通用扩展入口注册、其它 Surface 和 Proxy / Deep Adapter 执行器仍是后续方向，不能据此宣称已实现。

现有 `window.DoLGameUI` 及内部页面对象不自动成为稳定的第三方组件接口；不公开 Vue store、内部组件实例或可变业务对象。沿用既有能力，不为长期规划预先搭建全局运行时或大型 SDK。

## UI 所有权与禁区

- 原版变量、原控件值、原事件和第三方业务仍是真相源。Runtime 只管理自己的主题、视觉档位、动效、Acrylic 偏好与 Surface 展开状态。
- 自有专用页面可在专项测试下深接管；普通原版页面优先原节点换皮、CSS 重排；第三方默认轻量样式适配。
- 不管理 Mod 加载顺序、依赖解析、脚本加载、包管理、通用 Mod 生命周期或通用事件框架。
- 不拥有游戏存档、云端认证与数据、NPC、战斗、翻译、网络业务状态、业务事务或权限系统。原业务执行者保持不变。
- 不建立全局 DOM 镜像、写入拦截、全页面 MutationObserver 扫描或未知页面自动 Vue 化。只在明确目标与生命周期内观察必要区域。
- 自有 Mod 管理器仍保持停止开发；UI Runtime 定位不构成恢复它的授权。

## Design System、Surface 与组件契约

视觉仅复用已确认的 Soft & Wet 2.0 基线：外层 Soft Acrylic / Glass Shell，正文稳定可读，内部轻卡片与弱边界。V1.0 只作为兼容与业务语义参考，不作为视觉参考。真实背景通过柔雾参与材质，设计参考图的背景不成为组件纹理。

Core 逐步统一以下规范，优先整理现有 CSS 变量与样式：

- Token：Neutral / Ocean / Mist、语义色、字体、圆角、间距、阴影、Acrylic、Glass Edge、动效时长和 Focus / Hover / Press。
- Visual Tier：Smooth、Balanced、Fancy。能力查询区分用户偏好与实际有效效果，包括 backdrop-filter、reduced motion、布局档位和启用状态；提供信息，不替第三方决定效果。
- Surface：Page、Modal、Drawer、Overlay、Dropdown、Context Menu、Tooltip、Action Dock，共享空间层级与回退规则。
- Component contract：Light Card、Compact Row、Control Row、Metric Row + Meter、Switch、Segmented Control、Input、Select、Glass Button、Badge、Status、Section。先稳定外观与语义契约，不默认另造控件或组件 SDK。

## 两种第三方接入路线

1. **主动适配**：我们逆向检查已知第三方页面，提供独立可选 Adapter。目标作者无需先调用公共 API；用户安装或启用对应兼容包后，才应用该范围的适配。
2. **自愿接入**：第三方作者选择复用 token、契约或未来公共 API。不使用这些能力的 Mod 仍可独立运行。

两条路线都不赋予 Soft & Wet 第三方业务与生命周期的所有权。关闭 Soft & Wet 或 Adapter 后应恢复目标原界面。

## Adapter 的识别与角色映射

Adapter 负责检测目标、识别页面与结构、定位节点、映射 UI 角色、应用样式或允许的布局，并在不确定或失败时退出。

**DOM fingerprint** 使用多个稳定证据：id / class / data 组合、容器关系、关键控件及数量、页面特征。版本号是辅助证据，单个 selector 命中不能证明整页兼容。标题文字须考虑本地化，不单独作为接管依据。

**Selector fallback** 按稳定 id → data 属性 → 稳定 class → 已验证的结构候选依次查找，并校验目标类型与所属页面。候选缺失、歧义或超出范围时跳过；不通过猜测或宽泛 selector 强行命中。

**Role mapping** 将第三方节点映射为 `page-shell`、`title`、`toolbar`、`section`、`card`、`compact-row`、`list`、`primary-action`、`secondary-action`、`danger-action`、`status`、`badge`、`modal`、`drawer`，复用 Core 的角色样式。映射不改变原 id / name / value、业务回调或原控件身份，也不推断未知按钮的行为。

未来普通 Adapter 以 Detection / Fingerprint / Mapping、少量目标 CSS 和异常规则为主。Core 的公共实现只从多个真实使用方的重复需求中提取；暂未共用的识别规则继续留在对应 Adapter。

## 适配强度

| 等级 | 允许范围 | 所有权与验证要求 |
| --- | --- | --- |
| Level 1 · Style Only | 色彩、字体、材质、边缘、间距与交互反馈 | 第三方默认；不改 DOM 结构，做目标区域 smoke check |
| Level 2 · Layout Safe | CSS Grid / Flex、视觉重排、必要的轻包装与 Section 外观 | 不搬原节点、不改事件；包装也需评估父子 selector 契约，涉及契约变化做专项验证 |
| Level 3 · Proxy | 新视觉控件展示与转发原控件操作 | 原节点、值与业务事件继续拥有行为；专项验证事件、外部修改、动态内容与回退 |
| Level 4 · Deep Adapter | 有限 DOM 重组、较深 UI 重构、局部 Vue 接管 | 仅用于高价值且结构稳定的目标；明确支持版本、DOM 所有权、风险、恢复位置、fallback 与失败策略 |

不能为视觉方便默认升级等级。真实节点移动属于专项风险；自有存档页的接管架构不作为第三方页面的默认模板。

## Compatibility metadata 与版本漂移

每个 Adapter 逐步记录 target mod、支持/已验证版本、adapter version、pages、fingerprint、selectors、role mapping、适配等级、风险、fallback，以及 layout / proxy 允许范围。先复用现有包元数据与文档，不新增依赖解析系统；兼容包文件名继续包含目标 Mod 版本和兼容包自身版本。

| 识别结果 | 策略 |
| --- | --- |
| 完整匹配 | 在声明的等级与范围内适配 |
| 部分匹配 | 仅对仍通过验证的局部使用 Style Only / Layout Safe；不存在安全子集则退出 |
| 关键结构未知 | 停止代理与深接管；只保留独立验证安全的样式规则 |
| 完全未知 | 保留原样，不应用猜测规则 |

结构相同不自动等于业务语义相同，尤其不能据此扩大 Proxy / Deep Adapter 支持范围。新版本的识别、实际测试与兼容声明分开记录。

## Compatibility Guard、故障隔离与 Golden Fallback

- `[hidden]` 及原动态显示语义优先；新增或未知内容保留，最多不美化，不静默丢弃。
- 缺节点、能力不足或接管异常不能传播为全局故障。一个 Adapter 或页面失败不影响其它 Adapter、原版页面和全局回退入口。
- scoped observer、样式标记与代理须可清理，避免重复包装、重复监听或互相触发；Vue 不拥有第三方仍会写入的同一 subtree。
- 回退优先保留/恢复第三方原 UI。只有通用主题规则已证明对目标安全时才保留这部分样式，否则完全停止 Adapter。恢复失败时也不得删除仍可使用的原节点。
- 原版入口始终可达；不猜测业务状态、按钮行为，不重排未知页面。浏览器 / WebView 缺高级能力时降低效果，保留控件可用性。

## 轻量诊断与 UI 生命周期

诊断只回答“为什么这个适配没生效”：检测到的目标、Adapter / 指纹命中、selector fallback、成功角色、跳过规则、有效等级、降级与退出原因。按 Adapter 或页面限定范围，不造大型日志系统，不采集存档正文、认证信息或第三方业务数据。

未来生命周期仅限 page detected / mounted、surface opened / closed、adapter attached / detached、visual tier changed、UI fallback triggered。它用于 UI 挂载与撤销，不演变成通用 Mod 生命周期或服务框架。

## 既有第三方目标

- **ModHub**：继续以外壳、材质、色彩、按钮降噪、字体与间距的轻量换皮为目标。保留 DOM 顺序、操作结构和原有业务，不重建列表或更换 `▲ / ▼ / 禁用 / 删除` 的交互系统。
- **MapleBirch**：保持 Core + 独立可选 Adapter。Adapter 只做检测、页面识别与 UI 适配；认证、云数据、服务与业务生命周期仍归 MapleBirch。普及率不是进入 Core 的理由。

第三方适配以“不突兀、不冲突、能用”为标准，不追求百分百重设计成自有页面。

## 演进顺序与公共 API

1. 保留 2.1.0 已有护栏与独立兼容包，整理真实适配范围、等级和退出条件。
2. 从实际 Adapter 的重复需求提取最小指纹、selector fallback、角色样式、能力查询与隔离能力；先验证缺失、歧义、动态新增和回退。
3. 有多个实际使用方后，再整理 Surface 的挂载/撤销契约和轻量 UI 生命周期。
4. 最后按第三方自愿接入需求开放少量只读查询与请求式 API。

`getTheme()`、`getVisualTier()`、`getCapabilities()` 已通过 `DoLGameUI.ui` 的版本 1 契约提供，只返回只读信息。`openModal()`、`openDrawer()` 是同契约下的增量请求 API，能力限制、回退与关闭语义见接入说明；不返回内部 DOM、Vue 或 store。`registerUiExtension()` 仍为待设计候选，不为示例包提前建立入口注册系统。

新增 Core 能力必须回答：是否多个页面 / Adapter 真正复用？是否属于 UI？是否可选且能独立失败？是否保持第三方业务所有权？是否让兼容包更薄？单个 Mod 的特殊需求留在 Adapter。按风险做最小充分验证，文档整理不触发设备安装或发布级回归。

目标是强 UI Compatibility Runtime，始终只管 UI；规模来自复用与可靠性，不来自控制更多业务。
