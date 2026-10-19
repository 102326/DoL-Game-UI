# Soft & Wet — 跨设备交接

更新：2026-10-19。接手先重新核对Git/Actions；不从阶段快照推断最新HEAD。

## Current — 当前做什么

- 交付主线为main，本快照随CJ-3C集成PR交付。若仍在研发分支阅读，先核对PR是否已合并；合入后以最新main接续，不默认本机已同步。
- P0 PR #3已由负责人合入main：`cac52c198b1992530edb6a8910dbb7921fb566a8`。原协作PR #4合入P0分支a820145，后由[转交PR #5](https://github.com/102326/DoL-Game-UI/pull/5)进入main：`cabc18a39b7eab4f0597a74193332c9dc2da4fec`，未重写原合并。
- CJ-3C分支 `ci/moody-blues-cj3c` 整合了上述main；原实现b32c022、文档672fe65均保留，后续只收紧职责说明、对齐README的存档授权政策及更新交接。实际HEAD、未提交/未推送状态以本机Git为准，交付推送后应干净。
- 负责人已明确授权P0、协作、CJ-3C在各自真实PR检查通过后合并；CJ-4规则/bypass需另行具体批准。没有正式Release/CD授权。

## Decided — 已经确定什么

- [P0](MOODY_BLUES_P0.md)的CJ-3A/B与[CJ-3D](MOODY_BLUES_CJ3D.md)已接受：必需检查缺失/取消/超时不混作PASS；#78转场、#79几何/生产CSS反例保留，第三案不凑数。124/241模拟计划不扩大。
- [P0实际PR Run](https://github.com/102326/DoL-Game-UI/actions/runs/39234097956)成功，测试merge ef864863与原head树相同；合入后main [push Run39241497014](https://github.com/102326/DoL-Game-UI/actions/runs/39241497014)也成功。
- 协作[真实PR Run39242101531](https://github.com/102326/DoL-Game-UI/actions/runs/39242101531)成功5m26s：head c61de64、测试merge `aa051fd29f78f0338bccc3d670d7e49b196626dc`，58项237,525B全部哈希校验、遗漏0；14单元/21浏览器、124/124。旧#4手动检查不冒充此PR证据。
- [协作规范](GITHUB_COLLABORATION.md)的六类双语表单/独立兼容入口、Unknown、证据可选、blank issue、PR六部分已进入默认分支。GitHub原生页面验收以当次交付报告/实际页面为证，不使用过去的本地HTML预览代替；未批量创建测试Issue。
- [CJ-3C](MOODY_BLUES_CJ3C.md)：UI/Host及六个当前可选包、规范ZIP元数据、两次实际编译/打包及七个制品测试方法。精确版本/依赖/ZIP成员字节合同由Python检查器执行；整轮汇总器核对报告身份、规定结构、必要执行及两轮一致性，不是第二套独立ZIP验证器。
- 原候选[push Run39238808024](https://github.com/102326/DoL-Game-UI/actions/runs/39238808024)成功5m16s，准确checkout672fe65；59项365,013B及八ZIP+报告9条SHA全验、遗漏0，两轮invocation不同、八包快照一致。最新main集成仍以本次真实PR/合入后push检查为准，不拿旧候选成功代替。
- 本机完整验证环境：macOS arm64 / Node24.18.0 / npm11.16.0 / Python3.12.14 / Playwright1.63.0，七阶段实际PASS；summary正确PARTIAL（无GitHub setup outcomes）。云端Linux x64 / Node22.23.3 / npm10.9.9 / Python3.12.15。各平台结果不能互换。
- 原活动ruleset仍有update/deletion/non_fast_forward，未配置必需CI。其admin/Connector/DeployKey类别保留always bypass；转交合并使用已有管理员权限，没有改规则/名单。CJ-4的validate/App15368、strict、bypass具体候选尚未生效；CI成功不等于强制门禁已建。八个建议标签未创建。
- v3.0.1仍指向 `9c162939dca50b11549b8a88aefa0069e4ea1896`，正式附件不替换。真实Android/WebView、Safari、Windows、DoL/ModLoader多Mod、系统键盘/缩放/下拉框和物理触控未验收。
- 两台自有设备及五项Apple目标实测仍pending（viewport/DPR=null），由用户主动采集；不阻塞代码集成。Artifact保存7天，本机原始路径只放忽略的HANDOFF.local.md，不能假定另一设备可访问。

## Next — 下一步做什么

1. 合入前核对最新head/base、真实pull_request Run、实际测试merge与完整证据；合入后核对main push结果。接手时先fetch并确认main，不从旧研发分支/旧报告复制PASS。当前授权不包含CJ-4规则写入或正式发布。
2. CJ-4具体规则和bypass单独提交负责人审批；有明确批准才应用配置。真实设备数据在用户方便时采集，用于校准现有回归，不继续堆设备名称或扩大常规矩阵。
3. 新设备先status、branch、HEAD、remote、fetch；保护本地独有工作，再核对Node>=22.12、Python>=3.10及python命令、lockfile/浏览器。最低npm ci、ci:check/unit/build/packages及锁定浏览器ci:browser；所有stage共享MOODY_EVIDENCE_ID，记录实际环境/提交/Run。

更新约定：交接前维护Current/Decided/Next，未提交/未推送须注明；详细历史留专项报告。主动授权的玩家存档只在源码树外隔离复现，自动CI不读/上传或纳入公开Artifact；不提交凭据、敏感设备标识或大段日志。机器路径只放本地补充。
