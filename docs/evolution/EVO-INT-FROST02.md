# EVO-INT-FROST02 — 设置雪天边缘结霜候选

2026-10-23。负责人要求在雪天窗口周围增加类似结霜的效果。本报告记录 SNOW01 上的小范围边霜候选及后续微调，最新反馈以下节为准，不代表4.0发布。

## 当前裁决：设置边霜已视觉通过

负责人明确“可以，这版结霜效果通过，继续处理后续任务”。认可的是 `5a0f244` 的实际设置边霜：新增层为初版0.56浓度，原A霜羽及几何不变；不扩大为其它窗口、全局G2/G3或正式发行通过。

已按准确浓度另录[桌面原速22.76秒](../media/evolution-frost-s02-approved/desktop-1x.mp4)、[窄屏原速21.84秒](../media/evolution-frost-s02-approved/narrow-1x.mp4)，及[桌面](../media/evolution-frost-s02-approved/desktop.png)/[窄屏](../media/evolution-frost-s02-approved/narrow.png)截图，6文件3,197,000字节。媒体包含源码及文件摘要，12MiB上限保留；旧候选不覆盖。

最终复验 `node tests/settings-ci.cjs`（S01五组/W01九组、原迟宿主反例及实际设置回归）、`node tests/evolution-snow-integration.cjs`（48原A冻结＋4实际表面）、`npm run ci:check` 通过；16边霜检查复用最终相同源码的有效证据。[本轮检查摘录](EVO-INT-FROST02-ACCEPTED-CHECKS.json)。最终研发同步SHA与新两套Actions在Issue22分别记录，不沿用SNOW01或CI PR24旧绿；手动边霜/冻结对照没有自动进入默认CI。底材透字留作下一项独立研究，不修改本次通过画面。

## 历史微调：更浅、更透

第二次微调（当前）：负责人要求“再浅30%，我看一下效果”，在上一版0.8上乘0.7，新增边霜不透明度现为初版的0.56；原A霜羽及几何不变。`node tests/evolution-edge-frost.cjs` 的16组检查通过，已更新实际预览；本机受控截图/原始报告在忽略的 `tests/artifacts/evolution/edge-frost-1792755165570`，不假定跨设备可用。下列0.8截图及旧录像均为历史浓度参考，本次未重录视频、运行整轮CI、推送或发布。

负责人反馈“结霜效果微浅微透一点，就可以了”。基于本地 `b91f04d`，仅将新增边缘薄霜/细晶的合成不透明度乘0.8；位置、大小、原A霜羽和其它天气不变。[当前实际预览截图](../media/evolution-frost-s02-soft/desktop.png)及[源码/检查摘要](../media/evolution-frost-s02-soft/result.json)另存，下面旧录像保留微调前的浓度，不冒充当前画面。16组原边霜像素检查与Evolution类型检查通过；未因这一行透明度调整重复整轮CI，未执行本轮远端Actions或实机测试。当前本地保存、尚未推送。此反馈只裁决当前雪天边霜微调，不代表全局G2/G3通过。

## 实际改动

- 仅实际设置窗口选择 `frostedFeatherSnow`：不均匀的薄霜、细小冰晶沿四边和边角聚集，向内渐隐，最深约44 CSS px；原A霜羽叠在霜膜上。
- 附着位置固定，不逐帧随机闪烁。沿用原连续雪参数生长/消退和现有时钟，不新增 RAF、轮询、DOM 纹理捕获或依赖。
- 每块绘制均受同一安全矩形裁剪，矩形进入原 `iceBounds` / `protectedOverlap` 审计；文字、控件和移动分类保护继续生效。
- 原 R11 `featherSnow` 与研究A/B未改；雨天、设置开关/分类、Hub、其它原生窗口与正式版本未改。
- 录制器新增 `--frost` 独立目录，不覆盖 SNOW01 历史截图和录像。

## 参考与观看

实物参考为 [Jeffrey Friedl 的窗霜照片](https://regex.info/blog/2014-01-11/2371)，已查看照片；取其局部霜膜、细密分枝和清透间隙作为设计参考，不是物理结霜模拟。搜索技能的 Exa 命令在本机缺失，改用内置图片搜索及浏览器查看。未将第三方照片下载或嵌入游戏制品。

- 实际操作预览由现有设置预览服务提供，雪天用 `?weather=snow`；打开设置后 Alt+1/2/3 切换晴/雨/雪。仅研究夹具支持这些快捷键。
- [桌面截图](../media/evolution-frost-s02/desktop.png)、[窄屏截图](../media/evolution-frost-s02/narrow.png)。
- [桌面原速录像](../media/evolution-frost-s02/desktop-1x.mp4)22.56秒、[窄屏原速录像](../media/evolution-frost-s02/narrow-1x.mp4)21.84秒，均保留实际等待与天气中途反转；不是同步分屏或冻结旧版比较。
- 六项受控媒体共3,256,016字节，包含来源记录及摘要清单，12MiB上限未触及；仅第一方模拟内容，无游戏HTML或玩家存档。

## 验证范围

输入 HEAD `ef3c15c55252d58de1dac683bc955555a64ecdb2` 加本轮工作区改动；最终源码由[检查摘要](EVO-INT-FROST02-CHECKS.json)及媒体 `result.json` 绑定，最终本地提交另由 Git 记录。

环境：macOS、Node24.18.0、Chromium153.0.8010.12。

| 命令 | 实际结果 |
| --- | --- |
| `node tests/evolution-weather-integration.cjs` | 新断言先在未实现边霜时失败，前三组仍通过；实现后原九组全部通过，增加稳定雪天边霜存在断言，保留正文/关闭像素、四档雨量、中途反转、缩放、隐藏/关闭/销毁和异常清理 |
| `node tests/evolution-edge-frost.cjs` | 16组：360×640、940×760，DPR1/2，雪参数0/.25/.65/1；新增可见像素只在周边、保护区不变、雪为0无差异、清除无残留、证据覆盖实际绘制、完全保护时无绘制 |
| `node tests/evolution-snow-integration.cjs` | 原A冻结48组栅格/状态仍完全一致；实际旧/新设置4条表面记录，雨天整窗一致，雪天改变，正文/关闭像素一致，无横向溢出，关闭后原正文操作可用 |
| `npx vue-tsc --noEmit -p tsconfig.evolution.json`、`npm run ci:check` | 类型与现有源码合同通过 |
| `node scripts/build-framework.mjs` | 最终代码构建通过 |
| `node scripts/record-evolution-settings.cjs --frost` | 桌面1280×900与窄屏390×844，DPR1，两段原速操作完成，无pageerror，关闭后节点/代理退出 |

手动 Canvas 绘制采样为940×760、DPR1、70次有效样本：原霜羽均值0.30ms/p95 0.40ms，含边霜1.83ms/p95 2.20ms。这里只测绘制调用耗时，不代表整帧、GPU完成、真实设备或长期多表面性能预算。

独立只读审查未发现可操作缺陷；审查核对源码、调用链及证据摘要，没有冒充另一次浏览器或实机运行。默认CI设备矩阵和检查名称不变。

## 首轮尚未做（以上方当前裁决为准）

- 负责人认可方向并要求略浅略透，已按顶部修订完成；不以技术通过代替全局画质裁决。
- 本轮候选仅本地保存，尚未推送，未运行本轮 GitHub Actions；SNOW01 的旧成功不能视为本轮通过。下一步归并研发同步与远端验证，不改独立CI专项。
- 设置底材透字是已有问题，本轮如实保留，新增霜层像素保护不等于整体可读性验收。
- 未验证真实游戏/ModLoader、Windows、Android/iOS/WebView和真机性能；无其它窗口推广、main合并、版本/Host/API/规则或Release变更。
