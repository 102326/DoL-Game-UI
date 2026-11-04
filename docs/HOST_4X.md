# Soft & Wet 4.x — Host、公共能力与消费者合同

本文件按当前4.1实现整理，事实源为[contracts.ts](../framework/contracts.ts)、[Host](../framework/host.ts)、[启动桥](../framework/boot.ts)、[公共UI接口](UI_RUNTIME.md)和实际打包器。不是重构或协议升级批准。

## 分发与职责

正式分发是独立`StoneFreeHost`与`DoLGameUI`。UI产品4.1.0；当前Host包0.1.5-experimental、公共protocolVersion为0.1-experimental。这些版本独立管理，不将Host改称4.1，也不改消费者现有依赖范围。正式玩家九包清单见[4.1发布](RELEASE_4.1.0.md)，开发样例/Factory/独立MotionHub不是玩家必须安装的第三包。

Host负责参与者、Binding/场景代际、Mount、资源租约、Source/View/Command发现和释放；UI负责最终表现，兼容包负责目标业务语义。Host不接管存档、交易、穿戴、战斗、Mod安装/更新算法。公共能力整合候选沿[4.1调查](evolution/EVO-4.1-HOST-SHARED-SURVEY-2026-10-26.md)评估，不自动上移。

## 注册、通信与生命周期

- `host.register(id)`返回Participant；注册者持有并dispose，避免重复身份。`mount({id,parent,lifetime,setup})`支持passage/persistent，返回ready/isCurrent/dispose。setup通过context.signal、isCurrent、binding、onCleanup、onScene管理当前归属。
- `host.binding()`含signal/generation/isCurrent。异步read或run完成后仍应检查绑定；场景失效、卸载或中断后的迟到结果不得再写界面。资源`claim(region|shortcut|modal,key)`须由持有者release，退出保持幂等。
- `provide`、`provideView`、`provideCommand`返回撤销函数；发现通过sources(schema)、views()、commands(schema)及对应订阅。Source read明确ok或missing/stale/failed/invalid-value；Command结果区分returned/missing/stale/busy/unknown。unknown不等于业务未执行，不能自动重试。
- SugarCube桥在passageinit/onloadsave使代际失效，在passageend/storyready恢复就绪，不创建游戏moment。onloadsave是当前宿主接入，不冒充任意SugarCube的通用承诺。保留现有注册顺序、有限初始化等待和异常隔离。

Host缺失、初始化失败、协议/能力不符时保留消费者原入口或按既有启动诊断退让，不覆盖未知全局Host，不强制接入第三方。消费者撤销贡献、释放Mount/claim/listener及自己的业务资源；Host dispose不代表可擅自结束第三方事务。没有改变现有加载顺序或热升级承诺。

## 作者与研究入口

`npm run framework:build`构建当前Host、官方UI及已有受控样例/Author Kit。`node scripts/framework-factory.mjs create <new-directory> <technical-name>`只在全新目录生成模板；按生成项目的package.json预览、检查和打包。源码Kit不是Mod，不导入Loader，不自动安装依赖。协议目前experimental，不承诺通用SDK稳定性或所有未来包版本兼容。

当前4.x验证入口见[开发](DEVELOPMENT.md)、[CI](CI.md)；当前事实与旧实验结果分开。Host包/协议、独立兼容Mod及外部依赖仍可有0.x/1.x/2.x/3.x版本，这不属于已封存的UI旧产品代码。
