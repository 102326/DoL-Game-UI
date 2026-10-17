# Stone Free 3.0 — RC-01 最终制品与版本兼容政策实施报告

2026-10-17。结论：**Ready for Owner Approval**。RC-01的版本、范围、固定源码、双包、Windows/Android升级回退证据及说明已完成。尚未推送、合并、Tag或发布；本报告不是公开发行成功声明。

## Version Policy

| 对象 | RC-01最终值 |
| --- | --- |
| 官方UI | `DoLGameUI 3.0.0-rc.1` |
| 推荐Host制品 | `StoneFreeHost 0.1.4-experimental` |
| 最低兼容Host | `0.1.2-experimental` |
| UI/标准作者配方的Host依赖 | `>=0.1.2-experimental && <0.2.0` |
| Host公共协议 / 原UI API | `0.1-experimental` / v1，各自独立 |
| 本RC官方UI的GameVersion | `=0.5.12.13` |
| 其余前置 | ModLoader >=2.100.0、TweeReplacer >=1.0.0；本轮实际Loader2.101.1 |

不是把当前推荐版本机械设为最低版本：冻结0.1.0/0.1.1已暴露13项顶层方法，但在文档已加载后才出现jQuery时，没有建立桥接，且绑定此前错误地可用。0.1.2的R15修正包含pending scene、晚到重试、订阅回滚、读档失效与释放保证。0.1.3和本轮0.1.4的运行index.js与0.1.2逐字节相同。最低0.1.2因此有行为依据，不能因方法名称相同降到0.1.1，也不因README或官方UI版本更新升到0.1.4。

此次Host包内README必须改为RC安装与新兼容政策，boot身份也需更新；不能重写同版本0.1.3 ZIP。故推荐制品使用新的0.1.4，但不强迫已有满足条件的消费者一起升级。旧R17 Host/UI和R16 Host原字节均保留。

未来同一受支持协议代际内尽量保持方法、场景失效、资源所有权和结果语义；新增能力才由实际调用方提高下限，破坏性变化必须换协议并说明迁移。SDK源码版本不自动决定作者最低Host，官方UI产品号不控制Host生态。此维护预期不等于未来版本已经认证。详细依据见[当前政策](STONE_FREE_3.0_RC01_POLICY.md)，它取代R17精确配对建议，历史报告保留。

### Loader范围的实际证据

直接调用当前真实Loader的getSemVerTools，而非使用npm semver。候选空格写法 `>=0.1.2-experimental <0.2.0` 没有形成预期上界，且下限本身不通过，已弃用。显式 `&&` 写法接受0.1.2/0.1.3/0.1.4，拒绝0.1.0/0.1.1、0.1.2-alpha、0.2.0正式版和1.0.0。

Loader对prerelease的解析与标准SemVer不能画等号，实测有截取现象。它把0.2.0预发布排序在0.2.0之前，部分此类版本仍可能满足范围；**这些版本不在RC-01支持/验证组合内**。不伪造一个看似通用但未经支持的上界来掩盖它。未来主版本正式版不无条件放开，实验协议检查继续存在。

connect.ts仍检查协议、必要方法、disposed和能力，不读Host包版本。Loader声明不保证阻止脚本，因此不承诺所有错误包版本都被拦截；同协议旧Host可能启动，却不满足本UI的最低行为保障。负例证明的是版本范围和具体缺失行为，不是“原版Loader必定拒绝执行”。没有新增版本仲裁器或公共API。

证据：`tests/artifacts/stone-free-rc01/loader-version-{rules,upper-bound,alternatives}.json`；`host-history.json`包含实际冻结0.1.0～0.1.4运行JS的受控浏览器比较。后者不是ModLoader安装证明。实际最低版本装配验证见下表。

## Final Artifacts

固定产品源码：`0df554ab1802d4ee37ea7ed89ec632d1dd6db101`，分支 `research/stone-free-3.0-framework`；从R17最终 `9cccfab334e4382ecfe3245834a3c898e3034a52` 继续，入场工作区干净。

| 玩家ZIP | 字节 | SHA-256 |
| --- | ---: | --- |
| StoneFreeHost-0.1.4-experimental.mod.zip | 6326 | `ad78fca929e3819fce4da6f0d10affb4fc91318661583e4dacec896b64936153` |
| DoLGameUI-3.0.0-rc.1.mod.zip | 192530 | `19cb5c239096cf4d7011826af7b6b334be338f2a4b06c99adafd25eb84695597` |

交付目录 `dist/rc01/`：两ZIP及INSTALL.md、RELEASE_NOTES.md、SHA256SUMS.txt、manifest.json。没有开发样例或AuthorKit运行依赖。原始APK、游戏、第三方ZIP、收据、截图和存档不进入发行ZIP。

通过git archive导出固定提交至 `tests/artifacts/stone-free-rc01/fixed-source-0df554a`，复用现有node_modules junction；没有安装依赖、改全局环境或重置原工作区。Node26.12.0、npm11.20.0、Python3.14.7、Vite7.3.6，锁文件SHA `b5c2ffb5e596baed79a9da099f0cdaa81d5f030216427f0191ff488618b0467b`。

实际执行framework:check、build-framework.mjs、package-framework.py；早期商店脚本和公开类型由固定源重新生成。命令输出保留于build-check.log/build.log/package.log。标准作者配方下限变更另跑framework-author-kit.cjs：从独立源码包生成项目、作者编辑保全、类型检查、构建/打包、实际boot最低依赖和390px独立运行通过。它不代表真实作者ModLoader安装，生成的研究包不混入玩家附件。

结构审查确认Host4项、UI18项，根boot有效、技术名正确、依赖准确、路径安全且无重复。四项Twee补丁、早期脚本、API类型、设置/可选包说明、LICENSE、第三方NOTICE和渲染器许可齐全。详见本地package-audit.json。最终README和Release说明在构建前固定，验收后没有修改包内文档。

## Validation

三组使用相同最终RC UI ZIP，推荐组Host同上表，最低组使用冻结0.1.2原包（SHA `34e0df095fbca7793878fcd8171187c215bea586e4820309fce5365097017aae`）。不是改boot版本的假旧Host。

| 实际环境 | 原2.7 → 候选 → 回退加载数 | 收据 | 结果 |
| --- | --- | --- | --- |
| Windows Edge/Playwright，真实0.5.12.13 HTML + Loader2.101.1；Host0.1.4 | 35 → 36 → 35 | windows-upgrade-1792243572716 | 通过 |
| 同宿主，同一RC UI ZIP；最低Host0.1.2 | 35 → 36 → 35 | windows-minimum-upgrade-1792243572716 | 通过 |
| M367FC，Android17 / WebView154.0.8037.58；独立0.5.12.13测试App；Host0.1.4 | 39 → 37 → 39 | android-upgrade-1792243572716 | 通过 |

收据均位于 `tests/artifacts/stone-free-rc01/`。实际Loader报告UI rc.1、对应Host版本和API1；始终只有一份DoLGameUI，没有研究同伴前置。读取的实际运行JS/CSS/早期脚本/Twee成员摘要与最终ZIP逐项相同；输入整包SHA另行固定，不能把文件名当身份。Host0.1.3的支持依据是相同运行字节及R17结果，不冒充本轮重跑了一套0.1.3。

每组都从2.7新建测试进度，保存至空槽；安装候选并重启后，通过原生槽位操作读回，再停用新UI恢复2.7重启读回。金钱、存档名、衣柜、主装备、叠加数组和options与原前态一致；gameTime保留。字号、按钮比例、视觉档位、侧栏/阅读、V2、各页与悬浮/独立哨兵键保持。没有迁移存档格式。专用测试槽删除后其它details相等。

原库存上装的参照/对照/返回在完整动态模式和关闭动态时可用；总开关关/开、原存档入口、Hub三循环与关闭可用，挂载数没有积累。Windows390px关闭原侧栏后内容可见，文档宽390无页面横向溢出。没有以桌面模拟点击冒充手机触控。Android由现有Action执行App重启并重新绑定WebView；沿用已调查的1.5秒持久化等待，不把立即强停与正常重载混为同一路径。

Android未覆盖原DoLGameUI ZIP：只在自有临时键安装候选，原同名UI和三个旧外观包暂时停用；恢复原启用/隐藏清单、偏好并再次重启核对，恢复为39包和2.7。正式App及私人长期槽不读写。Windows使用新浏览器上下文，测试结束关闭；基础34个包仍为R16固定输入，没有增加Mod数量。

最低Host的场景桥保障还由冻结JS受控负对照和已有bridge/connect定向测试支撑。没有在错误Host上派发游戏业务来“测试失败”。衣柜、商店、战斗、低频菜单、文本传输、旧API和旧外观包的其它行为复用R14–17有效证据；相关运行代码没有变化，不重新执行整个矩阵。

## Differences from R17

- UI由lab17变为真正rc.1；index.js仅版本字面量变化，SHA `c244f9f2075cbeabfcb63b1191ded9458589fd175a8e9acb7ba7a47fbbe68fe6`（以package-audit.json实际摘要为准）。无UI行为或样式重构。
- Host由0.1.3推荐制品变为0.1.4，改README与boot身份。运行index.js仍 `5b7818db0802255c535db6ae73fcd6d7cb15b224fc0c9711ed71fce46cc2b495`，未加新API。
- Host精确依赖改为有语义依据的最低范围；官方UI GameVersion收窄为0.5.12.13，Host不增加游戏白名单。
- UI新增面向玩家的RC更新说明，修改README、boot和显示名。CSS仍 `5068b271180bc7d5675890dbed4d07e676170560085fb220a54b3f9ebac6a346`；早期脚本、四项补丁、类型和其它已有资源与R17相同。
- 可选SDK/作者配方不再把最新包号机械写成Host最低版本。源码包/研究包版本单独前进，避免同版本ZIP不同字节；不进入玩家必需附件。

所有摘要以最终manifest/package-audit为源；本报告提交与固定制品源码提交分开，后续说明不改变已验证的双包。

## Documentation / Known Limitations

安装与回退见最终包README和交付INSTALL；公开更新说明见[RC更新说明](RELEASE_3.0.0-rc.1.md)。其中包含备份、两个玩家包、最低依赖、协议实验状态、游戏范围、反馈入口与许可。建议保留稳定2.7，不将本轮待审批制品称为已发布稳定版。

R16共有Patch未匹配、天气/图像错误、TypeError、五项共享目标与部分第三方范围暂不能核对仍保留。R17已证明配置差异的一项来自ModdedClothesAddon对运行声明附加data，且运行/保存顺序不同；不是本UI升级失败的充分证据。没有把全部共同告警宣称无害，也没有关日志或修改来源Mod来清零。Maple云端、ModHub远程服务等仍未完全验证。

新Hub位置数据回退不主动删除，但本轮未拖动并验证落盘/回退读回；不承诺该项已验收。Host需要AbortSignal.any等环境能力。0.5.11.9只有历史有限研究，不列本RC默认支持。

## Failed / Unknown / Not Validated

本轮三组最终安装/升级/回退均首次通过；没有靠反复重跑flaky至绿。版本表达式候选的失败或偏差保留在loader-version-*.json：空格组合、不同prerelease上界不能按标准SemVer直觉解释；未采用不符合本轮预期的写法，没有修改Loader或Paisley Park。

原0.1.0/0.1.1在晚到jQuery场景未接桥，这是明确旧行为，不标成Tools故障。检查标准工具仍为已安装White Snake6.1.0；没有新工具缺陷被证实，没有动GER Store/历史未决Effect。

Not validated：未来Host版本与0.2预发布、实际错误依赖安装的全部Loader行为、其它Loader/WebView、物理手机/IME、长期性能、所有第三方/衣槽、全部低频业务、云端/文件选择、新Hub位置落盘回退。它们不自动成为RC-01未完成实现。源码/协议未变的历史业务证据仍适用；制品安装用的是本轮实际新ZIP，未以R17安装结果替代。

## Release Decision

**Ready for Owner Approval。** 本轮范围无剩余技术阻断项。负责人可根据上面的有限支持政策、prerelease比较限制、实验API和覆盖边界，决定是否批准公开RC-01。尚未进行任何远端推送、主线合并、Tag或Release。其它工作区及正式2.7的两份未跟踪文件保持原状。
