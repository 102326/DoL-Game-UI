# Stone Free Host：第一轮研发原型

这组离线 Mod 用来检验 3.0 的公共接缝，不是 Soft & Wet 3.0 正式版。现有 UI 2.7.0、偏好、存档和 API v1 没有改动。协议 `0.1-experimental` 可能在研究后调整，请勿作为稳定第三方依赖发布。

## 运行

依次启用 `StoneFreeHost`、`StoneFreeNativeStatus`、`StoneFreeStatusComparison`。不需要安装 `DoLGameUI`、MapleBirch 或官方主题。两个视图分别自带 Vue，Host 本身不包含 Vue；这次先验证分离可行性，不宣称它是最终最优分发方式。

状态速览按需读取原游戏的 `pain / stress / tiredness`，不复制整个状态，也不修改数值。状态对照只通过公开来源读取，允许在本界面记录一次采样与当前值比较。切换场景清除对照，退出后不保存。缺失字段显示未知，缺失提供者显示不可用。

另一个可选研究包 `StoneFreeSoftWetSurface` 使用同一来源及既有 UI API v1 打开官方 Drawer，需要官方 UI 2.7.0。它只验证官方布局作为可选消费者；不安装它时，前面三个包仍独立工作。

安装 `StoneFreeWorkspace` 可使用信息工作台：默认显示自愿贡献的状态速览与对照，支持隐藏、排序、舒适/紧凑密度。显示偏好只写入自己的 `StoneFreeWorkspace.*.v1`，不修改游戏设置或存档。`StoneFreeAlternateWorkspace` 是争用同一区域的对照研究包，普通试用无需同时启用它。

## 从源码构建

使用仓库已有锁文件与依赖：`npm run framework:build`。产物位于 `dist/framework/`，与正式 UI 打包路径分开。`npm run framework:test` 检查生命周期、失效、资源争用、Vue 消费者和非参与者反例。无需重装依赖来使用现有环境。

`framework/contracts.ts` 是本轮研究接口。`createHost()` 不读取游戏业务状态，只管理参与者、独占资源和有归属的挂载。`boot.ts` 接入 SugarCube 生命周期。公共对象不包含 Vue 实例、官方 Store 或内部节点索引。

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

示例使用原生 `dialog` 执行模态及焦点语义，快捷键只绑定在自己组件内，跳过输入框和 IME。非参与者没有被注册、重排或附加全局按键监听器。参与者协商不等于保证所有未知 Mod 零冲突。

## 自愿贡献视图

先检查 `host.getCapabilities?.().views`，再使用 `participant.provideView({id, title, setup})`。Vue 作者可用 `vueView({load, props})` 复用 SDK 的 App 装载/释放；调用方只拿到自己挂载的元素和场景绑定，不获得其它 Mod 的私有对象。

布局提供者通过 `host.views()` 获取声明，调用视图的 `mount({id, parent, lifetime})` 放入自己创建的容器。不同实例可以独立呈现；撤销贡献会关闭它的全部实例，过期句柄不再挂载。`onViews()` 通知声明变化，故障视图局部回退，未参与的页面不进入列表。

`useProjection()` 只在当前视图中保留只读采样结果，并在来源变化、场景失效和卸载时更新或清理。它不订阅整个游戏状态。工作台重排的都是自有容器；隐藏或关闭时销毁视图实例，局部对照数据不跨关闭保留。

## Host 重启与包卸载

Host 退出时，仍然安装的消费者可以等待新 Host，这是预期行为；它不等于消费者包已卸载。临时部署或热替换时，应保留入口导出的 `dispose()` 并明确调用，解除等待订阅。研究脚本会同时检查自有 DOM 清空以及新 Host 不会重新唤起已卸载的包。

入口导出对象如何取得取决于调用方的打包/加载方式。这个卸载入口不接管 ModLoader 的启停或依赖管理。生成项目按自己的技术名称生成独立入口命名，避免多个作者项目共用一个全局入口名。

## 当前边界

当前有 Host/Vue SDK、信息/视图贡献、自愿资源协商、工作台的有限布局偏好和下面的源码配方。尚未提供业务动作调度、Widget 编辑器或可视化 Factory。原有 UI Surface/API v1 未迁移。独立开发价值 A、跨 Mod 组合价值 B、玩家体验和 Factory 收益需要分别记录证据，不因样例能运行就宣称 3.0 完成。

## 最小作者配方

运行 `node scripts/framework-factory.mjs create NEW_DIRECTORY ModId`，生成由作者拥有的 Vue/TS 项目、独立 ZIP 打包脚本和实验 SDK 快照。已有目录会拒绝，不覆盖作者文件。自行安装声明的依赖并保存自己的锁文件后，使用生成项目的 `npm run package`。

作者可直接修改 `src/Panel.vue`。`node scripts/framework-factory.mjs upgrade-sdk EXISTING_DIRECTORY` 只更新记录过且未被作者修改的三个 SDK 文件。作者改过 vendored SDK 时整次拒绝，需手动合并。配方模板不会重新覆盖 SFC、设置、样式或依赖。这是源码优先的有限配方，不承诺任意 SFC 到画布的往返，也尚未证明相对 Vite 模板 + Agent 的普遍效率收益。
