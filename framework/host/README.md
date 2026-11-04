# Soft & Wet 4.x配套 StoneFreeHost 0.1.5-experimental

Host提供独立公共UI机制，不含官方界面。先启用Host，再启用UI，按Loader提示重启；无需安装开发样例、Factory或独立MotionHub。当前UI4.1.0与Host版本分别管理，依赖范围保持既有>=0.1.2-experimental && <0.2.0，协议为0.1-experimental。

实现保留Host内部信号合并，不硬依赖AbortSignal.any、不修改浏览器全局；仍需要基础AbortController、MutationObserver等实际能力。Host不接管业务变量、存档事务或第三方算法。未知Host不覆盖，Source失败/Command unknown不代表业务未执行，不自动重试。

能力不符按现有诊断与原入口退让。回退恢复配对包并重启；还有消费者依赖Host时勿单独停用，不清空存档。运行、设备及发布结果按对应4.x源码证据判断，不把旧P0验收签给新UI。源码当前合同见仓库docs/HOST_4X.md；许可证见LICENSE。授权存档仅隔离复现，不自动进入公开Artifact。
