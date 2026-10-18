# KRAFT WORK：设置滚动、输入遮罩与 Acrylic 整改

2026-10-18。负责人在 16:40 否决首轮材质，首轮制品与证据保留为历史。最新接续见下节。**Visual Acceptance Pending；Stable Visual Gate 继续 Blocked，由负责人判断实际材质是否达标。**没有提交、推送或发布。

本记录接续并补充[上一轮设置记录](KRAFT_WORK_3.0_SETTINGS_SOCIAL_WARDROBE.md)。上一轮冒泡及早点击检查没有覆盖 Android 原生滑动，不能据此认定设置与衣柜之间的输入问题已经全部解决。

## 16:40 复审接续：对齐背景取样层级（当前候选）

负责人的两张新截图确实不同：社交页左上仍能辨认背景头像，首轮设置将头像模糊成了色团。首轮把绘制层放回普通合成层之后，仍然没有复制社交的实际父子关系。

现场读取的社交结构是 `#customOverlayContainer → #customOverlay`，外层 blur(3px)，内层 blur(24px)。首轮设置的 `.dmt-settings-context` 与 `.dmt-settings-material` 则是 body 下的两个兄弟节点。背景取样边界不同，相同滤镜数值不能证明最终效果相同。

先在已安装候选上保持 .38 颜色不变，只把材质移入 context，Android 截图中的头像轮廓随即恢复；随后再对齐社交的 rgba(36,38,42,.74) 及原渐变。探针退出后还原临时改动，正式源码只改这处父子关系及材质底色，不动输入遮罩或业务。过程截图与收据位于 `followup/`。

这与 [CSSWG 滤镜规范草案的 Backdrop Root 描述](https://drafts.csswg.org/filter-effects-2/#BackdropRoot)相符，但本轮判断主要来自当前 Android WebView 的受控结果，不把草案当作所有浏览器完全一致的承诺。嵌套本身不保证更透明；这里是带滤镜的父层改变了子层的取样范围。

### 最新 Android 画面

| 内容 | 证据 |
| --- | --- |
| 同场景社交参考 | [正常截图](../tests/artifacts/kraft-work-settings-p0-20261018/followup/candidate/social-reference.native.png) |
| 设置上下布局 | [正常阅读页截图](../tests/artifacts/kraft-work-settings-p0-20261018/followup/candidate/reading-horizontal.native.png) |
| 设置左右布局 | [正常阅读页截图](../tests/artifacts/kraft-work-settings-p0-20261018/followup/candidate/reading-vertical.native.png) |
| 设置交互 | [原生完整操作录屏](../tests/artifacts/kraft-work-settings-p0-20261018/followup/candidate/settings-complete-flow.native.mp4) |
| 长内容及衣柜阻挡 | [原生滚动录屏](../tests/artifacts/kraft-work-settings-p0-20261018/followup/candidate/wardrobe-settings-native-input-and-scroll.native.mp4) · [收据](../tests/artifacts/kraft-work-settings-p0-20261018/followup/candidate/native-review.json) |

另做一次材质诊断：将设置绘制尺寸临时对齐社交的 x=181.6、y=38、1000×800 CSS px，两边临时隐藏内容，保留真实游戏背景及实际玻璃；再把新材质临时改回兄弟节点作为同颜色负例。结束恢复正常尺寸、全部文字与节点关系。这些诊断图不冒充正式产品布局。

对照：[社交纯材质](../tests/artifacts/kraft-work-settings-p0-20261018/followup/candidate/paint-social.native.png)、[设置纯材质](../tests/artifacts/kraft-work-settings-p0-20261018/followup/candidate/paint-settings.native.png)、[并列层负例](../tests/artifacts/kraft-work-settings-p0-20261018/followup/candidate/paint-negative-siblings.native.png)。[取样收据](../tests/artifacts/kraft-work-settings-p0-20261018/followup/candidate/material-paint-check.json)记录相同几何及实际样式。

只读 PNG 取样中，共同顶部区域 13500 个点的平均 RGB 通道差为新层级 .85、并列负例 1.66；左侧头像区域 3560 个点分别约 3.99、7.62，单位均为 0–255 通道值差。它说明受控画面更接近参考，**不是透明度百分比、像素完全一致或视觉通过分数**。取样范围及完整值保留在 `paint-comparison.json` 与 `paint-comparison-avatar.json`。

### 功能与制品核对

- 继续使用同一平板、App、DoL、Loader 与原 Host；只替换 UI。重新创建临时测试游戏，没有读写私人存档。
- 类型检查、Framework 构建与 players-only 打包通过。`settings-modal-scroll.cjs`、`settings-official-init.cjs` 通过，覆盖嵌套后固定定位、尺寸变化、重建/释放及 modeless 后备层次。其它未受影响检查复用首轮有效结果。
- 新候选 Android 左右/上下设置正文分别滚动约 501.6/502px，底页均保持 0；被覆盖的衣柜分类点击没有触发衣柜。关闭后原分类可操作，玻璃层和滚动锁均清理。
- 完整录屏再次覆盖打开、分类、双布局、原控件切换与恢复、关闭及衣柜操作。正常截图拍摄后设置关闭，偏好逐项与入场相同，布局为 vertical，见 [final-state.json](../tests/artifacts/kraft-work-settings-p0-20261018/followup/candidate/final-state.json)。

[最新本地 UI 候选](../tests/artifacts/kraft-work-settings-p0-20261018/followup/candidate/DoLGameUI-3.0.0-settings-p0.mod.zip)已装到平板，220132 bytes：

| 对象 | SHA-256 |
| --- | --- |
| ZIP | `3bac34a2ecc9389d357716a0ae26869d099c003fcf734963545bbb25e17b5871` |
| index.js | `4bb5c26446f1883ddaa31f1135ebbb078d73f2aab307c21c5b2abf669e8b8746` |
| style.css | `ddc3c04605c5cdd4c4c4f88541830603c88e94a0c19b53d797f0e25c444062d1` |

包内运行成员与 Android 实际加载摘要一致，见 `followup/candidate/artifact-identity.json` 与 `installed.json`。没有推送、合并或发布。未新增其它设备、人工触控或长期性能覆盖。**功能复验通过；新材质等待负责人确认，Visual Gate 不变。**

## 首轮 Android 对照与实录（材质已被否决）

| 内容 | 证据 |
| --- | --- |
| 整改前设置 | [原生截图](../tests/artifacts/kraft-work-settings-p0-20261018/before/settings-before.native.png) |
| 社交页材质参考 | [同设备、同视口社交截图](../tests/artifacts/kraft-work-settings-p0-20261018/candidate-v3/social-reference-clean.native.png) |
| 最终设置上下布局 | [原生截图](../tests/artifacts/kraft-work-settings-p0-20261018/candidate-final/settings-horizontal-clean.native.png) |
| 最终设置左右布局 | [原生截图](../tests/artifacts/kraft-work-settings-p0-20261018/candidate-final/settings-vertical-clean.native.png) |
| 完整设置操作 | [打开、分类、布局、实际控件、关闭及衣柜恢复](../tests/artifacts/kraft-work-settings-p0-20261018/candidate-v3/settings-complete-flow.native.mp4) |
| 长内容滚动与背景阻挡 | [Android 输入录屏](../tests/artifacts/kraft-work-settings-p0-20261018/candidate-v3/wardrobe-settings-native-input-and-scroll.native.mp4) · [收据](../tests/artifacts/kraft-work-settings-p0-20261018/candidate-v3/native-review.json) |
| 焦点推广 | [衣柜与属性导航录屏](../tests/artifacts/kraft-work-settings-p0-20261018/candidate-v3/navigation-orbit-native.native.mp4) |

社交参考与整改后设置均在本轮临时新游戏的衣柜后景、相同视口及相同材质配置下采集。整改前也是同一设备的衣柜，但重载后创建了新的临时游戏，装备及部分页面内容不同，不能作为完全相同像素输入的比较。部分原始截图被系统通知覆盖，保留在本地；交付对照使用另行采集的无通知截图。

录屏来自 Android screenrecord。实际设置操作使用 Action 原生坐标 tap，滑动使用 ADB input swipe；另有导航原节点 web-click。它们是真实设备上的受控输入，不是人工手指舒适度验收。

## Delivered

### 输入与长内容滚动

原现场的 dialog 已处于 `:modal`，但 `overflow:hidden` 且没有正确收缩的内部滚动区。原生向上滑动后，设置 `scrollTop` 仍为 0，底下衣柜所在页面 `scrollY` 从 0 变成约 502.8px，见 `before/native-before.json`。这次证实了真实滚动链问题，不能用此前的冒泡检查代替。

现在外层 dialog 覆盖完整视口，承担模态命中、焦点和关闭；内部 `.dmt-settings-shell` 承担窗口布局。标题、布局选择和状态栏保留，正文以 `min-height:0`、独立纵向滚动和 overscroll containment 承载长内容。设置打开期间锁住底页滚动，关闭、外部 close、节点重建和销毁时释放。内部控件事件边界继续保留。

最终 Android 双布局结果：

| 布局 | 设置正文滚动 | 底页滚动 | 结果 |
| --- | --- | --- | --- |
| 左右 | 0 → 501.2px | 0 → 0 | Passed |
| 上下 | 0 → 500px | 0 → 0 | Passed |

在被设置覆盖的衣柜脚部分类坐标派发一次原生点击后，衣柜仍选中 head，衣柜点击观察计数为 0。关闭后原生点击衣柜分类正常；设置玻璃层数量为 0，页面滚动锁已解除。实际舒适阅读开关 true→false，另一次完整录屏通过原控件恢复为 true，结束偏好与入场逐项一致。

### 实际材质渲染链

入场计算样式没有显示标题另铺了一块不透明灰色：标题本身透明。实际有色玻璃位于 native dialog 根，使用约 .48 黑灰背景及 blur(24px) saturate(.9)，其 `::backdrop` 另有深色覆盖、blur(3px) 和 contrast(.94)。社交则在普通页面合成层的 `#customOverlay` 取景。两条链不同，不能因变量名共享就宣布最终画面统一。

本轮先验证内部透明壳体，随后对照真实 Android 截图，改为将玻璃绘制层放在普通游戏合成层中；语义 dialog 继续处于 top layer，专门保护输入。没有克隆游戏或第三方业务 DOM。

最终计算样式与伪元素记录见 [final-review.json](../tests/artifacts/kraft-work-settings-p0-20261018/candidate-v3/final-review.json)：

| 实际节点 | 材质职责 |
| --- | --- |
| 全屏 dialog、内部 shell、标题、布局栏、正文、分类栏 | 透明；无额外背景滤镜；实际控件保持可交互 |
| dialog `::backdrop` | 透明，无背景滤镜，避免重复压暗 |
| `.dmt-settings-context` | 普通合成层的背景退让，透明 + blur(3px)，不接收输入 |
| `.dmt-settings-material` | 单个窗口玻璃面，黑灰 rgba(29,31,35,.38) + 微弱纵向渐变、blur(24px)，不接收输入 |
| 实时预览 | 局部 .52 深色承载，无第二次 backdrop blur，保留阅读对比 |
| 底部状态栏 | 极弱渐变，不额外铺实底 |

根和 shell 的 `::before/::after` 没有额外绘制内容；标题保留既有非交互装饰。窗口 opacity 稳定态为 1，没有通过降低全部文字和控件透明度制造透感，没有增大模糊半径或提高亮度。

外置材质跟随真实 shell 的位置与尺寸，双布局共用一层。定向检查发现旧 Eyes 入场规则仍会让全屏 dialog 平移 6px，导致材质抓取错误起点；已删除该旧根动画，保留非交互材质展开、内容空间转场和 Orbit。最终 Android 材质与壳体 x/y 差均为 0。关闭玻璃仍使用实底；不支持 native dialog 的 modeless 后备控件位于材质层之上。

这些是实现及实际画面证据，不构成负责人视觉批准。

### 环绕焦点推广

复用私有 `OrbitFocus.vue`，从已有设置/社交推广到属性导航、衣柜分类和战斗分组。原按钮身份、原 go/选择逻辑与命中区域保留；原导航拒绝时不移动选中。清除旧的重复导航飞行效果，保留原生商店分类自己的表现。

平板三次衣柜分类与一次属性分组检查，轮廓与目标的位置/尺寸偏差最大约 .4px，装饰层 `pointer-events:none`。战斗的挂载、原控件、减少动态与释放通过定向夹具；本轮没有进入真实战斗或执行回合。战斗 B 仍是可选且默认关闭，没有恢复衣柜浏览模式。

## Validated

- 设备 M367FC / Android 17 / WebView 154.0.8037.58；独立 App `com.vrelnir.dol.lyra.uicompat051213`，DoL 0.5.12.13 / ModLoader 2.101.1 / 原 Host 0.1.4-experimental。
- 使用已安装 Paisley Park 6.1.0 White Snake：ExecutionContext 绑定当前 WebView、DOM/CSS 与计算样式、Action、ADB 截图/录屏/滑动。Action 没有 swipe，本次在确认前台与 WebView 原生边界后直接使用 ADB。未清理或绕过 GER 历史记录，未使用 Gameplay。
- `npm run framework:check`、Framework 构建、players-only 打包通过。没有运行会清除历史 dist 的普通 build；新生成的 Host 没有安装。
- 新 `settings-modal-scroll.cjs`：全屏遮罩、双布局内部滚动及底页静止、关闭后恢复、外部点击、尺寸变化后材质对齐、dialog 被移除后的重建清理、销毁，以及 modeless 后备控件与材质层次。
- `settings-input-boundary.cjs`、`settings-dual.cjs`、`settings-orbit.cjs`、`settings-official-init.cjs`：实际鼠标/键盘、偏好/预览、双布局/快速中断、窄/横屏、减少动态/关闭动态/总开关、关闭重开及清理。
- `selection-motion.cjs`、`characteristics-framework.cjs`、`combat-stone-free.cjs`：原来源回调、挂载、角色映射及组件释放的受影响范围检查。
- `git diff --check` 通过。既有未提交工作与历史证据保留，没有提交或远端操作。

中间候选 v2 的材质对齐断言失败，等待后仍偏移 6px，保留失败结果。查明旧根入场动画后修正，没有放宽断言或重复跑到绿色。其余工具调用中有一次本地制品路径写错，在读取 ZIP 阶段停止，尚未安装；纠正为实际构建输出路径。没有据此登记 Paisley 实现缺陷。

## 最终制品及证据复用

分支 `research/stone-free-3.0-framework`，HEAD 保持 `014f469f4092d246cdcd22098fc9b5a943d029b6`。本轮只改自有设置展示与导航动效，不改 Host、公共协议、原游戏业务或其它 Mod。

[最终本地 UI 候选](../tests/artifacts/kraft-work-settings-p0-20261018/candidate-final/DoLGameUI-3.0.0-settings-p0.mod.zip)，220133 bytes：

| 对象 | SHA-256 |
| --- | --- |
| ZIP | `947d418ee4bbd68e18f03af482b31412ed406572caf08263a9c91ffbc9ad4f6a` |
| index.js | `b4929bee59e0ef5bf1cfb14aaa0d2cc660710b64c8ba725127efc4d35c08eee1` |
| style.css | `fa1510e52f69bd84bcf506bc8a3ef639b0eb603789f3489b3425296739519a2b` |

最终包与 v3 的 JS 及其它成员相同，CSS 唯一差异为 modeless 后备 dialog 的 z-index 10001→10002，native modal 的匹配规则不变，见 [制品逐成员对照](../tests/artifacts/kraft-work-settings-p0-20261018/candidate-final/artifact-comparison.json)。因此复用 v3 的完整 Android 操作/滚动/导航录屏；最终包另做实际安装、加载成员摘要、双布局及退出清理检查，见 [最终安装](../tests/artifacts/kraft-work-settings-p0-20261018/candidate-final/installed.json) 与 [smoke](../tests/artifacts/kraft-work-settings-p0-20261018/candidate-final/final-smoke.json)。

测试只使用临时新游戏，没有读取、保存或覆盖私人长期存档。结束停在衣柜，偏好与入场一致，设置布局恢复 vertical，设置关闭且无自有玻璃残留。

## Not validated / Known limitations

没有重新覆盖其它设备、DoL/Mod 组合、真实战斗、长期性能和人工手指操作。此前穿透反馈的所有业务副作用未完整复现；本轮证实并修正滚动链，同时用被覆盖的衣柜分类坐标验证阻挡，不将它扩写成所有第三方全局捕获监听的保证。

玻璃与背景的最终协调性仍由负责人判断。**Implementation Done / Functional Validation Passed（本轮代表性范围）/ Visual Acceptance Pending。Stable Visual Gate 保持 Blocked。**


## 2026-10-18：嵌套材质保留与导航完整效果推广（最新接续）

### Delivered

保留负责人认可方向的父子 Acrylic 取样结构：`.dmt-settings-context` 包含 `.dmt-settings-material`，真实设置控件继续在全屏 modal dialog 内。此次没有重新调整材质底色、透明度或模糊半径。

- 侧栏原生入口及设置、属性、社交的分类按钮统一黑灰材质、柔和边界、选中表面、按下反馈；保留真实选择状态，Orbit 根据实际目标位置迁移。原生 split 容器的按钮不再依赖各自 offsetParent 计算位置。
- 原生顶部“社交／特征／特质／成就”等按钮使用独立的较弱边框和短波浪，不使用下方分类的持续 Orbit。统计页实测的“额外统计 (包含剧透)／模组统计”已纳入同一受限装饰范围。未知第三方顶栏不会按任意文本自动接管。
- 游戏原生面板顶栏增加局部细雨。按负责人后续反馈，最终为约 22° 倾斜、前后景 .65s / 1.05s 的循环落雨；区域跟随原标题尺寸，装饰不接收输入。关闭动效／高光或系统减少动态时停用，面板离场、总开关与释放时清理。
- 衣柜顶部“关上衣柜”原链接同步材质、圆角与按下反馈；保持同一节点、原事件和原快捷键，没有永久选中态。商店、衣柜的衣物选中效果及原有波纹没有修改，没有恢复浏览模式。

主要落点：`framework/official-ui/navigation.ts`、`motion.ts`、`src/theme/navigation-material.css`、四处自有导航模板及 `src/ui/OrbitFocus.vue`。没有新增依赖、修改公共 Host/API 或游戏业务。

### Validated

本轮使用已安装 Paisley Park 6.1.0，目标仍为 M367FC / Android 17 / WebView 154 / 独立 DoL 0.5.12.13 测试版，原 Host 0.1.4 保留。使用临时新游戏，没有读写私人长期存档或 GER。

- 类型检查、Framework 构建与 players-only 打包通过；未运行清除历史 dist 的普通 build，未安装新生成的 Host。
- `official-game-motion.cjs` 扩展为用现有 Vite/Vue 编译真实组件，验证原节点、单次回调、未知入口排除、顶部不挂 Orbit、波浪实际渲染、多个已知顶栏、雨层输入透传、减少动态／总开关／释放及原衣柜出口。原 raw esbuild 不支持新引入的 Vue 组件，已更正测试编译方式，原断言保留。
- `settings-orbit`、`settings-modal-scroll`、`settings-input-boundary`、`settings-dual`、`selection-motion` 定向检查通过。输入测试新增实际鼠标拖动滑块、同一预览节点移入／放回、原生 select 键盘路径；另检查快速切换、预览、模态边界、布局、减少动态及清理。
- Android 属性／社交导航保留原内容节点，分组滚动和选中成立；属性“生活技能”实测滚动约 738.8px。特质／成就保留跳转 select 和一次性操作，成就分组滚动约 579.2px。特质当前内容很短，跳转后 scrollTop=0 是该现场结果，不作为长内容滚动证明。侧栏 split 内轮廓偏差小于 .2px。
- Android 设置双布局、实际滑块拖动、开关、预览提取与放回、原生下拉显示、Hub 被 modal 屏蔽、快速关闭重开与清理取得新实录。底页衣柜阻挡／双布局原生滚动复用前次有效证据；本轮没有更改相关输入／材质实现。
- 衣柜出口的真实 A 节点高度 44px，命中正常；一次点击只收到一次原事件，返回 Bedroom，原操作后无按下残留。随后返回衣柜。
- 最后仅加快并倾斜雨效，ZIP 逐成员对照确认只有 CSS 改变、JS 相同。因此复用前一步的业务和设置检查；最终包另安装、核验加载成员摘要、实际录制快斜雨，并核对原偏好、Floating 配置和 vertical 布局均恢复，设置关闭、无临时绘制层残留。

关键证据（均为工具控制，不是人工手指验收）：

- [属性／特质／成就导航及原内容结果](../tests/artifacts/kraft-work-navigation-20261018/candidate/navigation-resumed-results.json)
- [设置操作视频，系统下拉处停止](../tests/artifacts/kraft-work-navigation-20261018/candidate/final-rain-wave-settings.native.mp4)；[收起下拉与快速开关接续视频](../tests/artifacts/kraft-work-navigation-20261018/candidate/settings-resume-cleanup.native.mp4)
- [衣柜原生关闭按钮截图](../tests/artifacts/kraft-work-navigation-20261018/final-wardrobe/wardrobe-close-final.native.png)；[原关闭结果](../tests/artifacts/kraft-work-navigation-20261018/final-wardrobe/wardrobe-close-validation.json)
- [最终快斜雨录屏](../tests/artifacts/kraft-work-navigation-20261018/final-rain/rain-fast-angled.native.mp4)；[最终现场与恢复](../tests/artifacts/kraft-work-navigation-20261018/final-rain/final-smoke.json)

### 失败、工具反馈及边界

初始导航夹具的对齐失败源于未加载 Orbit 的实际样式，并非放宽对齐阈值；补齐真实依赖后通过。新雨层的减少动态断言曾失败，发现显示规则优先级覆盖了 reduced-motion，已修正并保留该断言。

一次关闭命中检查未通过，未取得失败瞬间的完整 hit stack，原因 Unknown；没有强制点击。另一次工具停止后确认前台已转到系统图片编辑器，等待负责人返回，不记作工具或 UI 缺陷。

另有一项明确、可复用的 Paisley 反馈：原生 select 展开后，focused window 显示匿名 `PopupWindow:...`，Action 要求焦点字符串包含 package/activity，因此拒绝 back，报 `Target app is not foreground`。独立核对 resumed App、focused window 的 owner UID=10331 和 package 均属于授权测试 App 后，只用一次直接 ADB Back 收起该菜单，没有选择衣柜回退项。完整[归属与恢复收据](../tests/artifacts/kraft-work-navigation-20261018/candidate/owned-popup-action-refusal.json)保留。建议工具讨论受归属证明约束的匿名子窗口识别，不建议取消前台保护；本项目未修改工具包。原生下拉弹层的系统外观保留。

### 最终本地身份与完成边界

分支仍为 `research/stone-free-3.0-framework`，HEAD 仍为 `014f469f4092d246cdcd22098fc9b5a943d029b6`，成果在工作区，未提交、推送、合并或发布，既有工作和历史制品均保留。

最终 UI：222656 bytes；ZIP SHA-256 `b96abbe51765d556ddf6ab989127f2c19b3aff4b4b34819569aa65026727b6ba`。

- JS：`a3dbbb87715e481bd307de26459b81cc04341edf0c2b31ead3d245aed40bb889`
- CSS：`422a2d3bf0910ade4773cb04a465a714b00c23eb18c4889ebb8ac9c5698b9a7f`
- [完整收据](../tests/artifacts/kraft-work-navigation-20261018/final-rain/receipt.json)

**Implementation Done / Functional Validation Passed（上述代表性范围）/ Visual Acceptance Pending。Stable Visual Gate 继续 Blocked。** 没有新增全设备、其它 DoL／Mod 组合、长时间性能或人工物理触控验收；这些不冒充本轮已测范围。未知第三方事件与所有原生系统弹层也不作全覆盖承诺。


## 顶级按钮无框、雨丝层次与衣柜操作对齐（2026-10-18，最新接续）

负责人继续要求顶级按钮只在选中时显示轻框，雨效更自然，以及衣柜关闭和整理操作的位置、尺寸一致。本轮限于这些显示与布局改动。

**Delivered**：顶级未选中项的背景与边框透明，选中项保留约 14% 强度的柔和边框；键盘焦点提示与短波浪仍保留。测试还发现边框颜色过渡会在首次装饰时短暂带出原黑边，已从顶级按钮的过渡属性中移除，避免未选中时出现过渡边框。

雨效改用两张小型自有 SVG：长短、粗细不等的渐隐尾迹，近处带细小水滴亮点，远处更细弱；前后层角度约 24° / 20°、周期 .7s / 1.35s。纹理尺寸与循环位移匹配，保留无缝移动及不接收输入。现有 Vite 将 SVG 内联到 CSS，安装包没有遗漏外部纹理依赖。是否足够真实仍由负责人看动态画面判断。

衣柜原入口中保留的两处 br 在新版 `.dgw-exits` 投影内不再占据换行空间，原节点和事件保持；退出新版布局后该样式不匹配原入口。关闭、整理按钮统一字号、行高、内边距及至少 44px 高度，整理按钮接入同一动作样式，不增加永久选中态。衣物选中、波纹、穿戴和存档业务没有改动。

**Validated**：类型检查、Framework 构建、players-only 打包与 `official-game-motion.cjs` 通过。该测试新增原换行导致的对齐、受控 390px/844px 窗口与放大字号、未选中含 hover 无框、选中轻框检查；原单次事件、原节点、减少动态和清理断言保留。两张 SVG 的 XML 解析及最终 CSS 内联检查通过。

平板仍为 M367FC / Android 17 / WebView 154 / 独立 DoL 0.5.12.13，原 Host 0.1.4 不变。实际关闭与整理按钮的 top 均为 98.85px、高度均为 44px、字体均为 500 15px / 21.75px、padding 均为 9px 12px；整理模式切换后同样对齐，中心命中均正确。关闭只触发一次原事件并返回 Bedroom。统计页切换前后仅 tab-selected 项有轻框，雨层不拦截输入，关闭动效后隐藏。最终返回衣柜，原偏好、Floating 配置及设置布局恢复，无临时绘制层残留。

- [本轮 Android 实录](../tests/artifacts/kraft-work-header-rain-20261018/candidate/header-rain-alignment.native.mp4)
- [衣柜对齐截图](../tests/artifacts/kraft-work-header-rain-20261018/candidate/wardrobe-aligned.native.png)
- [顶级选中轻框与雨丝](../tests/artifacts/kraft-work-header-rain-20261018/candidate/top-selected-only.native.png)
- [现场数值和恢复结果](../tests/artifacts/kraft-work-header-rain-20261018/candidate/validation.json)
- [安装身份与核验收据](../tests/artifacts/kraft-work-header-rain-20261018/candidate/receipt.json)

最终本地 UI ZIP：223186 bytes，SHA-256 `8b17f169cb7453994ea31c2bb3373bdbd8b173c3be227ac3653fe117f40c0f9f`。实际加载 JS `bdfc087dab64e0b29cf3dce46eb7770279e5606e91b0c687c67e32cdf44def69`，CSS `6f792c7bb9d10425b06a8b34c516c511f00401ee4e1d4e9dd616d9016584d922`。

**Not validated / Known limitations**：本轮没有补做物理手机、其它 Mod 组合或长期性能；受控窗口不是物理触控。设置父子 Acrylic、原输入隔离及衣物反馈未改，复用此前有效检查，不重复全量验证。视觉验收仍待负责人，Stable Visual Gate 保持 Blocked。未提交、推送或发布，历史候选保留。

## 作弊页与原版选项页同步（2026-10-18，最新）

**Delivered**：按负责人授权，将原版作弊／选项弹窗纳入当前视觉体系。作弊的状态、外观、NPC、传送、其它、模组作弊，以及选项的通用、主题、性能、高级、信息、原版优化、模组设置，复用顶级未选中无框、选中轻框、短波浪及局部雨效。实际原版优化按钮包有 `span#doloptimizationModTab`，仅补齐此已确认结构；未知第三方包装不猜测接管。

正文使用黑灰通透承载，原输入框、下拉、按钮及数字步进器同步材质，原复选／单选按真实 checked 状态提供轻度色彩。普通操作仅有按下反馈，不增加永久选中态。原控件节点、事件、状态与步进器尺寸、长按业务保持，未新增代理业务。设置父子 Acrylic、衣物选中与波纹、衣柜出口对齐不变。

**Validated**：`framework:check`、Framework 构建、players-only 打包、`official-game-motion.cjs`、`panels-framework.cjs` 及 `git diff --check` 通过。新增定向测试覆盖已知顶栏、已知包装、未知入口保留、原 checkbox/input/stepper 回调、原节点保留、受控 390px/1363px 溢出和动效清理；受控尺寸不代表物理手机。

平板 M367FC / Android 17 / WebView 154 / 独立 DoL 0.5.12.13 上，6/7 个原页签均匹配新样式；依次查看作弊外观、其它、模组作弊与选项主题、性能、原版优化、模组设置。数字步进器中心命中正确；关闭作弊增强后原内容与步进器节点仍在，雨层移除。原版华氏温度开关切换一次，收到一次原 change，游戏 `options.fahrenheit` 对应改变，原节点保持，随后恢复；选项正文可向下滚动且未横向溢出。没有执行作弊、传送、控制台、重置或保存默认选项。

现场脚本最后错误地进入衣柜，却断言恢复到入场 Bedroom，因此退出码为 1；此前按顺序的产品、钱款和偏好断言已通过，但临时汇总未写出。不将这次运行描述为全脚本通过，也不重跑整套以取得绿色。保留原脚本及录屏，单独用原生关闭衣柜入口恢复 Bedroom，补查原偏好、Floating 配置、horizontal 布局、华氏 false、money 500 和零临时层残留通过。

- [作弊页截图](../tests/artifacts/kraft-work-forms-20261018/candidate/cheats-status.native.png)
- [原版选项页截图](../tests/artifacts/kraft-work-forms-20261018/candidate/options-general.native.png)
- [Android 操作实录](../tests/artifacts/kraft-work-forms-20261018/candidate/cheats-options-native.native.mp4)
- [恢复与失败记录](../tests/artifacts/kraft-work-forms-20261018/candidate/restored.json)
- [制品、命令及覆盖收据](../tests/artifacts/kraft-work-forms-20261018/candidate/receipt.json)

本地 UI ZIP 223978 bytes，SHA-256 `be1d643cda631c6b25f00a9488ba957dafc21cf89d3745e3f44cab4e9a1a5755`；实际加载 JS `5f01b8eb98bbe87c114023bd818567cfefdba129bd5d9304c93d4e2a21cdb1e0`，CSS `ecbed1e15cb0ddc521dcf02a2137bd4cf646b74c3d6b434cb36267bdd8da002b`。已安装到独立测试版，原 Host 0.1.4 未替换。

**Implementation Done / 代表性功能验证完成 / Visual Acceptance Pending。** 本轮没有物理手机、人工手指、长期性能或全社区组合验收；未验证实际作弊业务，不据此承诺全部作弊功能。复用原设置输入隔离与衣物交互有效证据，未重复无关验证。Stable Visual Gate 仍待负责人，未提交、推送、合并或发布。

## 天气响应式窗口顶栏：视觉收尾项（2026-10-18，最新）

本节替代前面“所有顶栏持续下雨”的表现规则，既有材质、按钮及衣物反馈保留。范围为已纳入官方 UI 的原生主窗口和自有设置双布局，不接管未知第三方窗口；第三方兼容包后续另行同步，不阻塞本轮。

### Delivered

`framework/official-ui/weather.ts` 只读 DoL 的 `Weather` 公共状态，给已确认顶栏提供共享装饰。晴／少云为薄暖光，夜间改为冷淡光；阴天为较平静的冷灰变化；雨天为两层低强度慢雨痕；雪天为稀疏漂浮亮点；雷电或暴风雨为雨痕配低频冷光；无降水且雾量至少 .45 时采用低对比扩散。雪优先于雷暴；晴阴判断使用真实名称及云量。缺失、未知或 getter 抛错时不画天气，不推断现实天气或第三方私有状态。

共享实现接入属性、社交、特质、成就、日志、统计、原版选项、作弊及自有设置窗口。窗口自身仍使用原来的黑灰 Acrylic；天气节点不加 backdrop/filter，不改变父子合成结构或实际控件。装饰仅覆盖标题区域，`aria-hidden`、`pointer-events:none`，不新增业务操作、公共 API 或偏好。

CSS 使用最多两个伪元素绘制每个可见顶栏；可见原生窗口与设置最多各一层。一个共享 2 秒读取定时器只在自有顶栏可见、文档在前台时运行，窗口关闭、总开关关闭和消费者退出时清理。减少动态或关闭动画时保留静态纹理，不播放动画；关闭光影时降低装饰强度。没有新增加载条或系统提示样式。

### Validated

- `npm run framework:check`、Framework 构建及 players-only 打包通过。
- `node tests/header-weather.cjs`：实际绘制的六类差异、夜间、未知／异常 getter、中性回退、原状态不变、原按钮命中、壳体合成参数不变、静态降级、原生／设置共用、受控尺寸对齐、窗口内天气更新、关闭停止读取及销毁清理通过。
- `node tests/official-game-motion.cjs`：原导航、单次事件、原命中区域、表单、快速开关与清理通过。
- `node tests/settings-modal-scroll.cjs`：使用构建后的实际设置，双布局滚动、全视口输入遮罩、底页阻挡及关闭恢复通过。旧 Android 原生滑动／点击隔离证据仍适用，本轮没有重写输入合同。

M367FC 平板 / Android 17 / WebView 154 / 独立 DoL 0.5.12.13 / 原 Host 0.1.4-experimental：先观察自然天气，再用原游戏 `Weather.set`、`Weather.setTemperature`、`Weather.FogGeneration.setFog` 在未保存的新测试进度临时准备天气，读取原天气结果与顶栏状态。晴、阴、雨、雪、雷暴、雾取得实机画面；属性、特质、成就、日志及选项在雾态共用映射，设置上下／左右在雨态共用映射且关闭按钮命中正确。天气变量对象、临时温度字段、偏好及布局均恢复，原对象身份保留，无存档写入。实际各天气为受控测试状态，不表述为自然游玩遇到六种天气。

- [晴天截图](../tests/artifacts/kraft-work-weather-20261018/candidate/clear-social.native.png)／[阴天](../tests/artifacts/kraft-work-weather-20261018/candidate/cloud-social.native.png)
- [雨天](../tests/artifacts/kraft-work-weather-20261018/candidate/rain-social.native.png)／[雪天](../tests/artifacts/kraft-work-weather-20261018/candidate/snow-social.native.png)／[雷暴](../tests/artifacts/kraft-work-weather-20261018/candidate/storm-social.native.png)／[雾](../tests/artifacts/kraft-work-weather-20261018/candidate/fog-social.native.png)
- [设置上下布局](../tests/artifacts/kraft-work-weather-20261018/candidate/settings-上下.native.png)／[左右布局](../tests/artifacts/kraft-work-weather-20261018/candidate/settings-左右.native.png)
- [天气切换与设置 Android 实录](../tests/artifacts/kraft-work-weather-20261018/candidate/weather-headers.native.mp4)／[现场数据与恢复](../tests/artifacts/kraft-work-weather-20261018/candidate/validation.json)

最终另补“无窗口或文档隐藏时不读取 getter”的短路，修复关闭窗口时已排队的一次多余读取。最终 ZIP 与上述实机包只有 index.js 不同，CSS 逐字节相同，六种可见天气绘制复用同一证据，不重跑整套。最终包重新安装后，另核验自然天气在社交和设置一致、实际关闭、原偏好／布局／天气不变及零残留，见[最终短录屏](../tests/artifacts/kraft-work-weather-20261018/final/final-natural-headers.native.mp4)、[最终核验](../tests/artifacts/kraft-work-weather-20261018/final/validation.json)及[成员对照](../tests/artifacts/kraft-work-weather-20261018/final/content-comparison.json)。部署会重新建立未保存的新测试进度，不涉及长期存档。

### 保留的失败与工具经验

首次静态测试发现减少动态规则被高优先级播放规则覆盖，修正优先级后通过。后一次发现窗口已关闭但排队刷新仍读取一次天气，增加空集合／文档隐藏短路后通过；未靠重复运行掩盖。

首次 Android 脚本把安装前阴天写为固定期望，但安装重启后的自然天气为少云；脚本停下，没有继续准备天气。其最后恢复断言又因未关闭社交窗口失败，随后使用原关闭入口恢复。第二次中晴阴已通过，但把大雨误当作无雷电雨：实读 `heavyPrecipitation.lightningFrequency=0.1`、`Weather.enableLightning=true`，顶栏按合同正确进入雷暴。原失败、已取得晴阴画面和完整恢复均保留在 `failed-initial`、`failed-rain-assumption`。改用原版轻雨准备普通雨，再完成其余天气和窗口；不是将错误结果放宽成通过。

本轮使用已安装 Paisley Park 6.1.0 White Snake 的绑定、Action 点击和 Workshop 路径，直接 CDP 只读现场及执行已授权测试天气准备，ADB 截图／录屏提供实机画面。没有调用 GER、Full Evidence、Perfetto 或 bugreport，未改共享 Store、工具源码或 Skill。未遇到明确工具实现缺陷；原天气含雷电是项目接入知识，不能塞成通用 Skill 的 DoL 私有字段规则。

### 最终身份与收尾边界

最终 UI ZIP 225104 bytes，SHA-256 `e0026114f276da110ada96895f38f54e49219d8ccc19933212d3e408657675f9`；实际加载 JS `f71efb50da04c2594329ccecdbd7a17919dec292988baa5f7fa91b4b106d2af6`，CSS `c5fceca1a8d82aa3990010be4106b47fd0373978c49184f7049c38fe688d2eb3`。只安装 UI，原 Host 保留。

**Implementation Done / 代表性功能验证通过 / Visual Acceptance Pending。** 负责人已认可其它官方主界面基本方向，本轮完成后技术上可进入主视觉收尾；天气最终观感仍待负责人确认，不自行宣布 Visual Gate Passed。未覆盖物理手机、所有 DoL 版本、长期性能及第三方窗口，受控浏览器尺寸不等于人工触控。兼容包后续更新不在本次执行范围。稳定版 2.7、其它 Mod 工作区及历史证据保留；未提交、推送、合并、Tag 或发布。

## 天气表现力强化、雨量分档与侧栏圆角（2026-10-18，最新）

本节承接负责人对“天气太浅”的否决及两次速度／尺寸追加意见；保留前轮天气来源、黑灰 Acrylic 和窗口布局。实现与功能检查完成，**Visual Gate 仍为 Blocked，等待负责人确认本轮动态效果**。第三方页面、商店商品、衣柜预览与战斗区不扩展天气覆盖。

### 已交付与实际映射

| 原游戏状态 | 顶栏形态与运动 |
| --- | --- |
| clear／lightClouds，无降水 | 移动暖光斑、斜向玻璃反射、慢云影；夜间用冷光替换日照色 |
| heavyClouds 或 overcast > .5，无明显雾及降水 | 前后不同节奏的冷灰云影 |
| precipitation=rain，未启用雷电 | 远细雨、中层雨丝、近玻璃水滴和长水痕，三种速度 |
| precipitation=snow | 两套大小、速度与漂移方向不同的雪粒，近层含小冰晶形态 |
| precipitation=rain 且 enableLightning=true，或 storm／thunderstorm | 雨层加宽范围的顶栏冷光反射，18 秒周期内有一组主反光及较弱回光；不闪全屏 |
| 无降水，fog >= .45 | 前后两条不同速度、反向横移的雾带 |
| 未知、缺失或 getter 异常 | 中性窗口，不绘制推测天气 |

雨量只读原 `Weather.precipitationIntensity`。DoL 实读小雨为 1.3，大雨为 1.6，storm 为 2，thunderstorm 为 3.5。小于 1.5 使用小雨档，1.5 至小于 2 使用大雨档，至少 2 使用强雨档；缺失／异常数值保持普通档，不根据 Mod 私有状态猜测。大雨自身可能启用雷电，仍按原雷电状态显示反光。

按负责人最后要求，各档远雨、中雨、近水滴的纹理均再放大 **25%**、周期减半。因此实际下落距离／时间约为追加前的 **2.5 倍**，没有缩放窗口或命中区域。大雨和强雨各增加一套错相中层雨丝，以同时呈现更大和更密的雨点。原有淡出／淡入保留。

| 雨量档 | 追加前中层纹理／周期 | 最新纹理／周期 |
| --- | --- | --- |
| 小雨 | 360×154px / .72s | 450×192.5px / .36s |
| 大雨 | 480×206px / .58s | 600×257.5px / .29s，双纹理 |
| 强雨 | 570×244px / .46s | 712.5×305px / .23s，双纹理 |

侧栏原来被 `kraft-work-motion.css` 的 `border-radius:0!important` 覆盖，实机计算圆角确实为 0。现修正该规则，已审查侧栏入口使用胶囊圆角，旧直角底线与直线选中阴影改为柔和轮廓。`OrbitFocus` 从真实按钮读取并约束圆角，SVG 随按钮形状移动；其它页面原本 11px 的按钮保持自身圆角，不把所有控件强制胶囊化。平板已测普通入口高度 44px、圆角 999px、选中 SVG 实际 rx 约 22px。

天气变化时使用同一个装饰节点：旧绘制 180ms 退场，再按最新真实状态建立 480ms 入场；重复变化按代次取消旧完成回调。没有同时保留两套完整粒子系统，不替换标题、导航或关闭节点。减少动态／关闭动画时显示静态天气；关闭窗口、总开关及卸载时取消过渡和读取。Acrylic 的父子关系、blur 与壳体 opacity 不变。

### 录屏与定向验证

环境仍为 M367FC 平板 / Android 17 / WebView 154 / 独立 DoL 0.5.12.13，原 Host 0.1.4-experimental 保留。天气通过原游戏公开接口在未保存的测试进度中临时准备；每轮恢复原 weatherObj 身份／内容、临时温度字段、偏好与布局，没有保存或修改长期存档。以下为工具控制的真实 Android 画面，不称人工手指验证。

- [强化前轻雨／社交，22 秒](../tests/artifacts/kraft-work-weather-expressive-20261018/before/rain-sample.native.mp4)
- [首个三层雨样板，22 秒](../tests/artifacts/kraft-work-weather-expressive-20261018/rain/rain-sample.native.mp4)：开窗、雨滴水痕、分类、关闭重开；样板画面可辨认后继续深化其它天气，未替负责人作最终视觉判定。
- [最新雨量／大小／急速雨点与雷电，27 秒](../tests/artifacts/kraft-work-weather-expressive-20261018/rain-fast/rain-amount-and-lightning.native.mp4)：小雨、大雨、雷暴，静态退化和关闭检查。
- [其它天气与真实状态转场，29 秒](../tests/artifacts/kraft-work-weather-expressive-20261018/final/weather-languages.native.mp4)：晴、阴、雪、雾和雷暴。该阶段后仅再调整雨量分档、雨速、雨点大小及雷暴反光，其余天气绘制复用此证据。
- [跨窗口及设置双布局，26 秒](../tests/artifacts/kraft-work-weather-expressive-20261018/final/owned-windows-and-round-sidebar.native.mp4)：属性、日志、特质、成就、统计、设置双布局、真实分类点击与动画关闭。
- [跨窗口数据与侧栏圆角](../tests/artifacts/kraft-work-weather-expressive-20261018/final/validation.json)，[最终雨量与恢复数据](../tests/artifacts/kraft-work-weather-expressive-20261018/rain-fast/validation.json)。

前后雨天使用同一种原小雨和社交窗口、同一设备／视口。每次部署会建立新的未保存测试进度，温度与自然天气初值可能不同；不是逐像素相同背景的严格性能实验。原壳体 background、blur(24px)、opacity=1 的实际计算值一致；新增的是装饰绘制。

类型检查、Framework 构建、players-only 打包、SVG XML 解析、`official-game-motion.cjs`、`settings-orbit.cjs` 和 `header-weather.cjs` 通过。天气定向测试包含：各天气不同运动、雨量增大时尺寸／疏密／速度变化、最新放大 20–30% 和速度至少 2 倍的实际计算样式断言、快速变化取消、焦点不变、原控件命中、双布局与受控尺寸对齐、静态降级、窗口关闭停读、总开关及销毁。原 Android 输入遮罩／滚动证据复用，未重写相关逻辑。

### 性能观察与限制

同设备轻雨短采样的 requestAnimationFrame 回调间隔：强化前中位约 8.3ms、p95 约 8.4ms、最大约 8.5ms；首个三层样板中位／p95 相同，最大约 24.9ms，两次约 2.4 秒内均未采到 Long Task。后续雨量分档版本的三档约 2.1 秒采样也已保留；最新加速版本的数据以其 validation 为准。**这些是回调间隔，不是屏幕实际呈现 FPS，不能据此宣布 120 FPS 或长期流畅。** 没有采集 GPU 帧数据或长时间热／功耗，也没有启动 Perfetto 或泄漏调查。

开发中一条测试按 `url(` 计数，把 SVG 内部渐变引用也算成外层纹理，得到 19／38，而不是 1／2；改为只计外层 SVG 图像并保留实际大小／速度断言后通过。属于测试计数方法错误，不记作 Dev Tools 缺陷。侧栏直角覆盖则是本项目真实样式问题，已按实机计算样式定位修复。

最终最新包位于 `rain-fast/DoLGameUI-3.0.0.mod.zip`；分支、源码摘要、包体摘要、实际加载成员和证据复用见同目录 receipt。此前候选、原视频和收据均保留，未靠清理取得干净工作区。只安装 UI，未替换 Host；未提交、推送、合并、Tag 或发布。未覆盖物理手机、其它 DoL／Mod 矩阵和长期性能。**Implementation Done / 代表性功能检查通过 / Visual Acceptance Pending。**


## 天气整段顶栏与最新反馈收口（2026-10-18，当前候选）

当前以负责人最后反馈为准：雨滴恢复上一版沿玻璃滑落的细水痕和大小，轨迹改为左右蜿蜒、整体向下，流速约再提高 50%；晴天恢复原黄色泛光。丁达尔光束和放大的独立水滴图案已退出当前制品。侧栏恢复方形轮廓、11px 轻圆角，动态选中轮廓跟随相同边界。分叉闪电及整段顶栏覆盖保留。

### 实现与真实问题

- `framework/official-ui/weather.ts` 原本只测标题一行，现在测量标题到官方导航带底部；设置覆盖标题与布局选择条，未把左右布局的整列分类当作顶部天气区。原生窗口覆盖负责人圈出的标题及分类区域，正文不加天气层。
- 实机发现导航自己的入场位移会使装饰层在约两秒内多伸出一段。`opening-geometry-investigation.json` 记录了导航 translateY 从约 1.75px 到 0，而旧天气边界仍停在 196.8px、最终才回到约 178.8px。现改用同一定位父级中的布局尺寸，忽略导航临时入场变换，并以 border-box 观察尺寸变化。没有重设 Acrylic 的背景、模糊、透明度或父子关系。
- `navigation-material.css` 保留原雨量分档和急速远近雨点；近处蛇形水痕周期为小雨 1.2s、大雨 .97s、雷暴 .8s，原为 1.8s、1.45s、1.2s。两条低频分叉闪电绘制只存在于天气装饰节点中，关闭和减少动态设置仍有效。
- 侧栏三条已有高优先级圆角规则一起恢复为 11px，没有改写原按钮或事件。当前不增加新天气开关或公共协议。

### 验证与证据复用

仍为 M367FC / Android 17 / WebView 154 / 独立 DoL 0.5.12.13 / 原 Host 0.1.4-experimental。天气通过原游戏公开接口在未保存的测试进度中临时准备；最后恢复 weatherObj 身份及内容、临时温度、偏好与布局。无存档写入。这是工具控制的真实 Android 画面，不是人工手指操作证明。

- [当前候选：蛇形水痕、三档雨量、闪电及恢复的黄色泛光，29 秒](../tests/artifacts/kraft-work-weather-rays-20261018/final-water/serpentine-water-and-restored-sun.native.mp4)。[实际加载、状态与恢复检查](../tests/artifacts/kraft-work-weather-rays-20261018/final-water/validation.json)。
- [相同 JS 的代表性窗口及设置双布局检查](../tests/artifacts/kraft-work-weather-rays-20261018/final-rect/validation.json)：属性、社交、特质、成就、日志、设置上下／左右布局、分类和关闭、方形侧栏及其动态轮廓、静态退化、清理和恢复通过。最后两项反馈只调整天气 CSS 与纹理；此处丁达尔录屏仅属历史设计证据，不能作为当前晴天视觉。
- `framework:check`、Framework 构建、players-only 打包、SVG XML、`header-weather.cjs`、`official-game-motion.cjs`、`settings-modal-scroll.cjs` 和 diff 空白检查通过。天气测试包含整段边界、换行／调整尺寸、入场位移、雨量、蛇形流动模式、闪电、快速切换取消、原按钮命中、减少动态及停用清理。未重复无关业务矩阵。

开发失败保留：`candidate/` 的社交边界断言发现上述真实入场位移问题，修复后 `final-rect/` 通过；`final/` 在第一次入口点击时命中检查失败并停止，未派发遮挡后的点击，最终测试增加已开自有窗口的正常关闭准备。该次初始遮挡的具体操作者／原因 Unknown。一次浏览器窄视口检查在固定 50ms 等待后失败，诊断单跑通过；改为等待实际几何条件再断言，保留异步等待失败记录，不以反复重跑代替修复。

当前 UI ZIP 为 `final-water/DoLGameUI-3.0.0.mod.zip`，228827 bytes，SHA-256 `acacc42dbebeb56ebb029288072f506106342511cdbaa626e192c88fc923da24`；已加载 JS `1db2f1afbf2c2c6f996cb144b3d18c11dd20f663e0b5185b4c36f64be822bf28`，CSS `26045f9ff30a9ba373005dcee016f607f0b9d1ccfb434531dbd8dc1a9cbabd5d`。包内未包含现场证据或已退出的光束素材；只安装 UI，未替换 Host。完整身份见同目录 receipt。

Delivered：本轮改动已安装至独立平板测试版。Validated：上述定向源码、构建、浏览器及 Android 检查。Not validated：物理手机、长期 GPU／热／功耗和新增第三方矩阵。Known limitations：装饰按当前游戏天气呈现，闪电是低频视觉绘制，不声称逐次同步游戏的实际雷电事件；视觉仍需负责人确认。未提交、推送或发布，稳定版与私人长期存档保持。**Implementation Done / Functional Validation Passed / Visual Acceptance Pending。**


## 窗口天气材质重整（2026-10-18，当前依据）

负责人最新指令取代上一节的顶栏范围、蛇形水痕、直接雷纹和整层黄色泛光方向。本轮只调整基于游戏天气的装饰，不改变窗口布局、Acrylic 合成关系、侧栏方形轮廓、衣物选中或游戏业务。视觉验收仍由负责人决定。

### 当前实现

`framework/official-ui/weather.ts` 继续只读原游戏 Weather，映射和异常回退与入场源码逐字一致。每个已接入窗口保留一个装饰根节点，用 CSS 跟随窗口大小，去掉旧的顶栏测量及 ResizeObserver。效果从上缘延伸到窗口中段，中央逐渐减弱，约 82% 高度处消失；不再以标题和分类条底部裁切。

雨天采用快速细雨、凝露点与独立水珠：快速层是短小雨点，周期按雨量为 1.35／1.05／.8 秒；慢层保留玻璃驻留与滑落。每个窗口只初始化一次有界位置、大小、负延迟和 7–16 秒周期。小雨／大雨／雷暴分别显示 10／14／18 个活动水珠，随雨量放大；水珠先停留、凝结式长大，再加速下滑，短细痕随后淡出。它是视觉表现，不做液体碰撞模拟。负责人反馈“似乎没有下雨”后，现场确认大雨、效果开关及动画均正常，装饰 z-index=1 在正文 z-index=0 前方；主要问题是慢水珠难以直接表达下雨，因此补上持续细雨层，未恢复蛇形或长流水条。原滚动雨纹、蛇形路径和雷电轮廓资源已退出当前输入，历史源码保留在本轮 before/source 下。

雷雨增加移动云影、上缘和右侧的局部冷白照明，约 14.6 秒一轮短促反射；没有全屏白色遮罩。晴天保留暖色，通过局部日照和反射漂移呈现；阴天使用冷灰遮光，雾天是局部湿气聚散，雪天是远近两层低密度小雪。夜间晴天使用冷色反射。原动画和减少动态设置继续有效。

装饰根及所有子层均为 pointer-events:none、aria-hidden，未增加可聚焦元素。没有对窗口祖先增加 opacity、filter、transform 或新的背景退让层。游戏业务、Host 公共协议和读取规则不变。

### 实际验证

环境：M367FC 平板、Android 17、WebView 154、独立 DoL 0.5.12.13、原 Host 0.1.4-experimental。使用原游戏公开接口临时准备天气与温度，结束恢复 weatherObj 身份／内容、临时温度、偏好、布局和 Bedroom 场景；无存档写入，最终装饰残留为 0。下列是工具控制的真实 Android 画面，不称为人工手指验证。

- [最终雨天、三档水珠及局部闪电，29 秒](../tests/artifacts/kraft-work-weather-glass-20261018/rain-observed/glass-rain-and-local-lightning.native.mp4)。
- [最终晴、阴、雪、雾与正文滚动，29 秒](../tests/artifacts/kraft-work-weather-glass-20261018/final/sun-cloud-snow-fog.native.mp4)。
- [最终状态、尺寸、原操作与恢复](../tests/artifacts/kraft-work-weather-glass-20261018/rain-observed/validation.json)，[设置最终材质](../tests/artifacts/kraft-work-weather-glass-20261018/rain-observed/settings-final-material.native.png)。
- [首版设置双布局、实际开关切换、分类及关闭，24 秒](../tests/artifacts/kraft-work-weather-glass-20261018/candidate/settings-input-and-static.native.mp4)。其交互证据继续有效；后续加强局部反差、水珠基础尺寸及细雨层，并重新验证了最新设置静态退化和关闭。晴／阴／雪／雾未受细雨补充影响，复用 final/ 的实机录屏。

首版实机水珠及云雾存在感偏弱，依据截图提高局部反差后形成当前制品，首版未作为最终视觉通过。candidate/ 和 final/ 检查通过；首版另有系统通知短暂进入原始雾天截图，文件仅保留本地，不作为干净视觉对照。补充细雨后的 rain-visible/ 检查在短时雷闪采样中失败并保留：110×80ms 的最短观察窗仅 8.8 秒，短于 14.6 秒的闪电周期。改为对同一动画对象连续观察一完整周期并核对节点存续与 document.hidden，rain-observed/ 在约 11.37 秒捕捉到 opacity≈.493 的自然闪光；未改闪电代码、未重装另一包，也未把失败改写为通过。最新雨量、静态退化及恢复通过。

类型检查、`header-weather.cjs`、`official-game-motion.cjs`、`settings-modal-scroll.cjs`、Framework 构建、players-only 打包、SVG XML 和 diff 空白检查通过。天气测试按新合同核验窗口覆盖、导航入场及换行不移位、正文输入命中、随机周期与有界数量、雨量分档、六类材质、闪电照明、原焦点、可中断切换、减少动态、关闭停读和清理。旧的“必须止于顶栏”断言已由窗口边界及正文原控件断言替换，未放宽原操作、焦点和清理要求。没有开展性能专项或加载系统改造。

当前本地 UI ZIP：228155 bytes，SHA-256 `ede134b9c1ab16448f7e2918baa5fc10c949beda70fa4dd1bd293add2bc44919`。实际加载 JS `dc500fc6ec7ad978bb534d90f8985ae243ddf6c16768cec09e335f6c88d77809`、CSS `0b1ed3b8b32755fc1a5e52f66f48d4691cb9658a3fc89c807d555df5c2808aee` 与 ZIP 成员一致。仅安装 UI，原 Host 不替换；制品、源码摘要、环境及覆盖见 rain-observed/receipt.json。无提交、推送、Tag 或发布。

Delivered：新窗口天气表现已安装至授权平板测试版。Validated：上述浏览器与真实 Android 代表性检查。Not validated：本轮未补物理手机、全部第三方窗口或长期性能。Known limitations：水珠是有限视觉近似；闪电按雷雨状态周期表现，不声称逐次同步游戏实际雷电事件。**Implementation Done / Functional Validation Passed / Visual Acceptance Pending。**


## 雨量强度最终补充（2026-10-18）

负责人接受上一轮自然天气方向，并要求加大雨量差异；随后明确玻璃水珠不再放大，只加快滑落。本次只调整共享天气 CSS，保留既有玻璃水珠的基础尺寸和三档尺寸系数，未进一步增大水珠。空中雨点按小雨／大雨／雷暴使用 560×320、700×400、840×480 CSS px 的纹理周期，雨点相对大小为 1／1.25／1.5；下落周期为 1.35／.9／.55 秒，实际垂直速度约为 237／444／873 CSS px/s。玻璃水珠与短痕共享 1／.75／.5 的周期和延迟倍率，保持水珠、尾痕同步；同一水珠在大雨和雷暴中的周期缩短为小雨的 75% 和 50%。雨量读取、最多 18 个水珠、其它天气和 Acrylic 合成不变。

`header-weather.cjs` 与 `framework:check` 通过，Framework 构建及 players-only 打包成功。新增断言核验空中雨点尺寸与实际速度逐档增加、玻璃水珠原尺寸公式不变、滑落与短痕的周期和延迟一致、玻璃水珠周期随雨量缩短；原命中、焦点、中断、静态退化和清理检查继续通过。

[平板三档雨量实录，24 秒](../tests/artifacts/kraft-work-weather-glass-20261018/rain-scale/rainfall-size-and-speed.native.mp4)及[状态与恢复](../tests/artifacts/kraft-work-weather-glass-20261018/rain-scale/validation.json)：M367FC / Android 17 / WebView 154 / 独立 DoL 0.5.12.13 / 原 Host 0.1.4。原分类切换、关闭、设置静态模式通过，结束恢复未保存测试进度的天气对象、临时温度、偏好及布局，装饰残留为 0；无存档写入。实录为工具控制，不称为人工触控证明；画面右下保留入场已有的系统录制悬浮控件，未操作它。其它天气与雷闪代码未改，复用上一节对应证据，未重复整套业务验收。

当前 UI ZIP 为 228212 bytes，SHA-256 `fce250f9ddaf4ebd65ee85b705be7e1a00e09ed4f55114d3b7429ed40e9ccda4`；加载 JS `dc500fc6ec7ad978bb534d90f8985ae243ddf6c16768cec09e335f6c88d77809`、CSS `a9c337580215b2b7c09de1e2c1dcf8e2d30a4f565f8fb73c9e945609c982b092` 与包内一致。相对 rain-observed 制品，仅 style.css 内容变化。已安装 UI，未替换 Host；身份见 rain-scale/receipt.json。

Delivered：本轮雨量强化已完成。Validated：上述定向测试、构建和 Android 检查。Not validated：本轮未补手机、长期性能或新增第三方矩阵。Known limitations：水珠仍为有界视觉近似；雷闪不逐次绑定游戏实际雷电事件。根据负责人本轮接续意见，天气实现可收口，后续聚焦稳定性、必要兼容和正式收尾；不继续扩展视觉范围。最终整体 Visual Gate 仍由负责人确认，不将本轮功能检查等同于 Stable 发布许可。未提交、推送或发布。


### 雨效整体加速 40%（2026-10-18，最新）

按负责人追加要求，空中雨点、玻璃水珠及短痕的周期与延迟统一除以 1.4，运动速度增加 40%，不是把时长直接减去 40%。尺寸、雨量分档、覆盖范围及其它天气保持不变。`header-weather.cjs` 增加两种雨效准确速度倍率断言并通过；Framework 构建、players-only 打包及 M367FC 独立测试版三档雨量、分类、关闭、设置静态模式与恢复检查通过，无装饰残留或存档写入。未重复无关业务和其它天气验证。

[24 秒平板实录](../tests/artifacts/kraft-work-weather-glass-20261018/rain-speed140/rainfall-speed140.native.mp4)、[状态与恢复](../tests/artifacts/kraft-work-weather-glass-20261018/rain-speed140/validation.json)。最新 UI ZIP 228219 bytes，SHA-256 `41a95cc86bc238e373f5167ee0474b968895116742b4b27ae2cccdf6eec61d80`；相对上一候选仅 style.css 内容变化，加载摘要匹配。Host 保持 0.1.4-experimental，JS 不变。未补手机和长期性能；整体视觉仍由负责人验收，未提交、推送或发布。


### 空中斜雨与暴雨尺寸回收（2026-10-18，最新）

按负责人追加要求，仅空中雨点改为向右下约 30° 运动，纹理椭圆同步倾斜；玻璃水珠的大小、垂直滑落、周期和短痕保持上一版。小雨／大雨／雷暴纹理尺寸为 560×320／700×400／560×320 CSS px，雷暴雨点恢复普通尺寸，仍比普通雨落得更急。运动以横向一个纹理周期、纵向三个周期衔接，避免斜向循环重置跳动；循环总时长同步按三倍调整，避免仅因增加循环距离而额外提速。雨量读取、其它天气、材质和原操作不变。

`header-weather.cjs` 验证斜向端点、整纹理循环、暴雨与普通雨相同尺寸、逐档加速及原水珠尺寸／速度、命中、静态和清理通过；Framework 构建、players-only 打包和 SVG 解析通过。[24 秒平板三档实录](../tests/artifacts/kraft-work-weather-glass-20261018/rain-diagonal-observed/diagonal-rain.native.mp4)及[状态与恢复](../tests/artifacts/kraft-work-weather-glass-20261018/rain-diagonal-observed/validation.json)：M367FC 独立测试版原分类、关闭、设置静态模式和恢复检查通过，装饰残留为 0，无存档写入。首轮单测因 Chromium 将背景位置展开为 X/Y 属性导致采样失败，修正观察字段；首轮现场检查在天气切换前读取不存在的雨点动画而失败，已恢复现场，增加可缺省观察后在同一安装包复验通过。失败保留 rain-diagonal/，未为测试通过修改产品行为。

最新 UI ZIP 228433 bytes，SHA-256 `b634d078723b7c00050eaa547b8d80c1dfc4147cdc79730460946a878f4d2d42`，相对上一候选仅 style.css（含雨纹 SVG）变化；实际加载摘要匹配，原 Host 不替换。未补手机、长期性能或其它天气全矩阵，整体视觉仍由负责人确认。未提交、推送或发布。

本次原始截图／录屏有系统通知短暂出现，仅本地保留，不作为干净视觉对照或公开材料。功能采样与恢复结果仍按独立断言记录。
