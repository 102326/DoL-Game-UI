# Soft & Wet 2.6 调查与候选交付

日期：2026-10-12（北京时间）。分支：fix/soft-wet-2.6-baseline。目标是稳定工程基线；未实现3.0功能。

**A：尚不具备正式发布条件。** 2.6.0-rc.1适合后续隔离实机验货；2.5手机严重排版事故的具体根因仍未确认，本候选未做Android安装、WebView和0.5.12.13整合验收。

**B：可以开始3.0独立原型开发。** 现有源码、构建、组件和生命周期足以支持隔离原型；不等于允许直接正式集成或发布。

## 源码与历史制品身份

- 获取了完整Git历史和Tags。main是937dad75d216168748a96cf4a1047fefb49e6992，仍是2.2.2系列；release/crazy-diamond-2.5.0和v2.5.0均为1cf35e901cbb7c78aebc0555d40bb10c6eca6dfc。
- GitHub Release ID 409177500：原发布时间2026-10-11 04:08:16，更新时间2026-10-12 02:56:41；当前draft=true，标题“暂停发布 · DoL Soft & Wet Game UI 2.5.0（已发现 Bug）”，target_commitish为上述1cf35e9。仓库Issue API本轮返回空列表，不能据此否定用户事故。
- 可取得撤回主包：asset ID 628884365，DoL-SoftWet-GameUI-2.5.0.mod.zip，180800字节，SHA256 dbc00785fab76b17fe611bd4641e04bd491ee5c043d61b92bd36cb12e4bde220。下载文件CRC正常，摘要与GitHub asset digest一致。
- 从1cf35e9按锁文件构建，game-ui.js、game-ui.css、shop-page-experiment.js、startup-cache-experiment.js与撤回ZIP逐字节相同。这证明事故发布源码/主包身份，而不是证明具体手机事故根因。没有发现主仓库可取得的对应APK或游戏安装本体；取得的是Mod ZIP。
- 当前可核验最新2.5源码仍为1cf35e9，所以“事故源码→最新2.5基线”之间没有额外修复差异。选择它作为2.6基线，未倒退或重新引入Bug。
- 2.5之前已存在的改善：06de7f9商品详情遮罩关闭，6eef451/f54b149手机密度，53b612e跨分类搜索和竖屏整理，f131b9f存档刷新收口；这些不是2.6新修复，也不足以解释撤回事故。
- 原版测试源码固定41993d3f32476f0b1c8db730c159a50ffcdc2a65（0.5.11.9）。本轮据它构建完整原版HTML及仓库tests/story夹具，没有用最新游戏冒充固定版本。

发布资料：[2.5 Tag源码](https://github.com/102326/DoL-Game-UI/tree/v2.5.0)、[2.5分支](https://github.com/102326/DoL-Game-UI/tree/release/crazy-diamond-2.5.0)、[Release API](https://api.github.com/repos/102326/DoL-Game-UI/releases/409177500)。草稿制品通过已授权GitHub账户取得，不提供公开可下载保证。

## 有边界的问题表

严重度与证据分开，合成复现不等于历史事故。

| 事项/影响 | 严重度 | 证据强度 | 决定 | 修改与验证 |
| --- | --- | --- | --- | --- |
| 窄窗口压低并保存字号/按钮，宽屏偏好丢失 | P1 | 当前源码、基线浏览器失败复现 | Fix | 保存50–200，应用时临时取上限150；窗口缩窄、重启、无关设置、总开关与宽屏恢复通过 |
| 侧栏tip回退会删除晚到的第三方内容 | P1条件性风险 | 源码及后插入按钮的合成失败复现；不是用户事故证明 | Fix | 只拆自有壳，保留节点/事件；精确原顺序、缺锚点、动态重画与destroy通过；独立审查补验原文本删除和复杂第三方结构 |
| 测试提前读resize几何、IDB保存和dialog close结果 | P2工程缺陷 | 本轮失败日志与原生异步流程 | Fix | 等实际渲染帧/存储完成/关闭清理，不重复派发业务，不放宽列数、业务或关闭原因断言 |
| wardrobe-m2检查写死E盘路径，文档环境变量不生效 | P2工程缺陷 | 本轮404失败和源码 | Fix | 沿用DOL_TEST_WORKSPACE与仓库dist路径，原检查通过 |
| source-map-js1.2.1拒绝服务公告 | 上游High；本项目暴露主要在构建解析 | npm audit，非本项目已遭攻击证据 | Fix | 仅锁文件补丁1.2.2，零新增依赖；安装审计0漏洞；构建及单元复验 |
| source/guard原生动作、API v1、逐页回退、实验默认关闭 | 正常 | 本轮隔离原版/夹具通过及源码 | Keep | 保留当前契约；未重做基础设施 |
| 2.5手机严重排版事故及WebView/键盘差异 | 用户报告为严重；根因未知 | 已定位制品，尚缺同场景复现 | Experiment | 不宣称已经修复；需候选与旧版在同设备/同页面/同Mod组合对照 |
| 未知Mod直接向Vue内部自有渲染树注入DOM | 条件性风险 | 所有权/卸载源码推导 | Experiment | 原生区域的未知内容有回归；Vue内部任意注入不属于通用接入契约，不将其扩成全局DOM恢复重构 |
| 悬浮球/Widget/新设置中心/全局命令/大型主题 | 当前非缺陷 | 产品边界 | Defer | 全部留在3.0；未建设诊断平台或新抽象 |

已丢失的旧大字号值不能安全猜回；用户可重新选择200%，之后窗口变化不会覆写它。

## 提交

- ed5f7ea：修复持久缩放，加入保存/实际显示回归与设置提示。
- 6f2da84：侧栏未知内容保留和锚点回退。
- 20195ff：原生异步等待、将两项回归加入现有layout/release分组。
- 86090d0：衣柜M2资源路径可配置。
- 4a5f597：source-map-js兼容安全补丁。
- 候选版本及本记录由后续本地提交封存；精确最终SHA和包体SHA见交付清单。

所有提交只在本地独立分支。未Push、合并正式分支、创建Tag或Release。

## 本轮真实执行与失败记录

执行环境是**macOS ARM桌面**，不是远程云端。Node24.18.0、Python3.12.14，Playwright使用锁文件版本。系统无Edge，Chrome155.0.8059.40、Playwright1.63.0。临时NODE_OPTIONS预加载把既有脚本的channel改成Chrome；没有改产品代码或建设新框架。某些旧脚本报告写死“Edge”，本轮以此记录与交付清单的实际浏览器版本为准。

- npm ci：锁文件安装完成。初始audit发现上述一项，定向补丁后零漏洞。
- npm run test:quick：基线build通过，但单元打包因环境没有python命令失败；临时PATH提供Python3.12后单元通过。最终候选quick的build/typecheck/字段检查及十个单元脚本通过。
- npm run test:release：首次新增分组清单断言未同步，未开始页面测试；修正清单后，再次运行完成单元、衣柜操作/跨分类/布局/侧栏预览、商店source/原生购买和存档source，停于存档刚resize后的列断言。原失败报告保留。
- 存档定向补测：等渲染后列断言通过，随后空槽异步保存尚未完成就重开页面，目标行未出现。等原IDB实际完成后，保存/读取/删除、确认取消、V1/V2、备注不改payload、原导入导出、关闭恢复通过。操作是隔离测试数据，不是用户存档。
- 后续逐项继续：save-transfer-lifecycle、save-compatibility、ui-runtime、resilience、master-toggle、master-native、mobile-density、display-scale、preferences-preservation、sidebar-layout、overlay-manager-layout、kitchen-layout、combat-m4a、acceptance、combat-resize、native-action-panel均通过。Runtime原close事件也需等实际清理后断言。
- 最后wardrobe-m2首次因写死Windows资源路径404失败，改用已有环境变量后原动作、未知节点、source失效和完整回退断言通过。
- 最终2.6候选补跑preferences-preservation、display-scale、sidebar-layout、ui-runtime、resilience、master-toggle，全部通过。运行资源与已完成游戏检查的版本比对：CSS和两项early脚本除版本串外相同；主JS差异仅侧栏wrappers使用children及循环解构的已复验实现。精确摘要见交付清单。未机械重跑未变的整个设备矩阵。不能将多个补测拼成“原test:release一次全绿”。
- 已查看本轮390px衣柜和商店截图。设置附加检查覆盖320×568、360×640、390×320矮窗口、768×1024、1024×768、1200×900的内部横向溢出及关闭可达性；矮窗口不等于真实软键盘。
- 原版衣柜五种窗口/商店窄容器与手机详情/战斗五至七种宽度、原节点身份/事件及回退由已有检查覆盖。已有游戏资源404仍留在日志；不宣称完整游戏零console error或全面性能提升。
- 独立只读审查未发现阻断问题，另用Chrome验证删除原文本、丢锚点、summary后插复杂第三方内容和冒泡事件。

复现命令为：npm ci；npm run test:quick；DOL_TEST_WORKSPACE=<固定资源根目录> npm run test:release。本机加临时PATH和NODE_OPTIONS；既有Edge环境无需这个浏览器替换。各定向补测直接node tests/<上述脚本>。打包使用npm run package。

## 历史记录与源码推导

Release和仓库文档声称曾在Android0.5.12.13做手机/平板/键盘检查，本轮仅阅读记录，未复验，不作为候选真机通过证据。源码可确认局部fallback、生命周期清理、原生guard及Style Only Adapter边界；不能据此保证所有第三方组合。本轮不操作云存档账户、用户游戏进度、Android安装或整合包。

## 尚未完成的实机清单

1. 独立Android测试安装核对实际API版本2.6.0-rc.1、ZIP摘要与加载顺序；备份与回退包可用。
2. 在原事故手机/整合环境重现同页面与设置，用2.2.2/可取得2.5对照；记录CSS viewport、屏幕短边、系统字体、UI字号和按钮值。不猜事故根因。
3. 手机竖横屏、320–430px级实际窗口：正文/动作、商店配色和购买按钮、衣柜类别/搜索/出口、战斗动作与底栏、设置与关闭按钮、存档确认及原版回退。
4. 真键盘打开/收起、地址栏/系统导航栏、安全区；滚动到末尾与焦点恢复。临时viewport缩高不覆盖这些行为。
5. 平板横竖屏、分屏与Android小窗：大字号保存200→窄环境显示150→恢复宽环境200；中途改其它设置并重启后保存值仍200。
6. DoL0.5.12.13及实际目标Mod版本组合，重点ModHub/MapleBirch/原版优化/ReOverfits；核对最低版本声明，不默认验证未来版本。旧Lyra嘴部包的列举UI依赖不能直接放宽。
7. 总关/单页关闭/离开页面后的原节点、业务、浮层、遮罩和监听恢复；侧栏追加内容保留。购买、换装、战斗结算和存档读写只在独立测试数据中验收。

上述结果决定2.6是否可正式发布；不阻止3.0隔离原型。
