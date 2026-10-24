# TypeScript 工具源码

安装锁定依赖后，先运行 `npm run tooling:build`。该入口先用 `tsconfig.tools.json` 对完整依赖图严格检查，再用同一锁定 TypeScript 编译器仅生成配置明确列出的 CTS/MTS 根文件，输出同目录 `.cjs/.mjs`，保留模块形式、CLI 路径及 `__dirname`。不生成传递导入的原生 TS 副本，以免拆分有状态的 CI 模块。入口不可绕过类型检查。

普通生成路径在 `.gitignore` 逐项列出。CI依赖安装前启动或独立证据验证所需的生成CJS随源码保留：`ci-png`、`ci-catalog`、`ci-cases`、`ci-process-receipt`、`ci-test-reporter`及`tests/device-case-plan`。只编辑对应CTS，生成后两者一起提交；CI源码身份检查会拒绝未提交的输出漂移。`ci-checkpoints`和`ci-source-policy`在安装依赖后使用，其输出单独忽略。初次22个根输出与完整tsc emit逐字节一致；后续新增模块仍单独验证，不能沿用这一计数自证。

`npm run tooling:check` 只检查。`build`、`framework:build`、`ci:check`、`ci:build` 及原型构建会先编译工具；独立第二次构建也从复制的源码重新生成，不复制第一次输出。直接运行工具或专项测试前，先执行 `tooling:build`。

原有六个根目录 TS 研究脚本和五个 Vite 配置另由 `tsconfig.research-tools.json` 检查。配置使用 Preserve/Bundler，因为 Vite 配置会通过真实导出取得已编译 CTS 的类型；它不要求把 CJS 模块变成 ESM。依赖前原生 CI 的 erasable 检查仍独立保留。

`ci:check` 另检查18个真正以原生 TS 执行的入口是否只使用可擦除语法；附加反例证明 enum 会被拒绝。这是严格类型检查之外的语言特性检查，不取代它。Vite/CTS/MTS编译路径不被错误要求只能使用原生可擦除语法。

当前最低Node为26.0.0，两套Actions使用26.x，类型声明与锁文件同步为Node26。Node26原生擦除用于既有CI TS模块；编译型CTS中的 `export =`、`import = require`仍由锁定编译器生成CJS，不能直接交给原生擦除执行。依赖安装前路径使用已提交的生成CJS，不能依赖尚未安装的编译器启动自身。

`tests/tooling-types.cts/.mts` 是只供类型检查的正反合同；无效调用不会运行。它们验证两种消费者均取得真实 CJS 导出、参数和返回类型，而非裸 `require` 的 `any`。
