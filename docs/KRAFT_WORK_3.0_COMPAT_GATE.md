# Kraft Work 3.0：兼容包收口与发布材料

2026-10-19。接续 [整合 Gate](KRAFT_WORK_3.0_RELEASE_GATE.md)，本报告只验收本轮兼容层、实际加载身份和发布材料。旧报告保留为此前业务回归与资源观察的依据，不将其旧 ZIP 摘要冒充本轮候选。当前入口为本报告、[玩家 Release 草稿](RELEASE_3.0.0_GITHUB_DRAFT.md)及[安装说明](INSTALL_3.0.0.md)。

## 状态与本轮范围

| 状态 | 结论 |
| --- | --- |
| Delivered / Integrated | 三个既有外观包更新、新增 CE 外观包、候选及材料准备完成 |
| Validated | 定向类型／构建／测试、Windows 原作者 CE 与 Android rebuild.30 代表性真实 Loader 检查、包身份与源码快照核对通过 |
| Known limitations | CE 全功能／内嵌普通入口、旧 ReOverfits 目标环境未在本轮验收；历史资源增长与告警仍 Unknown |
| Not validated | 物理触控、全部 Mod／设备／游戏版本、云端业务，不自动作为本轮新增任务 |
| Owner Acceptance | Pending，Codex 不宣布 Visual Gate 或 Stable 通过 |
| Release Authorization | 未执行推送、合并、Tag 或 Release；按本轮模板的明确“仅准备材料”边界执行 |

使用现有研究工作树，HEAD 仍为 `014f469f4092d246cdcd22098fc9b5a943d029b6`。本轮没有提交；旧 HEAD 不能代表当前源码。保留其它工作、历史产物与失败输出，未修改 Host 公共协议、CE 业务工作区、Stable 2.7 或公开 RC。

本轮以四个外观包完成并有代表性真实效果、原事件继续工作、总开关与清理成立、玩家说明准确为 Done；不扩成全作弊功能验收或新一轮全游戏矩阵。

## 实现

- ModHubSoftWet 0.2.5、MapleBirchSoftWet 0.2.5、DolOptimizationSoftWet 0.1.7：目标最低版本保留，UI 门槛为 >=3.0.0。Acrylic 外壳与轻内容层协调，避免多层模糊叠加；不改目标 Mod 的安装管理、云端或存档业务。
- CheatExtendedSoftWet 0.1.0：主要支持 chris81605 原作者界面，另验 102326 的 rebuild.30，二者清楚标注。完整的两级目录和设置区域结构匹配后才应用外观。独立与内嵌目录有各自合同，不因技术名相同就假定结构相同。
- 官方 UI 的现有 navigation／motion／weather 机制只接受明确列出的 full 匹配外观合同。CE 主分类接入波浪反馈，次分类沿用分类交互；没有复制第二套 Runtime，没有新增 Host API。
- 兼容包保留目标原节点、控件与事件。未知版本或结构退让；总开关关闭后撤销活动装饰与适配。隐藏设置模板中的五个声明性导航标记不属于泄漏的活动代理。
- ReOverfits 0.2.2、LyraMouthCompat051213 0.1.2 沿用原 ZIP，未虚增版本。嘴部 0.1.2 来源是独立维护包，不声称由本工作树仍为 0.1.1 的同目录源码构建。旧 Lyra 0.5.11.9 包单列 legacy，不放入当前游戏安装组合。

## 前置版本政策

最低、推荐与实测分开陈述，详见安装指南。通用目标包使用最低要求和结构检查，不精确锁死本次实测版本。Host 保留 `>=0.1.2-experimental && <0.2.0` 的协议边界；指定游戏／Lyra 资源包仍有精确门槛，不能靠放宽声明证明跨版本支持。

实际 Loader 2.101.1 将 `1.20.3.1-rebuild.30 >=1.20.3.1` 判 false，`>=1.20.3` 判 true，见证据目录 `loader-ce-minimum.json`。CE 安装声明因此采用 >=1.20.3；运行时仍检查 >=1.20.3.1 的接口基线，明确接受已知 rebuild.30，并要求完整结构。合成版本 1.20.3.2 的测试只证明最低版本分支，不是未来作者版本已实测。

## 冻结身份与构建

所有本轮证据均位于 `tests/artifacts/kraft-work-compat-20261019/`。

- 当前源码快照 `source-final.zip`，SHA-256 `6a661d9d13c5fb5cb08411c3e56b2e2f166db923a070bf88701525928e6cbd87`。
- 源树 SHA-256 `a71929feccea15a717dbd7023a8dd630fc74b5f139867940fbecc326a20b90ed`；逐文件清单 `source-final-manifest.json`。
- 当前产物仅使用 `candidate-final/` 与 `final-candidate-identity.json`，不要混用较早 `candidate/`。SHA256SUMS 覆盖九份 ZIP，其中 legacy 是单独留存品，不是当前主安装附件。
- UI ZIP：229968 bytes，SHA-256 `0cfcdcd4a6db500adbb7781e45636761cd2028b7cce55c9c1b7be92ed654865a`。
- Host 原 ZIP：6326 bytes，SHA-256 `ad78fca929e3819fce4da6f0d10affb4fc91318661583e4dacec896b64936153`；不替换同版本公开字节。
- CE ZIP：4948 bytes，SHA-256 `19e55cd527b81c5ad04b4fed7d825d0c9cd67b0c23a271497803a39509891274`。

Windows x64，沿用 Node 26.12.0、npm 11.20.0、Python 3.14.7、Vite 7.3.6、TypeScript 5.9.3、Vue 3.5.43。构建在内容寻址的独立目录完成，复用现有 node_modules，不安装依赖、不清理原 dist：

```text
npm run typecheck
npm run framework:check
node scripts/build-framework.mjs
python scripts/package-framework.py --players-only
python scripts/package-adapter.py compat/cheat-extended-soft-wet
```

最终版本策略变更后的检查见 `policy-final-*.log`；当前源树与冻结清单无漂移。此后新写三份发布／验收文档及证据，不为文案无理由重建运行代码。ZIP CRC、逐成员摘要、路径唯一性、LICENSE、无测试／APK／截图／存档混入的检查见 `final-hygiene.json`。包内容可追溯，不宣称所有 ZIP 元数据字节级重建一致。

## 当前实际验证

| 环境与输入 | 结果 | 证据与边界 |
| --- | --- | --- |
| Windows Edge，DoL 0.5.12.13／Loader 2.101.1，原作者 CE 1.20.3.1 | Passed | `windows-author-final-v2-1792341705919/result.json`；最终六包实际 Loader 成员摘要匹配；CE 独立窗口原分类点击与记忆、游戏金额／穿戴／库存不变、总开关、关闭清理、ModHub、原版优化存档外观及 Maple 云存档页面 |
| Android M367FC／Android 17／WebView 154，独立测试版，CE rebuild.30 | Passed | `android-rebuild30-final-media-1792341716117/result.json`；同一最终六包实际加载成员匹配，CE／ModHub／存档外观、开关清理通过；重启后原列表、隐藏列表与偏好恢复 |
| Windows rebuild.30 | 复用此前本轮定向结果 | `windows-rebuild30-1792340505102/result.json`；运行逻辑相同，最终版本门槛另由 Android 当前包与最低版本专项验证。不称旧组合为最终六包输入 |
| 合同与响应式 | Passed | `adapters-minimum-test.log`、`tests/kraft-work-adapters.cjs`；原控件事件／值、390／1363 宽度、未知版本／结构退让、总开关与释放。内嵌普通入口未出现 CE 目录，不能列为真机通过 |
| 共享天气／动效 | Passed | 本轮 `tests/header-weather.cjs`、`tests/official-game-motion.cjs` 的运行记录；保留此前天气和核心业务 Gate，不重跑无关矩阵 |

实际目标组合：ModHub 1.7.0、MapleBirch 5.4.3、原版优化 1.1.1.5；Windows 固定社区组合，Android 保留现场约 40 个 Loader 成员。成员数量包含基础插件，不等于所有内容 Mod 均逐项业务验收。现场测试用新建未保存进度，没有改写私人长期存档。Windows 云存档仅打开外观页，无账号输入、连接或上传／下载。

## 失败、修正与素材

所有原始失败保留，不以重跑掩盖原因：

1. 初次总开关断言误将隐藏设置模板声明标记视为活动代理；限定为隐藏设置自有节点，其它适配与装饰仍必须归零。未修改产品来迎合断言。
2. 设备断开发生于安装之前；一次 Android 原生截图超过 Node 默认缓冲区导致 ENOBUFS，恢复核对完成后把截图缓冲区调整为 16 MiB。
3. 测试清单仅排除 `/`，误纳入使用 Windows `\` 路径的 legacy 包。`actual-final-v2.cjs` 改成六个明确技术名白名单，检查文件名不得含路径分隔符；上述最终 Windows／Android 证据不含该 legacy 包。旧结果只作历史输入记录。
4. Playwright 自带录像缺 ffmpeg，没有安装依赖。首次 CDP 采样录像 48 帧实际耗时约 66 秒却编码为 6 秒，时间尺度不真实，且截图合成存在变形；**不作为最终效果视频**。保留原文件，改用 Android 原生 screenrecord 原时间尺度录像与原生截图。

最终展示素材目录 `android-rebuild30-final-native-media-1792341919082/`：属性、设置双布局、Hub、天气截图与 `weather-native.mp4`。它们来自最终六包的实际 Android WebView，天气由原 Weather API 受控准备；不是物理触控或 FPS 证明。发布前由负责人选图，检查隐私并上传后再填入真实链接。较早 Windows 素材有缺失图片，不用于首页展示。运行身份、现场恢复与媒体摘要留在对应 result／媒体清单中。

原生录像为 11.995 秒、6425257 bytes，未改变时间尺度。采集后原 Mod 列表、隐藏列表与偏好已重启核对恢复；只留下本地素材，未上传。

- [属性界面](../tests/artifacts/kraft-work-compat-20261019/android-rebuild30-final-native-media-1792341919082/attributes.png)
- [设置上下布局](../tests/artifacts/kraft-work-compat-20261019/android-rebuild30-final-native-media-1792341919082/settings-current.png)
- [设置左右布局](../tests/artifacts/kraft-work-compat-20261019/android-rebuild30-final-native-media-1792341919082/settings-other.png)
- [Floating Hub](../tests/artifacts/kraft-work-compat-20261019/android-rebuild30-final-native-media-1792341919082/hub.png)
- [原速 Android 天气视频](../tests/artifacts/kraft-work-compat-20261019/android-rebuild30-final-native-media-1792341919082/weather-native.mp4)

## 发布声明对应依据

| 草稿重大声明 | 依据 | 可陈述范围 |
| --- | --- | --- |
| Acrylic／导航／波纹／设置双布局与真实控件 | 设置输入、双布局、材质、导航／motion 定向检查；此前两平台 Gate；本轮 Android 素材 | 已适配官方窗口；视觉最终由负责人判定 |
| 晴雨雷等游戏天气 | `framework/official-ui/weather.ts`、header-weather 定向检查、两平台受控 Weather 演示 | 六类实现；不宣称所有自然天气过程均观察 |
| Hub 默认关闭及操作方式 | `src/floating/preferences.ts`、`src/floating/Settings.vue`、MotionHub 原控件及本轮展开截图 | 可选；不宣称所有设备位置落盘矩阵通过 |
| 商品购买与原报价 | 整合 Gate `windows-final-D-1792337433801`／`android-final-D-1792337458315` | 指定商品与流程；本轮不改购买业务，复用证据 |
| 衣柜穿戴／叠穿／详情抽屉 | 同上最终业务与 drawer 定向测试、R16-W01 原入口语义 | 指定衣物与槽位；不扩大为全部社区衣物 |
| 存读档、文本导入导出、2.7 升级回退 | 整合 Gate 的 final、transfer、upgrade 记录 | 保持原报告平台差异；Android 文本传输复用历史，不称本轮文件／云端通过 |
| 三个外观包及原作者／rebuild.30 CE | 当前最终六包两平台 result、输入 `ce-variants.json`、作者来源与 head 收据 | 外观、分类、输入与状态守恒；不宣称全部 CE 作弊功能通过 |
| ReOverfits／嘴部包随候选保留 | `final-candidate-identity.json` 的 origin 与成员摘要 | 原包沿用，旧 Lyra 单列；不假称本轮重做／新运行验收 |
| 许可与署名 | 各 ZIP LICENSE／NOTICE、UPSTREAM-RENDERER-LICENSE／NOTICE | MIT 与 CC BY-NC-SA 衍生部分分别保留 |

## 相比旧 CANDIDATE_NOTES

旧文件在 `kraft-work-release-gate-20261018/final-candidate/CANDIDATE_NOTES.md`，保留不覆盖。新草稿以玩家变化开头，增加实际天气、Hub 开启方法、四个当前外观包及 CE 维护归属；安装说明区分最低／推荐／实测，说明回退时兼容包也要回退。技术日志移入本报告，保留资源 Unknown、selectedWardrobe、未覆盖范围与实验战斗默认关闭。下载表明确为待发布清单，没有虚构截图／附件 URL。

## 尚需负责人决定

1. 最终视觉与 Stable 是否接受，以及是否正式授权下一步 Git 固化／推送／Tag／Release。本轮没有以版本号或文案模板代替批准。
2. 选择展示图与录像及公开存放位置；当前只提供可核对的本地素材。
3. 发布附件是否包含沿用的 ReOverfits／0.5.12.13 嘴部包；旧 0.5.11.9 包建议继续单独历史下载，不混入当前安装。

无新增已知的本轮范围内功能阻塞。未归因的历史社区告警、资源变化和有限业务覆盖仍须随正式决策保留，不能改写成全部通过。
