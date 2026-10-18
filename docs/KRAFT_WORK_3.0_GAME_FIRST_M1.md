# KRAFT WORK：游戏主体动效 M1

2026-10-18。依据《Game-First Expressive Motion Initiative》，本轮只完成属性、商店、衣柜三个样板。**实现与定向验证已完成，表现力待负责人验收；Stable Visual Gate 仍为 Blocked。M2 尚未启动。**

## 给负责人看的实录

视频来自平板原生 screenrecord；操作由已绑定该 App 的 Action / CDP 执行，不称人工物理触控。请看来源、目标交接及最终稳定状态，而不是只看截图。

| 样板 | 本轮变化 | Android 实录 |
| --- | --- | --- |
| 属性 | 原分组滚动抵达后，导航的材质向目标展开；已知静态数值卡片分层浮起、回落。连续跳转只响应最后一次。 | [属性导航与分组抵达](../tests/artifacts/kraft-work-game-first-20261018/candidate-v1/attributes-spatial-arrival.native.mp4) |
| 商店 | 商品图标随非交互材质代理交给原详情区；原详情方向性展开，原商品、配色及报价仍由游戏提供。 | [商品到详情](../tests/artifacts/kraft-work-game-first-20261018/candidate-v1/shop-product-to-detail-final.native.mp4) |
| 衣柜 | 单击仍直接执行原穿戴；真实装备或叠穿状态改变后，来源材质交给角色预览，真实画布产生深度回弹。 | [原穿戴与角色预览](../tests/artifacts/kraft-work-game-first-20261018/candidate-v2/wardrobe-original-wear-preview.native.mp4) |

属性、商店实录来自 candidate-v1；candidate-v2 只补衣柜的分类中断及延迟预览保护，它们的实现和 CSS 未改变，因此复用两段实录。衣柜使用最终 v2 实录。静态截图与抽帧只辅助检查，不代替视频或负责人判断。

## 实现范围

- `src/ui/source-motion.ts`：复用已有 WAAPI 管理，增加有边界的材质代理，以及原滚动真正抵达后的回调。代理没有表单、事件或业务数据副本，`pointer-events:none`、`aria-hidden`，结束或取消即移除。窗口变化也撤销旧展示。
- `src/characteristics/main.ts`、`Navigation.vue`：原滚动容器与原数据节点不变；来源使用实际导航位置。只让已知且没有交互后代的数值卡片产生深度运动，未知或可交互内容保留。
- `src/shop/main.ts`：在原 Source 更新之后编排；详情主体使用裁切和透明度交接，商品图标使用展示代理。原固定控件祖先不加 transform/filter。关闭、分类、重排、停用时撤销。
- `framework/official-ui/motion.ts`：移除旧的重复商店详情动画，避免两个动画所有者竞争同一内容。
- `src/wardrobe/main.ts`、`WardrobePanel.vue`：去掉仅根据 `wornItem` 刷新就播放的旧预览效果。穿戴前后只读核对主层与 `wornStacking`；真实预览返回后才播放，不重派穿戴。预览指纹包含叠穿；分类、脱下、毛巾和页面释放可中断，过期或视口已变的来源不再播放。
- `src/theme/kraft-work-motion.css`：短时黑灰材质与低亮边缘，不新增全页模糊或常驻扫光。

没有修改 Host、公共协议、UI API、原穿戴实现、购买或战斗规则。战斗 B 仍默认关闭，设置双布局、Orbit、Hub 和已认可材质保留。

## 已验证

环境：M367FC，Android 17 / WebView 154.0.8037.58；独立测试 App `com.vrelnir.dol.lyra.uicompat051213`，DoL 0.5.12.13 / ModLoader 2.101.1，原 Host 0.1.4-experimental。Paisley Park resolver 指向本机 6.1.0 White Snake，未重装工具。

- 属性：生活技能、学业、基础属性；原节点和正文不变，滚动仅在窗口内；快速跳转、关闭、动效关闭及 reduced motion 清理成立。`candidate-v1/attributes-review.json`。
- 商店：睡衣衬衫、T 恤衫、校服衬衫；每个原 jQuery 商品处理入口计数为 1，原定义索引和详情对应，原配色入口保留，金钱与库存不变。代理不命中，主体和详情祖先的 transform 均为 none。`candidate-v1/shop-review.json`。
- 衣柜：原穿戴入口计数为 1，校服衬衫库存 2→1，进入 `wornStacking.upper`，主层仍为 sundress，原属性合并也由游戏完成；实际角色画布摘要变化，最终装饰层 0、无原版错误。`candidate-v2/wardrobe-review.json`。
- 中断：连续商品选择、390px 受控 Drawer 关闭、主开关停用/恢复、reduced motion、视口变化、Passage 离开；另一件衣物的原穿戴后立刻切换分类，代理由 1→0，原页面无错误。结束回到卧室，偏好与入场一致，金钱不变、展示层 0。`candidate-v2/lifecycle-complete.json`。
- Windows Edge 定向测试：`game-first-motion.cjs`、`characteristics-framework.cjs`、`shop-stone-free.cjs`、`shop-transaction-lifecycle.cjs`、`wardrobe-native-link.cjs`、`official-game-motion.cjs`；`npm run framework:check` 通过。
- 按现有 `build-framework.mjs` / `package-framework.py --players-only` 构建。未使用会清空历史 dist 的普通 build。

本轮也运行过 `wardrobe-runtime.cjs`，但它读取旧的 `dist/game-ui.*`，**不计作本轮候选源码的证明**。当前衣柜依据上面的最终候选真机与新鲜 Source/原入口检查。

## 实际失败与归属

- 首次商店脚本预设的连衣裙已不在当前分类；分类变化原因 Unknown。没有派发该次选择；保留原失败视频，不把过时定位器当 UI 缺陷。
- 直接检查内部商品链接的中心命中失败。真实命中节点是原 `.div-link` 外壳的后代。改用已核对的原外壳执行，计数观察使用原 jQuery 事件；不改产品点击逻辑。
- 商品选择后原链接被重建，起初“原链接必须始终连接”断言失败。关闭商店适配的同场景对照仍会重建，原入口仍仅执行一次，证明不能把这项原行为判成 UI 替换节点。对照见 `shop-native-replacement-control.json`。
- 窄屏已有详情 Drawer，背景列表不能命中，保护正确阻止点击。按真实流程先返回列表，再选择；没有穿透遮挡强点。
- 恢复脚本一度遗漏局部 `select` 函数，失败记录保留为 `lifecycle-script-error.json`，归属执行脚本。
- 动效测试用固定短等待曾读到已结束并移除的代理；reduced-motion 事件也存在异步时序。检查改成创建时同步读取样式，并暂停测试动画后等待取消条件，避免以自然结束冒充取消。不改产品断言或通过重跑掩盖失败。

## 最终本地候选

分支 `research/stone-free-3.0-framework`，HEAD 仍为 `014f469f4092d246cdcd22098fc9b5a943d029b6`。既有未提交工作保留；本轮未提交、推送、合并、创建 Tag 或发布。

`candidate-v2/DoLGameUI-3.0.0-game-first.mod.zip`：217646 bytes。

- ZIP SHA-256：`4fb87e88a508785c7d6b05ebcc9d293f8f4286cbd3e29e62a4c46a945e29c099`
- index.js：`5478a72414ac7de87a6ce0fb181c431bc1d9c1957d3567bc674f4b0b6e7e4d08`
- style.css：`39a7efacffafeffef3490d88447079cd98e07673934373181a093dd469552069`

实际 Loader 的两个运行成员摘要已核对一致；仅替换测试 App 的 UI，未安装重新构建的 Host。Stable 2.7、其它 Mod 源码、私人长期存档及 GER 历史记录未操作。本轮只使用临时新游戏，不保存测试进度。

## 未覆盖与限制

- 未做手机物理触控或全部设备验收；390px 是平板 WebView 的受控尺寸，不是物理手机证据。
- 未重跑完整交易、战斗、存读档和社区组合矩阵。本轮商店没有购买或试穿；预览仍沿用原游戏，动效不承诺改变原预览的显示语义。
- 未测量真实 FPS，也未采集 Perfetto、bugreport 或 Full Evidence；没有观察到需要升级为性能专项的阻塞。
- 新增服装 Mod、极端滚动尺寸、更多 WebView 为 Additional coverage。
- **负责人视觉验收待定，不能据技术检查宣称表现力通过。** M2 战斗 B / 社交 / 特质 / 成就推广等待反馈。
