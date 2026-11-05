# Soft & Wet 4.x Component Lab

本Lab预览现役FloatingTools.vue和Toolbar.vue及正式样式，不加载游戏主Runtime；内存回调不能代替生产拖动、自动避让、保存或原业务验收。当前源码及环境以本机HEAD/锁文件和[4.x交接](../docs/HANDOFF.md)为准，不把旧3.0或历史工具版本称作当前结果。

`npm run lab`仅回环监听，地址以终端为准；lab:check检查类型，lab:build输出忽略目录，lab:test做对应浏览器检查。HMR用受控无业务样式并finally恢复原字节，每次证据独立。网格/扇形、玻璃及档位props为演示输入，不证明生产响应式。

Source Index限shop.toolbar、floating.tools两个实际profile；异步空值先等待，无法证明匹配则返回Unknown。`node component-lab/source-index.cjs --out NEW_INDEX.json --component floating.tools`生成对应索引；不为旧Lab补生产样式或修改全局工具配置。Lab与索引不进入玩家Mod包。

旧说明已在old仓库的history/local/main对应Git树完整保存（blob8e6be5ad1bf94c0fea4ab921e6d9877da015e2ad），只作历史追溯，不是4.x指导。当前开发入口见[开发说明](../docs/DEVELOPMENT.md)。
