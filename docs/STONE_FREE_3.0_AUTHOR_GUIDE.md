# Stone Free：创建和维护一个独立 Vue Mod

这份指南面向试用当前研究源码的 Mod 作者。协议是 `0.1-experimental`，尚不是稳定 SDK，也没有 npm 安装入口。独立 Mod 不需要官方 Soft & Wet UI 或共享 Vue 包；可选布局只在作者主动贡献视图时使用。

配方、SDK 和模板也可从本地构建输出 `StoneFreeAuthorKit-0.1.0-experimental.source.zip` 取得。在新的开发目录解压后，按包内 README 创建项目，不需要复制整个 UI 仓库。这是开发用源码包，不能导入 ModLoader；它不含 Node、Python 或 npm 依赖。

## 创建、预览和打包

在本源码仓库中运行：

```powershell
node scripts/framework-factory.mjs create E:/my-mods/ReadingNotes ReadingNotes
```

目标目录必须不存在，`ReadingNotes` 是作者选择的技术名。配方生成 Vue/TS 源码、三个 vendored SDK 文件和打包脚本，不自动安装依赖或修改游戏。

进入生成目录，安装声明的依赖并保存自己的锁文件，然后使用：

```powershell
npm run dev
npm run check
npm run package
```

`npm run dev` 是持续运行的预览服务，先停止它或在另一终端运行检查和打包。本地预览使用普通 Vite，只显示 `src/Panel.vue`。它没有模拟游戏状态或 Host，适合修改文本、样式及组件交互。`npm run package` 先做类型检查和构建，再生成 `dist/ReadingNotes-0.1.0.mod.zip`。安装时不要解压 ZIP，先启用其声明的 `StoneFreeHost` 版本，再启用作者包。研究包不能作为正式稳定依赖发布。

本工程验证复用了已有依赖，没有新建网络安装环境；新电脑首次安装仍需相应 Node、Python 和依赖可用。命令以生成项目的 `package.json` 为准。

## 哪些源码由作者拥有

| 文件 | 负责内容 |
| --- | --- |
| `src/Panel.vue` | 作者组件；默认便笺只保留在当前实例，不写存档。 |
| `src/main.ts` | 接入 Host、声明可选视图和独立入口，导出包级 `dispose()`。 |
| `src/preview.ts`、`index.html` | 本地预览，不进入运行包。 |
| `vite.config.mjs`、`package.py` | 构建和 ZIP 文件清单；增加资源时由作者同步调整。 |
| `vendor/stone-free/*.ts`、`stone-free-sdk.json` | 有摘要记录的 SDK 快照及更新依据。 |

同一 SFC 在独立入口和工作台中可以有多个实例，局部状态默认互不相通。需要共享业务值时应由原业务系统提供可解释的来源，不把某个 Vue 实例或 Store 当作公共状态。

## 用 SDK 管理寿命

生成入口已使用 `connectConsumer()` 等待兼容 Host。它在 Host 退出时释放当前参与者，但仍可等待重启；真正卸载作者包时还要调用入口导出的 `dispose()`，才能取消等待订阅。

`mountVue()` 为每个挂载创建独立 Vue App。`lifetime: 'persistent'` 保留 UI 容器，不代表当前游戏绑定永久有效；`'passage'` 则在场景失效时退出。SFC 获得的 `hostContext` 只描述当前自有挂载。

异步工作要使用当次 `hostContext.binding()`，读取前后检查有效性，监听 `signal` 以停止自己的等待或界面更新。不要保存原 DOM、旧按钮或旧绑定后跨 Passage 执行。SDK 会处理迟到的组件加载及释放，但不能撤销作者已经执行的业务副作用。

`hostContext.onCleanup()` 登记自有事件、订阅等清理。不要移动未知原节点、拦截全部 DOM 写入或为兼容 Host 覆盖原游戏生命周期。

## 按需读取与贡献

`participant.provide({id, schema, read})` 公开作者认可的 JSON 投影。它不是原游戏的实时响应式镜像。消费者通过 `host.sources(schema)` 获取来源，明确选择合适的提供者并等待结果：

```ts
import type {Host, MountContext} from '../vendor/stone-free/contracts';
async function sampleReading(host: Host, hostContext: MountContext) {
 const binding = hostContext.binding();
 const sources = host.sources('example.reading.v1');
 if (sources.length !== 1) return; // 缺失或歧义由本界面退让。
 const result = await sources[0].read(binding);
 if (!binding.isCurrent() || !result.ok) return;
 return result.value; // 调用方再按 schema 的合同解释。
}
```

成功结果包含采样时点和场景代次，JSON 会复制并冻结；失败会区分缺失、过期、异常和不合法值。不要把 `ok` 当成字段语义正确的证明。通过 CDP 诊断时，也需要等待对象内部的异步读取，不能把 Promise 放进普通结果对象后假定会被递归等待。

视图是另一种可选贡献。先检查 `host.getCapabilities?.().views`，再用 `provideView()` 和 `vueView({load, props})`。生成入口已演示：不支持视图的旧 Host 保留独立入口，支持时布局可复用作者 SFC。布局只获得 `View.mount()` 句柄，不获得组件实例或作者状态。

撤销视图会关闭该声明的全部实例。同名重新声明属于新身份，旧句柄不能复用。标题用于显示，`owner / id` 用于标识，不凭标题或按钮文案推断业务语义。

## 命令不是业务引擎

`commands` 同样需要运行时能力检查。提供者主动声明经过审查的无参数回调，消费者用有效绑定调用。Host 只验证公开声明和返回的 JSON，不授予权限、不保存游戏业务状态、不自动重试。

`returned` 表示拿到了提供者见证，仍须解释 `value` 才能判断领域结果。`missing / stale / busy` 没有派发当前回调；`unknown` 表示回调已经开始但结果无法确认，不能假设没有发生，也不能盲目重放。具体状态见 [README 命令合同](../framework/README.md#受审命令实验)。

本源码的原版侧栏例子只执行经过身份、状态及遮挡复核的原按钮。购买、换装、战斗和存档需要各自可靠的来源、授权、失效和结果合同，不能直接套用 UI 切换样例。

## 资源与可选官方外壳

`claim('region' | 'shortcut' | 'modal', key)` 只协调自愿声明的资源，冲突返回 `null`，不自动抢占。租约本身不移动 DOM、不捕获键盘、不打开窗口。布局负责原生模态、焦点、可达性和响应式。

`DoLGameUI.ui` API v1 与 `DoLUiHost` 是不同接口。官方 Drawer 的调用方要独立检查 API 版本与 Surface 能力；关闭官方主题或缺少官方包时，独立消费者仍应能工作。参见[官方外壳示例](../framework/examples/SurfacePanel.vue)。

## 二次修改和 SDK 更新

修改作者 SFC 或入口后，先检查、预览，再打包回到实际游戏验证。升级 SDK 前回到本源码仓库运行：

```powershell
node scripts/framework-factory.mjs check-sdk E:/my-mods/ReadingNotes
node scripts/framework-factory.mjs upgrade-sdk E:/my-mods/ReadingNotes
```

`check-sdk` 是只读诊断，成功采集时退出码为 0；查看 `canReplace` 和逐文件状态。`source-different` 只表示与本次来源不同，不能判断版本新旧。`author-modified / missing / alias / not-file` 要先人工处理。`canReplace: true` 也不替代 API 和业务兼容检查。

更新只处理三个受管理 SDK 文件，不覆盖 SFC、入口、预览、构建配置或依赖。旧项目不会自动得到新版模板文件。更新后按改动风险检查真实消费者，保留作者修改和原失败证据；不要为小型样式修改默认跑完整游戏回归。

SDK 源码和精确类型见 [contracts.ts](../framework/contracts.ts)、[vue.ts](../framework/vue.ts)、[connect.ts](../framework/connect.ts)。历史 SDK 升级、打包、真实 Loader 及覆盖限制见[作者工作流记录](STONE_FREE_3.0_AUTHOR_WORKFLOW.md)。
