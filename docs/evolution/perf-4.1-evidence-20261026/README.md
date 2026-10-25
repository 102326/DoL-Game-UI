# 4.1 性能调查：Mac 离线接续资料

本目录随 `research/perf-4.1-baseline` 分支保存，拉取仓库后即可使用，无须转移 Windows 本机 ZIP。这是测量和开发输入，不是游戏或 Mod 安装包。基线为 DoL Game UI 4.0.1 / `ff428b4d385b79f6c14fada9a65301157978aa6f`。本轮只调查，没有优化候选，也没有合并或发布授权。

本包不含完整游戏、存档、设备序列号、原始浏览器 trace、截图或私有数据备份。ModHub 源码取自本轮实际加载的 1.8.3 包，附原 MIT 许可；文本仅统一为 Git LF 换行，原捕获与归档文件摘要分开记录；`vendor/` 用于源码核对，不应直接加载或安装。

## 无游戏、无设备也能执行

使用项目基线 Node >=26.12.1 <27，在本目录执行：

```sh
node replay-summary.mts
node check-inference.mts
```

两项仅使用 Node 内置模块，不需要安装 npm 依赖。

- `replay-summary.mts`：复算 18 次 Android UI 开／关对照的中位数，复核 timeline 投影中完整 style／layout slice 与汇总。它不测量 Mac 的帧率。
- `check-inference.mts`：执行当前 ModHub 原始纯函数的 26 个静态场景、6 步同对象变化、输入不变及返回结果隔离。结果是当前函数的行为基线，不是完整依赖业务的正确性认证。
- 正则实验统计动态 `RegExp` 构造调用，不代表每次构造都会重新编译；输出中的 Node 计时不能当作 Android 收益。

两个反例命令应以非零状态退出，分别报告修改序列 step 1／step 4：

```sh
node check-inference.mts ./negative-object-cache.mts
node check-inference.mts ./negative-catalog-cache.mts
```

这证明测试会拒绝“按对象引用缓存却没有可靠失效”。它们是故意错误的离线用例，不是产品实现，不可并入运行代码。

后续纯函数候选可导出同步的 `inferRequiredDependencies(mod, catalog)`，用下面命令比较：

```sh
node check-inference.mts /path/to/candidate.mts
```

原始源码与 golden 输入不要跟着候选改写。若发现业务缺陷，另行记录和审查，不能通过修改期望值掩盖性能改造的行为变化。

## 对照仓库源码

在新克隆或独立工作区准备上述基线提交；已有未提交工作先保留，避免覆盖。执行：

```sh
node verify-source.mts /path/to/DoL-Game-UI
```

它核对关键文件摘要，不代表核对整个 Git tree 或实机行为。文件在后续开发中变化是正常现象，不能重生成身份清单来冒充原测量基线。

## 不依赖完整游戏的现有浏览器用例

在仓库目录准备 Node 基线后：

```sh
npm ci
npx playwright install chromium
npm run tooling:build
node scripts/build-framework.mjs
node tests/evolution-panels.cjs
node tests/official-game-motion.cjs
```

前两步会安装开发依赖和 Chromium。Windows 本轮使用已安装的 Edge，两个测试退出码均为 0；Mac 尚未执行，不能把 Windows 结果写成 Mac 验收。构建命令生成测试所需产物，不创建正式发行。

`panels.test.cts` 等依赖完整游戏的测试不属于上述离线路线。完整 CI 仍按仓库自身条件运行，不因 Mac 没有游戏就删用例或放宽断言。

## 下一步先改哪里

1. 共用开窗：面板索引、标记、可见性／几何读测、天气顶栏尺寸同步、焦点交接的写读批次。保留动态失效、原命中、输入阻挡和原事件。
2. ModHub：更新结果缓存之前的依赖推断与签名成本；审查 catalog 整体替换、对象浅拷贝、描述／别名变化及安装状态的失效合同。

时间线确认的是当前 UI 对整体开销的参与，不证明全部成本来自某一段代码。`generateLinkNumbers` 和游戏 Renderer 仍需独立研究；不要直接跳过第三方回调或原生编号。

Mac 可以完成源码分析、候选实现、类型／构建检查和这些离线合同。真实 Android 的组合兼容、触控、玻璃合成、实际呈现和视觉仍须在有游戏／设备的环境复验。

详见[首轮调查](../EVO-4.1-PERF-SURVEY-2026-10-26.md)、[深度复核](../EVO-4.1-PERF-DEEP-2026-10-26.md)、`browser-fixture-receipt.json`、`source-identity.json` 和 `SHA256SUMS.txt`。Raw trace SHA 保存在 `trace-provenance.json`，原 trace 继续留在 Windows 本地。同步结果以实际研究分支提交为准；不合入 main，不修改现有发行。
