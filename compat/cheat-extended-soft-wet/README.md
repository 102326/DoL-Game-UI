# Cheat Extended · Kraft Work 外观兼容 1.0.0

主要适配原作者 chris81605 的 Cheat Extended 1.20.3.1。另行覆盖 102326 独立维护的 1.20.3.1-rebuild.30；后者不是原作者发行版。两版技术名均为 `cheat extended`，只能启用其中一个。

原作：https://github.com/chris81605/Degrees-of-Lewdity_Cheat_Extended 。本次核对作者 main 为 c36b23a6ab1899c7f780faa63945fe6e199a6355。兼容包不包含或替代原作，不改变原作许可证或署名。

## 安装

需要 DoL 0.5.12.13、Soft & Wet 3.0 — Kraft Work，以及 Cheat Extended 1.20.3 系列或更新；界面接口基线为原作者 1.20.3.1，独立维护 rebuild.30 另行验证并明确兼容。加载顺序为 Host、UI、目标 Cheat Extended、本兼容包，重启后使用。不要同时安装原作者版和 rebuild.30。

加载器最低声明使用 >=1.20.3，避免其四段预发布比较将 rebuild.30 错判为低于 1.20.3.1；真正是否应用外观仍由运行时版本与结构检查决定。最低声明不等于所有后续版本都支持。运行时使用最低版本及完整两级目录结构校验，不把原作者后续稳定版本精确锁死。实测为原作者 1.20.3.1 与 rebuild.30；未来版本和 Modernization／CE-R1 未验收，结构不匹配时退让。DoLCheatReboot 使用不同技术身份，不在本包范围。

## 变化与边界

1.0.0 同步 Kraft Work 3.x 的单层 Acrylic、内容材质和交互反馈；没有新增作弊功能。

独立 CE 窗口和原版作弊页内嵌 CE 菜单采用黑灰 Acrylic、轻内容面及清楚的两级分类。复用 Kraft Work 的窗口、导航反馈和天气表现，不捆绑第二套 Runtime。

原按钮、控件值、事件及 CE 分类记忆继续由 CE 管理。不修改作弊公式、Hook、传送、金额、存档、CE 配置或第三方逻辑。关闭 UI 总开关或停用本包后恢复原样。无需创建新存档。

外观检查、原操作检查与全功能验收分别记录；不能把安装成功称作所有作弊功能通过。实际版本与平台覆盖见配套验收报告。未知结构和未支持版本退让，原入口仍可用。

## 开发

源码仅含本兼容层，`python scripts/package-adapter.py compat/cheat-extended-soft-wet` 打包。诊断 `window.CheatExtendedSoftWet.getDiagnostics()` 分别返回独立窗口与内嵌菜单合同。不在诊断中导出游戏变量或控件内容。
