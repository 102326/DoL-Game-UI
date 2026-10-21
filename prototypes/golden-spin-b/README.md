# Motion Evolution / #22

当前分支 `prototype/golden-spin-b`。负责人于 2026-10-21 确认球体效果，授权继续全局 UI 动效升级，并在每批主要任务后向 [Issue #22](https://github.com/102326/DoL-Game-UI/issues/22)简短更新。

## 三个可操作入口

```sh
npm ci
npm run prototype:golden-spin
```

- `http://127.0.0.1:5181/`：已获认可的独立球体，保留金属刻纹、纹带、残影、蓄势与释放。
- `http://127.0.0.1:5181/hub.html`：复用真实 MotionHub 的完整悬浮球，菜单内容模拟；技术检查通过，完整视觉及实际游戏接入未验收。
- `http://127.0.0.1:5181/windows.html`：第一批窗口与设置工作区。真实设置控制器/组件、原生面板展示逻辑，原生业务内容模拟；可查看分类方向、材质展开、动画开关、缩放与卸载重挂载。新窗口视觉待负责人判断。

[本批桌面录屏](../../docs/media/golden-spin-b/windows-desktop.mp4) · [窄屏录屏](../../docs/media/golden-spin-b/windows-narrow.mp4)。均为原速自制演示。

这些是独立网页，不是 ModLoader 安装包。没有游戏业务/玩家存档。球体获认可不等于整个 Hub、窗口或全局改造已验收；总任务不因这一批完成而关闭。

## 检查与构建

```sh
npx playwright install chromium
npm run prototype:golden-spin:check
npm run ci:check
npm run prototype:golden-spin:build
npm run prototype:golden-spin:test
```

最后一项依次执行球体、完整 Hub、窗口工作区三个检查。Mac 使用 Chromium，Windows 既有脚本使用 Edge；均为受控网页，不是 Android/iOS 实机证明。静态输出在 Git 忽略的 `tests/artifacts/golden-spin-b/dist/`，含 LICENSE 和第三方声明。可用 `python -m http.server 5181 --directory tests/artifacts/golden-spin-b/dist` 预览。

录屏在预览服务运行时执行 `node scripts/record-golden-sphere.cjs`、`node scripts/record-golden-hub.cjs` 或 `node scripts/record-motion-workspace.cjs`，需要 FFmpeg。录像均为自制页面，没有游戏画面或设备日志。

## 当前实现边界

- 共享取消、偏好、隐藏页与卸载控制；不强迫其它页面使用球体回旋动作。
- 本批修改真实 UI 展示源码，仍在研究分支；未合并 main、升级正式 UI 版本或替换公开制品。
- 原型 GSAP 仍为 devDependency，球体用 GSAP/Canvas；窗口沿用 WAAPI，没有新增生产依赖。
- 旧 `menu-study.html` / App.vue / controller.ts 等是已否决菜单方向的技术归档，不作为当前入口或视觉基准。
- 商店/衣柜、战斗、天气等尚待后续分批改造。

[跨设备交接](../../docs/HANDOFF.md) · [本批计划](../../docs/superpowers/plans/2026-10-21-motion-evolution-batch1.md) · [阶段记录](../../docs/MOTION_EVOLUTION_GOLDEN_SPIN_B.md)
