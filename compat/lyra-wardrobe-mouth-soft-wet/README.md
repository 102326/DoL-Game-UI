# 旧 Lyra Goose 衣柜预览适配

> 当前 2.2 构建的包版本与依赖见文末；此前版本说明保留为历史记录。
仅适用于 Lyra `0.5.11.9-1.0.0a-0815-goose-ucb` 和 UI 2.0.3 或 2.1.0，本包版本 0.1.1。不得用于 0.5.12.13。

原内置路径规则已移到本包。监听 `dol-ui-outfit-prepared`，只调整新生成的私有衣柜预览模型的 mouth.srcfn；不修改原角色模型、V/T、脸型状态、游戏图片或存档。监听器提前注入，首个预览也可使用；版本判断在预览准备时执行。

未知版本不应用。禁用或移除并重启后，UI 使用原版预览路径。0.5.12.13 的主角色嘴部修复继续使用之前独立的 LyraMouthCompat051213，不属于本包。

文件名尾部依次标出完整 Lyra 版本和本包版本。

0.1.1 仅补充 UI 2.1.0 的版本声明（MapleBirch 包同时更新运行时版本门槛）；沿用 0.1.0 的外观与业务边界。

开发构建：源码为 `lyra-wardrobe-mouth.ts`，仅为原事件的私有预览模型与嘴部回调增加类型。运行 `python scripts/package-adapter.py compat/lyra-wardrobe-mouth-soft-wet`，生成 `dist/scripts/lyra-wardrobe-mouth.js`；ZIP 保持原提前注入入口及依赖顺序，不直接加载 TS，不修改原角色模型。

## 2.2 / Crazy Diamond 构建

本包更新为 **0.1.2**，自有入口改为 TypeScript，并编译成 Manifest 中原命名的 JavaScript。兼容 UI **2.2.0**，同时保留此前声明的 UI 版本。目标 Mod / 游戏版本门槛、资源、原控件和业务行为保持不变；升级时替换同名旧包，不要重复启用。
