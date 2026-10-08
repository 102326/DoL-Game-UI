# Soft & Wet 3.0 — M1 纵向原型结果

2026-10-08。基线：2.2.2 / `937dad75d216168748a96cf4a1047fefb49e6992`。隔离分支：`prototype/soft-wet-3-m1`，目录：`E:/daima/DoL/experiments/soft-wet-m1`。

**结论：方案 D 在衣柜这一纵向范围有实际收益，值得继续有限推进；本轮没有证明应该立即全面重写，也没有证明需要跨领域统一业务模型或独立 Runtime。**

本轮 Done：交付可运行的隔离衣柜原型，检查来源/操作/呈现边界、宽窄容器、原版穿戴、失效、未知内容与恢复，并用真实 ModHub 场景检查既有 API 的跨领域边界。原穿戴业务在隔离原版浏览器游戏验证；Android 验证布局、分类、浏览、原版入口及 Adapter 撤销。没有要求在平板重放共享 Ledger 的历史未结清操作。

## A. 实际交付

- `src/wardrobe/source.ts`：页面局部来源投影与原对象绑定表。Vue 接收显示字段与操作 key，不接收库存对象或 descriptor；管理操作仍在原来的领域代码中。
- `src/wardrobe/main.ts`：挂载创建来源，卸载销毁；执行穿戴前重新读取原状态、核对对象身份、内容指纹和页面归属，再调用既有 native 宏。
- `WardrobePanel.vue`：默认保留单击直接穿戴；增加本次会话内的“先查看详情”实验。选中信息与实际已穿戴信息分开，角色预览仍是实际穿搭。
- `style.css`：复用原有 Container Query。窄容器下收起行内冗余数值，扩展分类换行，选中详情进入列表前方；选中时列表高度收敛。宽容器继续并列。
- 原版及扩展信息入口：显示同一批保留原节点，并在需要时调用原版列表刷新。未知内容有可见入口，关闭新衣柜也能显示。
- 两个定向测试：来源失效/无写入测试，以及隔离原版游戏中的实际组件/穿戴/回退实验。

没有修改发布版本、公共 API、已有 Adapter 包或正式仓库源码。Runtime / Surface / Inspector / Theme / Tier / 原槽位注册 API 都沿用 v1。未引入新 Observer、全局 DOM 镜像、业务状态仓库或独立 Framework。

ReOverfits 分类说明是明确标记的 **M1 受控 metadata**，不是作者已提供公开内容协议。实际原型继续使用旧槽位注册路径；显示名称和说明优先读取原衣物定义。

## B. 前后比较

| 范围 | 2.2.2 | M1 与实际意义 |
| --- | --- | --- |
| 来源与呈现 | `Entry` 含 `raw` / `descriptor`，直接进入响应式 items | Vue items 只有独立显示投影；原对象留在来源的私有绑定表 |
| 操作有效性 | 调用方按 Entry 与当时 snapshot 核对 | key 带来源 revision；执行前重新核对内容、原对象身份、当前位置与页面归属 |
| 维护位置 | main 内比较显示字段，回调自行定位 Entry | 比较、投影及旧 key 拒绝集中在约 40 行的来源模块；native 宏和管理规则没有再实现 |
| 分类显示扩展 | 已能注册三个 ReOverfits 槽位 | 新增类别说明可在来源 metadata 修改，不需修改 Vue。没有把重新注册槽位算作突破 |
| 窄容器 | 已有 Container Query 与预览折叠 | 在已有机制上按内容复杂度和选中状态组织分类、数值与详情，不创建布局引擎 |
| 未知信息 | 原节点保留，但新布局中隐藏 | 常驻原版信息入口；真实未知节点探针展开可见，关闭 UI 后也可见 |
| 快速穿戴 | 点击衣物即原版穿戴 | 默认仍一次点击，没有增加确认步骤 |
| 只看详情 | 没有独立选中详情路径 | 开启浏览模式后一次点击只查看；实际穿戴再点一次。该模式增加成本，不能据此替换默认 |
| ModHub | API v1 Style Only | 现有能力已经够用。本轮只验证角色、主题、撤销、Surface 和诊断，不移植衣柜业务模型 |

浏览模式使“只看库存衣物信息”不必先换装，这一收益已验证；没有用户研究或耗时实验，不能宣称所有玩家操作更快。复杂内容时，衣柜顶部的原操作/套装区仍较长，这轮没有改成全新导航体系。

实际平板截图：[正式基线](m1-images/baseline.png)、[原型宽容器](m1-images/prototype-wide.png)、[原型 550px 容器详情](m1-images/prototype-narrow.png)。后者是在宽屏内限制容器的实验，右侧留空来自这个人为约束；不是最终页面宽度设计。

## C. 验证

### Delivered

可运行的独立原型、定向测试、本文及本地前后截图/结构证据。没有生成正式 mod 发布包，没有更改 tag，也没有推送正式主线。

### Validated

1. `npm run build`：项目既有生成文件检查、Vue/Adapter/early 类型检查、Vite 和 early 构建通过。
2. `node tests/wardrobe-source-m1.test.cjs`：投影不暴露原对象；改显示副本不改原库存；原对象同值替换、原内容原位变化、显示 helper 变化、页面失效与销毁都拒绝旧 key；未知槽位保留；受控 metadata 可独立修改。
3. `node tests/wardrobe-m1.cjs`：隔离的原版 DoL 0.5.11.9 / Edge。先加载正式构建截图，再换原型。同一公开 API 和显示偏好保持；浏览不改变原 worn；明确穿戴及默认快速穿戴均通过原宏，原 `V.worn.upper` 证明结果。
4. 同一浏览器场景：viewport 1363px，实际衣柜容器 550px；Grid 一列，详情在列表前，无横向溢出。正常关闭及注入受控来源异常后，原列表对象和未知信息仍可见。定向记录预览 ResizeObserver：每次挂载恰好一个，卸载为零，异常后再挂载也无重复；不是全 App 泄漏验收。
5. `node tests/wardrobe-slot-mappings.test.cjs`：复用既有注册、数据/版本门槛、撤销测试通过。
6. `node tests/ui-runtime.cjs`：复用 API v1 只读诊断、Surface、Style Adapter、fallback/rollback 与原业务状态保留测试通过。没有扩展成全项目发布回归。
7. 真机：M367FC / Android 17 / WebView 154.0.8037.58；测试 App `com.vrelnir.dol.lyra.uicompat051213`。Runtime 实际报告 DoL **0.5.12.13** / UI **2.2.2** / ModLoader **2.101.1**；ReOverfits **4.1.1** / ModHub **1.3.0**。
8. 真机临时装载编译原型：原列表对象、库存、worn 与偏好保持；14 个分类可见；浏览和原版信息入口通过原控件实际点击；未知节点探针展开与关闭 UI 后都可见。
9. 真机受控容器：viewport 1363px、root 550px、Grid 530px；详情 bottom 297.1、列表区 top 309.1；root/body 均无横向溢出。实际 Android WebView 中验证，但这是临时 CSS 容器约束，不能冒称手机验收。
10. 真机 ModHub：Style Only / full match / 44 个列表行。撤销后角色标记消失；重新注册后恢复。按钮对象、父/前后兄弟、onclick 和列表顺序均保持。原 ModHub 的导入、删除、排序、重载没有执行。
11. 在 ModHub 场景请求既有 API 的临时只读 Drawer，打开、关闭及内容清理成功。关闭后仍有原 ModHub surface，因此“总 surface 数 1”不是 Drawer 泄漏；关闭原 ModHub 后实际为零。
12. 结束时恢复正式 2.2.2：原型节点、样式、探针和临时全局引用移除；库存、worn、全部显示偏好与原列表身份保持；原分类回到上装。共享 Gameplay Store / Ledger 没有清理或改写。

### Not validated

- 平板三个 ReOverfits 扩展库存都是空。实际加载与分类入口已确认；有物品时的详情用受控扩展夹具验证，**没有实机扩展衣物穿戴证明**。
- 平板实际换装未执行；原穿戴业务证明来自隔离原版浏览器，不能替代 0.5.12.13 + 全 Mod 组合的业务验收。
- Journey 请求旋转后测试 App 仍保持同一宽视口，没有取得真实竖屏结果。窄空间证据来自同一 WebView 的受控容器与浏览器容器，不是额外手机覆盖。
- 未遍历其它衣物、Mod、DoL 版本或设备；未测存档、战斗、网络、性能与泄漏；可另列覆盖，不自动成为本轮未完成项。
- 可选商店修复没有纳入本轮代码。已知窄内容区双列问题仍应作为独立 2.x 修复，而不是 M1 成功的前置条件。

### Known limitations

- 来源仍需对选中分类及穿戴数据序列化，解析/descriptor 查找也仍使用既有工具。没有性能收益测量；不能把“分层更清楚”写成“性能更好”。极大库存或非常规循环数据应另做有依据的调查。
- 未完成整个衣柜的来源迁移。整理/修理/转移与 native extras 保留既有实现及其耦合，未抽成通用语义层。
- 新 key 是内部 revision key；没有公开稳定 ID 语义，不承诺第三方依赖这个内部 DOM 属性。
- 受控扩展 metadata 尚不证明第三方作者主动接入。未知显示属性经原版信息入口访问，不猜测含义，也不自动转成业务能力。
- 窄容器详情位于列表前、触发浏览时滚到可见处；它仍可能增加滚动。默认快速穿戴保留，浏览模式不持久化，也未定稿为正式默认。

### 证据位置与采集边界

本地根目录：`tests/artifacts/m1-20261008/`。原始截图/诊断保持本地，未上传；它们可能含当前游戏文字。

| 文件/目录 | 证明内容 |
| --- | --- |
| `doctor-authorized.json`, `observe-before/semantic.json` | 当前设备、唯一 App/WebView 与原卧室现场；保留之前的无设备失败 |
| `before.json`, `wardrobe-before/` | 正式 2.2.2 的分类、版本、原现场及截图 |
| `browser/results.json` | 隔离原版宏穿戴、浏览、容器和故障回退 |
| `wardrobe-journey/manifest.json` | 审阅后的浏览/点选、截图/DOM/CSS 检查点及旋转清理 |
| `narrow-proof.json`, `wardrobe-narrow-detail/` | Android WebView 550px 容器布局和原状态不变 |
| `fallback.json`, `fallback-proof.json` | 展开原版信息、关闭新 UI、同一原列表及未知探针可见 |
| `reoverfits-proof.json` | 实际扩展槽位、受控说明与空库存 |
| `modhub-check.json`, `modhub-revoke.json`, `modhub-reattach.json` | 原 ModHub、Style Only 及原按钮/关系/顺序保留 |
| `surface-check.json`, `cleanup-check.json` | 临时 Surface 与全部原型资源清理 |
| `restore-final.json` | 恢复正式版、偏好/库存/worn/原列表身份不变 |

`fallback-proof.json` 中额外的 `nativeListDirectParent:false` 是探针误设“直接父级应为 passage”的判据；实际原父级为 `#passage-content`，不是 UI 丢失原节点。该 false 保留，不当作通过值；同一原列表身份和可见 fallback 已分别确认。

浏览器初次运行遇到路径分隔符检查、测试 selector、fixture 版本格式与返回原 V 对象的序列化错误。修正了这些具体测试问题并保留失败记录；不是通过无理由重复运行把 flaky 测成绿色。

Paisley Park 用于 doctor、game-observe、审阅后的原衣柜入口、Action/Journey、截图/DOM/CSS 与传输清理。原对象身份、精确状态比较及临时构建装载使用同一工具已有 CDP transport 的审阅脚本；没有为统一形式重复采证、Full Evidence、Perfetto、bugreport 或新的工具环境。

本次原型构建 SHA256：

```text
game-ui.js  67EEBD089F6E167F35363DCB5EAC718C3AF7F4CEFCB80811BFD21F0E13DBD110
game-ui.css E2312FCDCC6A55275B1DEDAA3B9C5AEBF48C9687BB5CBE4556E9F5B26BCE37F8
```

## D. 八项架构判断

1. **D 是否优于现有 2.2？** 在本次衣柜范围，是：原对象退出 Vue，失效验证集中，详情与实际穿戴分离，可访问的未知信息入口更明确。不能外推为整个系统都应如此迁移。
2. **值得成为 3.0 核心的部分？** 领域局部显示投影、执行前原绑定复核、容器+内容+选择状态的布局、可见 fallback。保留当前 Theme/Style/Surface 能力。
3. **哪些更适合 2.x？** 原版信息入口、陈旧操作拒绝、局部容器/工具条修复可以独立回移；商店窄容器问题尤其不应等待 3.0。M1 本身不自动合入 2.x。
4. **需要统一语义层吗？** 本轮只支持衣柜私有领域来源，未证明跨领域语义层的价值。不要把衣物、设置与 ModHub 的业务对象强行统一。
5. **需要独立 Runtime 吗？** 不需要。v1 的主题、Style Adapter、Surface、诊断和撤销已覆盖本轮共享能力。
6. **第三方主动接入价值成立吗？** 原槽位注册的价值已有实机事实；新增内容描述 protocol 仍是候选。本轮受控 metadata 证明“可以局部维护”，没有证明作者协议或生态采纳。
7. **值得马上大规模重构吗？** 不建议。先把衣柜做成完整、可回退的候选，并取得非空扩展衣物实机行为与浏览模式反馈，再决定扩大领域。现有结果足以保留方向，不足以宣布全面 3.0 启动。
8. **下一阶段范围/工期？** 建议 M2 仅限衣柜候选：补非空 ReOverfits 场景和允许的原业务路径、收敛详情触控与原工具区、把其余衣柜操作按实际收益逐项检查，并独立处理商店 CSS 问题。按一位熟悉代码的开发者，约 **4–6 个工作日**，是范围估计，不是自动开始或全面 3.0 的承诺。跨域推广仍需用户决定。

M1 已完成约定的有限原型与代表性验证，覆盖限制如上。正式版本和发布资产保持不动，实验可以整体弃用。
