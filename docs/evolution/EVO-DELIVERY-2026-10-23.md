# Evolution — 2026-10-23 本轮交付与换设备入口

负责人要求本轮提交结果、整理文档后切换设备。本交付仅在 `dev/evolution-4.0`；最终提交与同步状态由Git及Issue #22记录，精确证据不与未来HEAD混用。先读[当前HANDOFF](../HANDOFF.md)，专题历史仍保留。

| 编号 | 本轮做了什么 | 交付 / 剩余事项 |
| --- | --- | --- |
| EVO-INT-FROST02 | 0.56浓度实际设置边霜获负责人视觉通过；准确浓度媒体另存，原霜羽、雨天和开关节奏保留 | 认可实现5a0f244、验收提交d60ccc8。[报告](EVO-INT-FROST02.md)，16像素/48冻结＋4实际表面/settings-ci及类型通过；其它窗口、G2/G3不在此裁决 |
| MB-GH / CI-V1.2 / PR24 | 询问CI对话Draft原因；该对话取得独立同步授权后完成组合源码复验并合入研发；本聊天安全快进3e6e039，不覆盖隔离原型 | [CI报告](../audits/MOODY-CI-V1.2.md)、[PR24](https://github.com/102326/DoL-Game-UI/pull/24)。本聊天未更改CI逻辑或治理规则 |
| EVO-MAT-READ01 | 背景透字定位、隔离单层Acrylic、旧新原速/像素对照和8项性能观察；保留三个未奏效假设 | [完整研究报告](EVO-MAT-READ01.md)。桌面帧间隔退化，**未接入/未视觉通过/性能未解决**，不是“只等实机” |
| CI-HANDOFF-01 | 压缩Current/Decided/Next为当前快照，旧累计记录归档；保留研究脚本、公开受控媒体/摘要、观测数据和本报告 | 新设备按HANDOFF核对git/依赖/环境与CI。本地日志/临时脚本/服务不随Git，机器路径仅忽略补充文件 |
| CJ-3C | 保留已有八包/两轮构建/版本依赖/成员合同，Python精确合同检查与整轮证据汇总职责保持 | 本UI研究批没有重做八包或改发行包；新CI专项的制品证据见其报告，不把旧包结果算本轮新执行 |
| CJ-4 / 发布 | 没有修改保护、required checks、bypass或main/Release | 仍待单独决定；不阻塞本次研发交付 |

## 本轮结霜的实际远端证据

- **d60ccc8标准**：[39947630976](https://github.com/102326/DoL-Game-UI/actions/runs/39947630976)，手动Attempt1成功，validate409秒；Mac下载90项552,298B并核对集合/大小/SHA，独立nonce/manifest锚及同源码语义复放PASS/COMPLETE。
- **d60ccc8研究**：[39947630276](https://github.com/102326/DoL-Game-UI/actions/runs/39947630276)，push Attempt1成功；prototype1050秒，其中浏览器安装618秒、研究检查405秒，下载验收21秒。[下载验收结果](EVO-FROST02-RESEARCH-REMOTE.json)PASS/COMPLETE且身份匹配；Mac只核对该结果，未全量下载122,982,504B研究Artifact，不宣称本地重算大媒体。
- CI合入候选真实PR标准[39948602104](https://github.com/102326/DoL-Game-UI/actions/runs/39948602104)/研究[39948602156](https://github.com/102326/DoL-Game-UI/actions/runs/39948602156)，及候选push标准[39948596257](https://github.com/102326/DoL-Game-UI/actions/runs/39948596257)/研究[39948596263](https://github.com/102326/DoL-Game-UI/actions/runs/39948596263)由CI聊天交付；合入提交3e6e039与验收PR merge fbc6b49同树。合入后[39950006354](https://github.com/102326/DoL-Game-UI/actions/runs/39950006354)现已核对整体SUCCESS/Attempt1，producer与独立下载验收均成功。
- 本批实现提交 **9421d1d02409fa38fe5004f1e92296259d97cd50** 的[研究push39951290333](https://github.com/102326/DoL-Game-UI/actions/runs/39951290333)SUCCESS/Attempt1，producer458秒、evidence-verify32秒。[小型真实下载验收结果](EVO-READ01-RESEARCH-REMOTE.json)在Mac核对提交/tree/run/生成锁/catalog身份相符且PASS/COMPLETE；未本地全量下载研究大媒体。标准工作流不自动覆盖dev push，本批没有再手动执行整轮标准。
- 9421之后只补文档环境前提/最终运行与小型证明，已测试的53项源码hash未变；最终文档提交及其自动run状态见#22。READ01未注册默认CI，已有CI绿色不代替其手动测试或性能问题。

## 下一设备优先事项

1. 核对本次交付已fetch、工作区与分支干净/独有内容，读取新HANDOFF；不要假定Mac端口/忽略日志可访问。
2. 沿用已通过设置雪天/雨天/Hub，不自动接入READ01。先复核目标桌面浏览器的模糊合成代价与背景可读性，解决候选性能后再作负责人视觉评审；是否重做材质另行决定。
3. 补真实游戏+ModLoader/多Mod宿主、Windows和设备输入/长期性能。G1/G2/G3、其它窗口材质角色及发行继续单列，不能由本轮受控结果代签。

受控证据只含第一方夹具。未经主动提供和授权的存档不读取；授权存档隔离复现，不自动公开到CI。
