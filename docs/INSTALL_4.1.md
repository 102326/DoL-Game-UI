# 安装、升级与回退 Soft & Wet 4.1

普通玩家需要 **Framework Host + DoLGameUI** 两个 ZIP。它们是 Mod 安装包，直接导入 Loader，不要解压。兼容包按自己安装的目标 Mod 选用。

## 安装

1. 保留需要的存档与原版本包。
2. 从 [4.1 发布页](https://github.com/102326/DoL-Game-UI/releases/tag/v4.1.0)下载 Framework Host、主 UI 和所需兼容包。
3. 停用同名旧包，每个 Mod 只启用一个版本。
4. Host 放在主 UI 前，兼容包放在目标 Mod 与 UI 后。
5. 重启游戏，从侧栏或悬浮工具打开“界面设置”。

顺序示例：**目标 Mod → Framework Host → DoLGameUI → 对应兼容包**。目标 Mod 自己的前置与加载顺序照原说明处理。

DoL 适配基线为 0.5.12.13，ModLoader 需 2.100.0 或更新，TweeReplacer 需 1.0.0 或更新。Host 适用 0.1.2-experimental 至 0.2.0 之前，推荐使用本版附带的 0.1.5-experimental。游戏本体和第三方主 Mod 需另外安装。

## 从旧版本升级

替换主 UI，保留已有显示偏好。本次同时提供更新的 ModHub、ReOverfits 与万能手机兼容包；其余包可继续沿用。已安装对应版本 Host 时无需重复导入。

新安装的通透度默认为60，正文排版跟随原版，悬浮工具默认显示，战斗选项默认全部展开。已有明确保存的选择继续沿用。

兼容包用途见[可选兼容包](OPTIONAL_ADAPTERS.md)。CE 原作者版与 rebuild.30 二选一，万能手机兼容包用于 Alpha；Lyra 嘴部资源包按其指定游戏环境安装。

## 回退

恢复保存的原 UI、兼容包与顺序，再重启游戏。其它 Mod 仍需要 Host 时保留它。不要删除存档、清空浏览器或整个 App 数据。

仅想切回某个原版界面，可在“界面设置 → 页面”中关闭对应页面；总开关会保留当前显示偏好。
