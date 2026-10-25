# Soft & Wet 4.0 — Evolution

> 当前顶栏方案与已披露的残余慢帧已获负责人接受，发布前准备继续；偶发卡顿保留为已知限制，根因未定。当前仍为未公开的 `4.0.0-rc.2`，候选身份见[准备清单](evolution/EVO-RELEASE-PREP-2026-10-25.json)。

> 面向玩家的发布草稿，更新2026-10-25。内部候选4.0.0-rc.2已完成TS First、存档P2修复及独立复核；当前受验代码1c0cade、两套CI与制品合同通过，本轮性能尾帧已由负责人接受，拟正式4.0.0，未正式发布。最终验收后再替换正式版本与真实下载入口。

Evolution 继续使用 Soft & Wet 的黑灰 Acrylic 风格，重点改进窗口、焦点和悬浮工具的动态表现，并整理它们在缩放、滚动和快速切换时的行为。

## 本次变化

### 更有力量感的 Floating Hub

金属球体通过加速回旋、表面纹理与运动残影带出工具菜单。球体先响应，菜单留出一段特效时间后展开；关闭时工具与背景一起收束。原有拖动、停靠和快捷工具继续保留。

### 设置与环境材质

上下、左右两种布局共用真实控件和偏好。窗口快速开合，分类内容保持连贯转场；设置窗口接入新的玻璃雨珠、降雨和雪天霜羽效果。天气来自游戏内部，不使用现实天气服务。

设置玻璃还响应血月、异世界、极热与严寒：红色月面和云影、紫色流云、暖热雾与冷雾结晶可与原有雨雪共存。雨中血月保留普通雨滴。设置普通雨珠集中覆盖标题、布局选择和横向分类区，底部渐隐；尺寸、流速和背景折射保留。新模型当前用于设置窗口，其它已适配窗口保留现有天气表现，并修复雨幕动画在ModHub等窗口造成的持续重绘卡顿。雨量、雨滴和材质效果保留。

### 更稳定的导航与窗口

角色窗口的焦点位置适应滚动和缩放。修复窄屏战斗底栏偏移、关闭窗口后的残留背景，以及衣柜离开时的一条失效刷新路径。游戏原有操作、数值和存档业务继续由原游戏处理。

新安装默认显示 Hub、开启动画并平铺全部战斗选项；已有偏好保留。需要聚焦编辑时仍可手动开启。

### 当前 Mod 组合的兼容维护

同步 ModHub、MapleBirch、原版优化和 SmartPhone Alpha 的适用外观包。ModHub 包含管理器和帮助中心等已识别页面；原版优化叠穿列表可显示多件衣物，并沿用原顺序调整与卸下操作。存档、导出／载入和已匹配云存档共用存档管理页头。

修复原版优化部分存档附加日期显示为无效文字的问题。仅在能够确认存档时间时修正显示，正常日期保留；不改存档数据，上游恢复正常后自动让位。

存档操作前增加异常数据检查，避免把无法识别的数据当成空槽。信息无法确认时停止该次操作转发并保留原版入口；正常槽位仍沿原按钮路径处理，不自动改写存档。带有未知扩展内容的行继续保留原生展示与操作。

兼容包按需安装，不包含第三方主 Mod。Cheat Extended 原作者版与独立维护的 rebuild.30 需要二选一。

## 安装与回退

主 UI 与 Framework Host 仍是两个独立包，Host 先加载；对应兼容包放在目标 Mod 和 UI 之后，每个技术名只启用一个版本。无需解压 ZIP。

当前适配基线为 DoL 0.5.12.13，Loader 和其它依赖的最低要求及实测版本见[安装说明](INSTALL_EVOLUTION_CANDIDATE.md)。先备份存档并保留原包；回退时恢复旧包和顺序、重启即可，不需要清空游戏数据。

本次维护代码已转入TypeScript工具链，便于持续检查与维护；玩家不需要安装Node，浏览器与游戏端依赖、存档格式保持原约定。

## 已知限制

- 部分Android环境的复杂天气下仍可能出现偶发慢帧；当前顶栏收敛方案已获接受，不承诺所有设备都持续满帧。
- 未知第三方页面可能保留原外观，未知结构会退让。
- ModHub 所有安装／更新场景的卡顿与闪烁尚未作完全解决的承诺。
- 已修复的衣柜路径不代表全部历史同名异常都已归因。
- 长时间、多 Mod 资源变化仍需持续观察；当前短时结果不作为完整 FPS 或无泄漏证明。
- 物理手机、iOS、所有 WebView、商品和战斗场景未全部覆盖。

当前候选身份与验收状态见[发布关卡](evolution/EVO-RELEASE-GATE-2026-10-24.md)，业务回归见[技术报告](evolution/EVO-PRERELEASE-2026-10-24.md)。最终页面使用最终候选的真实截图与视频；血雨等已停用实验不作为发行宣传。媒体展示在正文，不作为 Assets。下载区只保留实际分发的主 UI、Host、适用兼容包和校验清单，技术报告留在仓库。

作者、贡献者与第三方许可沿用仓库 Credits、LICENSE 和包内 notices；Framework Host 的历史技术名仍为 StoneFreeHost，公共合同保持不变。

## 画面与动态预览

[本轮24秒Android顶栏雨效原速录屏](media/evolution-rain-header/android-settings-rain.mp4)，覆盖双布局、分类、实际控件和开关。它来自与当前CI全部运行成员相同的受验包，只有两份包内说明不同；来源见[媒体记录](media/evolution-rain-header/provenance.json)。

![当前Android设置：上下布局](media/evolution-rain-header/android-horizontal.png)

![实际Android设置：血月环境，普通雨保留](https://raw.githubusercontent.com/102326/DoL-Game-UI/dev/evolution-4.0/docs/media/evolution-rc1-game/android-blood-moon.png)

- [设置与特殊天气原速预览](https://github.com/102326/DoL-Game-UI/blob/dev/evolution-4.0/docs/media/evolution-special-integrated/desktop-1x.mp4)
- [悬浮球与工具原速预览](https://github.com/102326/DoL-Game-UI/blob/dev/evolution-4.0/docs/media/evolution-rc1-hub/desktop-1x.mp4)
- [窄屏设置预览](https://github.com/102326/DoL-Game-UI/blob/dev/evolution-4.0/docs/media/evolution-special-integrated/narrow-1x.mp4)

早期血月截图来自实际测试App；其后三段旧视频为对应真实组件的受控原速演示，不标为自然天气事件或真机录屏。录制早于TS First最终候选，展示的已认可效果继续保留，不冒称本轮CI ZIP的重新录制。原始来源见[RC2媒体记录](evolution/EVO-RC2-VALIDATION-2026-10-24.md)，当前候选证据见[发布关卡](evolution/EVO-RELEASE-GATE-2026-10-24.md)。媒体在正文展示，不放入Assets。
