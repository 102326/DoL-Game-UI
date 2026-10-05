# Lyra 0.5.12.13 Goose 嘴部路径兼容

> 当前 2.2 构建的包版本与依赖见文末；此前版本说明保留为历史记录。
独立补丁，仅适用于 Lyra `0.5.12.13-1.0.1a-1004.1-goose-ucb` 与 MapleBirch 5.2.3。

- 使用 MapleBirch 的角色图层接口，仅修正 main 模型 mouth 的 srcfn。
- 使用 APK 已有的 150 张嘴部资源，不包含或替换美化图片。
- 未知脸型保留原路径；不改 showfn、表情、遮罩、口红、NPC、存档或游戏变量。
- 加载顺序：MapleBirch、角色图层扩展之后加载本补丁。不要同时启用旧 0.5.11.9 嘴部补丁。
- 回退：禁用或移除本补丁并重启。其它版本没有验证，运行时会拒绝应用。

本包不依赖 UI 主包。已验证目标环境的 main 嘴部路径与资源加载，不代表所有角色图层 Mod 的组合均已覆盖。

开发构建：源码为 `mouth-compat.ts`，宿主类型只描述本包使用的版本查询与角色图层接口，不依赖 UI Runtime。运行 `python scripts/package-adapter.py compat/mouth-compat-051213`，生成 `dist/scripts/mouth-compat.js`；ZIP 仍使用原 JS 入口、原版本门槛和原资源路径，不直接加载 TS。

## 2.2 / Crazy Diamond 构建

本包更新为 **0.1.1**，自有入口改为 TypeScript，并编译成 Manifest 中原命名的 JavaScript。本包仍不依赖 UI。目标 Mod / 游戏版本门槛、资源、原控件和业务行为保持不变；升级时替换同名旧包，不要重复启用。
