# Crazy Diamond 2.5 首批工作记录

## 基线与边界

2026-10-10，`dev/crazy-diamond-2.5` 从干净的 `candidate/soft-wet-2.3` / `06de7f9799c5599642545100d51a2a92f4cae8c1` 建立，开发标识 `2.5.0-dev.1`。正式 2.2.2 / `937dad75d216168748a96cf4a1047fefb49e6992` 不修改；其两个未跟踪文件保留。没有发布、推送、PR、正式 main 合并、Android 连接、APK 或用户存档操作。

继承来源投影、原操作保护、未知回退、容器布局、API v1、主题、Surface、Inspector 与 gameTime 加固。M2 的衣柜浏览模式在 M3 已删除，旧报告属于阶段历史，不代表当前存在该实验。

## ① 开发准备

- 修改 package/lock、主 Runtime、早期商店脚本版本，README、CHANGELOG 与开发说明。依赖和技术栈未变。
- `test-unit.cjs` 加入快速衣柜来源合同；quick shop/saves/combat 各加入本组来源专项；release 加入较慢的 `wardrobe-m2.cjs`。跨分类集成加入 quick wardrobe，原游戏前置资源在 plan 中列出。
- 测试入口同步子进程退出码，失败立即停止；Browser 测试等待异步完成并关闭浏览器/服务器。重复组选项去重，`--plan` 不构建、不测试。`tests/test-workflow.test.cjs` 覆盖这些选择规则。
- Node + Edge/esbuild 夹具与原游戏集成按现有入口分层，没有新建测试框架。build 包含 Vue、Adapter、early 类型检查；打包脚本校验 package / Runtime / 早期商店版本一致。
- 首次验证发现早期脚本版本及开发版打包说明遗漏，分别补齐后再运行。失败报告 `workflow-quick-1791641483646.json`、`workflow-quick-1791641504915.json` 保留；属于本轮版本收口错误，不是 UI Bug。

## ② 高频页面本地检查

- 历史 Android 手机 400×821 及平板记录见 `CLOSEOUT_2_3_RC.md`、M3/M4 阶段报告；本轮不重新冒充真机验证。
- 执行 `node scripts/test-workflow.cjs quick wardrobe shop combat`：build、Node 合同、衣柜操作/布局/预览生命周期、商店来源/原购买/颜色/回退、战斗来源/布局/原事件/清理通过。报告 `tests/artifacts/workflow-quick-1791641619439.json`。
- 衣柜五种 viewport 及 540px 容器→宽容器、商店宽→460/550px→宽以及手机 Drawer、战斗窄容器→宽布局保持原节点/事件保护。本轮未发现新的 UI 布局缺陷，没有为了凑修复修改 CSS。
- `wardrobe-layout.test.cjs` 先处于整理模式再点击隐藏预览，原失败报告 `workflow-quick-1791641532072.json` 保留。补充整理模式预览隐藏断言、退出整理后检查折叠行为；不删除断言、不强制点击不可见元素。修正属于测试前置条件，不是产品修复。
- 本轮独立截图目录 `tests/artifacts/25-20261010-layout`；新增衣柜截图支持 `DOL_TEST_OUT`。部分历史测试仍使用既有默认 artifact 文件名，阶段 M1～M4 证据目录未清理。

## ③ 跨分类搜索

- `source.ts` 只在普通浏览非空查询时扩展到现有 labels/库存支持的分类。绑定仍保存原槽位、索引、对象及定义身份；Vue 只获得显示数据和类别标签。
- `WardrobePanel.vue` 普通搜索显示分类；清空或手动切分类回到单分类。进入整理清空查询，批量操作仍限当前分类。原类别游标不因搜索或点击其它分类结果而修改；单击仍调用原穿戴路径。
- source fingerprint 覆盖当前搜索范围、定义、穿戴状态、页面/库存/场景、映射与显示来源；旧索引、同值对象替换、定义替换、页面或场景变化拒绝动作。没有新增第三方回调或公开业务状态。
- 未注册的新槽位不纳入可执行结果，继续显示原版及扩展入口。关联套装部件仍按原来源由主件操作。
- `wardrobe-source-m2.test.cjs` 增加同名跨分类、对象身份、索引/定义替换、切换范围、单类别标签、未知槽位及场景变化断言。
- `wardrobe-search.test.cjs` 在隔离原 DoL 0.5.11.9 / Edge 中验证跨分类命中、同名区分、真实原下装穿戴、旧结果拒绝、空结果、整理/分类切换、普通单击穿戴、未知入口及卸载；1363→390→540→1363 viewport 无横向溢出，物品行仍至少 44px。
- 新测试首轮遇到 Start2 关联连衣裙按原规则同时脱上装，以及未知槽位夹具缺少原 arousalcaption 所需 type 字段。修改夹具为完整 naked 定义，未改原业务或屏蔽错误。失败 JSON 保留在 `25-20261010-search`；首轮关联穿脱失败记录在本段保留，命令输出有具体断言。
- 新功能集成最终证据 `tests/artifacts/25-20261010-closeout/result.json` 与截图；不是 Android 分屏/物理触控验收。已检查 390px 截图，分类标签和穿戴入口清楚。

## 验证与结果

- `npm run build` / `npm run typecheck`：通过，最终 build 含最新源码。
- `node scripts/test-workflow.cjs quick wardrobe shop combat`：阶段②通过。
- `node scripts/test-workflow.cjs quick wardrobe`：阶段③通过，报告 `workflow-quick-1791641921558.json`。
- `node tests/wardrobe-search.test.cjs`：最终容量文本调整后通过。
- `node tests/saves-source-m4b.cjs`：20 个来源/metadata 断言通过；存档业务源码未改，不扩大到完整存档回归。
- `node tests/test-workflow.test.cjs`、`node tests/wardrobe-source-m2.test.cjs`：通过。
- `node scripts/test-unit.cjs`：最终全部通过，含开发版打包与版本一致性。
- `node tests/wardrobe-runtime.cjs`：最终通过，单击穿戴、整理取消/确认、索引移动、关联丢弃/剪开、容量、原控件、五种 viewport、回退及清理均验证。旧搜索标签和颜色+类别预期同步到新显示合同。首次运行在整理退出/重入后仍假定旧过滤保留，实际新模式入口已清空查询，导致全选范围不同；显式重新输入套装筛选后验证原断言，不删除业务断言。第一次超时在第 131 行图标等待，归属测试路径与新显示合同不一致，不是图标能力缺失。
- `git diff --check`：通过；正式仓库状态和两个未跟踪文件 SHA256 与调查前一致。

本地产物：`dist/DoL-SoftWet-GameUI-2.5.0-dev.1.mod.zip`，SHA256 `293A1CB8B97B545C940B3C5F37628372CDD6AEFAB784CA8E3E55BC855E7AFD59`。package / Runtime / 早期脚本版本均为 `2.5.0-dev.1`。对应源树为参考 HEAD 加本分支当前未提交 diff，构建后未再改行为源码；未发布，不表示正式版验收。

## 风险及未覆盖

Delivered：三个约定阶段的代码、测试入口与文档。跨分类搜索是新功能，测试前置修正不是自主修复案例。未找到当前已复现且未修复的 Core UI Bug；Heaven's Door 自主调试 M1 未执行。

Validated：本地 Windows Node 24 / Edge、隔离原 DoL 0.5.11.9 和浏览器夹具；复用未改模块的 2.3 历史证据。原状态与 handler 仍执行动作，没有改存档格式或公共 API v1。

Not validated：新搜索在 Android、真实系统分屏、0.5.12.13 的本轮现场、私有第三方衣槽及超大跨分类库存的性能；作为后续针对性覆盖，不称为未实现。

Known limitations：跨分类检索及点击复核在搜索模式扫描已支持分类，库存很大时成本高于单分类；默认分类浏览不扫描所有物品。映射声明不保证任意新槽位原业务可用；未支持结构仍走原入口。现有原 DOM 移动/恢复边界未扩大，批量与保存业务未重写。

## ④ Android 收尾与本地 RC（2026-10-10～11）

本段更新前述阶段覆盖状态，不改写历史失败。当前版本提升为 `2.5.0-rc.1`；本轮行为源码没有修复性修改，只统一 package/lock、Runtime、早期入口和文档版本。没有提交、推送、合并 main 或发布。

- 保护入场 17 个 tracked 修改、3 个 untracked 开发文件；入场 diff、未跟踪文件副本和 dev.1 ZIP 保存在 ignored `tests/artifacts/25-rc-closeout-20261010`。
- 同状态 Combat Demo UI-on/off 均复现错误；原宏 `combatsetup` 提供 “Add human” 原生按钮。漏掉这一步时无有效 NPC，使用原按钮后同状态两侧均正常。没有补造 NPC 字段、修改第三方或继续回合。
- 战斗真实系统分屏（677 CSS px 窗口）与宽屏（1363 px）通过，触控改变原 `V.leftaction`；停用后原 radio/继续节点保留，无多余 UI host。列表内控件数量与全 passage 数量不同，是原工具控件进入底部 Dock，不是节点删除。
- 当前 DoL 0.5.12.13 / ModLoader 2.101.1 平板总库存 791 件，新增 500 件合成原生衣物。默认分页 40 行，1 次 warm-up 与 5 次搜索/清空对；阈值预先固定：同步处理中位数 ≤150ms、两帧 DOM 稳定中位数 ≤500ms且最大 ≤1500ms。实际约 26.95ms / 52.65ms，最大约 49.1ms / 80.5ms，准备就绪约 305ms。不是物理触控延迟、无限库存或未分页性能承诺。
- Android 完整软键盘展开后，输入可见、搜索结果可滚动命中；原穿戴结果、上装不变、整理审查焦点与取消通过。ADB 连续 text 输入出现错位字符，失败保留；CDP `Input.insertText` 对照正确。错位的内部原因 Unknown，不能直接认定 UI 或 Dev Tools 实现缺陷。
- 载入原测试槽 2 后，原库存、穿戴和显示偏好与准备前完全一致；合成衣物清除，代理卸载。没有保存、覆盖、删除测试存档。Android `show_ime_with_hard_keyboard` 临时从 0 改为 1 后恢复 0。
- `npm run test:release` 通过全部 25 个步骤（含 build/typecheck、unit、原游戏及夹具集成）；报告 `tests/artifacts/workflow-release-1791648817740.json`。隔离原游戏主要为 0.5.11.9，不冒充 0.5.12.13 全业务回归。存档集成输出过 `skybox` 页面异常与资源 404，现有断言通过；这些输出不是“全部 console 无错”的证据，具体归因未追加调查。
- 既有可选包继续使用 API v1 与最低 UI 2.2.2 依赖。实际 Loader 版本比较接受 `2.5.0-rc.1 >=2.2.2`。当前测试实例 ReOverfits 和其兼容包在 hidden 清单，不计为本輪实际加载或操作覆盖。

本轮最终制品、实际加载摘要、Go/No-Go、失败记录和覆盖边界见本地 `tests/artifacts/25-rc-closeout-20261010/REPORT.md`；这些内部诊断不放入玩家发行包。正式 2.2.2 未覆盖，GER 历史 Pending/Unknown 未操作。
