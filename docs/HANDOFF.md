# Soft & Wet 4.1 — 当前交接

更新：2026-11-02。总跟踪 [#31](https://github.com/102326/DoL-Game-UI/issues/31)。负责人批准的顺序仍为 **7→6→5→3→2→1→4→8→9**；历史实施与失败沿下方报告及 Git 历史读取。

## Current — 当前状态

**负责人反馈已修复、本机及 Android 定向验证通过；当前批次双 CI 与整体验收待完成，未公开发布。**

2026-11-02 补充：负责人要求撤销全部三维翻页，普通页直接换页，UI 设置分类只留 20ms 淡入；衣柜取消入场与分类动画。服装店真机复现 CSS 内容宽度与脚本含内边距宽度不一致，导致窄屏详情铺满屏幕；统一为内容区宽度。最终UI已装入独立测试App，19加载成员一致；本地ZIP摘要 `0ced45c0191e8d32363e0719fa8cef4e516d2a2bda4127d0e5af768996488f0f`。实现和失败记录见[本轮反馈修复](evolution/EVO-4.1-CANDIDATE-2026-11-02.md#负责人反馈修复2026-11-02)。下列 8d66038 制品与 CI 为上一候选历史证据，不覆盖本轮运行代码。

- 研发分支 `feature/4.1-ui-material-hub`，产品/文档冻结 `8d660382685230a8af74516c307fa97168e13913`。ModHub运行优化 `bdc9e92` 与版本整理分开提交；后续技术记录提交不改变已验产品输入。
- V1/default60/默认左对齐、阅读三滑杆、官方/完整兼容材质轴、双布局、悬浮工具、完整天气与动态前景分层进入同一源码。Host + UI 双包、UI API v1、游戏和存档行为保持。
- 当前内部产品版已为4.1.0，不再借技术版4.0.1冒充最终包。公开版仍未改，未合main、创建Tag或Release。
- 只递增有变化的 ModHubSoftWet1.0.3、ReOverfitsSoftWet1.0.1、SmartPhoneSoftWet1.1.2；Host和其余四包成员与公开版一致，分发使用其公开原字节，不覆盖同版本。

## Delivered — 负责人材料

本机 Downloads：

- `SoftWet-4.1.0-owner-review-8d66038.zip`：347370字节/11成员；SHA-256 `105bf1c82c6805a65c91c26bdaea00075b5439b62871922d0880184da227c773`，另有`.sha256`。内含九个Mod ZIP、玩家README和九包校验清单；外层先解压，各`.mod.zip`不解压。
- `SoftWet-4.1.0-Android-preview-22s.mp4`：最终4.1.0原生录屏，22.04秒/1704×1136，无变速，仅裁去末尾空闲。分类/布局原生触控，材质端点使用原UI偏好API；预览后偏好恢复。文件SHA见[制品清单](evolution/EVO-4.1.0-PACKAGES-2026-11-02.json)。

[当前候选/完整边界](evolution/EVO-4.1-CANDIDATE-2026-11-02.md#当前候选4108d66038) · [安装与回退](INSTALL_4.1_CANDIDATE.md) · [玩家Release草稿](RELEASE_4.1.0_DRAFT.md) · [首页待验收稿](releases/4.1.0/HOMEPAGE.md)。公开首页尚未替换，素材不放Assets，技术报告不作为玩家附件。

## Validated — 当前证据

- [标准41341589416](https://github.com/102326/DoL-Game-UI/actions/runs/41341589416)、[研究41341592938](https://github.com/102326/DoL-Game-UI/actions/runs/41341592938)均精确8d66038、Attempt1、workflow_dispatch、success。两份独立结果PASS/COMPLETE，标准moody-gate成功；Node26.12.1/Playwright1.63.0。
- 本机下载两份小型独立结果及标准构建/检查artifact，GitHub摘要匹配。196项标准索引逐项重算、SEALED sourceAfter一致，十构建负载、九包的CRC/元数据/成员/依赖/许可及负例/双构建通过。124MB研究媒体由远端独立job验证，未本机重复全量下载。
- 最终主UI CI原ZIP SHA `e78f1f38a3e4d1670a4c4d851751af46ec7a566c87388502cc69802d5d53f9e4`；实际装机本地ZIP `3da6395dd82500aa4e2d34b6f0edb3490b34bfe85276225d1f48b2627a192be2`，容器不同、全部成员一致。八个实际加载包所有成员与最终CI匹配；ReOverfits未安装。
- Android17/WebView155、1363×876 CSS视口、47项Loader组合。目标含ModHub1.9.2、MapleBirch5.6.2、原版优化1.1.2.1、CE rebuild.30、SmartPhone Alpha0.3.91.1。设置双布局/分类/真实字号输入、ModHub五页签两轮、存档三页展示、拖动滚动/模态返回/动态关闭恢复和六次快速开关清理通过。重启后运行API/页面标记均4.1.0，原闭包规则缓存生效；偏好、顺序和停用列表保持。
- ModHub1.9.2原ZIP及市场成员与作者最新正式版相同。精确源保护下接入1024项/256字符规则缓存，超预算/未知源原生回退，不缓存目录、推断结果或更新代次。142项真目录等价；原/新完整闭包各六类迟到响应和Loader回退通过。只读克隆的8轮交错计算中位125.35→38.35ms，是函数时间，不是开窗或FPS。详见[接线与失败记录](evolution/EVO-4.1-MODHUB-B3-2026-10-27.md#真实192接线2026-11-02)。
- 新1.9.2组合雷雨短采样rAF P95仍16.7/16.6ms。复用f294855/afa8457已验动态前景、8类源控制器×宽窄16组及相关原业务合同；最终4.1JS仅换版本常量，CSS/早期脚本相同，另验身份和实机交互。不将短rAF/算法计时写成持续FPS、CPU/GPU或功耗保证。

## 失败与覆盖边界

- 原f294标准时钟夹具失败、旧combat-resize手工入口色值失败及性能负结果保留。详见[原UI实施报告](evolution/EVO-4.1-UI-765-2026-10-27.md)和[前后候选](evolution/EVO-4.1-CANDIDATE-2026-11-02.md)，不改写成全部通过。
- 本地曾只用Python重封版本而漏掉Framework重编译，API仍4.0.1，被原版本断言拒绝；该包/日志保留。随后完整`npm run ci:build`、重装/原生重启并核对API/根标记/全部成员，最终与远端CI相符。一次过早Bootstrap采样也保留；按真实就绪条件修正前置，没有放宽断言。
- 本批未穷举全部游戏交易/穿戴/战斗结算、安装更新/排序、云端写入、文件选择、更多物理手机/iOS/WebView或长期功耗。Windows/更早设备证据仅在相关输入未变时沿报告复用，不将合成内容写成游戏业务通过。
- [#33](https://github.com/102326/DoL-Game-UI/issues/33)本轮重新读取正文/评论，仍缺Ray版本与可靠场景；衣柜预览1/4和祭坛媒体越界均Unknown/open，未宣称修复。不要用全局img/canvas缩放掩盖。
- A1减少扫描但没有耗时改善，未证明收益的原版/Host候选不强行接入。其余HC公共能力仍为调查，不自动成为当前发布必须实现项。未穷举生态覆盖不等于本候选能力未实现；原消费者边界见[同一覆盖表](evolution/EVO-P0-COVERAGE.md#41统一交付覆盖补充2026-10-28)。

## Next — 下一步

1. 交给负责人体验上述同一候选，重点看通透度、官方/兼容协调、直接换页、衣柜直进与商店详情。局部设计认可继续有效，本次整体Owner Acceptance不自行代签。
2. 若发现本范围内缺陷，定向修复并重验受影响行为。多次中小改动积累到阶段边界跑完整CI，不为文档记录或未改产品重复全套。
3. 负责人确认无误后，才核对最终main/Tag指向、实际附件与校验清单，再进行公开发行；同步已备首页/发布页文案，图片/视频放页面，Assets仅玩家包和SHA。
4. #33及额外生态/长期性能沿Coverage Ledger保留，不静默关闭、不扩大支持，也不自动追加新视觉研发。

## 换机与恢复

先核对branch/HEAD、干净状态、Node26 Only（最低26.12.1）及锁定依赖；保留本机独有资料。`npm run ci:build`会执行完整Framework构建后封包；单独`python scripts/check-ci-packages.py build`只打包已有编译物，不能代替重编译。

原始证据/备份/安装收据在Windows Git忽略的`tests/artifacts/ui41/release-prep-20261102/`；前批目录和旧评审包未覆盖。不会随Git到Mac，不假设Mac有游戏或实机；过期`HANDOFF.local.md`中的历史路径须重新确认。使用本机Paisley Park resolver定位工具，连接时明确独立测试App，不操作私人长期存档或云端。

技术记录与源码可同步研发分支；当前授权不包含4.1公开发布。CI批次策略见[CI文档](CI.md#按批次执行负责人2026-11-02确认)。
