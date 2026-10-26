# B1：ModHub别名规则复用离线候选

2026-10-26。仅Node研究，不是可安装的ModHub补丁，不被UI入口导入。

使用项目Node26.12.1与锁定开发依赖，在仓库根目录：

```sh
node docs/evolution/perf-4.1-evidence-20261026/check-inference.mts docs/evolution/perf-4.1-candidates-20261026/alias-patterns.mts
node docs/evolution/perf-4.1-candidates-20261026/check-alias-patterns.mts
npx tsc -p tsconfig.research-tools.json
```

- `alias-patterns.mts` 从冻结1.8.3函数精确提取三条正则，先核对固定摘要；使用Node VM隔离原算法与候选，不改正则含义或原文件。导出的函数必须显式传catalog，尚未接入原闭包的 `marketModList` 默认参数。
- 只复用不带g/y的别名匹配规则；1024项LRU，超过256字符的别名不缓存。每次重新建立身份、歧义与结果，不缓存描述、Mod对象、目录或安装状态，也不改变签名／异步 `current()`。
- 当本轮既有 `names.size > 1024` 时执行原三条构造表达式，不进入LRU，避免大目录的循环淘汰。仍存在条件判断及代码形态开销，不能称为零成本回退。
- `check-alias-patterns` 比较1276个确定性状态，包括同对象字段变化、别名冲突的引入／消除、目录替换、浅拷贝、返回污染、驱逐重建和超长旁路；它不是1276个真实Mod或游戏业务用例。原来的26场景／6步及两个错误缓存反例保留原件。
- 构造计数用单独Proxy；计时不注入。25／100／250／400目录，每档冷1次／热10次，两侧每对新建VM与函数；热测量前等量预热10次。丢弃2对后保留12对交替顺序。VM创建不计时，进程／引擎缓存未重置，冷不等于系统冷启动。

结果与边界见[本批报告](../EVO-4.1-B1-2026-10-26.md)。`alias-patterns-result.json` 为最终候选；`rejected-churn-result.json` 是**前一版**容量抖动反例，源摘要不同，不能拿它当当前源码的测量，也不能用当前工具复跑出同一中间版本。最初不对称预热的数据仅在本机保留，已排除出结论。

所有PASS只说明等价／资源与采集断言通过。最终400目录热路径仍慢于原函数，尚未通过整体性能验收；不宜直接整合或发布。后续应先核对实际catalog规模、调用频度和接入方式，再决定改写为上游原生代码或撤回。不得通过继续扩大缓存掩盖容量边界。

许可来源：[冻结源码及MIT许可](../perf-4.1-evidence-20261026/NOTICE-ModHub.txt)。本目录SHA清单覆盖两个工具与三份JSON，不包含自身和本说明。
