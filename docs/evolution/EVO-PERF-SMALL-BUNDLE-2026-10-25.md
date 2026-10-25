# Android 性能小型证据包

2026-10-25。供独立复核现有测量使用。本轮整理和复算了已有数据，没有重新采样或重跑完整验收。

证据包 `SoftWet_Android_Performance_Evidence_2026-10-25.zip` 的 SHA-256 为 `92243e5d0ec300eca522b3eb04da6d1cf78ca9055331016d57c1b7e5d23cf038`。包内含动态和静态 Perfetto CSV、点击事件来源、重建 SQL、复算脚本、采样条件和逐文件 SHA-256；不含完整系统 trace。

## 结果

| 指标 | 原始行数 | 接受样本 | 中位数 | p95 | 最大值 |
|---|---:|---:|---:|---:|---:|
| 动态 `WebViewFunctor::drawVk` elapsed | 940 | 925 | 11.057152 ms | 32.140294 ms | 100.677984 ms |
| 动态目标 App surface 相邻帧间隔 | 940 | 925 | 16.284512 ms | 31.559046 ms | 95.301568 ms |
| 静态 `drawVk` elapsed | 200 | 196 | 10.892688 ms | 18.368568 ms | 24.523008 ms |
| 静态目标 App surface 相邻帧间隔 | 199 | 195 | 79.986624 ms | 119.319325 ms | 119.722688 ms |

动态样本 Late Present 为313／926。完整分析还显示动态帧存在明显长尾，因此不能据此称全程流畅。`drawVk` elapsed 不是 GPU 执行时间。静态样本关闭了 UI 动效，但 UI 仍启用；它不会在每个刷新周期都提交画面，不能把静态帧间隔解释成刷新率。

Perfetto 输出的动态 drawVk/app-frame CSV 各含 940 条数据行。窗口裁剪后分别接受 925 条；drawVk 排除 7 条起点早于分析窗口、8 条结束于窗口之后的行。app-frame 有 1 条没有 `prev_ts`，另有边界行被排除，细项可由包内 `analyze-csv.py` 重算。静态 drawVk 原始 200 条、接受 196 条；静态 app-frame 原始 199 条、接受 195 条。动态及静态 app-frame 各有一条无前一帧时间戳；drawVk 不使用该字段。所有 CSV 的额外字段行、不可解析数值字段均为 0。上述数字是导出 CSV 的行级统计，不是 Perfetto 未解析帧的统计。

采集元数据没有保存未解析帧记录的分母或数量，也没有独立核算。虽然当时 `trace_error_stats` 为空，这不能证明未解析帧数为零。

四次真实触控生成的 click `PerformanceEventTiming.duration` 为：动画开启120／88 ms，动画关闭40／24 ms。每种状态只有两个样本，不代表完整 INP 分布或 USB/CDP 往返时间。`touch-events.csv` 是从原始 `event-timing.json` 投影出的四条 click 子集，不是当时直接导出的原始 CSV；每条记录的 `source_index` 指向随包保存的完整 `touch-event-timing.json`。

## 采样条件与解释边界

测量包是本地临时 `DoLGameUI 4.0.0-rc.2`，SHA-256 `ecca6ddfdfd4f658ba7baca4284decb38e5306aefd0993a4478837351ab3dc17`，基于 `37d1baf` 并含未提交的头部、Canvas 与 cadence 修改。既有发布准备记录及装机 readback 证明该临时包的运行时代码成员与冻结 RC2 UI `e4a37ca448272308351f35fe1a5bded4bc64a24e4361528922d33e0e49eb5a17` 字节一致，变化仅在发布文档。证据引用见随包 `measurement-source.json`。

当前正式准备源码 `4ebe0bb` 只调整版本标识、文档和仓库指引；它没有在本轮性能采样，也没有作为本证据包中的被测安装包。不能把 RC2 历史样本标作正式 4.0.0 实测。

场景为 DoL Android 测试 App 设置窗口与自然 storm／severe 雨。动态状态开启 UI 动效和普通雨效；静态状态保持 UI 开启、关闭视觉动效。动态 trace 先采，约28秒后采静态 trace，没有随机交错。设备记录到 Android 17、SDK 37、WebView 155.0.8059.43、CSS 视口1363×876、DPR 2.5。设备型号、刷新率、省电状态、trace期间是否录屏，以及每个上游 Mod 的精确版本均未记录。已启用 Mod 名称快照不能证明 trace 采集时的具体版本。

没有停用 UI 对照，也没有最小 Mod 组合对照。静态样本不是原版对照。当前证据不能把卡顿归因于原版游戏，也不能排除其他 Mod、WebView 或设备调度。

## 复核材料

本地文件夹 `dist/perf-small-bundle-2026-10-25/` 含原始导出 CSV、事件计时 JSON、SQL、分析脚本、条件与来源记录、README 和校验清单。SQL 是按既有导出 helper 重建的查询；采样时临时调用的原始 cadence SQL 文本没有保存。CSV 和事件记录取自既有采样证据，没有根据汇总数重建。
