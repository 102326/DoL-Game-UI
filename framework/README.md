# Stone Free Host：研发原型

这组离线 Mod 用来检验 3.0 的公共接缝，不是 Soft & Wet 3.0 正式版。正式 2.7 制品不改；本研究分支保留 API v1 和存档格式，R15 对共享衣柜异步清理作了定向加固。协议 `0.1-experimental` 可能在研究后调整，请勿作为稳定第三方依赖发布。

正式目标已确定为独立 Framework Host 与独立官方 UI 消费者。当前研究包版本为 `0.1.2-experimental`，消费者要求同版本 Host；协议版本仍为 `0.1-experimental`。首版按明确配对安装和更新，不承诺任意版本独立升级。SDK 和 Author Kit 只用于开发，不是玩家 Runtime。

Loader 的依赖报告不能替代消费者接入检查。缺少或不支持的 Host 会使消费者退让；不要同时启用多份 Host。停用 Mod 后需要重启，消费者主动退出只释放自己的资源，不等于整包热卸载。

## 运行

依次启用 `StoneFreeHost`、`StoneFreeNativeStatus`、`StoneFreeStatusComparison`。不需要安装 `DoLGameUI`、MapleBirch 或官方主题。两个视图分别自带 Vue，Host 本身不包含 Vue；这次先验证分离可行性，不宣称它是最终最优分发方式。

状态速览按需读取原游戏的 `pain / stress / tiredness`，不复制整个状态，也不修改数值。状态对照只通过公开来源读取，允许在本界面记录一次采样与当前值比较。切换场景清除对照，退出后不保存。缺失字段显示未知，缺失提供者显示不可用。

另一个可选研究包 `StoneFreeSoftWetSurface` 使用既有 UI API v1 打开官方 Drawer，显示主动贡献的公开视图，需要官方 UI 2.7.0。它不再维护固定状态字段的另一份渲染；状态速览、对照和作者视图通过原贡献挂载，各实例保持独立。贡献撤销、场景失效、关闭主题或卸载时释放视图和模态租约。它只验证官方布局作为可选消费者；不安装它时，前面三个包仍独立工作。结果见[官方外壳接入](../docs/STONE_FREE_3.0_OFFICIAL_VIEWS.md)。

安装 `StoneFreeWorkspace` 可使用模态信息工作台：默认显示自愿贡献的状态速览与对照，支持隐藏、排序、舒适/紧凑密度。显示偏好只写入自己的 `StoneFreeWorkspace.*.v1`，不修改游戏设置或存档。`StoneFreeAlternateWorkspace` 提供非模态侧边工作台，可保持原页面可交互。两者申请同一区域，先释放当前工作区再切换，不会自动抢占。普通试用只需选一个布局。

编辑布局时可用“恢复本布局”恢复该布局的默认顺序、可见内容和舒适密度，不清除其它布局或作者视图状态。存储不可用时，当前界面仍能恢复，但会提示本次无法保存。

可选安装 `StoneFreeNativeReading` 和 `StoneFreeReadingControls`，验证原版侧栏操作。前者提供按需状态和受审回调；后者通过公共合同显示非模态工具条，也可把同一视图放进工作台。侧栏仍由 SugarCube 的原按钮切换。模态打开时，视图拒绝调用外部原控件；非模态侧边工作台允许操作未被遮挡的原按钮。窄屏覆盖原按钮时仍退让，不强制穿透。不包含购买、换装、战斗或存档操作。

## 从源码构建

第八轮另提供可选 `StoneFreeMotionHub`，用于扇形展开、空间转场、拖动吸附、停靠和恢复。它消费公开视图及原版侧栏命令，不修改 Host、SDK 或正式 UI；只试用该原型时安装 Host 与 MotionHub 两个研究包即可。见[操作说明](motion-hub/README.md)与[本轮证据和限制](../docs/STONE_FREE_3.0_MOTION_HUB.md)。

可选 `StoneFreeWardrobeReference` 提供固定 A、选择 B、普通/空间比较及返回目录位置的只读衣柜实验。原版穿戴入口保留，不增加先查看再穿戴模式。见[说明](wardrobe-reference/README.md)。独立发行就绪工程及当前验证范围见[发行记录](../docs/STONE_FREE_3.0_DISTRIBUTION.md)。

共享 Vue 另作为独立分发实验，见 [说明](experiments/README.md) 和 [对照结论](../docs/STONE_FREE_3.0_VUE_DISTRIBUTION.md)。默认研究包仍由消费者自带 Vue；实验输出不替换默认 ZIP，也不改变 Host 合同。

使用仓库已有锁文件与依赖：`npm run framework:build`。产物位于 `dist/framework/`，与正式 UI 打包路径分开。`npm run framework:test` 检查生命周期、失效、资源争用、Vue 消费者和非参与者反例。无需重装依赖来使用现有环境。

`framework/contracts.ts` 是本轮研究接口。`createHost()` 不读取游戏业务状态，只管理参与者、独占资源和有归属的挂载。`boot.ts` 接入游戏的 jQuery 场景事件。API ready 仅表示公共对象可用，场景绑定需另行就绪；jQuery 晚到时最多等待 30 秒，未就绪期间场景操作退让。`:onloadsave` 来自所测 DoL 的存档配置，不是 SugarCube 的稳定公共事件。详见 [R15](../docs/STONE_FREE_3.0_R15.md)。公共对象不包含 Vue 实例、官方 Store 或内部节点索引。

## 挂载和失效

- `register(id)` 创建一个参与者。重复身份拒绝；退出释放该参与者的资源。
- `mount()` 只向指定父级增加自己的宿主，不移动或包装原控件。`passage` 在场景失效时销毁；`persistent` 留存，但旧 `binding()` 同样失效。
- `signal / isCurrent()` 用于异步载入和读取后的复核。过期异步结果不能重新挂载；清理回调在已退出后才返回时仍会执行。
- `onCleanup()` 释放自有监听器、Vue App 等。异常被局部记录，不阻止其余清理。`fail()` 只退出当前挂载。
- 原生局部 DOM 删除通过有宿主的祖先 child-list 观察处理；不订阅整个页面的 subtree，不尝试恢复被原页面删除的节点。
- `mountVue()` 创建独立 App。App 自带 Vue；不把内部实例提供给其它 Mod。

## 贡献和资源

`provide({id, schema, read})` 公开按需 JSON 投影。读取返回来源、采样时点及场景代次；结果有大小限制并复制冻结。提供者退出、场景过期、读取异常和不合法投影均有明确失败原因。它不是对原状态的实时监控。

`claim(kind, key)` 仅协调主动提交的 `region / shortcut / modal` 资源。同一资源先到先得，失败返回 `null`，不自动排队、抢占或禁用其它 Mod。布局提供者自行决定请求、释放和呈现策略。租约本身不会移动 DOM、捕获按键或调用业务。

示例使用原生 `dialog.showModal()` 或侧边布局的 `dialog.show()`。非模态不申请模态租约，原生模态仍进入浏览器 top layer。快捷键只绑定在自己组件内，跳过输入框、IME 和贡献者子树；侧边布局的 Escape 也只处理自己的控件。非参与者没有被注册、重排或附加全局按键监听器。参与者协商不等于保证所有未知 Mod 零冲突。

## 自愿贡献视图

先检查 `host.getCapabilities?.().views`，再使用 `participant.provideView({id, title, setup})`。Vue 作者可用 `vueView({load, props})` 复用 SDK 的 App 装载/释放；调用方只拿到自己挂载的元素和场景绑定，不获得其它 Mod 的私有对象。

布局提供者通过 `host.views()` 获取声明，调用视图的 `mount({id, parent, lifetime})` 放入自己创建的容器。不同实例可以独立呈现；撤销贡献会关闭它的全部实例，过期句柄不再挂载。`onViews()` 通知声明变化，故障视图局部回退，未参与的页面不进入列表。

`useProjection()` 只在当前视图中保留只读采样结果，并在来源变化、场景失效和卸载时更新或清理。它不订阅整个游戏状态。工作台重排的都是自有容器；隐藏或关闭时销毁视图实例，局部对照数据不跨关闭保留。

## 受审命令实验

先检查 `host.getCapabilities?.().commands`。提供者用 `provideCommand({id, schema, title, run})` 主动声明无参数回调；消费者通过 `host.commands(schema)` 获取句柄，并用当前挂载的 `binding()` 调用 `invoke(binding)`。声明变化由 `onCommands()` 通知。原节点、可变状态和业务函数不会通过句柄公开。

| 返回状态 | 含义 |
| --- | --- |
| `returned` | 提供者返回了受限、复制冻结的 JSON 见证；是否成功须按领域合同读取 `value`，不能只看状态。 |
| `missing` | 声明已撤销或 Host 已退出，未调用回调。旧句柄不能执行同名新声明。 |
| `stale` | 绑定不是此 Host 发行的有效绑定，未调用回调。 |
| `busy` | 同一声明已有调用未结清，未再次调用回调。其它命令没有被全局锁定。 |
| `unknown` | 回调已经开始，之后发生异常、结果不合法、场景失效或提供者退出；不能推断操作没有发生，不自动重试。 |

侧栏领域提供者每次调用前复核原节点身份、唯一性、原 API 状态和可用性，只执行一次原按钮 `click()`，再读取 `UIBar.isStowed()` 及原 class，返回 `{applied, before, after, reason}`。返回 `applied: false` 不是成功切换。未知结构、被替换的按钮和打开中的模态都退让，不直接调用 API 改状态。

这只是 UI 操作接缝，不是业务执行器、权限系统或持久 Effect Ledger。参与不产生游戏操作授权。回调须自行遵守领域语义和 signal；Host 不保证取消已开始的副作用，也不为永不返回的回调设置会触发重试的超时。不承诺跨故障 exactly-once。涉及购买、存档等业务仍需各自的有效身份与结果合同，不能直接套用此侧栏样例。

## Host 重启与包卸载

Host 退出时，仍然安装的消费者可以等待新 Host，这是预期行为；它不等于消费者包已卸载。临时部署或热替换时，应保留入口导出的 `dispose()` 并明确调用，解除等待订阅。研究脚本会同时检查自有 DOM 清空以及新 Host 不会重新唤起已卸载的包。

入口导出对象如何取得取决于调用方的打包/加载方式。这个卸载入口不接管 ModLoader 的启停或依赖管理。生成项目按自己的技术名称生成独立入口命名，避免多个作者项目共用一个全局入口名。

## 当前边界

当前有 Host/Vue SDK、信息/视图贡献、自愿资源协商、受审 UI 命令实验、工作台的有限布局偏好和下面的源码配方。尚未提供业务动作调度、Widget 编辑器或可视化 Factory。原有 UI Surface/API v1 未迁移。独立开发价值 A、跨 Mod 组合价值 B、玩家体验和 Factory 收益需要分别记录证据，不因样例能运行就宣称 3.0 完成。

## 最小作者配方

源码仓库的[作者指南](../docs/STONE_FREE_3.0_AUTHOR_GUIDE.md)说明完整流程。`framework:build` 还生成 `StoneFreeAuthorKit-0.1.2-experimental.source.zip`：只含配方、SDK、模板及许可证，解压后可在完整 UI 仓库之外创建作者项目。它不是 Mod，不要导入 ModLoader；运行中的 Host 由单独的 `.mod.zip` 提供。

运行 `node scripts/framework-factory.mjs create NEW_DIRECTORY ModId`，生成由作者拥有的 Vue/TS 项目、独立 ZIP 打包脚本和实验 SDK 快照。已有目录会拒绝，不覆盖作者文件。自行安装声明的依赖并保存自己的锁文件后，使用生成项目的 `npm run package`。

作者可直接修改 `src/Panel.vue` 和 `src/main.ts`。同一 SFC 用于独立浮动入口、可选工作台视图和本地 `npm run dev` 预览，实例之间不共享便笺。预览使用普通 Vite，不连接游戏或模拟 Host；预览正常不能代替游戏检查。旧 Host 缺少 `views` 时保留独立入口。

升级前可运行 `node scripts/framework-factory.mjs check-sdk EXISTING_DIRECTORY`，只读检查三个 SDK 文件。`aligned` 表示与当前来源一致，`source-different` 表示来源不同但作者未修改，不能据此判断版本新旧。`author-modified / missing / alias / not-file` 需要人工处理。成功完成诊断时退出码为 0，调用者应读取 `canReplace`；它只表示可以机械替换，不证明 API 或业务兼容。

`node scripts/framework-factory.mjs upgrade-sdk EXISTING_DIRECTORY` 只更新记录过且未被作者修改的三个 SDK 文件。上述阻塞状态会在写入前整次拒绝，并指出文件名。作者 SFC、入口、预览、构建配置和依赖不被更新覆盖；旧项目也不会自动获得新配方文件。无 CSS 的作者组件可以打包，预览文件和内部 SDK manifest 不进入 Mod ZIP。自定义资源仍需作者按实际输出调整打包脚本。

这是源码优先的有限配方，不承诺任意 SFC 到画布的往返。真实历史 SDK 升级与二次修改记录见[作者工作流与侧边工作台](../docs/STONE_FREE_3.0_AUTHOR_WORKFLOW.md)；尚未证明相对 Vite 模板 + Agent 的普遍效率收益。
