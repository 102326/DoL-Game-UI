# Stone Free 3.0：作者工作流与侧边工作台

2026-10-17，第五轮研究实现。基于 `f1eb522e8e1ebfdf39fadce4aab07de06184fb46`，继续保留正式 UI 2.7.0 和 API v1。没有安装、发布或推送正式版本。

## 本轮交付

Factory 生成的同一作者 SFC 可以用于普通 Vite 组件预览、独立浮动入口和公开工作台视图。作者可以二次修改组件、入口和构建配置；SDK 更新只处理有记录且未被修改的三个 vendored 文件，不重写作者代码。`check-sdk` 提供只读诊断，文件缺失、别名、非文件和作者修改均给出具体原因。`canReplace` 只证明机械替换条件成立，不证明业务兼容。

预览不包含模拟 Host、SugarCube 或游戏数据，不引入新服务器或框架。作者移除全部 CSS 后仍能打包。Mod ZIP 不包含预览、SDK manifest 或项目测试记录。

原有替代布局研究包现在提供非模态侧边工作台，复用现有视图、偏好及区域租约。默认信息工作台仍为模态，两者不自动抢占同一区域。侧边布局不申请模态租约，不增加全局输入监听；Escape 仅处理布局自己的控件，跳过输入框、IME 和贡献者子树。

原侧栏适配按 `:modal` 区分真正模态与普通打开的 dialog。浏览器不支持该选择器时保守退让。原按钮被隐藏、替换、禁用或遮挡时仍拒绝调用；不移动节点、不强制点击，不直接写 SugarCube 状态。窄屏下侧边面板可能覆盖原按钮，此时拒绝操作是已知边界。

## 验证与证据

下列路径均位于本仓库 `tests/artifacts/`，只作本地证据，不进入 Mod 包。

| 检查 | 本轮结果与范围 | 证据目录 |
| --- | --- | --- |
| Factory 定向检查 | 18 组通过；生成、两次作者修改、保护式更新、预览、组合视图、旧 Host 及无 CSS 打包 | `stone-free-foundation/factory-1792169398310` |
| 真实历史 SDK 升级 | 从 `d666095647fe31c684eb80e471633efa0500ae6f` 提取实际旧 SDK，构建升级前后代码，便笺交互和卸载结果一致 | 同上，`commands.log / historical-sdk / legacy-author` |
| 真实 ModLoader | 作者 ZIP 注册参与者和公开视图，无官方 UI；原版年龄窗口阻止进一步交互，记 `passed-with-limitations` | `stone-free-foundation/game-1792169253830` |
| 工作台 | 12 组通过；来源撤销、区域交接、偏好及局部失败清理 | `stone-free-workspace/browser-1792169709702` |
| 命令及侧边交互 | 13 组通过；非模态与原输入共存、原按钮两次切换、真实模态阻断、局部 Escape、场景失效关闭 | `stone-free-reading/browser-1792169877953` |
| Android 代表性复验 | 临时加载五个自有包；标准 Tools `web-click` 操作独立工具条和侧边视图，原按钮共收到 4 次事件并恢复原状态；模态内拒绝操作；清理完成 | `stone-free-reading/android-1792170041906` |

`npm run framework:build` 包含 Vue/TS 检查、Vite 和八个独立研究 ZIP 的构建，已通过。Factory 历史源码使用当前已有依赖构建，没有恢复旧依赖环境。普通 Vite 预览已在 390px 检查；侧边布局浏览器检查覆盖 390×844、844×390、760×800、1280×900，关闭入口可点，无水平溢出。这些不是物理手机触控验收。

Android 为已授权独立测试 App `com.vrelnir.dol.lyra.uicompat051213`，M367FC、Android 17、DoL 0.5.12.13、UI 2.7.0，现场 Passage 为 Start。使用 Paisley Park 6.1.0 的绑定、标准动作和原生截图 collector。截图已查看。未重载游戏、写入存档、安装持久 Mod 或处理 GER Store。

## 实际失败与修正

- 侧边工作台首次交接检查被自有状态视图遮挡。原生模态曾掩盖普通 CSS 层叠问题；仅提高侧边布局自己的层级，仍低于原生 top layer。修正后工作台检查通过，没有 force-click。
- 新命令检查最初使用错误的参与者 ID，等待不存在的入口失败，见 `stone-free-reading/browser-1792169855414/failure.json`。改为实际 `AlternateWorkspace` 后通过，属于项目测试错误。
- 平板首次补验在 `toolbar-screenshot` 超时，见 `stone-free-reading/android-1792169919404`。此前两次原侧栏切换和恢复已确认，后续侧边流程未执行。清理成功。该阶段当时未区分矩形读取与 CDP 截图，不能确定失败的方法或原因。
- 独立只读 `screenshot-probe-1792169976267` 对同一文档的原按钮矩形及 CDP 截图成功，不能据此解释上述超时。项目后续改用现有 Android 原生截图 collector，阶段字段分开，不反复重试原截图调用。
- 第二次平板脚本把异步来源读取嵌入普通对象，漏了 `await`，得到 `{}` 后断言失败。收据保留于 `stone-free-reading/android-1792170015368`。修正测试中的等待后，最终复验通过。不是 Host 投影或 Tools 丢失数据。

## 判断与边界

这轮已完成约定的作者工作流和非模态布局闭环。Factory 的实际价值目前是统一 DoL 接入、独立 ZIP、可选视图与受保护 SDK 更新。普通预览本来就是 Vite 的能力，没有证据证明配方比熟练作者使用模板与 Agent 普遍更快。

未验证物理手机触控、真实 IME、持久安装升级、所有 Mod 组合及业务动作。Loader 检查发生在侧边源码修改前，只证明作者包注册，不作为最终侧边制品的 Loader 证明。最终侧边制品由浏览器和 Android 临时加载证明。过去 CDP 超时和历史 GER Unknown 均未被本轮结果追认或清除。

Host 协议仍为 `0.1-experimental`；无破坏性公共 API 调整、无共享 Vue 默认依赖、无原版全局动作镜像。玩家正式可用性及社区作者生产力仍需各自的后续证据，不宣称全部 3.0 已完成。
