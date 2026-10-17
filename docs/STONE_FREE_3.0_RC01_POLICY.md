# Stone Free RC-01：版本兼容政策

2026-10-17。此政策取代R17的精确配对建议，不追改历史收据。当前为本地待审批RC，不授权推送或发布。

| 身份 | 值 | 责任 |
| --- | --- | --- |
| 官方UI | 3.0.0-rc.1 / DoLGameUI | 产品功能版本，不控制其他消费者升级 |
| 推荐Host包 | 0.1.4-experimental / StoneFreeHost | 安装身份；运行代码与0.1.2/0.1.3相同 |
| 最低Host | 0.1.2-experimental | 必须包含R15场景桥语义修正 |
| 声明范围 | >=0.1.2-experimental && <0.2.0 | Loader安装范围，不是未来版本运行认证 |
| Host协议 | 0.1-experimental | 现有协议/必要方法/能力检查不改，不引入包版本仲裁 |
| 原UI API | v1 | 与Host协议分开；兼容包仍需各自检查API与能力 |
| 官方UI游戏范围 | =0.5.12.13 | 0.5.11.9留作历史有限研究，不列入本RC声明 |
| 原有前置 | ModLoader >=2.100.0；TweeReplacer >=1.0.0 | 实际本轮Loader为2.101.1；下限沿用已有合同，不宣称本轮重测全部旧Loader |

## 为什么最低是0.1.2

当前官方UI使用register、Participant.mount/claim/provideView/dispose，Source/View查询与通知、Binding、MountContext.onScene/onCleanup、diagnostics和capabilities；connect还校验commands/onCommands/invalidateScene/sceneReady等公开方法。冻结0.1.0已暴露同一顶层方法族，但不能以同名证明生命周期等价。

R9的0.1.1保留重复全局对象拒绝；R15提交a95a3ba修改boot桥接：API ready与scene ready分开、桥接前绑定不可执行、jQuery晚到有限重试、部分订阅回滚、失败释放及已渲染场景核对。0.1.2包含这些修正。衣柜/商店/战斗的业务绑定及读档失效依赖该语义，故不能降至0.1.1。0.1.3仅更新README/包身份，运行成员与0.1.2相同，不应成为技术最低要求。0.1.4因本轮包内说明与boot身份改变而使用新版本；不覆盖0.1.3冻结ZIP。

依据：framework/{contracts,host,boot,connect}.ts、official-ui/{main,hub,reference-shelf}.ts及src各页Host接合；冻结包历史控制实验和实际下限Host安装结果见RC-01验收报告。SDK标准配方最低值同样由场景合同决定，不取源码包最新版本；仅用更窄合同的第三方作者应自行给出证据，不被官方UI产品号强制绑定。

## Loader的实际规则

使用当前真实ModLoader2.101.1的getSemVerTools()检查，不用npm semver代替。空格连接 `>=0.1.2-experimental <0.2.0` 没有产生期望上界，且下限自身被误拒绝，不能采用。显式`&&`组合才得到上下界，接受0.1.2/0.1.3/0.1.4，拒绝0.1.0/0.1.1、0.2.0正式版和1.0.0。

已观察到该Loader的prerelease解析有截取现象；此处只承认测试过的比较结果，不声称它等同标准SemVer。按其排序0.2.0预发布可能满足 `<0.2.0`，不属于本RC已经验证或承诺支持的组合。0.1.2-alpha在本轮比较中不满足下限。没有为规避解析差异伪造Host版本号或引入Runtime版本管理器。

现有运行时检查协议/必要方法/disposed/能力，不读取Host包版本。因此低于最低版本但伪装/保留相同协议的方法对象可能仍执行；Loader提示也不保证阻止脚本。文档和测试不能声称“所有错误Host必定被拒绝”。不兼容协议会退让，不牵连无关消费者。

## 维护与升级责任

同一受支持协议代际内，Host维护者应保留已公开方法、资源所有权、Binding失效与结果语义。内部修复、README变更或官方UI仅样式更新，不抬高无关消费者的最低版本。新增Host能力时，由真正需要它的消费者更新下限和测试；破坏性合同必须更换协议并另行明确迁移，不能静默复用旧协议。

`>=`代表在上述维护政策下接受兼容更新的预期，不是未发布版本的运行认证。明确坏版本可收紧/排除，但使用前需先核对Loader语法。0.2及未来主版本不自动加入支持；即使Loader允许某些预发布安装，仍需独立合同评审。UI更新也不自动改变Host GameVersion要求；Host本轮没有游戏白名单，不能据此宣传它已在所有游戏验证。

本轮已验证相同RC UI字节在最低0.1.2与推荐0.1.4上，Windows两组和Android推荐组均完成升级与回退；冻结0.1.3运行成员相同及R17结果作为复用证据，具体收据见STONE_FREE_3.0_RC01.md。未发布的0.1.x、0.2预发布和其它协议组合保持Not validated。
