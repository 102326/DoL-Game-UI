# Soft & Wet — 跨设备交接

更新：2026-10-19。当前快照；接手必须重新核对本机事实。

## Current — 当前做什么

- 目标：Moody Blues 的 CJ-3A/B、CI-HANDOFF-01 与 CJ-3D 模拟覆盖已交付；
  当前修补 `ci/moody-blues-*` push 自动触发；接续 CJ-3C 可与两台自有设备采集并行。
- 分支：`ci/moody-blues-p0`；3.0.1 起点、`origin/main`、`v3.0.1^{commit}` 均为
  `9c162939dca50b11549b8a88aefa0069e4ea1896`。
  P0 提交 `1e8010808a7d1c71f0cfe1d3049227df1258ea8b`；CJ-3D 实现提交
  `6f3c982b2e89c5b39e53eb7239ba673073b83abb`。本快照随文档更新提交推送；
  文档提交 `79b1d7fdff9809a296585b0fc3ba37972429ae59` 已通过标准
  [Actions](https://github.com/102326/DoL-Game-UI/actions/runs/39228132750)（5m19s、124/124）。
  后续触发修补仅新增分支过滤；实际 HEAD 以 `git rev-parse HEAD` 为准。
  交付时应无未提交/未推送工作，接手须重新检查。
- 旧研究分支、原型工作区及忽略的构建/日志均已保留，没有带入本轮分支。
- 真机数据待补：Redmi K90ProMax、Xiaomi pad9 pro max 两台自有设备，以及五个
  Apple 目标共七项均 pending，viewport/DPR 为 null。平板准确型号与 iPad 代际待确认。
  [离线采集说明](DEVICE_MEASUREMENT.md) 已通过受控横竖屏、隐私与导出验证；
  浏览器观测值及用户勾选的真机确认不等于独立硬件认证。此缺口不阻塞模拟覆盖交付。

## Decided — 已经确定什么

- 只改 CI 脚本、受控测试和文档，保留全部原有有效检查与打包合同。
  未修改生产 UI、main、Release、Tag、正式 ZIP、ruleset/bypass；没有 CD 或 AI 服务。
- [P0 证据合同](MOODY_BLUES_P0.md)：必需项未执行、缺失、超时、取消或身份不符
  不得 PASS。记录源码内容摘要、HEAD、lockfile、平台/版本、Run/Attempt，有限日志及白名单证据。
- 原始 3.0.1 本机 macOS arm64：依赖、类型/合同、12 单元入口、构建及 ZIP 合同通过；
  原浏览器检查 7 项通过，header-weather 失败、后 10 项未运行。已确认媒体匹配/JS change
  投递时序竞态，只修测试等待事件，保留动画停止断言，不计第三个产品缺陷。
- [P0 Actions](https://github.com/102326/DoL-Game-UI/actions/runs/39222671934)：
  `1e801080`，validate 2m19s 成功，Linux x64 / Node 22.23.3 / Python 3.12.15 /
  Playwright 1.63.0，13 单元及 19 浏览器入口。下载核对 52 项证据的哈希，遗漏 0。
  [#78](https://github.com/102326/DoL-Game-UI/actions/runs/39161341795) 的合法延迟、
  取消/连续切换、残留反例及 [#79](https://github.com/102326/DoL-Game-UI/actions/runs/39161721706)
  的旧定位计算/缺失共享 CSS 反例均有对应证据。第三案尚无完整对应。
- [设备配置/来源](DEVICE_PROFILES.md)：标准/深度 48/62 个模拟配置，70/173 个
  扫描宽度（320–2560、断点 ±1、每宽 390/900 两高度），另有同页旋转及四个精确反例。
  使用当前官方 Hub 与生产 CSS，左右停靠、上下边界、设置、动态存档抽屉、长文本/密集行。
  [CJ-3D 结果](MOODY_BLUES_CJ3D.md) 记录断言、预期失败截图样例及维护约定。
- CJ-3D 本机七命令均 PASS：macOS arm64、Node 24.18.0、npm 11.16.0、Python 3.12.14、
  Playwright 1.63.0；14 单元/源码、21 浏览器入口，标准 124/124；布局 167.452 秒。
  内容摘要 `e3172af922e1ad85994c1a271d4606395c6fe46de421db6b2f95fd9aa925d5c7`
  与 `6f3c982` 一致。本机整轮 summary 正确为 PARTIAL（无 GitHub setup outcome），
  七个实际命令均 PASS，58 项证据 219,339 字节、哈希已核对、遗漏 0。
- [深度 Actions](https://github.com/102326/DoL-Game-UI/actions/runs/39226899118)：
  `6f3c982` 成功，validate 8m7s；同 P0 云端版本，14 单元/21 浏览器入口，241/241。
  布局 353.450 秒；下载核对 58 项证据及哈希，345,708 字节、遗漏 0，保留至 2026-10-26。
  完整报告/源码身份和深度均匹配，云端整轮 summary 与上传成功。
  原三次运行均为手动；本次需按新修补提交核对 event=push 的真实运行，不将未触发视作通过。
- Artifact 保留 7 天，过期按提交重跑。本机独有日志/构建/报告绝对路径仅记在忽略的
  `HANDOFF.local.md`，另一设备不能假定可访问。原型两条提交已确认可达远端研究分支。
- macOS 不代表 Windows，Actions/Chromium 不代表 Android/WebView、Safari/iOS 或真实
  游戏/ModLoader。系统缩放、浏览器菜单缩放、键盘/系统下拉框及物理触控均未验证。

## Next — 下一步做什么

1. 立即可接续 CJ-3C 制品合同，同时收集两台自有设备同宿主横竖屏数据校准回归。
   两者互不阻塞；不继续扩展模拟矩阵，也不要求收齐未持有的 Apple 真机。
   不能用代理模拟器结果补填七个目标。宿主无法打开测量页时保留缺口。
2. 新设备先 `git status --short`、`git branch --show-current`、`git rev-parse HEAD`、
   `git remote -v`、`git fetch origin --prune`；核对本机独有提交/文件，保留后再同步。
   检查 Node >=22.12、Python >=3.10 及 `python` 命令、lockfile 和实际浏览器环境。
3. 最低验证：`npm ci`、`npm run ci:check`、`ci:unit`、`ci:build`、`ci:packages`，
   安装 lockfile 浏览器后 `ci:browser`。记录实际命令/平台/提交，不复用他机 PASS 当本机结果。
   `ci/moody-blues-*` push 在本次修补后自动 standard；也可手动 `build.yml`，`device_depth=deep`
   为深度，检查实际 Run/Artifact 和完整报告；未触发不是通过。
4. 后续 CJ-3C 版本/可选包/确定性合同；CJ-4 只准备必需检查、缺失阻断、bypass 建议。
   修改远端规则或合并 main 需负责人明确批准；当前没有待确认的已授权实施决策。

更新约定：交接前更新 Current / Decided / Next，标明未提交/未推送和证据对应提交；
文档提交注明沿用的代码验证。存档可由玩家主动提供并授权，用于针对性隔离复现；
自动证据采集仍限受控白名单，不自动读取/上传玩家存档或纳入公开 CI Artifact。
授权存档置于源码树外的隔离目录，避免 JSON 等非忽略文件被源码摘要自动读取。
禁止凭据、敏感设备标识和大段敏感日志；机器绝对路径仅放本机补充。
