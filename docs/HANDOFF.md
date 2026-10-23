# Soft & Wet 4.0 — Evolution 研发交接

更新：2026-10-23。接手必须先核对本机HEAD、工作区、远端、依赖及实际运行环境；本文件不是清洁工作区或测试通过的证明。

## Current — 当前做什么

- CI 专项独立修复见 [Moody CI V1](audits/MOODY-CI-V1.md)：小鸥报告已核对；修复标准必要附件与最终状态断链、研究必需报告/身份/case校验、旧Core测试身份与公开打包入口。新增三组Runtime合同及精确反例；研究/标准实际PR触发保持原检查名。正式版本、Evolution主体及设备/G1/G2/G3状态不变。精确最终提交和CI/PR身份见专项交付及#22；此前34f4217的两次成功仍只证明原清单范围。
- CI 专项当前交付为 [Draft PR #23](https://github.com/102326/DoL-Game-UI/pull/23)，目标研发分支，尚未合并。e403e11 的实际PR标准CI39892788494已成功，下载附件19 unit/35 browser与79项hash完整；研究首轮两项新validator字段误配已按真实报告纠正，不能把被阻断项记通过。后半22项在Mac分段验证，修复临时路径正例及runoff采样竞态，未修改天气呈现或放宽产品断言。最终候选的标准/研究/deep提交与触发身份另见PR/#22，旧结果不代替新提交验收。

- 最新[EVO-A2/A3消费者迁移](evolution/EVO-A2-A3-CONSUMERS.md)，输入 `fbf0269`：按负责人步骤1、2推进设置/侧栏、原生窗口/天气/Hub、导航面板、商店/衣柜/战斗/存档和自有兼容装饰；旧帧、定时器与重复清理路径当批退出，保留六类明确原生/共用/退役调度入口。13个实际入口资源归零、旧衣柜排队帧反例和防回退检查通过；最终精确提交及CI见#22。未推进步骤3的原型接线，也未自判G1通过。
- 本批标准CI首轮39834323662在兼容包构建被阻断：原type-only导入门槛拒绝了共用资源原语。构建器现只额外允许确切的visual-scope模块，所有其它直接/传递模块仍拒绝；新增Runtime/其它模块精确拒绝反例，八包本地构建及合同检查通过。该次汇总/gate失败是连锁结果，未执行的浏览器阶段不计通过；最终新CI见#22。
- 已知旧问题：补充ui-runtime检查在运行时版本2.7.0／包版本3.0.4断言失败，输入提交已存在；本批未改src/main.ts或放宽断言，该补充套件不能记全通过。
- 前批[EVO-A2共享动效与设置布局资源迁移](evolution/EVO-A2-SETTINGS-RESOURCES.md)，输入 `9893644`：sourceMotion滚动帧/观察器/监听和设置布局帧/观察器实际接入visualScope，当批删除对应重复清理路径。旧源码受控迟到回调产生额外轮询被精确拒绝；当前版本及设置卸载后资源归零通过。类型、UI/Host构建与受影响组件回归通过；精确提交和两套CI见#22。尚未正式接入已认可设置/天气/球体原型。
- 前批 [EVO-A2 视觉资源作用域首批](evolution/EVO-A2-VISUAL-SCOPE.md)，输入 `9807e0b`：OrbitFocus和原生导航实际共用visualScope，合并帧任务/清理所有权；当批删除局部frame/dead及重复卸载路径。正常组件、原生导航、Framework Host及设置/选择/战斗受控回归通过，焦点卸载后观察器与帧计数为0。尚未覆盖其它消费者或正式游戏，精确提交与两套CI见#22。
- 反例修复批次 `9807e0b` 的输入为 `d0e06e5`。输入的两套CI均因同一个历史反例生成器重复声明 `ticket` 而失败；后续汇总和gate为连锁失败，不是多个产品缺陷。修复仅去掉生成器重复声明，本地正常几何、缺样式及旧几何的精确拒绝均通过；完整CI结果见#22，未完成的后续检查不能沿用旧成功。
- 共享导航已经实际接线：属性/社交共用adapter，adapter与通用面板overlay/passage共用navigationMount；OrbitFocus坐标及本批资源所有权已收敛，其余已批准呈现资源已由最新消费者批次迁移，原生/公共工厂例外见新报告。设置正式入口仍300/220ms及代理展开，正式天气仍旧paint，球体由原型注入；已认可原型尚未正式交付。
- 每个消费者迁移并验证后立即退出对应重复路径；导航挂载批次已经退出部分独立claim/mount清理，A3不是尚未开始。每批进行针对性的真实宿主、输入与资源/性能验证，最后再做完整设备和多Mod回归。

<details>
<summary>历史批次记录（以下状态仅对应各自提交，以顶部当前快照为准）</summary>

- 最新批次 [EVO-A2 焦点坐标与反向检查](evolution/EVO-A2-ORBIT-CONTINUITY.md)：OrbitFocus起点/终点统一进入共享坐标换算，修复有边框时的12px起点跳变，补齐隐藏/零尺寸与定位失效；保留580ms焦点动作及已确认Hub速度。输入 `5b028d0` 的标准CI成功、研究CI反向断言失败已查明采样时点问题；新探针收紧容差并通过真实跳变注入反例。最终提交与新CI见#22。Windows证据测试因符号链接权限EPERM未通过，须与Linux CI结果分开记录。

- 负责人已在操作页确认悬浮球最新速度：点击后菜单立即展开，240ms落位；球体演出使用0.65倍时长，与菜单并行，收束仍为650ms。已先快进合入Mac `c014cbb1dcc393dca4f00c97da97ae69d0121c8d` 的释放、隐藏和零尺寸修复，再保留本次节奏。[当前参数与接续](evolution/EVO-HUB-V2-INPUT.md#2026-10-23-已确认的展开速度)。Windows Edge的Hub六组、输入八组、生命周期三组，以及原型类型检查和构建通过；精确提交及新CI见#22。认可范围是当前隔离Hub展开速度，不是正式游戏整合或全局视觉验收。

- Mac 接续已安全同步 Windows `21509a8`，保留其 V2 输入方案；新增 [EVO-HUB-V2-MAC 生命周期补强](evolution/EVO-HUB-V2-MAC-LIFECYCLE.md)：释放落在球体、隐藏后场景替换、零尺寸宿主恢复三项旧缺陷均被固定负例拒绝并修复。本机原 24 项＋新增 3 项、类型/构建/合同通过。精确提交、推送及最终 CI 见 #22；完整 Hub 视觉仍待负责人确认。本机替代方案仅保存在本地 `research/mac-hub-v2-alternative` / `5ed6569`，未同步、未采用。

- 最新批次 [EVO-HUB-V2-INPUT](evolution/EVO-HUB-V2-INPUT.md)：隔离真实 Hub 不再整段禁用已可见工具；按下/聚焦保持姿态，真实事件单次执行，补齐H1–H4中途输入与生命周期。Windows Edge受控验证及原速桌面/窄屏录像已完成，精确提交与最终CI见#22；完整Hub视觉仍待确认，尚未生产接入。

- 当前授权为[正式总纲V1.2原文](references/SOFT_WET_4.0_EVOLUTION_V1.2_ORIGINAL.md)，替代此前“设置原型验收后暂停”的施工状态。独立分支`dev/evolution-4.0`，源自`baf0d48d3d4b63cae1e17ff324d233b9a37e16b4`；精确阶段提交、推送状态和CI见[#22](https://github.com/102326/DoL-Game-UI/issues/22)最新Evolution记录及本机Git。本文随研发提交交接，不自填自身提交SHA。
- 当前天气原型已通过负责人确认：C5.2自然雨滴＋默认斜雨＋R10提速，验收源码`ca0d606b775ae76f3bc1b321e5b62549afde62cf`，[CI39772188441/attempt2](https://github.com/102326/DoL-Game-UI/actions/runs/39772188441/attempts/2)成功；首轮安装耗时触及10分钟取消的记录保留。[R10报告](evolution/EVO-WEATHER-R10-REPORT.md)。当前页面视觉验收不是正式整合或4.0整体G2/G3通过。
- 前一批已推进[EVO-A2-L01导航挂载事务](evolution/EVO-A2-MOUNT-LIFECYCLE.md)：属性/社交及通用面板overlay/passage共同使用`navigation-mount/v1`。本机检查和旧基线负例已执行，精确提交/推送及最终CI见#22本批记录。
- 已实施P0审计、A1属性＋社交共享首片、V1隔离天气首候选。[首报](evolution/EVO-P0-REPORT.md)、[消费者范围表](evolution/EVO-P0-COVERAGE.md)、[实施计划](superpowers/plans/2026-10-22-evolution-first-round.md)。**负责人已批准当前消费者表及例外作为A2/A3范围；原V1/A/B的视觉否决属于历史，当前C5.2/R10原型已获认可，技术与媒体证据分版本保留。** 无main合并、Release或公开API/版本变更授权。
- 开工核对main `6a6e3c00b705dc67d37c1780b27f585847da5d1a`，正式3.0.4 Tag源码`915dcb9e85f3266a73a3e7ce38d769edd0c29ff4`；研究输入领先main16提交。没有覆盖旧研究分支；公开UI3.0.4/Host0.1.5-experimental/兼容1.0.1保持。阶段本机未同步内容和本地证据须另查Git与忽略的HANDOFF.local，不能假设另一设备可用。

</details>

## Decided — 已经确定什么

- 保留已认可设置V2.3：开100/关80ms简单透明度、正文立即可操作、V2.2分类；验收实现`6510a1d221f4f845cb766d03b71e2d48fedc0445`及[CI39578067270](https://github.com/102326/DoL-Game-UI/actions/runs/39578067270)。仍是隔离原型，尚未正式整合。保留已认可金属球、真实Hub工具/布局、3.x Acrylic及原生/第三方/存档边界。[V0摘要](evolution/EVO-V0-baselines.json)冻结输入。旧Hub整段禁用策略已由V2输入批次在隔离原型中退出；正式入口未启用该原型，生产接入仍需单独验证。
- A1两个生产入口已接同一内部`nativeOverlayNavigation`，共同租约/挂载/观察/取消/异常/坐标，保留独立组件与演出；旧重复基础逻辑已删除。[A1记录](evolution/EVO-A1.md)包含基线失败、两端测试和夹具纠正。未改Host公共API，不是万能窗口壳。
- V1使用真实设置组件及权威天气分类，Canvas同表面湿润/霜纹/光照连续变化，未接正式天气层。[观看与启动说明](../prototypes/evolution-weather/README.md)、[原速录像](media/evolution-weather-r1/weather-original-speed.mp4)、[受控结果](media/evolution-weather-r1/result.json)、[源码与媒体摘要](media/evolution-weather-r1/manifest.json)。不宣称高保真目标已认可。
- 本机macOS / Node24.18 / Chromium153：`npm run ci:check`、`node scripts/build-framework.mjs`、`node tests/evolution-navigation.cjs`、`node tests/header-weather.cjs`、`node tests/settings-ci.cjs`、`node --test tests/ci-evidence.test.cjs tests/test-workflow.test.cjs`通过；天气研究TypeScript及Vite构建通过，`EVO_WEATHER_ENDURANCE_MS=60000 node tests/evolution-weather.cjs --record`通过W1–W4四组受控检查。A1测试须先构建Framework生产CSS；天气须先`node scripts/prepare-settings-refraction.mjs`。本机工作树文件摘要见媒体manifest/result；最终提交CI身份另列#22。
- 研究工作流沿用已有检查名称，覆盖4.0分支push；标准Moody CI手动触发并单独报告。不把研究检查当完整标准CI，不把未执行/缺失证据算PASS。
- 跨设备 `21509a8` 的研究 CI39795026297 成功；标准 CI39795032787 因浏览器安装耗时、validate 超时取消，moody-gate 失败，不能记整轮通过。Mac 补强单独核对最终源码与 CI，不沿用过时的“运行中”。Windows原速媒体仍属旧提交，六项媒体摘要已在Mac重算相符；未冒充本批修复后的新录制。

## Next — 下一步做什么

当前接续重点从天气调参转向架构迁移。天气原型保持已认可的自然湿痕、底边流出、四档雨量、稀疏独立斜雨及更快天气转场；历史候选和原速媒体沿用其原源码身份，记录见[R9](evolution/EVO-WEATHER-R9-REPORT.md)/[R10](evolution/EVO-WEATHER-R10-REPORT.md)。不再把当前原型写成“等待A/B二选一”或“提速待确认”。

1. 步骤1、2的消费者资源迁移与重复路径退出已完成；先核对最新提交两套完整CI、覆盖与六项保留边界，进行G1技术复核。已知运行时版本诊断问题保留失败记录；不把旧CI或辅助套件的部分结果写成当前全部通过。G1/G2/G3尚未正式裁定。
2. V2输入、Mac生命周期补强及最新240ms展开节奏已在真实Hub完成受控检查，展开速度已获负责人确认。接手先核对本次提交CI，再运行当前 `/hub.html`；[旧原速演示](media/evolution-hub-v2/hub-input-v2-desktop.mp4)不含生命周期补强和本次提速，不能作为最新节奏参考。本轮A2/A3已按覆盖表收敛；设置/天气/球体正式接线仍属下一步，当前不盲删CSS/SVG。继续保留业务事件、所有权、取消/反向、隐藏/释放、Zoom等可靠性成果。
3. 新设备先fetch并检查HEAD/dirty/unpushed，安装锁定依赖，获取设置研究固定源码，复建后核对证据摘要。仅文档改动不重复跑整轮，运行源码变更按风险重验。
4. 真实宿主、输入、生命周期与必要性能检查贯穿每批迁移，不能全部留到最后。Windows、Android/iOS/WebView、真实游戏/ModLoader、多Mod、多表面长期性能及真机输入仍需相应证据，最后进行完整G3回归；已有设备型号不是实测viewport，不以60秒/DPR1/390px模拟代替。

不自动读取/上传玩家存档。主动授权的存档可隔离复现，不进入公开CI Artifact。机器路径、服务会话和原始日志留本地忽略文件，公开只保留受控第一方证据。

第二轮补充：天气新候选的原生背景滤镜和表面着色不获取任意DOM纹理；V1保留为已否决参考。比较页、原速媒体、实际性能数值和最终CI身份见第二轮报告及#22。该旧记录只描述天气批次。后续V2输入批次已在隔离真实Hub退出整段禁用，见顶部最新记录；没有因此宣布生产整合或全局完成。


本批Windows接续：球体/工具源码已实际在本机Edge运行；这不等于旧设置/天气原型或整个4.0已完成Windows/真实游戏验证。`node tests/golden-spin-hub-input.cjs` 为当前输入回归；全部原型检查仍用 `npm run prototype:golden-spin:test`。
