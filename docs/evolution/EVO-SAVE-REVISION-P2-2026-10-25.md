# 存档revision畸形目标拒绝修复

2026-10-25。GB40-TS-F1，P2。独立终审指出d8430目标槽非record数据被归为空槽。Node26.12.1和Edge实际DOM的原始模块联合夹具已复现；没有真实存档写入、覆盖或损坏证据。243项迁移与原CI信任层保持原结论，整体技术验收因这项P2重新打开。

## 修复范围

`metadata.ts`保留null/undefined正常空槽语义，正常record维持原revision格式及原字段。字符串、数组等未知目标值拒绝可信revision；read不封存该槽，也不伪造空槽日期，健康其它槽继续读取。legacy的非数组slots容器也拒绝。`source.ts`不改：原DOM、原按钮、onclick、disabled、异步过期与revision守卫全部保留。没有增加存档修复写入或改变原生确认。

新增`save-revision-source.cts`直接联合真实metadata/source模块和浏览器DOM，校验原handler计数、零存储写入、读取前后数据不变及原control/onclick身份。32场景覆盖IDB/legacy、空/有效occupied正控、合法变化、畸形初始/封存后变化/互换/恢复、非目标畸形及坏容器，接入标准browser及Expected Lock。正常空槽与occupied均能调用原handler，不能用全拒绝制造通过。

## 本地对照与范围

- 对照ff7942两份原TS文件的Git blob：在新增更严矩阵下30通过/2失败；两项是原已存在的occupied malformed放行，不归为TS新回归。报告指定的空槽→字符串/数组、初始空行畸形等被拒绝。
- d8430同一32场景16通过/16失败，复现畸形目标被当空槽和legacy坏slots归一化的拒绝回退；所有存储写入计数0。
- 本地修复32通过；metadata三项单元、原source M4-B二十项、Moody实际命名收据及完整ci:check通过。原始失败、原模块输入SHA/blob和新测试记录保留于本机忽略artifacts，不发布私人设备材料。
- 联合夹具是Node26/真实浏览器DOM，不是完整SugarCube或真实存档操作。既有购买、战斗、存档业务证据仅复用未变范围，不替代本次metadata新语义。

## 待新提交复验

需要记录新准确源码、两套完整CI与独立回读、九包/双构建/实际成员及执行字节差异，并核对代表性只读存档界面。此阶段尚不能写P2关闭，也不以旧d8430绿灯代替。内部4.0.0-rc.2、main、Tag、Release和负责人G1/G2/G3边界保持原约定。

终审同时指出research-tools图strict=true但未开启noUncheckedIndexedAccess，文档已收紧到实际配置；不为了表述临时扩大所有研究图的检查选项。日期adapter的旧修复仍是既有成果，未归因NaN与长期资源Unknown继续保留。
