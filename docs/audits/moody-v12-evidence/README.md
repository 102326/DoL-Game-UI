# Moody Blues V1.2 验收摘要

这些JSON是2026-10-23已完成CI验收的历史证明，随Git供跨设备查阅。精确身份、运行、口径和继续步骤见[CI交接](../MOODY-CI-V1.2-HANDOFF.md)。`SHA256SUMS.txt`覆盖此目录JSON及README，可用 `shasum -a 256 -c SHA256SUMS.txt` 核对；Windows可用PowerShell `Get-FileHash -Algorithm SHA256 <文件>`逐项比较。

- `sync-standard-verification.json`：PR Standard全量148项原证据及独立锚、21/36入口与105/124案例。
- `sync-build-artifact-verification.json`：实际八ZIP源码/成员/CRC/元数据、九条SHA及报告相等。
- `sync-research-verification.json`、`sync-research-selected-proof.json`：原研究验收及当时Mac范围读取79份JSON的口径；真实Actions下载job全媒体验证通过。
- `sync-postmerge-research-verification.json`、`sync-integration-verification.json`：实际合入3e6e039、后续Research39950006354、完整身份和匿名提交信息。
- `sync-local-verification.json`、`sync-runs-final.json`：本地候选范围、沙箱错误与成功重跑、四次实际成功运行。仅写日志文件名；原日志在离线包，当前目录不含它们。
- `handoff-research-full-download-proof.json`、`handoff-research-full-verification.json`：后续跨设备交接的新归档操作，完整原档123,065,758字节、473条目，472项索引127,417,463字节及全媒体已在Mac全量Hash/集合/语义/身份复验；不改写上述初次范围读取口径。
- `v12-version-probe.json`：较早输入5503387的实际独立组件版本构建证明，不重标为新运行。
- `v12-dependency-audit.json`：既有依赖风险的时点记录，不是当前联网重新审计。

摘要不能替代原档。Standard/Build/Research原ZIP及后续完整研究下载的归档收据随本次离线交付包提供；Git不承载大媒体或临时下载链接。新设备/新提交是否通过需重新核对对应证据，不由这些文件的存在证明。
