# Soft & Wet 4.0 — Evolution 研发交接

更新：2026-10-22。接手必须先核对本机HEAD、工作区、远端、依赖及实际运行环境；本文件不是清洁工作区或测试通过的证明。

## Current — 当前做什么

- 当前授权为[正式总纲V1.2原文](references/SOFT_WET_4.0_EVOLUTION_V1.2_ORIGINAL.md)，替代此前“设置原型验收后暂停”的施工状态。独立分支`dev/evolution-4.0`，源自`baf0d48d3d4b63cae1e17ff324d233b9a37e16b4`；精确阶段提交、推送状态和CI见[#22](https://github.com/102326/DoL-Game-UI/issues/22)最新Evolution记录及本机Git。本文随研发提交交接，不自填自身提交SHA。
- 当前天气批次为C5.1雨势增强：负责人要求雨滴更有力、整体加快且雨越大越多越快，见[R8报告](evolution/EVO-WEATHER-R8-REPORT.md)。C5为待增强上一版，C3雨滴已认可；C5.1及C4雪天待视觉裁决。未正式整合或发布。
- 已实施P0审计、A1属性＋社交共享首片、V1隔离天气首候选。[首报](evolution/EVO-P0-REPORT.md)、[消费者范围表](evolution/EVO-P0-COVERAGE.md)、[实施计划](superpowers/plans/2026-10-22-evolution-first-round.md)。**负责人已批准当前消费者表及例外作为A2/A3范围；V1雨天视觉Reject，技术成果保留。两种新候选须先视觉评审。** 无main合并、Release或公开API/版本变更授权。
- 开工核对main `6a6e3c00b705dc67d37c1780b27f585847da5d1a`，正式3.0.4 Tag源码`915dcb9e85f3266a73a3e7ce38d769edd0c29ff4`；研究输入领先main16提交。没有覆盖旧研究分支；公开UI3.0.4/Host0.1.5-experimental/兼容1.0.1保持。阶段本机未同步内容和本地证据须另查Git与忽略的HANDOFF.local，不能假设另一设备可用。

## Decided — 已经确定什么

- 保留已认可设置V2.3：开100/关80ms简单透明度、正文立即可操作、V2.2分类；验收实现`6510a1d221f4f845cb766d03b71e2d48fedc0445`及[CI39578067270](https://github.com/102326/DoL-Game-UI/actions/runs/39578067270)。仍是隔离原型，尚未正式整合。保留已认可金属球、真实Hub工具/布局、3.x Acrylic及原生/第三方/存档边界。[V0摘要](evolution/EVO-V0-baselines.json)冻结输入。现有Hub演出期间禁用工具的行为列为V2待修，不能继承为已合格交互。
- A1两个生产入口已接同一内部`nativeOverlayNavigation`，共同租约/挂载/观察/取消/异常/坐标，保留独立组件与演出；旧重复基础逻辑已删除。[A1记录](evolution/EVO-A1.md)包含基线失败、两端测试和夹具纠正。未改Host公共API，不是万能窗口壳。
- V1使用真实设置组件及权威天气分类，Canvas同表面湿润/霜纹/光照连续变化，未接正式天气层。[观看与启动说明](../prototypes/evolution-weather/README.md)、[原速录像](media/evolution-weather-r1/weather-original-speed.mp4)、[受控结果](media/evolution-weather-r1/result.json)、[源码与媒体摘要](media/evolution-weather-r1/manifest.json)。不宣称高保真目标已认可。
- 本机macOS / Node24.18 / Chromium153：`npm run ci:check`、`node scripts/build-framework.mjs`、`node tests/evolution-navigation.cjs`、`node tests/header-weather.cjs`、`node tests/settings-ci.cjs`、`node --test tests/ci-evidence.test.cjs tests/test-workflow.test.cjs`通过；天气研究TypeScript及Vite构建通过，`EVO_WEATHER_ENDURANCE_MS=60000 node tests/evolution-weather.cjs --record`通过W1–W4四组受控检查。A1测试须先构建Framework生产CSS；天气须先`node scripts/prepare-settings-refraction.mjs`。本机工作树文件摘要见媒体manifest/result；最终提交CI身份另列#22。
- 研究工作流沿用已有检查名称，覆盖4.0分支push；标准Moody CI手动触发并单独报告。不把研究检查当完整标准CI，不把未执行/缺失证据算PASS。

## Next — 下一步做什么

负责人已认可 C2（`ca6fa0a`）及 C3（`9fa1fb0`）雨滴/底边流出。最新要求：恢复不同雨量，并增强不明显的雪天。C4在显式`climate=1`启用，保留C3入口和R5媒体；[R6报告](evolution/EVO-WEATHER-R6-REPORT.md)、`climate-review.html`提供四档雨量及雨雪往返原速对照。C4雪天仍待视觉评审；本轮按新反馈加入C5斜雨叠加（显式`shower=1`），`shower-review.html`可开关及看同操作原速对照。最新C5.1（`shower=1&force=1`）按反馈增强雨幕及滑落滴密度/速度，`rain-force-review.html`提供原C5/增强版四档原速对照。雨滴认可不代表雪天、全局G2、整合或发布通过。

最新天气反馈：负责人认为第二轮A/B都有问题，先研究实拍雨窗，后已授权按[参考研究](evolution/EVO-WEATHER-REFERENCE-STUDY.md)制作下一版并展示。[R3候选C报告](evolution/EVO-WEATHER-R3-REPORT.md)：原生SVG背景位移、碰撞合并/滑移、移除观察带、正文保护，新四段同夹具原速对照及材质近景。C经C2/C3修订后雨滴已获认可，A/B未获认可；不沿用“等待二选一”假设。实际本机证据见`docs/media/evolution-weather-r3`；提交/CI以#22与Git为准。

1. 范围已批准，按[首轮裁决](evolution/EVO-ROUND1-DECISION.md)继续。A1保留技术结果，A2先完成[坐标首批](evolution/EVO-A2-COORDINATES.md)；天气改为两种候选，详见[第二轮报告](evolution/EVO-ROUND2-REPORT.md)。A1/A2仍需独立技术复核。状态必须分开记录Implemented、Tested、Visually Accepted、Integrated、Release Ready，G1/G2/G3目前均未通过。
2. 依据反馈继续A1/V1与真实Hub H1–H4交互研究；A2/A3按已批准范围逐项实施，迁移通过后再退出旧路径，不盲删CSS/SVG。继续保留业务事件、所有权、取消/反向、隐藏/释放、Zoom等可靠性成果。
3. 新设备先fetch并检查HEAD/dirty/unpushed，安装锁定依赖，获取设置研究固定源码，复建后核对证据摘要。仅文档改动不重复跑整轮，运行源码变更按风险重验。
4. Windows、Android/iOS/WebView、真实游戏/ModLoader、多Mod、多表面长期性能及真机输入均未完成4.0验证；已有设备型号不是实测viewport。真实G3另安排，不以60秒/DPR1/390px模拟代替。

不自动读取/上传玩家存档。主动授权的存档可隔离复现，不进入公开CI Artifact。机器路径、服务会话和原始日志留本地忽略文件，公开只保留受控第一方证据。

第二轮补充：天气新候选的原生背景滤镜和表面着色不获取任意DOM纹理；V1保留为已否决参考。比较页、原速媒体、实际性能数值和最终CI身份见第二轮报告及#22。本批没有执行Golden Spin V2新联动，旧工具整段禁用问题未因此解决。
