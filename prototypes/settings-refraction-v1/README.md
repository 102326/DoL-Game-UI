# #22 / SW31-SETTINGS-RF-02 — 界面设置折光原型 V2.1（开关微调）

2026-10-21。负责人认可折光/层叠设计方向，要求打开、关闭及分类切换接近旧版速度；**负责人已确认V2设计通过（实现e018f5e），随后要求开关再稍快一点；当前V2.1待观看确认**。范围仅界面设置；不推广其它窗口、不合并main、不改Tag/正式制品、不发布。当前工作分支 `prototype/golden-spin-b`。

## 当前微调

V2.1只将打开560→500ms、关闭300→260ms（分别缩短约11%/13%）。分类进入620ms/退出300ms、折光形态、层次、运动路径和中断处理不变，正文约438ms可操作。默认与`?revision=v2.1`为本轮微调；`?revision=v2`保留已认可版，`?revision=v1`保留原始慢版。原V2媒体及摘要不覆盖。

本轮[桌面对照](../../docs/media/settings-refraction-v2-fast/settings-refraction-v2-fast-desktop-1x.mp4)、[窄屏对照](../../docs/media/settings-refraction-v2-fast/settings-refraction-v2-fast-narrow-1x.mp4)及[验证摘要](../../docs/media/settings-refraction-v2-fast/validation.json)独立保存，仍为与公开3.0.4的同操作、同视口、原速对照。下面V2参数与录像是已认可版的历史记录。

## 已认可V2的证据

- [桌面原速并排](../../docs/media/settings-refraction-v2/settings-refraction-v2-desktop-1x.mp4)：两侧内部均为1280×900 CSS px。
- [窄屏原速并排](../../docs/media/settings-refraction-v2/settings-refraction-v2-narrow-1x.mp4)：两侧内部均为390×844 CSS px。
- [实际检查和录像摘要](../../docs/media/settings-refraction-v2/validation.json)。每组同一浏览器、DPR1、页面缩放100%，左旧右新；视频未变速、未剪掉等待。外层容器显示缩放不改变内部视口。模拟窄屏不是Android/iOS实机验收。

窗口从入口反馈和光脊开始，由后层、玻璃面、标题/导航及正文依次展开；分类有方向地翻折交接；关闭反向收束，关闭中重开继续当前时间线，不从起点重播。保留3.x黑灰Acrylic和局部彩色控件，不把已有球体回旋直接复制到窗口。

本版保留V1的形态、层次、位移与裁切路径，调整实际运行时节奏；不是把录好的视频加速。首开正文约491ms后解除inert，完整打开560ms；关闭300ms，分类进入620ms/旧页退出300ms。中途关闭按当前进度回收，反向重开恢复打开速率。输入反馈、减少动态和卸载约束保留。

| 动作 | 旧正式版3.0.4代码时长 | V1 | V2 |
| --- | --- | --- | --- |
| 完整打开 | 560ms | 1300ms | 560ms |
| 完整关闭 | 300ms | 1300ms | 300ms |
| 分类进入 | 620ms | 830ms | 620ms |
| 分类退出 | 620ms | 420ms | 300ms（与进入交叠） |

这是负责人针对本窗口的节奏修订，不把它设为全部特效统一上限。[V1原速录像](../../docs/media/settings-refraction-v1/settings-refraction-desktop-1x.mp4)与旧证据原样保留。实验目录沿用settings-refraction-v1避免破坏既有入口；`?revision=v2`为已认可V2，默认改为上述V2.1，`?revision=v1`为V1慢版参考。未改变共同源码冻结身份。

## 冻结身份和隔离

旧版从公开 `v3.0.4` 对应源码 `915dcb9e85f3266a73a3e7ce38d769edd0c29ff4` 重建真实设置控制器、Vue组件、依赖和样式，不以b507冒充旧正式版。它是受控源码重建，不是注入完整游戏后的录像。

候选以 `b507f1a7d18d4d77067fa0c793aea44d7de96b57` 为基础，在Git忽略的 `tests/artifacts/settings-refraction-v1/new` 生成副本，仅替换设置控制器的打开/关闭和设置页分类过渡。生成脚本使用固定源码锚点，锚点失配直接报错；逐文件摘要写入`provenance.json`。正式`src/`、`framework/`没有修改。

复用已安装的GSAP3.15时间线，以`play()/reverse()`延续当前进度，未新增依赖、动画平台或AI服务。隐藏页、动画偏好、减少动态、缩放换算、卸载清理保留并针对候选验证；既有sourceMotion的其它调用方保持原代码。GSAP/Vue许可和声明见[已有原型声明](../golden-spin-b/THIRD_PARTY_NOTICES.md)，静态验收包保留其声明和项目LICENSE。

## 本机运行

```sh
npm ci
# 若浅克隆缺少冻结对象，先获取这两个固定提交；不可静默改用main。
git fetch --no-tags --depth=1 origin 915dcb9e85f3266a73a3e7ce38d769edd0c29ff4 b507f1a7d18d4d77067fa0c793aea44d7de96b57
node scripts/prepare-settings-refraction.mjs
npx vite --config vite.settings-refraction.config.ts
```

默认本机预览端口5185；首页可选桌面/窄屏并重放同操作，候选也可单独手动操作。手动操作设置会保存到该本机预览来源的浏览器localStorage，复测初始状态时使用新的浏览器上下文，勿与个人游戏来源混用。

## 验证与录像

```sh
npx vue-tsc --noEmit -p tsconfig.settings-refraction.json
npx vite build --config vite.settings-refraction.config.ts
node scripts/check-settings-refraction.cjs
# 额外制作原速录像；本机需ffmpeg、ffprobe，CI默认不录制。
node scripts/check-settings-refraction.cjs --record
```

检查实际静态构建：冻结身份；两种视口的modal、几何/溢出/按钮命中、真实偏好输入、Escape与焦点恢复；快速切换终态；展开中关闭/反向的几何连续性；减少动态/关闭动画/隐藏页；中途卸载及重挂载偏好；旋转/125%页面缩放。13组检查，细节以摘要为准。新增检查实际测量同环境旧/新打开、关闭和分类终态时间；V1会因明显超时被拒绝，180ms额外容差仅用于录制/调度波动，不能让1.3秒慢版通过。反向连续性按四角坐标验证，允许1/64 CSS px的布局量化误差；旧字符串相等会对0.0001px浮点差异误报。它不测试所有游戏业务，不宣布性能提升，不以检查通过替代视觉验收。

对照共12次操作，使用同一个墙钟计划：首次打开，材质→入口→阅读，160ms间隔连续三次切换，关闭；再次打开300ms后关闭，160ms后反向重开，最后关闭。两侧使用同一HTTP端口的127.0.0.1/localhost两份本机来源；录制Chromium启用站点进程隔离，避免一侧布局阻塞另一侧操作接收。消息只接受已知本机父页面、相同协议/端口与精确来源；仍保存实际投递偏差并执行80ms上限，不扩大阈值制造通过。操作通过受控父页面消息调用真实控件/设置控制器；鼠标命中和真实偏好操作另由浏览器检查覆盖。视频中的正常与打断操作均保留原速。

未完成：V2.1微调的负责人观看确认、实际游戏/ModLoader整合、Windows/Android/iOS/WebView/真实触摸性能和兼容。未制作其它窗口候选，也未把这一版参数推广到共享正式动效。V2设计已通过，V2.1仅等待本次速度反馈；不从视觉认可推断实际游戏整合或推广授权。
