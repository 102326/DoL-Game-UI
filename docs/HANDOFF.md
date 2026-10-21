# Soft & Wet 3.1 / #22 设置过渡V2.3原型交接

更新：2026-10-21。接手先核对HEAD、工作区、远端分支、依赖及实际环境；不从旧计划自动扩展范围。

## Current — 当前做什么

- [#22](https://github.com/102326/DoL-Game-UI/issues/22)。[正式产品口径V1.0](SOFT_WET_3.1_PRODUCT_DIRECTION_V1.md)已批准；负责人后续明确授权“界面设置＋折光聚合与层叠展开”一版原型，提供旧新版同操作、同视口、原速对照。**负责人已认可V2设计（e018f5e），随后要求开关再稍快；最新澄清为“速度和旧版一样，其它依旧新版”；最新指令删除开关折光/层叠效果：V2.3只用100/80ms淡入淡出，正文立即可用；分类保持V2.2，待观看确认。不推广其它窗口、不合并main、不发布。**
- 分支 `prototype/golden-spin-b`。新增原型只在 `prototypes/settings-refraction-v1/` 与相关准备/验证/预览脚本，正式 `src/`、`framework/`仍保持b507原代码。精确提交、未推送/未提交状态以当前Git检查为准；[本轮验证摘要](media/settings-simple-v2-3/validation.json)记录实测文件摘要，接手不可把文档状态当作清洁工作区证明。
- 旧版冻结公开v3.0.4源码 `915dcb9e85f3266a73a3e7ce38d769edd0c29ff4`；候选基于b507，在忽略的生成副本中只替换设置打开/关闭与分类过渡。源身份、逐文件摘要及检查范围见[原型说明](../prototypes/settings-refraction-v1/README.md)。
- 核对时main仍 `6a6e3c00b705dc67d37c1780b27f585847da5d1a`；公开UI3.0.4/Host0.1.5-experimental、ModHub兼容1.0.1均未改。b507为基础修整和可靠性改进，b507本身未获新窗口视觉验收；后续隔离设置V2的视觉认可单独记录，球体认可独立保留。

## Decided — 已经确定什么

- 快速流畅、华丽精致、感知舒服协同实现。有价值的新特效可有合理演出及必要功能等待；允许新框架/较大重构，不统一限制为短、轻或只有代理可动。仍保持Host＋UI、3.x Acrylic、业务/存档与兼容合同。
- 设置候选复用现有GSAP3.15，光脊与后层/主面展开、内容分层、方向性交接、原进度反向收束；已认可V2完整打开560ms/关闭300ms；V2.1微调为500ms/260ms，正文约438ms开放操作；V2/V2.1分类进入620ms/退出300ms；V2.2分类进入/退出620ms，以旧版曲线前置显现，不回退新版形态；V2.3已按最新指令取消开关折光/分层，改为100/80ms透明度过渡、正文立即可用；V1–V2.2保留历史参考。不是全局时长合同。没有增加生产依赖或改写共享sourceMotion。
- 本机macOS/Node24.18/Playwright Chromium153，执行 `node scripts/prepare-settings-refraction.mjs`、`npx vue-tsc --noEmit -p tsconfig.settings-refraction.json`、`npx vite build --config vite.settings-refraction.config.ts`、`node scripts/check-settings-refraction.cjs --record`。14组技术检查及两组录像验证通过，完整证据见摘要；源码摘要关联实测工作树，接手须匹配当前文件。
- 桌面1280×900、窄屏390×844，同DPR1/100%页面缩放，12次相同操作和时间表；保留完整等待，不变速/剪辑。主录像从实际静态构建录制，鼠标命中另检。窄屏模拟不是实机，事件开始记录不是光子级输入延迟。
- 研究工作流增加独立设置候选构建/检查和白名单证据，保留既有球体/Hub/窗口测试与检查名称。V1最终CI39570120295成功仅为历史证据；已认可V2精确CI[39572774409](https://github.com/102326/DoL-Game-UI/actions/runs/39572774409)成功（e018f5e）；V2.1精确CI[39575003560](https://github.com/102326/DoL-Game-UI/actions/runs/39575003560)成功（1592777），V2.2 [CI39576644288](https://github.com/102326/DoL-Game-UI/actions/runs/39576644288)失败：分类1028ms，旧版790.7ms，超出原180ms容差；V2.3初始提交38b858d的[CI39577638271](https://github.com/102326/DoL-Game-UI/actions/runs/39577638271)通过。静态材质保留修正后最终提交的CI另记于#22，不继承初始提交的通过，不把过往球体或b507的成功当成本候选CI。

## Next — 下一步做什么

1. 负责人观看[桌面原速对照](media/settings-simple-v2-3/settings-simple-v2-3-desktop-1x.mp4)和[窄屏原速对照](media/settings-simple-v2-3/settings-simple-v2-3-narrow-1x.mp4)，确认V2.3简短开关过渡是否合适；分类保持V2.2；V2设计的认可已记录。
2. **等待本次速度反馈，不自行推广其它窗口或进行生产整合、合并和发布。** 旧首批计划仅为历史；本轮设置授权也不代表全局候选或其它原型获认可。
3. 继续实施时先核对当前源码/构建/证据身份；浅克隆需获取两份固定源码，按说明重建。保留隐藏页/卸载、旧回调、代理所有权和缩放可靠性，不机械丢弃。
4. Windows、Android/iOS/WebView、实际游戏/ModLoader与真机性能/第三方整合仍未验证，不因视口或研究CI绿灯宣布完成。

本机服务、原始日志/WebM和路径仅在忽略的HANDOFF.local.md；另一设备不可假定可用。本轮没有读取玩家存档或上传设备标识。
