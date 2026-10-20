# Soft & Wet 3.1 研究交接

2026-10-21。当前分支 `prototype/golden-spin-b`，[Issue #22](https://github.com/102326/DoL-Game-UI/issues/22)。接续先核对本机 HEAD、工作区和实际环境，不复用旧设备身份。

## 已同步的源码与演示

本轮运行代码和演示对应提交 [`8e30d7d3e1bc600a1943c53119170142ab454f4d`](https://github.com/102326/DoL-Game-UI/commit/8e30d7d3e1bc600a1943c53119170142ab454f4d)。[该提交的 CI](https://github.com/102326/DoL-Game-UI/actions/runs/39471457908) 已通过，包含类型、Framework 合同、独立构建和原型交互检查。之后的接续文档提交不改变该运行代码。

- [前后对照](media/golden-spin-b/gs03-before-after.mp4)：左旧右新，两侧均为自制原型原速录制。
- [桌面完整演示](media/golden-spin-b/sphere-gs03-desktop.mp4)
- [窄屏完整演示](media/golden-spin-b/sphere-gs03-narrow.mp4)
- [本轮 Issue 更新](https://github.com/102326/DoL-Game-UI/issues/22#issuecomment-6297707984)

源码、锁文件、自制视频和接续文档已纳入仓库。本机原始素材、设备日志、`node_modules`、忽略目录中的构建与验证资料没有上传；在 Mac 上重新安装依赖和生成构建。Windows 正在运行的本地预览服务也不会同步。

## 在 Mac 上接续

需要 Git 和 Node.js >=22.12.0。先确认 Mac 工作区没有需要保留的未提交改动，再切换分支；不要用重置覆盖本机工作。

已有仓库时，在仓库根目录执行：

```sh
git fetch origin
git switch prototype/golden-spin-b
git pull --ff-only origin prototype/golden-spin-b
npm ci
npm run prototype:golden-spin
```

如果本机没有仓库，先克隆研究分支，再执行上面的 `npm` 命令：

```sh
git clone --branch prototype/golden-spin-b --single-branch https://github.com/102326/DoL-Game-UI.git DoL-Game-UI-spin
cd DoL-Game-UI-spin
```

在浏览器打开 `http://127.0.0.1:5181/`，应看到第三轮球体研究页面，可启动、收束、重新蓄势和调整参数。它是独立网页，不需要安装游戏或 Mod。

修改后的最小检查如下。Mac 的浏览器检查使用 Playwright Chromium，首次运行前安装对应浏览器：

```sh
npx playwright install chromium
npm run prototype:golden-spin:check
npm run prototype:golden-spin:build
npm run prototype:golden-spin:test
```

交互预览不需要 FFmpeg。重新录制视频时，先保持预览服务运行，并确保 `ffmpeg` 可从终端调用，再在另一个终端执行 `node scripts/record-golden-sphere.cjs`；脚本会更新当前自制演示文件。

当前已验证 Windows Edge 和 Linux CI Chromium，Mac 尚未实测。接续时先做上述检查，不把跨平台启动说明当作 Mac 已通过的证据。

## 当前代码入口

| 文件 | 职责 |
| --- | --- |
| `prototypes/golden-spin-b/sphere.ts` | 球面绘制、纹带与流线、时序、中断和释放 |
| `prototypes/golden-spin-b/SphereApp.vue` | 当前球体样片与参数控件 |
| `prototypes/golden-spin-b/sphere.css` | 独立样片布局、命中区域和窄屏样式 |
| `tests/golden-spin-b.cjs` | 当前球体阶段的交互与清理检查 |
| `scripts/record-golden-sphere.cjs` | 当前桌面与窄屏录制 |

默认入口 `main.ts` 挂载 `SphereApp.vue`。旧 `App.vue` 和 `menu-study.html` 是已停止精修的菜单研究，不能误当当前入口。

## 当前有效方向

负责人已否决菜单旋转为主体的首轮样片。停止精修工具多圈螺旋，优先做球体自身蓄势、高速回旋、黄金螺旋释放和余韵。

当前默认网页为 **Prototype A：回旋之力本体**，不展开菜单。A / B 是新实验阶段名，不是原产品方案投票；正式目标仍为 Golden Spin B。

第三轮强化球面横向纹带、背面遮挡、切向短残影与更快的启动加速；收小并衰减外围流线。当前桌面、窄屏及前后对照视频均为自制网页样片，仍待负责人视觉确认。后续 Issue 和交付只描述实际效果，不强调灵感来源。

[运行与视频](../prototypes/golden-spin-b/README.md)、[当前技术记录](MOTION_EVOLUTION_GOLDEN_SPIN_B.md)、[旧菜单研究归档](MOTION_EVOLUTION_MENU_STUDY_ARCHIVE.md)。旧媒体及 Android 接入结果不证明新球体已获验收。

## 保留的工程与边界

- 基线 main `6a6e3c00b705dc67d37c1780b27f585847da5d1a`；当前公开稳定 UI 3.0.4 / Host 0.1.5-experimental，未覆盖公开制品。
- 旧研究的测量、反向、取消、生命周期及 opt-in hook 保留。正式入口不传入 `experimentalMotion`，球体新阶段是独立网页。
- GSAP 3.15.0 为原型 devDependency；Canvas 2D 绘制球面与能量。没有确定生产框架或修改 Host 公共合同。
- SW31-MOTION-02 长期允许全 UI 动效演进，但不启动全 UI 重写，不自动扩大 3.1 或延期 3.5。
- 可推送原型分支和运行 CI；不得合并 main、Tag、Release 或自动发布。

## 下一步

先让负责人观看球体样片，判断回旋力量的视觉方向。未确认前不开始 Prototype B 的真实 Hub 联动，不把技术检查通过写成 Visual Gate Passed。

当前球体检查涵盖受控浏览器的阶段、中断、重播、窄屏、减少动态效果和卸载；真实游戏整合与新球体 Android 性能尚未验证。设备身份、原始日志及临时接入资料只保留本地忽略目录。
