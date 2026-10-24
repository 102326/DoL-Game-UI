# TS First补充：保留CommonJS的TypeScript迁移

2026-10-24，基于 `ff7942d`。这是[主评估](EVO-TS-FIRST-ASSESSMENT-2026-10-24.md)的补充，不是立即迁移、改正式版本或发布的授权。

## 结论

**现有CJS实现优先考虑 `.cts → 编译后的.cjs`，原有ESM工具考虑 `.mts → .mjs`。不把迁移TS与迁移ESM捆绑。** 需要同步require、`__dirname`、`require.main`或CommonJS导出对象，不构成自有源码必须保留JS的理由。

这也修正主评估的早期例外：现有2行 `scripts/ci-cases.cjs`不因“桥”而必须保留为手写JS，可以有CTS来源并生成同路径/约定路径CJS。最终是否需要启动薄壳，取决于已验证的冷启动约束；不能默认保留复杂JS实现。

## 1. 本仓库的分配建议

| 文件/类型 | 建议 | 依据 |
| --- | --- | --- |
| `scripts/ci-evidence.cjs`、`ci-catalog.cjs`、`ci-research.cjs`、`test-ci.cjs` | CTS，编译为CJS；先明确冷启动入口 | 已有同步require依赖、导出对象和CLI判断，保留模块形式可减少额外变化；恰好是当前TS runner的any来源 |
| `ci-checkpoints`、`ci-process-receipt`、`ci-png`、`ci-metrics`、`ci-source-policy`、`ci-test-reporter`、`ci-verify-remote`及`ci-cases`等 | CTS，保留必要的CJS消费者合同 | 并非必须ESM；检查器、Node reporter、checkpoint、失败收据等应获得真实导出类型，而不是保留无类型JS |
| `build-adapters.cjs`、`build-early.cjs`、`vendor-wardrobe.cjs`、`render-state-fields.cjs`及其余已有CJS工具 | CTS | fs/path/esbuild/子进程接口可被检查；改成TS不必改变require、相对目录与生成输出名 |
| 203个CJS测试及ReOverfits的`check.cjs` | 迁移本批选择项到CTS，其余入后续清单 | 保留Node测试、require及夹具加载语义；JS夹具/历史错误字符串仍作为数据，不强行改成TS |
| `component-lab/source-index.cjs` | CTS | 纯Node工具，继续CJS即可 |
| 8个MJS工具：Framework/Golden构建、Factory工具、设置准备及三个预览服务 | MTS | 已经使用ESM/import.meta，保持现有模块形式，编译后仍MJS |
| `framework/factory/vite.config.mjs` | MTS；普通TS也可 | Vite本来支持TS配置；MTS明确沿用ESM，不改变目录package.json影响范围 |
| 现有CI TS、Vite TS、产品/Host/Adapter/Vue | 保持TS及现有模块形式 | 主要补检查入口、边界与有类型的互操作，无理由再统一改扩展名 |

本仓库 `package.json`为 `type:module`：普通TS随包语义，MTS明确ESM，CTS明确CJS。输出扩展名由各格式决定，不需要为CTS修改全仓package类型。[TypeScript模块说明](https://www.typescriptlang.org/docs/handbook/modules/reference)

逐文件路线已写入[清单](EVO-TS-FIRST-INVENTORY-2026-10-24.json)的suggestedSource。独立候选从早期242修正为**243**；本批从124修正为**125**，新增的是那条不应以CJS为永久例外的薄桥。其余盘点没有改变。

## 2. 执行路线：建议先编译，不把原生擦除当完整方案

### 推荐正式路径

使用现有TypeScript编译器建立独立Node工具检查/构建配置，覆盖本批TS/CTS/MTS；`module/moduleResolution:NodeNext`、`strict:true`、`noEmitOnError:true`，根据实际消费者输出声明。CTS编译成CJS，MTS编译成MJS，既有TS按其模块语义处理。不需要新增tsx/ts-node，也不需要因此提高游戏App或浏览器要求。

CTS可用有类型的 `import x = require(...)` / `export = { ... }`表达当前CommonJS合同，由tsc降为require/module.exports。这样可以保留对象导出形状，不额外引入 `.default`层。类型信息来自同一份实现或其自动生成的 `.d.cts`，不手写第二份“看起来正确”的接口。

现有 `tsconfig.ci.json`面向**原生擦除执行**，同时打开 `erasableSyntaxOnly:true`与 `verbatimModuleSyntax:true`。`export =`不属于可直接擦除语法，所以不能直接套用该配置。建议保留原配置用途，为**编译执行的CTS**设置适合其语法的配置，类型严格检查照常；不靠关闭strict、允许any或忽略错误让它通过。[erasableSyntaxOnly](https://www.typescriptlang.org/tsconfig/erasableSyntaxOnly.html)、[verbatimModuleSyntax](https://www.typescriptlang.org/tsconfig/verbatimModuleSyntax.html)

若保留原生TS runner与编译CTS混用，其类型检查可以消费由同源编译生成的 `.d.cts`及对应CJS产物，避免让原生擦除配置直接检查不支持的运行语法。也可以把同一工具执行闭包统一预编译；这只统一执行准备，不要求源模块都改成ESM。T0应以最小真实切片比较两者，再固定一条构建合同。

### 原生CTS可以用，但有条件

Node22.12支持通过 `--experimental-strip-types`执行可擦除TS，CTS按CommonJS处理；这种运行**不做类型检查，也不读取tsconfig来改写模块**。保留JS兼容的require/module.exports语法且只添加可擦除类型的CLI可直接执行，但导出类型仍要另外解决。不能把 `node file.cts`成功当作TS First完成。[Node22.12官方说明](https://nodejs.org/download/release/v22.12.0/docs/api/typescript.html)

本地Node26.12.1对纯注解CTS CLI执行成功；对含 `export =`的CTS，只有strip时明确拒绝。不能将这条新Node实测冒充最低22.12实测，也不建议靠增加transform实验开关作为跨版本正式默认。

## 3. 对现有执行链的真实影响

1. **依赖安装前的启动。** 当前Actions先调用 `node scripts/test-ci.cjs stage dependencies`，之后才安装好TypeScript等npm依赖。把这条入口直接换成“先tsc再运行”会出现先有编译器还是先装依赖的问题。不能忽略，也不需要因此把全部CI留JS。T0需验证最小原生可擦除CTS启动器，或有TS来源、可核对的生成CJS启动产物/薄入口；它只负责当前启动合同，复杂调度和证据实现仍进入TS。若改依赖阶段的调用方式，原身份、失败和安装证据必须保留，不能从收据里删除这一阶段。
2. **路径。** 编译输出目录改变会影响`__dirname`、`import.meta.url`、测试HTML/fixture读取、Python子进程路径和相对仓库根目录。可保持生成CJS的约定入口，或让现有命令指向保留目录结构的构建目录；无论选择哪条，源文件、生成文件和repoRoot必须明确区分。不能只改package.json再等待各脚本自己碰巧找到资源。
3. **导入/导出。** 既有CJS消费者可继续同步require；TS消费者应使用受检查的导入，而非裸require的any。ESM runner消费CJS对象时优先验证default对象映射，不依赖所有动态CommonJS导出都能被Node猜成named export。不要引入不必要的异步import或顶层await来改启动顺序。
4. **检查与生成。** 新检查include必须包含 `.cts/.mts`，现有仅 `scripts/ci/**/*.ts`不够。运行入口需要经过检查；生成的CJS/MJS不是另一份手改源码，不能使用陈旧产物。若跨配置使用声明，声明必须由当前实现生成，不能单独手写来骗过调用方。
5. **CI合同。** Catalog、Expected Lock、源码策略、用例提取、原反例生成、reporter、子进程命令和workflow里的扩展名/文件定位都要核对。源码摘要应绑定作者实际维护的CTS/TS；执行收据另外绑定实际运行产物。不能让锁只校验一个旧桥，实际跑的实现却已换掉。
6. **Node兼容。** 编译后的CJS/MJS可继续使用现有Node范围，默认不升级最低版本。需要新做最低22.12与CI当前22.x的空checkout启动/编译/互操作验证；本地26只是已有一项证据。UI/Host的打包身份和浏览器目标不因工具语言而改变。

## 4. 能否阻止any穿透：本轮实际探针

使用当前TS5.9.3/Node26.12.1在独立临时目录验证，没有迁移项目文件：

| 探针 | 结果 |
| --- | --- |
| CTS有类型函数＋`export =`，编译CJS，由CTS消费者调用 | 运行PASS，参数和返回值有类型 |
| 同一编译CJS由MTS/ESM消费者default导入 | 运行PASS，模块仍是CJS |
| 错参数、错接收类型、不存在的导出 | 分别被TS2345、TS2322、TS2339拒绝，无需any或强制断言 |
| 只把代码放进CTS，保留裸 `module.exports`＋调用方裸require | 调用方仍是any；该示例生成声明仅 `export {}`，无类型收益 |
| 将有类型 `export =`的CTS套用现有erasable限制 | 被TS1294拒绝，说明配置职责需要区分 |
| 纯类型注解的原生CTS CLI | 本地运行成功；不代表执行时做了检查 |

因此答案是**可以获得准确类型，但必须同时处理实现导出、调用方导入和检查/构建链**。仅改`.cjs`后缀，或保留 `const e=require(...) as SomeInterface`，不满足完成标准。Node内置模块可以使用标准Node声明；自有模块的真实参数、返回结果、失败与状态联合，应由实现直接检查并推导到消费者。

JSON、存档、外部Mod、子进程文本等仍是独立数据边界：模块有类型，不代表输入可信。继续从unknown按实际合同校验，不能把模块互操作类型当Schema证明。

## 5. 哪些是真的JS限制

| 对象 | 限制属于哪里 | 本次判断 |
| --- | --- | --- |
| Loader运行JS、浏览器直接script、生成CJS/MJS | 目标执行环境需要JavaScript | **输出必须JS，源码可以TS** |
| `tests/story/helpers.js`、原生宏/恶意历史JS字串 | 被测试的内容必须保持目标JS/宏语义，不能通过TS先修正掉反例 | 保留为夹具/协议数据；承载和断言可TS |
| 上游生成renderer | 来源固定、生成可比对、许可和既有算法边界 | 上游代码保留JS；自有generator与封装应TS，不是“Node不能运行TS” |
| 现有CJS工具与tests | 同步模块/CLI/导出协议 | **只需保留CommonJS，不需要保留手写JS实现** |
| 依赖安装前启动薄壳 | 尚无编译器、现有最低Node及启动合同 | 先验证原生CTS或同源生成启动器；若确需临时手写JS，须限定文件、解释实测限制和退出条件，不能预先宣布永久例外 |

目前没有证据证明某个自有业务算法因CommonJS而必须用JS写。旧CJS桥不应自动豁免，ESM也不应成为迁移前置条件。

## 验收补充

在主报告T0/T1增加：CTS/MTS路线实测、冷启动闭环、严格检查的真实导入/导出、三类编译负例、生成物不陈旧、路径/模块语义与最低Node检查。保留原测试ID、有效断言、历史错误准确拒绝和全部失败收据。选择编译模式而调整语法限制，不等于允许放宽类型安全。

本轮仅完成评估和隔离技术探针。最低Node实际执行、全项目CTS互操作、全量CI和新制品都未验证；正式代码、版本、依赖与发布状态未改。
