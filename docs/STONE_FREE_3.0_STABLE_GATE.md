# Stone Free 3.0 — Stable Gate

> 后续玩家实测与负责人视觉决议已将当前 Gate 改为 **Blocked**。下文保留首轮工程验收的历史范围，不能作为当前发布批准。当前整改见 [玩家与视觉专项](STONE_FREE_3.0_PLAYER_FINDINGS.md)。

2026-10-17。**Gate Passed，Ready for Owner Approval。** 本轮承诺的本地产品收口与代表性验收已完成，无已知范围内 Blocker / Must Fix。官方 UI 3.0.0 仍是本地候选，未获准公开发布 Stable；没有推送、合并、创建 Stable Tag 或 Release。

## 1. GitHub / RC Status

- [公开 RC-01](https://github.com/102326/DoL-Game-UI/releases/tag/v3.0.0-rc.1) 已在 2026-10-17 13:43:07 UTC 发布，非 Draft、Pre-release。标签实际指向 `0df554ab1802d4ee37ea7ed89ec632d1dd6db101`，双包摘要与冻结值一致，附带 SHA256SUMS。
- 远端 main 仍为 `965afcf119260886319f5beb6616362acb306a09`；2.7.0 仍是 Latest Stable。远端研究分支为 `425d16cf57d2d54a1f4df7f320293466719a11d2`。
- 本轮入场也在 425d16c，工作区干净。核对时仓库 Issues（含关闭项）返回空列表；没有可引用的新社区 RC 缺陷或采用反馈。无反馈不等于经过社区验证，建议接受有限内部覆盖后再决定是否批准。
- 公开状态、Issues 快照保存在 `tests/artifacts/stone-free-stable-gate/github-{rc,issues}-entry.json`。没有把其它对话、历史研究或授权本身当作公开成功证据。

## 2. Product Completeness

继续使用 [R14 功能矩阵及 R15–RC01 增补](STONE_FREE_3.0_R14_COVERAGE.md)，不另建第二套清单。正式 2.7 基线仍为 965afcf。

衣柜、商店、战斗、社交、属性、通用面板和存档的自有 UI 已 Migrated；参照比较、交易反馈为 Redesigned。设置中心、主题、阅读、侧栏、API v1、metadata、早期脚本与四项 Twee 补丁等成熟能力 Preserved。Widget、任意布局、全局动作底栏为 Deferred，不是丢失的正式功能。低频特殊场景及未知第三方分支仍按原行保留覆盖限制。

本轮对 RC-01 的 `src/`、Host、连接器、公共合同、Vue 接入、Hub 和参照服务的 Git 差异为空。最终 UI 的运行 JS 与 RC-01 严格满足“仅将版本字面量 3.0.0-rc.1 改为 3.0.0”；CSS、早期 JS、四项补丁、公开类型及既有许可成员均相同。因此复用相应业务与功能证据，不为内部结构统一而重写成熟模块。

没有发现正式功能丢失的新证据，没有新增业务修复。原版入口、单击直接穿戴和未知内容保留；未恢复衣柜浏览确认实验。

## 3. Gameplay & Data Safety

**本轮新证据：** 最终 Stable UI ZIP 在两个真实 Loader 宿主中，从 2.7 创建新进度并原生保存至空槽，升级后原 UI 读回，再回退 2.7 读回。金额、名称、衣柜、worn、wornStacking 和 options 与保存前一致，gameTime 存在。自有测试槽清理后，其它 save details 与原值一致。

**复用的适用证据：** R15 的原生文本导出/导入、无 UI 读档、旧 State/Binding/Passage 失效与重新挂载；R16 的原穿戴入口单次执行、第三方叠加、普通快穿/脱下、整理/模式保护、社区商品购买、扩展状态存读档和 Combat Demo 回合；R13–R15 的单件/多件、价格数量变化、余额不足、购买并穿戴与触手/多目标回合。相关实现和最终运行成员未变。

R16-W01 原穿戴选择入口修复保留，不重写原版优化的叠加业务。普通送回 1–10 件确认与其它目的地原结果继续区分，Unknown 不自动重试。未触发的交易、结算和新衣槽不写成业务通过。

本轮不迁移保存格式、不改 metadata，不修改私人长期存档、正式 App 或 GER Store。两端均首次通过，没有重派未知购买或靠重跑取得绿色。

## 4. Framework Decision

维持独立 Host + 官方 UI。推荐 **0.1.4-experimental** 原包，最低 **0.1.2-experimental**，依赖仍为 `>=0.1.2-experimental && <0.2.0`。Host 全包逐字节等于公开 RC 附件，UI 没有调用新增能力；不需要提高下限、升级公共 API 或重建 Host 身份。

公共协议继续 **0.1-experimental**，原 UI API v1 独立保留。Framework 首先服务实际官方 UI、当前合同可靠性和已知消费者；不以未来生态、外部采用人数或 API 1.0 冻结作为产品前置。SDK/Factory/Author Kit 保留可选，作者须核对协议与版本；破坏性变化需明确通知。未来是否合包另行决定，不维护混装仲裁或热替换平台。

Source/View/Command/Participant/Binding 的当前行为复用 R9–R17 及 RC 定向证据，未修改资源所有权。最低 Host 的真实 Windows 安装和晚到 jQuery/场景失效证据沿用 RC-01；此次不机械重跑最低版本全套流程。Loader 2.101.1 的预发布比较限制、可能允许 0.2.0 预发布以及运行接入不是包版本防火墙的边界保持。

## 5. Upgrade / Rollback

本轮调用既有 `tests/framework-upgrade-r17.cjs --stable` 路径，仅扩展候选版本和当前 Android 入场恢复准备，不另造 Runner。固定 34 个 R16 输入没有增加 Mod；读取的实际加载 JS/CSS/早期脚本/Twee SHA 均与最终包逐项一致。

| 环境 | 真实安装路径 | 结果 / 收据 |
| --- | --- | --- |
| Windows Edge 156，0.5.12.13 HTML + Loader 2.101.1，独立新浏览器上下文 | 2.7 → UI 3.0.0 / Host 0.1.4 → 2.7；加载数 35→36→35 | Passed；windows-upgrade-1792245226344 |
| M367FC，Android 17 / WebView 154.0.8037.58，独立测试 App | 自有临时键安装 2.7 → 最终 H/U → 2.7；36→37→36；最后恢复入场 RC-01 及 40 个加载包 | Passed；android-upgrade-1792245226344 |

实际 Android 入场在 Clothing Shop，UI rc.1 / Host0.1.4，并非历史快照的 2.7。脚本在任何写入前记录清单、隐藏项、偏好和加载身份，以唯一临时键准备 2.7，不覆盖原 UI/Host ZIP。结束删除本轮临时包、恢复清单/偏好、正常重启，并核对加载身份与入场一致。当前 Passage 会回到重新启动后的页面，不承诺保留未保存的临时游戏进度。

两端均检查字号110、按钮90、Fancy、玻璃/动态、阅读/侧栏、V2、各页开关、悬浮偏好和独立哨兵键；升级及回退无额外重置。单次公开 UI 安装、无研究同伴前置、API1 身份通过。Android 原清单/隐藏/偏好和运行 Mod 版本均恢复，测试槽之外的 details 保持。

完整收据及截图位于 `tests/artifacts/stone-free-stable-gate/{windows,android}-upgrade-1792245226344/`，摘要为同目录上级的 `final-verification.json`。已发布 2.7 原工作树及正式仓库原有两项未跟踪文件保持不动。

## 6. Experience & Performance

两端使用当前真实库存完成参照、对照、返回；动态开启和关闭均可完成。总开关关/开、Hub 三次展开关闭和隐藏通过，前后公共挂载数不积累。Windows 390px 内容区检查文档宽度为 390，没有页面级横向溢出；是受控窄视口，不是手机物理触控或 IME 证据。

人工查看 Windows 窄屏和 Android 原生截图，选定场景未见新的关键遮挡，Eyes/Ocean、轻内容层级与角色预览保留。Android 的来源 Mod 小提示仍可见，不据此认定主 UI 故障。Windows 缺部分原图片，不能用该页面证明全部图像效果。

本轮未改变焦点/命中代码，沿用既有相关证明；没有定量 FPS、触控延迟、长期堆或泄漏结论。未因未测性能担忧关闭默认动态；短循环只证明所测挂载行为。Windows 捕获五条泛化 Event，与 RC-01 相同，原天气/资源/Patch/配置等告警类别一致，不能据此判断全部日志无错。Android 没收全量 Console，空数组不是无错误证明。

## 7. Release Artifacts

固定产品源码：**`19b116e952743f0c1e0483bec5198572cdb4c65a`**。从该提交 git archive 导出新目录，复用已有 node_modules junction，没有安装依赖或重置工作树。Node26.12.0、npm11.20.0、Python3.14.7、Vite7.3.6；锁文件 SHA `b5c2ffb5e596baed79a9da099f0cdaa81d5f030216427f0191ff488618b0467b`。

实际运行 `npm run framework:check`、`node scripts/build-framework.mjs`、`python scripts/package-framework.py --players-only`，均通过；升级脚本语法检查通过，Windows/Android 最终包集成通过。未重复全量单元/生态/Gameplay 矩阵。经典 package.json 2.7 身份保留，不是本次官方 UI 的包身份来源。

本地交付目录：`dist/stable-3.0.0/`。包含双包、INSTALL.md、RELEASE_NOTES.md、SHA256SUMS.txt 和 manifest.json。运行 ZIP 不含内部收据、截图、APK、游戏、存档或研究消费者。

| 制品 | 字节 | SHA-256 |
| --- | ---: | --- |
| StoneFreeHost-0.1.4-experimental.mod.zip | 6326 | `ad78fca929e3819fce4da6f0d10affb4fc91318661583e4dacec896b64936153` |
| DoLGameUI-3.0.0.mod.zip | 193025 | `694a9d4c4eaad490161ed12c2a9ae631566e707b2eec81a66d5b90c4d5d2f511` |

Host4项、UI18项；ZIP完整、无重复/异常路径，boot技术名、版本和依赖正确。相较RC，仅UI README、boot、公开版本说明和index变化，旧RC版本说明替换为Stable候选说明；index差异严格仅版本字面量。CSS、早期/补丁/类型/其它文档/许可成员未变。UI index SHA `48d89f3396e60a6ff46b71d0d8e70c9cb1c649d42c7c9a18cd9790f90d80eeeb`，CSS仍 `5068b271180bc7d5675890dbed4d07e676170560085fb220a54b3f9ebac6a346`。

许可证、Vue/Tailwind NOTICE、原渲染器来源许可齐备。Host 原包说明的RC措辞保留冻结时点，当前外部安装说明解释其状态，不在同版本下替换字节。RC 原双包的SHA再次核对保持，2.7线上Release未改变。构建日志、package-audit.json 和固定导出目录均本地保留。

## 8. Known Limitations

主要支持 DoL **0.5.12.13**、已列 Windows Chromium / Android WebView、Loader2.101.1；声明的前置下限不是所有未来环境的验证。Host需要AbortSignal.any等能力。

Not validated：物理手机与IME完整覆盖，其它Provider/设备/DoL版本、全部社区功能及新衣槽、所有交易目的地与战斗结束、云端/文件选择、长期性能、新Hub位置落盘回退。低频功能未逐项重跑，沿用功能矩阵适用边界，不称全部业务新验收。

社区已有部分Patch、资源、TypeError和配置告警仍保持Unknown；R17已归因的一项运行期衣物插件data变化不代表其余全无害。未知库存、委托事件和第三方专属行为仍须退让。没有收到公开RC反馈，不能将内部代表性结果包装为社区全面认可。

这些是明确支持范围外或未承诺的覆盖，不是把已发现的核心业务缺陷改名为限制。本轮没有证据支持新增数据损坏、重复业务、重要菜单不可用或正式功能丢失的阻断。

## 9. Final Gate Decision

**Gate Passed。** 本轮 Delivered：本地Stable版本身份、双包、玩家说明、源码固化、既有矩阵接续与最终安装/升级回退。Validated：Windows与Android上述范围，未变行为复用列明历史证据。无本轮剩余实现或修复阻断。

可以提交负责人决定是否公开 **3.0.0 Stable**，接受有限支持范围和缺少新社区反馈的风险。未推送本轮提交、合并main、创建Stable Tag/Release或改变2.7稳定状态。正式发布必须另获批准；本报告不构成发布成功声明。
