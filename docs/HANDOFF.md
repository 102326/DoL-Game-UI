# Soft & Wet 4.0 — Evolution 研发交接

更新：2026-10-23。接手必须先核对本机HEAD、工作区、远端、依赖及实际运行环境；本文件不是清洁工作区或测试通过的证明。

## Current — 当前做什么

- 负责人已在操作页确认悬浮球最新速度：点击后菜单立即展开，240ms落位；球体演出使用0.65倍时长，与菜单并行，收束仍为650ms。已先快进合入Mac `c014cbb1dcc393dca4f00c97da97ae69d0121c8d` 的释放、隐藏和零尺寸修复，再保留本次节奏。[当前参数与接续](evolution/EVO-HUB-V2-INPUT.md#2026-10-23-已确认的展开速度)。Windows Edge的Hub六组、输入八组、生命周期三组，以及原型类型检查和构建通过；精确提交及新CI见#22。认可范围是当前隔离Hub展开速度，不是正式游戏整合或全局视觉验收。

- Mac 接续已安全同步 Windows `21509a8`，保留其 V2 输入方案；新增 [EVO-HUB-V2-MAC 生命周期补强](evolution/EVO-HUB-V2-MAC-LIFECYCLE.md)：释放落在球体、隐藏后场景替换、零尺寸宿主恢复三项旧缺陷均被固定负例拒绝并修复。本机原 24 项＋新增 3 项、类型/构建/合同通过。精确提交、推送及最终 CI 见 #22；完整 Hub 视觉仍待负责人确认。本机替代方案仅保存在本地 `research/mac-hub-v2-alternative` / `5ed6569`，未同步、未采用。

- 最新批次 [EVO-HUB-V2-INPUT](evolution/EVO-HUB-V2-INPUT.md)：隔离真实 Hub 不再整段禁用已可见工具；按下/聚焦保持姿态，真实事件单次执行，补齐H1–H4中途输入与生命周期。Windows Edge受控验证及原速桌面/窄屏录像已完成，精确提交与最终CI见#22；完整Hub视觉仍待确认，尚未生产接入。

- 当前授权为[正式总纲V1.2原文](references/SOFT_WET_4.0_EVOLUTION_V1.2_ORIGINAL.md)，替代此前“设置原型验收后暂停”的施工状态。独立分支`dev/evolution-4.0`，源自`baf0d48d3d4b63cae1e17ff324d233b9a37e16b4`；精确阶段提交、推送状态和CI见[#22](https://github.com/102326/DoL-Game-UI/issues/22)最新Evolution记录及本机Git。本文随研发提交交接，不自填自身提交SHA。
- 当前天气原型已通过负责人确认：C5.2自然雨滴＋默认斜雨＋R10提速，验收源码`ca0d606b775ae76f3bc1b321e5b62549afde62cf`，[CI39772188441/attempt2](https://github.com/102326/DoL-Game-UI/actions/runs/39772188441/attempts/2)成功；首轮安装耗时触及10分钟取消的记录保留。[R10报告](evolution/EVO-WEATHER-R10-REPORT.md)。当前页面视觉验收不是正式整合或4.0整体G2/G3通过。
- 前一批已推进[EVO-A2-L01导航挂载事务](evolution/EVO-A2-MOUNT-LIFECYCLE.md)：属性/社交及通用面板overlay/passage共同使用`navigation-mount/v1`。本机检查和旧基线负例已执行，精确提交/推送及最终CI见#22本批记录。
- 已实施P0审计、A1属性＋社交共享首片、V1隔离天气首候选。[首报](evolution/EVO-P0-REPORT.md)、[消费者范围表](evolution/EVO-P0-COVERAGE.md)、[实施计划](superpowers/plans/2026-10-22-evolution-first-round.md)。**负责人已批准当前消费者表及例外作为A2/A3范围；原V1/A/B的视觉否决属于历史，当前C5.2/R10原型已获认可，技术与媒体证据分版本保留。** 无main合并、Release或公开API/版本变更授权。
- 开工核对main `6a6e3c00b705dc67d37c1780b27f585847da5d1a`，正式3.0.4 Tag源码`915dcb9e85f3266a73a3e7ce38d769edd0c29ff4`；研究输入领先main16提交。没有覆盖旧研究分支；公开UI3.0.4/Host0.1.5-experimental/兼容1.0.1保持。阶段本机未同步内容和本地证据须另查Git与忽略的HANDOFF.local，不能假设另一设备可用。

## Decided — 已经确定什么

- 保留已认可设置V2.3：开100/关80ms简单透明度、正文立即可操作、V2.2分类；验收实现`6510a1d221f4f845cb766d03b71e2d48fedc0445`及[CI39578067270](https://github.com/102326/DoL-Game-UI/actions/runs/39578067270)。仍是隔离原型，尚未正式整合。保留已认可金属球、真实Hub工具/布局、3.x Acrylic及原生/第三方/存档边界。[V0摘要](evolution/EVO-V0-baselines.json)冻结输入。旧Hub整段禁用策略已由V2输入批次在隔离原型中退出；正式入口未启用该原型，生产接入仍需单独验证。
- A1两个生产入口已接同一内部`nativeOverlayNavigation`，共同租约/挂载/观察/取消/异常/坐标，保留独立组件与演出；旧重复基础逻辑已删除。[A1记录](evolution/EVO-A1.md)包含基线失败、两端测试和夹具纠正。未改Host公共API，不是万能窗口壳。
- V1使用真实设置组件及权威天气分类，Canvas同表面湿润/霜纹/光照连续变化，未接正式天气层。[观看与启动说明](../prototypes/evolution-weather/README.md)、[原速录像](media/evolution-weather-r1/weather-original-speed.mp4)、[受控结果](media/evolution-weather-r1/result.json)、[源码与媒体摘要](media/evolution-weather-r1/manifest.json)。不宣称高保真目标已认可。
- 本机macOS / Node24.18 / Chromium153：`npm run ci:check`、`node scripts/build-framework.mjs`、`node tests/evolution-navigation.cjs`、`node tests/header-weather.cjs`、`node tests/settings-ci.cjs`、`node --test tests/ci-evidence.test.cjs tests/test-workflow.test.cjs`通过；天气研究TypeScript及Vite构建通过，`EVO_WEATHER_ENDURANCE_MS=60000 node tests/evolution-weather.cjs --record`通过W1–W4四组受控检查。A1测试须先构建Framework生产CSS；天气须先`node scripts/prepare-settings-refraction.mjs`。本机工作树文件摘要见媒体manifest/result；最终提交CI身份另列#22。
- 研究工作流沿用已有检查名称，覆盖4.0分支push；标准Moody CI手动触发并单独报告。不把研究检查当完整标准CI，不把未执行/缺失证据算PASS。
- 跨设备 `21509a8` 的研究 CI39795026297 成功；标准 CI39795032787 因浏览器安装耗时、validate 超时取消，moody-gate 失败，不能记整轮通过。Mac 补强单独核对最终源码与 CI，不沿用过时的“运行中”。Windows原速媒体仍属旧提交，六项媒体摘要已在Mac重算相符；未冒充本批修复后的新录制。

## Next — 下一步做什么

当前接续重点从天气调参转向架构迁移。天气原型保持已认可的自然湿痕、底边流出、四档雨量、稀疏独立斜雨及更快天气转场；历史候选和原速媒体沿用其原源码身份，记录见[R9](evolution/EVO-WEATHER-R9-REPORT.md)/[R10](evolution/EVO-WEATHER-R10-REPORT.md)。不再把当前原型写成“等待A/B二选一”或“提速待确认”。

1. 范围已批准，按[首轮裁决](evolution/EVO-ROUND1-DECISION.md)继续。A1保留技术结果，A2已有[坐标首批](evolution/EVO-A2-COORDINATES.md)及[导航挂载首批](evolution/EVO-A2-MOUNT-LIFECYCLE.md)，后者进入独立只读技术复核；其余已批准消费者仍需逐项迁移。状态必须分开记录Implemented、Tested、Visually Accepted、Integrated、Release Ready，G1/G2/G3目前均未通过。
2. V2输入、Mac生命周期补强及最新240ms展开节奏已在真实Hub完成受控检查，展开速度已获负责人确认。接手先核对本次提交CI，再运行当前 `/hub.html`；[旧原速演示](media/evolution-hub-v2/hub-input-v2-desktop.mp4)不含生命周期补强和本次提速，不能作为最新节奏参考。A2/A3按已批准范围逐项实施，迁移通过后再退出旧路径，不盲删CSS/SVG。继续保留业务事件、所有权、取消/反向、隐藏/释放、Zoom等可靠性成果。
3. 新设备先fetch并检查HEAD/dirty/unpushed，安装锁定依赖，获取设置研究固定源码，复建后核对证据摘要。仅文档改动不重复跑整轮，运行源码变更按风险重验。
4. Windows、Android/iOS/WebView、真实游戏/ModLoader、多Mod、多表面长期性能及真机输入均未完成4.0验证；已有设备型号不是实测viewport。真实G3另安排，不以60秒/DPR1/390px模拟代替。

不自动读取/上传玩家存档。主动授权的存档可隔离复现，不进入公开CI Artifact。机器路径、服务会话和原始日志留本地忽略文件，公开只保留受控第一方证据。

第二轮补充：天气新候选的原生背景滤镜和表面着色不获取任意DOM纹理；V1保留为已否决参考。比较页、原速媒体、实际性能数值和最终CI身份见第二轮报告及#22。该旧记录只描述天气批次。后续V2输入批次已在隔离真实Hub退出整段禁用，见顶部最新记录；没有因此宣布生产整合或全局完成。


本批Windows接续：球体/工具源码已实际在本机Edge运行；这不等于旧设置/天气原型或整个4.0已完成Windows/真实游戏验证。`node tests/golden-spin-hub-input.cjs` 为当前输入回归；全部原型检查仍用 `npm run prototype:golden-spin:test`。
