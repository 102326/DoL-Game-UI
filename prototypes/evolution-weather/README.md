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


## C2 湿痕反馈修订（R4，待视觉评审）

负责人指出 C 的“湿痕太直，像画了条线”。本轮只调整湿痕及其实际水滴路径：原 C 默认查询与 R3 媒体保留；`trail=natural`启用 C2 的稳定空间偏移、按距离留痕、宽窄与干燥收细，以及无连续亮描线的原生背景湿润足迹。重力加速、速度上限、合并规则、静止水滴和设置 V2.3 不变。尺寸变化清除旧坐标湿痕，合并重置湿痕段，避免连接跳变位置。

打开 `trail-review.html` 看 C/C2 同操作同视口原速对照，或 `glass-optics.html?trail=natural` 操作近景。C2 最多 32 个裁剪背景足迹、900 条模型轨迹；按真实文字/控件及最终足迹边界保护。局部背景滤镜仍是近似效果，不是真实流体。四组媒体各自 16 MiB 上限，超限报错，合计最多 64 MiB；本轮不重录 V1/A/B。

```sh
node --test tests/evolution-rain-model.test.cjs
node tests/evolution-rain-glass.cjs --natural-trails
node tests/evolution-rain-glass.cjs --record --trail-baseline
node tests/evolution-rain-glass.cjs --record --natural-trails
```

原速录制的实际时间、性能与源码摘要写入各自 result.json；普通 smoke 为四分之一时间表，不称原速。新湿痕单独开关检查实际 DOM 像素变化，阅读区域晴/雨像素一致；技术检查不能代替负责人对自然感的判断。


## C3 持续滑落与底边流出（R5）

负责人认可 C2 后要求水滴生成并流过界面底部。`runoff=1` 在相同 C2 表面新增稀疏、持续的较大水滴，复用现有碰撞、光学、速度参数和湿痕；预留容量避免小滴填满后停止生成。水滴从上沿逐渐出现，到底边仍可见，由层本身裁剪，完全离开后回收。原 C/C2 不开启新行为。

C3 仍保护实际文字行、按钮、输入与阅读样本；不再把整块工具条/页脚的空白作为禁入区。保护区会隐藏经过的水滴，是可读性处理，不能声称在每条路径都无间断可见。新参数 `runoff=1` 仅用于研究场景，不改真实天气或生产UI。

`runoff-review.html` 提供 C2/C3 同操作原速对照；`glass-optics.html?trail=natural&runoff=1` 为近景。主录像延长雨天稳态12秒，便于看见水滴流出底边，然后保持原分类与雨转雪操作。近景前16秒为动态、后段为技术开关检查。六组历史/当前媒体各16MiB上限（合计最多96MiB），超限报错，不截断。

```sh
node tests/evolution-rain-glass.cjs --runoff
node tests/evolution-rain-glass.cjs --record --runoff-baseline
node tests/evolution-rain-glass.cjs --record --runoff
```

C2当前视觉认可不自动延伸到C3，更不等于整合或发布。模型检查覆盖持续生成、容量和干燥；真实设置底边在暂停时单独隐藏该滴对照实际像素，再恢复并核对回收。浏览器/设备/游戏验证边界同上。


## C4 雨量与雪天（R6，待评审）

负责人已认可 C3（9fa1fb0）的雨滴/底边流出，要求恢复雨量差别并指出雪效不明显。显式 `climate=1` 启用 C4，C3入口继续保留。沿权威 `readGameWeather` 的 light/normal/heavy/severe 分类，研究密度系数 .32/.65/1/1.5 连续变化，影响附着密度、微滴和补充频率；不是毫米雨量实测。速度参数和已认可水滴光学不变。四档按钮使用受控输入；未改生产天气提供者。

雪天在同一 Canvas 上以84个预设边缘雪晶和最多24个慢雪点为候选，按实际正文/控件几何保护；不新增全屏粒子层或定时器。雨雪沿原连续状态过渡，暂停/减少动态/隐藏/关闭仍复用原调度。C4微滴上限570，滑落/总水滴上限仍7/90，湿痕900段/32足迹；不自动降DPR或画质。

`climate-review.html` 提供 C3/C4 同控制行、同视口原速雨量/雪天对照。`glass-optics.html?climate=1`可切换四档雨量和雪天看近景。新增两组媒体各16MiB上限，八组历史/当前媒体合计最多128MiB，超限报错，不截断。

```sh
node tests/evolution-weather-levels.cjs
node tests/evolution-weather-levels.cjs --record --baseline
node tests/evolution-weather-levels.cjs --record
```

主计划包含四档雨量、30秒转雪、45秒稳定雪天、46秒回雨；普通检查以实际状态条件推进，不把它称为原速。C4 仍待负责人视觉判断，不代表G2整体通过、整合或发布。
