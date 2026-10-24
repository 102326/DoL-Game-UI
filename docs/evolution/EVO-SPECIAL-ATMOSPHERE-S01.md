# 特殊环境 S01：异世界、极热与严寒

**最新I01接续**：[实际设置整合报告](EVO-SPECIAL-INTEGRATION-I01.md)。已认可绘制现已迁入src并接入实际设置，预览不再注入源码，本地构建与针对性回归通过；未提交/推送、未装入Android、未发布。下文“仅原型/未接入”及媒体身份描述保留为原批历史，不代表I01当前状态。

2026-10-24。负责人认可当前血月B01，授权继续其余特殊环境，并要求完整动态预览、暂不发布。本轮只在实际设置窗口的隔离预览中替换三种绘制，不修改游戏运行包。

## 观看

```sh
node scripts/preview-evolution-blood-moon.ts --special
```

打开 `http://127.0.0.1:5196/`。选择环境后点击“打开设置”；窗口内可直接使用以下快捷键，实际分类与设置控件可操作。

| 快捷键 | 环境 | 本轮表现 |
| --- | --- | --- |
| Alt+1 | 普通夜间 | 无特殊环境，对照 |
| Alt+2 / Alt+3 | 血月 / 雨中血月 | 保留负责人认可的B01绘制及红色泛光 |
| Alt+4 | 异世界 | 不同方向的紫色流云、局部亮部与稀疏星尘 |
| Alt+5 | 极热 | 不规则热雾上升，局部日照与暖反射 |
| Alt+6 | 严寒 | 缓慢冷雾、玻璃边缘附着结晶，不额外下雪 |
| Alt+7 | 普通雪天 | 原有霜羽、边霜与雪粒 |
| Alt+8 | 异世界＋雨 | 紫色天空与原有玻璃水珠、斜雨共存 |
| Alt+9 | 严寒＋雪 | 冷雾与原有雪效共存，减少重复的边缘结晶 |

- [桌面完整原速视频](../media/evolution-special-s01/desktop-1x.mp4)（72.84秒）
- [390px窄屏完整原速视频](../media/evolution-special-s01/narrow-1x.mp4)（49.20秒）
- 完整窗口截图：[异世界](../media/evolution-special-s01/alien.png)、[极热](../media/evolution-special-s01/heat.png)、[严寒](../media/evolution-special-s01/cold.png)、[异世界＋雨](../media/evolution-special-s01/alien-rain.png)、[严寒＋雪](../media/evolution-special-s01/cold-snow.png)。
- [输入身份及检查](../media/evolution-special-s01/result.json)、[媒体SHA-256](../media/evolution-special-s01/manifest.json)。

视频保留原速，展示持续动态、分类切换、布局切换、真实设置、关闭重开及回到普通夜间。输入由预览页控制，调用现有原生状态读取器；不是自然游戏事件或真机录屏。

后续曾按负责人要求试验BR01血色雨及BR02滑落血滴；负责人现明确撤回这两项，要求恢复普通雨，并认可这一批。当前操作页已移除两项注入，Alt+3为血月＋普通雨，Alt+0为普通雨天对照；血月与其它三种特殊环境绘制不变。S01视频保留原录制身份；[回退结果与当前截图](../media/evolution-special-accepted/rollback.json)单列，不冒充重新录制全部媒体。

## 实现与范围

`prototypes/evolution-weather/special-atmosphere.ts`预生成紫云、冷雾和热雾三张原创纹理，加一张控件保护遮罩，复用窗口原有Canvas和时钟。没有新增依赖、轮询或独立动画循环，关闭时释放四张内部画布。热流是空气纹理的视觉表现，不宣称实际折射或热力学模拟。

血月绘制文件与认可B01的SHA-256相同，原媒体保留历史输入身份。本轮扩展已有预览服务器的显式 `--special` 模式，旧血月入口保持原来可选范围。新增绘制及移动文字的保护逻辑只在该服务器注入，不进入正式构建。

分类转场继续跟踪真实文字、按钮的位置，不再用整块正文矩形切断环境光；雨滴原有保护逻辑保留。真实控件的输入、焦点、双布局、关闭与释放由现有设置组件处理。

环境判定仍来自既有 `readGameWeather`：异世界位置、原生极端温度与降水分别读取。本轮没有增加天气枚举或改原生判定。节日雪复用现有雪效；雷雨、普通雾及其它普通天气不作新一轮重设计。没有改游戏时间、位置、业务、存档、Host合同或任何已验证ZIP。

## 验证与限制

检查及录制命令：

```sh
node node_modules/typescript/bin/tsc --noEmit --target ES2022 --module ESNext --moduleResolution bundler --strict --skipLibCheck --allowImportingTsExtensions --types node,vite/client prototypes/evolution-weather/special-atmosphere.ts prototypes/evolution-weather/blood-moon.ts scripts/preview-evolution-blood-moon.ts scripts/record-evolution-special-weather.ts
node scripts/record-evolution-special-weather.ts --record
```

专项以三种环境分别检查真实正文与关闭按钮像素、静态减少动态、实际像素运动、无凭空降雪，以及每种环境两个分类切换后各1400ms的逐帧连续性。另检查真实偏好操作、双布局、雨雪共存、390px边界、关闭动画及释放。录制前后核对输入SHA-256，并核对血月绘制与生产输入未改；最终浏览器版本和结果见媒体JSON。

最终独立类型检查与10组专项通过，浏览器为Edge 157.0.4341.16。两段原速视频、六张截图和结果记录共9项负载约6.1MB；全部媒体及九项源码输入SHA-256复核一致，已查看桌面与窄屏代表性帧。没有为本原型重跑无关游戏业务或将旧CI结果标成当前新增检查。

初次检查将跨分类回流后的关闭按钮与首次打开时的画面比较，出现最大1级RGB差异；显式统一焦点仍不能消除。保留原始失败和像素/几何记录后，改为每种天气在同一布局、同一焦点下配对普通夜间与特殊环境，保留完全相同的像素断言。极热首稿出现规则竖条，画面检查后改为不规则上升热雾，没有将首稿作为最终预览。

另一轮减少动态检查在合成截图比较处失败。当前检查先等特殊环境静态帧提交、原天气时钟无待执行帧，再严格比较Canvas原始像素，避免把背后布局/合成变化当成天气自身运动；正常动态也比较原始像素。原合成截图失败继续保留，不据此宣布整个UI所有动画均静止。

本轮交付现为 Visually Accepted / Prototype：负责人认可保留血月、异世界、极热与严寒，并恢复原普通雨。认可限于这一批隔离效果，不等于尚未接入的新运行包或整体G2/G3已经通过。当前源码和媒体尚未提交/推送；未接入研发安装包，未做Android、iOS、自然特殊事件、长期资源或真机性能验收。main、Tag、Release、公开Assets均未修改。
