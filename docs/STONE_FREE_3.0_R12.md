# Stone Free R12：视觉体系回归与统一

2026-10-17。基于 R11 本地提交 `a86a285a190d6733fad93cb7a3490e3432342377`，分支 `research/stone-free-3.0-framework`。本轮范围是衣柜、商店及安全的战斗视觉调整，保留原业务与独立 Host。阶段范围已完成，仍是研究候选，不是正式 3.0 发布验收。没有推送、合并或正式发布。

## 真实 2.x 基线

已读取正式 2.7 的主题、社交、存档、设置、衣柜和商店源码，并在平板当前 2.7 安装打开真实设置页采样。该现场的 Ocean 为 `#8dc7ff`，Card 为 `#2d2e33`，系统字体栈为 `system-ui / -apple-system / Segoe UI`；Fancy 外壳为 `rgba(36,38,42,.74)`、轻白渐变、24px blur、22px 圆角。基础来源为 `src/theme/eyes.css:2` 和该文件现有 Acrylic 区域，不把最早的 `tokens.css` 紫色默认值或历史实底衣柜壳当作正式视觉身份。

真实采样：`tests/artifacts/stone-free-r12/baseline-27/settings.png` 与 `computed.json`。没有为了采样修改偏好、存档或 Mod 清单。

共同规则：外壳参与环境，阅读区稳定，内容卡片只亮半级；Ocean 用于选择、焦点和少量来源关联；保留原语义色和像素衣物图标。正文不逐卡模糊，普通按钮降低外壳，必要操作保持命中范围。比较用 A/B 实体与紧凑字段表达关系，原操作不因视觉运动而改变。

## R11 偏差归属

| 类别 | 实际来源 | 本轮处理 |
| --- | --- | --- |
| A 原宿主 | 原剧情、侧栏、商品说明、报价与原图标；桌面纯 HTML 服务缺图片 | 保留内容、原语义色与事件，不把资源缺失判成 UI 缺陷 |
| B 历史自有区域 | `src/wardrobe/style.css` 的实底 shell 和通用表单；`src/shop/style.css` 的旧工具区域 | 官方入口统一材质、分类、搜索、轻列表、穿戴摘要、按钮和密度 |
| C 新参考空间 | `src/wardrobe/reference.css` 独立蓝灰色与横排字段；R11 `Toolbar.vue` 顶部横线比较 | 衣柜改成同色系侧栏与字段块；商店用参考标签和详情中的双实体卡片 |
| D 兼容/回退 | 原版详情和未知入口、既有恢复锚点、未迁移的低频页 | 保留原入口和结构保护，不为本轮扩大业务接管 |

## Delivered

- `src/theme/stone-free.css` 只由 `framework/official-ui/main.ts` 引入，受官方生命周期标记和主题总开关约束。沿用 Eyes/Ocean 及现有视觉档位；退出恢复自己添加的标记。没有把样式加入 Host 合同。
- 衣柜的分类、轻列表、已穿着摘要、参考 A、B 来源行和比较字段使用同一套层级。宽容器继续共用自有侧栏，窄容器仍用边缘标签和底部面板。保持主按钮单击穿戴，未恢复浏览模式。
- 保留衣柜的取出、暂存、比较、差异揭示和归位路径；当前 B 的来源行有弱 Ocean 关联。中断、来源失效、焦点恢复、查询和滚动保持继续使用已有合同。
- 商店新增 `ShopReference.vue`，顶部保留紧凑 A 标签及操作；比较节点通过 Teleport 进入自有详情挂载点，没有为比较再搬动原商品节点。比较位于详情顶部，窄屏打开详情，关闭后返回浏览并保留 A。A 标签从已选商品展开，比较从实际操作位置展开/收束；主题或系统撤销动态效果会结束视觉转场。
- 原商品 Source、价格文字、颜色、购买防陈旧绑定和按需分页未重写。A/B 仅是显示快照，没有价格推断、试穿、购买或库存写入。
- 战斗仅调整自有组、Dock 与工具按钮的轻表面，不增加会移动动作命中区域的动画。设置、社交和存档继续使用既有正式主题，未逐页重构。
- 大表面通过装饰伪元素承载 blur，避免把固定操作的祖先变成新的滤镜 containing block。卡片不单独 blur；关闭玻璃或不支持时保留实底降级。
- Host、连接器、公共协议、UI API v1、游戏状态及存档模块均未改。官方候选为 `3.0.0-lab.12`，配对 Host `0.1.1-experimental`。独立 Wardrobe Reference 未使用本轮官方参照组件，继续保留原版本，不要求与官方 UI 同装。

## Validated

### 源码与定向组件

`npm run typecheck`、`npm run framework:check`、`npm run lab:check` 通过。Lab fixture 已同步新增展示参数。研究入口和经典入口均由现有工具链构建，没有新增依赖。

- `tests/wardrobe-reference-panel.cjs`：40 条目组件，参照/比较/关闭、原列表滚动与焦点、快速中断、来源过期、减少动态效果和释放。收据 `tests/artifacts/stone-free-r12/panel-1792223911319/result.json`。属于组件证明。
- `tests/shop-stone-free.cjs`：冻结显示投影、详情挂载、关闭保留 A、焦点、主题与系统动效门槛、场景失效、原节点身份/父级/兄弟恢复、重入和经典无参考路径。
- `tests/combat-stone-free.cjs`：原 radio 身份、一次原事件、原继续链接、场景释放/重入和经典路径；应用本轮主题，选择前后实际按钮坐标保持不变。截图在 `tests/artifacts/stone-free-r12/combat-1792223346692/combat-theme.png`。不代表真实战斗结算。
- `tests/shop-pagination-package.test.cjs`：共享四项原补丁、早期入口默认关闭、严格布尔与重复初始化。包体审计另逐字节核对经典包与研究包的早期脚本及四项替换资源。

### 真实游戏与布局

使用 `tests/framework-official-r12.cjs`，实际 Loader 导入并重载本轮 ZIP。Windows 为 Edge 156、原 DoL 0.5.12.13 HTML、ModLoader 2.101.1；Android 为 M367FC（0509B830099C3540），独立包 `com.vrelnir.dol.lyra.uicompat051213`，Android 17 / Chromium WebView 154.0.8037.58，CSS 视口 1363×876。通过已安装 Paisley Park 6.1.0 的 resolver、Doctor、WebView binding、web-click/web-input/restart 完成现场流程；Windows 继续使用项目 Playwright。

衣柜沿原 Start → Start2 → Orphanage Intro → Bedroom → Wardrobe 导航。两端完成固定、继续浏览、普通/空间比较同字段、关闭、查询与焦点保持、自然离开清理、再进入、Hub 公共视图及官方消费者释放。Windows 新测试游戏补验原穿戴，原 worn 字段与目标衣物一致。比较前后库存/穿搭摘要相同。

商店经已初始化的新测试游戏的原 Engine 准备 Clothing Shop，再点击原 View All、原可见商品容器。两端完成固定 A、选择 B、详情比较、关闭保留 A、再次比较和原分页；原金钱和衣柜摘要未变化。没有派发购买或试穿，不能当作交易验收。

Windows 另验 390×844 受控窄屏、reduced motion；商店比较进入可关闭的 Drawer，关闭回浏览，真实命中检查通过。宽屏衣柜比较列与列表无交叠。它们是浏览器输入/布局证明，不称物理手机触控或 IME 证明。

计算样式与 2.7 来源一致：Ocean `#8dc7ff`、轻卡片 `rgb(45,46,51)`、卡片无 blur；外壳装饰层 blur24px、圆角22px。测试新偏好使用 Balanced（.78），真实基线为 Fancy（.74），属于同一档位体系，不声称截图逐像素相同。

消费者退出后原衣柜恢复，NativeStatus 同伴仍可读取。新鲜经典 2.7 构建仍是 API v1，无官方 Host participant、无参照按钮、无 `data-stone-free` 样式/标记。未机械重跑未改的 R9 依赖负例。

最终收据：

- Windows：`tests/artifacts/stone-free-r12/desktop-1792223899345/result.json`，passed。
- Android：`tests/artifacts/stone-free-r12/android-1792223911325/result.json`，passed。
- Android 原 Mod/隐藏清单与 UI 偏好重启读回：同目录 `restore-verification.json`，passed。已恢复入场组合，未操作正式 App 或私人存档。
- 包体：`tests/artifacts/stone-free-r12/package-audit.json`。不装入运行 ZIP。

## 视觉证据

R11 对照：`tests/artifacts/stone-free-r11/desktop-1792220922055/`。本轮真实 Android 的 `spatial-comparison.png`、`shop-selected.png`、`shop-comparison.png` 位于上述 Android 目录；Windows 的 `narrow-comparison.png`、`shop-narrow-comparison.png` 位于最终 Windows 目录。

截图用于展示实际界面。没有用户研究或点击耗时测量，不宣称已证明操作更快。NativeStatus 的独立速览入口为同伴消费者，不属于官方比较区域；没有为截漂亮图而隐藏它。

## 失败与修正

第一次 Windows 流程通过后，视觉检查发现比较区排在长预览下方，不易看到；修为详情顶部的自有挂载点，再完成 Windows/Android 检查。保留最初收据 `desktop-1792223191844`。

一次窄屏脚本尝试点击已展开详情遮罩后方的顶部比较按钮而超时。实际 Drawer 已因宽屏选择状态而打开；改为观察展开状态后检查详情中的真实关闭按钮，未 force-click，未扩大视口绕过。失败收据 `desktop-1792223318913` 保留，属于项目验证路径问题，不认定 Tools 或 UI 按钮失效。

动效定向测试还发现撤销主题动态效果后动画仍运行：HTML 实际属性名是小写 `data-dgu-visualmotion`，观察器却过滤了混合大小写名称。已修正两处参考区观察器。衣柜原布局回调还会把自身内容的高度变化作为中断，现只在宽度、视口或实际滚动变化时取消。定向测试确认转场确实开始、撤销动态效果后清理、之后功能仍可用；红色收据 `motion-withdrawal-before.json` 与 `panel-1792223802284/result.json` 保留。

Lab 首次类型检查暴露展示 fixture 缺少新的比较目标/来源参数；已补齐。初始游戏通用 Event 异常及一次原列表刷新警告的根因仍 Unknown，与 R11 同类现象相符；本轮参考操作没有新增 page exception，不宣称全游戏日志无错。

## Not validated / Known limitations

没有验证物理手机、IME、其它 WebView/游戏版本、全部第三方组合、真实交易/真实战斗回合或长期性能。桌面只服务编译 HTML，部分原图片缺失；Android 物品图可见，但不声称所有渲染资源均验证。新默认卧室没有可用的 Home Masturbation 入口，因此战斗为本轮主题/原控件组件证明，沿用 R11 的覆盖边界。

原语义色、未知内容入口和原版回退继续存在；低频页面没有全部迁移为 Host 消费者。没有新增 SDK、Factory、通用输入路由、业务状态系统或性能采集平台。

## 制品身份

| 制品 | 字节 | SHA-256 |
| --- | ---: | --- |
| DoLGameUI-3.0.0-lab.12.mod.zip | 179430 | `466b4863217bb1d3ad8378a8119cc353097e2a51bcd1250497f6582fd1d7f1f5` |
| StoneFreeHost-0.1.1-experimental.mod.zip | 11224 | `7f393f438111a2679d329e3301ba6b7456e88a21a3ac606da2bc995d2815902c` |

Host 与 R11 字节相同；可选 MotionHub 0.1.2 也未变化。官方 ZIP 包含现有早期脚本、四项补丁、声明与许可证，不含截图、测试收据、APK 或存档。Windows/Android 加载的 U 摘要均为本表值。

本轮完成的是约定的视觉统一与代表性交互闭环。正式发行仍需单独授权和对应范围决策，不因本轮通过自动发布。
