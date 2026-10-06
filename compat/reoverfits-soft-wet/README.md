> **当前兼容包 0.2.2：目标 Mod 4.1.1 及以上，UI 2.2.2 及以上，DoL 0.5.12.13。** 加载器与运行时均使用最低版本要求；页面结构、接口和数据检查保留。文件名 `plus` 表示目标版本及以上，不代表所有后续版本已验证。下文较早版本说明作为历史记录。

0.2.2 修正服装店首页三个外层分类入口：移除卡片内多余按钮边框，恢复原分类图标。仅调整样式，原链接和点击行为保留。

# ReOverfits · Soft & Wet UI 兼容 0.2.0

适用于 **ReOverfits 4.1.1 + Soft & Wet UI 2.2.1 + DoL 0.5.12.13**。不包含 ReOverfits 本体，也不能搭配 UI 2.2.0。

## 安装

先安装 UI 主包和 ReOverfits，再导入本包 ZIP（不要解压），替换旧版同名兼容包并重载。加载顺序为 UI 主包、ReOverfits、本包。其它版本不保证兼容。

## 界面变化

- 外层头饰、外套上装、外套下装进入新版衣柜分类。
- 复用现有卡片、搜索、详情、角色预览和整理功能。
- 商店外层分类使用现有入口布局；缺失图标时显示文字标签。
- 完整套装与剪开后的独立部件遵守原游戏规则。

库存、穿戴状态、购买和服装操作仍由原游戏及 ReOverfits 负责。关闭 Soft & Wet 后使用原版衣柜；禁用本包并重载可撤销适配。

## 给 Mod 作者

等级为 **UI Model Extension**。本包通过衣柜槽位扩展 API v1（`DoLGameUI.wardrobe.registerSlotMapping`）注册三个原生已有槽位的标签，只保存语义字符串，不复制业务状态或改写操作链。

准确目标版本匹配，且原库存数组、服装定义与穿戴对象存在时才显示分类。API 缺失或版本不符时不注册；销毁 Adapter 撤销映射和自有样式标记。未知 DOM 保留原状。

诊断入口：`window.ReOverfitsSoftWet.getDiagnostics()`。

构建：`python scripts/package-adapter.py compat/reoverfits-soft-wet`。

局部检查：`node tests/wardrobe-slot-mappings.test.cjs`、`node compat/reoverfits-soft-wet/check.cjs`。

本轮已在 Android DoL 0.5.12.13 验证代表性购买、穿脱、剪开、搜索与映射撤销；其它设备、版本和全部服装组合未穷举。分类图标缺失时使用文字，缺图服装使用现有占位。天气横幅回调曾出现一次原游戏错误，根因未确认；本包没有修改天气逻辑。
