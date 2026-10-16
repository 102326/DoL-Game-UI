# 第八轮：Floating Hub Motion Lab

## 本轮交付

以第七轮提交 `f91b52520dcb1d19076196bb7c822f77cf45bd4d` 为基线，选择 Floating Hub 作为首个官方动态原型。已有侧栏命令和公开视图可以立即接合真实宿主；衣柜继续保持单击直接穿戴，没有恢复已取消的浏览模式。

新增可选 `StoneFreeMotionHub`，与稳定 2.7 浮动工具分开。复用现有 `ViewOutlet`、状态速览、对照和阅读视图；同一状态来源被两个不同视图消费，没有新增 Host/SDK 合同、第二套设置状态或全局 DOM 接管。

本轮完成条件是：一个可操作的空间动态原型，具有真实原版操作结果、受影响的中断/输入/清理检查和代表性 Android 证据。不是完整 3.0 发布验收。

## 动态与操作

入口旋转和外圈展开后，工具沿不同空间路径错峰展开；详情从入口位置缩放、旋转并展开裁切区域，正文随后进入。关闭或快速重复切换直接反转当前 CSS 过渡，不等待动画结束后才处理业务，也不靠 `transitionend` 释放资源。

拖动期间入口跟随指针，边缘出现磁吸提示；松手后吸附或变为侧边胶囊，再点击恢复。方向键和“停靠侧边”提供替代路径。“恢复位置”只改本原型的归一化位置。可用区域包含 visual viewport 和 safe-area；窗口或键盘引起尺寸变化时撤销未提交的拖动。

详情为非模态，不抢占原版 DOM。Escape 只处理本组件内的按键；原输入、作者输入与 composition 保持自己的语义。点击或焦点离开时关闭；原生模态打开时隐藏并退出当前交互。减少动态效果时移除过渡，仍执行同一操作。

公开视图增加到三个以上，或短窗口无法容纳扇形时，使用有限高度的可滚动列表。未知视图由提供者在自己的宿主内挂载，撤销时清理；没有把它解析成自己的业务数据。

## 验证与证据

本轮运行 `npm run framework:build`（含 `framework:check`）与 `npm run framework:motion:test`。桌面使用已安装 Edge/Playwright；Android 使用 Paisley Park 6.1.0 的精确 WebView 文档绑定、标准 `web-click` 和原生截图。拖动没有对应标准 Action，使用绑定后的 CDP `Input.dispatchTouchEvent`，只对本原型入口派发。未使用 Gameplay，也没有接触历史 Pending/Unknown、玩家存档或业务状态。

桌面检查覆盖：空间过渡的中间态、快速开关、焦点返回、同源双视图、原侧栏切换结果、拖动/吸附/停靠/恢复、blur 和 resize 中断、局部位置存储、未知视图/来源撤销、模态退让、减少动态效果及卸载。代表视口为 1280×900、390×844、844×390、760×800、390×260；最后一个仅模拟短可用高度，不能称为真实 IME。

最新桌面证据：`tests/artifacts/stone-free-motion/browser-1792173071752/result.json`。构建不改变稳定 `src/`、Host/SDK、API v1 或锁文件，复用第七轮这些未变合同的证据，不重复作者包和工作台验收。

Android 目标为 M367FC / Android 17、独立 `com.vrelnir.dol.lyra.uicompat051213`、DoL 0.5.12.13 / UI 2.7.0，实际场景 Start。真实状态来源返回 0/0/0；标准点击使原侧栏按钮各收到一次事件，SugarCube 状态切换并恢复。触摸注入完成左侧停靠和点击恢复，原侧栏不发生连带切换。Host 受控失效关闭当前视图，新绑定可再次打开。卸载后自有 DOM、Host、等待订阅均清空，原侧栏和本原型测试前位置恢复。

最终 Android 证据为 `tests/artifacts/stone-free-motion/android-1792173117023/result.json`，覆盖新增焦点处理后的实际包；原生录像为 `tests/artifacts/stone-free-motion/android-motion-video-1792173600/record.mp4`。此前已通过的 `android-1792172975058/result.json` 保留。录像仅展示实际受控操作，不表示物理触控或性能达标。

## 失败及修正

- 首次浏览器录制因 Playwright 自身的 FFmpeg 未安装而未启动。未下载依赖，改为普通浏览器截图和 Android 已有原生录屏；属于可选录制环境，不是 UI 或 Paisley Park 缺陷。
- 初次几何断言把入口装饰外圈计入滚动宽度，修正为入口检查可见边界、内容区检查横向溢出。减弱动态模式下，原侧栏按钮一度被窄屏详情实际遮挡，领域适配正确禁用；后续在不遮挡原按钮的位置验证实际操作，没有强制点击。
- resize 中断曾暴露真实竞态：尺寸事件的 RAF 尚未运行时 pointerup 可能保存旧坐标。现在事件到达即取消，并在提交前复核 viewport 指纹，防止事件投递晚于抬手。
- 首次 Android 流程 `android-1792172814338` 的展开、视图和原侧栏按钮操作通过，但停靠截图已经显示侧栏意外收起，最终报告 `cleanup-conflict`。拖动接收节点未隔离页面触摸事件；增加仅限入口的 touch/pointer 冒泡边界后，同一 Android 拖动保持侧栏状态。确切原手势监听器归属 Unknown，不推定为第三方缺陷。
- 该失败脚本还人工触发了原页面的全局 Passage 事件，这会运行其它原监听器，不能当作自然导航证据。现改为仅调用实验 Host 的受控失效接口；自然 Passage 覆盖仍未获得，不以模拟事件填补。失败后的侧栏用新观察和一次明确原按钮操作恢复，未通过重试购买或改写原状态处理。

历史失败收据和录像保留，没有覆盖或改成成功。

桌面收据的 `limits` 第三条曾误写为“real Passage separately checked on Android”；Android 实际只执行受控 Host 失效，未做自然 Passage 导航。原收据保留，另附 `coverage-note.md` 勘误；测试输出文字已改正，不为文案修正重复运行同输入检查。

## 制品

`dist/framework/StoneFreeMotionHub-0.1.0-experimental.mod.zip` 为本原型消费者，另需 Host 包。包内只有 `boot.json`、JS、CSS、试用说明、许可证和 Vue 声明，没有游戏、截图、测试收据或 APK。稳定 2.7 主包没有重打。其它研究包仅因公共 README 增加入口而改变文档字节，运行资源没有改动；独立作者源码包 SHA 仍为 `ee04dab23e0bd729492d1b46f719ea7e6f87aa2835b21edec12ce3a791f13cff`。

最终 MotionHub ZIP 为 37,054 字节，SHA-256 `82cb8aa29003e69012d8ac6edbc6db5adbc94474994f4fcb37fdce2fa96620d4`；其 JS SHA-256 `ff43d912fbd386b78847f1effa7f0007223d8999f5626bff9f29cbf699443832` 与最终 Android 收据一致，ZIP 内 JS/CSS 与该构建逐字节一致。

验收清理完成后，另在同一测试版留下可试用的内存预览，入口为右侧星形球；记录见 `tests/artifacts/stone-free-motion/preview-left-running.json`。这一步不执行原操作、不改游戏状态，也未写入 Mod 库。点击“退出原型”移除消费者，重载移除整份临时预览；它与验收脚本已清理的资源分开记录。

## 范围与后续

这是一个完整的本轮原型。Mod ZIP 可在本地构建，真实平板临时加载已接合宿主；没有把临时注入写成真实 ModLoader 安装。独立作者安装更新和 Factory 收益仍是另行研究，不阻塞该原型。

未验证：物理手机触控、真实 IME、自然 Passage 导航、持久安装/更新、其它整合包及性能帧率。桌面鼠标、合成触摸和受控 Host 失效分别保留其边界。

已知限制：只读取三个原状态字段、只执行原侧栏 UI 操作；原按钮被遮挡或结构改变会拒绝。布局不负责仲裁未参与的第三方浮层位置。退出释放自己的参与者和适配，不停止别人创建的 Host 或来源。没有新增衣柜动作、全局动作底栏或 Widget 编辑器，也未推送、合并、正式发布。
