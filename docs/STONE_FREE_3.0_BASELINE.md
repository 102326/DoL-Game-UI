# Stone Free 3.0 开发参考

Windows接续已继承正式2.6.0的缩放迁移、浮层与战斗插图修复，见[接续记录](STONE_FREE_WINDOWS_AB.md)。以下RC1环境记录为历史基线，当前公共API仍为v1。

基线是从可核验的 2.5 发布提交 1cf35e901cbb7c78aebc0555d40bb10c6eca6dfc 派生的 fix/soft-wet-2.6-baseline 分支。2.6.0-rc.1 已通过本轮桌面定向验证，尚不是 Android 正式稳定版本。可以开始隔离原型，正式集成仍需真机及目标组合验收。

构建用锁文件：Node 22.12+、Python 3.10+，npm ci、npm run build、npm test、npm run package。打包脚本使用 python 命令；环境仅有 python3 时可在临时 PATH 里提供对应 python，不修改系统。集成资源与 DOL_TEST_WORKSPACE / DOL_UPSTREAM_SOURCE / TWEEGO_BIN 见 DEVELOPMENT.md。本轮 Node 24.18.0、Python 3.12.14、Chrome；不是远程云端或 Android 环境。

可直接复用 src/ui 的 GameButton、SettingsToggle 等基础控件；theme/SettingsPanel、wardrobe/WardrobePanel、combat/CombatPanel、saves/SavePanel 是现有页面组件。公共 ui API v1 的 openModal/openDrawer 接受调用方新建的脱离内容，提供能力检查、重复 ID、焦点、原生 dialog 和关闭清理；不适合搬入现存第三方页面。保留降级返回 null 和逐页原版入口。

Soft & Wet 自己拥有 dgw-root/dgw-shell、dgshop-host 及 catalog/detail-body/purchase 等自建容器、dcu-root 与底部 dock、dgs-host/dgs-tools、dol-midnight-controls、dgu-surface、dmt-sidebar-tip。类名不能替代所有权跟踪，也不意味着可以删除其中晚到的第三方内容。

原剧情 .passage、原衣柜列表/出口/整理控件、商店商品/颜色/购买节点、存档行和导入导出控件、战斗 action list 和原菜单、侧栏入口均由游戏或目标 Mod 管理。现有适配只移动确认区域并留恢复锚点；新功能不要扩大搬移范围，不要 clone 后代理业务，不要删未知节点。侧栏按钮必须保持 overlayButtons 直接子级；第三方节点插入到原生区域应保留身份、事件与状态。第三方直接修改 Vue 渲染内部结构未构成通用兼容契约。

保持 DoLGameUI 标识、DoLMidnightTheme.preferences.v1 的既有字段、各页面开关和实验键、Save metadata 的兼容结构与 API v1。字号/按钮统一50–150、默认100；首次迁移仅重置这两个值，既有_scaleBaseline26标记保持有效，之后窗口变化和升级保留选择。showCompact/collapsedStats 是停用但可解析的旧字段，不重启旧折叠功能。实验默认关闭，启动缓存只在下次启动撤销，衣柜操作忙碌时不能强行回退。

布局按实际容器工作：侧栏899px断点；手机密度/临时缩放用视窗宽度或屏幕短边600px；商店实际容器799px以内使用详情抽屉；战斗700px以内窄布局；存档列表650px与V2内联详情760px边界。已有CSS还含480px密度规则。以各模块源代码为准，不把viewport等同容器，也不把矮窗口模拟当成真实软键盘。

新功能集成前关注 passage 生命周期、原节点动态替换、延迟 metadata/预览、generation 失效、原生一次事件、MutationObserver/ResizeObserver/帧回调释放、焦点与滚动恢复、总开关与局部失败回退。优先沿用 source/guard、restoreNative、isolate 和公共 surface，不增加未来抽象。未知 Mod 和关闭后的恢复仍需相应回归。

自由悬浮球、Widget编辑器、剧情动作增强、新设置中心、全局命令面板和大型主题属于3.0；UI Source Link/Component Lab并非本基线依赖。
