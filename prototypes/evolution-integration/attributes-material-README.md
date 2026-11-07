# 属性窗口受力整合与受控对照

负责人于2026-11-05认可方向并授权正式整合。当前 `study` 展示实际 `characteristicsMaterial`，沿用已认可设置窗口的有限外壳应变、内芯滞后及现役V1黑灰材质、60档、默认左对齐。内容和外壳几何仍为合成夹具，不加载游戏资产，不代表4.2实机验收。

## 运行与对照

- `node scripts/preview-evo42.mts`，打开 `/prototypes/evolution-integration/attributes-material.html`。`?variant=baseline` 使用未接入受力的原共享导航；`?variant=study` 使用正式属性owner。
- `node prototypes/evolution-integration/attributes-material-record.mts` 生成本机录像，打开 `/prototypes/evolution-integration/attributes-material-compare.html`。
- 两版同操作脚本、1280/390 × 900、1×播放；独立录制不保证帧同步，不能用录像长度判断性能。媒体只在忽略目录，其他设备须重新录制。
- `node tests/attributes-material.cjs` 为已纳入标准/研究catalog的合同；先 `npm run tooling:build`。
- `node prototypes/evolution-integration/attributes-material-check.mts` 保留操作对照。`--legacy-target` 刻意只移动旧原型窗口，前景对齐应失败；旧study模块只用于这个受控反例，不是产品路径。

## 正式所有权与视觉坐标

属性owner通过内部presentation钩子管理挂载、刷新和释放；原生窗口、内容、父节点、操作和滚动所有权保持。没有把早期原型的共同wrapper搬到游戏DOM，也不保存拖动位置。只接入属性角色，未推广到社交或其他原生窗口。

每帧合并坐标写入，再调用已有前景同步器；仅该角色的分离前景使用真实缩放，把DOM雨滴、水迹、裁切Canvas和轮廓置于窗口同一本地坐标。关闭、角色替换、禁用、失焦、旋转、减少动态与外部变换均有取消/恢复路径；不支持的变换不覆盖原样式。

自有translate/scale写入有精确身份，避免逐帧触发天气数据读取；混合外部样式变更仍刷新。设置消费者共用该抑制机制，既定运动参数不变。正文滞后期间保守保护，标题沿用细粒度保护，终态重新测量；不以遮掉整个雨区掩盖不同步。

## 验证边界

合同覆盖1280/390 × zoom1/1.25、原生单次动作、栏目滚动、捕获中断、雨雪、前景轮廓与可见雨滴实际几何、同帧指针合并、静止无继续样式写入、减少动态、缺能力回退及所有者释放。Mac Chromium不等于Android/WebView或真实游戏、美化组合。完整CI、源码及包身份以当前HANDOFF/报告为准；旧隔离原型通过不能代签新实现。
