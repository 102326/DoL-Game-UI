# EVO-INT-SNOW01：实际设置霜羽研发候选

2026-10-23，输入 `7d531a0b09c89c3cfe59659437834f40d995f4d9`，研发分支 `dev/evolution-4.0`。开工clean、origin一致，复用现有独立worktree。负责人倾向 R11 A「霜羽」后明确继续下一步，本片据此推进实际研发设置雪效；**倾向A、候选接线、整体视觉验收是不同状态**。其它窗口、main、Release、正式版本与Host/API不扩展。

## 已完成

| 编号 | 实际变化 | 范围 |
| --- | --- | --- |
| EVO-INT-SNOW01 | settingsWeather显式选择featherSnow，共用原weatherSurface/wetGlass所有权 | 实际研究设置入口；不是完整游戏/设备或全局G2通过 |
| EVO-SNOW-SHARED | R11雪材质迁入内部src/ui/weather/snow-material，原研究路径为薄导出 | 原算法、种子、参数和快照保持；B仍只由研究入口选择，没有新增玩家开关 |
| EVO-SNOW-REGRESSION | 原W01九组中的真实像素组增加稳定雪天、实际A选择、冰晶/散雪和有限边界 | 沿用原必需入口/组名，不扩默认设备或浏览器矩阵 |
| EVO-SNOW-REFERENCE | 手动冻结7d531a0研究源码，48组栅格及状态逐字节对照；旧/新实际设置DPR1/2对照 | 明确输出PASS/FAIL，保护正文/关闭、雨天整窗相同、雪天确实变化 |
| EVO-SNOW-REVIEW | 实际源码桌面/窄屏原速录像、预览天气按钮与Alt+1/2/3 | 只在研究页操作天气；玩家设置没有研究工具条或快捷键 |

不改设置V2.3开100/关80ms、分类620ms、C5.2/R10雨滴/稀疏斜雨/四档/转场和Hub/球体。wetGlass默认frostSurface仍保留；原生其它窗口与研究现行雪效继续其旧路径，没有删仍有消费者的CSS/SVG。没有第二时钟、轮询、新依赖或新Runtime。

## 验证与证据

本机macOS / Node24.18.0 / Chromium153.0.8010.12 / Python3.9.6。以下均实际完成：

- `npx vue-tsc --noEmit -p tsconfig.evolution.json`、`npm run ci:check`、`node scripts/build-framework.mjs`：通过研究类型、项目类型/Framework合同及生产构建。
- `node tests/evolution-snow-integration.cjs`：48组固定360×640/940×760、DPR1/2、四档连续雪参数和三时点的R11栅格/状态一致；另在1280×900/DPR1、390×844/DPR2对照旧/新真实设置，4条表面记录中雨天整窗相同、雪天不同，阅读/关闭按钮像素不变、无页面横向溢出，关闭后原正文按钮可操作。
- `node tests/settings-ci.cjs`：按正式CI顺序单独诊断运行通过，包括原双布局、长滚动、真实模态隔离/键盘、偏好持久化、分类中断、资源归零、S01五组、W01九组及原迟初始化材质宿主的真实阅读像素拒绝。W01新增稳定雪天实际A/可见性/保护/有限坐标；原缩放、零尺寸、隐藏/inert、减少动态、重建、构造/清理故障约束保留。原成功组名保留以维持既有CI身份合同，未随意重命名检查。
- `node tests/evolution-weather-integration.cjs --legacy-snow`：精确回注7d531a0的旧设置选择，前三组通过，在稳定雪天的“actual settings must select R11 feather snow”断言退出1。包装检查确认此为预期拒绝；它证明缺接线可被检出，不称旧雪效是历史产品缺陷。最初尚未接线的真实工作区同样先被此断言拒绝，当前接线通过。
- `node tests/header-weather.cjs`：原生六种材质、共享状态、天气字段、原生动作和资源退出通过。
- `node --test tests/evolution-rain-model.test.cjs tests/evolution-scattered-shower.test.cjs`：9项模型/档位/确定性/有限边界检查通过。
- `node tests/evolution-snow-study.cjs`：搬迁后现行/A/B、实际研究设置及24条角色几何/溢出/生命周期检查通过，历史媒体未覆盖或改标身份。
- 独立静态复审未发现阻断项；复审未运行测试，不冒充第二次执行证据。[当前手动证据和旧接线反例](EVO-INT-SNOW01-CHECKS.json)保留本机环境、输入HEAD/dirty、原始摘要与实际栅格记录。

首次将三个Vite夹具并行启动时，settings-ci在等待window.theme的初始化前置条件超时，不能计为通过。随后带模块/控制台/网络诊断按现有CI顺序单独执行，完整套件通过，未记录加载错误。各旧夹具共享默认Vite优化缓存且插件hash不同，是有依据的风险，但此次超时原因**尚未证实**；没有靠放宽断言或延长固定sleep制造绿色，也未为此修改Runner/CI平台。新设置预览服务器各自使用忽略目录内独立优化缓存，避免它们互相或与原夹具失效；其手动对照在最终缓存设置下重新通过。后续并行测试若再现，应先保留HTTP错误/初始化现场，再由CI专项处理。

预览快捷键首轮被真实设置的keydown事件隔离挡住；仅在研究页改捕获监听后，手动旧/新实际表面测试均通过。玩家模态边界及键盘代码没有修改。

## 原速观看与媒体

启动 `node scripts/build-framework.mjs` 后，以 `scripts/preview-evolution-settings.mjs` 的createSettingsPreviewServer启动本机预览。当前页 `http://127.0.0.1:5196/?weather=snow` 可打开真实设置；关闭后点击晴/雨/雪按钮，或打开时Alt+1/2/3切换受控天气（Mac为Option）。这些输入仅在研究页，均不读取游戏/存档。

`node scripts/record-evolution-settings.cjs --snow`复用原脚本输出独立的 [桌面22.20秒原速录像](../media/evolution-snow-s01/desktop-1x.mp4) / [窄屏21.92秒原速录像](../media/evolution-snow-s01/narrow-1x.mp4)，1280×900、390×844，DPR1、25fps编码。包含真实打开/稳定雪天、偏好与分类操作、雨雪中途反向、关闭正文恢复、重开与Escape；等待完整保留，不加速。不假称这两段是冻结旧/新同画面或触控实机对照。

[媒体记录](../media/evolution-snow-s01/result.json)含26项明确源码/CSS输入摘要、事件、终态及环境；这是限定录制输入表，不是全仓/全部传递依赖审计。[媒体清单](../media/evolution-snow-s01/manifest.json)逐项记录实际大小/SHA256；6个文件含清单共 **2,996,909字节**，12MiB硬上限、超限失败不截断。原S01/W01/R11媒体保持原身份。没有玩家存档、凭据、完整游戏HTML或大段原始日志。

原型和实际窗口的底材/保护区/工具条不同，48组证明的是同参数雪效栅格，不等于整窗画面相同。实际预览忠实保留S01底材：在其半透明背景下会透出后方页面文字。本片没有隐藏背景来美化截图；旧/新雨天整窗一致支持该现象为继承状态。**正文像素在晴雨雪间不变，不代表背景干扰/整体可读性质感已验收。** 后续应单列底材文字干扰处理，与其它角色方案及负责人视觉裁决一起推进。

## 交付与下一步

最终研发提交与两套实际Actions链接/结果见 [Issue #22 本批记录](https://github.com/102326/DoL-Game-UI/issues/22)。研究是push、标准是手动，不称真实PR检查；手动48组等价/旧新雨天证明不冒称已经加入远端默认矩阵。CI仅沿用原W01必需入口扩充雪天断言。源码或制品未变时复用有效证据，文档收口不无限重复全量套件。

已做的是A在实际研究设置入口的候选Integrated和对应Targeted Tested。仍未做：其它窗口新天气推广、四角色真实消费者、完整游戏/ModLoader/多Mod、Windows/Android/iOS/WebView/软键盘/系统选择框/真实触控/长期性能、G1/G2/G3正式裁决。没有修改正式版本/Host/API/规则/bypass，未合并main/发布；CI Build Identity PR24仍独立未带入。

下一步先复看本片实际底材上的霜羽与雨雪反向，必要时处理继承底材的文字干扰；然后决定一个其它真实消费者切片。A方向选择、实际候选接线和整体视觉验收继续分开记录。
