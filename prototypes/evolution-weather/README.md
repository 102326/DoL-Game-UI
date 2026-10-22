# Evolution / 雨天 Acrylic 第二轮研究

2026-10-22。负责人首轮裁决：**Architecture Continue / Weather Visual Reject**。原V1雨天视觉已否决；连续参数、状态中断、释放与原证据保留。A/B未获认可，当前新候选C仍待评审，**不是Visually Accepted、正式Integrated或Release Ready**。

最新反馈：负责人认为A/B都有问题，先要求研究真实雨窗图片/视频，后已授权按研究方向制作下一版。C「湿玻璃」已实现，仍待视觉评审；A/B保留为未获认可的历史候选。[实拍研究](../../docs/evolution/EVO-WEATHER-REFERENCE-STUDY.md)与[C报告](../../docs/evolution/EVO-WEATHER-R3-REPORT.md)分别记录参考和施工结果。

## 观看和操作

```sh
node scripts/prepare-settings-refraction.mjs
npx vite --config vite.evolution-weather.config.ts
```

先打开 `http://127.0.0.1:5190/rain-review.html` 查看新C与V1/A/B同夹具原速对照；`http://127.0.0.1:5190/glass-optics.html`为独立材质近景，支持日光/夜灯/深色/条纹、暂停及背景位移开关。原`compare.html`继续保留第二轮历史录像。也可单独打开：

- `/?candidate=v1`：冻结98c32bc绘制器的已否决参考；新对照使用相同研究夹具，原R1布局与[旧录像](../../docs/media/evolution-weather-r1/weather-original-speed.mp4)单独保留。
- `/?candidate=beads`：A「雨沿」，清透附着玻璃，非均匀水珠在边缘和观察带积聚/滑移，局部湿痕、透亮与明暗体积。
- `/?candidate=film`：B「雾脉」，凝露/雾化水膜和柔化的排水通道，水珠为局部细节，雨中转雪沿湿边生霜。
- `/?candidate=glass&background=day`：C「湿玻璃」，默认新入口；没有观察带，使用原生SVG背景位移、实际碰撞合并与滑移湿痕。可切换日光、夜灯和深色背景。

新对照给V1/A/B同样附加`layout=surface&background=day`，共同移除观察带、使用同一较通透研究底材；原绘制器保持。旧记录不冒充新夹具的原始效果。日光/夜灯是受控DOM/CSS背景，没有实拍运行纹理。C对实际文字行/控件和阅读样本保护，不再整块排除workspace。正文保护可能隐藏经过的水滴，是明确的UI可读性处理。

[C原速](../../docs/media/evolution-weather-r3/glass-1x.mp4) · [接触/合并近景](../../docs/media/evolution-weather-r3/contact-1x.mp4) · [C稳态](../../docs/media/evolution-weather-r3/glass-rain.png) · [完整结果](../../docs/media/evolution-weather-r3/result.json) · [逐文件摘要](../../docs/media/evolution-weather-r3/manifest.json)。这批四段主对照在视觉计划结束后停止；390px与生命周期检查用独立smoke运行，不混入原速主视频尾部。

真实设置组件与已认可V2.3的100/80ms、立即可用及原分类保留。第二轮研究夹具的工具条与材质观察带不是正式布局升级；新C移除观察带。标题/正文/主要操作区按真实几何保护。W1、W2、W3与直接观雪控制受控天气；实际游戏Weather/存档不写入。A/B/C的「静止观察」是主动暂停，关闭重开恢复正常，V1不添加暂停机制。减少动态尊重用户选择，不自动改变DPR/效果档位。

[原速 V1](../../docs/media/evolution-weather-r2/v1-1x.mp4) · [原速 A](../../docs/media/evolution-weather-r2/beads-1x.mp4) · [原速 B](../../docs/media/evolution-weather-r2/film-1x.mp4) · [A 稳态](../../docs/media/evolution-weather-r2/beads-rain.png) · [B 稳态](../../docs/media/evolution-weather-r2/film-rain.png) · [实测记录](../../docs/media/evolution-weather-r2/result.json) · [摘要](../../docs/media/evolution-weather-r2/manifest.json)。源证据是受控真实组件，不是游戏天气实录。

## 技术可行性与验证

不同绘制层复用连续wet/snow/light/night状态及隐藏/减少动态/关闭释放。原`readGameWeather`提供者未改。A/B使用原生背景滤镜、SVG遮罩/剪裁、CSS曲面着色与Canvas局部细节；没有新增生产依赖。WebGL无法凭空读取任意DOM纹理，本轮也没有捕获/重建游戏DOM背景。**原生模糊/提亮与表面高光不是物理光学折射。**

`optics.html`提供普通CSS条纹DOM背景实验：暂停同一表面，只切换原生背景滤镜，截图必须发生变化。正文则反向检查真实阅读样本的晴/雨PNG字节一致，避免仅凭CSS支持或内部几何数据声称可用。实际经历过滤镜声明但不生效的失败，修正后再录制。

```sh
npx vue-tsc --noEmit -p tsconfig.evolution.json
npx vite build --config vite.evolution-weather.config.ts
node tests/evolution-weather-candidates.cjs --optics-only
node tests/evolution-weather-candidates.cjs --record
node tests/evolution-weather.cjs
node --test tests/evolution-rain-model.test.cjs
node tests/evolution-rain-glass.cjs
node tests/evolution-rain-glass.cjs --record
```

第二轮三段及新四段原速录制分别使用相同1280×900/DPR1与事件计划：晴天静观、雨附着、稳态、真实分类使用、中途转雪；各自保留完整等待，不剪辑/加速。真实分类/调度可能令总长不同，JSON记录实际时间戳。普通CI不录影，使用1/4时间表做行为smoke，不把它称为原速或长期稳定。原V1技术检查独立保留。

基本性能记录rAF帧间隔和JS/Canvas绘制时间，**不是GPU合成计时或实际设备FPS承诺**；实际数值见JSON。A/B水珠滤镜限定各自边界，水膜只处理周边/观察带五块区域；C逐滴原生SVG位移，未靠自动减少画质来通过。候选仍可能比V1有额外合成成本。单表面至多1个RAF与500ms采样轮询，geometry observer/scroll listener与光学层随dispose释放。媒体仅复制白名单，第二轮与新C各自16MiB上限（合计至多32MiB），超限报错。

## 未完成

负责人画质验收、Safari/Windows/Android WebView、DPR2+实机、游戏背景根/多Mod整合、多表面与长期性能未通过。A/B本轮不是中央Weather Runtime的正式推广，未替换生产SVG/CSS或材质合同。G2不能由测试代替，G1/G3也未完成。更详细的失败/成果/未做事项见[第二轮报告](../../docs/evolution/EVO-ROUND2-REPORT.md)。
