# TypeScript 工具源码

安装锁定依赖后，先运行 `npm run tooling:build`。`tsconfig.tools.json` 严格检查并将 `.cts/.mts` 编译为同目录 `.cjs/.mjs`，保留 CommonJS/ESM、现有 CLI 路径及 `__dirname`。生成路径在 `.gitignore` 逐项列出；只修改 TS 来源。

`npm run tooling:check` 只检查。`build`、`framework:build`、`ci:check`、`ci:build` 及原型构建会先编译工具；独立第二次构建也从复制的源码重新生成，不复制第一次输出。直接运行工具或专项测试前，先执行 `tooling:build`。

当前依赖安装前的 CI 调度尚未迁移，保留原生 TS 擦除启动方式及 Node 22.12 的既有要求。这条路径不能直接执行 `export =` 或 `import = require`；后续迁移必须同时解决其干净安装引导，不可只改后缀。

`tests/tooling-types.cts/.mts` 是只供类型检查的正反合同；无效调用不会运行。它们验证两种消费者均取得真实 CJS 导出、参数和返回类型，而非裸 `require` 的 `any`。
