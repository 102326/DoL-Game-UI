# EVO-MAT-READ01 · 设置底材可读性研究

当前产品设置仍使用已认可的S01底材与FROST02雪天。候选只在专属预览服务器中向实际CSS追加单层 `backdrop-filter:blur(24px) saturate(.9)`；启用玻璃时生效。没有改默认入口、底色、布局、控件、天气几何或开关/分类时长。

环境要求：按锁安装Node依赖、安装Playwright Chromium并先运行 `node scripts/build-framework.mjs`。录制检查另需系统PATH中可用的 **FFmpeg**（`ffmpeg -version`）；`ffprobe`用于核对视频时长。它们不是npm自动安装的依赖。端口5196/5197须空闲；不复制另一设备的node_modules或本机服务。

在仓库根目录启动当前参考（5196若已有服务可复用）：

```sh
node --input-type=module -e "import {createSettingsPreviewServer} from './scripts/preview-evolution-settings.mjs'; await createSettingsPreviewServer(5196)"
```

另启候选：

```sh
node scripts/preview-evolution-acrylic.mjs
```

访问 `http://127.0.0.1:5197/prototypes/settings-acrylic-v1/compare.html`。实际操作页 `http://127.0.0.1:5197/?weather=snow`；打开设置后Alt+1/2/3切晴/雨/雪。旧/新采用相同第一方背景，未隐藏背景文字美化画面。背景标题显隐只发生于单独像素见证测量，公开截图及录像均恢复可见背景。

```sh
node scripts/check-evolution-acrylic.cjs
node scripts/measure-evolution-acrylic.cjs
```

第一条保存1280×900/390×844、DPR1的晴/雨/雪截图与桌面旧/新同操作原速录像、源码/媒体摘要，复用W01九组健康检查；玻璃关闭要求旧/新整窗像素相同。16MiB总上限与文件白名单均为硬检查，未完成/失败不保留PASS清单，逐轮原始截图及失败现场保存在忽略的本地目录。原S01的默认无blur合同没有修改；本研究不加入默认CI设备矩阵。

第二条为两视口、两天气、旧/新各6秒的8项短时rAF间隔/天气JS绘制观察，检查单实例及关闭归零；无录像干扰。其结果不能证明GPU完成、真实设备、长期性能或画质通过。数据来源为受控第一方页面，不读取游戏/存档。

**当前结论：仅保留研究，不接入。** 背景标题差分的高频边缘下降约85%，但桌面雨/雪短时rAF中位间隔由约16.7ms升至33.3ms；窄屏未出现相同退化。移动到伪元素、dialog backdrop或降低半径都未完整恢复对照表现。尚未证明GPU根因，尚无负责人材质验收；先处理性能与目标浏览器复核，再决定视觉评审和实际接入。

完整交付见 [EVO-MAT-READ01](../../docs/evolution/EVO-MAT-READ01.md)，短时观测和三个假设结果也随源码保存。换设备不需要复制本机服务或忽略目录；按这里的命令重建服务即可。

其它原生窗口、main、正式版本/API/Release和CI治理不在本片范围。
