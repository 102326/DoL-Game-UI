# 存档revision畸形目标拒绝修复

2026-10-25。GB40-TS-F1，P2。独立终审指出d8430目标槽非record数据被归为空槽。Node26.12.1和Edge实际DOM的原始模块联合夹具已复现；没有真实存档写入、覆盖或损坏证据。该发现曾重新打开整体技术验收；本次修复与复验结果见下文，243项迁移与原CI信任层保持原结论。

## 修复范围

`metadata.ts`保留null/undefined正常空槽语义，正常record维持原revision格式及原字段。字符串、数组等未知目标值拒绝可信revision；read不封存该槽，也不伪造空槽日期，健康其它槽继续读取。legacy的非数组slots容器也拒绝。`source.ts`不改：原DOM、原按钮、onclick、disabled、异步过期与revision守卫全部保留。没有增加存档修复写入或改变原生确认。

新增`save-revision-source.cts`直接联合真实metadata/source模块和浏览器DOM，校验原handler计数、零存储写入、读取前后数据不变及原control/onclick身份。32场景覆盖IDB/legacy、空/有效occupied正控、合法变化、畸形初始/封存后变化/互换/恢复、非目标畸形及坏容器，接入标准browser及Expected Lock。正常空槽与occupied均能调用原handler，不能用全拒绝制造通过。

## 本地对照与范围

- 对照ff7942两份原TS文件的Git blob：在新增更严矩阵下30通过/2失败；两项是原已存在的occupied malformed放行，不归为TS新回归。报告指定的空槽→字符串/数组、初始空行畸形等被拒绝。
- d8430同一32场景16通过/16失败，复现畸形目标被当空槽和legacy坏slots归一化的拒绝回退；所有存储写入计数0。
- 本地修复32通过；metadata三项单元、原source M4-B二十项、Moody实际命名收据及完整ci:check通过。原始失败、原模块输入SHA/blob和新测试记录保留于本机忽略artifacts，不发布私人设备材料。
- 联合夹具是Node26/真实浏览器DOM，不是完整SugarCube或真实存档操作。既有购买、战斗、存档业务证据仅复用未变范围，不替代本次metadata新语义。

## 新提交复验结果

受验代码为`178f8b2b5b1828038b7c3ec304e8995bbe99ee38`。本记录后续补交的文档提交不冒称该代码CI的执行对象。

| 验证 | 结果与范围 |
| --- | --- |
| 标准CI | [40175814517](https://github.com/102326/DoL-Game-UI/actions/runs/40175814517)完整success，含新32场景、原反例、独立evidence-verify及moody-gate |
| 研究CI | [40175811238](https://github.com/102326/DoL-Game-UI/actions/runs/40175811238)完整success，含独立evidence-verify |
| 独立下载 | 两份remote-verification和summary准确绑定178f8b2、dirty=false、Node26.12.1、PASS/COMPLETE，无problems/reasonCodes；原始研究包123098321字节下载及CRC通过 |
| 制品 | 10项SHA-256、9ZIP的CRC/元数据/依赖/许可/逐成员合同通过，双构建PASS且differences=[]；[新九包冻结清单](EVO-SAVE-REVISION-P2-PACKAGES-2026-10-25.json)保留准确来源及对照 |
| 与d8430差异 | 仅DoLGameUI ZIP及其中index.js改变。Host和另外七个兼容ZIP容器及全部成员完全相同；原版本/依赖/许可未变，source.ts原字节不变 |
| Windows | Edge157.0.4341.16、隔离DoL0.5.12.13真实Loader；八个适用包实际加载成员与新CI一致，原生存档入口打开/读取/关闭通过，11个可识别条目；本环境无已有存档，不冒称occupied业务验证 |
| Android | 测试App、WebView155.0.8059.43、1363×876/dpr2.5；仅替换已备份的UI包并原生重启，八个适用包加载成员与新CI一致，顺序/禁用列表/偏好保留；原生存档页打开/读取/关闭通过，前后IDB及legacy摘要哈希不变，回到Start |

Android的四个已有槽位包含`saveTitle`及额外彩色摘要span，原source合同保留为原生行；它们可见、未被UI隐藏，原载入/删除处理器存在。七个可识别条目为自动槽及空槽5–10。本机初次检查脚本错误地要求已有槽必须出现在`.dgs-item`中，因此失败；已保留该脚本和诊断，改为明确验证四个原生行可见及处理器，而非修改产品合同或正式断言。另一次关闭检查误用了`button.customOverlayClose`；实际节点并非button，改用已观察的`.customOverlayClose`后完成关闭，产品代码未改。

没有点击保存、载入、覆盖、删除、名称编辑、导入或导出；真实存档写入及畸形真实存档注入未测试。畸形拒绝与正常handler正控由32项真实模块联合合同负责，不将其等同完整SugarCube存档业务。原生行保留是既有明确回退边界，不为本次P2扩展DOM接管。

## 完成与剩余边界

**Implemented / Validated：本次P2修复、合同、两套CI、制品身份及代表性只读实机范围完成。Independent Re-review：Pending，等待独立复核，不代签终审。** 243/243迁移结论保留，本次必要修复的技术复验已完成。未改部分的Windows/Android设置、Hub、天气及既有业务证据按相同源码/相同包范围复用，不重新包装为178f8b2的全量业务测试。

本轮未发现新增产品阻塞；不声称已经验证所有设备/社区组合、真实畸形存档或长期资源。内部4.0.0-rc.2、main、Tag、Release、公开Assets和负责人G1/G2/G3边界保持原约定；未发布。

终审同时指出research-tools图strict=true但未开启noUncheckedIndexedAccess，文档已收紧到实际配置；不为了表述临时扩大所有研究图的检查选项。日期adapter的旧修复仍是既有成果，未归因NaN与长期资源Unknown继续保留。
