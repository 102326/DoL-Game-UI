# 开发工具评估与跨设备同步

2026-10-28，DEVTOOLS-EVAL-01 / ENV-REACH-16。负责人批准更新Agent Reach并继续4.1；其它工具保持本轮评估结论，不按“同意继续”自动全部安装。不是第二套产品路线图。

## 工具选择

| 项目 | 结论 / 当前实际状态 |
|---|---|
| Superpowers | 本机已有14个同名衍生Skill，与上游7.0.1均有差异；保留定制流程，择优更新，不覆盖、不并装官方整套。保留按风险验证、当前代理授权/档位和负责人产品判断。 |
| Anthropic Skills | frontend-design仅按需设计候选；四组同任务试验未证明整体审美胜出。黑灰Acrylic及已认可视觉优先。不整仓导入测试/文档/MCP开发技能。 |
| Chrome DevTools MCP | 最值得项目级按需接入的候选；1.12.0已通过隔离stdio试跑、交互/日志/网络/截图与trace自动insights。未注册进Codex，深度insight接口、heap/Lighthouse等未验证。 |
| Playwright MCP | 0.0.83隔离交互试跑通过，但与CUA和锁定测试重叠，内部另带1.64 alpha；暂缓正式引入，不替换项目Playwright1.63.0。macOS长socket路径须用进程级短临时目录解决。 |
| Paisley Park | 保持现场目标身份、Android/ADB/CDP、Evidence/Action/Journey与恢复职责。新浏览器工具补专项诊断，不替代真机/游戏业务结果。 |

两个MCP在同一中性夹具与Chrome155上实际试跑；它们不能替代项目锁定Chromium153的可复现对照。DevTools首个trace出现ForcedReflow，后次更短交互仅列INPBreakdown；自动insight是否出现不能当作错误是否存在的唯一断言。桌面模拟不代表Android/WebView或GPU通过。

未全局安装这两套MCP、未覆盖Superpowers、未新增Anthropic Skill。若后续正式接入，固定版本、独立浏览器资料、按需工具白名单，关闭工具统计/CrUX URL发送，原始trace/截图不自动上传公开CI。独立profile不是权限沙箱。

## Agent Reach 1.5 → 1.6

官方v1.6.0制品SHA256：`59c37586e45e5e111a78686e98a9d11ae71a7b4b1a334c41aef82831ea5b0a05`。官方uv安装流程；本机新增uv0.13.6并使用已有Python3.12，没有改shell启动文件或Codex配置。

- 新入口：用户工具目录中的agent-reach；先运行`agent-reach version`，应为JSON并含version1.6.0/install_method uv。PATH缺少该目录时仅在调用进程设置或使用实际可执行路径，不假设每台机器相同。
- Skill权威入口：`~/.agents/skills/agent-reach/SKILL.md`，含version1.6.0。旧`~/.codex/skills/agent-reach`自定义副本移出发现目录并备份；旧自定义venv只卸载Agent Reach包，未删其它工具。官方清理器漏认本机自定义路径，不能只看setup成功就认为旧副本清理完毕。
- 保留现有配置；回滚备份仅本机私有目录，不上传。setup默认5个渠道准备成功，并为多类AI放置Skill入口；不等于这些AI均已安装或运行验证。
- 实际联网：网页读取取得Example Domain正文；GitHub gh搜索/读取通过，github-api搜索通过、未认证读取限流。其它平台未逐项联网，不把5/5安装成功说成14个平台全部可用。
- 新Skill改为公开内容先使用宿主已有工具，Reach补正文/评论/字幕或平台能力缺口；平台名不自动授权安装或登录。新聊天仍需确认真正加载新Skill，不能用Git同步代替会话重载。

## 跨设备接手

1. 先同步研发分支，阅读本文件与`docs/HANDOFF.md`，核对实际HEAD/工作区、Node26、锁定依赖和浏览器。不要覆盖未提交工作。
2. Agent Reach是机器工具，不在UI npm锁文件中；目标设备自行按[官方升级说明](https://raw.githubusercontent.com/Panniantong/Agent-Reach/main/docs/update.md)核对和迁移。Windows/macOS路径不同；保留凭据、旧Skill和必要配置，避免新旧同名副本。不要复制本机venv或把配置密钥上传仓库。
3. 不需要复制35MB隔离MCP依赖或本机全部日志。来源提交：Superpowers `2ce8aa15d05bd57213e6f746f953aafb7ded7a8b`；Anthropic `dbd4588f9e1033efb41dad4bef2f7947c8993d44`；DevTools `a24334d3a1733996438c3c4786ab4f880aaaf044`；Playwright MCP `0c4107acbecb75472b23c05c0e42471a0011874f`。它们是评估身份，不证明另一台电脑已安装。
4. 上轮中性原型曾把确认后Escape误重置归因到returnValue残留；严格同步close后，Chromium153/Chrome155的旧/新脚本均未重现，已撤回确定归因。共同防御性处理不计作Skill收益；不要复述为已稳定拒绝的旧缺陷。
5. 详细原始报告/34份快照、会话、截图和trace仅留本机隔离实验目录，位置见忽略的本地交接补充。另一台设备不可假定它们存在。本文件是可同步摘要；不把本轮工具评估改成4.1开发或发布门禁。

## UI主线

沿既有覆盖清单继续设置正式入口与已识别共用窗口材质，保留默认60%/左对齐和已认可低端灰值。天气、战斗/商店/衣柜/其它独立表面逐项接续，不以设置成功代替整体4.1覆盖。主线状态以HANDOFF和消费者表为准，不合main、不发布、不修改Host协议或玩家数据。
