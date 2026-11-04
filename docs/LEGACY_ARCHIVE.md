# UI旧代封存与4.x分离记录

2026-11-04负责人授权将UI产品1.x、2.x、3.x及相关资料独立封存；4.x仅用自己的现行规范。源研发提交`c8eafe8278ab85b4243901aebeb5e52546c98512`，迁移分支`docs/4x-legacy-separation`。

## 独立归档

归档库：[102326/DoL-Game-UI-old](https://github.com/102326/DoL-Game-UI-old)，私有，Actions关闭；已核验并设为Archived只读。固定档案提交`61990df08986cf1cc9f8b9cd2ab998bb1b4863c4`。默认代码树基于正式v3.0.4；26个1/2/3主版本Tag保持原对象，17个旧分支以history/local和history/remote保存。旧分支可能含过渡研究，不能据package版号推定均已发行。

额外保存212份原文：198个旧代专属文件迁出当前树，14个共用/过渡说明文件保留改写前版本。包括旧设计、安装、发布、历史验证、原文决议、图片/录像、废弃样式、四个旧视觉演示测试和旧单包生产器。25份旧GitHub Release正文及117个原附件引用另存release-records。正文保留原始换行；逐文件大小与SHA256、引用对象见[机器清单](LEGACY_ARCHIVE.json)。远端Git树blob逐项与本地SHA256清单一致，43个旧引用对象一致。

第一次提交发现归档索引覆盖preserved/README和Git转换Release正文CRLF，已用后继提交恢复源README并对原文目录禁用文本转换；未通过改摘要掩盖差异，未改写历史。最终原文和Release正文全部匹配。

原仓库的Git历史、Tag、原Release及正式ZIP未重写或删改。历史源码按归档Tag/分支查看；现役4.x工作树中不再保留旧代专属档案。旧附件继续指向原发布地址，本次不重新发布旧ZIP。

## 4.x自身合同

新[文档入口](README.md)、[4.x视觉规范](VISUAL_BASELINE_4X.md)、[Host职责](HOST_4X.md)、[UI API](UI_RUNTIME.md)、[职责边界](UI_INFRASTRUCTURE.md)、[开发](DEVELOPMENT.md)、[验证入口](VALIDATION.md)按当前实现整理；AGENTS/框架说明/CHANGELOG改为4.x。历史外链仅供追溯，不是当前实施规范。

仍被4.x使用的源码、协议、测试与兼容包保留：Host0.1-experimental、UI API v1、独立兼容包版本、shop-page-experiment early入口及实际场景回归，均不等于旧UI产品版本。当前框架、golden-spin/weather/settings原型及历史反例由4.x构建/回归消费，不因来源早而删除。4.x历史报告中的旧对照保留原身份，不能把它重新签为当前通过。

已将旧样式“必须留在docs/archive”检查改为核对本迁移清单及本地已迁出；原现役配色、原生节点/动作、语义色、布局和窄屏断言不变。未修改保护规则、选测政策、UI/Host运行时或发布版本。

## 交付状态

归档远端原文/引用核验已完成；4.x清理的最终类型、定向合同和交付状态见HANDOFF。当前视觉Study 02/03仍为负责人否决，不因文档清理重新采用。4.x变更仅研发分支交付，main与正式发行不变。

## 本机冻结验证与复核

冻结源码27767732d19858a1b12de0b7900a28b983a13173、macOS arm64、Node26.12.1、Python3.12.14、锁定Chromium153.0.8010.12：ci:check、38项ci:unit、ci:build、ci:packages（九包两轮独立编译/打包、全部成员/ZIP摘要一致及负例）通过；修改的kraft-work-baseline浏览器合同通过。初次因Expected Lock与新检查不一致被拒绝，生成后仅该项sourceSha/assertionSites21→31变化；初次打包缺python入口退出127，使用本机已有隔离Python3.12后完成，不改全局环境。

独立审查逐项核对212份原文与源/归档字节及198个删除路径，未发现误删现役实现或删除行为断言。审查发现重写UI说明漏掉独立wardrobe API及业务边界，随后按实际public类型与ReOverfits消费者补回；Component Lab当前说明也改为4.x，旧原文与归档history/local/main的blob8e6be5ad1bf94c0fea4ab921e6d9877da015e2ad完全一致。后继文档回执不修改受测运行代码、包内README或已打包玩家文档。

本次未运行Windows/实机/游戏业务或新的远端全量CI；源分支从研究线接续，另准备main对照的纯文档/档案清理分支，避免夹带作废原型。原型代码与CI覆盖政策不在本次集成范围。

## main对照交付

另建docs/4x-legacy-main，直接以c7d8bac为基线应用本次清理。198个迁出文件的main原字节全部与源研究清单相同；不复制4.2原型实现。4.2文档仅外链到本项目既有研究记录，当前4.x规范仍自包含。源线本机结果保持2776773身份，main对照PR必须取得自己实际的检查，不沿用旧Run当作新HEAD成功。
