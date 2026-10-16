# Stone Free：独立发行就绪与衣柜参考空间

2026-10-17。依据独立双 Mod 决议与 Accept with Changes 复审，正式目标为独立 Framework Host + 独立官方 UI 消费者。本文记录第九轮实际交付；没有推送、合并或正式发布。

本轮范围已完成：接入错误边界、五条有限发行流程、Windows/Android 最终研究包正常安装，以及只读 Wardrobe Reference Space。它使独立发行基础设施进入就绪状态，不表示正式衣柜、商店、战斗已全部迁移或整个 3.0 已完成。

## 源码与制品

工作区 `experiments/stone-free-framework-30`，分支 `research/stone-free-3.0-framework`，接续基线 `41fba02570252cd5a26d311834961e4f73b7d856`。本轮变更留在该工作区，未创建新提交。正式 `src/` UI 2.7.0、稳定 API v1、偏好与存档合同没有改动。

研究包版本统一为 `0.1.1-experimental`；公共协议保持 `0.1-experimental`。H 为 `StoneFreeHost`，U 为 `StoneFreeMotionHub`，T 为 `StoneFreeNativeStatus`。消费者精确声明同版本 Host，首版按明确配对同步发行。独立安装、构建与主动退出已有证据，任意跨版本独立升级没有承诺。

最终产物位于 `dist/framework/`：

| 包 | 字节数 | SHA-256 |
| --- | ---: | --- |
| H | 11224 | `7f393f438111a2679d329e3301ba6b7456e88a21a3ac606da2bc995d2815902c` |
| U | 37472 | `b0f23f0c33a7e10875638ba1a959ad6604c58f8ce9a6918fd4a2c7965264d8df` |
| T | 35876 | `5ac008db7e76a8cb708532514356e86d6a4b0f19f5455788e9558f3a0399caca` |
| Wardrobe Reference | 35414 | `40c579b28412360e1f544eff535b81f2455d3feb1efad4fd5ef2f89e169f985f` |
| Author Kit（开发源码） | 13311 | `105176fd16b37a14aac8631a315d259b4dad1d7a18c62ae261d40028b5e7f139` |

其它历史研究消费者仍可单独构建，并非正式产品要求玩家安装的文件清单。Author Kit 不是运行 Mod。最终 ZIP 的正常路径在两端验证；集中负例使用较早的同轮 ZIP，之后仅 README 改动，JS/CSS 与最终包相同，不能称为两组 ZIP 字节完全相同。

## 接入与资源边界

`framework/connect.ts` 将全局读取、协议和方法属性、diagnostics/capabilities 及消费者初始化纳入同一错误边界，区分缺 Host、无法识别、协议不支持、缺方法、disposed 和初始化失败。异常信息有限且去重，不披露原异常正文。不认证第三方对象，也不建立 Runtime 仲裁。

各消费者入口在取得 participant 后使用局部 try/cleanup；声明或初始化中断时释放自己的资源。Host 不会自动认识在它之外创建的监听或 DOM，作者仍需自行释放。Factory 已有这一模式，本轮只更新 SDK/明确包版本。

源码核对发现 Hub 在自行创建领域来源时使用了独立来源包的 participant 名，可能与稍后加载的 T 冲突。本轮将 Hub 自建来源分别归属 `MotionHubStatus / MotionHubReading`，T 保持自己的身份；逆序安装检查通过。这是来源所有权修正，没有改变游戏真值或公开 Host 协议。

Host 拒绝已占用的全局属性，包括抛异常 getter；不覆盖或删除未知提供方。主动退出 U 只释放 U 及其自建适配器；关闭一个视图不等于退出消费者。Loader 停用后重启是另一条路径，本轮不承诺整包热卸载。

## Loader 实际行为

检查对象为实际运行的 ModLoader `2.101.1`。本地源码参考 `upstream/modloader-2.101.1-source/src/BeforeSC2/DependenceChecker.ts`、`ModLoader.ts` 和 `ModZipReader.ts`；结论以真实安装结果为准。

| 条件 | 实际结果 |
| --- | --- |
| 缺 Host | Loader 报依赖错误，派发夹具证明消费者脚本仍执行；接入器拒绝，未挂载 UI。 |
| 不支持的 Host 协议 | 夹具 Host 和消费者脚本执行；消费者报告 unsupported protocol，未进入 participant。 |
| U、T 在 H 前 | Loader 报顺序问题；消费者等待 Host ready 后接入，共存可用。 |
| 同 boot.name 的两份 Host | 初始装载集合保留后出现的版本；只执行最终提供方，不是重复版本自动拒绝。 |
| 全局名被异常对象占用 | Host 不覆盖；消费者访问失败被收敛，未留半初始化 UI。 |
| 包版本不满足但协议仍相同 | 升级夹具被 Loader 报版本错误，脚本仍运行；只证明该夹具组合，不扩大支持声明。 |

`dependenceInfo` 不是自动执行屏障。负例的 `DispatchUI / DispatchPeer` 是当前 JS 前加派发标记的明确夹具，用于区分“未派发”与“已派发后拒绝”；不伪装成正式制品。旧 U 夹具保留上轮 U 的运行资源，仅调整清楚标记的版本/依赖；新 H 夹具保留当前 H 运行资源，仅改包版本。没有第二个真实发布 Host 的跨版本兼容证明。

## 五条有限发行流程

| 流程 | 本轮证明 |
| --- | --- |
| A-1 独立与共存 | H 单独、H+T、H+U+T 正常安装重启；T 无需官方 UI。H-only 与原生基线的 money/pain/stress/tiredness 四字段一致，Host 源码无业务写入；不是全状态穷举。 |
| A-2 更新与退出 | 保留 H/T 更新旧 U 夹具到新 U，实际加载新版本；使用 U 的退出按钮后 T 仍可读。停用/恢复 U 后重启无重复 participant；缺 H 后重启的失败与恢复也已覆盖。 |
| A-3 Host 更新 | U/T ZIP 字节不改，更新为明确标记的新 H 夹具后仍工作；恢复正确配对。仅为升级机制实验。 |
| A-4 有限负例 | 缺 H、协议不支持、逆序、重复同名 Host、全局名占用，记录 Loader 报告、脚本派发及最终诊断。 |
| A-5 失效与局部失败 | 半初始化夹具的 participant、DOM 和监听均释放，H/U/T 继续可用。最终实包两端通过原版 Start Game! 自然进入 Start2，旧绑定 aborted、旧命令返回 stale、passage 挂载清理一次，新的来源可读。 |

集中流程在 Windows Edge 完成；Android 使用最终 H/U/T ZIP 做原生基线、H-only、H+T、H+T+U、可见 Hub 工具与自然导航。依赖负例没有在 Android 重复整套矩阵。

桌面输入为独立测试 APK 的 `assets/www/index.html`，SHA-256 `c6441487307e66b79f34b62a75497bd4cdca911a6ab60beb90a329d7233d65f0`。只在内存中移除预装 ZIP 列表，使用新浏览器配置文件和实际 Loader IndexedDB 导入 API，每个组合正常重载。不是临时 eval 注入 Host。

Android 为平板 M367FC、Android 17、独立测试 App `com.vrelnir.dol.lyra.uicompat051213`，DoL `0.5.12.13`、Loader `2.101.1`，WebView Chromium `154.0.8037.58`。标准 Action 重启后重新绑定文档。备份并恢复原 active/hidden Mod 清单，只导入和删除自己的研究 ZIP，未覆盖原 Mod 或玩家存档。没有验证已安装 APK 的完整文件哈希，不把本地 APK 当作安装字节身份凭证。

## Wardrobe Reference Space

新增可选消费者 `framework/wardrobe-reference/`，复用既有衣柜只读投影。流程为固定 A → 浏览并选择 B → 普通或空间比较 → 返回。两种比较使用同一份字段，不分别实现算法。空间模式从所选 B 卡片的位置展开；A 留在参考栏，返回立即恢复该目录的分类、搜索、滚动和 B 焦点，不等待动画结束。

这是自有的只读辅助目录。原版衣柜仍在，单击穿戴语义未改变；没有恢复“先浏览再确认穿戴”实验，也没有第二套试穿、装备恢复或库存系统。返回恢复的是参考目录位置，不冒称恢复原版衣柜的内部筛选状态。

A 仅保留复制的显示快照和来源描述，B 在比较时重新核对当前目录。场景失效立即清除 A/B、目录及原节点引用；persistent 入口 participant/mount 留下等待下一次衣柜，离开页面后不显示 UI。完整包停用/释放时由既有 participant 生命周期清理。未知槽位只提示原版入口，不猜业务语义。

真实游戏通过原版 Start → Start2 → Orphanage Intro → Bedroom → Wardrobe 路径进入，未调用 Engine.play、写 State 或广播假 Passage。Android 事先核对这条路径的原 autosave 标签，没有执行存档写入。

| 验证 | 结果与边界 |
| --- | --- |
| Windows 实包原版衣柜 | 11 个已知分类、7 件目录条目；跨分类、查询、A/B 两种模式内容一致；库存/穿戴/位置字段摘要一致；原版目录保留。 |
| Android 实包原版衣柜 | A/B 比较、返回焦点、快速关闭、自然退出 Bedroom 通过；库存/穿戴摘要前后一致。已恢复原 Mod 清单。 |
| 窄屏 | 真实游戏在受控 390×844 浏览器视口内可完成；是浏览器布局证明，不是物理手机触控。 |
| 40 条目夹具 | 目录滚动位置恢复、场景失效、异步帧中断、减少动态效果和释放通过。实际小库存没有滚动溢出，未冒称实机大列表已证明。 |

目前可感知的区别是空间模式保留 B 的来源位置联系，普通模式直接进入同一比较；没有多用户偏好或效率收益结论。该辅助目录尚无服装图片、真实试穿或持久参考。建议保留为可选研究消费者继续试用，不推广成所有衣柜操作的中心。

## 验证入口与本地证据

本轮 `npm run framework:build`、`framework:check`、`framework:test`（32 组基础/接入）、`framework:author-kit:test`（4 组）、`node tests/framework-connect.cjs` 和衣柜夹具/真实游戏检查通过。没有重新运行整个正式 2.7 游戏回归。

本地收据保留在忽略的 `tests/artifacts/`，不装进 Mod ZIP：

- 接入：`stone-free-connect/browser-1792180514423/result.json`。
- 集中发行流程：`stone-free-distribution/desktop-1792179756388/result.json`。
- 最终桌面配对与自然导航：`stone-free-distribution/desktop-1792180149257/result.json`。
- 最终 Android 配对、自然导航与恢复：`stone-free-distribution/android-1792180119695/result.json`。
- 衣柜 40 条目夹具：`stone-free-reference/browser-1792179801671/result.json`。
- 真实桌面衣柜与窄视口：`stone-free-reference-game/desktop-1792180359392/result.json`，同目录五张截图。
- 真实 Android 衣柜：`stone-free-reference/android-1792180287281/result.json`，同目录三张截图。
- 基础与源码包：`stone-free-foundation/browser-1792180221092/`、`stone-free-foundation/author-kit-1792180224006/`。

首次集中流程 `desktop-1792179626002` 因测试误把 Loader 包装内导出当成 window 全局而失败；实际 participant/DOM 存在。修正断言后才继续，原失败未删除。首次 capture 的具体失败根因 Unknown。桌面游戏启动出现泛化 `Event` pageerror，真实衣柜操作及退出没有新增错误，来源 Unknown；不宣称全游戏 Console 干净。

## 当前结束条件与覆盖

**Delivered：** 独立发行就绪工程与一个可交互的只读衣柜空间比较原型已完成；方案 A 不变，未新增 Host Runtime/业务同步层。

**Validated：** 当前协议/明确配对、代表性 Windows Chromium 与 Android WebView 实际 Loader 安装、更新/退出负例、自然导航及上述衣柜场景。

**Not validated：** 物理手机触控、真实 IME、其它 Loader/WebView/整合包、更多第三方衣槽、真实第二个发布 Host 的跨版本升级、长期性能及完整正式 UI 迁移。

**Known limitations：** 实验协议可能调整；旧包的整包热卸载不承诺；空间原型仍为只读辅助目录；原启动 `Event` 的来源 Unknown。其余未覆盖环境进入后续覆盖，不自动追加本轮任务。正式发布仍需官方 UI 完成状态及用户授权。
