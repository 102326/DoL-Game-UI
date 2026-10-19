# Moody Blues CJ-3D 实施与验证

更新：2026-10-19；研发分支 `ci/moody-blues-p0`。实现提交
`6f3c982b2e89c5b39e53eb7239ba673073b83abb`，基线为 Soft & Wet 3.0.1
`9c162939dca50b11549b8a88aefa0069e4ea1896`。本轮没有生产 UI 修改。

## 设备配置及来源

[统一配置库](../tests/device-profiles.cjs) 和 [来源目录](DEVICE_PROFILES.md)
区分锁定 Playwright 1.63.0 的完整横/竖屏描述符、厂商面板元数据和合成压力输入。
48 个标准、62 个深度模拟配置覆盖手机 6.1–6.9 英寸等级、约七英寸边界、
2K/2.5K/3K/3.2K 及大型平板、1080p/1440p/4K/超宽桌面与非最大化窗口。
英寸和面板像素不用于推算 CSS viewport。

所有配置均为 `measured:false`。负责人提供的 Redmi K90ProMax、Xiaomi pad9 pro max
两台自有设备和 iPad Air、iPadPro、iPad mini、iPhone18pro、iphone18promax 五个
未持有目标单独登记，七项实际 viewport/DPR 均未知。平板准确型号及 iPad 代际/尺寸
待确认；相邻模拟配置只作代理。使用 [离线采集页](../tools/device-probe.html) 与
[采集说明](DEVICE_MEASUREMENT.md) 获取同一实际宿主的观察值后再形成固定回归。

## 扫描和断言

标准以 64px、深度以 16px 网格扫描 320–2560 CSS px，加入实际 CSS/media/container
断点及 ±1px，得到 70/173 个不同宽度；每个宽度均测 390、900 两种高度。
容器断点同时核对实际容器宽度，不直接视为同宽的 viewport。
标准共 124 条、深度共 241 条：48/62 配置 + 2 同页旋转 + 70/173 宽度 + 4 反例。
一个宽度记录包含两种高度及多个场景，不等于仅一次页面断言。

夹具加载构建后的正式 CSS、实际官方 Hub（`framework/motion-hub`）、设置模态框和
存档组件；旧 `src/floating` 只初始化偏好，不把旧悬浮球当成当前 Hub。
检查左右停靠与上下边界、长文本详情、密集设置、40 条受控存档行、抽屉/内联与动态
容器切换、关闭和确认命中点、触控配置 tap 及原生按钮保持。无真实存读档调用。
同页旋转在切换场景前验证 Hub 节点身份与几何；动画生命周期仍由原有测试承担。

确定性断言覆盖根页面意外横向溢出、有限坐标/SVG viewBox、关键控件边界/遮挡、
请求和实际 viewport/DPR、安全区与关键容器缩放。明确允许的内部滚动区列于每轮
`layout-report.json`，不将正常列表滚动等同页面溢出。
四个健康对照后的受控错误必须分别触发 `DEVICE_ROOT_OVERFLOW`、`DEVICE_BOUNDS`、
`DEVICE_NONFINITE`、`DEVICE_HIT`；编译、浏览器启动等基础设施错误不算反例成功。

## 证据与复现

新增检查复用 CJ-3A 的源码/运行身份、日志及白名单上传。整轮必须具备与源码、运行、
深度匹配的布局报告，且每个预期 ID 恰好出现一次并 PASS；退出 0 但漏报不能通过。
失败保存配置 ID、实际 CSS viewport/DPR、场景、几何、断言、环境和 Commit SHA，
并限量截图。正常通过也保留一个标记 `expectedCounterexample:true` 的越界反例示例，
用于说明证据结构；它不是新的产品缺陷。真实首个失败优先于此示例。

例如标准本机示例：`negative:offscreen`，390×844 / DPR 1，Hub 球
`x=390,y=0,width=56,height=56`，命中为 false，断言为 `DEVICE_BOUNDS`。
Artifact 中的 `fixtures/device-layouts.cjs/snapshot.json` 与 `viewport.jpg` 配套读取。
布局报告限 256 KiB、快照 64 KiB、单图 512 KiB、选中文件总计 16 MiB；
截图按 CSS 像素裁剪到最多 2048×1536，证据保留七天，遗漏在索引明示。
不上传游戏 HTML、玩家存档或未知第三方文件。

## 实际验证及维护成本

macOS arm64：Node 24.18.0、npm 11.16.0、Python 3.12.14、锁定 Playwright 1.63.0。
设置本机 Python PATH 后，以同一新的 `MOODY_EVIDENCE_ID` 逐项执行
`node scripts/test-ci.cjs stage <id>`：dependencies、check、unit、build、packages、
browser-install、browser 均 PASS；14 单元/源码入口、21 浏览器入口。
标准布局 124/124，167.452 秒；浏览器阶段 232.887 秒，七命令累计约 254.53 秒。
本机整轮 summary 为 PARTIAL：没有 GitHub setup action 的真实 outcome，不伪造云端证据。
58 项白名单证据共 219,339 字节、遗漏 0，逐项哈希已检查。
内容摘要 `e3172af922e1ad85994c1a271d4606395c6fe46de421db6b2f95fd9aa925d5c7`
与实现提交相同；后续交接/报告为文档更新。

[深度 Actions](https://github.com/102326/DoL-Game-UI/actions/runs/39226899118)
对 `6f3c982` 成功：validate 8m7s，Linux x64 / Node 22.23.3 / npm 10.9.9 /
Python 3.12.15 / Playwright 1.63.0，14 单元/源码与 21 浏览器入口，深度 241/241。
布局 353.450 秒、浏览器阶段 426.650 秒；布局报告 224,823 字节。
已下载核对 58 项证据及全部索引哈希，345,708 字节、遗漏 0，身份/深度/完整计划匹配。
检查 Artifact ZIP 为 69,421 字节，API 摘要
`f50083a5ece8bbea0a300bec2e29a17a4f8bc57cc86f2a2f5adab6c5b2966b84`，
保留至 2026-10-26T09:09:03Z。完整云端 summary 为 PASS，上传也成功。
后续本快照为文档更新；默认标准模式另按最终 HEAD 在 Actions 列表核对。
Runner 提示 ubuntu-latest 将迁移 Ubuntu 26，未来环境变化须按新运行实际报告解释，
本轮不更改原运行镜像策略。

默认 PR/main push 使用标准模式；研发分支不匹配原 push 条件，已使用
`gh workflow run build.yml --ref ci/moody-blues-p0 -f device_depth=deep` 实际触发。
不对每个配置重跑全部业务测试。不新增依赖、定时服务或独立 Judge。
标准/深度布局子检查上限 6/10 分钟，浏览器阶段 12 分钟，原 job 上限仍为 15 分钟。
升级 Playwright 时须审阅描述符哈希快照；CSS 断点变化会自动改变扫描计划，应核对报告
规模和耗时。深度模式按需手动运行，尚未添加定时任务。

## 验证边界与后续

Chromium 的 iPhone 输入不证明 Safari/iOS；模拟安全区不证明真实挖孔；125/150/200%
缩放配置是布局等效 viewport，未执行浏览器菜单缩放，也未验证系统显示缩放。
Android WebView、软键盘、系统下拉框、物理触控、实际 DoL/ModLoader、多 Mod、Windows
和这七台目标真机均未验证。夹具提供 `#overlayButtons` 原生入口；宿主缺少该入口时的
后备入口模式未覆盖。矩阵全绿不能宣称全部手机/平板实机兼容。

接续优先采集两台自有设备、固定同宿主回归；随后 CJ-3C 制品合同。
CJ-4 仅准备远端规则建议，修改规则/bypass 或合并 main 仍须负责人另行明确批准。
当前不修改 main、Release、Tag 或正式 ZIP，不启用 CD。
