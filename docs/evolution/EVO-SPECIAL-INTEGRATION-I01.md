# I01：已认可特殊天气接入实际设置

2026-10-24，`dev/evolution-4.0`，基于 `3aea28a` 的未提交工作区。仅整合负责人已认可的血月B01、异世界/极热/严寒S01；恢复原普通雨，不增加新视觉或发布范围。

## 交付

- 绘制器移入 `src/ui/weather/`，原型保留薄导出。仅修改类型导入路径，归一化源码SHA与原认可媒体完全相同，见[迁移身份](EVO-SPECIAL-INTEGRATION-I01.json)。没有再次调色或改变已认可绘制。
- 实际 `settingsWeather` 接入两种绘制器，复用原天气读取、Canvas、时钟、减少动态及生命周期。首次需要相应特殊天气时才创建纹理，共最多11张内部画布；关闭释放。
- 分类转场逐帧跟踪真实文字和控件保护范围，避免下半部环境光整块消失。雨滴仍使用原保护、颜色、尺寸和轨迹。
- 预览移除Vite源码替换插件，5195/5196直接运行上述实际设置路径。旧预览服务曾因热更新后仍持有旧注入插件报替换点断言错误；已重启为无注入版本，不修改断言掩盖失败。
- 血雨BR01/BR02仍只保留为停用历史，不被实际入口导入。其它官方窗口现有CSS/SVG天气路径、Host合同、游戏业务、存档和公开版本均未改。

## 当前验证

Windows、Node 26.12.1、Edge 157.0.4341.16：

| 检查 | 结果与范围 |
| --- | --- |
| `npm run ci:check` | PASS：类型、Framework合同、Expected Lock；锁更新只增加本轮断言位置与摘要 |
| 预览/录制脚本独立TypeScript | PASS |
| `node tests/weather-special.cjs` | PASS：原生读取映射、四种环境、雨雪共存、正文/关闭按钮像素、实际输入、390px、动态关闭、转场连续性、11张纹理复用与释放 |
| `node tests/evolution-weather-integration.cjs` | PASS：W01全部9组；保留原3500ms时序断言，没有放宽 |
| `node tests/header-weather.cjs` | PASS：已有官方顶栏路径回归 |
| `node tests/official-defaults.cjs` | PASS：实际构建Host/UI在受控夹具启动；不是实际Loader或设备验收 |
| `node scripts/check-evolution-rain-rollback.ts` | PASS：[6项检查与当前截图](../media/evolution-special-integration-rain/rollback.json)，普通雨与血月雨的滴体/折射完全一致，认可绘制未变，正文保护与释放正常 |
| `npm run ci:build` | PASS：UI、Host及七个兼容包构建与包合同检查；仅本地研究包 |
| `npm run ci:packages` | PASS：两次独立构建的9包成员/压缩字节/元数据/ZIP摘要一致，9项负向/版本/证据测试通过；[包身份与摘要](EVO-SPECIAL-INTEGRATION-I01.json) |

包检查第一次在全部构建和9项测试通过后，因输出目录残留历史日期兼容包1.0.2而拒绝导出；该旧目录已整体保留在忽略的本地证据中，清空输出位置后重新完整检查通过。未删除失败断言或修改打包策略。校验记录覆盖检查时的工作区，之后仅增加本报告和结果JSON；没有把这些后写文档冒充已受验输入。

本地UI ZIP摘要为 `6f2884ae18320db84a6d0252ed6423b19022f28cd511461f1c9a040745946126`。逐成员对照历史c215239下载：Host、日期包、CE、ReOverfits及Lyra成员相同；UI、ModHub、MapleBirch及SmartPhone存在成员字节差异，不能以旧安装证据声称本轮这些本地包已装机通过。当前未修改兼容包源码，差异及具体成员摘要均保留，不据此扩大兼容声明。

原B01/S01视频保留其原始输入身份，没有把原视频改称本轮装机录像。当前预览命令：`node scripts/preview-evolution-blood-moon.ts --special`。普通雨对照Alt+0，雨中血月Alt+3。

## 边界与下一步

本轮为 **Integrated / 本地针对性验证通过**。旧c215239九包和旧CI仍是历史证据，不能替代本轮源码；本地研究包没有获得正式发行身份。

尚未将新UI字节安装至Android，也未触发自然特殊事件、iOS或长期资源测试；未重跑本地全量游戏业务。原有资源Unknown继续保留。后续先固化源码、取得对应CI与受影响设置场景的候选安装复验，再提交最终G2/G3裁决。不会自动把新模型推广到其它窗口，也不合并main、Tag或发布。
