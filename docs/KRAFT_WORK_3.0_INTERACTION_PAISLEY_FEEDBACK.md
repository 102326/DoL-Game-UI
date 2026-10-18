# Paisley Park：Kraft Work 双布局与交互开发反馈

2026-10-18。仅记录本轮真实使用。已安装 Skill 的 resolver 指向 6.1.0 White Snake；没有安装工具、修改工具源码或重新处理历史 GER Store。

## 实际有帮助的路线

普通控件使用标准 Action 的 web-click / web-focus、launch 和 restart。项目私有偏好、节点身份、原事件引用、资源摘要与布局断言使用绑定到指定平板/App/文档的 CDP。ADB 用于前台、进程和亮屏核对，以及截图、screenrecord 和取回自有文件。原项目工具完成源码修改、类型检查、构建及持久部署。

选择直接 CDP 是为了回答实际需要的私有断言及受控输入问题，未另建 Runtime。界面任务没有建立 Gameplay Goal，也没有清理、换 Store 或绕过历史 Unknown。没有使用 Perfetto、bugreport、Full Evidence 或泄漏调查。

## 建议进入 Skill 的通用经验

**P1：CDP 超时仍应看原生现场。** 本轮关闭设置后请求超时，前台和亮屏检查仍正常。原生截图实际显示游戏的 ResizeObserver 警告 alert。该弹窗阻塞 JavaScript，并非仅凭超时就能判断为进程卡死、设备锁屏或工具连接缺陷。保存现场、核实警告及目标后，用标准 tap 关闭明确按钮，再修目标项目；不盲目重载或重放业务。

**P1：分开验证点击效果和按下状态。** web-click 适合普通动作与结果核对，不证明物理触摸或持续按压外观。本轮 CDP 注入触摸确实完成了原按钮点击，但 CSS `:active` 在按住采样中为 false。实际原因保持 Unknown；项目用已知控件的有界 pointer 反馈实现所需外观，并定向验证。不能将注入输入直接写成人手触控覆盖。

**P2：触摸清理跟随序列状态。** 已完成 touchEnd 后再调用 touchCancel 被拒绝，是本轮直接 CDP 清理脚本的问题。应只取消仍在进行的自有序列，不把无条件重复清理失败写成 UI 缺陷。

## 仅留在 Soft & Wet 项目的事实

侧栏 StoryCaption / BF / ModHub 标记，私有布局键、布局阈值、Orbit、Surface 样式、原游戏分组语义及具体资源摘要属于项目文档。ResizeObserver 的下一帧调度修复、关闭动画时开关残留过渡及主题关闭时的禁用外观也属于本项目，不应加入通用 Skill 的 Mod 专属规则。

## 工具缺陷与候选增强

本轮未确认 Paisley Park 实现缺陷。ETIMEDOUT 和通用 Web action failed 没有解释原生 alert，但原生截图足以定位，已有能力可完成闭环。可以把“超时后考虑原生弹窗”的路由提示列为候选；是否增加 JavaScript dialog 元数据由工具项目评估，不在本轮自动开工。

没有录 Journey：本轮仍在调整布局、来源标记和按下反馈，输入与断言随缺陷调查变化，目标项目的现有测试与短 Action 已足够。保留了可重读的项目脚本、失败收据、制品身份和原始视频；它们不是标准 Journey manifest。若后续需要跨对话稳定重复同一条回归路径，再提取已稳定的动作，而不是重新建立所有流程。

更多手机、WebView、真实 Loading 或长时间性能属于 Coverage，不是工具框架欠缺。本反馈无需重跑工具验收或扩大通用架构。
