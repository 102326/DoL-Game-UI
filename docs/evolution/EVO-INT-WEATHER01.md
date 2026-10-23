# EVO-INT-W01 — 已认可天气接入实际设置入口

2026-10-23，输入 `6f7d4d91b515f67b334bbe4f9e84194397ff7c18`，`dev/evolution-4.0` 独立 worktree。开工 clean、与 origin 一致，未覆盖其它设备或 CI 专项分支。负责人已授权继续后续步骤、阻塞再报；本片实现提交、推送和最终 CI 身份见 [Issue #22](https://github.com/102326/DoL-Game-UI/issues/22) 本批记录。

## 1. 完成范围

| 编号 | 实际结果 | 没有扩大成什么 |
| --- | --- | --- |
| EVO-INT-W01 | nativeNavigation → headerWeather 的**实际设置消费者**启用 C5.2/R10 | 原生窗口仍使用现行六类天气呈现；未自动推广全部表面 |
| EVO-A2/A3-W01 | 表面时钟、模型与材质成为内部共用实现，visualScope 管理帧/轮询/观察器/监听；设置旧雨滴层退出 | 无新增中央 Runtime、Host API、用户选项或生产依赖 |
| EVO-W01-REG | 9组真实设置正例＋初始化顺序的精确拒绝反例进入现有 settings-ci | 未建立新 Runner、改 CI 工作流/规则或扩大设备矩阵 |
| CI-HANDOFF-01 | 编号报告、实际源码原速媒体、HANDOFF 与 #22 更新 | 不将本机独有原始日志当另一设备可用证据 |

设置保留已认可的100/80ms开关、620ms分类和 V2.3 底材。新天气保留四档雨量、自然湿痕、附着/合并/流动、底边流出、独立斜雨默认显示及 R10 连续快速转场；无斜雨开关。雪晶与雨雪连续性沿用原型，不追加雪天画质或全局 G2 裁决。研究夹具专用的半透明背景和工具条不移入产品；因此不声称不同背景上的全部像素与原型相同。

`src/ui/weather/` 是实际内部共用实现；原研究入口保留薄导出与候选参数。雨滴模型、霜晶和独立斜雨三个算法文件与输入原型逐字一致。`wetGlass` 增加资源所有权、构造失败清理及独立纵向坐标换算；共用时钟保留原参数，R10 pace=.25。生产入口不导入被否决 A/B 的材质、研究场景或控制条。旧媒体与原源码身份不改写。

天气仍只读权威 `readGameWeather`，不写真实游戏状态。原生与设置共用一次低频读取：有新设置表面时500ms，否则沿用原生2秒；绘制帧读取缓存，无逐帧游戏读取，也无第二个设置天气轮询。全部表面不可见或文档隐藏时停止轮询。无效几何不绘制；保留受管观察器用于恢复，而非循环重试。

## 2. 新发现与处理

**W01-INIT**：第一版集成先创建/测量材质，再设置绝对定位宿主标记，文字保护区被画布自身高度整体推移。内部 `protectedOverlap=0` 没有发现错位，严格晴雨文字像素对照真实失败。现在先建立宿主，再创建材质。`--late-host` 固定注入旧错误顺序，必须被“rain must not alter actual reading sample pixels”精确拒绝；其它异常不算反例成功。

**W01-WAKE**：旧管理器会在轮询发现设置隐藏时删除注册，仅恢复样式不会重新注册。现在仍打开的设置进入暂停状态，停止帧和全不可见时的共享轮询，保留受管尺寸及 style/class/hidden/open/inert 唤醒观察器。恢复时使用最新天气继续；隐藏期间发生导航刷新也保留注册。测试隐藏900ms，超过500ms轮询，不以80ms短隐藏或节点存在替代恢复证明；检查暂停、轮询停止、最新目标和实际画布像素继续变化。

**W01-CLEANUP**：材质/根作用域清理抛错原会阻断节点、标记或其它表面释放。现在先撤销表面身份，再逐项尝试所有清理，错误聚合继续向调用方报告；画布最终移除。实际注入 ResizeObserver 原生 disconnect 完成后的异常，要求错误仍可观察、但表面/节点/轮询全部退出。构造途中失败也验证没有残留材质、设置仍可操作，保留静态 Acrylic。

固定输入6f7d4d9在第一条“已接入新材质”断言被拒绝，只说明迁移尚未完成，**不是旧版产品缺陷**。无浏览器权限的首次沙箱启动失败也不算红灯复现；经允许的本机 Chromium 重跑才取得目标断言证据。中间失败与修复日志本机保留，未反复重跑掩盖 flaky。

## 3. 验证与范围

实际本机：macOS / Node24.18.0 / Chromium153.0.8010.12 / Python3.9.6（显式 `python3`，没有 `python` 别名）。最终运行源码经本片提交的 Linux CI 另行核对，链接与精确 SHA 见 #22。不是 Windows、Android/iOS/WebView 或实际游戏验收。

| 命令 | 结果/范围 |
| --- | --- |
| `npm run ci:check` | PASS，类型与 Framework 合同 |
| `node scripts/build-framework.mjs` | PASS，真实生产 UI/Host 与样式构建 |
| `node tests/settings-ci.cjs` | PASS，原设置合同、S01五组，以及 W01九组＋精确初始化顺序反例 |
| `node tests/evolution-weather-integration.cjs --baseline` | 预期非零：固定旧入口缺少新材质；不计正常套件通过 |
| `node tests/header-weather.cjs` | PASS，保留原生六类天气/雨量/原事件/材质断言，设置部分核对新表面与共享读取 |
| `node tests/evolution-owner-resources.cjs` | 13个实际入口 PASS；天气同时覆盖旧原生与新设置资源、销毁和迟到投递 |
| `node --test tests/visual-scope.test.cjs tests/evolution-resource-contract.test.cjs tests/evolution-rain-model.test.cjs tests/evolution-scattered-shower.test.cjs` | PASS，共同所有权、调度防回退、模型边界与独立斜雨；六项既有例外不增加 |
| `node scripts/prepare-settings-refraction.mjs`、`npx vue-tsc --noEmit -p tsconfig.evolution.json`、`npx vite build --config vite.evolution-weather.config.ts`、`node tests/evolution-weather-shower.cjs --scatter` | PASS，搬迁后的 C5.2/R10 保护、雨量、转场、中断与释放回归；历史候选另由研究 CI 覆盖 |
| `MOODY_EVIDENCE_ID=weather-w01-mac python3 scripts/check-ci-packages.py build` 及同检查器不带 `build` | PASS，八包、两轮真实独立构建/快照一致及7类负例；没有改写正式发行制品 |

独立只读复核发现的隐藏、异常清理和 inert 唤醒遗漏已处理，最终本片静态复核无具体阻断；复核者的额外运行受本地监听沙箱限制，不冒充另一次运行。正常与故障运行的实际证据由上述本机命令提供。已有额外 `ui-runtime` 运行时2.7.0/包3.0.4诊断断言问题未改；旧游戏夹具缺 `tests/fixture.html` 的限制仍保留，不称全仓全通过。

原型回归的本机短观测：rAF间隔 median33.3 / p95 50ms，JS绘制 median1.10 / p95 2.60ms。它是单表面受控样本，非 GPU 合成计时、实际新设置性能承诺或实机FPS。未降低 DPR、画质或放宽原保护/时序门槛。

## 4. 原速展示与失败证据

运行 `node scripts/preview-evolution-settings.mjs` 后，用 `/?weather=severe` 或 `/?weather=snow` 查看真实控制器＋nativeNavigation；默认无 weather 参数仍为原 S01 设置场景。这里的 Weather 是第一方模拟输入，不读取游戏或存档。本机天气预览另在5193端口运行，进程及机器路径仅记忽略文件。

`node scripts/record-evolution-settings.cjs --weather` 录制两种视口1280×900、390×844、DPR1，保留四档雨量、分类/偏好、雨雪与中途反向、关闭/原事件恢复/重开，原速、不剪等待。素材是实际设置源码的受控场景，不是完整游戏录像，也不冒充旧新版冻结视觉对照。

- [桌面原速](../media/evolution-weather-w01/desktop-1x.mp4) / [窄屏原速](../media/evolution-weather-w01/narrow-1x.mp4)。
- [桌面截图](../media/evolution-weather-w01/desktop.png) / [窄屏截图](../media/evolution-weather-w01/narrow.png)。
- [实际时间、环境与输入摘要](../media/evolution-weather-w01/result.json) / [媒体索引](../media/evolution-weather-w01/manifest.json)；12MiB硬上限，超限报错，不截断。
- [受控验证与精确反例摘要](../media/evolution-weather-w01/validation.json)单独提供，不混入五项媒体索引。
- [受控错误现场](../media/evolution-weather-w01/counterexample.jpg) / [断言、身份与几何](../media/evolution-weather-w01/counterexample.json)是已被拒绝的初始化顺序注入，不是当前正常实现截图。两文件摘要另在validation.json索引。

五项媒体3,135,412字节，桌面32.52秒、窄屏32.68秒；全部媒体及25项实际输入文件摘要重算一致。受控错误JSON28,831字节、JPEG43,233字节，保留几何，未触及省略门槛。

失败现场沿用现有 settings 白名单，包含场景、是否受控注入、断言、源码/Run身份、画布与实际保护/雨滴/湿痕/斜雨几何以及截图，不自动读玩家内容。受控负例的现场不包装成当前正常实现失败。现有收集体积/期限及 CI 专项职责保持，本片不另改证据平台。

## 5. 未做与接续

本片为 Implemented / Controlled Tested / Integrated（研发设置天气首片）。原型视觉认可引用 C5.2/R10；实际游戏背景、完整全局天气、其它窗口与新设置整合的视觉/设备验收仍分别记录，不自判G1/G2/G3或Release Ready。

未接入球体/Hub原型到正式入口；未推广其它窗口新天气或抢删仍被原生消费者使用的旧CSS/SVG；未改版本/Host/API/CI工作流/Runner/保护规则/bypass；未合并main、发布4.0、改Tag/正式ZIP。未读取或上传游戏HTML、玩家存档或第三方未知制品。

后续继续 Hub 独立接线，保留已认可球体外观、立即展开/240ms落位、0.65倍球体演出及真实工具输入；补真实游戏/ModLoader、多Mod、Windows/WebView/触控/系统缩放与长期并窗性能。真机采集待负责人方便，不以模拟视口或已有CI替代。接手先核对本机HEAD、dirty/unpushed、远端、锁定依赖与实际环境。
