# EVO-A2-L01 — 导航挂载事务收敛

2026-10-22，`dev/evolution-4.0`，输入`ca0d606b775ae76f3bc1b321e5b62549afde62cf`。负责人确认当前天气原型后授权“同步一下，然后进行下一步”；本批按已批准P0范围继续A2。Implemented / Controlled Tested，精确提交、独立复核与最终CI见[#22](https://github.com/102326/DoL-Game-UI/issues/22)本批记录；不是整个A2/A3/G1完成。

## 已做

| 编号 | 实际变化 |
| --- | --- |
| EVO-A2-L01-SHARE | 内部`src/ui/navigation-mount.ts`统一Host区域claim、mount、释放与epoch失效；属性/社交共同adapter及通用面板overlay/passage实际调用同一个实现，并在诊断中输出`navigation-mount/v1` |
| EVO-A2-L01-CLAIM | 面板先取得租约再创建自有DOM；争用保持原生内容，解除后可显式refresh重试，退出永久claimUnavailable锁死路径 |
| EVO-A2-L01-RELEASE | 正常关闭/禁用、失败和场景卸载均释放挂载及租约；自己的dispose由epoch屏蔽重入，旧清理不能释放新一轮资源；owner退出后禁止重挂，peer保留 |
| EVO-A2-L01-RECOVER | mount抛错和真实Host setup失败均回到原生路径并允许明确重新启用；保留独立恢复按钮。面板原有class/data恢复；data在运行中被后续改写时不强制覆盖 |
| EVO-A3-NAV-FIRST | 删除属性/社交adapter、通用面板两宿主中独立持有MountHandle/Claim和重复Host cleanup回调；不是只增加一个未使用模块 |
| CI-HANDOFF-01 | 同步天气原型验收、HANDOFF、P0迁移增量和Issue当前状态；旧天气源码、媒体与失败记录保留 |

保留overlay persistent、正文passage和classic三条合法宿主语义；未把面板硬塞进属性/社交组件。分组发现、Vue组件、12/16px坐标余量、原生滚动/点击、业务和专属演出不改；Host公共接口/版本不改。共同事务不拥有原生正文或重试游戏事件，没有新增中央Runtime、包或依赖。

## 受控反例与验证

扩展现有`tests/panels-framework.cjs`，通过Vite只读加载固定旧提交的真实面板模块执行`--baseline`；不覆盖工作树源码。六类overlay（traits/journal/statistics/gameFeats/cheats/options）及四种passage（Attitudes/Livestock Attitudes/Settings/Livestock Settings）均采集同组结果。旧版在claim-before-DOM、争用解除后重入、正常关闭租约释放、元信息恢复及故障恢复上被实际拒绝；原节点/事件本来正常，不包装成被修复的产品缺陷。

`--baseline`要求本机已有固定旧提交；浅克隆缺失时先fetch该SHA，缺Git对象不算有效反例。

默认新实现检查上述十种宿主的先claim、解除争用重试、正常释放、还原、再次争用/恢复、mount抛错、setup失败/恢复、owner退出/peer保留及原节点单次事件。原有scene invalidation/reentry、overlay替换/自有host移除重挂、classic与原生节点检查全部保留。模型仍是受控DOM＋真实Vue/Host，不是实际游戏/ModLoader验收。

本机macOS / Node24.18 / Chromium153：

- `node tests/panels-framework.cjs --baseline`：预期非零退出，旧行为反例成立；十组证据在断言前全部输出。
- `node tests/panels-framework.cjs`：原检查及十组新增生命周期通过。
- `node scripts/build-framework.mjs`：生产Framework样式/入口构建通过。
- `node tests/evolution-navigation.cjs`：真实属性/社交两端通过，保留隐藏/争用/owner/异常、最新意图、原节点/事件及三档Zoom；同时核对共同事务身份。
- `node tests/evolution-panels.cjs`：六类真实面板三档Zoom、节点/事件及释放通过。
- `npm run ci:check` 与 Evolution类型检查通过。

新增断言沿用已有浏览器suite，两条CI均已执行此测试入口，不再造新Runner或扩大设备矩阵。逐宿主布尔证据输出到现有受控测试日志，原始本机日志在忽略目录；另一设备须运行或取得对应CI日志，不能假定拥有本地文件。独立只读静态复核未发现阻断问题，复核覆盖helper、两类消费者及真实Host/测试合同，没有重复运行本机检查，也不代替游戏验证。最终提交的云端状态另核对，不把推送/未执行称为通过。

## 未做与下一步

其它原生呈现/OrbitFocus、设置正式入口、材质/天气多表面整合、Hub、商店/衣柜/战斗/存档及其它已批准消费者尚未全部迁移；本批不宣称全量纳管或G1通过。Golden Spin V2仍需处理真实工具在演出中的可操作性及H1–H4；当前已认可球体、设置V2.3与天气原型保持。Windows、Android/iOS/WebView、实际游戏/第三方混合和长期运行尚未验证。无main合并、发布、规则/bypass或存档操作。

接续优先按P0矩阵逐消费者推广同一管理合同；下一视觉批次为Golden Spin V2真实Hub输入联动，不重做已认可球体或擅改工具/布局。正式天气/设置整合仍需单独落实生产宿主与管理合同，不能把原型通过直接标Integrated。
