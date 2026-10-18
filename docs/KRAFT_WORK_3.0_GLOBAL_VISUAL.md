# Kraft Work：全局视觉统一首批整改

后续状态：本页保留当时两种 Hub 候选和横向设置的证据。当前融合 Hub、双布局和侧栏整改见[本轮接续结果](KRAFT_WORK_3.0_INTERACTION_DUAL_LAYOUT.md)，不再维护两套正式 Hub 菜单。

2026-10-18。依据负责人《全局视觉统一与动态特效推广整改指令》。本轮交付设置展示层重设计、两种可运行 Hub 造型，以及正文／侧栏／商店／衣柜的代表性推广。**Visual Gate 仍为 Blocked；本文不宣布全游戏视觉完成或稳定版通过。**

## 评审材料

| 内容 | 实际材料 |
| --- | --- |
| 设置整改前 | [本轮入场截图](../tests/artifacts/kraft-work-global-20261018/before-settings.native.png) |
| 设置整改后 | [新布局](../tests/artifacts/kraft-work-global-20261018/after-settings.native.png)、[实际材质预览](../tests/artifacts/kraft-work-global-20261018/after-settings-preview.native.png)、[内部操作录屏](../tests/artifacts/kraft-work-global-20261018/settings-material.native.mp4) |
| 材质参考 | [特质](../tests/artifacts/kraft-work-global-20261018/before-traits.native.png)、[成就](../tests/artifacts/kraft-work-global-20261018/before-feats.native.png) |
| Hub 原形态 | [入场工具组](../tests/artifacts/kraft-work-global-20261018/before-hub.native.png) |
| Hub 星簇候选 | [截图](../tests/artifacts/kraft-work-global-20261018/final-v4/hub-cluster.native.png)、[展开／工具调用／返回／停靠录屏](../tests/artifacts/kraft-work-global-20261018/final-v4/hub-cluster.native.mp4) |
| Hub 工具带候选 | [截图](../tests/artifacts/kraft-work-global-20261018/final-v4/hub-ribbon.native.png)、[完整交互录屏](../tests/artifacts/kraft-work-global-20261018/final-v4/hub-ribbon.native.mp4) |
| 正文与侧栏 | [卧室与侧栏截图](../tests/artifacts/kraft-work-global-20261018/final-v4/bedroom-sidebar.native.png)、[原入口到衣柜录屏](../tests/artifacts/kraft-work-global-20261018/final-v2/body-wardrobe.native.mp4) |
| 衣柜 | [实际叠穿后截图](../tests/artifacts/kraft-work-global-20261018/final-v2/after-wardrobe.native.png)、[分类与预览操作](../tests/artifacts/kraft-work-global-20261018/final-v2/wardrobe-preview.native.mp4) |
| 商店 | [商品与详情](../tests/artifacts/kraft-work-global-20261018/final-v2/after-shop.native.png)、[商品切换录屏](../tests/artifacts/kraft-work-global-20261018/final-v2/shop-selection.native.mp4) |
| 可选战斗 B | [部位与原动作编辑](../tests/artifacts/kraft-work-global-20261018/final-v2/combat-optional.native.mp4)、[截图](../tests/artifacts/kraft-work-global-20261018/final-v2/after-combat-b.native.png) |

设置前后均使用同一平板、视口、卧室和背景图，没有用不同地点制造材质差异。安装重载之间重新进入隔离新游戏，天气文字可能不同；不是同一文档或可作像素差分的完全相同状态。特质与成就参考在整改前同一卧室采集。最终设置截图另见[已加载最终包](../tests/artifacts/kraft-work-global-20261018/final-v4/settings.native.png)。

## 全局差异清单与实际推广范围

下表是 Codex 对实际界面和当前源码的判断。共享样式存在，不等于负责人已批准视觉统一。

| 区域 | 入场差异 | 本轮处理与状态 |
| --- | --- | --- |
| 普通正文 | 衣柜、镜子有局部提示，其余正文入口主要沿用原样 | 扩展到严格识别的卧室八个导航入口，使用文字流内的轻材质、按压与焦点反馈；不将全文链接卡片化。其它 Passage 未整体推广。 |
| 左侧导航 | 多个灰色按钮块，进入窗口已有局部转场 | 已知原版快捷入口改为轻行、弱分隔和连续焦点轮廓；保留原按钮、顺序、事件。陌生 Mod 入口不打标、不重做。 |
| Floating Hub | 圆形主球与传统纵向胶囊菜单 | 重做主球图形、轮廓、图标、文字、分组和工具间距，提供星簇／工具带两种候选。拖动、停靠、位置保存和工具调用共用原实现。 |
| 设置 | 纵向分类，两块大面积控制／预览面板 | 改为横向分类、连续控制行与紧凑预览。移除控制区的材质卡片嵌套和预览拉伸；保留 Orbit、空间转场、真实预览及保存反馈。 |
| 属性 | 顶部与导航是已认可锚点，正文已有分层 | 保留材质，本轮实际查看并验证侧栏／Hub 来源关系，不重新设计属性业务。 |
| 社交 | 已有轻卡片与空间进入，卡片内容依实际关系 | 保留既有减重成果，本轮查看当前新游戏界面；不据此声称所有角色状态和长卡片已覆盖。 |
| 特质 | 已认可的黑灰透明外壳与轻正文 | 作为锚点保留，本轮实际查看；不把设置布局复制到特质。 |
| 成就 | 已认可的收藏陈列与轻卡片 | 作为锚点保留，本轮实际查看；原币、解锁与日期语义不变。 |
| 商店 | 有自己的外壳、原商品卡片与详情，来源反馈偏局部 | 外壳与商品／详情使用共享材质值；分类焦点迁移与商品详情反馈保留并调整。原报价、颜色、购买节点和固定后代坐标未改。 |
| 衣柜 | 来源投影、参照及实际角色预览已经存在 | 使用同一壳体／内容材质，分类数量提示分层进入、真实预览透视反馈；物品控件保持稳定命中位置。单击直接穿戴保持。 |
| 战斗 B | 已有部位聚焦、原动作和装饰编辑平面 | 本轮在实际演示战斗复验并录屏；仍是可选实验，默认原版。后续只根据真实战斗反馈微调，不承诺所有遭遇和第三方动作均已覆盖。 |

上述没有将所有 Passage、未知第三方界面或所有常用浮层宣布完成。常用官方浮层继续沿用当前主题与 source-motion；独立浮层逐项表现评审仍属后续覆盖。

## 共享规范与页面特色

| 设计部分 | 当前规范和实现边界 |
| --- | --- |
| 外层壳体 | 中性黑灰 Acrylic、弱反射与边缘，环境受控透入。设置、Hub、衣柜和商店复用 `--kw-shell`。 |
| 内容承载 | 阅读与密集列表保留稳定表面，复用 `--kw-island`；控制行不再逐个套大卡片。 |
| 浮动组件 | 独立的边缘与浅阴影表达抬起，不给每张内容卡片叠模糊。 |
| 按钮与焦点 | 深色低外壳，青绿／淡紫／暖色仅表达交互；已知侧栏与 Hub 的实际 focus 使用柔和轮廓，同时保留键盘提示。 |
| 页面进入与来源 | 使用现有 `sourceMotion` 的可取消动画和装饰轮廓。Hub 到已知属性／社交窗口使用空间交接，原窗口根节点只参与透明度，不加 transform/filter。 |
| 内容变化 | 设置分类为空间转场；衣柜预览允许透视变化，真正物品控件不随装饰位移；商店分类与详情保持场景自身的信息密度。 |
| 展开、关闭与恢复 | 当前动画可取消，关闭后删除代理并恢复来源焦点；总开关、动画开关及 reduced motion 优先。 |

没有新增 Theme Engine、Motion Runtime、偏好命名空间、Host 合同或 API。属性／特质／成就的已认可材质保留；新增共享值不要求每页透明度和布局完全相同。

主要实现位于 [设置展示结构](../src/theme/SettingsPanel.vue)、[设置布局](../src/theme/settings-workspace.css)、[Hub 展示组件](../framework/motion-hub/MotionHub.vue)、[来源与交接](../framework/official-ui/motion.ts)、[共享交互样式](../src/theme/kraft-work-motion.css)和[材质](../src/theme/dark-acrylic.css)。衣柜只调整已有展示动画，原操作仍由 [native wardrobe](../src/wardrobe/native.ts)执行。

## 默认体验与候选的区别

- 本地开发包默认启用新的设置结构、已知正文／侧栏表现、商店和衣柜反馈；尚未公开发布。
- 悬浮工具本身仍沿用用户原开关，新安装默认关闭。开启后，本地候选默认展示星簇工具组；工具带通过非持久 `data-kw-hub-design="ribbon"` 比较，结束已清除，不增加玩家偏好或公共接口。
- Hub 到已知属性／社交窗口的 B 空间交接现已进入本地候选默认路径，不再依赖 `data-kw-hub-study`。原 A 形态展开仍可通过旧评审标记查看，历史代码与录屏不删除。
- 战斗 B 仍由 `combatFocused` 控制，入场和收尾均为 false。本轮只在内置演示战斗临时开启，没有执行回合。
- 两种 Hub 造型、默认选择和全局视觉质量仍待负责人决定；本地默认不等于正式设计批准。

## 定向验证与失败记录

现场为 M367FC 平板／Android 17、独立测试 App `com.vrelnir.dol.lyra.uicompat051213`、DoL 0.5.12.13、ModLoader 2.101.1、WebView Chrome 154.0.8037.58。Host 沿用入场 0.1.4-experimental，只替换 UI 包。

通过的检查：`npm run framework:check`、`node tests/official-game-motion.cjs`、`node tests/settings-orbit.cjs`、`node tests/settings-workspace.cjs`、`node tests/kraft-work-materials.cjs`、`node tests/framework-motion.cjs` 和 `node tests/kraft-work-product.cjs`。经典入口及无改动业务部分复用有效证据。最终焦点修正只改 CSS，复用未受影响的几何、业务和生命周期结果。

- [设置现场收据](../tests/artifacts/kraft-work-global-20261018/settings-review-result.json)：滑块改变真实预览字号、玻璃开关、同一参考节点浮起／放回、Orbit 暂停、连续切换、reduced motion 和受控窄视口通过。
- [最终 Hub 收据](../tests/artifacts/kraft-work-global-20261018/final-v4/hub-review-result.json)：两种造型均调用原属性入口一次，原关闭可命中，根 transform/filter 为 none；返回焦点与装饰清理通过。
- [边界收据](../tests/artifacts/kraft-work-global-20261018/final-v3/boundaries-result.json)：两种造型在 390×844／844×390 下无越界或主球重叠；快速关闭重开、中途关动画、reduced motion、总开关和偏好恢复通过。后续仅弱化 focus 外观，布局和动作代码未改变。
- [商店／战斗收据](../tests/artifacts/kraft-work-global-20261018/final-v2/shop-combat-result.json)：商品切换未扣款；战斗仅一次原 change、零次回合派发，结束恢复原版战斗。
- 普通正文和侧栏各一次原入口事件已记录于 [首次页面收据](../tests/artifacts/kraft-work-global-20261018/final-v2/pages-result.json)。该脚本整体为 failed，不能包装成全流程通过。

本轮实际失败与判断：

1. 开始时平板处于系统分享界面，Action 拒绝派发；负责人返回测试版后继续，没有强制切走正在操作的系统界面。
2. 侧栏旧 `:is()` 规则优先级导致新材质没有实际生效。复看截图后补充针对性断言，修正后原生按钮变为轻行，陌生按钮保持原样。另确认程序化 focus 与 `:focus-visible` 不等价，已知入口和 Hub 均覆盖实际 focus，保留柔和可见提示。
3. 衣柜穿戴脚本错误要求主衣物名称改变，实际主连衣裙保留，校服衬衫进入 `wornStacking.upper`、原库存减少且角色外观变化。[原叠穿见证](../tests/artifacts/kraft-work-global-20261018/final-v2/stacking-witness.json)与 [R16-W01](STONE_FREE_3.0_R16.md)一致。保留失败断言，没有重复穿戴；后续只操作分类和预览。
4. 从衣柜直接准备商店场景时，原 Wardrobe Widget 的 `selectedWardrobe` 路径报错，ModHub 自动打开日志并挡住目标，命中保护拒绝点击。使用原关闭入口退出后，重新观察并完成可见商店操作。该现象在 [R4](KRAFT_WORK_3.0_GAME_MOTION.md)已有记录，根因仍为 Unknown，本轮不修改第三方或据此宣布新 UI 回归。[遮挡见证](../tests/artifacts/kraft-work-global-20261018/final-v2/shop-hit-observation.json)。

录屏以真实 Android screenrecord 采集，操作由经检查的 CDP／Action 注入；不称人工手指触控验收。两种最终 Hub 录像已作一秒间隔抽帧复看；抽帧时刻不是精确源 PTS，也不证明呈现帧率。独立 `Engine.play` 只用于已授权测试场景准备，没有将其当作自然路线或业务成功证明；未主动保存、读取、删除长期存档，未购买或执行战斗回合。历史 GER Store／Unknown 未操作。

## 制品与恢复

当前分支 `research/stone-free-3.0-framework`，HEAD `014f469f4092d246cdcd22098fc9b5a943d029b6`，改动未提交。保留此前所有未提交成果与中间失败材料；不覆盖稳定 2.7 或公开 RC，不推送、合并、Tag 或发布。

最终候选位于 `tests/artifacts/kraft-work-global-20261018/final-v4/`，安装包为 `DoLGameUI-3.0.0-kraft-work-global.mod.zip`，213368 字节，SHA-256：

```text
160cd963f74a1df3895ddc99154dde5b570bcdc5f5c9a54ad3bfedd9f22c87ee
```

实际加载成员见 [installed.json](../tests/artifacts/kraft-work-global-20261018/final-v4/installed.json)。各轮 index.js 相同，最终 style.css 修正了侧栏规则、共享材质与焦点外观。设置录屏与商店／衣柜／战斗材料的对应范围未因最终 focus 样式改变而失效，未重新播放无关业务来累计覆盖。

收尾恢复进入时的 UI／Floating 配置与位置，清除两类评审标记和临时节点；重载后通过原开始入口回到隔离 Bedroom，战斗为 0。实际收尾状态见 [final-state.json](../tests/artifacts/kraft-work-global-20261018/final-v4/final-state.json)。

收尾探针另保留两点：DPR 2.5 下，设计 1px 的轮廓实测为 0.8px，不能用字符串相等断言；关闭设置 650ms 时，恢复焦点的轮廓仍可能运行，实测当时为 450/560ms，结束后清零。没有把转场中的节点误记为稳定残留，或修改产品来迎合过早采样。

## 性能与工具使用边界

[三次收尾采样](../tests/artifacts/kraft-work-global-20261018/final-v4/perf-closeout/performance-series.json)在窗口关闭后顺序执行，实际起点约 0／1780／3615ms。App PSS 为 552089／512303／496511KB；选定 WebView heap 为 208864952／208098444／208324884 字节，listener 均 399、Documents 均 1。这些数值不构成单个 UI 分配归因或泄漏结论。

三次 `gfxinfo.sampledFrames` 均为 0、median 为空，不能报告真实 FPS。未执行 Perfetto、bugreport、Full Evidence 或长期泄漏调查，没有把重型采集变成本轮视觉设计的前置条件。

已安装 Paisley Park 6.1.0 用于标准 Action、前台保护、WebView 连接、性能采样和离线取帧；项目私有身份／叠穿／精确命中观察使用直接 CDP，原生截图和 screenrecord 使用 ADB。工具没有强迫绕过日志遮挡，命中保护实际阻止了被遮挡的点击。没有发现明确的工具实现缺陷；具体 `wornStacking` 字段和原 Widget 错误属于项目／组合知识，不写入通用 Skill。构建仍由项目现有工具链执行，没有新建 Runner、安装环境或修改 Paisley Park。

## 未验证与后续覆盖

- 物理手机触控、真实 IME、全部 Passage／商品／战斗及第三方组合未覆盖；受控窄视口与浏览器指针测试不替代这些结果。
- 角色页本轮查看的是当前测试新游戏状态，历史已验证的长列表和复杂角色状态按未改变部分复用。
- 性能仅作有界采样，结论与原始数据见收尾记录；不把工具往返时间、rAF 或无效 gfxinfo 样本当作真实呈现帧率。长期内存归因仍为 Unknown。
- 后续推广优先依据普通原版场景的真实使用反馈扩展白名单与表现；无法确认来源的第三方交互继续保留原样。无需另建全局 DOM 接管层。

本轮材料用于整体联动评审。**Visual Gate：Blocked，等待负责人验收。**
