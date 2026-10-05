# ReOverfits / UI 2.2.1 集成记录

状态：本轮交付完成，代表性环境已验证；生态覆盖有限。

## Delivered

- 衣柜槽位扩展 API v1：语义标签、精确目标版本、数据存在门禁与可撤销注册。
- ReOverfitsSoftWet 0.2.0：ReOverfits 4.1.1 / DoL 0.5.12.13 的 UI Model Extension。
- 正式 UI 2.2.1 及已有官方包的必要依赖更新。主 UI 仍声明 DoL 0.5.11.9 / 0.5.12.13；新 Adapter 只声明 0.5.12.13。
- 新增独立公开类型与接入说明。原库存、穿戴、服装业务和存档格式继续由原系统持有。

## Validated

- 复用兼容适配任务的构建、槽位注册、Adapter、wardrobe-data / operations / runtime 与 shop 专项结果。
- 复用同一真实 Android DoL 0.5.12.13 / ReOverfits 4.1.1 候选验收：代表性购买、整套穿脱、剪开、独立下装、搜索和映射撤销/重新注册。
- 集成后 `npm run build`、`tests/wardrobe-slot-mappings.test.cjs`、`compat/reoverfits-soft-wet/check.cjs`、`tests/shop-pagination-package.test.cjs` 通过；公开类型消费者与所有兼容包类型检查通过。
- 正式包与已验收候选比较：JS/CSS/补丁/声明内容一致，仅正式版本字串与两对路径派生的 Vue scoped id 不同；JS 与 CSS 中的 id 对应一致。
- 现有四个依赖 UI 的兼容包，其样式与 JS 除包版本字串外不变；目标 Mod 版本不扩大。主角色嘴部修复复用已发布原包。
- 同一 Android 测试 App 导入正式包后，游戏状态、session、偏好、模组顺序与隐藏列表在安装前后保持一致。
- 重载后读回实际 UI 2.2.1、ReOverfits 4.1.1、Adapter 0.2.0 / model-registered，ModHub / MapleBirch / 原版优化的正式依赖均含 2.2.1。加载日志显示警告为 0，没有原 UI 依赖警告；原 Simple Frameworks 查找错误仍存在。
- 公共 Release 只分发玩家主包、可选兼容包与校验文件。原始游戏画面、日志、设备标识及本机路径仅保留在本地，不公开。

## 失败与调查

- 最初 ZIP 原始字节比较失败，差异定位为不同工作树路径生成的两对 Vue scoped id。显式核对 JS/CSS 对应后，其余内容与候选一致；不将初次原始字节比较记为通过。
- Surface 开发示例的文件名由第一项精确依赖生成。临时 OR 版本声明产生非法文件名，已改为独立示例 0.1.2 精确依赖 UI 2.2.1；不改玩家运行时，不作为 Release 附件。
- WebView `Page.reload` 返回 `Page.handleJavaScriptDialog: No dialog is showing`。未重复重载；随后的只读观察确认正式包已加载。协议错误原因未确定，不记作无错误重载或游戏业务缺陷。
- 候选曾选择已剪开旧服装却期待整套联动；调查后改选新购完整套装并通过。原始失败记录保留，属于测试选择错误。
- 候选曾出现原游戏天气横幅回调读取 skybox 的 Alert，后续同场景未复现；原因仍 unknown，未改天气逻辑。

## Not validated

其它 ReOverfits / 游戏版本、其它设备与 WebView、全部服装限制/颜色、批量整理矩阵、真实旧存档迁移、其它 Mod 组合。旧 Lyra 衣柜嘴部包本轮仅更新依赖，未重新做 0.5.11.9 真机验收。上述覆盖不自动扩展本轮交付。

## Known limitations

- ReOverfits 分类图标缺失时显示文字；无图服装沿用占位。完整套装的次级部件遵循已有规则。
- 不支持自定义服装业务回调或任意新库存结构；不提供通用 Proxy / Deep Adapter 执行器。
- 天气横幅异常与 Simple Frameworks 原有错误未由本版修复。
