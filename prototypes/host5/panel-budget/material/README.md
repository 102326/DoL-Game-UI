# #41 · 面板局部 Acrylic 材质

`layerPresets.surface` 是可选材质接口。启动器通过 `createHost(window, {surface})` 注入 `framework/materials/acrylic-scrim.ts` 导出的 `surface`。它提供 `resolve(mode, CSS)` 和 `setup(mode)`；模式为 `acrylic` 或 `static`。当不支持 backdrop-filter 或明确要求静态时，resolve 返回 `static`，独立面板的 setup 使用不透明底色并移除模糊。旧 Host 没有 `surface` 时，消费者保留自己的底色和既有行为。

设置控制器使用相同的 resolve 选择原有 CSS 的玻璃或静态分支。4.x 的设置 shell 自己已有透明底色和 24px 模糊，因此这里不添加第二个模糊层；材质接口缺失或 resolve 抛错时恢复原能力判断。关闭玻璃偏好时已有设置 CSS 提供不透明底色。

独立检查器使用同一 preset 的 setup，通过自己的 participant 挂载装饰节点并在退出时释放。节点不接收输入，排除辅助技术焦点；它的父级提供定位容器和层叠上下文。可用 `--sf-scrim-blur`、`--sf-scrim-tint` 和 `--sf-scrim-static` 定制局部效果；初始化失败时保留检查器自身的底色。没有新增全局样式、观察器或逐帧回调。

## 检查

```sh
node_modules/.bin/vue-tsc -p prototypes/host5/panel-budget/material/tsconfig.json
node prototypes/host5/panel-budget/material/check.mts
# 没有 Playwright 自带 Chromium 时可显式使用已安装浏览器
node prototypes/host5/panel-budget/material/check.mts --channel=chrome
```

中性夹具加载真实设置控制器和相关 CSS，用替代按钮代替表单。检查 320/390 宽度、焦点和关闭、旧 Host、接口失败、明确静态、CSS 不支持、独立面板清理与反复重挂。Windows Chrome 157.0.8103.79 本轮通过；正常设置分支的底色与 24px 模糊同旧 Host 一致，静态分支为不透明底色。它不是完整表单的视觉验收，也不是 Android WebView 或性能验证。

先前 Mac 截图采样和几何数据保留在 [mac-result.json](mac-result.json)，对应旧版额外 scrim 实验，不能作为当前实现的视觉或性能结论。
