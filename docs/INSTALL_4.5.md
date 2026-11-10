# Soft & Wet 4.5 — 研发包安装边界

当前4.5.0是研发分支，尚未正式发布。稳定版仍从[最新发行页](https://github.com/102326/DoL-Game-UI/releases/latest)取得；不要把研发Actions制品当成正式升级通知。

安装机制沿用[4.2安装说明](INSTALL_4.2.md)：同一技术名只保留一个UI版本，保留兼容的Framework Host，按实际目标Mod选用适配包，并重新注入/打开生成的游戏。UI、Host与兼容包采用各自版本，不需要将Host号改成4.5。不读取或自动上传存档；首次研发验证使用隔离游戏副本与备份。

本轮入口变更见[4.5研发记录](RELEASE_4.5.0.md)。Windows、Android/WebView和真实ModLoader的当前候选安装行为尚未本轮复验。
