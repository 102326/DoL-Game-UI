# Soft & Wet 4.1 — 当前交接

更新：2026-11-02。总跟踪 [#31](https://github.com/102326/DoL-Game-UI/issues/31)。当前版本源码与制品已核对，负责人已验收效果并授权正式发布。

## 当前交付与发行输入

- 产品冻结：`fdcda5e4c87b36754c60a202dc75ca9df7c340eb`；最终代码及玩家文案在该提交。`v4.1.0` 应指向这一已验源码，不使用旧研究 HEAD。
- 本次后续记录只更新交接、技术报告与制品清单，不改变产品、依赖、打包输入或测试。其提交不能冒称被旧 Run 覆盖，相关运行代码证据可复用。
- [4.1 发布入口](https://github.com/102326/DoL-Game-UI/releases/tag/v4.1.0) · [玩家正文](RELEASE_4.1.0.md) · [安装与回退](INSTALL_4.1.md) · [最终制品记录](releases/4.1.0/RELEASE_RECORD.json)。公开操作结果以发布页与 Issue #31 的最终回执为准。
- Assets 为九个 Mod ZIP 与 SHA256SUMS；截图和原速视频在仓库/页面展示，技术报告不作为玩家附件。原有4.0.x保持可回退，不覆盖旧附件。

## Delivered

- V1/default60/默认左对齐，Acrylic连续通透度，阅读三滑杆，设置双布局；官方及已适配兼容窗口共同跟随显示偏好。
- 悬浮球双层扇形按钮独立悬空，三个辅助操作位于内圈，网格保持面板布局；金属球回旋、展开与收束保留。
- 普通页面换页直接显示，删除620ms三维翻页及普通页淡入；只有UI设置分类保留20ms淡入。衣柜直接进入，分类无加载效果；商品选择波纹和穿戴反馈保留。
- 修复服装店CSS内容宽度与脚本含内距宽度不一致，窄屏详情采用有界可滚动抽屉，宽屏回到侧栏。
- 原生作弊/选项多箭头步进按钮至少44px方形、零文本内距、图标不换行，随字号/按钮比例变化；原生回调保持。
- 保留已验天气与玻璃前景优化、ModHub1.9.2精确源规则缓存。游戏/存档语义、Host + UI双包与公共合同不变。
- 更新 ModHubSoftWet1.0.3、ReOverfitsSoftWet1.0.1、SmartPhoneSoftWet1.1.2；Host与其它四包复用公开原字节，并与最终CI成员逐项相同。

## Validated

- 标准 [41349645327](https://github.com/102326/DoL-Game-UI/actions/runs/41349645327) 与研究 [41349649019](https://github.com/102326/DoL-Game-UI/actions/runs/41349649019)：精确 `fdcda5e`、Attempt1、success。两份独立验收均PASS/COMPLETE，标准moody-gate通过。
- 本机下载并重算四个artifact：两份小型独立结果、标准检查与构建。196个标准索引文件、10个构建负载、九包CRC/元数据/依赖/许可/成员/负例/双构建通过，封存sourceAfter一致。124MB研究媒体由远端独立job完整验证，未本地重复全量下载。
- CI主UI原ZIP SHA-256 `3d9f27a1dbdbccd986c83f8f795006f5afae0a40ceb6b24a458a4f0175b83025`；实机本地ZIP `89b66f3fb22ee4ded2e74259a3e499ecd4f8214be7b14b6a7006bc537ce93ca5`，容器压缩字节不同，全部20成员逐项相同。八个加载包与最终CI成员匹配，ReOverfits目标未安装。
- Android17/WebView155，1363×876 CSS：原生作弊按钮44×44px、无临时补丁、无错误节点；尺寸采样未点击作弊动作，金额不变。服装店临界宽度详情边界/滚动、设置五分类20ms/单节/无残留inert、衣柜进入及三分类无页级动画通过。偏好与测试进度保留/恢复。
- Windows Node26.12.1严格类型/Framework检查、定向原生动效/设置集成/商店/穿戴/历史反例通过；最终完整CI使用锁定Chromium。改动未影响部分继续沿技术报告复用有效Windows/Android证据，不把夹具当作真实游戏结算。
- 当前真实截图与23.99秒Android原速录屏见 [媒体来源](media/softwet-4.1/provenance.json)。原UI API/DOM处理器及原生Passage切换用于演示；不是FPS或物理触控测量。

## Known limitations / Additional coverage

- [#33](https://github.com/102326/DoL-Game-UI/issues/33)的Ray衣柜四分之一预览/祭坛反馈仍缺版本与可靠复现，Unknown/open，未声称修复。
- 本批没有穷举所有商品/穿戴/战斗结算、ModHub安装更新/排序、云端写入、文件选择、更多物理手机/iOS/WebView或长期功耗。ReOverfits核对制品和受控合同，未新增目标Mod实机覆盖。
- ModHub只读克隆计算收益与短rAF结果不等于完整开窗/FPS或全部卡顿归因；A1无耗时收益、C3负结果和未采用的原版/Host候选保留原报告，不强行接入。

## 历史与失败

旧8d66038候选、验收ZIP与22秒视频保留历史身份，不代表本次最终运行代码。d5228d1双CI因新增按钮修复并入批次而主动取消，不算通过或产品失败。

历史夹具超时、遗漏衣柜100ms入场、旧设置620ms断言、媒体查询选择器/外部按钮夹具问题及过早WebView连接均在[完整候选记录](evolution/EVO-4.1-CANDIDATE-2026-11-02.md)中保留；修复后针对性检查，不删除有效负例或重试至绿。旧验收包见[历史制品记录](evolution/EVO-4.1.0-PACKAGES-2026-11-02.json)。
