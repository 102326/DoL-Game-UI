# Soft & Wet 2.2 · Crazy Diamond

主线：自有运行时代码与官方兼容包向 TypeScript 收口。改类型、构建与契约，不借迁移改游戏行为、DOM 所有权、事件、状态源或 API 返回格式。

## 起点 · 2026-10-06

- `src/`：38 个 TS、12 个 Vue、3 个 JS；主配置已开启 `strict`，允许 JS，但未开启 `checkJs`。
- `compat/`：5 个 JS 入口；原类型检查不覆盖独立包。
- `examples/`：1 个 JS 入口。
- 根目录另有自有 inject-early JS：`startup-cache-experiment.js`、`shop-page-experiment.js`，必须纳入迁移，保持加载顺序与全局入口。
- TS/Vue 中约 83 处 `any` 文本出现，主要在外部宿主、衣柜数据/渲染边界与快照；这是盘点线索，不作为质量评分。
- 没有发现独立 JSON Schema 文件；已有 Adapter 输入校验继续复用，不引入 Schema 框架。

## 迁移顺序与进度

- [x] 盘点入口、所有权、构建链和 JS 例外。
- [x] 首批公共契约：UI API、Style Adapter、能力、Surface、Inspector 诊断；API 1 / Schema 1 不变。
- [x] Runtime 与 Inspector 复用公共快照类型，移除这两个模块的显式 `any`；其余调用方后续收紧。
- [x] ModHub 作为首个 TS 兼容包，接入独立严格类型检查和 JS 打包路径。
- [x] MapleBirch、原版优化兼容包、Surface 示例迁移。
- [x] 两个嘴部包迁移；新版嘴部包继续不依赖 UI。
- [x] 布局 JS 与旧 theme 入口迁移，保持导出与布局行为。
- [x] 界面设置与主题控制器的宿主接口收紧。
- [x] 其余 UI / bridge / 衣柜边界逐模块收紧。
- [x] 两个 inject-early 入口迁移与编译/打包契约检查。
- [x] JS 例外清单与公开类型文档；声明随开发包生成。
- [x] 最终发布版本与发布附件更新。
- [x] 阶段集成和最终桌面 / Android WebView / 兼容及回退验收。

各迁移批次使用原版本号，不安装中间包。最终候选已统一更新为 2.2.0，并完成桌面回归与代表性 Android WebView 验收；下文各批次的“未安装 / 未发布”描述保留为当时记录。

## 类型与打包

公共类型唯一来源：`src/public/ui.ts`。内部可变诊断、DOM 和生命周期不作为公开对象导出。外部作者使用 `import type`，继续通过 `window.DoLGameUI.ui` 调用真实 Runtime。

- `npm run typecheck`：主包 Vue/TS、独立包 TS 和编译期契约反例。
- `npm run types`：生成 `dist/types/ui.d.ts`，不生成另一个 Runtime。
- `npm run build`：原有主包链路，输出 JS/CSS。
- `python scripts/package-adapter.py compat/modhub-soft-wet`：按原 Manifest 的 JS 名称编译 TS；CSS、资源和既有 JS 包仍使用原文件。

兼容包编译复用已有 esbuild，仅允许类型导入，不捆绑主 Runtime 或其它可执行模块。启动与业务依赖不因为 TS 迁移而新增。

两个 inject-early 入口同样独立编译为原命名 JS；`tsconfig.early.json` 参与严格类型检查。打包读取生成物，保持 `startup-cache-experiment.js → shop-page-experiment.js → game-ui.js` 的阶段/顺序。公共声明为打包附加文件，只有 JS 被列入可执行入口。

## 明确保留

`src/wardrobe/vendor/isolated-model.js` 是上游派生的生成文件，继续由 `scripts/vendor-wardrobe.cjs` 生成并保留版权声明。通过类型化边界接入，不手工改写生成正文。

构建/发布脚本、测试夹具及第三方源码可继续使用 JS/Python；自有启动脚本不自动归类为例外。

## 首批验证

已通过主包/兼容包严格类型检查、公共声明生成、主包构建和 `tests/ui-runtime.cjs`：覆盖 Inspector 隐私与导出、Surface、Adapter 识别/降级/撤销、原节点和事件，以及原版回退。ModHub 类型擦除后的执行代码与迁移前一致，ZIP 保持原 JS 文件名和原 CSS。

打包首次检查发现同名 CSS 被误判为 TS 入口，已修正为仅对 `.js` Manifest 项查找 TS；再次打包与 ZIP 内容核对通过。压缩文本比较曾因 minifier 重命名不同而不一致，关闭标识符改名后执行代码一致；未将该差异当作运行时失败。

尚未进行本阶段 Android 安装或最终发布回归，不把桌面样例通过视为设备证明。

## 第二批验证

MapleBirch、原版优化兼容包和 Surface 示例已迁移为 TS，复用同一份公共类型。严格类型检查通过，三个入口擦除类型后的执行代码与迁移前一致；未改变版本检测、加载顺序、原控件事件或关闭行为。

`tests/ui-runtime.cjs` 与 `tests/optimization-adapter.cjs` 专项检查通过，覆盖 Adapter 降级/撤销、动态内容、原节点和事件，以及浮层关闭。原版优化测试继续在假存档中调用目标 Mod 的实际描述编辑方法，不读取真实存档。

三个独立 ZIP 已重新打包并核对：Manifest 保持原 JS 文件名，CSS 不变，TS 仅在构建时使用，不捆绑第二套 Runtime。本批没有安装到 Android，也没有更新已发布的 2.1.0。

## 第三批验证

两个嘴部包已迁移为 TS，保留各自的精确目标版本、图片路径、加载顺序与回调行为。新版只使用 MapleBirch 角色图层接口，仍不依赖 UI；旧版仅修改 `dol-ui-outfit-prepared` 事件提供的私有预览模型。没有扩大成公共角色绘图 API。

严格类型检查与类型擦除后的执行代码对比通过。`tests/lyra-preview-adapter.cjs` 检查旧版路径回退、重复加载和监听清理；`tests/mouth-compat-adapter.cjs` 检查新版版本/API 门槛、资源路径回退、仅提交 mouth 图层及不依赖 UI/游戏状态。测试使用隔离宿主，不读取真实存档。

`tests/preview-hook-runtime.cjs` 在本地原版游戏夹具中验证实际预览准备/编译、原角色与状态不变，以及退出适配后新预览恢复原路径。两个 ZIP 的 Manifest、依赖及注入顺序与迁移前一致，只将 TS 编译为原命名的 JS。未安装到 Android，未发布中间包。

## 第四批 · 布局入口

本轮 Done：`src/theme/layout.ts` 和兼容导出入口 `src/theme/theme.ts` 完成迁移，原布局、开关、事件顺序、清理与导出行为保持不变；严格类型检查、主包构建及目标布局测试通过。

- Delivered：给布局偏好、宿主关闭接口、DOM 节点和键盘/返回事件增加最小类型；更新主入口和两个测试的源码路径。`src/` 仅剩上游派生的 `wardrobe/vendor/isolated-model.js`，继续作为生成文件保留。
- Validated：`npm run build`；桌面 Edge 隔离测试 `tests/sidebar-layout.cjs`（原节点/工具入口、动态重绘、精确恢复、未知内容）和 `tests/overlay-back-order.cjs`（子窗口优先关闭、返回键、销毁清理）；两个迁移入口擦除类型后的执行代码一致。
- 检查记录：首次文本对比因局部变量声明顺序变化而失败，已恢复原顺序后通过；没有改变运行行为来满足比较。
- Not validated：本批 Android/WebView 安装与其它设备，属于额外覆盖，不阻塞本轮类型迁移完成。没有触碰兼容包逻辑，复用前三批证据。
- Known limitations：UI / bridge / 衣柜的宽泛类型仍由后续批次收紧；生成渲染器不手工迁移。

## 第五批 · 界面设置与主题控制器

本轮 Done：替换 `controller.ts` 的无限制宿主索引和 `SettingsPanel.vue` 的 Inspector `any`，保持偏好值校验、开关、事件、业务所有权及清理行为；类型检查、构建和设置/总开关目标测试通过。

- Delivered：宿主仅列出控制器实际使用的 UI 方法；布局契约从布局入口类型复用，Inspector 从公共 `UiApi` 复用。偏好 JSON 字段按 `unknown` 读取，沿用原校验，不新增状态或运行时适配层。
- Validated：`npm run build`；桌面 Edge 隔离测试 `tests/master-toggle.cjs`（关闭/启用/重载、偏好保留、忙碌拒绝、原节点与事件）、`tests/settings-lifecycle.test.cjs`（回退、宿主替换、排队清理）及 `tests/display-scale.cjs`（缩放校验、响应式上限、持久化和重建）。控制器及 Vue 脚本擦除类型后的执行代码与迁移前一致。
- Not validated：本批 Android/WebView，作为额外覆盖。未触碰 Adapter、存档或角色绘图逻辑，复用已通过的对应检查。
- Known limitations：其余 UI、SugarCube bridge 和衣柜仍按后续批次收紧；本轮不扩大公共 API。

## 第六至八批 · Bridge、衣柜、页面宿主与提前注入

本轮连续交付范围：完成剩余自有运行时入口的类型收口，沿用现有验证、回退、状态源和事件；完善提前注入编译/打包与公开声明附件。没有安装中间包或修改已发布版本。

- Delivered：状态 bridge 的只读宿主；衣柜字段、原生宏调用和私有渲染接口；社交/属性的浏览器接口、设置/战斗的事件接口、商店原过滤接口、存档元数据与钩子接口。启动注册复用真实模块返回类型，移除无限制宿主索引。第三方未知字段仍为 `unknown`，生成渲染器继续由上游脚本维护。
- Delivered：两个提前注入 TS 入口独立编译，原 Manifest 名称、顺序、默认关闭、全局对象身份和恢复行为保留。打包附带单一来源生成的 `types/ui.d.ts`，不增加可执行 SDK。
- Validated：严格类型检查、公共声明生成、主包构建；新增类型擦除对比覆盖 bridge / 衣柜 / 其余页面 / 启动注册 / 两个提前注入入口。执行代码一致；主入口对比只归一化此前已迁移的布局导入路径。
- Validated：桌面 Edge 隔离状态预览、衣柜数据/操作/布局、渲染快照和实际原版预览准备/编译；设置/特质等内容原节点和回退、存档 IndexedDB 保存/读取/删除与确认、商店原操作及隔离存档往返、战斗浮层和布局、总开关、Runtime Inspector/Adapter/Surface。只使用测试页面和隔离存储，不操作真实用户存档。
- Validated：提前注入缓存原恢复检查与打包契约；编译后的商店实验 API 默认值、严格 boolean、重复加载身份、未知字段保留和 reset。ZIP 公共声明与生成物一致、可执行入口全部为 JS、四个 Twee 补丁及顺序不变。
- 检查记录：状态预览旧测试未展开默认收起的“开发检查”，因控件不可见超时；修正测试操作后通过，未改产品显示行为。加入声明附件后，原“禁止所有 `.ts`”断言误拒绝 `.d.ts`；改为禁止运行时 TS 源码并核对声明只属于附加文件，再次通过。保留这两次失败的原因，不视为一次全绿运行。
- Not validated：本阶段完整 ModLoader 注入、Android/WebView 安装和最终发布回归尚未进行；列入最终候选包验收，不因类型阶段完成而声称设备已通过。前三至五批未触碰部分复用已有证据。
- Known limitations：类型声明不会替代运行时校验。原版宿主/生成渲染器的最小接口只描述实际调用面，不宣称验证了整个游戏或任意 Mod 结构；原有异常隔离和降级策略仍是运行时边界。

## DoL Dev Tools Skill 试用 · 2026-10-06

- Delivered / Validated：使用已安装的 `dol-dev-tools` Skill 与 Tools 1.5.0，在已连接平板的独立 `com.vrelnir.dol.lyra.uicompat051213` 上完成只读 Doctor、截图、限定 `#passages` 的 CDP 采集和 Soft & Wet 公开诊断 Integration。App 版本为 0.5.12.13，WebView 为 Chrome 154.0.8037.58，ModLoader 为 2.101.1；API v1 可读，当前 Fancy / glass / motion 开启。
- 证据：`tests/artifacts/dol-tools-trial-20261006-evidence/manifest.json`；所有请求步骤完成，临时 ADB 转发已清理，原有三个转发保留。没有点击、游戏状态或存档写入，没有安装/重启。
- 检查记录：首次 Doctor 因 ADB 不在 PATH 返回 partial；找到工作区已有 ADB，通过本命令的 `DOL_ADB` 指定后完成，未修改系统配置。
- Known limitations：DOM 达到深度限制而截断；Console 仅保留元信息，200 条事件之外另有 800 条省略，不能据此判断警告根因或整个运行期无错误。游戏版本探针为 null，0.5.12.13 来自 App 包版本。
- Not validated：本次验证工具现场诊断闭环，设备仍运行既有安装；不算 2.2 候选包部署或验收。

## JS 例外与严格度

- 自有主运行时、独立兼容入口、示例及提前注入入口均使用 TS；Vue 脚本使用 `lang="ts"`。
- `src/wardrobe/vendor/isolated-model.js`：唯一源码运行区 JS，固定上游派生生成文件；版权、生成器和正文不改，通过私有类型边界调用。
- `scripts/*.cjs`、Python 构建/打包、测试脚本及 HTML 夹具：工程工具和测试，不是自有业务运行时；继续保留现有语言。
- 构建产物与 ModLoader 入口继续是 JS，这是部署格式，不是另一份手工业务源码。
- 主包/Adapter/early 保持 `strict`。不对上游生成 JS 开启 `checkJs`，不借本轮全面开启 `noUncheckedIndexedAccess` 等选项而改变所有既有调用点。公共角色、只读诊断和 Surface 输入的编译期反例继续参与检查；运行时参数校验复用现有实现。

2.2.0 / Crazy Diamond 本轮交付与约定验收已完成；更多设备、WebView 和第三方组合属于追加覆盖，不阻塞本轮完成。


## 最终候选验收 · 2026-10-06

- Delivered：主包 2.2.0、三个 Style Adapter、两个嘴部包及 Surface 示例，统一 TS 构建；API v1 / Schema v1 不变；附带 API 文档和 `types/ui.d.ts`。
- Validated：`node scripts/test-workflow.cjs release` 在 0.5.11.9 原版桌面 Edge 夹具通过构建、单元与 18 个核心专项。各批次的类型擦除一致性、嘴部隔离宿主和 Lyra 预览证据按未改行为复用，没有重复全量采样。
- Validated：独立安装的 0.5.12.13 Android 平板 / WebView 154 / ModLoader 2.101.1，主包和 ModHub 0.2.2、MapleBirch 0.2.2、原版优化 0.1.3、新版嘴部 0.1.1 已持久安装并重载。真实 ModHub 1.3.0、MapleBirch 5.2.3、原版优化 1.1.1.2 的指纹完整匹配。
- Validated：ModHub 原生节点身份、父级、兄弟、值和 handler；Inspector 手动扫描和 Escape；存档 170 个原生条目/控件身份、属性、值、handler 与总开关回退；云页原节点和单页回退；编译后的 Surface 示例原 checkbox/change、button/click、重复打开身份、Modal/Drawer 关闭与视口。嘴部图层真实显示。
- Validated：游戏变量在页面内散列比较、偏好、Mod 顺序与隐藏列表前后保持；没有执行游戏动作、存档读写、改名、Mod 排序或云端操作。菜单关闭、临时示例和自有 ADB 转发已清理。
- 现场工具：按 dol-dev-tools Skill 使用 1.5.1 Doctor / Android 截图、限定 CDP DOM 与 Computed Style、DOM Diff 及只读 Runtime Integration。原生存档列表的限定 DOM Diff 无变化；节点身份另由任务脚本直接核对，未把结构 Diff 当作身份证明。
- 失败记录：首次存档总开关检查错误地要求整个 Overlay 子树身份与位置保持，包含被正常重建的 `dgs-*` 节点和既有工具组包装。原失败及诊断已保留；后续仅检查约定原生节点范围。存档页原工具组移动是既有例外，不宣称整个 Overlay 的父子关系完全不变。
- Not validated：新增手机/旧 WebView、所有 Mod 组合、真实云端事务，以及旧版嘴部包本轮 Android 部署。旧嘴部包继续使用目标版本隔离测试和既有预览证据。
- Known limitations：现场通用 DOM 采集在深度限制截断；Console 省略正文并可能含缓存回放，采集完成不等于整个运行期无错误。游戏版本在 Tools 探针未知，包装 App 版本单独记录；本轮目标操作窗口没有新 pageerror。截图含实际游戏内容，保留本地，不加入公开附件。

脱敏验收摘要：[typescript-2.2.0.json](audits/typescript-2.2.0.json)。本轮没有发现范围内阻塞缺陷。
