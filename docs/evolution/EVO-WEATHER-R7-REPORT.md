# EVO-V1-R7 — C5 斜向雨幕与湿玻璃叠加

2026-10-22，研究分支 `dev/evolution-4.0`，输入 `f1ba4e262be1acaca71886bd4e06ba72dc5cb7aa`。负责人在C4评审中要求：“下雨的效果可以加入之前的斜向下雨特效吗？”本轮只叠加该视觉，未据此宣称C4雪天或全局天气已获认可。精确交付提交、实际CI与后续裁决见 [Issue #22](https://github.com/102326/DoL-Game-UI/issues/22) 的R7记录。

## 做了什么

| 编号 | 实际结果 |
| --- | --- |
| EVO-V1-R7-SHOWER | 复用现有 `src/theme/kw-weather-shower.svg` 斜雨素材，在C4湿玻璃上加入向右下方的循环雨幕；小雨至强雨连续改变密度、速度和透明度 |
| EVO-V1-R7-COMPARE | 显式 `shower=1` 启用C5，加入“斜雨：开启/关闭”；同控制行、同视口、同操作、1×原速的关闭/开启对照，`shower-review.html`可观看并进入操作页 |
| EVO-V1-R7-GUARD | 先在现有Canvas画雨幕，再清除正文/按钮/输入保护矩形的并集，最后画既有玻璃内容；沿用动态布局保守保护与原调度 |
| CI-HANDOFF-01 / R7 | 更新本交付报告和当前HANDOFF，研究CI追加C5受控检查与失败证据白名单，原检查名称/触发和有效测试保留 |

素材和方向来自3.x `navigation-material.css` 的 `kw-weather-shower`；本轮改在现有Canvas里驱动连续密度和时钟，不是旧CSS逐像素复刻。没有恢复V1整套已否决的雨线/圆点效果。原C3/C4入口不自动开斜雨，水滴模型、附着/合并、自然湿痕、底边流出、四档天气分类和雪晶绘制不变。没有增加绘图依赖、额外Canvas、DOM雨幕、RAF或定时器；图片加载完成只请求现有调度刷新，释放时移除其回调。

这是两个视觉层的叠加：斜雨掠过，玻璃水珠附着滑动；没有模拟每一颗雨幕粒子撞击玻璃并变成附着水珠。雨量映射是设计值，不是实测气象参数。

## 验证范围

本机 macOS / Node24.18.0 / Chromium153.0.8010.12。新增测试首先在旧C4构建上失败于“new shower research must be available”，之后才实施。初次类型检查发现V1/C5联合接口缺少函数类型守卫，已修复并重跑；未将Vite单独成功当作类型通过。

- `npx vue-tsc --noEmit -p tsconfig.evolution.json` 与 `npx vite build --config vite.evolution-weather.config.ts`。
- `npm run ci:check`：状态合同、项目/adapter/early/framework类型。
- `node tests/evolution-weather-shower.cjs`：小雨/强雨/雨转雪，实际内容区像素开关对照，正文及关闭按钮严格PNG一致；静止时的时钟不变，减少动态不推进雨幕相位，390px无横向溢出，隐藏停止RAF/轮询，关闭释放与重开单层。
- `node tests/evolution-weather-levels.cjs`：原C4四档雨量、雨雪往返、正文/关闭保护和生命周期回归。
- `node tests/evolution-weather-shower.cjs --record --baseline` 与 `--record`：同1280×900 / DPR1，约1秒小雨、8秒强雨、15秒转雪、22秒截图后结束。全部实际等待保留，不剪辑加速。只有斜雨开关初始状态不同，不宣称播放器帧级同步。

斜雨像素对照使用 `.dmt-workspace` 内容区，排除了开关自身文字/焦点变化导致的假阳性；不是只检查计数器或依靠工具条变化证明画面改变。`protectedOverlap`继续描述已有水滴/湿痕/雪晶边界，不拿该计数器单独证明整幅雨幕安全。已有阅读/关闭实际像素与绘制时保护区域清除共同提供证据。

本轮原速媒体、两组结果、受控内容区像素对照及摘要在 `docs/media/evolution-weather-r7`；结果保留输入时间、实际状态、环境与源码摘要。历史R5/R6媒体及其manifest保持原始身份，不冒充新录制。

上述本机命令均已通过。原速关闭/开启视频分别23.48/23.44秒，12份媒体/结果共5,450,282字节（另有manifest）；逐文件体积/摘要、两组与独立像素smoke的相同源码身份均已核对，7份冻结基线摘要一致。构建后的画廊图片、两段视频加载及实际1×播放另已检查通过。

| 本机1×记录 | rAF中位 / p95 ms | JS绘制中位 / p95 ms |
| --- | --- | --- |
| 斜雨关闭 | 33.3 / 33.4 | 0.8 / 2.3 |
| 斜雨开启 | 33.3 / 33.4 | 0.9 / 2.4 |

这些是受控录制采样，不能推断所有浏览器/设备的帧率或GPU成本。

## 没有做与下一步

C5待负责人视觉评审；C3雨滴仍保持已认可状态，C4雪天没有收到通过裁决。未正式整合、合并main、发布、改版本/Tag/Host API/规则/bypass；G1/G2/G3未整体通过。A2/A3、Golden Spin V2、CJ-3C/CJ-4等其它任务没有因本批完成而自动完成。

没有真机、Safari、Windows、Android/iOS WebView、DPR2+、真实游戏/ModLoader/多Mod、多表面长期性能证据。rAF/JS绘制采样只描述受控浏览器操作，不是GPU耗时或真机FPS承诺。继续使用受控第一方夹具，无玩家存档读取/上传。

新增R7媒体一组16MiB硬上限；共九组理论上限144MiB，超限报错不截断。CI Artifact保留14天。研究CI不等于PR检查、完整标准Moody工作流或画质验收。下一步先评审斜雨与水滴叠加是否自然、速度/密度是否舒适，以及原C4雪天是否满足要求。


负责人后续反馈：要求“更铿锵有力、整体加快、雨越大越多越快”；C5尚未视觉通过，增强版见[R8报告](EVO-WEATHER-R8-REPORT.md)。R7旧证据保持原始身份，不作为新版本测试。

原C5（67b099f）自动push研究[CI39761001175](https://github.com/102326/DoL-Game-UI/actions/runs/39761001175)成功，prototype6分37秒；已回读模型6项/C5实际检查及Artifact上传成功。该运行不代表后续C5.1源码已验证。
