# Kraft Work 3.0 安装、兼容包与回退

Soft & Wet 3.0 — Kraft Work 正式发行安装说明。技术包名继续使用 DoLGameUI 与 StoneFreeHost。

## 必装两包

DoL 当前适配 0.5.12.13；需要 ModLoader >=2.100.0、TweeReplacer >=1.0.0。Loader 实测 2.101.1。安装 Host 和 UI 时保持：

```text
基础游戏与原有基础依赖
StoneFreeHost >=0.1.2-experimental && <0.2.0（推荐 0.1.4-experimental）
DoLGameUI 3.0.0
```

备份存档和旧 UI 后，停用旧 DoLGameUI，安装两个 `.mod.zip`，不解压，再重启。每个技术身份只启用一个版本。推荐版本不是精确锁定要求；实际测试组合也不是对所有后续版本的兼容承诺。Host 0.2 系列与未验证预发布不在当前协议范围。

## 可选兼容包

目标 Mod 与 UI 均应排在外观包之前。新外观包不包含目标 Mod，未安装目标 Mod 时不要安装对应包。

| 兼容包 | 当前版本 | 目标最低声明 | 本次实际目标／边界 |
| --- | --- | --- | --- |
| ModHubSoftWet | 0.2.5 | ModHub >=1.3.0；UI >=3.0.0 | ModHub 1.7.0 |
| MapleBirchSoftWet | 0.2.5 | maplebirch >=5.2.3；UI >=3.0.0 | MapleBirch 5.4.3；云存档只检查页面外观，不连接云端 |
| DolOptimizationSoftWet | 0.1.7 | 原版优化 >=1.1.1.2；UI >=3.0.0 | 原版优化 1.1.1.5；不改槽位与描述编辑逻辑 |
| CheatExtendedSoftWet | 0.1.0 | cheat extended >=1.20.3；UI >=3.0.0 | 原作者 1.20.3.1；另验独立维护 1.20.3.1-rebuild.30 |
| ReOverfitsSoftWet | 0.2.2，原包 | ReOverfits >=4.1.1 | 本轮未新增重做／目标运行验收，保留原包说明 |
| LyraMouthCompat051213 | 0.1.2，原包 | 指定 Lyra 0.5.12.13；maplebirch >=5.2.3 且 <6.0.0 | 对应游戏资源适配；现场使用原包，未改源码 |

前四项当前游戏声明为 0.5.12.13。最低声明允许满足合同的其它版本进入检查，完整页面结构识别后才应用外观；未知结构退让，不能仅凭版本满足就宣称兼容。ReOverfits 和嘴部包按各自原说明判断，不把保留附件写成新版本验收。

CE 原作者版与 rebuild.30 的技术名都为 `cheat extended`，必须二选一。Loader 的四段预发布比较会把 rebuild.30 判为低于 1.20.3.1，因此安装声明采用 >=1.20.3；运行时仍以原作者 1.20.3.1 接口与结构为基线，单列已知 rebuild.30。不要将这个安装门槛理解成对全部旧版或未来版的承诺。Modernization／CE-R1、DoLCheatReboot 未验收。

`legacy-0.5.11.9/` 内的 LyraWardrobeMouthSoftWet 0.1.5 仅留给指定旧 Lyra，不与 0.5.12.13 主安装混用。其游戏／资源精确门槛有实际原因，不随通用前置放宽。

## 从 2.7 升级

保留 2.7 UI 和对应旧兼容包，停用后安装当前两包及需要的新兼容包，再重启。主题、字号、密度、侧栏、页面与存档显示偏好沿用既有机制；代表性升级／回退已验证，不承诺所有历史组合均穷举。无需新建存档或迁移存档格式。

Floating Hub 默认关闭，在“界面设置 → 入口 → 高级快捷工具”开启；战斗聚焦编辑也默认关闭，需主动选择。设置有上下／左右两种布局，总开关关闭会恢复原版显示。

## 回退

停用 3.0 UI 与只适用 3.0 的新版外观包，恢复原 2.7 UI 和旧兼容包，再重启。只有没有其它消费者时才停用 Host。保留原存档和偏好，不要清空游戏数据，不依赖整包热卸载。

## 核对下载

从 [v3.0.0 Release](https://github.com/102326/DoL-Game-UI/releases/tag/v3.0.0) 下载。使用同页 SHA256SUMS.txt 核对文件；它覆盖全部附件负载，清单自身除外。源码 Tag 为 v3.0.0，精确提交、包来源及成员摘要见 SOURCE_IDENTITY.json。
