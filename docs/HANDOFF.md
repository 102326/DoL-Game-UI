# Soft & Wet 3.1 研究交接

2026-10-21。当前分支 `prototype/golden-spin-b`，[Issue #22](https://github.com/102326/DoL-Game-UI/issues/22)。接续先核对本机 HEAD、工作区和实际环境，不复用旧设备身份。

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
