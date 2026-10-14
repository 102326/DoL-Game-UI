# Stone Free：行动栏与服装特质说明修复

2026-10-15，基于 `f143023` 的 3.0 开发候选；未发布正式版。

## 改动

- 战斗行动栏使用非模态 Popover 顶层，保持原节点父级，避免祖先滤镜或变换影响固定定位。随可视视口调整底部位置；原版弹窗打开时让出显示层级。
- 服装店的原生 body tooltip 提高到交互遮罩之上。保留原插件的内容、位置和事件，不重新生成说明。
- 新增 `tests/layering-regression.cjs`，纳入商店和战斗定向测试组，重复选择时只执行一次。

## 本轮验证

构建、类型检查、打包及以下定向测试通过：`layering-regression.cjs`、`combat-resize.test.cjs`、`native-action-panel.cjs`、`multi-region.test.cjs`、`combat-m4a.cjs`。

桌面夹具在滤镜祖先下复现旧固定定位错位；修复后在 390px/1000px、滚动和变换条件下保持底部位置。原控件身份、原事件、弹窗优先及关闭回退通过。tooltip 在 10000 层遮罩前可命中，降低回原生 1000 层时被遮挡。

平板 M367FC，独立测试 App `com.vrelnir.dol.lyra.uicompat051213`，DoL 0.5.12.13 / WebView 154：

- `Robin Room Bed Sex` 行动页在滚动 0/350/700 时保持底部位置，继续按钮可命中，38 个原控件身份与父级不变。未执行继续或回合。
- 服装店特质筛选中悬停“书包”，原生说明显示在面板前方，正文可见，采样点可命中。checkbox 值、节点父级、场景和货币未改变，未购买。
- 当前行动页短暂恢复旧定位并未复现用户报告。因此祖先滤镜/变换是已证明的风险条件，原报告的确切触发原因仍为 Unknown。

现场收据及截图位于忽略的 `tests/artifacts/stone-free-lab/`：`tablet-combat-live-20261015.json`、`tablet-legacy-position-control-20261015.json`、`tablet-shop-tooltip-live-20261015.json`，及对应 combat/shop 图片。旧 UI 包已备份，Mod 顺序保持不变。

候选 ZIP：`DoL-SoftWet-GameUI-3.0.0-stone-free.1.mod.zip`，200305 bytes，SHA-256 `8df94e65b8ce9fe90fb6f66ef6f10a6e83307dd3bca07052b4d0e16469388a79`。

## 覆盖与限制

本轮未核验报告者完整 Mod 组合、物理手机和所有行动场景；“做小面包”的原控件布局使用既有定向夹具验证，未做该场景真机复验。未执行游戏业务、存档读写或完整发布回归。

不支持 Popover 的浏览器沿用原固定定位，仍可能受祖先滤镜/变换影响；本轮没有为旧浏览器增加 DOM 搬迁方案。此修复在 3.0 候选中，不代表已回补正式 2.6。
