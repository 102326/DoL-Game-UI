# Moody Blues CI V1.2 跨设备交接

更新：2026-10-23（Asia/Shanghai）。CI整改已完成并经 [PR #24](https://github.com/102326/DoL-Game-UI/pull/24) 合入 `dev/evolution-4.0`。下一台设备可从该研发分支接续；先读根目录 `AGENTS.md`、[项目当前交接](../HANDOFF.md) 和本文。后续产品研究状态以项目交接为准，不能将本CI验收扩展为视觉或设备验收。

**Implemented：完成；Tested：下述范围完成；Integrated：研发已合入；Release Ready：否。** 本次交接整理只涉及文档与历史证据，不改变产品、CI执行逻辑、版本、Host API或GitHub治理。

## 代码与验证身份

| 角色 | 精确身份 |
| --- | --- |
| CI候选Head | `c1f18cc565a3e5c27d7c98a8f802b474c8dfc316` |
| 已对齐研发Base | `d60ccc844942e950f41beb188a27dec5e11823fe`，保留获认可0.56边霜、媒体和W01新断言 |
| PR实际受测合并 | `fbc6b49c7af87f4a6a138be0bf8fe6bb95e46a6d` |
| 实际研发合入 | `3e6e0396f70dacf5dc6c730fec8fb73cfd7360c2`，2026-10-23 19:59:33 +08:00 |
| 候选、受测合并、实际合入共同Tree | `5cfade70cf6012824bb75ef992e0037468daac97` |
| 对应源码内容SHA256 | `fae70d0ff711665d05348cc4139969e7ad00e95d952eed0e1abae558d3f3bc0e` |
| package-lock SHA256 | `e0313e47f5f2c8939839120f2da0bf5a142582578f8ef4cb89a8c6bc265f61a6` |
| Expected Lock SHA256 | `dfb57c2e92f984c51b13ab828ea07913552e024ca934a79fdcf5c4b2d1984846`，Catalog 1.3.0 |
| 永久Project ID | `005d5d5f-6a83-42bb-a5e4-211033e5f03c` |

这些是CI实现的历史验收锚，后续文档/产品提交有自己的Commit和Tree。不要把新HEAD写成已由旧Run验证；也不要只凭Tree忽略Workflow、工具链、依赖、Catalog及Run/Attempt。已有后续研发 `9421d1d` 保留READ01隔离研究与性能未解决结论，研究39951290333随后成功；本次文档整理又保留其最终纯文档输入`a394894cd305e823028ff4a8819a092d3b176572`，包括FFmpeg/ffprobe前提和READ01未接入/性能退化说明。本轮不重新设计或集成该候选。

## 实际验证与覆盖

下列运行均整体SUCCESS、Attempt 1，producer和独立下载验收成功；标准另有最终 `moody-gate`。未用取消或反复重跑替代成功。

| 验证对象 | Standard | Research |
| --- | --- | --- |
| PR候选 | [39948602104](https://github.com/102326/DoL-Game-UI/actions/runs/39948602104) | [39948602156](https://github.com/102326/DoL-Game-UI/actions/runs/39948602156) |
| 候选push | [39948596257](https://github.com/102326/DoL-Game-UI/actions/runs/39948596257) | [39948596263](https://github.com/102326/DoL-Game-UI/actions/runs/39948596263) |
| 研发实际合入3e6e039 | Standard证据对应上述实际PR合并，合入时核对完整验证条件与相同Tree | [39950006354](https://github.com/102326/DoL-Game-UI/actions/runs/39950006354) |

- Standard：21 Unit、36 Browser、105个声明案例、124个布局案例；Deep241计划保留，本轮未重跑Deep。48个入口仍为entry粒度，不能称为全部内部场景穷举。
- Research：38命令、23原报告、128原case envelope、97主命令内部案例、3项Unit、Hub/Settings/Production/Weather四族、45张必需PNG。不同计数口径不能简单相加。
- 本地候选：`ci:check`、`ci:build`、组合设置15/资源与Hub12案例和原精确注入反例、边霜16项栅格检查通过。首次受限沙箱监听端口报EPERM，允许本地服务环境重跑通过，原错误单独保留。
- Gate：保留G01–G12/F1–F3，并验证未封存、源码/锁漂移、缺案例/零断言、渲染错配、上传故障、预算、导入作用域、损坏格式/超时及12组确定性字节变异等拒绝条件。实际标准流水线重跑了对应Unit与包合同。
- 构建：八包、两次独立工作目录/输出/缓存构建和严格ZIP字节/成员/元数据比较、9个Python合同测试；另下载实际八ZIP核对CRC、源码字节、9条SHA与PACKAGE_CHECKS和索引证据一致。
- 版本能力历史实测：UI3.5.0/4.0.0配独立Core7.8.9及Host0.1.9-experimental，输入5503387；不是此次交接重新运行。见[版本证明](moody-v12-evidence/v12-version-probe.json)。

标准原附件148项索引文件732,019字节已在Mac全量Hash/集合/身份/SEALED复验。研究原附件473条目与472项Manifest精确对应，初次交付在Mac核对79份结构化文件及完整语义；全部媒体由真实Actions下载job全量Hash校验。跨设备整理时另保存完整原档123,065,758字节，GitHub原档SHA256为`429ba4279e4405fe58ea2d2c05e4fb2ff43fad3fde04b5914fb526014ad0e496`；Mac新归档操作对全部472项、127,417,463字节（含全媒体）及完整语义/身份/封存复验通过。见[全量归档收据](moody-v12-evidence/handoff-research-full-verification.json)。初次范围读取摘要保持原身份。

## 已实现合同与代码入口

详见[实施报告](MOODY-CI-V1.2.md)、[版本身份说明](MOODY-PROJECT-BUILD-IDENTITY.md)、[CI运行说明](../CI.md) 与[负责人原文](../references/MOODY_CI_TRUST_V1.2_ORIGINAL.md)。

| 入口 | 职责 |
| --- | --- |
| `project-identity.json` | Project ID唯一来源；永久保留，不随版本或重跑生成 |
| `scripts/ci/*.ts`、`tsconfig.ci.json` | 严格原生可擦除TS合同、声明/锁、案例、调度、渲染观察、上传分类、独立构建 |
| `scripts/expected.lock.json` | 源码声明生成的审查锁；`ci:lock`更新，`ci:check`重新生成并比较 |
| `scripts/ci-evidence.cjs`、`scripts/ci-research.cjs` | 兼容证据、精确必需集合、汇总、研究与下载验证桥 |
| `scripts/test-ci.cjs`、`scripts/ci-verify-remote.cjs` | 本地/stage启动与真实下载验收；既有CJS CLI、preload/reporter保留 |
| `.github/workflows/build.yml`、`.github/workflows/golden-spin-prototype.yml` | Standard/Research、真实上传outcome、独立下载job、事件并发与最终Gate |

UI、Core、Host从各自实际来源读取，不强制同号或冻结产品主版本；Host协议和依赖范围仍校验。Build Identity绑定Project/Commit/Run/Attempt与制品Hash，易变身份不写入玩家ZIP。Expected Lock、案例分片、最终源码指纹、SEALED和真实上传/下载结果共同决定PASS。缺证据不能PASS；产品FAIL不因上传问题被覆盖。当前球体/天气按真实Canvas2D与CSS/SVG观察，不冒充WebGL验收。

## 新设备接续

1. 新克隆使用仓库 `102326/DoL-Game-UI` 的 `dev/evolution-4.0`。已有克隆先看 `git status --short`、`git branch --show-current`、`git remote -v`、`git log -1`，再 `git fetch origin`；干净且无独有提交冲突时才 `git merge --ff-only origin/dev/evolution-4.0`。不要reset覆盖本地工作或强推。
2. 提交前核对本地匿名身份。只配置当前克隆，不改全局身份：

   ```sh
   git config --local user.name 102326
   git config --local user.email 100576628+102326@users.noreply.github.com
   git config --local user.useConfigOnly true
   git var GIT_AUTHOR_IDENT
   git var GIT_COMMITTER_IDENT
   ```

3. 核对Node、npm、Python、浏览器与lockfile；工作流用Node22、Standard Python3.12、Research当前配置的Python3.x。Node22.12需 `NODE_OPTIONS=--experimental-strip-types`，工作流已设置；22.18及本次实测Node24支持原生可擦除TS。不额外安装TS运行加载器。POSIX可 `export NODE_OPTIONS=--experimental-strip-types`，PowerShell可 `$env:NODE_OPTIONS='--experimental-strip-types'`。
4. 在根目录 `npm ci`，按需装浏览器：macOS `npx playwright install chromium`，Linux `npx playwright install --with-deps chromium`，Windows当前受控浏览器入口使用已安装Edge。确认允许本地HTTP监听及端口空闲。只有python3时可显式运行 `node scripts/build-framework.mjs`、`python3 scripts/check-ci-packages.py build` 与 `python3 scripts/check-ci-packages.py`，其余npm打包入口仍需可用的python命令。录制研究媒体另需系统FFmpeg/ffprobe，不随npm安装。
5. 先核对现有Actions及其Commit/Attempt，再按变更选最小充分验证：文档仅链接/一致性/Hash检查；CI或产品行为变更再按[CI命令](../CI.md)执行相关检查。完整Standard入口为 `ci:check`、`ci:unit`、`ci:build`、`ci:packages`、`ci:browser`。Research须按实际工作流设置 `MOODY_PROFILE=research` 与新的证据ID，不能拿默认standard身份或旧目录冒充新研究运行。
6. 原档离线验收要使用其对应源码和外部锚。`ci-verify-remote.cjs`要求真实Commit/Run/Attempt/PR/上游结果/nonce/Manifest Hash等环境，不能在任意新HEAD只传目录就宣布历史PASS。接手者无需为了阅读文档重跑完整矩阵。

## 证据位置和未完成边界

Git内的[小型证明目录](moody-v12-evidence/README.md)随克隆同步，含精确运行/源码身份、下载验收、包合同、版本实测及原有依赖审计摘要；它们是历史收据，不是原始完整媒体。另提供本次跨设备离线包，包含实际Standard/Build/Research ZIP及Hash清单；完整性以包内清单核对。临时签名下载链接、凭据和本机绝对路径不进入Git或交付包。

Actions标准/构建附件保留7天、研究/远端报告14天（本批约至2026-10-30/2026-11-06，以artifact实际expiry为准）。超期后使用已保存且校验Hash的原档；没有原档时不能用摘要重建原媒体或声称重新下载通过。原始上传身份与后续归档操作分别记录。

既有Vite7.3.6审计有1项high，见[原审计摘要](moody-v12-evidence/v12-dependency-audit.json)；本轮未升级，不等于安全验收。真实DoL/ModLoader、多Mod、Windows/Android/iOS/WebView实体设备、整体视觉/长期性能及跨平台可复现性仍未验收。READ01的性能问题属于独立产品研究，不因CI通过消失。本次不合main、不发布、不改保护/required checks/bypass。
