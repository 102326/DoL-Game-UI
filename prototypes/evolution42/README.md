# 4.2 · Claude设计延续 / Study 03

**2026-11-04：负责人裁决当前设计作废，停止作为采用候选推进。以下入口、源码及媒体保留供历史复现，工程PASS不是视觉认可。未开始替代方案；详见R1最新裁决。**

本轮延续Claude原方案，首批聚焦实际设置与Floating Hub。原首版因视觉差异不足保留为工程历史；本轮增加烟色厚度/暖冷边光/阅读井、真实内容内芯滞后和受力光带；Hub变为自由拖放、有限惯性和真实丝线召回。沿用 [同一计划](../../docs/superpowers/plans/2026-11-02-soft-wet-4.2-r1-review-plan.md) 和 [执行/原方案对应记录](../../docs/evolution/EVO-4.2-R1-2026-11-02.md)。当前是隔离候选，等待视觉反馈。

`FreeHub.vue`由c7d8bac的实际MotionHub隔离适配，继续使用真实Host/View/工具与球体渲染；位置和中断由实验消费者控制。生产src/framework/compat及公共协议没有改动。位置只写`Evo42.hub.position.v1`，可读取旧位置作为初值，不写旧键；这不是生产存储迁移。无新依赖、自动降质或全局布局编辑器。

使用项目Node26.12.1、锁定依赖（新设备先核对并执行npm ci）：

```sh
node scripts/preview-evo42.mts
```

打开 `http://127.0.0.1:5206/`。在页面选择材质/操控后打开实际设置；标题空白处可拖动，Alt+0/A/B比较材质，Alt+R切晴雨。4.1对照也使用共用拖动操作台，不宣称原发行版设置已经可拖动。页面选项是研究控制，不是新增玩家偏好。A操控为直接自由拖放；B可甩动并有限衰减。点击页面“召回到默认位置”或球体内侧“恢复位置”会牵引真实球体；再次抓取立即接管。边缘停靠是主动按钮，松手不自动吸边。

手动检查入口，不加入现有CI必需集合：

```sh
node node_modules/vue-tsc/bin/vue-tsc.js --noEmit -p tsconfig.evo42.json
node node_modules/typescript/bin/tsc --noEmit --module nodenext --moduleResolution nodenext --target es2022 --strict --noUncheckedIndexedAccess --types node --skipLibCheck --allowImportingTsExtensions prototypes/evolution42/check.mts prototypes/evolution42/free-check.mts prototypes/evolution42/shop-check.mts scripts/preview-evo42.mts
node prototypes/evolution42/check.mts
node prototypes/evolution42/free-check.mts
node prototypes/evolution42/shop-check.mts
# 只复测原生取消、退出防复活和手动序列中断：
node prototypes/evolution42/check.mts --lifecycle-only
```

完整本机检查生成 `tests/artifacts/evo42/result.json`、四段1280×900原速WEBM、1280/390截图及原型输入摘要。本次选定媒体和validation.json已随研发源码保存到`docs/media/evo42-study02/`，可在 `/prototypes/evolution42/compare.html` 查看；本机原始报告/失败/诊断仍在忽略目录，新设备重跑结果属于新执行环境。这里不下载游戏、不读玩家存档、不进行真实购买或保存。

Study 03已补实际商店第二结构：静态目录/工具栏沿用材质，详情标题可拖动；采用伪元素光层，避免真实控制器收编装饰节点。合成商品/配色/购买回调仅用于布局与动作观察。三材质共用研究舞台高度；不改生产商店或真实交易。第二角色工程验证不代表视觉验收。B的硬壳做有限面积守恒伸缩，原内容节点作反向补偿和最多7px滞后，实际命中随DOM，未克隆正文。真实雨Canvas随外壳；无实时DOM纹理或GL折射。背景模糊、紧凑/对齐和既有控件仍由实际设置管理。

检查保留旧生命周期/控件/宽窄几何合同，增加自由位置保存/取消/真实召回中断、中央和四角菜单、键盘二维微调、隐藏和活跃退出；原位置缺陷与首版工程媒体保留本机。视觉认可、目标WebView/Windows和GPU性能另记，不由自动化代签。

Study 03评审入口：`/prototypes/evolution42/shop-review.html`，操作页`/?scene=shop&material=force&motion=recall`。选定媒体及三份报告的输入摘要保存到`docs/media/evo42-study03/validation.json`；旧Study 02媒体保留。设置9项、Hub8组、商店7组；后者含宽窄三材质及受控popover失败回退，实际拖动/内芯、配色、原动作、重开、跨窗和清理。Hub补旧键只读初始化、无效位置和研究键存储失败；这些受控故障不等于实机失败路径全覆盖。一次早期拖动失败原因尚未完全确定，后续加实际命中前置与受控裁剪反例，详情见R1。
