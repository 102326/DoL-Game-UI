# Soft & Wet 4.x — 开发与测试

当前正式UI4.1.0，4.2为独立研究。先读[HANDOFF](HANDOFF.md)和[4.x入口](README.md)，核对分支/HEAD、工作区、远端、实际Node/浏览器及锁定依赖。Node>=26.12.1 <27、Python3.10+；新设备用npm ci，不将旧设备结果算成本机通过。

## 现役命令

- `npm run build`：类型/字段合同、Vite主运行代码和early入口；内部保留构建入口不代表重新发行旧代产品。
- `npm run ci:check`、`npm run ci:unit`：当前类型/源码/协议/负例合同。
- `npm run ci:build`、`npm run ci:packages`：当前Framework及九个玩家包、ZIP/版本/依赖/双构建证据。`npm run package`复用当前玩家包生产器。UI版本来自package.json，Host与兼容包按独立版本生成。
- `npm run ci:browser`与`node scripts/test-ci.cjs research`：现役标准/研究入口，完整集合及证据身份按[CI合同](CI.md)；不自行用子集参数替代门禁。
- `npm run tooling:check`、`npm run framework:check`、`npm run lab:check`：分别用于相应工具/Host/组件改动。CTS/MTS先经tooling:build生成忽略的CJS/MJS。

4.2隔离原型入口与定向检查见[研究README](../prototypes/evolution42/README.md)，当前候选已被否决，留作历史复现。原型本机检查不自动进入现workflow，不能以旧远端成功签字。

## 游戏资源与测试范围

`test:quick/test:release/test:perf`仍是现役保留的宿主回归入口，执行计划和所需资源由scripts/test-workflow.cts定义；带--plan可只列计划。其命名不等于正式发行门禁，也不保证适用当前任意游戏版本。需要实际资源的脚本不得自动下载游戏、读私人存档或通过跳过伪造通过；Windows/Android留实际现场。旧代专属演示和单包生产器已迁出，不再提供为开发入口。

批量CI沿现政策，只在有意义集成/冻结边界跑整轮；保留required validate/moody-gate及source/artifact身份。先定向验证，再按实际风险扩大；失败保留首因，不重试至绿。发布仍需单独授权。
