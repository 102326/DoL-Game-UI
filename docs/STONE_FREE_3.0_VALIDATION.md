# Stone Free 3.0：首轮工程原型记录

2026-10-16。本页记录首轮实现和证据，不是 3.0 正式发布验收。正式规划原文见 [V1.0](STONE_FREE_3.0_PLAN_V1.md)，开发边界见[接续](STONE_FREE_3.0_EXECUTION.md)。

后续视图贡献、有限布局和完整卸载检查见[第二轮记录](STONE_FREE_3.0_WORKSPACE.md)。以下数字和“未实现”项保留首轮当时状态，不作为当前能力清单。

## Delivered

- 无 Vue/官方主题依赖的 Host，实验协议 `0.1-experimental`：参与者、瞬时/持久宿主、场景绑定、异步失效、幂等清理、局部异常隔离、有限 JSON 投影和自愿独占资源租约。
- Vue SDK：独立 App、延迟组件加载、挂载失败与退出释放。消费者各自打包 Vue，不公开 Vue 实例或官方 Store。
- 原版状态投影、独立速览、当前/基线对照三个独立研究包；另有可选官方 Drawer 消费者。后者只调用既有 UI API v1，前三包不需要它。
- 源码优先的最小 Factory 配方：生成作者拥有的 Vue 项目与 ZIP 配方；SDK 更新只修改已记录且未被作者修改的文件，不覆盖 SFC。
- 正式 UI 2.7 的运行源码、偏好、API v1 和存档未改。新包在 `dist/framework/`，没有推送或发布。

## Validated

| 证据 | 实际证明 | 不代表什么 |
| --- | --- | --- |
| `npm run framework:build` | 类型检查、四个离线 ZIP、CRC/成员校验、依赖和 Vue 许可声明 | 不等于设备安装 |
| `npm run framework:test`，26 组 | 瞬时/持久生命周期、场景准备期绑定永久失效、局部祖先删除、过期异步清理、Vue 真正卸载、异常隔离、三个资源种类争用、来源撤销、只读投影、输入/IME 标记负对照、窄视口与 UI API v1 Drawer | 浏览器夹具，不是物理手机或真实 IME 验收 |
| `npm run framework:factory:test`，7 组 | 新项目、拒绝覆盖、作者改动后的构建/打包、SDK 更新保护、生成组件可运行与释放 | 候选 SDK 更新是隔离源码修订；没有证明正式 SDK 行为升级或相对手工模板的效率优势 |
| `npm run typecheck` | 原有 UI/Adapter/early 类型合同未破坏 | 未重跑整个 2.7 发布流水线 |
| 真实编译 DoL，独立 Edge 上下文 | DoL 0.5.12.13 / SugarCube 2.36.1+34 / ModLoader 2.101.1，三个 ZIP 由真实 Loader 加载，未安装官方 UI/MapleBirch；投影与原值一致 | 原生年龄确认窗口阻止后续操作，未确认或绕过；后续点击范围受限 |
| Android 平板临时加载 | M367FC / Android 17 / WebView 154.0.8037.58，独立测试 App 0.5.12.13，现有 UI 2.7.0；投影对照原值、参与者模态互斥、原生详情关闭、同源数据进入真实官方 Drawer | CDP DOM 点击，不是 trusted touch；未持久安装新 Mod、未操作存档或游戏业务 |

本地证据位于 `tests/artifacts/stone-free-foundation/`：`browser-tests.json`、`factory-1792163770190/result.json`、`game-1792163785883/result.json`、`android-1792163785287/result.json`，以及 Android 环境收据和自有面板截图。证据不进入 Mod 包。

Android 结束后自有宿主为 0、临时 Host 已退出、样式和自有 CDP 转发释放；原 UI 保持 2.7.0，所读原状态未改变。临时运行资源的摘要见该次 Android 收据；它和真实 Loader 的 ZIP 证据分开记录。

## 失败与修正保留

初次 Doctor 因 ADB 未在 PATH 返回 partial；按已有 Skill 指引使用已安装 SDK 的临时 `DOL_ADB`，不改全局配置。第一次输入测试错误地预期键入 `k` 后原输入值不变，改为验证正常输入确实收到字符。另一次以固定定位子元素的零尺寸宿主判断可见性导致超时，改查真实按钮。两者属于本项目夹具问题。

真实游戏首次加载后的按钮不可访问，经 DOM 和截图确认是原版年龄确认窗口的 `aria-hidden`/交互限制。保留两次失败记录，再将这条路径明确收口为“真实 ZIP 加载通过，窗口后操作未验证”，没有改原版窗口或强制点击。平板在已进入的测试游戏上另行验证。

初始研究投影误用 `fatigue`，经真实平板读数和已有 `src/runtime/status.ts` 核对，改用原字段 `tiredness`。这是本轮适配器编写错误，不是游戏或 Tools 缺陷，也不是已发布 2.7 回归。

## A/B 与架构决定

**A：首轮独立开发技术闭环成立。** 不依赖官方 UI 的真实 Loader 加载、独立 App、源码修改、打包和 SDK 更新保护有证据。生产级 SDK 发布、真实跨 Passage/存读档的完整生命周期与持续维护成本尚未验收。

**B：只读能力组合和有限资源协作有初步证据。** 同一公开来源进入速览、对照及官方 Drawer，无需修改提供者私有实现。模态争用在真机检查，区域/快捷键租约和输入反例在夹具检查。实际布局提供者、两个包在真实场景下争用区域/快捷键、受审业务命令和完整玩家任务仍未完成，不能声称跨 Mod 生态已经成立。几个消费者均由本工程编写，也不是社区采用证据。

现阶段保留“薄 Host + 消费者自带 Vue + 可选布局提供者”的研究分工。共享 Vue 分发、稳定公共 API 深度、物理包数量和旧 UI 编排替换均未冻结。Host 未加入全局输入管理、Mod 生命周期、状态镜像或游戏动作执行器。

## Not validated / Known limitations

物理手机触控/软键盘、Mac、新 WebView、其它游戏版本与 Mod 组合属于 Additional coverage。没有使用历史 GER Unknown 的替代路径，也未执行 Gameplay、Perfetto、bugreport 或 Full Evidence。

Factory 尚无量化对照收益；SDK 更新保护不支持自动合并作者改过的 SDK。研究 Host 要求 MutationObserver 和 AbortSignal.any，能力不足时不安装，旧 UI 保持原状。当前资源政策仅先到先得，无排队、公平性或全局 exactly-once 保证。

**本轮首批原型完成；3.0 产品尚未完成或发布。** 后续按上述 A/B 缺口选择具体实验，玩家默认体验及可组织工作区仍属于后续研发，不能因已有 SDK/样例而省略。
