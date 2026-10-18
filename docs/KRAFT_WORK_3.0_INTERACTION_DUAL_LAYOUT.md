# Kraft Work：全局交互与设置双布局结果

2026-10-18。本轮依据《全局按钮统一与游戏动态交互深化总计划》和《设置界面双布局系统设计与实施补充》完成本地实现与定向验证。保留成熟页面结构。工程范围已完成，视觉效果等待负责人确认，Stable Visual Gate 保持 **Blocked**。

源码仍在 `research/stone-free-3.0-framework`，HEAD 为 `014f469f4092d246cdcd22098fc9b5a943d029b6`，当前成果包含未提交修改。没有创建提交、推送、合并、Tag 或 Release；稳定 2.7、公开 RC 和其它 Mod 源码未改。

## Delivered

| 范围 | 实现与边界 | 状态 |
| --- | --- | --- |
| 侧栏 | 原版及官方入口统一为轻量行。ModHub、BF 入口只做有界样式适配，保留节点、顺序、事件及快捷键。启动页也纳入已知入口规则；未知入口不自动标记。 | 已实现、已验证，待视觉确认 |
| 控件状态 | 协调休止、聚焦、按下、选中及禁用。已识别控件的 pointer 反馈在释放、取消、失焦、页面切换、停用和销毁时清理，不派发业务动作。 | 已实现、已验证，待视觉确认 |
| 属性、社交 | 按实际语义实现分组滚动、导航焦点迁移、目标分组材质反馈。原正文与数值不重建；卡片焦点只改材质。选中提示表示上次请求的分组，不是滚动跟随导航。 | 已实现、已验证，待视觉确认 |
| 特质、成就 | 保留原筛选、折叠、排序及未知内容；增加实际变更后的材质响应、分组目标及卡片焦点反馈。实机覆盖特质展开/收起、成就分类切换并恢复。 | 已实现，代表性覆盖 |
| Floating Hub | 收敛为一个正式融合方案：星簇分组、清楚标签、轻边界和共用工具区。移除正式样式中的 ribbon 分支，研究材料保留。空间交接 B 为默认交接；拖动、停靠、恢复及原入口继续共用既有实现。 | 已实现、已验证，待视觉确认 |
| 设置双布局 | 上下、左右共用同一套分类、控件、回调、预览、Orbit 与页脚。实际节点参与空间重排；连续切换取消旧动画，布局切换不重放输入回调。 | 已实现、已验证，待视觉确认 |
| 高频页面 | 本轮补充安全识别控件的状态与按压反馈，商店、衣柜、战斗 B 的业务与已有动态实现保留。 | 本轮控件检查与历史业务证据组合 |

新安装设置布局默认为上下。私有键 `DoLGameUI.settingsLayout.v1` 保存 `horizontal` 或 `vertical`，不加入 `getPreferences()` 或公共 API。空间不足或字号增大时，左右布局可以暂用上下显示，保存值不变；宽度恢复后恢复左右显示。没有第三种 Auto 选项，也没有第二套设置组件。

公开 UI API v1、Host 协议和游戏业务保持原合同。战斗 B 仍可选，`combatFocused` 默认 false。原版动作底栏和 Widget 不在本轮扩展。

## 侧栏来源核对

依据真实 DOM、加载后的 StoryCaption、Mod 包内容和匹配样式规则，记录在 `tests/artifacts/kraft-work-interaction-dual-20261018/`：

| 入口 | 现场依据 | 处理 |
| --- | --- | --- |
| 作弊 | StoryCaption 中原 `button` 宏调用 `overlayReplace "cheats"`，位于原 `sidebarButtonSplit` | 原节点轻量行 |
| 美化修正 | 当前 StoryCaption 中 `#bfEntryTip` 位于原按钮内，调用 `BF.openPicker()`；该接缝出现在原版优化后的正文中 | 仅该标记的按钮换皮 |
| ModHub | 加载包含 `.modhub-sidebar-entry` 包装及原 `overlayReplace "modloader"` | 包装内原按钮换皮 |
| 界面设置 | 本项目 controller 创建 `#dol-midnight-sidebar-button` | 创建时即标记，修正旧样式优先级及晚挂载遗漏 |

原有灰块来自旧共用规则和未覆盖入口，并非四个按钮具有相同所有权。`CE_Toggle` 的作弊拓展状态按钮是另一项第三方操作，本轮不把它当作原版“作弊”入口接管。

## 评审材料

所有图片和视频均保留原始 Android 截取，以下路径相对项目根目录。视频为受控操作；注入触摸不等于人手物理触控验收。

| 内容 | 材料 |
| --- | --- |
| 侧栏整改前后 | `tests/artifacts/kraft-work-interaction-dual-20261018/before.native.png`；`candidate-v3/accepted-final/sidebar-unified.native.png` |
| 设置上下、左右最终截图 | `candidate-v6/settings-horizontal-final.native.png`；`candidate-v6/settings-vertical-final.native.png` |
| 设置空间重排、预览保留及关闭重开 | `candidate-v3/accepted-final/settings-dual-layout.native.mp4`；同目录 `settings-review.json` |
| 按压、聚焦、选中、禁用演示 | `candidate-v5/control-states.native.mp4`；最终禁用外观 `candidate-v6/control-disabled-final.native.png` |
| 属性内部导航 | `candidate-v4/attributes-internal-navigation.native.mp4` |
| 社交内部导航 | `candidate-v4/social-internal-navigation.native.mp4` |
| 特质折叠与成就分类 | `candidate-v5/traits-fold-expanded.native.png`；`candidate-v4/feats-filtered.native.png`；对应 `controls-review.json`、`characters-review.json` |
| 融合 Hub 完整流程 | `candidate-v4/hub-fused-cycle.native.mp4`；`candidate-v4/hub-fused.native.png`；`candidate-v4/hub-review.json` |

表内以 `candidate-` 开头的路径均位于 `tests/artifacts/kraft-work-interaction-dual-20261018/`。不同迭代不混称同一制品：v3 的布局实现此后未改变；v4 增加卡片焦点样式；v5 增加有界 pointer 反馈；v6 只补主题关闭时设置按钮的禁用外观。v5 与 v6 的 JS 完全相同。最终样式与实际安装身份以 v6 为准。

Hub 原始录屏与早期截图开头出现系统消息通知，仅留本地评审，不适合作为公开宣传素材。无该通知的最终截图为 `candidate-v6/hub-fused-final.native.png`；本轮没有上传原始媒体。

商店、衣柜和可选战斗 B 沿用[上一轮记录](KRAFT_WORK_3.0_GLOBAL_VISUAL.md)中的业务与转场证据，包括 `shop-selection.native.mp4`、`wardrobe-preview.native.mp4` 和 `combat-optional.native.mp4`。这些是历史证据，本轮没有重新购买、穿戴或执行战斗回合，不将它们算作新增业务验收。

## Validated

实机为 M367FC 平板、独立测试 App `com.vrelnir.dol.lyra.uicompat051213`，DoL 0.5.12.13、ModLoader 2.101.1、Host 0.1.4-experimental、Android 17 / WebView Chrome 154.0.8037.58。当前组合含 MapleBirch 5.4.3、ModHub 1.7.0、美化修正 1.0.1、Cheat Extended rebuild.30 和原版优化及既有适配包。

实际验证包括：

- 12 个已识别侧栏入口的背景和边界协调；设置操作与总开关切换后原按钮及已记录事件处理函数保持身份；ModHub 原入口仍打开原管理界面。
- 两种布局、同一预览节点与控件、当前分类及预览状态保持、无额外输入事件、快速切换、关闭重开、150% 字号与 390×844 / 844×390 受控视口。390px 下保留左右选择而暂用上下显示；844px 现场仍可使用左右布局。
- reduced motion、动画关闭及总开关关闭时，受测区域运行中动画为 0，操作仍可完成。
- 属性、社交只改变窗口内滚动，正文和原节点保持；成就分类改变后恢复，特质折叠的可见输入数为 0→1→0。前后金钱与战斗状态不变。
- Hub 空间交接只触发一次原属性入口；原窗口根 transform 为 none，关闭命中正常，关闭后焦点返回 Hub。受控注入拖动可停靠并恢复；关闭工具无残留；两种窄视口下菜单在边界内且不覆盖主球。
- 最终返回卧室，设置关闭，动态装饰和按压标记为 0；原显示偏好、悬浮球配置与位置恢复，测试新增的布局存储恢复为入场不存在状态。测试期间只使用独立测试版的新建临时进度，未读取或修改私人长期存档。

本地使用项目既有工具完成 `framework:check`、Framework build 和打包；运行设置双布局、Orbit、设置工作区、官方 motion、融合 Hub/侧栏、角色导航、社交/面板生命周期、集合展示及原 Framework motion 的定向检查。日志保留于本轮证据目录。没有执行全项目 Release 回归。

## 已发现并处理的问题

1. v2 在关闭设置时出现 ResizeObserver 循环警告，原游戏的 alert 阻塞了 CDP。已把尺寸更新移到下一帧，并保留关闭前的有效测量，不在关闭时改布局；v3 的完整流程及最终 v6 关闭重开通过。原警告截图、失败结果和视频保留。
2. 关闭动画时，开关本体仍有底色与边框过渡。已补齐关闭条件，实机受测区域运行中动画归零。
3. 本机注入触摸能完成点击，但按住期间 CSS `:active` 观察为 false。新增有界 pointer 标记后，实际按住材质改变，释放清除；没有用标记执行业务或伪造结果。此观察不能外推为全部物理 Android 输入的通病。
4. 主题关闭时 Inspector 已真实 disabled，但外观与可用按钮差异不足。v6 补齐独立禁用样式，最终实机 opacity 为 0.4。

测试记录也保留了三类操作脚本问题：误假定 844px 必须回落、误用不存在的 `setEnabled()`、在已有左右布局时再次点左右却期待启动新动画。它们不是 UI 缺陷。对已结束的注入触摸再发 touchCancel 被拒绝，已改为只取消仍活跃的触摸序列。没有通过删除失败记录或反复无变化重跑获得通过。

## 最终本地制品

`tests/artifacts/kraft-work-interaction-dual-20261018/candidate-v6/DoLGameUI-3.0.0-kraft-work-interaction.mod.zip`，216126 字节。

| 对象 | SHA-256 |
| --- | --- |
| ZIP | `40cf867bad541cf52178e92ce0718561a7d4b2f32680a590aac23e73eb765502` |
| index.js | `2f69e772721357806f9ceaa03b48d6e54278dffe83f505a61555732c9d458268` |
| style.css | `07b29d2828a293a504dc94d5d6a80d4ab1bb262eeebc0f7df84081d677fcf472` |

平板加载资源摘要与上述 JS/CSS 相同。Host 保持已安装的 0.1.4-experimental，没有安装本机构建生成的 Host 包。包中的 `3.0.0` 是当前本地候选标识，不代表本轮获准稳定发布。

## Not validated 与 Known limitations

物理手机、人手触控、其它 WebView/DoL 版本、全部第三方组合、全部筛选排序组合，以及真实业务 Loading 场景未在本轮穷举。Busy 样式只响应原控件实际声明，不制造加载状态。Windows 使用 Edge 浏览器受控测试，不称为新增 Windows 真实游戏验收。没有测得有效 FPS，也未开展长期内存或泄漏结论。

未知第三方入口和特殊页面保留原显示，部分内容可能不美化。既有衣柜 Debug 路径异常仍沿用上一轮 Unknown 记录，本轮没有修改或复验其原因。以上覆盖边界不扩展为本轮新增实施任务。

最终 Visual Gate 和负责人验收尚未通过，不能据本轮功能检查宣布 Stable。下一步是负责人查看录屏及实际页面，提出具体视觉反馈。

工具使用经验单独见 [Paisley Park 本轮反馈](KRAFT_WORK_3.0_INTERACTION_PAISLEY_FEEDBACK.md)。
