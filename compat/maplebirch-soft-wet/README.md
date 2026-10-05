# MapleBirch Soft & Wet

适用于 MapleBirch **5.2.3**，本兼容包版本 **0.2.1**。需要本轮 DoLGameUI **2.1.0**（`ui.apiVersion === 1`）和 DoL 0.5.12.13，在 MapleBirch 和 UI 后加载，不要解压。替换旧 MapleBirchSoftWet，不同时启用两个版本。

仅给已识别的云存档容器增加可撤销样式标记，复用之前的亚克力外壳和稳定正文。不移动或替换原控件，不接管认证、上传、下载、删除、网络请求或存档内容。动态内容继续由 MapleBirch 创建。

关闭 Soft & Wet、关闭新版存档、切换标签或未知页面结构时撤销样式。移除本包并重启可恢复原样式；云存档功能本身不受本包控制。不要把验证当成云端业务验收。

文件名尾部标出目标版本和本包版本：`MapleBirchSoftWet-maplebirch-5.2.3-v0.2.1.mod.zip`。

0.1.1 仅补充 UI 2.1.0 的版本声明（MapleBirch 包同时更新运行时版本门槛）；沿用 0.1.0 的外观与业务边界。

0.2.0 使用 UI Core 的 Style Only Adapter：多条件指纹校验、候选 selector、角色样式、局部监听与撤销。只加可恢复的 data 属性，不搬节点、不改变值、事件或业务。完整匹配应用专属样式，部分匹配仅保留已验证的外壳角色，完全未知停止适配。缺少新 Runtime 时原界面保持；可调用 `window.MapleBirchSoftWet.getDiagnostics()` 查看原因。较早的 UI 2.1.0 包不含接口，需一并更新主包。

0.2.1 增加公共 API 版本、方法及 Style Adapter 能力检查；不依赖新增 Surface API，也不替换目标原窗口。方法或能力缺失时不注册适配，保留原样，可通过 getDiagnostics() 查看退出原因。
