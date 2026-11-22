# 天气观测台 · 独立接入

这里有两个分别打包的研究 Mod。Host5Atmosphere 在 Framework Host 上提供天气视图及晴、雨、雪三条预览命令。Host5Observatory 只用公开的视图和命令接口取得它们，可在自己的视图中调用效果，不内嵌绘制实现。两者都不依赖 Soft & Wet 主 UI。

现有独立工作台 StoneFreeWorkspace 会发现这两个视图。进入「信息工作台」，可以看到工作台直接挂载的效果，和观测台通过接口挂载的效果。用观测台的按钮切换天气，两处会响应；用「编辑布局」单独隐藏其中一处，另一处可以继续使用。关闭工作台会释放画面，重新打开沿用本次会话中所选天气。输入来自预览按钮，不涉及游戏天气或存档。

从仓库根目录运行 `python prototypes/host5/workspace-weather/package.py`。两个 ZIP 生成在 `dist/host5/workspace-weather/`。使用 4.5.1 随附的 StoneFreeHost 和已有的 StoneFreeWorkspace 研究包，可运行 `node prototypes/host5/workspace-weather/check.mts <Host ZIP> <Workspace ZIP>`；检查在临时的中性浏览器页加载各包的真实脚本和样式。
