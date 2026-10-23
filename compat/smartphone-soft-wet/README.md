# SmartPhoneSoftWet 1.1.1（本地候选）

将 NEEDMEET遇欲／ANLINSTUDIO 的“万能的智能手机”窗口适配为 Kraft Work 3.X 黑灰 Acrylic。主 Mod 技术名是 `SmartPhone Alpha`；本包在结构匹配时接受已核对的 `0.3.91` 和 `0.3.91.1`，不包含主 Mod 或 PhotoPack。

要求 DoL `0.5.12.13`、`DoLGameUI >=3.0.2` 及主 UI 所需 Host。先加载作者主 Mod、Host 和主 UI，再加载本包。作者下载：[v0.3.91](https://github.com/ANLINSTUDIO/Degrees-of-Lewdity-DolSmartPhone/releases/tag/v0.3.91)。

适配正常手机外壳、状态栏、底部导航、应用图标卡片、内容滚动区、普通输入控件及备忘录。1.1.0 进一步融合 Kraft Work 的细边、柔和卡片、留白和按压反馈，并为作者 debug 窗口添加 Acrylic、命令输入区、链接按钮及可滚动日志区。窗口按视口和作者的缩放设置限制尺寸，不加入动态天气。

保留作者壁纸、图标、动画和原事件，不修改购买、相册、电话、闹钟或存档业务。debug 的命令执行、警告与状态操作仍由作者管理，本包不会自行执行命令。

未识别的结构、版本、预览窗口和响铃特殊窗口保持原样。关闭主 UI 或移除兼容包后恢复作者外观；回退时停用本包并重启，无需清空游戏数据。当前候选的验证与未覆盖项见仓库发布前Gate报告；1.1.0历史记录位于独立compat/smartphone-3x分支。

构建：`python scripts/package-adapter.py compat/smartphone-soft-wet`。
