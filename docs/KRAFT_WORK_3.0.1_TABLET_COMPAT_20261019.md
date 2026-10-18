# Kraft Work 3.0.1 · 平板兼容与发行核对

日期：2026-10-19。当前依据是本轮最后候选，不以旧研究 HEAD、历史截图或第一轮预览包代替。

## 范围与状态

| 状态 | 结果 |
| --- | --- |
| Delivered | 战斗全部展开与模式保存、聚焦页面滚动；ModHub 管理／帮助／工具菜单；存档三页页头与传输材质；日志可用物品；唯一 3.X 运行视觉基线；六个 1.0.0 兼容包与玩家发行文档 |
| Validated | Windows 类型／合同、单元、受控交互、材质、构建与包检查；Android 实际 Loader 安装、原生 App 重启、运行成员摘要、三页存档、ModHub 和日志可用物品；真实战斗页面合成触控上下滑动 |
| Not validated | 物理手指输入、真实 iPad Safari、所有 WebView／Mod 组合、新包所有交易／战斗回合、全部云服务与作弊操作；本轮平板未安装 ReOverfits 目标 |
| Known limitations | 原生 Select 自定义弹层取决于引擎；历史 selectedWardrobe、社区告警与长期资源变化的未归因部分保留 |
| Owner Acceptance | 不代替负责人作最终视觉评价，不宣称 Visual Gate Passed |
| Release Authorization | 负责人明确批准修复验证后推送并发布 3.0.1；同步另一 App 为随后独立步骤，需识别实际目标 |

## 实际环境

本轮以已授权平板独立测试 App 为准：DoL 0.5.12.13、ModLoader 2.101.1、Android 17、WebView 154，ModHub **1.7.6**、MapleBirch **5.5.0**、原版优化 **1.1.1.5**、独立维护 Cheat Extended **1.20.3.1-rebuild.30**。并非按猜测的 4.4／旧框架号开发。目标原包和加载顺序保留。

Host 使用公开 0.1.4-experimental 原 ZIP，公共协议未修改。当前 CI 重打包 Host 的 README 不同，故 ZIP 摘要不同；其 index.js、boot.json、LICENSE 与公开原包逐成员相同。发行仍使用公开原包，不替换为重打包字节。

## 修复与依据

### 战斗

根因之一是“全部展开”只改变会话模型，没有写回已有偏好来源；下一次进入可重新采用旧聚焦偏好。现在通过现有主题 API 保存 `combatFocused`，新默认仍为 false，不强制重置其它已保存的关闭选择。

聚焦编辑区取消独立高度上限和滚动封闭，交给正常页面滚动。最后 UI 的实际战斗页面中，CDP 合成触控向上滑动使窗口位置从 793.2 到 935.2 CSS px，反向滑动恢复到 793.2。原输入／Select／Continue 节点、单选状态、Select 值和回合数不变；结束时恢复全部展开。没有点击 Continue；这不是物理触控或新回合结算证明。

### ModHub

更新提示中的全宽按钮挤压同排正文，造成竖列；修正原生宽度、换行与统计卡片布局。固定工具栏使用稳定承载层，避免列表文字穿过。补齐帮助页结构识别。

1.7.6 会将更多工具菜单移到 body。新增仅针对该实际菜单的既有 StyleAdapter 注册，保留原定位、事件和焦点处理。初次指纹误匹配多个按钮，严格唯一性检查判为 partial；随后改成首行明确锚点，没有放宽 Runtime 合同。

真实管理页、说明、日志、帮助和 body 菜单通过；窗口无横向溢出，提示正文约 795.6 CSS px 宽，工具菜单位于视口内。未执行第三方安装、删除、重排或启停业务。

### 存档三页

原存档管理页的标题由列表 Vue App 持有，切到传输或云端后会被卸载。现在页头由既有 saves 生命周期管理，列表、原生传输控件及明确匹配的 MapleBirch 云端页面共享同一标题；未知云端结构不接管。

导出页之前仍被另一条旧高优先级规则加上 `.78` 正文叠层，且原生重要按钮背景覆盖新规则。已移除旧传输材质块，调整实际按钮样式，三页正文不叠加模糊或灰板。最后真实 Android 三页各恰好一个“存档管理”页头，无横向溢出；传输按钮高度约 46.4 CSS px，背景 rgba(16,18,21,.44)。

曾以开始页传输按钮和材质参数作为修复依据，负责人仍指出缺失页头；本轮随后按实际反馈补齐结构，旧截图不作最终完成依据。

使用原生读取按钮载入隔离测试 App 现有进度，用于查看日志。没有保存、删除、文件导入／导出或云端写入。开始页最终传输截图无存档码，作为公开展示。

### 日志与 3.X 默认外观

实际 `journal` 页的 `.usableitems` 是原生渲染内容。保留原物品、图标与语义颜色，采用当前内容岛和响应式布局，“可用物品”页签加入已有波浪装饰合同。最后实测正文层 rgba(13,14,17,.22)、卡片 rgba(29,30,34,.72)、14px 圆角，无横向溢出。

旧 midnight／Eyes 根入口迁出，旧颜色来源及断言以文本形式封存在 `docs/archive/visual-2x/`，不进入运行导入或 ZIP。当前 native／surfaces 和模块基础配色已改用 3.X。布局、滚动、输入、配置身份和恢复原游戏的代码保留；没有恢复封存主题的开关。`kraft-work-baseline` 阻止旧根入口与已退役基础调色板回流。

## 最小充分验证

- `ci:check`、12 项 `ci:unit`、构建、ZIP／依赖／许可与损坏包负例通过。
- 18 项受控浏览器 CI 组通过；最后公共样式／页签小改后另跑实际构建默认值、3.X 基线、原生动效、战斗、衣柜抽屉、集合和材质定向检查。GitHub 最终提交的 CI 单独确认，不把旧提交运行冒称最终通过。
- Windows 存档视口覆盖 2K、平板、窄屏与低高度窗口，100% 字号、抽屉／非抽屉及重载偏好，底部原控件实际可命中。不是物理 iPad 验收。
- Android 使用原 Loader 安装 API，备份旧自有包和清单，校验存储 ZIP 与启动后实际脚本／样式成员。最后主 UI 和所有适用自有兼容包已安装；原生重启后默认全部展开，Hub 显示。ReOverfits 无目标，未强行安装。
- 模式持久化存在一次“写偏好后立即 force-stop，读回旧 true”的失败，保留。等待写入并核对后，后续原生重启为 false；未将该现象根因宣称已解决。
- 一次 Page.reload 触发工具 DocumentChanged，保留失败；重新绑定后核实运行成员，没有盲目重复操作。
- [首次最终提交 CI](https://github.com/102326/DoL-Game-UI/actions/runs/39161341795) 在设置快速切换后固定等待 700ms 的采样点失败，未创建 Release。Windows 诊断记录显示转场完成／取消回调负责移除离场节点；不能从该采样点推定永久残留。测试改为有界等待实际转场结束及唯一正文，再保留无 inert、正确分类、控件可用和无输入泄漏断言。没有修改运行代码，也没有把失败记录覆盖为通过。后续最终提交 CI 的结果单独核对。
- [第二次 CI](https://github.com/102326/DoL-Game-UI/actions/runs/39161721706) 的设置检查通过，随后聚焦战斗导航的横向边界检查失败。定向诊断确认 display:contents 容器返回零尺寸，原 OrbitFocus 生成 NaN SVG 坐标；原独立夹具还遗漏实际共享焦点 CSS。修复为使用装饰层真实定位祖先计算与观察尺寸，零尺寸时清空旧几何；夹具加载同一共享样式，并增加窄／宽切换后的有限坐标和按钮对齐检查，不放宽溢出断言。此次运行代码变化重新构建并复验，最终包摘要按后续冻结记录更新。
- 现场准备期间页面被人工切走，几个带场景前置检查的脚本明确拒绝操作；重新观察正确页面后继续，没有把前置失败计为通过。

本地原始证据在忽略目录 `tests/artifacts/kraft-work-maintenance-20261019/`，不公开游戏 HTML、第三方包或测试进度。最终安装目录为本地清单中最后一个 `tablet-release-last-3.0.1-*/`（以记录的 ZIP 摘要核对，不复用旧目录），最新三页结果为 `current-mods-20261019/save-three-tabs-final.json`，日志为 `journal-items-final.json`；最终战斗检查为该目录最后一次 `tablet-combat-regression-*.json`。中间输入和失败报告保留。

## 最终发行字节

以下均为玩家运行包；开发记录仅留在仓库，图片仅在正文与首页展示，不作为 Assets。发布后将远端附件逐项与这些摘要核对。

| 文件 | SHA-256 |
| --- | --- |
| DoLGameUI-3.0.1.mod.zip | `8e9b5903bf55fc2aaffddc9878e245e159794ab9d1b7d81564400d63385f2527` |
| ModHubSoftWet-ModHub-1.3.0-plus-v1.0.0.mod.zip | `df6356be81f8def8ed22b69aa2e04069a4e027a20b31e9c23aba79322a80b041` |
| MapleBirchSoftWet-maplebirch-5.2.3-plus-v1.0.0.mod.zip | `b3baa723027bc20e815677133e9b5e7b0082f8cb13deb5240c49e3ddb569f13a` |
| DolOptimizationSoftWet-Optimization-1.1.1.2-plus-v1.0.0.mod.zip | `71aa281a2900ffd97958798a3d73012632c0d855efe924fba915c0f8ce62e371` |
| CheatExtendedSoftWet-CheatExtended-1.20.3-plus-v1.0.0.mod.zip | `ba8f17fb23f1c81214266ceb4ce3150bed0133b3e2904b856c4984a9e83c68f9` |
| ReOverfitsSoftWet-ReOverfits-4.1.1-plus-v1.0.0.mod.zip | `78eb0061d06972645d1c48e039be8b3d935f2710fddf83eb5b094f2b59a6efdb` |
| LyraMouthCompat051213-Lyra-0.5.12.13-v1.0.0.mod.zip | `71080a79771149a0edf80cc66943518645835e1b6259a01e23869d6da2a34974` |
| StoneFreeHost-0.1.4-experimental.mod.zip | `ad78fca929e3819fce4da6f0d10affb4fc91318661583e4dacec896b64936153` |
