# EVO-V1 / 天气 Acrylic 首个研究候选

2026-10-22。Implemented / Controlled Tested / **Visually Accepted待负责人，Integrated与Release Ready未通过**。

使用真实设置组件及已认可V2.3开关/分类，旧研究副本通过`prepare-settings-refraction.mjs`固定来源。只在独立研究入口叠加自有Canvas材质，不把受控天气写进真实游戏。`readGameWeather`权威字段分类、雷暴/雨量/夜间与unknown/异常fallback代码未改；原生产headerWeather仍在正式路径。

## 观看

```sh
node scripts/prepare-settings-refraction.mjs
npx vite --config vite.evolution-weather.config.ts
```

预览http://127.0.0.1:5190/。模态内工具条：W1晴天、W2晴转雨、W3雨途中转雪，以及直接观雪。原分类、布局、偏好和关闭照常操作；关闭后可从背景入口重新打开。

- W1：静态玻璃主面、暖色环境照明，稳态不保持无用RAF。
- W2：同一表面上湿度连续增加，立体水珠、窄水痕与反射边缘逐渐建立，不交叉淡化两套旧天气层。
- W3：从当前湿度继续改变雪/霜参数，水痕衰退与局部霜枝增长可重叠，不跳回固定首帧。工具条先设雨、900ms后转雪；也可手动先W2再直接观雪。
- W4：持续状态下切换真实设置分类，隐藏/恢复、关闭/重开和缩放不会留下自有RAF/轮询；重开按当前天气建立新实例。

[原速录像](../../docs/media/evolution-weather-r1/weather-original-speed.mp4) · [晴天](../../docs/media/evolution-weather-r1/W1-clear.png) · [雨天](../../docs/media/evolution-weather-r1/W2-rain.png) · [中途转雪](../../docs/media/evolution-weather-r1/W3-snow-interrupt.png) · [本机证据](../../docs/media/evolution-weather-r1/result.json)。画面是受控输入的真实设置组件，不是游戏天气实录；这仍是第一版视觉候选，未宣布高保真目标已经验收。

## 验证与成本

`npx vue-tsc --noEmit -p tsconfig.evolution.json`、`npx vite build --config vite.evolution-weather.config.ts`、`EVO_WEATHER_ENDURANCE_MS=60000 node tests/evolution-weather.cjs --record`。本机macOS / Node24.18 / Chromium153，4个场景检查组通过；W4正常动画持续观察60秒，再检查隐藏/恢复、390×844、用户主动减少动态、关闭/重开与释放。视频为1×原速，无剪辑/加速，不把60秒等同数小时或真机长期稳定。

没有新增npm依赖；使用已有GSAP/Vue的设置原型及原生Canvas。当前固定42个种子点，同步推进湿度/雪/照明参数，每表面至多1个RAF＋1个500ms采样轮询，独立ResizeObserver及可见性监听，dispose显式释放。snapshot.reads计refresh次数，不含初始化读取。DPR使用实际值，本轮浏览器为DPR1；没有用隐性自动降低档位制造通过。Canvas缺失时只保留基本静态UI，不称完整视觉效果。

## 未完成

尚未比较WebGL/Shader方案、完成雨量等级视觉差异、多个正式表面共用环境实例、长时间/多窗性能或真实Android WebView验证；当前Canvas模块是研究资源所有者，不是已经推广的中央Runtime。W4其他目标设备与长时间观察、正式管理合同接入和独立技术复核仍待继续。源代码/截图/录像没有玩家存档、私人设备标识或游戏HTML。

G2需要负责人认可实际画面，不能由场景检查替代；本轮没有动正式Weather读取或生产天气层，没有删除旧SVG/CSS。
