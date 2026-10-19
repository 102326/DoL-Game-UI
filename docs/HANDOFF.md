# Soft & Wet — 跨设备交接

更新：2026-10-19。接手先重新核对Git/Actions；不从阶段快照推断最新HEAD。

## Current — 当前做什么

- 基线main `16bca36282e3a17c2b70529ef6a43386468c4f98`：P0 #3、协作转交#5、CJ-3C #6均合入；原#4合入P0分支的历史保留。
- 本轮研发分支 `ci/moody-blues-cj4`，实施[质量门禁](MOODY_BLUES_CJ4.md)与八个已批准协作标签；以本机Git确认实际HEAD/未提交或未推送状态。最终合入及CI以该PR和交付报告/远端规则回读核对。
- 负责人2026-10-19“允许完成剩余的所有问题”授权本轮工程、规则/标签及验证后合并；不延伸为正式Release/CD、危险存档操作或虚构实机数据。

## Decided — 已经确定什么

- [P0](MOODY_BLUES_P0.md)的CJ-3A/B与[CJ-3D](MOODY_BLUES_CJ3D.md)已接受：必需检查缺失/取消/超时不混作PASS；#78转场、#79几何/生产CSS反例保留，第三案不凑数。124/241模拟计划不扩大。
- [P0实际PR Run](https://github.com/102326/DoL-Game-UI/actions/runs/39234097956)成功，测试merge ef864863与原head树相同；合入后main [push Run39241497014](https://github.com/102326/DoL-Game-UI/actions/runs/39241497014)也成功。
- 协作[真实PR Run39242101531](https://github.com/102326/DoL-Game-UI/actions/runs/39242101531)成功5m26s：head c61de64、测试merge `aa051fd29f78f0338bccc3d670d7e49b196626dc`，58项237,525B全部哈希校验、遗漏0；14单元/21浏览器、124/124。旧#4手动检查不冒充此PR证据。
- main [Run39243023242](https://github.com/102326/DoL-Game-UI/actions/runs/39243023242)真实失败：settings测试固定450ms后仍open，后续检查BLOCKED，不能用PR成功抹去。改为有界等待真实关闭/标记/材质清理终态，保留原断言；新增慢关闭合法通过、实际paused关闭拒绝反例，本机两入口通过。未改生产代码，不另算第三产品缺陷。修补提交ea1db9d本机两入口、证据单元/Ruby结构检查通过；PR #6最终head及main CI以该PR检查与交付报告核对，不拿旧b9a37e1的成功替代。
- [协作规范](GITHUB_COLLABORATION.md)的六类双语表单/独立兼容入口、Unknown、证据可选、blank issue、PR六部分已进入默认分支。已在默认分支实际验收六类原生表单及新PR页面六部分自动填充，保存公开页面正文证据；未创建测试Issue或研究PR。
- [CJ-3C](MOODY_BLUES_CJ3C.md)：UI/Host及六个当前可选包、规范ZIP元数据、两次实际编译/打包及七个制品测试方法。精确版本/依赖/ZIP成员字节合同由Python检查器执行；整轮汇总器核对报告身份、规定结构、必要执行及两轮一致性，不是第二套独立ZIP验证器。
- CJ-3C最终[PR Run39245282564](https://github.com/102326/DoL-Game-UI/actions/runs/39245282564)和[main Run39246276630](https://github.com/102326/DoL-Game-UI/actions/runs/39246276630)成功；main59项365,258B/八ZIP/51成员完整核验，14单元/21浏览器、124/124。
- 集成[PR #6](https://github.com/102326/DoL-Game-UI/pull/6)基于main/cabc18a；原候选[push Run39238808024](https://github.com/102326/DoL-Game-UI/actions/runs/39238808024)成功5m16s，准确checkout672fe65；59项365,013B及八ZIP+报告9条SHA全验、遗漏0，两轮invocation不同、八包快照一致。最新main集成仍以本次真实PR/合入后push检查为准，不拿旧候选成功代替。
- 本机完整验证环境：macOS arm64 / Node24.18.0 / npm11.16.0 / Python3.12.14 / Playwright1.63.0，七阶段实际PASS；summary正确PARTIAL（无GitHub setup outcomes）。云端Linux x64 / Node22.23.3 / npm10.9.9 / Python3.12.15。各平台结果不能互换。
- CJ-4以独立规则要求validate及moody-gate/App15368、strict=true、bypass空名单；先在隔离目标做真实合并拒绝验证，再收窄到main。实际启用状态、规则ID及Run以交付报告/API回读为证。原jijizi及其admin/Connector/DeployKey豁免不改。八个建议标签已创建并回读，四类别接入表单，维护状态标签不自动贴。
- v3.0.1仍指向 `9c162939dca50b11549b8a88aefa0069e4ea1896`，正式附件不替换。真实Android/WebView、Safari、Windows、DoL/ModLoader多Mod、系统键盘/缩放/下拉框和物理触控未验收。
- 两台自有设备及五项Apple目标实测仍pending（viewport/DPR=null），由用户主动采集；不阻塞代码集成。Artifact保存7天，本机原始路径只放忽略的HANDOFF.local.md，不能假定另一设备可访问。

## Next — 下一步做什么

1. 接手先fetch并确认main、工作区及当前规则，按最新PR/Run复核，不从旧研发分支/阶段报告复制PASS。CJ-4相关PR合入后应具备validate和moody-gate两个成功检查；main变化需重新验证。没有正式发布授权。
2. 两台自有设备实测仍待用户主动采集；收到实际宿主viewport/DPR后校准固定回归，不堆设备名或扩大常规矩阵。Windows/Android/iOS及游戏多Mod必须在实际环境另验收。
3. 新设备先status、branch、HEAD、remote、fetch；保护本地独有工作，再核对Node>=22.12、Python>=3.10及python命令、lockfile/浏览器。最低npm ci、ci:check/unit/build/packages及锁定浏览器ci:browser；所有stage共享MOODY_EVIDENCE_ID，记录实际环境/提交/Run。

更新约定：交接前维护Current/Decided/Next，未提交/未推送须注明；详细历史留专项报告。主动授权的玩家存档只在源码树外隔离复现，自动CI不读/上传或纳入公开Artifact；不提交凭据、敏感设备标识或大段日志。机器路径只放本地补充。
