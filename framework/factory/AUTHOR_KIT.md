# Stone Free 作者源码包

`0.1.1-experimental`，协议 `0.1-experimental`。供作者创建和维护独立 Vue Mod。源码和实验协议可能继续调整，尚不是稳定 SDK。

这是开发用 `.source.zip`，不是游戏 Mod，不要导入 ModLoader。解压到新的开发目录后，在该目录运行：

```powershell
node scripts/framework-factory.mjs create E:/my-mods/ReadingNotes ReadingNotes
```

目标目录必须不存在，技术名由作者选择。进入生成的项目，安装其声明的依赖并保留自己的锁文件。需要 Node 22.12+、Python 3.10+；本源码包不包含 Node、Python、Vue 或 node_modules。

`npm run dev` 启动普通 Vite 组件预览。结束预览后，用 `npm run check` 检查类型，`npm run package` 构建 `dist/ReadingNotes-0.1.0.mod.zip`。预览不含游戏或模拟 Host，不能代替实际游戏检查。

生成的游戏 Mod 依赖 `StoneFreeHost 0.1.1-experimental`，由单独的 Host `.mod.zip` 提供运行能力，不依赖完整官方 UI 或共享 Vue 包。安装到测试游戏时不要解压 `.mod.zip`。源码包本身不提供或下载游戏、ModLoader、APK 和存档。

## 修改与可选组合

作者拥有 `src/Panel.vue`、`src/main.ts`、预览与构建配置。默认组件以独立浮动入口显示，也可通过公开贡献放进愿意接入的工作台；没有工作台仍可使用。便笺为每个实例自己的临时 UI 状态，不写入游戏或存档。

编辑 SFC 后继续预览、检查和打包。新增图片或其它资源时，作者按实际构建输出调整 `package.py`。预览和内部 SDK manifest 不进入游戏 Mod ZIP；源码中的 LICENSE 和构建所需的 Vue 声明会随游戏包保存。

## 检查与更新 SDK

拿到另一份可信源码包后，在那份源码包目录运行：

```powershell
node scripts/framework-factory.mjs check-sdk E:/my-mods/ReadingNotes
node scripts/framework-factory.mjs upgrade-sdk E:/my-mods/ReadingNotes
```

`check-sdk` 不写文件。检查 JSON 中的 `canReplace` 和每个文件状态；成功采集时退出码为 0，不代表兼容性已确认。`source-different` 只表示来源不同，不判断新旧。修改过、缺失、别名或非文件的受管理 SDK 会阻止整次更新，需人工处理。

`upgrade-sdk` 只替换三个记录过且未修改的 SDK 文件，不覆盖作者源码、依赖或配置。模板更新不会自动改写已有项目。更新后按实际影响验证自己的消费者。

## 接口与边界

类型和实现见 [contracts.ts](framework/contracts.ts)、[vue.ts](framework/vue.ts)、[connect.ts](framework/connect.ts)。`connectConsumer()` 处理兼容 Host 的出现与退出；入口导出的 `dispose()` 还负责取消等待订阅，临时卸载时不能只删除 DOM。

`mountVue()` 创建独立 App。持久 UI 不代表游戏绑定永久有效；异步工作使用当次 `hostContext.binding()` 并检查 `signal / isCurrent()`。贡献来源为按需 JSON 采样，视图由提供者拥有；不公开原游戏可变对象或 Vue Store。

视图和命令需先检查 `host.getCapabilities?.()`。命令 `returned` 只表示提供者返回见证，须按领域合同判断结果；`unknown` 不可自动重试。资源租约只协调主动参与者，不是权限、ModLoader 或全局输入管理器。

`stone-free-author-kit.json` 记录本包文件摘要，供核对本地来源，不能证明发布者身份、代码安全或游戏兼容性。请先检查来源再运行脚本。当前源码包按白名单导出，不包含官方 UI 实现、内部测试、证据、截图和设备数据。
