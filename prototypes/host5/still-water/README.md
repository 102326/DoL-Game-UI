# 三版实包中性对照

在各自的隔离页面中运行实际玩家 ZIP 的 CSS 和启动脚本。测试页面提供相同的正文、原生选项、侧栏和中性商品。页面上的购买和试穿只计数。选择“统一自定义色”会通过各版正式设置应用同一组输入；“各版出厂默认”用于分别查看原始视觉。玻璃和视口可单独控制。

1. 从 GitHub 的 v4.5.1 Release 获取公开玩家 Host 和 UI ZIP，标签指向 `d643674`。在 `1fcbfe0` 和本批候选的各自干净检出上，以锁定依赖运行 `npm run framework:build` 与 `python3 scripts/package-framework.py --players-only`，保留每次的双包。
2. 在候选检出下生成页面。生成器核对两个基线各自的双包摘要，在页面中展示三对 ZIP 的 SHA-256。

```sh
node prototypes/host5/still-water/build.mts \
  "$RELEASE_HOST" "$RELEASE_UI" "$BEFORE_HOST" "$BEFORE_UI" \
  "$CANDIDATE_HOST" "$CANDIDATE_UI" "$PREVIEW_DIR" "$CANDIDATE_COMMIT"
node prototypes/host5/still-water/check.mts "$PREVIEW_DIR"
```

直接打开生成目录的 `index.html`。宽屏与窄屏共用同一内容；请实际点选商品与侧栏设置，再切换版本比较。自动检查读取各包的真实计算样式，覆盖正文边界、侧栏、语义色和玻璃开关。安装升级身份见[双包复核](../package-check/README.md)。移动系统输入法、真实购买和设备色彩表现需在目标宿主另验。
