# Paisley Park：KRAFT WORK 游戏主体 M1 使用反馈

2026-10-18；与此前 `KRAFT_WORK_3.0_INTERACTION_PAISLEY_FEEDBACK.md` 去重后的补充。只记录本轮真实使用，不要求开发工具重构。

实际使用本机 Skill resolver、6.1.0 绑定 execution-context / WebView CDP、标准 Action、ADB 原生 screenrecord / screenshot，以及标准 `animation-frames`。Source 与类型/构建仍用 UI 工具链。没有使用 GER、Journey、Full Evidence、Perfetto 或 bugreport：本轮是短展示路径及有限状态核对，不需要持续 Goal、重型采集或完整矩阵。

## 值得进入通用 Skill 的经验

1. **优先找真正命中的动作承载节点。** 商店链接视觉上可见，但 `elementFromPoint` 指向外壳的子节点。我们自己的点击前置断言先失败，标准工具没有错误派发。源码和现场确认原 `.div-link` 承接点击后，继续通过 Action 点击原外壳，原 jQuery 商品处理计数为 1。建议强调：不要为了让内部 a 的中心命中而改产品 CSS、去掉 pointer-events 或穿透点击。框架已有这类命中指导，可只补例，不新建点击 Provider。
2. **原节点身份检查需要包含原行为的结束条件。** 选择商品后原链接被重建，最初断言把它视为不允许。关闭商店适配的同场景对照仍重建且入口仅执行一次。应核对是谁替换了节点，不能把“前后身份不同”直接判成 Adapter 破坏。通用规则有价值；该 Mod 的具体重建路径留在 Integration。
3. **有正常模态遮挡时先走返回路径。** 窄屏已有 Drawer，点击背景商品被我们的 guard 阻止。先关闭详情再选择即可；无需扩大 DOM 采集，也不应强制触发隐藏目标。
4. **检查短动画取消不要用固定 sleep 或自然结束。** 本轮桌面断言读到已移除代理的空样式，另一固定短等待也未等到媒体 change。改为创建时同步观察；暂停测试动画后等待取消条件，可证明取消发生，而不是动画恰好结束。这是项目测试时序，不是 Paisley 缺陷。

## 只留项目或 Integration

- `.div-link` / 原 jQuery 处理链、具体商品 Source、衣柜 `wornStacking` 及原穿戴 Widget。
- UI 的 class、预览 canvas、公开/私有 API 和本轮包成员摘要。
- 商品换分类原因 Unknown；不将过时定位器自动归因工具或 UI。
- 一次恢复脚本遗漏函数声明是执行脚本错误，已保存失败并修正，不属于 Dev Tools。

## 实现缺陷与优先级

未发现本轮证据支持的 Paisley 实现缺陷。P2：把动作承载节点和“原业务自己重建 DOM”的对照经验并入已有 Skill 例子；不自动开工。更多手机/WebView 是 Additional coverage，不能借此追加本轮验收。

标准 Action 与精确 CDP 配合已足够。原生录像回答真实运动效果，离线抽帧只辅助审查；抽帧 manifest 的 truncated 保留，未把理论采样序号当精确 PTS 或 FPS。没有为统一形式新增 Journey：这些短路径已由脚本、版本、原状态与录像关联，当前交接没有必须另建 Journey 才能解决的缺口。
