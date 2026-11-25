# 5.0 浅色主题离线预览

解压交接附件，用 Chrome 或 Edge 直接打开 `index.html`。顶部可在静水暗玻、雾白玻璃、暖瓷之间切换，可选 390 或 1120 CSS px，并开关玻璃。点“界面设置”可在“材质”中试色、取消或保存。点“商品详情”可在中性商品上使用购买、试穿或返回。预览通过候选双包自带的 JS 和 CSS 运行，正文、商品与回执均为中性夹具。离线页面的偏好仅供当前预览使用。持久化由有独立存储的实包回归验证。

在原研究分支手动运行 Kraft Work CI，勾选 `offline_theme_preview`，从该次运行下载 `softwet-offline-theme-<commit>`。附件包含上述页面、生成它的双包和 SHA256SUMS.txt，保留 14 天。也可用 Node 26、Python 3 和仓库锁定依赖在本地重建：

```sh
npm ci
node scripts/build-framework.mts
python3 scripts/package-framework.py --players-only
node prototypes/host5/light-preview/build.mts dist/framework/StoneFreeHost-0.1.5-experimental.mod.zip dist/framework/DoLGameUI-4.5.1.mod.zip index.html
node prototypes/host5/light-preview/check.mts index.html
node prototypes/host5/theme/light-check.mts dist/framework/StoneFreeHost-0.1.5-experimental.mod.zip dist/framework/DoLGameUI-4.5.1.mod.zip
```

最后两步使用本机安装的 Chrome。像素检查将相同位置有字与隐藏字的截图配对，在实际合成背景上统计有变化的字形像素。P95 是可重复的浏览器采样指标。具体范围、遗留样本与真机接续见 [HANDOFF](../../../docs/HANDOFF.md)。
