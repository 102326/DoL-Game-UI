# Stone Free R14：正式 UI 整合与业务覆盖

2026-10-17。基于 R13 本地提交 `1d77b4d8a57df66e4961e3c3294488624bd05bf8`，分支 `research/stone-free-3.0-framework`。本轮约定范围 **Completed，覆盖有限**；候选 `3.0.0-lab.14` 不是正式 3.0。仅本地提交、构建与隔离检查，没有推送、合并、Tag 或 Release。

## Delivered

| 主线 | 本轮交付 | 边界 |
| --- | --- | --- |
| M0 | [正式功能覆盖矩阵](STONE_FREE_3.0_R14_COVERAGE.md)，逐项对照正式2.7和当前官方消费者；研究包补入设置/可选适配说明 | 正式2.7使用标签解引用后的提交`965afcf119260886319f5beb6616362acb306a09`，不拿旧main代替 |
| M1 | 属性导航、通用面板导航、存档自有Vue接入公开Host挂载/释放；Settings/Attitudes区分Passage与持久overlay | 原内容、状态、事件保留；主题、侧栏和API服务由主消费者统一退出，不造空mount |
| M2 | 普通送回衣柜1–10件结果核对；仅原数量滑块可在其它上下文不变时更新报价绑定；确认后重新浏览清除旧成功提示 | 原版扣款/入库执行，套装和未知目的地不扩展确认；unknown不自动重试或静默消除 |
| M3 | 原版双人Combat Demo：切换目标、重新选择原动作、连续三回合、退出及准备页重入 | 未改战斗算法，也未把演示变成自然遭遇/完整结算证明 |
| M4 | Hub分别保存衣柜和商品会话显示副本；离场标记过时、只能清除；比较/返回上下文保留 | 不保留旧DOM、游戏对象、业务回调或可重放动作；不持久化快照 |
| M5 | 修正存档隐藏释放与已知export入口识别；修正衣柜误收全局弹层导致菜单不可见 | 无存档格式/metadata/迁移修改，无实际保存、读取、重命名、导入、导出 |
| M6 | 沿用Eyes/Ocean/Acrylic、原语义运动及减少动态效果；宽窗/受控窄窗/平板整合，重复进入资源观察 | 没有新主题、全局输入管理器或性能平台，不声称长期泄漏/物理手机验收 |

### 三项实际风险修正

1. `src/wardrobe/main.ts`原先把Passage的`#customOverlayContainer`也搬入隐藏的原版信息区。菜单DOM存在但祖先`hidden`，原设置、特质和存档均可能不可见。本轮与原header/footer一样保留已知弹层容器的原位置；没有把它搬到新Portal。最终流程直接在衣柜内开菜单，不用切回卧室规避。
2. `src/saves/main.ts`原onclose只关闭详情，列表UI可能继续驻留；又缺少仅class/style改变时的通知。现在原关闭事件安排刷新，并仅观察已知overlay、其父级、saveList及列表容器的可见性属性；隐藏释放，重开重挂。销毁时移除该观察与原订阅。原Source和metadata算法未改。
3. 原多件range会原地改数量/价格文字，却不换原购买节点。原报价防陈旧校验因此持续拒绝。`src/shop/source.ts`仅在原range唯一、数量1–10、原State/定义身份和其它报价上下文不变时更新未消费控件的绑定。已消费、换钱、换定义、换场景均不能复活。不是通用重新绑定。

`src/saves/transfer.ts`另补原生`data-overlay=export`入口。仍只识别已知文件/文本控件结构，未知云端结构退让。现有输入、值和事件不替换；有限的历史工具区移动及恢复策略保留，不推广成新页面默认方式。

## Validated

### 源码、组件与制品

Node26.12.0、Python3.14.7、现有锁文件/依赖；没有安装或升级工具。`npm run typecheck`、`npm run framework:check`、`npm run lab:check`、研究构建/打包及独立经典Vite构建通过。

本轮已执行的定向检查：

- `tests/panels-framework.cjs`、`characteristics-framework.cjs`：自有导航启停、原节点替换、owner退出、同伴保留及经典路径。
- `tests/saves-framework.cjs`：Host挂载、class/style隐藏自动释放、重开、详情、原列表替换、owner退出、metadata钩子清理及经典路径；没有保存/读取派发。
- `tests/shop-quantity-source.cjs`：原数量报价更新、不可复活已消费操作、上下文变化拒绝、两件完整与部分入库结果区分。
- `tests/shop-transaction-lifecycle.cjs`：浏览器键盘操作原range到2，再点原购买外壳一次；夹具扣款/两件入库、unknown重放拒绝、不支持路径和经典路径。夹具结果不作为真实游戏结果。
- `tests/shop-transaction.cjs`、`shop-source.test.cjs`、`shop-stone-free.cjs`：原报价/场景保护、已确认与unknown、参考/失效/回退。
- `tests/save-transfer-lifecycle.cjs`：已知export结构实际适配、同一输入身份/值/回退恢复。
- `tests/saves-header-lifecycle.cjs`、`saves-source-m4b.cjs`、`shop-pagination-package.test.cjs`：列表/V2/200%布局，来源/metadata边界，早期入口与四项补丁。

上述检查的相关输入未变时不重复执行。后补衣柜修正由最终真实Loader脚本中的“全局弹层不得进入隐藏原版区”断言、菜单实际rects及原位存档打开覆盖。

旧`tests/settings-lifecycle.test.cjs`因缺本地`tests/fixture.html`未运行成功，不修建历史测试环境；与其相关的偏好迁移/局部重置复用2.7有效历史证据，本轮只新增实际设置入口/总开关/回退检查。不能称全设置业务重新验收。

### 真实 Loader 与原生业务

执行脚本`tests/framework-official-r14.cjs`：Windows Edge156，1280×900及受控390×844；平板M367FC / `0509B830099C3540`，独立包`com.vrelnir.dol.lyra.uicompat051213`，Android17 / WebView154.0.8037.58，1363×876 CSS视口。DoL0.5.12.13 / ModLoader2.101.1。

两端实际Loader启用Host0.1.1、NativeStatus同伴、官方lab14及TweeReplacer1.7.0；从原Start入口建立全新隔离测试游戏，未载入私人进度。商店/演示入口用原Engine准备，预算由原money宏准备；后续购买及回合由原控件和原宏执行。没有伪造Passage事件、交易handler或库存结果。

最终收据（以下均`passed`，对应本页最终ZIP摘要）：

- Windows：`tests/artifacts/stone-free-r14/desktop-1792231613490/result.json`。
- Android：`tests/artifacts/stone-free-r14/android-1792231613493/result.json`。
- Android恢复：同目录`restore-verification.json`，重启读回原active/hidden Mod清单与UI偏好完全相同。测试包删除；未覆盖正式安装、存档或GER Store。

| 检查 | 实际结果 |
| --- | --- |
| 衣柜参考、普通/空间模式、浏览/焦点上下文、自然退出重入 | 两端通过；Windows另核对原单击穿戴 |
| 原属性、特质、统计、成就、日志、options、社交overlay | 两端在衣柜内实际可见；导航公开mount，关闭释放 |
| 官方设置/总开关/原options局部回退 | 两端通过；390px设置边界为受控浏览器证明 |
| 存档列表/V2/关闭 | 两端原12行，公开mount存在，切换V2、关闭释放；`dispatch:false` |
| 导入导出外观 | 两端原export入口及同一saveDataInput；`dispatch:false` |
| Settings Passage | 自有passage导航挂载；原Engine切回Bedroom后释放。没有测试原Return链接的自然返回目标 |
| 普通多件购买 | 两端发卡/head/hairpin×2，原金额100500→99500，目标衣槽长度0→2、同variable数量0→2，显示confirmed；一次派发 |
| 余额不足 | 原money宏将测试余额准备为0后重选商品，原购买链接不存在、库存摘要未变；没有派发一次注定失败的购买 |
| 商品参考离场 | Hub显示已离开来源场景，仅清除按钮，无旧购买动作 |
| 双人战斗目标/回合 | 原Add human两次，目标0→1，原动作重新选择后`leftchest`；原计数11→12→13→14，均仍在Combat Demo |
| 战斗状态变化 | Windows enemyarousal67.66→97.66→128.66→178.66；Android28.66→35.66→48.66→72.66。这是原状态观察，不是UI预测 |
| 退出/重入 | 原Bedroom退出后combat1→0，动作清空；原准备页demo存在、无残留combat挂载 |
| 官方消费者退出 | 两端只剩NativeStatus同伴，其公开来源仍可读；原衣柜节点恢复 |
| 新鲜经典入口 | Windows使用本轮经典输出，2.7.0/API1，无官方Host owner或参考组件 |

三次traits开/关循环：两端保留进入前仍有效的唯一wardrobe挂载、4项官方claim，来源运动ghost均0。仅证明该序列资源未累积，不是长时间内存/性能证明。

Android图片来自同一设备ADB screencap，Windows为Playwright截图；不把CDP或locator操作称作物理触控。

## Experience Findings

多件购买不再因数量更新被旧报价持续拒绝，成功提示具有原扣款/入库依据；重新浏览不会一直留着旧成功状态。原余额不足行为继续显示，UI不制造可购买假象。衣柜内的原菜单重新可见，是比增加动画更直接的操作收益。

衣柜和商品的A可分别留在Hub作显示参考；离场后清楚标记可能过时，避免暗示仍能穿戴/购买。比较、返回和本轮新增快照继续用已有Ocean、Acrylic、轻卡片和来源运动，没有让正文或原业务按钮持续移动。

代表性截图位于最终收据目录：`native-settings.png`、`native-export.png`、`shop-native-purchase-confirmed.png`、`hub-shop-copy.png`、`combat-native-selection.png`。原图只留本地证据目录，不混入安装包。

## Architecture Findings

Host实现、连接器、协议及API v1未变。更多官方自有UI使用公开mount/claim；persistent overlay和passage导航分开，原业务节点不由Host重建。消费者退出只清理自身，NativeStatus仍工作。新增快照只持有显示字符串和公开撤销函数；没有第二套交易、战斗或跨场景业务状态。

经典2.7入口仍独立、没有Host依赖。共享源码得到数量校验、存档可见性、export入口及衣柜弹层保留这四处有理由的局部修复，因此**本轮经典JS不等于已发布2.7的字节**，也未替换正式2.7安装或发行包。早期脚本、四项Twee补丁、API声明及两份帮助文档与本轮经典包逐字节一致。

## 制品身份

`dist/framework/DoLGameUI-3.0.0-lab.14.mod.zip`，189867字节，17个条目；包内包含运行代码、许可/说明、早期脚本、四项补丁、API声明和必要设置说明，没有测试收据、截图或APK。

| 对象 | SHA-256 |
| --- | --- |
| lab14 ZIP | `8e2787efb48ccf80035e2abb80ffded6595aa9dd1b0effe2ef98c55a9b3aa463` |
| index.js | `f50446b62bf442dc933d1256542d133f6e1ffcf50e3f7defa8440801c9419b6f` |
| style.css | `5068b271180bc7d5675890dbed4d07e676170560085fb220a54b3f9ebac6a346` |
| Host0.1.1 ZIP（未变） | `7f393f438111a2679d329e3301ba6b7456e88a21a3ac606da2bc995d2815902c` |
| 保留R13 ZIP | `efb1995402f2ce6d8b72d38a58fdf4f1ea72f907a191bdf05a676fc6f3204d3c` |

完整文件/声明/补丁摘要见`tests/artifacts/stone-free-r14/package-audit.json`。实际安装收据记录相同lab14摘要。构建使用当前工作树，随后本地阶段提交固化同一源码；不是固定提交的第二次独立重建或正式发布验收。

## Failed / Unknown

- `desktop-1792230364922`暴露原关闭后存档UI驻留；已修复。`desktop/android-1792230880506`及`desktop-1792231340047`暴露衣柜内存档不出现。后续`desktop-1792231539393`祖先链明确显示原overlay被放入`dgw-native[hidden]`；保留原位修复后，最终两端相同序列通过。单纯增加可见性观察并未解决衣柜归拢问题，未把中间修复当成完整成功。
- `desktop-1792230471527`错误假定Engine准备的Settings原Return必回Bedroom；改为明确Engine退出，只证明挂载失效。`desktop-1792230536507/0596799`分别使用原目录/Combat setup重建前的临时标记；改成重新观察当前原节点。都是项目脚本假设，不是游戏/Tools缺陷。
- `desktop/android-1792230771164`错误期待循环后挂载为0，忽略正在使用的衣柜；改比较进入前后挂载身份和claim数量，非忽略泄漏。原失败保留。
- `android-1792231037952`对原select使用标准web-input，返回`Web target unavailable`。源码确认该动作只接受input/textarea。最终在精确文档中检查唯一可见select及合法option，用HTMLSelectElement原setter与input/change事件处理，核对原目标值；没有改Tools、游戏变量或战斗算法，也不称物理键盘输入。
- Windows启动仍有泛化`Event` pageerror，交互阶段未新增；原因Unknown。桌面HTML服务器没有全量图像，衣柜预览报告图片失败；不据此判定Android预览问题。
- 动物演示源码的`animal`/`bestial`不一致仅为源码疑点，未复现，不拼造动物状态。Doctor首次泛化失败和工具路由细节见[独立Tools反馈](STONE_FREE_3.0_PAISLEY_FEEDBACK.md#第十四轮增补整合现场与控件合同)。

原失败与中间lab14收据不删除、不冒充最终制品证明。尤其`c75ef9…`和`35607b…`包不是本页最终`8e2787…`包。

## Remaining Coverage / Known limitations

本轮无剩余阻塞实现。后续正式产品准备仍需按目标选择自然遭遇/战斗结算、套装/其它目的地、复杂Mod组合、物理手机/IME、长期性能和真实存读档业务；这些未验证范围不自动扩大为R14任务。历史GER Pending/Unknown保持不动。

Host仍按已知精确配对发行，未承诺任意独立升级、热卸载或完整3.0可替代稳定版。源码覆盖矩阵中的Preserved/Migrated不等于所有业务重新验收；本轮没有新的Framework、Factory或SDK工程。
