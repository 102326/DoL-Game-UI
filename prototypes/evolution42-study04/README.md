# Study 04：设置窗口隔离研究

2026-11-05后续：负责人确认此设置小样方向，开始设置窗口整合。原始源码与录像已封存在本地性能候选的 `REVIEW-SNAPSHOT.zip`。当前组件已有自有拖动，旧 `main.ts/check.mts` 仅留作原实验记录，不再叠加执行；当前验证入口为 `node prototypes/evolution-integration/settings-material-check.mts`，预览为 `/prototypes/evolution-integration/settings-material.html`。以下记录对应确认时的隔离小样。

从仓库根目录运行 `node scripts/preview-evo42.mts`，打开 <http://127.0.0.1:5206/prototypes/evolution42-study04/index.html>。自动打开真实4.1设置；标题空白拖动，Alt+0/Alt+1切换4.1/Study04。原生控件聚焦时可先点标题或移开焦点；关闭后页面按钮可重新打开。两种模式使用同一舞台、同一实际设置 DOM 和同一拖动研究工具；4.1发布版本不因此被说成已有拖动。另有 `compare.html` 同视口原速录像，本机未跟踪媒体可通过 `node prototypes/evolution42-study04/check.mts` 重建。

## 来源与适配

- 原始 V1 (`SoftWet-UI-Design-V1-20261027.zip`，SHA256 `ef2109b81b6690abf60e615ba61c7ac8b04e07e862e5965c56e92269826cd9e0`)：`source/lab/quartz.css` 的 126° 暖受光/冷回光、深色承载及外壳轻微阴影；具体强度照原值，透明度改用现役 `--dgu-acrylic-axis-*`，保留滑杆与玻璃关闭回退。布局、标题高度、真实控件由现役 `src/theme/SettingsPanel.vue` 和生产样式负责，未采用 V1 旧尺寸。
- JELLY (`SoftWet-JELLY-Prototype-20261027(2).zip`，SHA256 `7f09cb06e86d6447da8b69960ba81446492c59ed471dcccc4621342e64686074`)：`DESIGN.md` 第一、二、四节及 `js/app.js` 的硬壳有限应变与内芯延迟、随时由新抓取中断。这里复用既有 `../evolution42/material.ts` 的真实 DOM 手势和衰减研究实现；数值与物理模型是项目适配，非 JELLY 逐项复刻。光带、应力线及舞台装饰不显示；静止时无附加装饰循环。
- 背景是本研究新建的低对比渐变，供两模式共用，不来自原作；不加载已否决 Study02/03 的 `style.css`。研究背景和夹具不是游戏场景。

## 验证与边界

本机 Node 26.12.1、Playwright Chromium：`node prototypes/evolution42-study04/check.mts` 对1280×900和390×900两模式检查真实分类、玻璃关闭/恢复、透明度0/60、对齐选择、拖动与重抓、键盘切换、关闭重开、系统减少动态与释放后防复活及页面错误；截图与原速录像保存在忽略目录 `tests/artifacts/ui42/study04/`。录制为独立运行，不保证帧同步。早期对照热键检查在选择框保持焦点时未收到按键；当前先移开焦点后检查。视频帧率、真实游戏、物理设备和视觉认可未验证。窗口受力、边界及关闭行为仅为研究入口，不接入产品。


本机定向类型检查使用忽略的 `tests/artifacts/ui42/study04/tsconfig.json`（extends `../../../../tsconfig.json`，include 新 `main.ts` 与 `src/**/*.d.ts`）：`node node_modules/vue-tsc/bin/vue-tsc.js --noEmit -p tests/artifacts/ui42/study04/tsconfig.json`；严格检查脚本与预览服务：`node node_modules/typescript/bin/tsc --noEmit --module nodenext --moduleResolution nodenext --target es2022 --strict --noUncheckedIndexedAccess --types node --skipLibCheck --allowImportingTsExtensions prototypes/evolution42-study04/check.mts scripts/preview-evo42.mts`。两项本机通过；完整输入与媒体摘要、早期失败留在同目录 `validation.json`。录像通过原有 Vite 服务的对照页和媒体 HTTP 响应检查；不声称播放器已人工逐段验收。
