# TypeScript 工具源码

安装锁定依赖后，先运行 `npm run tooling:build`。该入口先用 `tsconfig.tools.json`（NodeNext 工具）及 `tsconfig.test-tools.json`（Bundler 测试）对各自完整依赖图严格检查，再用同一锁定 TypeScript 编译器仅生成配置明确列出的 CTS/MTS 根文件，输出同目录 `.cjs/.mjs`，保留模块形式、CLI 路径及 `__dirname`。不生成传递导入的原生 TS 副本，以免拆分有状态的 CI 模块。入口不可绕过类型检查。测试以 Bundler 解析真实浏览器模块的类型，与实际 esbuild/Vite 加载路径相同；工具本身仍按 NodeNext 检查。两个配置都保留 strict 和 noUncheckedIndexedAccess，CTS/MTS 输出统一按 NodeNext 生成，保留 CJS 严格模式及原模块身份。

普通生成路径在 `.gitignore` 逐项列出。CI依赖安装前启动或独立证据验证所需的生成CJS随源码保留：`ci-png`、`ci-catalog`、`ci-cases`、`ci-process-receipt`、`ci-test-reporter`及`tests/device-case-plan`。只编辑对应CTS，生成后两者一起提交；CI源码身份检查会拒绝未提交的输出漂移。`ci-checkpoints`和`ci-source-policy`在安装依赖后使用，其输出单独忽略。初次22个根输出与完整tsc emit逐字节一致；后续新增模块仍单独验证，不能沿用这一计数自证。

`npm run tooling:check` 只检查。`build`、`framework:build`、`ci:check`、`ci:build` 及原型构建会先编译工具；独立第二次构建也从复制的源码重新生成，不复制第一次输出。直接运行工具或专项测试前，先执行 `tooling:build`。

原有六个根目录 TS 研究脚本和五个 Vite 配置另由 `tsconfig.research-tools.json` 检查。配置使用 Preserve/Bundler，因为 Vite 配置会通过真实导出取得已编译 CTS 的类型；它不要求把 CJS 模块变成 ESM。依赖前原生 CI 的 erasable 检查仍独立保留。

`ci:check` 另检查19个真正以原生 TS 执行的入口是否只使用可擦除语法；附加反例证明 enum 会被拒绝。这是严格类型检查之外的语言特性检查，不取代它。Vite/CTS/MTS编译路径不被错误要求只能使用原生可擦除语法。

当前采用Node 26 Only（>=26.12.1 <27），两套Actions读取 `.node-version` 固定26.12.1，类型声明与锁文件同步为Node26。`.npmrc`启用engine-strict；preinstall及工具/CI引导还会检查实际Node，不能把npm警告当成版本限制。Node26原生擦除用于既有CI TS模块；编译型CTS中的 `export =`、`import = require`仍由锁定编译器生成CJS，不能直接交给原生擦除执行。依赖安装前路径使用已提交的生成CJS，不能依赖尚未安装的编译器启动自身。

`tests/tooling-types.cts/.mts` 是只供类型检查的正反合同；无效调用不会运行。它们验证两种消费者均取得真实 CJS 导出、参数和返回类型，而非裸 `require` 的 `any`。


2026-10-24 工具链修补：Vite最低提高到7.3.7，锁文件实际为7.3.7；作者配方使用同一安全最低版本。此补丁针对开发服务器的编辑器调用、路径及中间件安全公告，不改变玩家浏览器目标，也不代表所有依赖永远无漏洞。原始7.3.6审计保留在历史证据中。


设备测量页保持单个离线HTML：维护 `tools/device-probe.ts` 与 `tools/device-probe.template.html`，先 `npm run tooling:build`，再 `node scripts/build-device-probe.mjs --write` 更新生成页。`ci:check`使用 `--check` 拒绝未同步输出，不修改源码或生成页；专用严格配置启用noUncheckedIndexedAccess。生成HTML仍可直接file打开，没有外部脚本请求，不读取Cookie/存储或游戏数据。
