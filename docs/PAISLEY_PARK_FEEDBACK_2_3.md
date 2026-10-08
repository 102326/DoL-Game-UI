# Paisley Park：Soft & Wet 2.3 实际使用反馈

范围仅本轮，与先前服装店 3.0.2 外部验收去重。建议供开发工具包对话判断、登记，不自动开工；未修改 Tools、Skill 或 Provider。

## 实际使用

本地 Skill 正常发现，无下载/重装。初段现有 Tools 3.0.2，手机段重新 resolve 后实际为 3.0.3。标准 Environment/WebView 执行上下文负责明确 serial/package 和自有传输清理，Android CLI 获取原生图；直接 Playwright/CDP 用于原控件身份、CSS 几何、UI 运行对象及项目自己的 ModLoader ZIP 更新。ADB 用于已授权独立 APK 安装/重启。

现场成功揭示了源码/桌面夹具不足以证明的内容：USB 安装限制、原首次年龄弹窗、手机 IME、真实字体/容器尺寸、原版优化 ID 样式优先级、固定位置特质框溢出、实际第三方类别布局。工具有助于回到同一现场检查修复，未发现确认的 Tools 实现缺陷。

## 值得进入通用 Skill

1. **保留直接工具出口。** 导出已授权 Mod ZIP 时通用 CDP 4MiB 限额拒绝，使用现有端点进行项目只读导出并校验清单哈希完成任务。限额是保护，不是产品损坏；不值得改成 Full Evidence 或建新 collector。
2. **ready 与 capture complete 分开。** 成功连接时 Mod 尚未加载；补目标的 SugarCube 页面/Mod 列表前置条件。若采集到空行数组，不判布局通过。本轮首次空数据记录保留，之后用非空断言。
3. **节点矩形不是可点击证明。** 开始页存档按钮高度非零却 visibility:hidden。初次 a/button 假设、快捷键前缀、删除按钮父级假设均导致调用失败；先读当前节点类型、可见性、祖先和遮挡能少走弯路。不能把这些调用者假设记成 UI 或 Tools 缺陷。
4. **及时保留未知。** 初次 Environment partial 与连接超时/前台变化同时出现，确切因果 unknown；未凭此推断 WebView 或 UI bug。版本来源区分 App 包装版本、GameVersion、Loader/ImageHook。
5. **时序与隐私。** CDP visualViewport 读数早于 IME 动画，原生图随后确认键盘。输入法剪贴板栏包含项目之外内容，截图只能本地留存。截图完成后必须检查再使用，不因为采集完成就适合分享。

## 路由与执行习惯不足

直接 CDP 适合本轮对象身份和精确样式，但临时脚本逐段加 mode，重复猜 selector 后等待 30s，效率不理想。任务仍完成，失败记录可读；缺口是没有统一、可复用的操作片段，截图和 JSON 靠文件名交接。改进应优先是 Agent 先用已有现场观察/DOM Inspector 确认，再低成本动作，而非重构 Tools。

没有使用 Journey：开始时是一次性控件与 CSS 调查，状态变化频繁，录制的收益低；后来形成保存→重启→读档和分类→Drawer 路线，未来需要重复回归或跨对话接手时适合标准化 Journey。当前不为格式补跑。标准 Action 与直接点击都应绑定当前控件，不用旧文本推断。

没有使用 Gameplay：共享历史未决 Effect 未动；本轮手机为新隔离目标，以 UI 和原保存行为为主，没有需规划的购买目标。直接原操作的结果通过原 IDB 检查，不把菜单返回当结果。没有使用 Perfetto、bugreport、Full Evidence、泄漏调查：没有对应性能/系统崩溃风险。

## 归属与边界

- 环境：USB 安装最初拒绝、设备断线、首次年龄门槛；不是 Tools 缺陷。
- 调用者：evaluate 参数格式错误、隐藏表头等待、节点/父级错误假设、等待当前不存在的买入按钮；不是 Provider 架构失败。
- 项目：CSS specificity、工具栏展开占位、特质框固定宽度溢出，本轮已定向修复。
- 第三方/项目 Integration：具体槽位、原固定 wear 宏、ModLoader 更新合同、getSlotSupport 字段属于项目知识，不进入通用 Skill。
- Coverage：更多设备、Provider、私有服装业务、手机完整购买路径，只登记，不升级为当前工具任务。

## 建议优先级

P1：固化 ready/非空证据、点击前现场、时间与隐私边界。P2：当跨步骤路径值得复用时采用 Journey/Evidence；保留直接 CDP 合理出口。P3：额外设备/业务 Coverage。无建议立即新增框架、日志层或全局扫描器。

结论：当前已安装 Skill/Tools 适合作为 Soft & Wet 日常 Android/WebView 能力层；需要改善的主要是执行者的路由与观察习惯，不是缺少另一套工具环境。unknown 不以猜测补齐。
