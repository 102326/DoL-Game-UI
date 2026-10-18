# Kraft Work 3.0：特质与成就专项结果

2026-10-18。展示层实现、构建和代表性验证已完成；**Visual Gate 继续 Blocked，等待负责人判断实际视觉效果**。以下布局是 Codex 提出的实现方案，不能理解为负责人已批准的新基线。第二轮成果保留，未推送、合并或发布。

## 特质专项

窗口变小的原因已确认：`src/panels/style.css` 的 Traits 专属规则明确设置 `width:min(840px,100%)`、`height:auto`，内容区使用 `flex:0 1 auto`；既有测试也要求单特质窗口收缩。它覆盖了通用角色窗口的 1000px／800px 布局。这是旧内容自适应设计造成的比例问题，没有证据表明数据错误或 viewport 测量失效。

在同一平板、同一新开临时游戏的卧室背景下，整改前实测 840×365.35px，整改后 1000×560px。仅有一项真实“童贞”特质，前后数量、名称和描述相同。没有为填充页面添加特质。

新布局与角色信息页同宽，少量内容保留较短高度，大量内容受窗口最大高度约束，在正文区滚动。工具区减少上下内边距，分组选择器不再占据过长横条；原过滤入口缩为轻量按钮，展开后仍是原输入、格式选择和更新／清除操作。正文使用更轻的底层，分类标题、数量和特质卡片形成层级。

网格使用 auto-fill，单张卡片只占一列，避免拉成全宽灰色条；窄屏自然为单列。原节点、父子关系、事件和未知附加内容保留，不引入 Vue 特质数据副本。

真实设备验证了一项特质、过滤展开／收起和四次原版关闭／重开。多量布局使用**独立浏览器中的渲染夹具**验证 41 项条目与 hidden 语义，没有向 Android 或游戏变量写入模拟条目。真实多特质角色属于未覆盖范围。

## 成就专项

原卡片墙主要来自两层叠加：共享 Eyes 样式为正文添加 .78 的阅读底层，同时把每张成就设为不透明 `#292b30`；`src/panels/style.css` 的最小 300px 网格在平板正文宽度下形成三列。徽章、说明和日期的排版重量接近，历史日期没有明显的次要层级。这是展示样式问题，未修改成就业务。

新布局在本次平板宽度下为双列，窄视口为单列：

- 左侧独立徽章区域，使用低亮度材质衬托原徽章，不追加 blur 或持续发光。
- 名称使用较清楚的字重，说明保持自然换行；日期更小、较弱，并以细分隔线区分历史信息。
- 卡片与外部滚动层分别承载，减少连续实底灰板的感觉。
- 原 `.featCoin`、暗色历史徽章和 `.dot` 保持原有语义；未解锁占位采用较轻虚线边界，不揭示原版隐藏名称或条件，不自行生成解锁标记。
- 原标题语义色、徽章内联 filter、日期文本、筛选和排序回调均保留。当前真实列表的暗色历史徽章已验证；未解锁占位仅在独立夹具中覆盖，没有人为改写真实解锁状态。

卡片进入使用 480ms 的位移与轻缩放，鼠标悬停时轻微浮起。带未知可交互控件的卡片不参与位移动效，避免控件在指针下移动。关闭窗口时动画停止；关闭动画或系统 reduced motion 时使用静态呈现。没有新增运行库、监听器或 Runtime 合同。

## Android 前后对照与动态证据

证据目录为 `tests/artifacts/kraft-work-round3-20261018/`，本地资料不自动进入发行附件。本轮前后均为实际 Android 截图，**没有旧样式临时回放**。成就卡片前后使用相同的列表跳转位置，数据数量为 31；Stats 分组另外验证了 22 项。

| 页面 | 整改前 | 整改后 |
| --- | --- | --- |
| 特质 | [原窗口](../tests/artifacts/kraft-work-round3-20261018/01-traits-before.native.png) | [新布局](../tests/artifacts/kraft-work-round3-20261018/04-traits-after.native.png) |
| 成就 | [原三列卡片](../tests/artifacts/kraft-work-round3-20261018/03-feat-collection-before.native.png) | [新双列陈列](../tests/artifacts/kraft-work-round3-20261018/05-feats-after.native.png) |

- [20 秒 Android 实录](../tests/artifacts/kraft-work-round3-20261018/traits-and-feats.native.mp4)：特质过滤、成就进入、悬停、滚动、跳转和重复开关。操作由 CDP 控制，视频来自原生 screenrecord，不是物理手指触控证明。另抽查了 2／8／15 秒画面。
- 受控窄视口：[特质](../tests/artifacts/kraft-work-round3-20261018/06-traits-narrow-controlled.native.png)、[成就](../tests/artifacts/kraft-work-round3-20261018/07-feats-narrow-controlled.native.png)。这是平板 WebView 的 390×844 視口，不冒充手机验收。
- 当前候选的视觉锚点：[属性](../tests/artifacts/kraft-work-round3-20261018/08-attributes-anchor.native.png)、[社交](../tests/artifacts/kraft-work-round3-20261018/09-social-anchor.native.png)。商店和设置源码未变，继续对照[第二轮商店](../tests/artifacts/kraft-work-round2-20261018/16-shop-after-material-recipe.native.png)及[第二轮设置](../tests/artifacts/kraft-work-round2-20261018/19-settings-final-pages.native.png)，不重复包装为本轮新验收。

## Validated

工作区 `experiments/stone-free-framework-30`，分支 `research/stone-free-3.0-framework`，HEAD 仍为 `014f469f4092d246cdcd22098fc9b5a943d029b6`，保留既有未提交工作。本轮运行源码只增加 `src/theme/kraft-work-pages.css` 的两页样式；新增 `tests/kraft-work-collections.cjs`，没有改动游戏数据、公共 API、Host 或经典 2.7 样式入口。

设备 M367FC／0509B830099C3540，Android 17，WebView Chrome 154.0.8037.58；授权独立 App `com.vrelnir.dol.lyra.uicompat051213`，DoL 0.5.12.13，Host 0.1.4-experimental。截图显示 MapleBirch 5.4.3 和 CE rebuild.30；这些是现场组合，不代表所有版本兼容。未安装新 Host。

本地候选包 `DoLGameUI-3.0.0-kraft-work-r3.mod.zip`，207456 bytes，SHA-256 `fbed0d27a085321f38322b4ea98ad7b89a807ad57c13a3f7c91c88858797491d`。实际 Loader 成员与构建一致：

- JS：`08e49434632fbd910545e59ec52aadc9cb07cea88e846e98eafe14b82754e057`，与第二轮相同。
- CSS：`2dbf01dd08d2a9e5fdc4e4408d5f3744934b584d24b251f1c313a80b41620139`。

通过的检查：

- 现有 Framework 构建和玩家打包；第二轮 typecheck 证据适用于未变的 TS／Vue 源码，没有为纯 CSS 再跑全套业务测试。
- `kraft-work-collections.cjs`：少量／大量渲染布局、原节点与操作、hidden、长文字、历史徽章 filter、未解锁提示保留、窄屏、交互控件不位移、减少动态效果与关闭清理。
- `panels-framework.cjs`：原覆盖层与 Passage 生命周期、替换、释放、回退及经典入口。
- `kraft-work-materials.cjs`：属性顶部未变、社交原节点和第三方边界、商店 Drawer 命中和玻璃回退。
- Android：特质四次重开后仍为一项内容和一个自有工具栏；同一实例开关玻璃不替换原节点。390×844 与 844×390 下无正文横向溢出、关闭按钮可命中。
- Android：原生筛选 General→Stats→General，恢复原排序 None；长距离滚动约 2249px，分组跳转定位到内容顶部下方 12px，原“回到顶部”按钮返回 scrollTop=0。成就窄屏单列，日期为 12px CSS 字号；最终 UI 偏好逐项恢复。
- Android：关闭动画、系统 reduced motion、关闭窗口时均没有运行中的自有卡片动画。关闭时自有工具栏被释放，录屏记录了快速开关。

没有手动改写游戏变量、伪造成就、触发购买或调用存档读写／删除／云端接口。场景通过原版新开流程进入，没有加载长期玩家槽位。前后抽取的一项特质及前三项成就原始 HTML 相同，包括日期和徽章信息；这项抽查不包装为全游戏状态审计。

## 已知限制、失败记录与验收边界

未覆盖真实多特质角色、实际未解锁成就的现场样本、物理手机、全部第三方结构、长时间内存或实际呈现帧时间。当前没有逐卡模糊或常驻卡片动画；短录屏和关闭后动画为零不能证明长期性能完全通过。第二轮整 App 内存阶段差异仍未归因，本轮没有据此删减已认可动效，也没有重复进行无关的重型性能采集。

本轮没有发现明确的范围内 UI 行为缺陷。调查脚本有三项失败，JSON 均保留：入场已回到 Start，原侧栏尚不存在；跨原版关闭重开错误要求旧节点一直连接；把 -1 写入无此选项的跳转 select，错误代替“回到顶部”按钮。它们是现场前提／测试合同问题，没有据此修改产品代码或判断 Paisley Park 缺陷。修正后只接续未完成检查，复用此前已通过的窄视口、筛选和滚动证据。

使用已安装 Paisley Park 6.1.0 White Snake 的 execution-context、Action、CDP 与现有 ADB。没有下载工具、重建环境、调用 GER、清理历史 Store 或新建 Full Evidence。若将本轮经验反馈给工具项目，重点是区分“换皮保留同一实例节点”和“原游戏主动重新渲染”，以及选择器必须对应真实可用动作；不需要改造通用 Runtime。

目前可供负责人验收的具体问题是：特质 1000×560 的少量内容比例是否舒适；成就双列的陈列密度和 12px 窄屏日期是否合适；两页的透感与属性、社交是否协调。**实现与代表性验证完成，不等于视觉批准；Visual Gate 保持 Blocked。**
