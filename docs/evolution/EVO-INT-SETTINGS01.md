# EVO-INT-S01 — 已认可设置 V2.3 接入研发实际入口

2026-10-23。输入 `34f4217e8e3278b44623bf20e9df692a771f6f90`，分支 `dev/evolution-4.0`。开工工作区干净，与已获取远端一致；沿用独立 worktree。负责人继续 UI 主线指令与 Evolution V1.2 授权覆盖本片。CI 缺陷由独立聊天负责，本批不修改工作流、Runner、版本合同或保护规则。最终实现提交、推送和实际 CI 链接记录在 [Issue #22](https://github.com/102326/DoL-Game-UI/issues/22) 本批记录；本文不自填自身提交 SHA。

## 1. 实际完成

| 编号 | 结果 | 边界 |
| --- | --- | --- |
| EVO-INT-S01 | 设置实际 controller / Vue / 生产 CSS 使用已认可 V2.3 | 只接设置，不推广其它窗口 |
| EVO-A2/A3 | 继续使用 sourceMotion / visualScope，退出旧开窗代理、独立环境/材质节点及其测量/释放路径 | 不改 Host / UiApi；其它消费者默认 easing 不变 |
| EVO-G1-PREP | 针对共享资源和设置取消、输入、原生关闭、重建进行技术复核 | 无全局 G1 裁决；不以首片替代全局验收 |
| EVO-EVID-S01 | 固定旧源码行为反例、当前正例、白名单失败现场、当前源码原速录像 | 不采集游戏 HTML 或存档；不是实机/完整旧新版视觉对照 |

开关为 **100/80ms 线性透明度**，正文立即可用；反向动作从当前透明度接续，剩余时间按距离缩短。分类完整移植已认可的 **620ms、cubic-bezier(.16,1,.3,1)** 折转/位移/裁切帧，不因本轮集成重新设计节奏。真实壳承载已认可静态表面，无开窗分层代理；保持该基线无 backdrop-filter 的选择。偏好、布局、模态屏障、Zoom、原事件和焦点合同保留。没有新增生产依赖。

## 2. 实际修复与反向证据

新增 `tests/evolution-settings-integration.cjs`，挂入现有 `tests/settings-ci.cjs`，不另建 Runner。固定输入 TS/Vue 三文件，CSS 使用当前生产构建，因此反例是**旧行为回归**，不是完整冻结旧视觉。

| 组 | 固定输入 | 当前 | 含义 |
| --- | --- | --- | --- |
| 认可时序、真实输入、单一材质 | FAIL：300 ≠ 100ms | PASS | 输入尚未集成新时序，不能包装成产品缺陷 |
| 途中关闭/重开透明度连续、最新打开获胜 | FAIL：反向跳变 | PASS：0.45→0.45、0.325→0.325 | 先取当前值，再取消旧动画；沿用失效票据 |
| 关闭/原生关闭取消分类、只余一个页面 | FAIL：残留转场标记 | PASS：0动画、无标记、1页面 | 同时取消分类与布局；Vue 回调幂等、节点级取消 |
| 快速分类、关闭动画、减少动态、隐藏、resize、卸载 | PASS | PASS | 有效原约束继续保留 |
| modeless 输入与窗口替换释放暂停动画 | FAIL：paused ≠ idle | PASS | 旧 dialog 卸载前取消 owned shell 动画并使旧关闭回调失效 |

[完整受控摘要](../media/evolution-settings-s01/validation.json)保存源码、测试和 CSS 摘要及实际环境。当前 **5 PASS**；输入 **4 FAIL / 1 PASS**，其中只有三项是上述生命周期缺陷。固定输入命令返回非零是预期拒绝，未计为正常套件成功。

受控失败通过已有 settings 白名单采集第一失败页的断言、视口、运行/源码身份、`integrationCase` 和截图；外层不会以另一页覆盖。实际本机样例约2KiB JSON＋41KiB JPEG，保存在忽略的测试目录，不上传玩家内容；它展示时序目标不匹配，不伪称另一个产品缺陷。

## 3. 验证范围与实际结果

本机 **macOS / Node24.18.0 / Chromium153.0.8010.12 / Python3.9.6**。输入 HEAD＋工作树摘要绑定实现，最终提交另经 Actions 验证；本机与 Linux、Windows、WebView 分开记录。

| 命令 | 实际结果及范围 |
| --- | --- |
| `npm run ci:check` | PASS，类型与 Framework 合同 |
| `node scripts/build-framework.mjs` | PASS，真实生产 CSS / UI / Host 构建 |
| `node tests/settings-ci.cjs` | PASS，原双布局/长滚动/输入屏障/偏好持久化/资源释放，含新增5组 |
| `node tests/evolution-settings-integration.cjs` | 5组 PASS；`--baseline` 4拒绝/1通过，预期非零 |
| `node tests/moody-historical-regressions.cjs` | PASS：合法延迟、旧错误采样、真实残留、Orbit 几何及共享 CSS 反例 |
| `node --test tests/visual-scope.test.cjs tests/evolution-resource-contract.test.cjs` | 2个测试入口 PASS，共享原语及防回退合同 |
| `node tests/evolution-owner-resources.cjs` | 13个实际入口 PASS；不是13台设备 |
| `node tests/source-motion-lifecycle.cjs` | PASS，peer/节点/迟到回调释放 |
| `node tests/game-first-motion.cjs` | PASS，游戏原事件优先 |
| `node tests/motion-workspace.cjs` | 5组 PASS，工作区输入与生命周期 |
| `node tests/official-game-motion.cjs` | PASS，正式原生窗口受控回归 |
| `MOODY_EVIDENCE_ID=settings-s01-mac python3 scripts/check-ci-packages.py build` | PASS，八包构建 |
| `MOODY_EVIDENCE_ID=settings-s01-mac python3 scripts/check-ci-packages.py` | PASS，八包合同、两轮独立编译打包/快照一致及7类负例 |
| `node scripts/record-evolution-settings.cjs` | PASS，两视口原速、真实设置源码、原事件恢复、无页面错误、来源摘要一致 |

构建命令首次 `npm run ci:build` 因本机无 `python` 命令失败，随后明确用 `python3` 执行既有检查器通过，没有改项目命令掩盖环境差异。制品检查首次还正确拒绝旧目录残留 ModHub1.0.0；整份旧输出已移入忽略目录保留，清洁输出重跑才通过。没有删除旧制品或更新正式 Release。

历史延迟关闭夹具原为220ms×4＝880ms。新80ms若仍乘4只剩320ms，会使原450ms采样不再落在关闭途中；本轮将注入按实际时长归一到**相同880ms**，原450ms采样、终态与精确拒绝断言均保留，未延长产品动画或放宽门槛。

`tests/settings-modal-scroll.cjs` 已适配真实材质壳、保留原输入/滚动/重建断言并改用现有浏览器配置，**只做语法核对，未执行**：本机缺 `tests/fixture.html`。纯第一方夹具中的同类输入检查通过不能替代该真实游戏夹具检查。

补充 `ui-runtime` 套件既有运行时2.7.0／包3.0.4身份断言问题沿用输入记录，本片不修改、不将该套件称全通过；交由 CI 专项处理。

## 4. 展示与可复现来源

- 启动当前源码：`node scripts/preview-evolution-settings.mjs`，默认 `http://127.0.0.1:5192/`；先构建 Framework CSS。
- [桌面截图](../media/evolution-settings-s01/desktop.png) / [窄屏截图](../media/evolution-settings-s01/narrow.png)。
- [桌面原速10.64秒](../media/evolution-settings-s01/desktop-1x.mp4) / [窄屏原速9.56秒](../media/evolution-settings-s01/narrow-1x.mp4)。
- [操作时间、环境与输入摘要](../media/evolution-settings-s01/result.json) / [五项媒体摘要](../media/evolution-settings-s01/manifest.json)。媒体索引总计2,339,026字节，重算一致；上述 validation.json 单独提供，不混入五项媒体索引。

两种 CSS 视口1280×900、390×844，DPR1，同操作序列原速录制，无剪掉等待或视频提速。它们展示**当前真实设置源码在第一方模拟正文中运行**，不是完整游戏、真机或旧新版并排对照。已认可旧新版原型媒体仍冻结保留，不改写来源。

演示页首次发现 mock 的通用 `main` 样式污染设置内部布局；已限定到演示容器并重新录制、逐项重算和视觉核对。此问题不在产品运行源码，不包装成产品缺陷。预览背景与偏好在独立本地来源，不读取游戏数据。

## 5. 没有完成与下一步

本片为 **Implemented / Controlled Tested / Integrated（研发设置首片）**。视觉认可引用原 V2.3 原型，不自行授予新全局验收。未合并 main、发布4.0、改 Tag/正式 ZIP、变更 Host/API、修改 CI 规则/bypass；天气 C5.2/R10 与球体/Hub 尚未正式接线，其旧呈现路径不抢删。

G1仅做设置和共享资源的技术准备，独立代码复核未发现本片阻断，不代表全覆盖裁决。真实游戏/ModLoader、多Mod、Windows、Android/iOS/WebView、触摸/键盘/系统缩放和并窗长期性能仍未验证。真机参数采集等负责人方便后继续，不阻断本片受控证据。

接手先核对 HEAD/dirty/unpushed/远端与依赖；从本片真实设置入口验证游戏输入、焦点及回退，再按授权安排天气/Hub的独立正式接线，继续逐项验证和退出旧路径。CI专项与 UI 主线分工保留，不扩大模拟矩阵，也不把已有 CI 成功记录当 G1/G2/G3或 Release Ready。
