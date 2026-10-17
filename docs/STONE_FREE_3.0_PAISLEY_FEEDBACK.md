# Paisley Park 6.1：Stone Free 首轮开发使用反馈

2026-10-16，仅记录本轮真实使用。没有修改工具包，也没有重新跑工具全套验收。

## 使用路径

已安装 Skill 的 resolver 定位到本机 6.1.0 White Snake；使用其 CLI help、Doctor 和 Environment。真实 UI 验证需要精确读取三个原数值、临时加载自己刚构建的资源以及保证清理，所以按 DEVELOPMENT_FLOW 的出口调用已有 `execution-context.cjs`，显式绑定设备/App/PID/Document，以 CDP 完成只读对照、自有按钮点击和截图。源码、Vue 类型检查、Vite、ZIP 和浏览器反例仍使用 UI 项目工具链。

普通只读和自有 UI 操作没有建立 Goal 或使用 Gameplay；没有修改 Store、处理历史 Unknown 或重放业务效果。步骤较短、数据相关断言很具体，所以本轮没录 Journey，也没调用 Full Evidence、Perfetto、bugreport。当前项目报告能关联输入资源、结果和清理，未因形式完整增加采集。

## 通用经验与归属

| 实际情况 | 判断与适合保留的经验 |
| --- | --- |
| 首次 Doctor 的 ADB 为 ENOENT，但 Android CLI 可用 | 环境 PATH 问题。Skill 已给出临时 DOL_ADB 的现有 SDK 路径出口，足以解决；不需要工具安装或自动修复。 |
| 零尺寸宿主包含可见的固定定位按钮，Playwright 对宿主的 visible 等待失败 | 项目测试选择错误。布局诊断应区分根节点矩形与真实交互节点；失败不直接等于按钮不可见，也不应自动 force-click。 |
| 真实游戏新上下文中，原生年龄窗口让自有根 aria-hidden | 原版正常交互边界。DOM/截图才确认原因，不能把“包已加载”“节点存在”当作可操作，不能为完成调试绕过窗口。 |
| 平板原值显示一字段缺失 | 项目适配器字段写错，已有原状态服务可核对。现场帮助暴露错误，但不因此记为 Tools 或原游戏问题。 |
| CLI 顶层提示 GameVersion Mod 为 unknown，但 StartConfig 来源可用 | 按来源读取 Environment JSON，保留两种元数据来源；不是游戏版本不存在的证明，也不使用包装 App 版本替代。当前文档已解释，不提出 Runtime 改造。 |

建议 **P1**：如果将来完善通用 UI 诊断提示，可以用本轮“宿主零尺寸/子控件可见”的例子说明，先检查真实 hitbox 和 overlay，再判断点击失败。是指引候选，不是已证实实现缺陷。

建议 **P2**：继续保持 Standard CLI 优先和直接 CDP 的明确出口。本轮没有重复造 CDP 绑定器，复用了现有绑定/释放；不必把每个投影断言强行改成通用 Journey。

## 只留在 UI 项目

`DoLUiHost` 的实验协议、三个状态字段、源码配方、官方 Drawer API v1 的接法及各原型资源摘要均属项目知识，不建议写入通用 Skill。没有证明这一套是其它项目应复制的架构。

## Coverage 与结论

物理手机、真实 IME、多设备、其它 Provider、正式持久安装、真实 Gameplay 及完整跨 Passage 生命周期不属于本次 Tools 使用证明。它们不会自动变成工具开发任务。未发现明确的 Paisley Park 实现缺陷；这轮有帮助的主要是安装定位、环境分层和精确的真实文档绑定。没有量化通用速度或成本收益。

以上为反馈和候选建议，不请求在工具项目自动开工。

## 第二轮增补：组件退出不等于包卸载

工作台开发发现，首轮临时部署在 Host 销毁后仍保留消费者等待重启的订阅。DOM 清空确实成立，但不足以证明代码卸载。项目入口现导出清理函数，脚本按持有的对象逐一取消订阅，再建立空 Host 确认没有消费者复活。这个缺口属于 UI 项目部署脚本，不是 Tools 释放转发失败。

准备清理旧现场时，已有绑定能力帮助比较 frame/loader，确认当前已是新文档；因此没有为了“保险”再重载测试版。直接 CDP 在这类精确对象归属、UI 自有偏好恢复和卸载断言中仍有合理价值。

建议作为 **P1 指引候选**：长期监听、等待重新接入与可见 DOM 的寿命应分别验证；清理 UI 的“节点为零”不能自动代表取消所有订阅。不要据此让 Tools 自动扫描/删除监听器，或接管第三方生命周期。

本轮未发现需要修改通用工具实现的缺陷，也未增加 Gameplay/Full Evidence。详细结果留在 UI 的 `STONE_FREE_3.0_WORKSPACE.md`，不迁入通用 Skill。

## 第三轮增补：标准动作与项目见证分工

原版侧栏实验复用了 `execution-context.cjs` 的精确文档绑定和 `action.cjs` 的标准 `web-click`，没有自行写前台/命中检查器。UI 项目读取 SugarCube 原状态、计数原按钮事件并核对一次切换，再观察后决定下一次明确操作；Tools 的 `completed` 不作为侧栏已经切换的证明。这条路足以完成短 UI 实验，未建立 Gameplay Goal 或新 Runner。

商店根节点曾在观察间缺失，后续观察到 Start，又回到商店；原因 Unknown，不认定为 UI、Tools 或第三方缺陷。失败探针尚未派发点击，没有复用旧控件执行。最终选择与游戏进度无关的侧栏能力，未绕过历史业务 Unknown。

零尺寸根截图再次暴露本项目选择器习惯问题，已用真实交互区域修正，复用首轮反馈，不作为新需求重复提交。本轮没有发现明确 Tools 实现缺陷；具体命令 schema、见证字段及侧栏映射留在 UI 文档，不放入通用 Skill。

最终平板补验确认原按钮切换后，后续一次 CDP evaluate 超时；清理及随后只读观察成功，原因 Unknown。项目脚本当时未记录精确阶段，无法由错误栈区分是前置观察还是后续观察，现仅增加简单阶段字段。原失败保留，不把恢复后的读取当作此前动作成功，也不据此推断 WebView 挂死或 Tools 缺陷。仍复用未受新增命中保护影响的上一轮模态证据，不继续重复整套采样。

## 第五轮增补：非模态现场与截图出口

2026-10-17，使用当前 resolver 确认的 6.1.0。标准 `capture` 先确认目标 App 前台并取得真实画面；项目脚本复用精确文档绑定、标准 `web-click` 及 `collectors.screenshot`，没有自行重建 Android 控制层。浏览器的点击拦截揭示自有状态视图遮挡侧边布局，修复的是 UI 层叠，不是 Tools 或第三方问题。此前真实 hitbox 优先的建议仍足够，不另提新框架。

一次平板流程在 `toolbar-screenshot` 超时，两次原侧栏切换已确认、状态已恢复，清理完成。原收据保留；当时阶段没有细分矩形读取和 CDP 截图，所以具体方法与原因 Unknown。独立只读小区域截图随后成功，不能说明原超时原因。改用现有 Android 原生截图 collector 并细分阶段，后续取得所需画面和侧边交互证据。这是合理的直接工具出口，不请求增加自动重试、自动重启或新截图系统。

项目还曾在 JSON 对象中漏等异步来源读取，Promise 被序列化为 `{}`。CDP 等待外层表达式不代表递归等待对象里的所有 Promise，修正的是项目探针。通用 Skill 若未来需要补充异步探针例子可作为 P2，但已有 JavaScript 语义足以解释，不属于 Tools 数据丢失。

本轮未发现明确 Tools 实现缺陷。没有 Gameplay、Journey、Full Evidence、Perfetto 或新 Environment 矩阵：动作短、原结果断言具体，已有项目脚本与绑定清理足以复验。原版侧栏领域、参与者 ID、布局层级及配方升级合同继续只留在 UI 文档。真实手机/IME/持久安装属于 Additional coverage，不自动成为工具任务。历史 Unknown 不受本轮结果影响。

## 第六轮增补：官方公开视图接入

继续使用既有绑定、标准 `web-click` 与原生截图 collector，完成官方 Drawer 的定向平板检查，无新增工具失败。浏览器点击拦截发现官方研究入口和侧边工作台位置重叠，仅扩大视口不足以解决，最终修正自有入口位置。这仍属于第五轮已记录的项目层叠/命中问题，不新增通用 Skill 需求。

本轮两次测试字段/调用路径错误按真实源码修正，没有把它们归为 Tools 缺陷。基础测试输出改为唯一目录，以免覆写历史收据，属于 UI 项目验证脚本。未触碰 Gameplay、历史 Unknown 或 Tools 仓库；暂无需要另行派发的新工具改造建议。

## 第八轮增补：空间拖动与验证边界

标准 `capture` 确认前台、设备及画面，项目脚本继续复用精确 WebView 绑定、`web-click`、原生截图与 `record`。Action 当前有 tap、没有拖动，故只对自有入口使用绑定后的 `Input.dispatchTouchEvent`，不另造 Android 控制层。这条直接 CDP 出口符合 Skill，不能称为物理触控。场景、一次原事件、SugarCube 状态和清理由项目断言，工具完成状态没有被当作原版结果。

新 UI 的拖动未隔离页面触摸事件，真实平板出现原侧栏连带切换；浏览器鼠标测试未暴露。给自有入口添加有限事件冒泡边界后，同一平板注入路径通过，侧栏保持原值。属于项目输入所有权问题，确切旧监听器归属 Unknown，不是 Tools 缺陷。resize/pointerup 竞态也修在项目组件。

一个 P2 工作流建议：不要为了检验自有组件失效而在真实页面广播伪造的全局 Passage 事件，这会执行其它原监听器。本项目首次脚本曾这样做，后来改为直接失效自己的 Host，并明确标注未验证自然 Passage。需要真实导航证明时应另选合法原路径；没有证明时保留未验证。也修正了项目收据中一句过度声明，附勘误且不重跑文案无关测试。以上适合 Skill 的证据边界提示，具体 Host 方法、球的位置键与 UI 事件映射仍只留项目文档。

浏览器可选录像缺少 Playwright 的 FFmpeg，没有安装第二套依赖，改用已存在的 Android 录屏。最终 30 秒录制文件实际为 30.098867 秒，超过 `animation-frames` 文档的 30 秒输入边界，未强行调用或改阈值；通过已安装 FFmpeg 按 4/12/22 秒取三个审阅帧。下次若需标准抽帧，预先选短于 30 秒的录制预算即可。这是采样计划/可选工具边界，不据此请求重构录制器。

没有明确 Tools 实现缺陷，不提出新 Provider、Runtime 或工具框架。没有新 Gameplay、Journey、Full Evidence、Perfetto、bugreport；短 UI 任务已有项目脚本及直接结果断言，未引入这些能力仍有足够证据。更多物理设备、IME、自然导航与持久安装属于本轮未覆盖范围，不阻塞已约定的动态原型。

## 第九轮增补：真实安装与临时加载不是同一环境

继续使用 resolver 已确认的 Paisley Park 6.1.0、精确 WebView 文档绑定、标准 `restart / web-click`，完成隔离测试 App 的真实 Loader 安装和自然导航。每次重启重新建立 PID/文档绑定，读取原 Loader 公共存储合同导入自己的研究包，结束后恢复原 active/hidden 清单并删除自己的 ZIP。没有操作 GER Store 或历史 Unknown。

真实 Loader 首次检查暴露了项目测试假设：临时全局加载时可见的 IIFE 导出对象，在正常 Loader 包装执行后不一定成为 `window` 属性。首次因此断言失败，Host 的 participant 和 DOM 当时实际已存在。修正为检查公开诊断和真实挂载，并用消费者自己的退出按钮释放；依赖负例另用明确标记的脚本派发夹具。原失败收据保留。这属于项目验证脚本问题，不是 Tools 缺陷。适合进入 Skill 的经验是保留加载方式差异，不能把临时注入的全局对象假定为真实安装合同。

自然导航使用经过源码和现场唯一性核对的原版按钮/链接，验证旧绑定失效及新场景读取；不再广播伪造 Passage 事件。选择器、Host 方法及 Loader 版本细节只留 UI 项目。Android 比较前后由原库存/穿戴字段摘要证明未变化，Action 完成不替代该断言。

首次 capture 返回泛化失败，当时输出父目录尚不存在；创建目录后的独立采集成功，但未获得精确原始错误，根因仍为 Unknown，不据此提交工具实现缺陷。桌面游戏启动阶段还出现 `Event` pageerror；参考操作阶段没有新增错误，来源 Unknown，不能写成“全游戏无错误”。

没有新增通用 Runtime、Provider 或 Journey：现有绑定与动作足够，精确包体、库存和生命周期断言由项目脚本承担。未调用 Full Evidence、Perfetto、bugreport 或泄漏调查；本轮没有相应问题证据。暂无需要向工具项目自动派发的实现修复。物理触控、IME 和更多宿主版本仍为 Coverage。

## 第十轮增补：来源身份与实际命中

本轮继续使用已安装的 6.1.0、标准 restart/web-click/web-input 和精确 Android 文档绑定；浏览器真实 Loader 用项目现有 Playwright。原衣柜分类和查询用于准备场景，不写入库存，不使用 GER 的替代路径。有限动作与精确包体、原状态摘要由项目脚本关联，未新增通用 Runner。

三次检查帮助纠正了项目假设：默认分类实际为空，先通过原分类按钮选择有衣物的上装；40 条目按名称排序后，第 13 个节点的 key 并不是 index 12，改为保存实际点击身份；窄屏侧栏展开时遮罩的中心点位于侧栏下方，改用已观察的原收起按钮。前两项是项目测试错误；最后一项复用 F001 已有 hitbox/overlay 经验，不请求新工具。没有 force-click 或通过改为更宽屏跳过窄屏验收。

另外发现了两个真实项目缺陷：比较窗挡住原返回入口，以及来源失效后只检查 DOM connected 仍会播放误导性的归位。分别修在自有面板位置与当前来源复核，不改 Tools 或 Host。Source/DOM/输入命中与业务身份是不同证据；具体字段、生命周期和语义仍留 UI 项目。

桌面资源服务器只有编译 HTML，未提供完整图片资源；角色预览出现图片超时。只报告这一资源覆盖限制，不把它推定为 Android 预览缺陷。泛化启动 Event 的原因仍 Unknown。实际字段比较、原状态和清理通过不代表全游戏 Console 无错。

现有工具足够完成当前 UI 任务，未发现明确 Tools 实现缺陷。不新增 Full Evidence、Perfetto、bugreport、Gameplay Provider 或复杂 Journey，也没有触碰历史 Unknown。具体结果见 `STONE_FREE_3.0_OFFICIAL_INTEGRATION.md`，通用经验与第九轮/F001 去重后收件即可，不授权工具重构。


## 第十一轮增补：运行来源、补丁观察与恢复读回

- 实际使用：已安装 Skill resolver 6.1.0；Doctor 区分无设备和明确平板连接；标准 execution-context 绑定独立包 WebView；Action 的 web-click/web-input/restart；项目自己的 Playwright Windows Loader 测试及 CDP 原状态断言。没有重装工具或修改 Paisley Park。
- 子链接看似可见但被原 div-link 覆盖，另一次选择命中多页重复节点。工具准确拒绝，实际命中范围与原操作身份优先，不能为过测试使用 force-click。这与 R10 命中经验重复，作为新实例，不另提通用架构需求。
- 运行时 Story.get(widgetName) 返回错误占位内容而非源码；关键词未出现不能说明补丁失败。应先确认来源存在，再选择真实行为验证。本轮改查单页生成/原翻页。具体谁移除 widget Passage 仍 Unknown；属于目标项目/宿主知识，不固化成所有 DoL 的通用事实。
- 一次功能流程通过而清理失败：恢复 Mod 清单后，强制重启读回发现 UI 位置偏好有漂移。已保留 cleanup-failed；用原备份停止消费者、恢复精确键值、等待提交并重启读回，另存修复收据。原因 Unknown，没有证据认定是 Tools 缺陷。通用 Skill 可提示：恢复的执行 ACK 不等于重启后的持久恢复，跨设备交接应保留实际 readback。
- 重型采集未使用：未发现持续卡顿、泄漏或崩溃问题，没有启动 Perfetto、bugreport、Full Evidence 或 GER。旧 Unknown 未派发、清理或绕过。战斗只有组件接缝证明，真实行动入口不可用仍明确标记覆盖不足。
- 结论：没有确认的 Tools 实现缺陷。建议仅去重补充恢复读回和来源存在性提示，不自动重构工具；本轮临时命中标签、具体 widget 名称和 UI 偏好键留在项目文档。


## 第十二轮增补：视觉采样与已展开面板

实际使用现有 resolver/Doctor、execution-context、标准 web-click/web-input/restart，CDP 读取当前 2.7 的 computed style、原状态并保存截图。真实安装后核对最终包摘要，恢复后读回原清单与偏好。没有新工具环境或 GER 调用。

视觉审查发现比较区虽已挂载，但位于长预览下方；源码与真实截图足够定位，直接调整官方详情中的自有挂载点，无需 Full Evidence 或通用布局平台。窄屏脚本另曾点击已经展开的 Drawer 遮罩后方按钮，标准工具正确拒绝；先观察展开状态，再点实际关闭入口。此项复用已有 hitbox/overlay 经验，不新增通用 Skill 需求。

本轮的混合大小写属性观察过滤器和衣柜自身高度变化中断，均由目标 UI 源码与定向测试定位并修正，不归为 Tools 问题。尚无确认的 Tools 实现缺陷或本轮必须修改的 Skill 指引。颜色、比较挂载点、伪元素材质和偏好档位属于 UI 项目知识；物理手机/IME 属于额外覆盖。没有为产生反馈去跑 Perfetto、bugreport、Full Evidence、旧 GER Unknown 或全部 Provider。

## 第十三轮增补：事件完成与业务结果

继续使用已安装的6.1.0 resolver、Doctor、execution-context、标准 web-click/web-input/restart 和精确 CDP 原状态断言；Windows 为项目 Playwright。沿用先前实际安装/恢复的测试配方，仅增加本轮需要的交易与原回合结果，没有新建 GER Store、清理历史 Unknown 或绕过 pending effect。新游戏隔离由实际 Loader 安装、全新游戏入口和独立浏览器实例/测试包范围确定，不由新 Store 名称推断。

原商店外壳通过 jQuery 执行内部链接。源码与实际点击表明，只看 anchor DOM capture 不够；补入原外壳识别，保留原 handler。随后真实购买已扣钱和入库，而 UI 微任务过早核对仍报 unknown。改到原事件结束后的任务并定向验证；失败来自 UI 项目事件时机，不是 Action 失败或 Tools 缺陷。只用 evaluate 内的 `.click()` 模拟不能覆盖相同的浏览器事件检查点，因此新增 locator 输入回归。`isTrusted` 代表浏览器输入路径，不证明物理手指触控。适合 Skill 的通用提示是：ACK、事件完成、业务 Outcome 分开判断；不要把合成点击覆盖当成实际事件时序证明。具体 jQuery selector、金额和库存合同留项目文档。

战斗演示的原回合实际推进，但测试以 State.length 增长等待而超时。源码确认历史上限为5；使用原 Passage 计数与动作状态联合核对。通用经验是先确认观测指标的合同与上限，不把未增长直接归因为业务或工具失败。`Combat Demo` 及这些具体字段是项目知识，演示不等于自然遭遇或完整结算。

一次诊断脚本把整个 State 赋值表达式作为返回值，Playwright 序列化失败；改为 void 保存引用、只返回必要的原始类型摘要。另有嵌套正则转义错误，均为调用方脚本问题。Doctor 最初遗漏 `--out` 时只有泛化 COMMAND_FAILED/cause unknown，读取 help 后正常；这是可候选改善的参数提示，不足以认定实现缺陷。P2 建议在有余力时让错误提示具体缺失参数，不为本轮修改工具。

当前标准能力与直接 CDP/Playwright 出口够用。未使用 Journey（已有可重复的项目脚本）、Full Evidence、Perfetto、bugreport、泄漏调查或新 Provider：本轮风险已有同场景结果、截图、原状态和恢复读回。没有确认的 Tools 实现缺陷，不提出 Runtime 重构。更多设备、IME、自然遭遇和其它交易类型属于 Coverage，不能自动变成 Skill 或工具开发任务。

购买后的 CDP 网页截图出现工具栏压缩，等待800ms后仍存在，但 DOM 尺寸/transform正常。只补采同一现场 Android 原生 screencap 后，实际设备图正常；标准 Action 重新选择商品也成功。原生截图与网页截图覆盖的合成层不应默认相同，具体原因 Unknown。适合 Skill 的 P1 提示：像素与 bounds 明显矛盾时，先用设备截图交叉核对；不要直接修 CSS，也不要只等待更久并反复截图。此次直接 ADB 出口用于比较平台合成画面，未新建控制工具。原始双图和控件尺寸见 R13 `android-1792228599690`，不归为已确认的 Tools 实现缺陷。

## 第十四轮增补：整合现场与控件合同

本轮使用已安装Paisley Park6.1.0的resolver、Doctor、execution-context精确WebView绑定，标准restart/web-click/web-input/web-focus；原range使用CDP键盘，Android画面使用同设备ADB screencap，Windows用项目Playwright。选择直接截图沿用R13已确认的两种合成图差异，没有重采双图或新建截图系统。状态、制品与恢复断言留在UI项目脚本；没有重装工具、修改Tools仓库或运行新GER。

一个实际能力边界：原Combat Demo目标为select。项目误用`web-input`，收到泛化`Web target unavailable`，当时并非业务回合已派发。读取`action.cjs`的`webExpression`后确认该动作只接受HTMLInputElement/HTMLTextAreaElement，并不支持select。最终用绑定后的CDP，核对唯一可见且启用的原select与合法option，通过原HTMLSelectElement setter和input/change事件设置，再读回原目标；这是与Playwright selectOption对应的合成DOM事件，不是物理触控或物理键盘。原失败`android-1792231037952`和恢复收据保留。**P2指引候选**：明确web-input的控件类型限制，避免把泛化错误直接解释成WebView失联；不为此要求新增Provider或Runtime。若改进工具错误分类有实际收益，可由Tools项目评估，不在UI任务修改。

现场观察还找到真实UI缺陷：衣柜把全局overlay一起收进隐藏原版区。此前测试只断言导航已mount，因而菜单DOM存在时没有识别到祖先hidden。直接读取祖先链/rects定位；修正后检查可见性，并在原衣柜场景完成相同流程，没有切去卧室绕开。适合Skill的**P1通用经验**是“节点挂载、可见、可命中、业务Outcome为不同证据”。与先前hitbox经验合并即可；`dgw-native`、具体overlay id、Host字段和补丁只留本项目。存档关闭释放和数量报价问题也属于UI项目，均不是Tools缺陷。

重复traits开关时，测试最初误把仍有效的底层wardrobe挂载当作残留。改比较同一基线身份、claim数量和自有运动ghost；这只回答当前序列的资源累积，不升格为长期内存或泄漏证明。Doctor在未建输出父目录时返回COMMAND_FAILED，建目录后成功；底层原因未独立确认，保留Unknown，不新增一条已确认工具Bug。`doctor --help`也不是已支持入口，使用总help即可。

Journey未使用：已有可重复的真实Loader项目脚本，需要精确原金额/库存/目标和包体断言，继续复用成本更低。没有因此缺少本轮前后结果，但脚本不等于通用Journey制品。没有持续卡顿或泄漏证据，不调用Full Evidence、Perfetto、bugreport、内存平台或更多设备矩阵。未碰历史GER Pending/Unknown；新游戏隔离有原入口和安装范围依据，非换Store绕过。

结论：本轮没有确认的Paisley Park实现缺陷。优先去重保留可见性/Outcome证据边界，其次补web-input类型提示；不自动开工具改造。手机/IME、其它WebView、自然遭遇、其它交易和长时间运行为Coverage。最终两端收据、实际工具出口和恢复结果见`STONE_FREE_3.0_R14.md`。
