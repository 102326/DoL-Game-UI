# Stone Free 3.0：黑灰 Acrylic 实施结果

2026-10-18。本轮实现与代表性检查已完成，视觉与负责人验收仍待确认，Stable Visual Gate 继续 Blocked。未提交、推送、合并、Tag 或发布。

工作区 `experiments/stone-free-framework-30`，分支 `research/stone-free-3.0-framework`，起点 HEAD `014f469f4092d246cdcd22098fc9b5a943d029b6`。保留暂停时的改动继续实现，不重置源码。Stable 2.7 checkout 干净，正式仓库原有两个未跟踪文件保持原状。

## 1. Visual Direction Correction

[当前视觉基线](STONE_FREE_3.0_VISUAL_DIRECTION.md)取代 Ocean 主题、蓝灰主表面、强反光和三档质量模型。历史 R12 标记为已被取代，研发接续、设置及 API 说明同步更新，历史证据未删。

官方设置移除档位选择。旧 `visualTier` 保留在原偏好键，官方入口采用完整效果，玻璃和动画仍可独立关闭。旧值 0 的实际 Android 读取、完整玻璃生效和 API v1 返回兼容值 Fancy 已验证；经典入口继续保留旧规则。

## 2. Material Findings

官方材质集中于 `src/theme/dark-acrylic.css`。主表面 #242426、阅读表面 #202022、浮层 #29292c；模糊 28px，外壳在受支持且启用玻璃时为半透明。文字内容有较稳定的内表面，游戏状态、链接、商品色样继续保留语义颜色。

实际发现：Eyes 的共享 :is() 包含两个原生 ID，优先级高于普通主题作用域，导致中性变量仍被旧蓝色覆盖。已在官方自有作用域固定中性 token，并用实际 bundle 检查眉题颜色。此为项目 CSS 问题，不是 Paisley Park 缺陷。

设置窗口本体、背景层级、开关与滑块均使用新材质；已消除此前内容层 78% 不透明覆盖和方形内卡片。关闭玻璃时，Android 返回 `backdrop-filter:none` 与实底 rgb(36,36,38)，操作仍可继续。

## 3. Motion Findings

设置打开和关闭从实际入口方向进入／退回，原生 backdrop 参与模糊与对比变化。分类切换为整体内容转场，旧内容 inert 且 aria-hidden，连续切换取消旧动画。实际组件预览为同一节点浮起／归位，不复制一套可交互控件。

战斗部位切换联动标题、原内容可见性和背景材质层。原动作控件保持最终命中位置，未用平移原控件制造动画。窄容器通过 Grid 将编辑区放在当前部位摘要下，保留原节点及事件。

Hub 的外壳从主球展开，工具层、来源位置、拖动与停靠共享中性材质；原有手势与输入协作不另建系统。未修改 Host 公共合同。

## 4. Gameplay Integration

战斗 B 继续可选，默认 `combatFocused:false`；关闭时不挂载新版战斗根节点，使用实际原版布局。默认勾选只标记“沿用原选择”，不伪装成玩家本次更改或已执行。未知附加内容不折叠。

Android 使用独立测试 App 的新建临时游戏和原生 Combat Demo，检查默认原版、聚焦部位切换、窄容器、关闭动画和离场恢复。本轮未执行回合。原 radio／目标／Continue 的单次事件、失效拒绝和节点身份由本轮定向浏览器测试验证；此前 Android 原操作与回合结果证据仅作为历史佐证。

衣柜检查上衣分类、两件原衣物、角色预览和只读参考；商店检查入口、12 件商品、原详情与设置／Hub 共存。未穿戴、购买、读写私人存档或执行云端操作。侧栏和常用浮层采用官方中性 token，原入口和第三方未知节点仍由原方拥有。

## 5. Performance & Resource

连续切换、反复开关、motion off 与系统 reduced motion 的代表性检查通过。离开战斗并等待转场结束后，自有动画数为 0，未残留折叠标记、临时来源节点、离场或分类过渡状态。

没有开展帧时间、功耗、长时间内存或低端设备测量，也没有据截图宣称 60fps。实际采样未发现无法关闭、持续自有动画或输入阻断；这不等同于性能全面验收。

收尾失败保留：恢复偏好后立即 force-stop，重启曾读回 tier=0／hidden=true。随后恢复并等待后，再次重启与全部既有字段逐项核对通过；原因未进一步隔离，不据此认定工具或 UI 持久化缺陷。`android-closeout-result.json` 保留失败，`android-restoration-continuation.json` 记录后续成功，新增默认字段 combatFocused=false 不视作偏好丢失。

## 6. Android Evidence

M367FC／0509B830099C3540，授权独立 App `com.vrelnir.dol.lyra.uicompat051213`，DoL 0.5.12.13，现有 Host 0.1.4-experimental。实际 UA 保留在本地入场记录，未替换 Host。

本地制品 `tests/artifacts/stone-free-dark-acrylic-20261018/DoLGameUI-3.0.0-dark-acrylic-v2.mod.zip`，204435 bytes，SHA-256 `e09a6cb71b490d1972a42492a51b12e544b60d63c61406f6f10106f97fa1b4b2`。技术版本仍是本地 3.0.0 候选，未成为公开 Stable。

实际加载成员与本地产物相同：

- index.js：`633c31857db422d9d43dc6fd0bd772e5bf8ab8169c5615a4e8c0b1654c18e4d9`
- style.css：`c861b2308f9a43ad35a02adcea2582b5a8bc33e37075adcc55cab8196de4e737`

截图与视频均在同一忽略目录；本地原始资料不自动进入发行附件：

| 证据 | 内容 |
| --- | --- |
| 16-settings-reading-final.native.png | 最终设置／中性控件 |
| 18-settings-material-final.native.png、19-settings-floating-final.native.png | 真实商店背景上的 Acrylic 与浮动参考 |
| 21-hub-expanded-final.native.png、20-hub-docked-final.native.png | Hub 展开／停靠 |
| 22-wardrobe-final.native.png、23-wardrobe-reference-final.native.png | 最终衣柜／参考 |
| 17-shop-final.native.png | 最终商品列表与详情 |
| 24-combat-focused-final.native.png | 最终聚焦战斗 |
| 25-combat-narrow-final-controlled.png、26-settings-narrow-final-controlled.png | 同一 Android WebView 的受控 390px 视口，非物理手机 |
| dark-acrylic-motion.native.mp4 | 原生 Android 18 秒录屏；CDP 控制操作，非手指触控或帧率证明 |

本轮执行 framework:check、typecheck、Framework 构建、玩家包打包，及 settings-official-init、settings-workspace、combat-focused、ui-runtime、framework-motion、framework-motion-gate、stone-free-player-shells 定向测试。覆盖旧档位保留、官方首次挂载、分类转场／重复操作、modal 关闭与重开、原动作与目标、未知内容、部位折叠、代表性尺寸、原生入口与资源释放。原生 source 守卫未放宽。

Paisley Park 使用现有 6.1.0 White Snake：通过既有 execution context 绑定设备和包，Action 点击／重启，CDP 读取 DOM／Computed Style／实际成员身份，ADB 原生截图与录屏。没有重新安装工具、调用 GER、清除历史 Pending／Unknown，或收集 Full Evidence／Perfetto。工具操作与物理输入证据保持区分。

## 7. Remaining Issues

本轮范围内未发现仍阻塞上述实现的功能缺陷。Not validated：物理手机触控、手机键盘遮挡、更多 WebView／Mod 组合、长期性能。它们是覆盖边界，不自动扩为当前任务。

Terminal／VS Code 截图和手机参考录屏原件未随本轮任务提供，依据的是负责人的文字要求。未声称逐帧复刻或对比未提供的媒体。视觉仍须负责人实际查看与试用。

## 8. Stable Gate

| 项目 | 当前结论 |
| --- | --- |
| 实现／功能 | 本轮范围完成，代表性定向检查通过 |
| 交互 | Android 与桌面受控操作通过；不等于物理触控全覆盖 |
| 视觉 | 待负责人验收 |
| 项目负责人验收 | 未批准 |
| Stable 发布 | 继续 Blocked，本轮无发布动作 |

测试结束已恢复既有显示字段、旧档位、Hub 显示与位置，战斗 B 关闭；候选留在独立测试 App 便于试用。正式 App、个人长期存档、2.7 稳定制品及公开 RC 未变。
