# 属性窗口受力候选（隔离）

沿用现役 V1 黑灰材质、60 档与默认左对齐，运动来自已认可的 Study04 / `settings-material.ts`（ae91732）。本页使用实际 characteristics owner、原生导航和生产样式；内容及外壳几何为受控夹具，不加载游戏资产。新增的是属性角色的可见性/所有者适配与共同运动容器，不是 Claude 新视觉稿，也未正式接入产品。

## 运行与对照

- `node scripts/preview-evo42.mts`，打开 `/prototypes/evolution-integration/attributes-material.html`；`?variant=baseline` 保持现行固定窗口，`?variant=study` 为受力候选。
- `node prototypes/evolution-integration/attributes-material-record.mts` 生成本机录像，再打开 `/prototypes/evolution-integration/attributes-material-compare.html`。
- 两版采用同操作脚本、1280/390 × 900、1×播放。两次独立录制包含初始化及浏览器等待，不保证起始帧/时长同步；不拿录像长度判断交互性能。录像只保存在忽略目录，另一台设备须重新录制。
- `node prototypes/evolution-integration/attributes-material-check.mts` 验证宽窄屏两版。
- 加 `--legacy-target` 故意只移动原窗口，预期在前景对齐断言退出非零；这是旧适配方案反例，不是正常测试入口。

## 联合层与验证范围

生产 foregroundPlane 将天气及轮廓移到相邻前景宿主。直接变换窗口会把轮廓留在原位；本原型让窗口和该宿主处于共同运动容器，不改生产前景协议、不逐帧触发全局 resize，也不通过隐藏轮廓绕过问题。

检查实际操作单次、栏目滚动、三个拖动点/稳定终态/滚动转雪后的轮廓外框、关闭中断、角色切换、减少动态、动画关闭、替换与销毁。前景 DOM 数量和销毁后无重建有明确断言；这不等于逐帧像素、全部 clip/天气纹理、所有观察器或真实设备验证。结果仅绑定列出的关键输入摘要，未记录完整模块图。

初次检查暴露过未等内芯稳定、工具栏被窗口遮挡和前景脱节；前两项分别修正测试终态及夹具几何，第三项修正隔离共同容器。没有删除原生操作或放宽几何阈值。

## 采用前

等待负责人视觉选择。若采用，先确定原生窗口的容器/叠层/输入所有权，再做正式整合及相关设备回归；不得把夹具容器直接搬入所有宿主。现行设置整合保持，Study02/03不恢复。本候选未定案不自动阻断性能批次，亦不自行删减4.2已确认交付范围。
