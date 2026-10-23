# EVO-MAT-READ01 — 设置底材可读性研究交付

2026-10-23，研发分支 `dev/evolution-4.0`。结论：**研究候选已交付，暂不接入默认材质。** 背景文字边缘受到抑制，但桌面短时帧间隔明显增加；未解决性能问题，不提交视觉通过或发布就绪结论。负责人要求本轮提交、整理交接后切换设备，本轮停止扩展实验。

## 做了什么

1. 定位透字：实际 `src/theme/settings-workspace.css` 的玻璃壳为约85%不透明底色，并显式 `backdrop-filter:none!important`；不是新增霜层造成的文字像素变化。旧3.x虽然有模糊规则，已被当前设置工作区覆盖。
2. 建立单层背景模糊候选：仅专用预览服务追加 `blur(24px) saturate(.9)`，只在玻璃偏好开启时生效。底色、几何、控件、100/80ms开关、620ms分类、雨雪算法和默认预览均保留。没有对多个子面板叠加模糊。
3. 在真实设置组件与第一方背景上生成同视口、同操作顺序、原速旧/新对照。背景文字在公开截图/录像中保持可见；标题显隐仅用于独立像素差分测量，不能用隐藏背景制造画面通过。
4. 手动研究检查复用现有W01九组健康断言，检查布局、真实控件、玻璃关闭整窗同一性、雨雪保护区和关闭后原生动作。新增逐轮原始截图、失败现场、源码hash、受控文件白名单和16MiB硬上限。未把研究脚本加入默认CI矩阵。
5. 完成8项旧/新、桌面/窄屏、雨/雪各6秒短时观测，并做三种单变量假设对照；保留不理想的性能数据，没有删断言或调整阈值制造通过。

## 交付文件和启动

- [候选与启动说明](../../prototypes/settings-acrylic-v1/README.md)、[比较页面](../../prototypes/settings-acrylic-v1/compare.html)、[唯一候选CSS](../../prototypes/settings-acrylic-v1/readability.css)。
- `scripts/preview-evolution-acrylic.mjs`：隔离Vite服务器；`scripts/check-evolution-acrylic.cjs`：功能、像素与录制；`scripts/measure-evolution-acrylic.cjs`：短时帧间隔/天气JS绘制观测。
- [公开结果](../media/evolution-acrylic-read01/result.json)、[媒体摘要](../media/evolution-acrylic-read01/manifest.json)：12PNG、2MP4、结果JSON共15项索引，加manifest共16文件 **5,450,594B**，逐项大小与SHA256已核对。
- 桌面原速：[当前18.12秒](../media/evolution-acrylic-read01/current-desktop-1x.mp4)、[候选15.68秒](../media/evolution-acrylic-read01/candidate-desktop-1x.mp4)。操作顺序/等待计划相同，真实事件时间已记录；启动/编码/运行等待有差异，不是逐帧同步、等长剪辑或加速录像。
- [8项性能观测](EVO-MAT-READ01-OBSERVATIONS.json)、[三个假设及复现方法](EVO-MAT-READ01-HYPOTHESES.json)随源码同步；临时原脚本、可见/隐藏标题见证截图及原始日志仅本机忽略目录，不假定另一设备可取。

录制另需系统PATH中的FFmpeg，时长核对使用ffprobe；它们不随npm安装。没有这些工具可先看已提交媒体，不把录制未执行记为PASS。

在仓库根目录按锁安装依赖、构建Framework后启动（Node >=22.12，22需启用strip-types；本机Node24无需额外参数）：

```sh
npm ci
node scripts/build-framework.mjs
node scripts/preview-evolution-acrylic.mjs
```

访问 `http://127.0.0.1:5197/prototypes/settings-acrylic-v1/compare.html`。当前参考需另开README中的5196服务；新设备没有继承本机端口。原速媒体随Git获取后也可直接观看。研究检查按需运行：

```sh
node scripts/check-evolution-acrylic.cjs
node scripts/measure-evolution-acrylic.cjs
```

## 实际验证与源码身份

本机 macOS / Node24.18.0 / Playwright Chromium153.0.8010.12；均为受控第一方页面，无游戏、玩家存档或第三方HTML。

| 命令或核验 | 实际范围和结论 |
| --- | --- |
| `npm run ci:check` | 同步3e6e039后最初缺新增@types/node，按锁`npm ci --ignore-scripts --no-audit --no-fund`后通过；严格CI TS、生成锁、类型与Framework合同通过，未改锁文件 |
| `node scripts/build-framework.mjs` | 同步后构建通过；不是打包/发布或本轮八包重验 |
| `node scripts/check-evolution-acrylic.cjs` | 输入3e6e039加当前隔离研究文件，最终PASS；53个源码/构建CSS摘要前后一致。1280×900/390×844、DPR1、晴/雨/雪、真实输入、关闭、同一布局/玻璃关闭像素；复用W01九组全部通过，无pageerror |
| 像素见证 | 桌面标题高频边缘73212→10047.12（下降86.3%）；窄屏74178→11171.94（下降84.9%）。标题差分总量仍非零，背景仍在；该指标不是主观可读性或画质验收 |
| `node scripts/measure-evolution-acrylic.cjs` | 历史输入d60ccc8加隔离研究，8项各6秒观测完成；单天气owner/单帧、保护区0、关闭poll归零。PASS只表示观测/生命周期完成，没有设置或通过性能预算 |
| 独立只读审查 | 核对研究入口、默认隔离、媒体/hash和失败证据；P2失败现场未独立保留已修正。其失败分支后续为静态复核，未做注入故障运行，不伪称完整负例验收 |

性能观测仍标注原d60输入，**没有重标为3e6e039结果**。同步CI后53项相关输入中变化为检查脚本（补启动失败收口）、`framework/official-ui/main.ts`（CI身份，不被此预览导入）、`package-lock.json`（@types/node）和W01测试注解；实际theme/weather/候选CSS/默认及候选预览、构建CSS保持相同摘要。新功能/媒体检查已在3e6e039重跑；没有为仅CI身份/注解变化重跑8项性能观测。

真实失败也保留：初版手动脚本曾误取snapshot.kind、漏转发browser.version，均为研究工具失败、不是新产品缺陷；修正后重跑。同步后首次浏览器复验被macOS沙盒的MachPort权限阻止，未执行断言；没有当作通过。随后使用允许的外部浏览器执行完整检查通过，同时补齐启动失败写FAIL与无PASS清单的路径；该启动失败收口补丁仅语法/静态核对，未再次注入失败复测。本轮默认S01的`backdrop-filter:none`合同保持，不能宣称候选通过了这条互斥合同。

## 未解决的性能问题

8项观测：不录像，顺序运行，宿主其它活动未控制；rAF间隔不等于GPU完成耗时或物理设备FPS。

| 视口/天气 | 当前rAF中位/p95 ms | 候选rAF中位/p95 ms |
| --- | --- | --- |
| 1280×900 雨 | 16.7 /16.7 | **33.3 /50.0** |
| 1280×900 雪 | 16.7 /16.8 | **33.3 /33.4** |
| 390×844 雨 | 16.7 /16.8 | 16.7 /16.8 |
| 390×844 雪 | 16.7 /16.8 | 16.7 /16.8 |

天气JS绘制中位约1–2.1ms，不能解释全部桌面差异，也不能据此认定GPU根因。旧窄屏雪天单次最大116.7ms/104ms长任务也如实保留，不排除异常来美化数据。

三组桌面雨天假设（3.5秒预热，穿插当前对照）：

- 将模糊移到壳伪元素：中位仍约33.3ms；前后当前对照约16.7ms，未解决。
- 将模糊移到dialog `::backdrop`：中位仍约33.3ms，p95约50ms；未解决。
- 半径4/8/12/16/24px：较小半径的中位有改善，但p95仍约33.4ms，样本数少于对照；16/24更差。没有采用“降低半径即修复”的结论。

这些只是短时headless单变量观察，缺目标浏览器真实合成/GPU trace、长期和实机证据。现阶段阻塞本候选默认接入，不阻塞已通过边霜或其它独立工作。换设备后优先在目标浏览器核对；不要先扩大矩阵，也不要降低已认可天气品质来换绿色。

## 明确没有做

| 项目 | 状态 |
| --- | --- |
| 默认设置材质替换 | **未做**；当前无blur底材继续运行 |
| 候选性能修复 / 材质视觉通过 | **未完成 / 未取得**；上面的PASS不代表两者 |
| 其它窗口或材质角色推广 | 未做 |
| 全设备/Windows/WebView/GPU/长期并窗验收 | 未验证；本机Chromium不是实机 |
| 完整游戏、真实ModLoader/多Mod/玩家存档 | 未验证/未读取 |
| 默认CI新增READ01入口 | 未做；这两条新脚本仅手动研究 |
| main、正式版本、Host API、保护/bypass、Tag/Release或正式ZIP | 未修改 |

本批 Implemented=隔离候选，Tested=表列受控范围，Visually Accepted=false，Integrated=false，Release Ready=false。结霜认可不自动扩展为材质或全局G2/G3认可。下一设备按[当前交接](../HANDOFF.md)检查身份/环境和现存CI，再决定是否继续此方向。
