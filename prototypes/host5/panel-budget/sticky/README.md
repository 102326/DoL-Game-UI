# #41 · Sticky Fingers 的真实只读 Inspector

**结论。** 固定 Loader mainline 可以经显式工厂向 Host 申请一个实例所有的浮窗。外部接入方交出原面板节点；桥只持有窗口壳和本方 participant/mount。Inspector 继续持有原生订阅、报告、导出与生命周期。实验先验证了这个边界，暂不建议发布新的窗口协议。

## 输入身份

- UI 起点 `86a048f`。在研究工作树运行 `npm run surfaces:build` 得到 `dist/standalone-ui/index.js` 和同目录 `SOURCE.json`。重算记录中的每个源码输入和产物摘要；产物 9510 字节，SHA-256 为 `a3174c0f25c6739f9e8a531ef3ac9c004293a94d1266b916f3e9e39d3eeacb71`。早期文档中的 standalone-surfaces 输出路径已过时。
- 本机 Loader 为 `ab94d07bf2a54d3635ac5731f4a5d00eafe1ad1b`（E35，含 E32 的真实消费者），固定 native-contract 源树 `b20026a569c36208aca1f9f65a25fa2c4df42bf2`，工作区干净。本机及该仓库可见远端分支/标签中未取得独立 E39 输入。此处 Inspector 选择的外部接口是 `openModal(request)`。E39 和 E46 默认装配仍待其自身固定输入核验。
- 原 E32 中性 runner 使用真实独立构建，Chrome 157.0.8103.79 通过原生 dialog、正式外部壳、默认和显式 mainline 四种路径，包括原内容重开、订阅更新、导出与释放。原始运行输出置于临时目录。

## 同一消费者的三种呈现

研究复跑器使用变量 `SF_INSPECTOR_SURFACE_ENTRY` 指定真实独立构建，临时组装一份带具名导出的实验工厂，再交给 Loader 原有 `buildMainline(entry)`。与原 runner 一致，由原 `__sfBoot` 以中性输入运行。Loader 源树、默认入口和正式抽屉都保持原状。

实验浮窗走 `dialog.show()`；Host 挂载在页面已有根下，只回收自己的句柄。原生模态抽屉对照交给真实构建的 `openDrawer`，仍使用 `showModal()`。设置使用真实设置控制器、中性表单和显式 modeless 选项，默认仍为 modal。透明度研究不在此切片内。表单与 Inspector 同时存在时，普通浮窗局部处理来自本窗口的 Tab 和 Escape；模态 dialog 的背景失活由浏览器负责。

在 Chromium 153.0.8010.12 下验证：

| 条件 | 执行结果 |
|---|---|
| 1150、390 CSS px 普通浮窗 | 普通按钮保持可点；半透明窗口与设置共存；Tab/Shift+Tab 在活动窗口的边界回绕，Escape 关闭当前窗口。 |
| 1150 px 无玻璃、无动画 | 背景无模糊、窗口无动画，设置遵循减少动态，执行相同输入、订阅、焦点与释放检查。 |
| 1150 px 正式抽屉 | 实际 drawer 匹配 `:modal`，背景按钮点击不生效，关闭后恢复。 |
| 两个浮窗之上的原生 modal | 背景点击不生效；Escape 只关闭原生 modal，下方两窗保留。 |
| 真实内容和所有权 | 释放 Loader 中性 Consumer 后，Inspector 原报告收到订阅更新；浮窗重开使用同一节点。关闭失焦的设置、释放失焦的 Inspector 均未夺回另一窗口的焦点。Inspector 释放后共享根仍为同一节点、普通按钮原监听仍生效、设置仍开，本方 Host 参与者与挂载回收。 |

## 复跑与家庭接续

在 UI 研究工作树运行。以下环境变量分别指向对应提交的 Loader 根、与原 E32 runner 相容的 Paisley Park 工具根、Chrome 可执行文件。所有实验输出放到新临时目录；运行器本身不初始化游戏或修改 Loader。

```sh
npm run surfaces:build
export SF_INSPECTOR_SURFACE_ENTRY="$PWD/dist/standalone-ui/index.js"
out=$(mktemp -d)
(cd "$SF_LOADER_ROOT" && node experiments/native-contract/inspector-surface-browser-check.ts "$PAISLEY_ROOT" "$CHROME_BIN" "$SF_INSPECTOR_SURFACE_ENTRY" "$out/e32")
node_modules/.bin/vue-tsc -p prototypes/host5/panel-budget/sticky/tsconfig.json
node prototypes/host5/panel-budget/sticky/check.mts
```

家庭 Windows 先给出 E39（及当前 E46 默认线）准确 commit 或源树摘要，复核其 Inspector 外部工厂签名、原生 modal/fallback 和启动准备路径，再以同操作验证。Android WebView 重点验证触摸选窗、系统返回键和软键盘改变视口后的焦点归属。390 px 的本次输入为桌面 Chromium 的鼠标/键盘，不能替代系统返回或触屏实测。
