# 万能手机的 Kraft Work 3.X 兼容（3.0.2 配套附件）

当前独立可选包是 `SmartPhoneSoftWet 1.1.0`，基于主 UI 3.0.2 的源码 `cf53c20bde99218bb1cd000b3d5514a6136ec4e8`，分支 `compat/smartphone-3x`。已在用户授权的平板测试 App 安装，并按后续授权添加到 [3.0.2 Assets](https://github.com/102326/DoL-Game-UI/releases/tag/v3.0.2)；用户另已授权提交和推送源码，源码由本独立分支保存，未合并 main。当前设计依据是 [3.X 基线](VISUAL_BASELINE_3X.md)。任务记录：[Issue #14](https://github.com/102326/DoL-Game-UI/issues/14)。

本轮状态：Completed，覆盖有限。源码分支为 `compat/smartphone-3x`；本分支名称不触发现有 push CI，未新增 CI 通过声明。当前候选文件 `SmartPhoneSoftWet-SmartPhone Alpha-0.3.91-v1.1.0.mod.zip` 的 SHA-256 为 `254327acc647353f23c7a93703384754d59edd5e1a4c97f753e2bf4f85bf6073`。此前 1.0.0 包及验证记录保留，SHA 为 `90c12cd08a5b6d4bb1b57cbb91d0a60f3c65e322deaec86e809506b8f82ceece`。

公开附件使用无空格的文件名 [SmartPhoneSoftWet-SmartPhoneAlpha-0.3.91-v1.1.0.mod.zip](https://github.com/102326/DoL-Game-UI/releases/download/v3.0.2/SmartPhoneSoftWet-SmartPhoneAlpha-0.3.91-v1.1.0.mod.zip)，内容与上述已验证候选逐字节一致，SHA 相同，包内目标技术名仍为 `SmartPhone Alpha`。已更新发布说明和 `SHA256SUMS.txt`，重新下载两附件核验一致；清单九条记录覆盖九个 ZIP。原八个运行包的远端 ID 与 digest 均未变，包括原版优化兼容包 1.0.1。发布复用本报告已有游戏验证，没有声称重跑游戏或新增设备覆盖。

## 作者与固定输入

2026-10-20 通过作者仓库的最新正式发行 API 核对：

| 项目 | 核实结果 |
| --- | --- |
| 作者 | NEEDMEET遇欲；GitHub 发布者 ANLINSTUDIO。作者名称及仓库链接也出现在发行包的预览页源码中 |
| 名称 | 万能的智能手机（SmartPhone）；Loader 技术名 `SmartPhone Alpha` |
| 最新正式发行 | [v0.3.91](https://github.com/ANLINSTUDIO/Degrees-of-Lewdity-DolSmartPhone/releases/tag/v0.3.91)，2026-10-16 发布，draft=false、prerelease=false |
| 标签源码 | `e131fe18be7f2a3a036c4abddd6a7341c2dc62d3` |
| 作者附件 | `SmartPhone.Alpha-v0.3.91.mod.zip`，3,791,253 字节 |
| SHA-256 | `df00269756e63d39fd991ff133ba3a6331aed313ebe2c95ad787353601880b30`；本轮独立下载与 GitHub asset digest 一致 |

“Alpha”是当前包身份的一部分；不能仅凭名字将其判断为 GitHub 预发行。历史测试包版本也是 0.3.91，但本轮使用重新下载的作者附件建立来源。`SmartPhone PhotoPack` 是独立图片资源包，首轮 Windows 未加载，后续 Android 现场已加载；`SmartPhone Omega` 是另一身份，不在本兼容包的匹配范围。

作者 boot.json 声明 ModLoader `^2.31.2`、GameVersion `^0.5.10.12`、BeautySelectorAddon `^2.0.0`、TweeReplacer `^1.0.0`。早期脚本另行提示部分 NPC 能力依赖 maplebirch，虽未在上述清单声明。首轮 Windows 确认该提示后继续，未加载 maplebirch；后续 Android 现场已加载，不据此宣称 NPC 能力已验证。

## 本轮 Done 与实现

交付范围是正常手机窗口、底部导航、状态栏、应用图标、滚动区、普通输入控件、备忘录卡片及 debug 窗口。必须保留原节点、值、事件和业务，在真实游戏／Loader 中证明代表性操作，并用受控测试验证退让和清理。不操作私人存档，不改主 UI、Host 或其它兼容包。

- 使用现有 Style Adapter API。观察作者稳定的 `#phone-wrapper`，核验 `#phone-render` 内正常手机结构。作者异步创建或切换应用时会替换手机本体，外层观察继续生效。
- 仅接受 `SmartPhone Alpha 0.3.91`。结构不符、未知版本或主 UI 关闭时，本包 CSS 不启用。没有复制或重写手机业务。
- 外壳复用主 UI 的 Acrylic 变量，内部状态栏和导航不重复模糊。保留作者的图标、壁纸和动画。
- 打开窗口按作者 `--phone-scale` 与视口限制尺寸；内容区保持原生滚动。原生导航有至少 44 CSS px 的布局点击区域；输入焦点使用可见轮廓。
- 不适配预览、响铃特殊窗口、临时动画副本、通知、教程和独立确认弹窗；这些界面继续由作者管理。
- 1.1.0 将 3.X 的细边、较轻阴影、卡片留白、标题和按压反馈融入作者的手机图标与原有导航，不加入动态天气。debug 使用独立结构合同，适配日志、原命令输入框、链接按钮与固定窗口；不自行执行命令，不替换作者调试业务或隐藏风险文字。

## 验证

受控浏览器回归：`node tests/smartphone-adapter.cjs`。使用实际 `createUiRuntime` 与兼容脚本，检查延迟创建、原节点与父节点、原事件和输入值、原生 select、长内容滚动、390×700／320×568（1.5 倍）／900×390／1363×900、未知版本、结构缺失、主 UI 关闭及销毁清理。类型检查：`npx tsc -p tsconfig.adapters.json --noEmit`。

构建：`python scripts/package-adapter.py compat/smartphone-soft-wet`。沿用现有打包器，逐项核验 boot.json 声明、ZIP 完整性、成员字节及 SHA；包内只有声明、样式、编译后的兼容脚本、README 和 LICENSE，不带作者包、游戏、测试状态或原始证据。

真实游戏回归入口：

```text
node tests/smartphone-game.cjs GAME_HTML INPUT_DIRECTORY
```

`GAME_HTML` 是已有合法游戏 HTML。输入目录包含本轮核实的作者 ZIP、正式 `DoLGameUI-3.0.2.mod.zip` 与 `StoneFreeHost-0.1.4-experimental.mod.zip`；兼容 ZIP 从本分支的构建目录读取。脚本只在内存副本追加 Mod 清单，保留原 HTML，启动全新非持久浏览器 context 和随机本地端口，阻断外网。测试数据为新生成手机和备忘录，不读取、导入或写入私人存档。

实际使用 Windows Edge 156、DoL 0.5.12.13、ModLoader 2.101.1。正式 UI SHA 为 `3a79c2dd6cf2e816d012370972e85639ec3add29943fd9f325a5d5a53c7284a2`，Host SHA 为 `ad78fca929e3819fce4da6f0d10affb4fc91318661583e4dacec896b64936153`。具体本地回执、候选摘要和截图位置见被忽略的 `HANDOFF.local.md`。

真实游戏验证通过：Loader 执行四个追加包；作者图标打开备忘录；键盘新建并勾选任务，原状态正确更新；生成长列表后滚动到底部；390×700、900×390 和 320×568（1.5 倍作者缩放变量）窗口位于视口内；主页导航、设置复选框、锁屏和重新打开均工作；销毁适配器后标记清除，原节点与手机状态保持一致。截图已人工检查。布局测试设置作者使用的 CSS 缩放变量，不声称覆盖缩放设置页全流程。

失败证据保留：初始探测停在作者框架提示；受控测试发现精确版本 API 应使用裸版本；真实游戏发现临时手机节点无法稳定发现，已改用外层容器；测试脚本还修复了 Windows 中文编码、备忘录输入显示顺序和测试手机工具栏初始化问题。没有删除失败记录或用无改动重跑掩盖失败。

## Coverage Ledger 与限制

### 当前 1.1.0：设计融合与 debug

用户要求融合两套设计并美化 debug。受控回归新增 debug 异步发现、原输入与事件、独立结构退让、窄屏及滚动检查；适配器类型检查和打包通过。最终 1.1.0 在 Windows Edge 156 的真实游戏中通过手机回归，以及作者 debug 的打开、`1 + 1` 返回 `2`、390 像素窗口边界、内容滚动与关闭。

同一 ZIP 已在用户确认设备可重载后，从平板上的 1.0.0 更新为 1.1.0。旧包先备份，安装后核对 IndexDB 来源、ZIP 与实际 JS／CSS SHA；其它 Mod 清单及隐藏清单未变。Android 17／WebView 154 同场验证了 debug 原命令与滑动、应用图标、备忘录、主页导航、设置、锁屏重开。debug 内容滚动约 230 CSS px，手机内容滚动约 232 CSS px，底层页面不滚动；确认未插入天气节点。截图已人工检查。测试只使用页面内临时手机状态副本，原对象还原、其它游戏变量未变，自建调试连接清理完成。

保留的失败与限制：更新前发现设备已在衣柜，第一次安装在写入前停止，获得用户明确确认后才安装。新衣柜将 `#phone-wrapper` 和 debug 开关收入隐藏的 `.dgw-native`，导致测试控件不可见；这是当前主 UI 3.0.2 的场景限制，本包没有越过其 hidden 所有权。通过原“关上衣柜”入口回到卧室后验收，没有穿戴操作。debug 第一次滑动落点在边缘而未移动，改为核验命中内容中的非操作标题后通过；原失败记录和状态恢复结果保留，没有隐藏失败或无改动重跑至绿。

### 后续授权：Android 安装与效果测试

2026-10-20，用户要求“安装并测试效果”。已在核实身份的独立平板测试 App 安装同一候选，来源为 IndexDB；存储 ZIP SHA、公开 ModInfo 中实际执行的 JS／CSS SHA 均与本地候选一致。重载后确认 1.0.0 生效，其它 Mod 顺序、启停状态和 UI 3.0.2 未变。没有安装 APK、清数据、推送源码或上传 Release Assets。

实际现场为 Android 17／WebView 154.0.8037.58、DoL 0.5.12.13／Loader 2.101.1、SmartPhone Alpha 0.3.91、PhotoPack Alpha.3.87 与 maplebirch 5.5.0。重载恢复到卧室会话。布局视口 1363×876，手机窗口 300×500；诊断 full，实际材质为 rgba(36,38,42,.68)，backdrop-filter 为 blur(28px) saturate(.85)。

设备验证通过：ADB 注入点击打开应用、备忘录输入及键盘提交、勾选任务、主页导航、设置回调、锁屏与重开；ADB 滑动使原手机内容滚动约 233 CSS px，底层游戏页面保持不动。文字输入和键盘使用 CDP，不能称为物理手指或完整软键盘验收。原生截图已人工查看。

测试在页面内临时克隆手机状态，不使用存档、读档、自动存档或剧情跳转。功能检查完成后，清理脚本重复调用已消失教程的关闭函数而失败，原始回执保留 failed；专项恢复只完成剩余清理，没有重放测试或安装。恢复回执 passed，确认原手机对象引用还原、临时备忘录为零、其它游戏变量未变。自建 CDP 转发已清理，候选包保留安装。

| 范围 | 状态 |
| --- | --- |
| 本地可选包、受控退让／布局／清理 | 已验证 |
| Windows 真实 Loader、代表性手机界面与原事件 | 已验证；原始回执与失败记录保留在本地 |
| Android 17／WebView 154 平板安装与代表性界面 | 1.1.0 手机和 debug 已验证；此前 1.0.0 清理异常及恢复回执保留 |
| iOS、物理手指、完整软键盘、其它设备／WebView | Not validated |
| PhotoPack 完整媒体、maplebirch NPC、电话、网购、拍摄及所有游戏业务 | Not validated；同场加载不代表业务覆盖 |
| 未知版本、作者未来 DOM、独立扩展应用 | 原生退让或 Future coverage |

Windows 隔离游戏禁止外网且未提供原版图片目录，部分原版图标缺图；作者包内资源仍由 Loader 读取，平板现场有正常图片资源。Windows 基线和候选都出现过一个内容为 `Event` 的 pageerror，保留在本地日志，原因尚未单独定位。不得称为零错误运行、完整资源验收或完整游戏业务兼容。除已适配的正常手机和 debug 之外，作者自定义窗口仍使用作者外观。当前新衣柜隐藏原版内容时，手机也不可见。
