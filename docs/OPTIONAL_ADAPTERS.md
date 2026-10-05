# 2.0.3 独立兼容包

UI 主包负责通用界面；以下包按需要安装，不能代替目标 Mod。没有安装外观包时，目标 Mod 使用自己的界面与功能。

| 包（适配包版本均为 0.1.0） | 目标版本 | 用途 |
| --- | --- | --- |
| MapleBirchSoftWet | MapleBirch 5.2.3 / UI 2.0.3 / DoL 0.5.12.13 | 云存档外观 |
| ModHubSoftWet | ModHub 1.3.0 / UI 2.0.2 或 2.0.3 / DoL 0.5.12.13 | 管理器 Acrylic 外壳、轻内容区和按钮样式 |
| LyraMouthCompat051213 | Lyra 0.5.12.13-1.0.1a-1004.1-goose-ucb / MapleBirch 5.2.3 | Goose 主角色嘴部路径修复，不依赖 UI |
| LyraWardrobeMouthSoftWet | Lyra 0.5.11.9-1.0.0a-0815-goose-ucb / UI 2.0.3 | 旧版本衣柜私有预览嘴部路径，**不用于 0.5.12.13** |

## 安装与升级

1. 替换旧 DoLGameUI，导入 `DoLGameUI-2.0.3.mod.zip`，不要解压。
2. 根据目标 Mod 的版本选择兼容包；原版游戏不需要 Goose 或第三方外观包。
3. 每个兼容包只启用一个版本。已安装 preview 包时，导入对应正式包替换同名 Mod。
4. 普通兼容包在 UI 和目标 Mod 之后加载。旧 Lyra 衣柜包使用提前注入监听器，以覆盖第一次预览。
5. 重启游戏。关闭 Soft & Wet 总开关后，外观包回到原版样式；禁用兼容包并重启可完整撤销。

0.5.12.13 不安装旧 Lyra 衣柜包。已有 `LyraMouthCompat051213` 可替换为同名 0.1.0；路径修复代码保持一致。MapleBirch 外观包只影响云存档外观，不影响连接、上传、下载等业务。

统一文件命名：`包名-目标Mod-目标版本-v适配包版本.mod.zip`。目标版本同时写入依赖清单和运行时检查。

## 源码与开发边界

源码位于 `compat/`，打包示例：`python scripts/package-adapter.py compat/modhub-soft-wet`。各包独立生成在自身的 `dist/` 中，不会编入 UI 主包。

- MapleBirch 包只增加或撤销外层样式 class，不移动原控件、不维护云端状态。
- ModHub 包为纯 CSS，不改安装、排序、删除、市场或恢复逻辑。
- UI 的 `dol-ui-outfit-prepared` 事件仅传递已绑定 options 的私有 `{model, options}`，发生在编译前；旧 Lyra 包只调整这个模型的 mouth.srcfn，不改全局角色模型或 V/T。
- 0.5.12.13 嘴部包通过 MapleBirch 的公开角色图层接口注册 main 嘴部路径，使用游戏内已有资源，不随包分发图片。
- cheat_extended 没有专属兼容层；通用作弊页面继续美化原控件。

## 验证范围

拆分候选在 DoL 0.5.12.13 Android 平板上检查了存档列表/详情、V2 布局、导入导出显示、MapleBirch 5.2.3 云存档外观及 ModHub 1.3.0 管理页。原节点/父级/值、总开关与单页回退、触屏高亮、显示偏好及模组顺序检查通过，UI 操作期间游戏变量未改变。

构建和隔离专项覆盖动态 option、未知版本回退、撤销、单层 blur，以及旧 Lyra 私有预览 prepare/compile 调用。旧 Lyra 衣柜适配未在本轮 0.5.11.9 真机重验。未执行用户存档读写或云端业务，不将外观检查视为云端功能验收。
