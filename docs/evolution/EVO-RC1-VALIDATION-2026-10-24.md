# Evolution RC1：发布前技术准备

**历史快照**：RC1在后续ModHub雨效反馈后停止收口，现由[RC2修复与最终技术记录](EVO-RC2-VALIDATION-2026-10-24.md)取代。以下保留当时来源和结果，不作为当前候选入口。

2026-10-24。负责人授权推进发布前1–5，不包含main合入、Tag或发布。本轮源码已固化并推送至 `dev/evolution-4.0`：`78430e6df124f9d9dd3a9b32fc3e8bc35602878d`。

## 结论

**1–5技术准备完成，候选为4.0.0-rc.1。** 正式版本计划4.0.0，最终发行仍由负责人确认。公开3.0.4及其Assets没有覆盖。G1/G2/G3最终裁决与发布授权继续分开，不由CI或本报告代签。

| 工作 | 本轮结果 |
| --- | --- |
| 源码冻结与CI | 已提交、推送；标准与研究CI及各自独立下载证据校验均成功 |
| 制品身份 | 下载10项SHA全部一致；9包ZIP、CRC、元数据、成员及依赖与构建报告一致；CI两次独立构建及9项版本/负向/证据测试通过 |
| 实际环境复验 | Windows真实游戏/Loader及Android测试App设置代表场景通过；最终Android重启后8个适用自有包全部成员与CI一致 |
| 版本与范围 | 内部4.0.0-rc.1，拟正式4.0.0；新天气模型仅接入设置，保留其它窗口现有路径 |
| 候选与材料 | 9个候选ZIP及独立9包SHA清单已整理；安装、首页稿、Release稿和当前动态媒体已更新 |

## 源码与CI

- [标准40073549523](https://github.com/102326/DoL-Game-UI/actions/runs/40073549523)：success，包含validate、独立evidence-verify及moody-gate。
- [研究40073548637](https://github.com/102326/DoL-Game-UI/actions/runs/40073548637)：success，包含prototype与独立evidence-verify。
- 两份独立报告均为PASS、COMPLETE，绑定同一78430e6、源码树和内容摘要。标准检查包已本地下载核对；研究大媒体没有再次全量下载，不冒称本机全量重放。
- [九包与验证身份](EVO-RC1-PACKAGES-2026-10-24.json)列出版本、依赖、逐成员及ZIP SHA。构建报告只在技术材料中保留；玩家下载集合仅9个ZIP与SHA256SUMS，不包含测试日志、原始存档、PACKAGE_CHECKS或图片视频。

兼容包与历史受验包的内容已核清：ModHub/MapleBirch的README、boot及SmartPhone的README/CSS只有CRLF/LF差异，运行逻辑未变；其它未改包按逐成员身份复用证据。ZIP容器跨Windows/Linux摘要不同单独记录，未将容器差异误判为功能修复，也未静默换包。

## Windows与Android

Windows：Edge157.0.4341.16、真实DoL0.5.12.13及Loader隔离origin，加载Host与新UI。实际双布局、分类、舒适阅读输入及恢复、受控血月/极热/严寒、390px边界与关闭释放通过。该环境包含基础内嵌Mod，并非完整平板社区组合。执行成员与CI包完全相同，两个随包中文文档仅换行不同。

Android：M367FC、Android17、WebView155.0.8059.43，独立测试App。先验证实际旧UI成员与可恢复快照一致并备份；导入候选后原生重启，实际触控双布局、分类与开关通过。临时只读Weather代理验证血月、雨中血月、极热与严寒，随后恢复原绑定、全部偏好、Passage、回合及游戏状态；未推进游戏、未写存档。

最终导入精确CI UI ZIP并再次原生重启。8个适用包逐成员一致，顺序与禁用列表不变；ReOverfits无设备目标，未额外安装。150%字号下原生触控滑动实际改变滚动位置，设置打开时背景命中被阻挡，关闭后天气节点清除。新UI最终留在测试App标题页，原偏好恢复。

平板实际保留ModHub1.8.3、MapleBirch/Simple Frameworks5.5.5、原版优化1.1.2.1、SmartPhone Alpha0.3.91.1及CE rebuild.30；没有以候选准备为由再次更新第三方主Mod。5.5.5是当前现场版本，本轮未执行云端读写，旧5.5.4业务证据不能自动改写成5.5.5完整验收。

## 展示材料

- [实际游戏截图及来源](../media/evolution-rc1-game/manifest.json)：Windows真实Loader、Android安装候选；天气输入受控，不标为自然事件。
- [实际设置整合的桌面原速视频](../media/evolution-special-integrated/desktop-1x.mp4)、[窄屏原速视频](../media/evolution-special-integrated/narrow-1x.mp4)：同一认可绘制与当前源码，10组检查通过；[输入和媒体摘要](../media/evolution-special-integrated/manifest.json)单列。
- [实际Hub组件原速视频](../media/evolution-rc1-hub/desktop-1x.mp4)、[窄屏](../media/evolution-rc1-hub/narrow-1x.mp4)：当前源码，原工具入口由受控替身提供；不标为游戏或真机录屏。录制器复用现有脚本，仅调整输出目录和相对导入位置。

Android截图先于最终文档换行对齐，执行成员已证明等价；最终安装身份另由重启后的全部成员核对证明。完整原始材料只留本地，不公开存档、设备serial、包备份和原始日志。

## 失败记录与边界

- 初次设备只读连接在锁屏时超时，unlock因安全状态未知停止；负责人手动解锁后才继续，没有绕过认证。
- Windows初次双CDP客户端在重载时发生对话框处理竞争；改为单一测试进程。随后原生首次年龄确认遮挡控件，按负责人既有成年确认完成原入口，再执行真实点击，没有强制穿透。
- 本地设备安装脚本一次表达式语法错误在导入前失败；修正后才导入。一次触控脚本使用错误导航选择器及未公开closeSettings方法，清理报错；改用真实按钮与嵌套finally，恢复绑定和偏好后重验。该失败遗留的自有旧PID转发已精确移除，其它转发未触碰。
- Hub录制器复制后相对导入失效，修正为当前项目入口后完成。没有通过降低产品测试断言消除失败。

以上为测试/准备失败，保留原始输出，不计为多个产品缺陷。99次开关后的资源残余来源仍Unknown；无完整FPS或长期无泄漏结论。实体手机、iOS、自然特殊事件、所有Mod/业务组合、云端写入及本轮无目标的ReOverfits不作新覆盖声明。READ01继续排除，没有恢复被否决的血雨或重做材质。

## 交付状态

- **Delivered**：冻结源码、候选9包、SHA清单、安装与玩家文案、当前媒体。
- **Validated**：对应两套CI/独立证据、包身份、Windows实际Loader、Android最终安装与受影响设置场景。
- **Not validated**：上方额外覆盖；正式4.0.0版本标记尚未重建，批准后需对实际最终字节作最小复验。
- **Owner Acceptance**：各项已认可视觉保持；整体G1/G2/G3最终确认待负责人。
- **Release Authorization**：未授权。本轮没有main合入、Tag、Release或公开Assets修改。
