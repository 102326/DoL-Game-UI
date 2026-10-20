# Golden Spin B · 球体优先

Soft & Wet 3.1 的隔离视觉原型，[Issue #22](https://github.com/102326/DoL-Game-UI/issues/22)。当前只研究球体蓄势、高速回旋、黄金螺旋释放和余韵；工具菜单不展开。**Prototype A 是新阶段名，正式产品目标仍是 Golden Spin B。**

## 观看和操作

在仓库根目录运行：

```sh
npm ci
npm run prototype:golden-spin
```

打开 `http://127.0.0.1:5181/`。点击球体或“启动回旋”，可在途中收束、再次启动，调整时间倍率和能量强度。跟随系统减少动态效果设置。

- [桌面视频](../../docs/media/golden-spin-b/sphere-desktop.mp4)
- [窄屏视频](../../docs/media/golden-spin-b/sphere-narrow.mp4)
- [实现、验证和当前边界](../../docs/MOTION_EVOLUTION_GOLDEN_SPIN_B.md)

这是独立网页，不是 ModLoader 安装包。视频没有执行游戏业务。球体方向待负责人确认，认可后才进入真实 Hub 的菜单联动。

## 构建与检查

```sh
npm run prototype:golden-spin:check
npm run prototype:golden-spin:build
npm run prototype:golden-spin:test
```

静态网页在 Git 忽略的 `tests/artifacts/golden-spin-b/dist/`，包含许可证和第三方声明。可用 `python -m http.server 5181 --directory tests/artifacts/golden-spin-b/dist` 独立运行。

录屏脚本 `node scripts/record-golden-sphere.cjs` 对已运行的本地样片服务器取景，需要 FFmpeg；不连接游戏或设备。原型 CI 只在研究分支或手动触发时检查，不合并或发布。

## 已停止的旧方向

`menu-study.html`、`App.vue`、`controller.ts`、`path.ts`、`motion.css` 和 `live.ts` 是旧菜单研究，**视觉方向被负责人否决，不是当前演示或后续视觉基准**。生命周期、布局测量、取消等成果保留复用；旧测试另存 `tests/golden-spin-menu-study.cjs`，不作为当前球体阶段的验收。

默认构建不再输出旧真实 Hub 注入包。当前阶段不应临时接入旧方向或将旧录像当作新效果。

GSAP 仅是原型开发依赖，尚无生产选型决定。[第三方许可](THIRD_PARTY_NOTICES.md)随构建保留。
