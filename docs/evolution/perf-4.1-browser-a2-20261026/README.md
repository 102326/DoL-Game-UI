# 浏览器B与A2受控证据

范围与结论见[整体报告](../EVO-4.1-MAC-BROWSER-A2-2026-10-26.md)。本目录不包含完整游戏、存档或原始trace。

- `browser-final.json`：最终浏览器原生候选合同与逐对冷热观察；`browser-original.js.txt`／`browser-candidate.js.txt`是实际执行字节，仅作冻结快照，不是维护入口或安装包。
- `browser-initial-protocol.json`／`browser-split-tail.json`：前两阶段的负结果；对应`initial-*`／`split-tail-*`工具文本快照。不得和最终样本合并或当作当前源码。
- `measured-build-alias-browser.mts.txt`／`source-bindings.json`：测量构建器与后来追加的review生成器差异；当前browserBundle输出与测量字节一致。
- `a2-opening.json`：最终内存探针投影。原始trace只在本机，摘要绑定但不假定另一设备可以读取。带探针时间不是产品性能预算。
- `.patch`与`patch-validation.json`：只对冻结1.8.3的上游评审稿，已在独立临时目录检查／应用并重算字节；未安装或应用到仓库vendor。来源与MIT许可见 `NOTICE-ModHub.txt`。
- `initial-ci-receipt.json`：起始c7e4995的两套CI与标准192项本地下载核对，不覆盖后来新增的工具。最终Run见整体报告收口记录。
- `final-ci-receipt.json`：精确实现179c80f的标准／研究成功及独立下载验收、标准192项937715字节本地核对与九个下载ZIP摘要；不代表完整游戏或设备接受。

维护入口是相邻 `perf-4.1-candidates-20261026/` 中严格MTS。SHA清单覆盖列明的冻结数据／快照，不覆盖本README及自身。PASS仅指对应受控断言和采集完成，不能替代真实业务、设备或整体性能接受。
