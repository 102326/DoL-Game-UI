# Stone Free Component Lab

预览当前3.0真实 FloatingTools.vue 和 Toolbar.vue，复用正式样式入口，不加载游戏主Runtime。回调只记录内存，不代表拖动、自动避让、位置保存或生产业务验收。

运行 npm run lab，仅回环监听，默认5175，以终端实际地址为准；Ctrl+C停止。lab:check检查类型，lab:build输出到ignored artifacts，lab:test使用已安装Chrome和自有Vite验证。HMR测试加短暂且无业务影响的控制样式，finally恢复原字节，每次证据使用新目录。

Lab支持网格／扇形、玻璃开关和Balanced／Fancy。容器宽度和菜单位置是手动props，不能冒称生产自动响应式。

Source Index只允许两个固定profile：shop.toolbar、floating.tools。线索取折叠面板textContent，异步数据为null时先等待。旧Lab的ui/utilities.css不在当前工程，已经去除该输入，没有迁就旧Lab新增生产文件。

已安装Skill解析到4.0.1；5.0 A/B是独立原型。当前A consumer只接受shop.toolbar，悬浮线索返回Unknown，不伪造matched；直接源码和CDP继续可用。未修改Tools或全局Skill。Lab/index/maps不进入普通Mod包。

node component-lab/source-index.cjs --out NEW_INDEX.json --component floating.tools

本轮实际检查与工具反馈见 ../docs/STONE_FREE_WINDOWS_AB.md。
