# Motion Evolution / #22

当前研发分支 `dev/evolution-4.0`，[Issue #22](https://github.com/102326/DoL-Game-UI/issues/22)。本目录保留已认可金属球和真实 MotionHub 的研究入口。

最新批次为 [悬浮球 V2 展开提速](../../docs/evolution/EVO-HUB-V2-INPUT.md#2026-10-23-已确认的展开速度)：点击即展开、240ms落位，球体以0.65倍时长并行播放，负责人已确认当前速度。保留中途输入、Mac生命周期修复、真实工具和终态布局；本轮Windows Hub/输入/生命周期17组及类型和构建通过。不合并main或发布。[当前4.0接续](../../docs/HANDOFF.md)是范围与后续任务依据，旧3.1草案保持历史身份。

[历史桌面演示](../../docs/media/evolution-hub-v2/hub-input-v2-desktop.mp4) · [历史窄屏演示](../../docs/media/evolution-hub-v2/hub-input-v2-narrow.mp4)：对应21509a8，未包含最新展开速度和生命周期补强；当前效果以操作页为准。

Mac 后续已同步 Windows 实现并补强释放落在球体、隐藏后场景替换和零尺寸恢复，见 [EVO-HUB-V2-MAC](../../docs/evolution/EVO-HUB-V2-MAC-LIFECYCLE.md)。新增三项回归进入现有命令；上述 Windows 媒体保持旧提交身份，未重录、未据此宣布完整 Hub 视觉通过。

## 三个可操作入口

```sh
npm ci
npm run prototype:golden-spin
```

- `http://127.0.0.1:5181/`：已获认可的独立球体，保留金属刻纹、纹带、残影、蓄势与释放。
- `http://127.0.0.1:5181/hub.html`：复用真实 MotionHub 的完整悬浮球，菜单内容模拟；当前展开速度已认可，实际游戏接入未验收。端口冲突时可运行 `npm run prototype:golden-spin -- --port 5182` 后打开5182的同一路径。
- `http://127.0.0.1:5181/windows.html`：b507窗口基础修整参考。真实设置控制器/组件、原生面板展示逻辑，原生业务内容模拟；可查看分类方向、材质展开、动画开关、缩放与卸载重挂载。新窗口视觉重做尚未通过负责人验收，不作为下一方案。

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

最后一项依次执行球体、完整 Hub、窗口工作区和V2中途输入四个检查。Mac 使用 Chromium，Windows 既有脚本使用 Edge；均为受控网页，不是 Android/iOS 实机证明。静态输出在 Git 忽略的 `tests/artifacts/golden-spin-b/dist/`，含 LICENSE 和第三方声明。可用 `python -m http.server 5181 --directory tests/artifacts/golden-spin-b/dist` 预览。

录屏在预览服务运行时执行 `node scripts/record-golden-sphere.cjs`、`node scripts/record-golden-hub.cjs --v2` 或 `node scripts/record-motion-workspace.cjs`，需要 FFmpeg。录像均为自制页面，没有游戏画面或设备日志。

## 当前实现边界

- 共享取消、偏好、隐藏页与卸载控制；不强迫其它页面使用球体回旋动作。
- 本批修改真实 UI 展示源码，仍在研究分支；未合并 main、升级正式 UI 版本或替换公开制品。
- 原型 GSAP 仍为 devDependency，球体用 GSAP/Canvas；窗口沿用 WAAPI，没有新增生产依赖。
- 上项是既有实现，不是后续技术上限。真实控件能否移动、材质如何组织、是否引入新工具，由获批方案与正确性共同决定。
- 旧 `menu-study.html` / App.vue / controller.ts 等是已否决菜单方向的技术归档，不作为当前入口或视觉基准。
- 商店/衣柜、战斗、天气等尚待后续分批改造。

[跨设备交接](../../docs/HANDOFF.md) · [本批计划](../../docs/superpowers/plans/2026-10-21-motion-evolution-batch1.md) · [阶段记录](../../docs/MOTION_EVOLUTION_GOLDEN_SPIN_B.md)
