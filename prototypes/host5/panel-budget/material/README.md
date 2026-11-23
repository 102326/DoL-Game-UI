# #41 · 面板局部 Acrylic 材质

建议保留一个可选的 Host 材质预设，在家庭设备验证后再决定接入范围。这里选了随面板一起挂载的烟灰色薄层：设置弹窗和独立检查器都能使用；模态焦点、全屏暗幕和关闭手势则分别留给原有窗口。原有 `framework/official-ui/motion.ts` 的 `scrim()` 使用 body 上的场景暗幕，设置还使用原生 dialog 的 `::backdrop`。两者涉及不同的层叠及输入边界，本轮保留各自行为。

## 最小接口与所有权

研究启动器将一个预设传给 `createHost`。消费方发现 `host.layerPresets?.acrylicScrim` 后，把它作为 `participant.mount({id, parent, lifetime, setup})` 的 setup。Host 创建、跟踪和释放实际节点。两方复用同一个绘制函数，仍使用各自的挂载句柄。没有新增图层注册表、全局样式、观察器或逐帧回调。常规 Host 启动器继续省略这项能力。

消费者提供自己的定位容器和层叠上下文。预设只样式化 Host 创建的装饰节点，使用绝对定位、负层级、圆角继承、4 px 局部模糊与烟灰底色，排除命中和辅助技术焦点。父级可覆盖 `--sf-scrim-blur` 和 `--sf-scrim-tint`。模糊和着色分别声明；支持情况仍需在目标 WebView 验证。节点跟随面板挂载，关闭时由隐藏的父面板一并隐藏，卸载面板时回收。此方案没有共享 GPU 缓存的承诺。

设置使用真实控制器及 dialog，中性关闭按钮替代业务表单。独立检查器通过 shadow DOM 验证相同配方的作用范围。settings 的 UI 所有者负责主动销毁和重建，独立检查器的嵌套挂载使用同一参与者。局部配方不可用或初始化失败时，仍能使用原控件与底色。

## 可复验证据

Mac、Node 26.13.0、Chromium 153.0.8010.12。320 与 390 CSS px 分别比较启用材质、旧 Host 缺少预设、UI 无 Host，以及两方初始化受控失败。检查内容包括：

- 设置和独立检查器各对自制条纹截图采样。48 个像素的红通道极差，旧 Host 为 48，启用局部模糊后为 0。设置单独把模糊半径设为零后条纹恢复，独立检查器仍为 4 px。极差仅反映指定条纹区的渲染效果。
- 四种条件的设置窗口尺寸一致，320 px 视口中宽 282 px，390 px 中宽 352 px；关闭按钮均高 44 px。点击、Enter、焦点归还和横向溢出检查均通过。
- 在设置打开时卸载独立检查器，设置保留同一个材质节点，几何与像素不变。反向卸载设置时独立检查器保留节点和交互。每个尺寸各完成 24 轮双方卸载和重挂：两方在场为 2 个参与者、3 个挂载，全部卸载后均为零。外部移除 dialog 后能重新绑定；Host 先退出时，设置仍能开关。
- 强制两方的装饰 setup 抛错，Host 如实记录两次错误，保留独立检查器主体并释放失败的装饰节点。上述计数只覆盖参与者和挂载，未测长期 GPU 内存。

[截图采样与几何数据](mac-result.json)。仓库根目录复跑：

```sh
node_modules/.bin/vue-tsc -p prototypes/host5/panel-budget/material/tsconfig.json
node prototypes/host5/panel-budget/material/check.mts
node prototypes/host5/panel-budget/preview.mts
```

在预览命令打印的地址后加 `material/`，或加 `material/?fallback` 对照原底色。家庭 Windows 优先看实际设置表单的对比度、原生暗幕与本层是否叠得过暗；Android WebView 优先对照模糊启闭时的滚动帧时、旋转重建、触摸命中与模糊缺失时的可读性。60% 起步仍单独等待主观验收。本次未改变播放预算或发行版本。
