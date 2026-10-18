# 旧视觉源码封存

这里保留 3.0.1 清理前的原始外观入口与旧调色板断言，供维护和问题追溯使用。文件使用 `.txt` 后缀，不属于运行导入、构建入口或 Mod ZIP。

当前入口为 `src/theme/kraft-work-native.css`、`kraft-work-surfaces.css` 和已有 Kraft Work 专项样式；公共色板位于 `src/tokens.css`。保留的布局、尺寸、滚动、输入和原节点恢复规则按现有合同维护，不作为旧主题提供。现有材质质量档位仅控制效果强度，不切换 1.x／2.x 外观。

历史 `eyes-palette` 用例断言已退役的蓝色主题，因此一并封存；当前基线由 `tests/kraft-work-baseline.cjs` 检查实际 3.x 构建、公共窗口默认外观、原事件和第三方边界。其它行为用例继续执行。
