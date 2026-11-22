# Soft & Wet 5.0 · Windows 首轮研究

基线为 v4.5.1（`d643674`）。本机八个发行 ZIP 的 SHA-256 与 GitHub 发行附件逐一匹配。下列代码均在原型目录；玩家包继续使用既有入口。

## 试用

从仓库根目录运行 `npx vite --host 127.0.0.1`，在控制台给出的地址后加上下列路径。两页均使用中性内容。

| 页面 | 可以试什么 |
| --- | --- |
| `/prototypes/host5/effects/` | 点 Rain 后马上点 Snow，在效果未停时切页。抓住浮层手柄来回拖动，松手后在回弹途中再次抓住。收起面板后，背景仍响应天气。 |
| `/prototypes/host5/sidebar/` | 点 Enable layout，操作已有的模拟 Mod 按钮，再点 Disable layout。可观察布局改变及原按钮的计数。 |

## #41 · 谁控制画面，谁释放资源

天气提供者持有目标天气和一份粒子种子几何。消费者分别取得租约，最后一个画面退出才释放这份几何。每个 Host 挂载自行持有颜色过渡、绘制层和指针捕获。交互开始时从屏幕上当前的变换取值，将位置控制权从 WAAPI 交给指针；松手再交还给回弹。切换场景会撤销上一代指针，保留当前画面，再按新目标继续。颜色由 WAAPI 推进，降水层由自己的绘制回调推进。减少动态时降水定格。

**独立接入。** 使用发行版 StoneFreeHost、现有独立工作台 StoneFreeWorkspace、提供能力的 Host5Atmosphere 和使用能力的 Host5Observatory 四个 ZIP。Windows Edge 中性页按各包 boot 清单加载真实脚本和样式。观测台只调用 Host 的命令和视图，未安装 DoLGameUI。工作台直接挂载一份画面，观测台在自己的视图中再挂一份。隐藏第一份后，第二份仍可切雨；恢复、关闭和重开后各有正确的当前画面，焦点回到工作台入口，Host 诊断错误为零。该检查未经过游戏 ModLoader 的导入流程。[打包和复验](workspace-weather/README.md)

**等画面对照。** Edge 159、480 × 240、DPR 1，固定 36 个雨点与 36 片雪、相同位置和混合权重，分四个新页面按 Canvas / SVG / SVG / Canvas 顺序采样。固定帧两边各有 2,754 个前景像素，没有像素的任一通道相差超过 24。每窗 60 次采样，绘制调用的 JS 提交时间 P95 分别约 0.1 / 0.2 / 0.2 / 0.1 ms。绘制层 DOM 分别有 1 和 75 个节点；整页 JS 堆快照约 1.79–1.80 MB 和 2.08–2.09 MB。四窗共 240 个 rAF 间隔中没有超过 50 ms 的样本。首轮像素工具缺少 Pillow，现直接在浏览器解码截图。此项只测中性页与一种图案，不能据此判定游戏帧时、触屏输入延迟、GPU 内存或最终后端。[复跑脚本](compare.mts)

本轮采用 GSAP context 所示的按所有者回收思路，原型把释放登记在已有 Host 挂载上。共享素材可以缓存，卸载时机取决于还有哪些消费者在用。若引入视频，会按视频提交帧回调接入，不强制跟随粒子时钟。尚未选择 Pixi 或视频后端。[GSAP context](https://gsap.com/docs/v3/GSAP/gsap.context%28%29/) · [PixiJS 资源缓存与卸载](https://pixijs.com/8.x/guides/components/assets) · [视频帧回调](https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement/requestVideoFrameCallback)

## #42 · 宏渲染与活节点是两条边界

固定 DoL 0.5.12.13 / Loader 2.101.1 HTML 中，SugarCube 创建侧栏外壳；UIBar 更新时将 StoryCaption 渲染到 `#story-caption`。原作者 CE 1.20.4 的规则在这份原文中唯一命中并插入条件宏。维护版 rebuild.30 的同一替换只保留原条件。两份包的注入证据各自独立。

原型只认领外层布局。它在已有节点上加自己的样式标记，关闭时撤掉；原节点、已注册事件和宏输出归原作者。中性浏览器页加载了哈希固定的 rebuild.30 侧栏 JS，用受控的 Macro、状态和 jQuery 接口执行其真实 CEstatebox 处理函数。接管前、接管中与退出后各点击一次，真实按钮状态按预期改变。切换布局期间宏只运行一次，焦点和当时的按钮对象保持。还验证了节点替换、竞争、失效句柄和不支持的外壳回退。原作者规则是静态替换验证，尚未走真实 Loader。[输入身份、复验与边界](sidebar/README.md)

## 接续判断

后续的[真实 Loader 核对](REAL-LOADER.md)已覆盖独立分包导入、工作台替换、侧栏折叠、真实切页和原作者 CE 状态栏按钮。可选的 CE 菜单图标仍缺启用该入口的真实配置。特效下一轮应选择一种确有美术价值的效果，对照现有后端与 GPU 或预渲染路径，并测真实输入到显示。工作台现支持[退场中反向与降级](REAL-LOADER.md#关闭中途重开)，Windows 已验。视频解码和 Android 表现待验。Host 只管理 UI 能力和相关资源，Mod 调度及底层性能工作沿用各项目的归属。

全目录严格类型检查可运行 `npx tsc -p prototypes/host5/tsconfig.json`。另有[特效定向检查](effects/README.md)及[侧栏定向检查](sidebar/README.md)。研究记录沿用 [#41](https://github.com/102326/DoL-Game-UI/issues/41) 和 [#42](https://github.com/102326/DoL-Game-UI/issues/42)。
