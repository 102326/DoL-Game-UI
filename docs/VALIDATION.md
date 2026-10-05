# 2.1.0 兼容性与韧性（2026-10-05）

构建/typecheck、集中隔离回归通过，报告 `tests/artifacts/workflow-release-1791184688894.json`。另通过 social、characteristics、panels、saves-native-tools 和 lyra-preview-adapter 专项。

新增 resilience 检查覆盖模块启动/页面更新/Vue 交互异常、原控件事件和只读状态、动态未知存档行、存档/商店/战斗恢复锚点缺失，以及 ResizeObserver/dialog/blur 能力缺失。主题启动失败仍可关闭整套 UI。异常只停用当前会话的对应接管，不写入业务状态或清空显示偏好。

修复验证中发现的衣柜挂载顺序错误；两个旧测试原先把总关闭当成清空单页偏好，调整为验证总主题关闭、原版呈现恢复及单页偏好保持。导出测试原先把已知控件放在独立伪容器中，新所有权门槛要求实际 saves overlay；测试改用正确的 overlay 包装，原控件和业务断言保持。首次失败报告保留，不以重复运行掩盖问题。

集中回归使用 DoL 0.5.11.9 原版隔离资源，真实隔离存档读写不涉及用户存档。现有资源 404 单列为测试资源限制。集中回归后，战斗异常路径再收敛为仅会话停用，主题重试加边界；最终构建及 resilience/combat-resize/master-toggle 补测通过，其余未触及路径复用已通过结果。0.5.12.13 完整包已在独立测试版平板安装并重载：存档列表/只读详情、导入导出原控件与直接父级恢复、云存档 Adapter、ModHub 1.3.0、设置打开关闭和总回退通过；操作期间 V、显示偏好、Mod 顺序与隐藏列表保持，新页面错误 0。未执行用户存档读写、购买、换装或云端业务。设备证据在开发工作区 `experiments/resilience-210-20261005/device-210`，私有状态和加载日志不发布。未知 Mod 组合与长期设备性能不在本轮范围。

# 2.0.0-beta.53 原生小浮层（2026-10-04）

仅CSS补原生Tooltip和SugarCube Dialog内控件，不改变定位、状态、节点或事件。build/typecheck、settings-acrylic、overlay-back-order与native-small-surfaces通过。后者使用原生jQuery Tooltip实现及真实SugarCube Dialog API，检查两视口/100%-200%字号、三档/玻璃关闭、单层blur、原语义色/动态Mod内容/未知签名/原版回退、原节点/父级、click/change/disabled/hidden、键盘Focus、关闭按钮/Escape/遮罩关闭和V保持。

测试失败按实际原语义修正：原Tooltip observer会清理未关联的孤立.popup，未知签名的CSS检查改为同步取样；Focus-visible使用真实Tab而非鼠标后的programmatic focus；Hover检查等待原0.2s过渡；原遮罩为两倍视口且左上在负坐标，点击改取屏内坐标，不force或修改产品事件。没有降低业务断言。设备完整包已安装：原温度Tooltip经原handler打开并核对材质/边界；原Dialog只读样例与ADB原ui-close关闭通过，非真实破坏性操作确认。检查期间V/页面/偏好/原节点保持，测试浮层已清理。跨重载发现NPCNameList/NPCName/handskill/maplebirch/enemyarousal/skulduggerydifficulty差异，前后私有快照保留且原因待专项核对，不宣称全过程状态一致。[原图与范围](design-previews/2026-10-04-native-small-surfaces-beta53/README.md)。

# 2.0.0-beta.52 分组定位与存档工具页（2026-10-04）

build/typecheck、saves-native-tools、saves-header-lifecycle通过；social/characteristics原版与汉化整合通过包含390/1704、100%/200%原标题完整可见的真实导航检查。存档默认双列、V2单列/内联详情与回退保持。saves-runtime原版与汉化整合均通过实际隔离IDB保存/读入/删除/确认取消、原文件/存档码控件及事件；不操作用户真实存档。

新增定向检查验证导出控件身份/事件/原顺序恢复、Neutral文件按钮、3视口/200%、Cloud仅CSS/原父级/回调/动态option/change/hidden未知内容/所有权释放及三档单层blur。云端认证和真实上传/下载/删除不在此检查范围。

失败均单列处理：文件输入100%宽加旧左右margin在390/200%溢出，CSS移除该margin后通过；字号变化后原颜色分级Hover浮层挡导航，测试移开鼠标后正常点击，不force；旧存档测试只匹配英文Save/Load/Delete，在汉化整合失败，补中英选择器后通过。文件按钮字色验证对齐实际主题token而非旧硬编码。整合测试既有404资源/remote-loader响应及skybox错误仍输出，不宣称无console error。Android完整包检查见下段。

完整52已安装并重载；Android导出/载入与云存档原控件身份/直接父级/onclick/值、单层blur、无横向溢出，社交/属性原标题完整显示及只读V/页面/偏好保持通过。错误/失败/临时样式0；菜单关闭、滚动恢复。跨重载NPC描述缓存差异仍单列。[实际图、SHA和兼容边界](design-previews/2026-10-04-save-tools-beta52/README.md)。用户实机未进行文件导入/导出、实际存档读写、账户连接或云端操作。

# 2.0.0-beta.51 二级导航控件（2026-10-04）

build/typecheck与settings-acrylic通过：18组响应组合、三档导航弱边缘/8px/44px、Hover保持安静边缘、键盘Focus、原节点/父级和所有权释放检查。原版与汉化整合social/characteristics各通过原DOM/状态/事件、导航、Mod追加、回退、生命周期及手机/平板回归。无新增业务代码、DOM搬移或控件代理。

测试先发现既有Glass导航是透明边缘，按“保持安静边缘”同时验证透明/弱白两种现有表面；另一次存档背景断言受导航Hover遗留鼠标位置影响，重置鼠标后通过，未改产品或弱化存档断言。

完整51已安装并重载生效，Android社交/属性实际触摸打开与分组跳转、8px/44px/弱边缘、正文无blur、原节点/直接父级、只读V/页面/偏好保持通过，错误/失败/临时样式0；结束关闭菜单恢复滚动。跨重载差异仅NPCName描述/descCache，单列原版初始化边界。分组标题贴上沿记录为后续定位候选。[截图与冻结包清单](design-previews/2026-10-04-secondary-controls-beta51/README.md)。

# 2.0.0-beta.50 存档级透光（2026-10-04）

仅战斗两浮层CSS与版本元数据调整，外壳复用存档主菜单rgba(36,38,42,.68/.64)、blur24；内部阅读遮罩从标题.60/正文.78降到.40，摘要辅助字色#d1d3d9。原生菜单/互斥业务JS未变。

build/typecheck、combat-resize通过：互斥和真实click关闭路径、原节点/直接父级/业务状态保持、窄宽重复开关、三档/玻璃关闭/减少动态、200%/7视口、白环境文字对比度>=4.5、回退及销毁。首次试用更透外壳.58/.54与标题.36时，白环境小字仅4.03，未弱化断言；按用户明确的存档主菜单基线改回.68/.64，阅读遮罩.40后通过。完整包Android验收另补。

# 2.0.0-beta.49 收口检查

48完整包Android连续12次真实触摸交替开关通过，V/页面/偏好、原控件与父级保持、错误0。截图发现原inline标签的正文背景碎块，49以原label CSS Flex/full-width修正。49 build/typecheck和combat-resize复测通过（包含原行宽、互斥、窄宽3轮/原click计数/3档/白环境对比度/原控件与回退）。原行为JS与48相同，48通过的native-action-panel/eyes-palette复用，不重复业务动作。最终包安装证据随后补。

# 2.0.0-beta.48 战斗浮层（2026-10-04）

build/typecheck、combat-resize、native-action-panel、eyes-palette通过。先在47构建复现两浮层同时存在；48新增互斥后窄屏真实click复测又发现两行底栏遮挡，定位改为相对整个footer上方后通过。没有force点击或忽略遮挡。

390/1363各3轮交替展开/关闭、每次原生toggle准确单次click；3档、玻璃关闭、减少动态、白环境合成文字>=4.5、节点身份/父级/业务状态、原版恢复/销毁、动态内容与7视口/200%布局检查通过。[截图/SHA清单](design-previews/2026-10-04-combat-popup-beta48/README.md)。Android完整包安装/只读验收另补。

# 2.0.0-beta.47 战斗工具控件（2026-10-04）

build/typecheck、eyes-palette、combat-resize、native-action-panel、native-action-style、sidebar-surface通过。隔离测试涵盖三档与玻璃关闭、原菜单开关/change事件、原控件身份/直接父级/游戏状态保持、390/1363浮层边界、7视口底栏预留、200%字号、不持续动画、原版恢复/销毁与ResizeObserver错误。原动作/原版回退及动态Mod追加回归有效。

初次检查发现旧通用`:is(select option)`的最大类型权重压住工具按钮边缘，补精确按钮规则后修复；后一次差值来自原生150ms border过渡，按实际等待过渡稳定后断言。未降低预期、不通过重复重跑隐藏失败。

[隔离截图及SHA](design-previews/2026-10-04-combat-tools-beta47/README.md)。设备安装记录另补；不强行修改用户V进入战斗，战斗Android触摸/滚动与长期性能尚待。

# 2.0.0-beta.46 衣柜控件定稿同步（2026-10-04）

- build/typecheck、eyes-palette通过。wardrobe-layout原版/汉化整合通过：三档下分类、已穿戴、整理选中项中性底、弱完整边缘、无常驻纹理/blur/扫光，控件身份/父级和V保持，5种视口无管理栏溢出。
- 汉化整合wardrobe-runtime通过，隔离新游戏验证原直接穿戴、一次实际换装一次渲染、分类/搜索零渲染、原版回退、管理取消/过期/索引变化/套装及清理路径。未在用户设备执行这些业务。
- 新材质测试初次误定位不存在的header aria-pressed（整理按钮原来没有此属性）；按实际三个状态组件定位，不改产品来满足测试，重跑原版/整合通过。
- Android45上临时CSS预览已查看与清理；旧45选择器仍有较高优先级，临时覆盖仅为移除旧效果，不进入产品CSS。V/页面/偏好/原节点和父级恢复保持。完整46尚待安装验收。

- 完整46已安装/重载，实际Android分类与已穿戴中性表面、原节点/父级/V/页面/偏好保持检查通过，错误/适配失败0，无临时CSS；已查看完整包原截图并绑定SHA，45实际导出回退保留。详见推广清单及native-wardrobe-buttons-beta46.json。

# 2.0.0-beta.45 商店按钮定稿同步（2026-10-04）

- build/typecheck通过。shop原版/汉化整合检查覆盖Smooth/Balanced/Fancy下分类/商品/购买表面：中性底色、弱边缘、局部指示、无列表blur或旧Fancy高光；原色样不变、节点身份保持，分类图标可读。
- 复用商店原生购买/数量/试穿/归还、不足金额、分页/响应布局、回退及隔离IDB/无UI读档测试。仅隔离新游戏操作业务，不点击用户实际购买/试穿。
- eyes-palette通过；共享其他页面的配色与对比度有效，选中/操作规则仅限定已有商店适配域。
- Android临时样式预览已查看并清理：原节点/直接父级/游戏V/UI偏好保持。预览在44上覆盖旧CSS，不作为完整45已生效的证明；完整包安装验收另记。

- 完整45已事务安装并重载生效；运行版本45、错误适配失败0、无临时样式。实际44回退包哈希一致。重载自动恢复分类入口，商品选择页完整包截图待用户进入；收据见推广清单。


- beta.45收口补证（2026-10-04）：用户确认“看着没问题”。完整45商品列表三处实际计算样式与原节点/直接父级、V/页面/偏好保持检查通过，无横向溢出、可见错误/适配失败0、无临时CSS。两张Android原始截图已查看，含QQ通知，故不收入设计截图归档；公开清单保留脱敏计算收据，不以临时预览充当完整包截图。beta.45产品与冻结ZIP未重打。

# 2.0.0-beta.44 商店小浮层与笔记细调（2026-10-04）

- build/typecheck通过；panels原版/汉化整合通过：保留原笔记输入、保存/草稿/自动保存、成就筛选、动态分组及原版回退，并检查笔记工具不再作为实体卡片、保存按钮44px。
- shop原版/汉化整合专项检查覆盖原生回调、响应布局、浮层44px操作区和选项无横向溢出；V1服装说明原标记保持，实际展开后可再次点击原按钮关闭。
- 真机43代表页发现原说明盖住开关：仅CSS将原说明锚定在既有工具行下，不替换原说明、不新增关闭代理或移动节点。原版回归通过后执行完整候选包验收；预览和安装证据单列，不能混作同一运行版本。
- 这轮不改原版业务状态、回调或保存结构；不执行用户实际购买、试穿、笔记编辑、设置修改或存档读写。长期blur/多背景舒适度仍未完成。

- 完整44已安装/重载；Android日志/笔记/成就与商店三浮层必要只读检查通过，收据与原截图绑定EYES_UI_ROLLOUT.md文末。原生笔记tempDisable临时变化已定位，关闭后语义值/页面/偏好恢复；不把菜单自身原生暂态写入算作CSS状态改写。

# 2.0.0-beta.43 原节点基线推广（2026-10-04）

- build/typecheck、settings-acrylic与eyes-palette通过；新增复用表单、真实SugarCube Dialog生命周期/原控件及单层blur/开关断言。
- 已通过汉化整合shop.test：原生筛选/选项开关、购买/试穿/分页/颜色、回退和生命周期；材质三档/玻璃关闭、节点不被替换、V不被材质写入通过。购买/存档组合仅在隔离新游戏测试。
- panels原版通过，兼容专项原版53项通过；整合53项在本轮此前表单CSS状态已通过，后加的原生Dialog不修改这些范围。整合panels最终复核也通过。原版shop.test也通过。候选包校验通过；早先连接超时未产生写入；用户保存并回到Lyra后已事务安装、重新加载，完整43运行。代表页Android验收完成，不声明全部UI/长期性能已验收。
- [实际原节点截图清单](design-previews/2026-10-04-native-rollout-beta43/README.md)已查看、按SHA绑定；新增完整包Android设置和统计两张。原节点事件/unknown/hidden/回退/故障注入检查复用现有兼容路径，不新增平行测试框架。
- Android设置/统计/作弊只读核对原节点/父级/正文/控件值/原版往返、无横向溢出、单外壳blur24、稳定正文无blur，错误/适配失败0；安装顺序、UI偏好保持，自动恢复Clothing Shop。记录见docs/audits/native-rollout-beta43-*.json。
- 严格raw V恢复断言初次失败：原生clothingicon宏打开作弊时更新显示路径；另外SugarCube的undefined复活标记与NPC对象字段顺序不同。已恢复唯一改变的显示临时路径，并使用原生SugarCube JSON.parse复活后、native JSON值+排序字段比较；语义状态值/设置/页面/偏好通过。没有恢复或重写整个V/NPC对象，也不声称属性插入顺序/缺失与undefined完全一致。
- 上轮把字号/行距六项差异描述为“设置变化”是比较误报：实际前后均undefined，只是缺失与复活标记表示不同。该发现记入册子，不再以这类raw差异推断用户改了设置。
- 已安装ZIP继续冻结167445字节，SHA256 f5f734cdf63ebe06d9141b79f2f333db5af06762d950a8c6ca2605dd4743860c；安装后文档补证未重打同名包。实际导出的42回退包保留。


# 2.0.0-beta.42 设置页原控件轻美化（2026-10-04）

- npm run build/typecheck、panels.test.cjs原版/汉化整合、internal-components-compatibility.cjs原版/整合各53项及settings-acrylic.cjs通过。390窄屏、1704平板与32px正文覆盖。
- 设置正文原标记、输入身份/父级/属性、事件序列、原版往返、外部赋值、动态Mod/unknown/option、hidden/disabled、故障回退、模拟无:has与隔离原版序列化/恢复通过。形态验收改为可见原生方框/圆点、44px标签和原input Focus，不再要求Switch背景或Radio隐藏覆盖标签。
- 完整beta.42已安装并重新加载生效，Android17/WebView156确认真实可见的18px Radio、44px标签、原input Focus、fixture触摸/键盘/外部赋值、动态unknown/hidden及原版往返共24项通过；恢复/清理3项通过。用户游戏设置值、页面及检查期间V/UI偏好保持；未代用户操作存档。
- [实机截图清单](design-previews/2026-10-04-settings-native-beta42/README.md)与docs/audits/internal-components-beta42-*.json绑定。未重新测试所有旧Mod、长时间blur或真机保存/读取组合。已安装ZIP冻结166120字节，SHA256 98c4ef904bac1901c87cfc3821d9ea0b6492abc52a14ec644f4f82ac89a385b2；安装后本页更新未重打同名包。beta.41历史包及证据保持冻结。

# 2.0.0-beta.41 兼容防护验证（2026-10-04）

- [修正记录](INTERNAL_COMPONENT_COMPATIBILITY_GUARD.md)：构建/typecheck、原版/整合兼容专项各52项、panels原版/整合、settings-acrylic、eyes-palette、save-compatibility、saves-runtime、saves-header-lifecycle、save-transfer-lifecycle通过。
- 特质可见计数、动态标题/隐藏/正文索引、hidden保护、原控件/事件、故障注入原版回退和模拟无:has路径已覆盖；存档测试只在隔离profile中操作，资源404 console提示保留。
- Radio几何检查初始误要求边框内input也达到44px，实际input122×42、label124×44；改为验证label命中至少44px、input覆盖其内部，未将1px方案作为通过。
- 当前已安装并重新加载生效：Android17 / WebView156.0.8072.0 实机确认完整beta.41、panel API可用、故障计数0、无临时主题覆盖。安装前导出原beta.38回退包；事务保持启用/禁用顺序，安装前后V/页面/UI偏好一致。用户先保存，重新加载后恢复服装店；未代用户执行存档读写。
- Android必要兼容检查通过：真实触摸原fixture checkbox/label/radio及原生Select picker（trusted事件），动态option/disabled/selected/value、Focus、CDP键盘、动态索引/hidden/class/display与可见特质计数、原节点往返、闲置无自激和样板清理。测试结束V/页面/偏好与重载后基线一致。原生输入和游戏设置值未改变；故障注入仍为隔离桌面证据，未对用户运行时注入故障。
- Fancy真实长列表各采样24个rAF间隔，正文无额外blur、无横向溢出和适配异常；设置样本最大30.5ms、特质17ms。不是持续FPS/合成器/长期闪烁或Balanced/Fancy对比验收。减少动态是在真机WebView中模拟media，非修改Android系统设置；旧WebView降级仍为模拟。
- [Android记录与可重放脚本](INTERNAL_COMPONENT_COMPATIBILITY_GUARD.md#android-与安装状态)及[两张实机截图](design-previews/2026-10-04-compatibility-beta41/README.md)已绑定；重要旧Mod位置依赖、存档专项组合及长期动态性能继续单列。

# 2.0.0-beta.40 候选验证（2026-10-04）

- 独立兼容审计补充：[报告](INTERNAL_COMPONENT_COMPATIBILITY_AUDIT.md)。原版/汉化整合新专项各21项正向检查及原版无UI读档回归通过；同时复现 hidden 被样式覆盖、动态导航未更新、初始化异常缺少可用回退等缺口。专项 exit 0 表示审计完成，不能记为所有兼容门槛通过。运行源码/包未改，候选仍未安装。

- 本轮范围为特质/游戏设置内部结构；构建与类型检查、原版/汉化panels、settings-acrylic、eyes-palette通过。原生输入节点、状态与回调保持，Keyboard/disabled/回退/动态内容及窄屏32px正文专项检查通过。
- 特质搜索框固定最小宽度导致真实布局检查失败，修正后复测通过；本轮增加测试的英文日期文案、禁用点击与初始DOM比较假设按真实原版行为修正，未放宽业务或溢出阈值。
- 六张隔离汉化游戏截图绑定design-previews/2026-10-04-internal-components-beta40。61条特质是仅DOM渲染压力fixture；32px仅正文字号。候选未安装，Android触摸、滚动/blur、动态性能和长期可读性仍待。
- 存档及社交既有材料保持，未连接真实游戏进度或操作存档；不把两页检查视为全部界面完成。

历史验证快照如下。

# 1.1.0 LTS 验证与维护范围（2026-10-01）

发行前已核对运行代码、样式和补丁与通过专项验收的资产一致；正式发行包未重复运行所有真机业务，不扩大已有验证范围。

- 构建、类型/字段、单元和包内四补丁检查通过。统一设置、缩放、弹窗和厨房回归通过；统一设置覆盖五种手机/平板/PC视口。
- 作弊器输入行根因：原macro-button的width:100%配合UI放宽的最大宽度挤窄输入框。限定作弊面板文本输入行按钮自然宽度、不收缩，保留原节点和执行事件。
- cheat-console-layout.cjs覆盖两输入行、手机/平板、100%/200%字体、输入事件/原节点及样式回退。实际平板重启验证输入框858.8px、按钮52.8px；原节点/输入值/完整V保持，无pageerror。未执行作弊代码或写存档槽。
- 进阶实验默认折叠、展开不改偏好，主要开关及原版回退通过；完整原有UI偏好在重启后保留。
- 复用有效三大页面证据：战斗真实新增动作原生选择/摘要/节点保持与回退；衣柜真实副本穿脱、关联套装、137件4页、五套快捷穿搭15次对照；服装店真实副本试穿/归还、购买恢复及离店重入。部分业务证据来自此前版本，不称全部在1.1.0重测。
- 购买并穿上/伊甸小屋配送有隔离原版/Lyra业务比较，尚未补真机；Lyra skybox异步异常在无UI对照也复现，单列上游异常，不称全程无异常。
- 后续补验更大库存、其他组合、未知控件和云存档。Android返回键同时关闭两层仍为宿主已知限制；第三方技能内部结算不作为UI逐项验收范围。
- 代表性验收不保证所有模组组合兼容。性能实验新安装仍默认关闭，保留独立回退，不承诺完整交互稳定提速；原游戏逻辑、事件及存档格式保持。
- LTS维护以兼容修复、Bug修复、DoL更新适配和必要性能改进为主。当前明确支持DoL0.5.11.9，未来版本适配需另行验收。

以下为历史发行快照，不作为当前设备状态。详细后补证据保留在工作区开发记录本。

# 1.0.6 正式版验证说明

- 构建、类型检查、单元检查和安装包补丁校验通过。
- 衣柜运行回归通过：原生页头/页脚保留、页脚控件点击、原版回退、预览同步。
- ADB 当前会话加载修复后，maplebirch 5.1.1 桌宠在现代与原版衣柜中均可见，穿戴数据保持不变。
- ADB 神殿场景确认恩典条恢复可见；普通及氧气容器进度条样式回归通过。水下氧气条真机场景尚未验收。
- 真机证据来自当前会话临时加载，未验证最终 ZIP 重启安装；未改游戏状态、存档或第三方模组包。

以下为历史验证记录。

# 1.0.3 正式版验证说明

发布日期：2026-09-29。由 1.0.3-preview.6 收口，正式版仅调整版本与文档。

- 战斗紧凑布局、高亮同步、ResizeObserver 清理回归通过；原节点与动作选择保留。
- 衣柜五视口及宽窗口窄容器回归通过。绘图定义按需复制与全量复制的十个桌面样例结果一致。
- Android preview.6 实际运行：绘图、分类切换与三轮原版回退通过，穿搭/库存未变。隔离新旧模型同穿搭画布像素一致。
- 单场景准备与编译中位 27.8→4.7ms；完整刷新仍有明显波动，不能外推整体性能收益。
- 用户提供的 AU 0.5.11.9 原包在隔离桌面新存档及六个测试上装中预览正常；尚未复现第三方 upper 异常。未安装其 APK，未覆盖用户游戏。
- 未验证所有模组组合、真实模组战斗结算、正式版 ZIP 安装后的冷启动及完整存档往返。原版回退保留。

以下为预览阶段及历史验证记录。

# 验证说明

## 1.0.3-preview.3（2026-09-28）

- 构建与类型检查、acceptance、combat-resize、multi-region 回归通过。
- 平板当前战斗临时加载紧凑模块，动作面板高度约 1137→894 CSS px，54 个控件保持一致，原列表/继续节点及已选项不变，无新增 ResizeObserver 错误、无横向溢出。
- 未改插图布局、未提交回合；预览 ZIP 尚未持久安装。布局高度缩短不等于性能提升。

## 1.0.3-preview.2（2026-09-28）

- 修复前在中性夹具的尺寸变化序列中复现 2 次 ResizeObserver 通知循环错误。修复后 `node tests/combat-resize.test.cjs` 通过：同类错误为 0，底部留白等于底栏高度加 16px，回退与销毁后没有残留底栏/留白。`node tests/acceptance.cjs` 同时通过。
- ADB/CDP 在已运行 preview.1 的真实战斗中临时加载修复版战斗模块，测试四次宽度调整及关闭/开启：新增同类错误为 0，原列表、继续节点、选中项一致；底栏 76px、留白 92px、边界正常，回退时残留节点为 0。未提交回合。
- 此为临时运行模块验证，preview.2 ZIP 尚未持久安装或冷启动验收；既有诊断日志不会因修复被清空。

## 1.0.3-preview.1（2026-09-28）

- 构建、类型检查与打包校验通过；`tests/acceptance.cjs` 与 `tests/multi-region.test.cjs` 通过，覆盖五种视口、原节点身份、事件、快捷键选择器、动态替换和回退。
- 新增导航/摘要验证：跳转不改变行动选择、不触发原控件 change，原动作组保持可见，摘要随原控件更新。
- Android 平板在真实战斗中临时加载独立战斗构建，原有 6 组选中项不变，动作列表及继续节点身份一致，单面板且无横向溢出。未重启、未提交回合、未持久安装预览 ZIP；这不等同于完整包冷启动验收。
- 真实模组动作结算及性能收益仍未验证。此版改进布局，不宣称提速。

## 1.0.2

验证日期：2026-09-27。本版将服装店按页生成实验的运行脚本与四处文本补丁并入 UI ZIP，保留设置里的独立开关；新安装默认关闭，已有偏好不被覆盖。

## 本次通过

- `npm test`（含独立构建与集成包内容检查）、`npm run package`、`node tests/unified.test.cjs`、`node tests/shop.test.cjs`：退出码均为 0。
- `node tests/shop-lazy.test.cjs` 在原版和 Lyra 夹具中均通过：精确原文锚点、开启后的分页和搜索、原生购买/试穿/返回路径，以及关闭后的原版分页回退。
- Android 平板升级前已保存游戏并制作完整应用数据备份；通过模组中心停用旧独立实验包、安装 1.0.2 UI、重启后核对两者配置。运行中 UI 与内置实验均为 1.0.2，旧包处于禁用状态；服装店目标 Passage 的模式补丁只出现一次，开始画面未见 `.error` 节点。设备原有的实验开启偏好仍保持开启。

## 验证边界

平板冒烟测试停在开始画面，没有从玩家存档进入服装店执行真实购买、配送或存档往返；该部分只由隔离游戏夹具覆盖。没有测得可重复的端到端性能收益，也没有验证所有第三方模组组合。关闭实验后恢复原版商品生成需要重新进入或重建商店列表；如加载器在应用界面打开前报错，可在模组中心停用整个 UI 包并重启。

---

# 1.0.1 验证说明

验证日期：2026-09-27。正式包合并服装店适配层的局部刷新路径，并将衣柜按页显示设为新安装默认值。其他性能实验仍独立且默认关闭；已保存的用户设置不被覆盖。

## 本次通过

- 源码目录 `npm run build`、`npm test`、`node tests/unified.test.cjs`、`node tests/acceptance.cjs`、`node tests/wardrobe-runtime.cjs`、`node tests/experiments.test.cjs`、`node tests/shop.test.cjs`、`node tests/shop-lazy.test.cjs`：退出码均为 0。
- `DOL_WARDROBE_INTEGRATED=1` 的衣柜、实验与商店测试：退出码均为 0，覆盖 Lyra 夹具。
- 新安装衣柜分页默认开启；保存关闭选择后重载仍保持关闭。其余实验默认关闭，回退路径由浏览器夹具覆盖。

## 验证边界

上述自动化使用隔离的原版与 Lyra 夹具，不能证明真实玩家存档、多模组组合或长期性能收益。独立商店按需分页补丁未并入本包；真实购买、配送与存档往返仍不属于该补丁的验收证据。平板最终包安装与冒烟测试结果以实际测试记录为准。

---

# 1.0.0 验证说明

验证日期：2026-09-27。1.0.0以已有0.11.0功能收口，生产代码仅更新公开版本号；同时整理独立构建、打包、文档及测试定位方式。

## 本次通过

- 独立发布目录 `npm ci --ignore-scripts`、`npm test`、`npm run build`：通过。
- 单元检查：状态边界、衣柜数据/套装、性能采样器、绘图状态隔离：通过。
- `acceptance.cjs`：中性SugarCube夹具中的战斗动作、原生底栏、快捷键、节点身份、回退、五种视口：通过。
- `unified.test.cjs`：统一设置、默认关闭实验、持久化、重复加载、回退与多视口：通过。
- `wardrobe-features.test.cjs`、`wardrobe-operations.test.cjs`：条件能力、套装匹配、容量、修理与转移适配等：通过。
- `wardrobe-runtime.cjs`：原版隔离新游戏中的整理、穿戴、绘图、恢复、异常与清理：通过。
- `shop.test.cjs`：原版/Lyra隔离新游戏中的单件和批量购买、扣款库存、配色、试穿归还、筛选、布局与回退：通过。
- `experiments.test.cjs`：原版/Lyra合成300件库存中300→40挂载行、跨页搜索/全选、穿戴映射、库存缩减、开关回退：通过。

第一次分页测试因沿用旧CSS类名而超时；改为通过“衣物分页”可访问名称定位后，上述两种环境均重跑通过。未为通过测试修改游戏行为。

商店/实验集成脚本对已知Lyra skybox/bannerFallbackImage异常做单独过滤，不能据此宣称解决该原版环境问题。

## 已有真机证据与限制

0.11.0的Android17平板实测确认衣柜分页减少节点、商店离屏绘制开关生效；商店滚动未测出稳定收益。真机分类/搜索测试恢复设置并核对金额、穿戴、库存、筛选未变。该证据针对0.11.0，不能替代1.0.0最终ZIP的重新安装验收。

本次没有在用户设备安装1.0.0。桌面自动化的手机/平板视口测试不等于所有Android设备测试；没有覆盖全部第三方模组、所有特殊商店条件或全部maplebirch版本。现代Android壳和完整系统替换尚未交付。

原始调试日志、游戏文件、测试截图和用户数据不随公开仓库分发。出现兼容问题请先通过界面设置回退对应系统，并附版本及复现步骤。


## 1.0.4-preview.1 存档面板

`node tests/saves-runtime.cjs` 在全新隔离 Edge 存储中测试原版 IndexedDB 保存、读取状态还原、删除、覆盖取消、原确认页、旧存储列表显示、390/1024/1500 宽度和原版回退。构建及现有单元检查通过。

未覆盖：真实平板、云存档、铁人存取、文件/剪贴板往返及第三方存档扩展。原版测试资源有三个 404，未观察到 JavaScript pageerror。列表只读当前页现有 DOM，不批量解压存档，不生成角色快照，不改变存档格式。


### preview.2 工具栏回归

分页切换、确认勾选、导入入口唯一性、回退位置及原有存取回归通过。本次隔离原版场景另出现一次 skybox undefined 错误，未定位，不能将测试通过视为整个游戏无异常。真机视觉待验收。


### preview.3 晒痕预览

`node tests/tanning-runtime.cjs` 构造启用晒痕及 upper_main 衣物晒痕数据；修复前复现 postprocess upper 错误，修复后生成三个晒痕图层，变量、衣物定义及 Skin 数据不变。验证为隔离 Edge 原版模型编译，不等同于 Genesis 反馈存档的真机像素验收。


### 2026-09-29 · preview.4 · 隔离绘图同类排查

- 对照原版 render/animate/redraw/compile，检查 options/canvas/listener/animated 的初始化依赖；检查隔离模块未绑定全局名及 setup/Skin/Time/Renderer 依赖。未发现另一处相同的模型参数绑定遗漏。
- 新发现：dataOnly 去除颜色配置函数，渐变发色调用 lengthFunctions[0] 失败。先复现，后在生成器中提取固定上游渐变定义，恢复私有配置中原版已知样式的纯计算回调；保留数值/颜色数据，不运行第三方回调。额外将 Time.isBloodMoon 从布尔改为原接口要求的函数（当前静态效果分支关闭）。
- 测试：原版与本地整合包分别通过 1013 个合成编译用例；覆盖衣物定义及渐变样式和部分体型/显示组合，并非所有状态的笛卡尔积。原版晒痕+渐变发色实际 compose 得到非透明画布；10 组全量/裁剪状态及 eager/lazy 对照一致，源状态保持不变。完整 wardrobe-runtime 回归通过（换装/整理/回退/五视口等）。
- 边界：未验证反馈者 Genesis 原存档、所有第三方自定义渐变算法或所有特殊状态。图层编译通过不等于每件模组衣物图像都已人工验收。新修复包 preview.4，保留之前的存档 UI 改进。


## 1.0.4 正式发布

用户确认当前界面测试无明显问题，授权先发布应急版本。用户未能手动构造晒痕，因此不将此次确认视为原反馈存档的晒痕验收。晒痕、渐变发色和服装编译的隔离回归证据与限制见上文；正式包沿用相同修复。


## 1.0.5-preview.1：侧边栏角色复用

- 衣柜识别 `#sidebar-img-container #img canvas.mainCanvas`，复制现有画布，不移动节点、不修改 Renderer、不再运行模型编译。场景 lighting 层不复制；不识别的结构回退隔离绘图。
- 原版与本地 Lyra 整合包隔离运行验证：画布像素相同、换装同步、侧边栏隐藏时复制、源画布移除后隔离绘图回退通过。单独生命周期测试验证延迟绘图、原画布原地更新、停止复制及等待期间取消。
- 可见时最多每秒复制 8 次，离屏/后台暂停复制，退出/回退取消定时器和可见性观察；属于预览采样，不承诺保持原动画帧率。未做真机性能对比或所有美化包验收。
- `node tests/sidebar-preview-runtime.cjs`、`DOL_WARDROBE_INTEGRATED=1 node tests/sidebar-preview-runtime.cjs`、`node tests/sidebar-preview-lifecycle.cjs` 通过。原 `wardrobe-runtime.cjs` 在测试中改名侧边栏容器以继续覆盖隔离绘图回退。

- 完整衣柜运行回归通过；测试隔离侧边栏时不关闭游戏图片选项，以保留服装图标验证。缺少可识别源画布时直接回退，避免新增等待。


## 1.0.5-preview.2：存档空间与传输界面

- 列表/详情等宽，列表独立滚动、分页底部常驻；原版工具节点移入详情专属容器，回退仍回原位。
- 已知原版导入导出 widget 按文件/存档码分组；原输入框和按钮保持同一对象，未知和云存档布局不接管。
- 构建及 saves-runtime.cjs 通过：IndexedDB 保存/读取/删除、覆盖取消、原确认、分页、设置、旧存档列表、三个宽度无横溢出、导出存档码/清空文本、原节点恢复、云页面未改动。下载、系统文件选择器、剪贴板权限与真实 Android 文件往返尚未验证。
- 修正测试的翻页等待条件：填写页码已会立即改变 input.value，须等待对应槽号出现，避免异步翻页尚未完成就点击设置。测试记录已有基线 skybox undefined 和缺图 404，未将断言通过当作环境零报错。


## 1.0.5-preview.3：最近存档与空槽混排

- 最近保存沿用原版 datestamp.green（自动/手动按原规则标记），不解析本地化日期，不自行猜测跨页最近记录。
- 手动已有/空槽按原槽位一起展示；自动存档仍单列。空槽加号和新建按钮触发对应原版保存按钮，原确认/禁用不变。
- saves-runtime.cjs 通过：槽号 1–10 顺序、点击空槽创建真实 IndexedDB 存档、最近标记、剩余空槽数量，以及原有保存/读取/删除/取消/导出文本/回退/响应式断言。测试环境仍有已知缺图404；未在用户真机写入测试存档。


## 1.0.5-preview.4：存档抽屉与原版作弊美化

- saves-runtime.cjs 通过：390/1500 宽度实际卡片坐标验证单/双列，详情打开/Escape关闭与边界，IndexedDB 保存/读取/删除、覆盖取消、原确认、导出文本、分页与回退。检查列表和抽屉截图。测试有已知缺图404。
- panels.test.cjs 通过：作弊原 DOM/状态不被挂载改写，原数值按钮增量正确，390/1704 布局无横向溢出、截图检查、分组跳转、回退和销毁；其他面板原回归继续通过。
- 回退 HTML 比较调整为同一次 evaluate 内前后比较，避免两次调用之间原版动态 DOM 更新被归因于回退；不停止游戏更新或删除原控件。
- 未做本轮 ADB 验收，未穷举全部作弊页签和第三方作弊扩展；系统文件选择器/剪贴板权限仍待真机验证。


## 1.0.5-preview.5

- 构建、saves-runtime.cjs 和 panels.test.cjs 通过；增加窄屏/宽屏遮罩关闭、内部点击保持打开断言，保留原存档确认与作弊数值回调验证。本轮未做 ADB 验收。


## 1.0.5-preview.6

- panels.test.cjs 通过：设置挂载前后原 DOM/状态一致、原勾选写入 options、设置五个页签窄屏无横溢出、态度原单选写入与回退、独立 Settings 进入/退出清理、全局回退覆盖新增开关。
- 手机测试收起原版侧栏后操作态度；侧栏展开会覆盖窄屏正文，不以强制点击绕过。已查看态度及设置手机截图。本轮未做 ADB 验收、未穷举解锁态度及第三方新增设置。


## 1.0.5-preview.7：存档模态残留修复

- ADB/CDP 实测 preview.6：customOverlay hidden，但详情仍 open 且匹配 :modal；主线程响应正常。关闭残留 dialog 后解除页面锁定，未写真实存档。
- 根因：代理保存触发原版关闭存档窗口，但 Vue 详情仍在浏览器 top layer。操作前关闭详情，原版 :oncloseoverlay 及 release 同步清理。
- saves-runtime.cjs 新增真实 overlay、关闭保存警告后的已有槽覆盖保存、原版关闭的模态清理回归并通过；原确认/加载/删除等继续通过。
- 平板临时加载 preview.7，详情打开数量 1→原版关闭后0，实际点击侧栏存档能重新打开。未覆盖用户存档；临时注入重启失效，需导入新 ZIP 持久更新。

- ADB 完整复测 preview.7 通过：以原空槽18新建，分别在关闭/开启覆盖确认时覆盖测试槽，保存后实际点击侧栏重新打开存档菜单；无残留模态。删除测试槽并恢复 warnSave=false；getAllSaves 前后全内容深比较一致，已有存档未变。备份仅存本地 ignored tests/artifacts。


## 1.0.7

- build/typecheck、单元及补丁检查通过；缩放范围/持久化/恢复与镜像恢复、原版衣柜运行回归沿用同轮结果。
- save-compatibility.cjs：独立浏览器新建存档，刷新进入无 UI 原版环境，读取 IndexedDB 和旧 localStorage 存档；新版导出的存档码由原版成功导入。首次测试修正了原版历史快照时机及 deserialize 返回元数据的测试假设，没有为通过测试修改游戏保存逻辑。
- saves-runtime.cjs 本轮通过：存读删、取消、原版确认、V1/V2 响应式、名称与真实负载隔离、时间元数据。
- ADB 会话验证：V1/V2 切换无新增运行错误，衣柜镜像一致且穿搭未变。未以用户实际存档进行破坏性兼容测试。
- 限制：此前桌面响应式取样存在偶发失败，根因尚未定位；衣柜背景现象未复现，水下氧气及全模组组合不在本轮验收覆盖内。当前通过不等于这些项目已解决。


## 1.0.9 兼容稳定性验收（2026-09-30）

- npm run package（类型检查及构建）、node scripts/test-unit.cjs、overlay-manager-layout、display-scale、native-action-panel、save-transfer-lifecycle、overlay-back-order、saves-runtime、unified.test 全部通过（测试脚本位于 tests/，扩展名 .cjs）。
- 覆盖50%/200%缩放隔离、动态单选节点事件/身份与回退、已删除控件不复活、子弹窗优先关闭、IndexedDB存读删及覆盖确认、旧式存档显示、五视口与重复挂载销毁。
- saves-runtime夹具有3条资源404日志，行为断言通过；不作为全部资源加载正常的证明。
- 平板运行1.0.9-preview.3，临时加载与正式版相同的布局模块：Esc和网页backbutton只关子框，父框保留；真实KEYCODE_BACK仍关两层，属于此前定位的宿主处理器行为。变量序列化与Passage前后相同。
- 首次设备脚本因侧栏按钮不可见而超时；改为触发原按钮click事件打开选项，验证弹窗关闭逻辑，不作为触摸入口可见性验收。没有修改用户存档，没有安装最终正式ZIP或重启做冷启动验收。
- 仍未穷尽更多模组组合、云存档、未知控件及第三方动作结算；遇到异常可关闭对应功能或回退1.0.8。


## 1.0.9 商店与衣柜业务补充验收（2026-09-30）

- `node tests/shop.test.cjs` 在原版及 `DOL_WARDROBE_INTEGRATED=1` 下通过：新增购买配送后衣柜穿戴，原生IDB保存/读档、存档码导出/导入；刷新至无UI环境后深比较金钱、完整衣柜、穿搭和游戏时间，再启用UI打开衣柜正常。保存前原生Passage切换用于提交历史快照；不替代存档菜单操作验收。
- `node tests/wardrobe-operations.test.cjs` 通过；`wardrobe-runtime.cjs`、`wardrobe-features.test.cjs` 在原版及Lyra均通过，包含穿脱、整理/取消/过期保护、套装丢弃/剪开、修理、转移、回退和五视口自动几何检查。
- 修正两个测试前提：批量购买前明确重新选择颜色；整理后等待异步预览完成再判断画布。原失败分别为黑色与蓝色断言不符、画布不存在；后者诊断时aria-busy为true。没有为了过测修改产品源码。
- Lyra测试首次缺少错误归属所需对照文件，未记通过。随后以 `DOL_WARDROBE_INTEGRATED=1 DOL_WARDROBE_CONTROL=1` 运行衣柜runtime，确认无UI也报 `bannerFallbackImage.onload` / `reading 'skybox'`，保存对照后完整回归通过；该上游错误未修复。
- 全部为隔离浏览器新游戏，未写真实存档，未操作Android设备。未覆盖完整真实模组组合、直接购买穿上、非家中配送、云存档，也不是性能收益证据。当前只更新测试/文档，不发布新版本。


## 当前衣柜性能基线（2026-09-30）

- `node tests/wardrobe-current-baseline.cjs` 通过：1.0.9暖缓存、隔离原版合成库存、每轮恢复同一存档，一对预热+三对交错开关。业务状态哈希一致；记录原生列表调用/耗时、长任务与帧边界等待。无产品源码/默认值变更。
- 最新桌面进入约99.8/95.5ms（实验关/开），换装92.7/41.8ms；原生列表换装重建47.7/0ms。仅三次正式样本，不代表真机或全部模组。初稿CDP求值任务未进入长任务统计，修正为页面定时任务后补测；旧数据保留并在工作区开发记录标注。
- ADB平板当前1.0.9：只测分类/搜索/预览刷新，中位约32–46ms，五次正式样本，无长任务；完整游戏状态序列化一致。未换装或保存真实游戏，不提供真机换装收益结论。


## 衣柜首次生成隔离实验结论（2026-09-30）

- ignored `tests/artifacts/wardrobe-entry-restored-probe.cjs`：首次跳过完整原生列表，UI显示后显式补建原生列表再禁用UI；最终运行退出0。固定隔离夹具原生读档时产生的 `saveDetails.loadTime` 后，完整状态深比较四对均相同，八次回退原生条目数85→85。此前失败仅据逐字段诊断确认加载时刻不同，未排除业务字段放宽断言。
- 三对正式暖缓存样本中位：正常完整就绪113.9ms；延迟首次UI57.8ms，补建后126.7ms。包括补建的完整窗口长任务3/3；不能把首段的0次长任务当总收益。测试含帧等待，不代表真机触摸到显示时延。
- 产品合入仍为 `accepted:false`：这只是显式恢复原型，未建立生产生命周期协议或验证第三方时序，完整耗时无明确收益。证据 `wardrobe-entry-restored-probe-1790774821281.json`；原失败记录保留。没有产品源码、默认值、设备或发行版本改动。


## 未发布：服装店后台任务生命周期（2026-09-30）

- `tests/shop-current-baseline.cjs` 以原版夹具载入四个精确Twee替换，一次预热+三次交错开关，测试原链接触发的筛选/翻页及350ms间隔筛选。修复前最后199项出现247项；中途开启按页模式后仍追加至26页。修复以列表代次让旧timed/repeat停止，当前列表生成规则不变。
- 修复后的原始结果 `tests/artifacts/shop-current-baseline-1790776166963.json`：全部八轮业务状态比较通过、离店后无生成、默认列表199项、开关切换后1页、17页名称与顺序核对一致、空搜索0项。首次运行末尾因一个 `bannerFallbackImage.onload` / skybox 异常退出1，原始失败保留。
- `DOL_SHOP_BANNER_CONTROL=1 node tests/shop-current-baseline.cjs` 在同一原版夹具完全不加载UI/实验脚本/补丁，延迟背景图片后进入Start2，精确复现上述错误；对照记录 `shop-banner-control.json`。`DOL_SHOP_VERIFY_ARTIFACT=tests/artifacts/shop-current-baseline-1790776166963.json node tests/shop-current-baseline.cjs` 重验原始证据全部商店断言通过，同时明确报告1个独立复现上游异常。不是重新采样，更不是全程无异常。
- 修复后实验关闭/开启：累计生成耗时中位932.0/18.7ms、页数47/1、目录节点22788/491；首段两帧等待42.8/46.9ms，翻页32.8/35.5ms。主要减少后台工作，不能作为首屏大幅加速或真机表现证据。三次桌面暖缓存样本，非全模组验收。
- 包内四补丁逐字节检查通过；检查后按字节恢复原1.0.9 ZIP，没有发布或安装候选。只读确认ADB平板仍在衣柜、UI1.0.9、无.error，不代表服装店真机验收。实验仍默认关闭；更多模组组合、真实服装店验收及安装包启动待做。


## 1.0.10-preview.1：Lyra隔离回归与集中ADB候选（2026-09-30）

- `DOL_WARDROBE_INTEGRATED=1 node tests/shop-current-baseline.cjs` 完成1次预热+3次交错开关；553项、默认47页/按页1页，间隔筛选199项，无重复；17页筛选结果逐页一致，离店后无追加生成。原始结果1790776628116，运行时仍为1.0.9加当前Twee补丁。首次末尾缺少Lyra无UI异常对照文件而失败，未记全程通过。
- `DOL_WARDROBE_INTEGRATED=1 DOL_SHOP_BANNER_CONTROL=1` 同脚本在同一Lyra夹具不注入UI/补丁，复现bannerFallbackImage.onload / skybox。对照按variant分文件保存，避免混用原版对照。随后以 `DOL_SHOP_VERIFY_ARTIFACT=tests/artifacts/shop-current-baseline-1790776628116.json` 复核原始全部断言通过，同时保留1个上游异常。
- 候选UI实际运行版本1.0.10-preview.1。`DOL_SHOP_LIFECYCLE_ONLY=1` 在原版和Lyra（另设DOL_WARDROBE_INTEGRATED=1）均通过：开关连续切换保留1页、47页全部名称/顺序核对、空搜索0项；从第5页重建默认目录时前后页完整按0–46排列、显示页仍5；购买一件原生1500商品只扣1500、对应衣柜仅增加1件。原版证据1790776744408无pageerror；Lyra1790776704701业务断言通过并单列1个已复现上游异常。全部是隔离新游戏，不操作真实存档。
- `npm run package` 的类型检查、渲染字段检查和构建通过；`node tests/shop-pagination-package.test.cjs` 对候选包四补丁逐字节检查通过，默认关闭保持不变；`git diff --check`通过。完整性能采样在构建候选前完成，候选生命周期专项在构建后运行，没有重复全套性能测量。
- 构建会清空dist并产生新候选ZIP；正式包保存在工作区releases/mods/DoLGameUI-1.0.9.mod.zip，SHA256仍为2d404a7dd5fdf3e5145502ef79f9ce57f7c47ebd274f9eec4485d39518d099e5。没有发布、推送或安装新包。
- 集中ADB待验：实际加载候选版本/四补丁 → 按页关闭时快速连续筛选无重复 → 后台生成期间切换按页模式 → 翻页与搜索清空 → 商品详情/选色/试穿及可恢复副本购买 → 离店/重入和回退。优先保护真实进度；未完成之前不称真机已验收或全模组兼容。


## 1.0.10-preview.1：ADB商店非结算验证（2026-09-30）
- 设备M367FC、1363×876；已运行候选，存储ZIP摘要与141487字节候选一致，加载后缓存包含capture代次和repeat检查。本轮没有安装、热注入或重启。
- 连续筛选默认17页199项/按页1页12项，中途切换后5.5秒仍1页；中文名称顺序与原生筛选一致。完整V恢复后无字段变化，原偏好恢复，页面错误0。
- 翻页0/1/37/0及详情往返通过，库存/金钱/穿搭不变。初始英文名称断言失败保留，确认汉化字段后修正测试，未更改产品。
- 本地证据adb-shop-110-localized-result.json、adb-shop-110-page-nav.json、adb-shop-110-detail.json；真实进度未保存/购买/试穿。搜索、选色、试穿、可恢复副本购买、离店重入与UI回退仍待验；不是完整业务或全模组验收。
- 本记录在构建后补充，未重新打包；包摘要仍为既有候选摘要。


## 存档设置刷新修复（本地待交付）
- 完整桌面发版批次在saves-runtime复选框不可见处失败，原报告workflow-release-1790782853463.json保留。确定性复现证明原生存档行变化触发重建，丢失details.open；不是用force点击绕过可见性。
- src/saves/main.ts保留刷新前的设置展开状态，回归在原生按钮disabled变化后等两帧检查仍展开。修复前失败、修复后test:quick -- saves通过保存/读取/删除、取消覆盖、传输回退和旧档/无UI读取。终端资源404及skybox异常单列，退出0不代表全程零pageerror。
- 余下六项布局/战斗检查分别运行通过，release-remainder-after-save-fix.json没有未执行项；结合此前通过项完成代表性桌面覆盖，不将原失败批次改写通过。
- 代码修复未进入releases/candidates原preview.1交付包，未在ADB安装或发布。下一次交付递增preview。


## 1.0.10-preview.2候选整理（2026-10-01）
- 在preview.1商店修复基础上加入上述存档设置展开状态修复。代表性桌面覆盖沿用已完成记录；版本递增不重跑完整性能采样。正式版仍为1.0.9。
- preview.1已交付文件保持原字节；preview.2构建、包内四Twee补丁检查及真实设备版本验证分别记录，尚未完成的真机业务不称通过。

- 2026-10-01交付后补记（未重新打包）：preview.2 ZIP143853字节，SHA256 `d4fcf0417e29d512ff47420a7245cba822eddb68e4aa65925d8d3df29648e510`；四补丁逐字节/构建/类型/ZIP完整性通过。用户确认保存后备份、事务安装并重启，实际运行preview.2。ADB原生存档按钮disabled恢复触发刷新，设置仍展开、完整V未变、可见错误0；证据adb-preview2-saves-result.json。停在Start，未加载真实存档或结算。


## 渲染器调试窗口兼容修复（2026-10-01，本地待交付）
- 真机开启canvasModel窗口，脚本无可见报错但checkbox高度120px、标签列20.575px；移除主题属性原生对照为24px/182.431px。主题overflow-wrap:anywhere影响原生auto/auto网格，是我们的兼容问题。
- 调试窗口实际嵌在.passage的footer内，单独从内容选择器排除仍会继承anywhere，真机验证失败。最终对canvasModel内容明确overflow-wrap:normal，其他弹窗/故事换行不变。
- overlay-manager-layout追加原生形状网格及.passage祖先：修复前失败、修复后通过；类型检查/构建、display-scale和diff检查通过。没有新增依赖。
- 真机只热应用同一CSS规则，模型/图层/颜色三页切换通过、完整V保持、捕获pageerror0；checkbox恢复24px。证据adb-render-debug-fixed.json/png。没有操作模型编辑选项。原生编辑器仍可横向滚动，这是保留的原布局。
- 运行与存储仍preview.2，交付ZIP不含新规则；热CSS重启失效，下次交付须递增preview或纳入正式新版本，不覆盖同版本归档。


## 1.0.10正式版收口（2026-10-01）

- 合并preview.1/preview.2修复及渲染器调试窗口显式normal换行策略；不新增默认开启实验，不改变存档格式、模型编辑和游戏结算。
- `node scripts/test-workflow.cjs quick saves layout`通过：构建/字段检查/类型检查、全部单元检查、存档运行/导入导出/无UI兼容、缩放、弹窗与渲染器网格、厨房布局。报告：`workflow-quick-1790787620913.json`。
- 复用之前有效的商店/衣柜/战斗回归与preview.2真机业务证据；debug真机使用与源码相同的热CSS，未宣称正式ZIP在设备重启后的完整验收。
- 正式版仍需观察更多第三方组合。已交付preview ZIP保持原字节，1.0.9作为回退基线。


### beta.47 完整包安装与收口

已按用户已有授权直接事务安装/重载。冻结包171331字节，SHA256 `6a290fe274e0477b3161a3f52e059265c929528f9c950e77215490ca2ed10e93`，ZIP CRC/当前dist逐字节一致；实际导出46回退SHA与冻结46一致。安装期间V/偏好/启停顺序保持。原生Lyra prompt由应用处理，工具没有接受未知prompt；运行47、错误/适配失败0、无临时CSS。

纠正前述设备在衣柜的历史判断：安装前实际私有收据已是战斗页，重载后同页。因此补完成了真实ADB展开/关闭选择摘要与原生战斗菜单，两张完整包Android原图已查看并按SHA绑定。Fancy实际浮层rgba(36,38,42,.74)、blur24、弱方向高光；常驻按钮Neutral/8px/.07弱边缘、无blur/常驻纹理/动画。截图检查前后V/偏好/页面、原控件身份/直接父级一致，底栏无溢出，两浮层已关闭。没有选动作/部位、Continue、菜单设置或存档读写。

[完整包原图清单](design-previews/2026-10-04-combat-tools-beta47/README.md)、[脱敏收据](audits/native-combat-tools-beta47.json)。Android实际开关/静态检查完成；多背景、滚动闪烁、长期性能和任意Mod组合仍待。安装后仅补文档，ZIP保持冻结。


### beta.49 完整包安装与最终验收

完整49已事务安装并重载生效，冻结包172988字节，SHA256 `e9134daf23fb77bcf1557f0d834396cad145d0f501232ffe9c87f53227cf52bd`。实际48回退导出SHA与冻结48一致（`5746245db64e4841973c3a5bb4b1d232f9323c7c3aa1f4a8386dcec866aece5b`），原47回退也保留；安装期间状态与启停顺序保持。

Android完整49连续12次真实ADB触摸交替展开/关闭通过：打开原菜单收起摘要，打开摘要通过原toggle关闭菜单，两个关闭路径可用；不是force点击，也不宣称物理同时多点触摸验收。截图确认原菜单完整行底色与对齐已修正，摘要/菜单均V2透光外壳、blur24、局部柔白受光与稳定正文，内部无独立blur/连续动画。

检查前后V/页面/偏好、原控件身份/直接父级一致，无底栏溢出，错误/适配失败/临时节点均0，两浮层已关闭。没有选择动作、Continue、修改菜单设置或执行存档读写。原菜单控件与handler保留，未移动/替换原节点；Vue仅协调自有摘要的显示。

[最终Android原图及SHA清单](design-previews/2026-10-04-combat-popup-beta48/README.md)、[脱敏验证收据](audits/native-combat-popup-beta49.json)。多背景、滚动闪烁、长期性能与任意Mod组合仍待；安装后仅补文档，没有重打同名ZIP。

## beta.50：战斗浮层对齐存档级透光（2026-10-04）

用户要求两浮层进一步透光，并明确以存档界面级别为准。仅CSS：外壳复用定稿存档主菜单rgba(36,38,42,.68/.64)、blur24；标题/正文遮罩降为.40，避免.60/.78二次叠实，摘要小字#d1d3d9保持清晰。49开关协调、原控件/父级/事件保持；Smooth和关闭玻璃实底。未推广到其它区域。

build/typecheck与combat-resize通过（亮白环境>=4.5、三档/玻璃关闭/减少动态、窄宽重复互斥与原click次数、原节点/直接父级/状态、7视口/200%与回退）。首次较透外壳试值未过小字对比度，按用户明确的存档主菜单基线修正后通过，未降低断言。

完整50已事务安装/重载，冻结174049字节，SHA256 `bf05b9a7b626a89d0b2d46660fb781c5815b49669bcf0ba8f736a5315327d00c`；实际49回退导出SHA与冻结49一致。Android连续12次真实触摸交替开关通过，四张原始截图已查看、备份并绑定SHA，动作区截图只滚动、不选动作，结束关闭两浮层并恢复滚动。重载后验收V/页面/偏好/原节点/父级保持，错误/失败/临时样式0。

重载前后原始V严格比较首次失败：仅NPCName描述及descCache发生变化，其它变量/页面/偏好相同。已核对实际NamedNPC构造器初始化空descCache、重新调用bodyPartdescription并随机选择描述词；记录为重载初始化差异，不宣称安装重载全过程V逐字节不变。验收期间没有游戏动作/继续/设置修改/存档读写。

[原图与清单](design-previews/2026-10-04-combat-transmission-beta50/README.md)、[脱敏收据](audits/native-combat-transmission-beta50.json)。长期性能/更多背景/物理同时多点触摸仍待。安装后只补文档、不覆写冻结ZIP。

## beta.54：原生存档确认页补漏（2026-10-04）

进入原生覆盖/读取/删除确认时，列表代理按原设计撤下；原版saveBorder以前因此丢失Acrylic外壳，并沿用按钮150px左边距。已识别确认节点只加可撤销dgs-native-tools标记；CSS复用工具页外壳、稳定轻内容底层、Neutral原按钮和正常换行间距。原确认内容/警示色/节点/父级/属性/回调保持，无新增代理、DOM移动或业务状态。关闭新版存档撤销标记，原版结构及样式恢复；未知布局不接管。

build/typecheck、saves-native-tools、saves-header-lifecycle与原版/整合saves-runtime通过。真实原生确认覆盖覆盖/读取/删除取消、V与槽位内容不变、动态Mod文字/hidden、原节点/直接父级/属性/handler、390/1500px与100%-200%/三档/关玻璃、单层blur、Tab焦点与回退。原版强制important底色首次挡住Neutral，已局部覆盖；第二次断言采样撞上原CSS圆角过渡，改为等待实际动画完成，未降低样式断言。既有资源404、remote-loader与skybox日志保留，不能称全游戏零错误。

完整包安装与Android验收待本轮后续补证；用户设备不执行存档确认业务，原生业务测试只在隔离IDB。默认双列与V2结构、存档详情、导入导出和云端业务不变。用户接受beta.53重载差异可能来自不同存档并要求继续，保留旧证据，不直接回写状态。

### beta.54 完整包与只读验收

已事务安装并重载54生效，冻结178804字节/SHA256 d46d7d7a2a02097f39ed8b64ffced4743e5eefc0fdfbecb9c6f4c81ab780a0b2；实际53回退导出SHA匹配冻结53。Android真实触摸打开原存档列表、只读确认样例返回原列表通过；样例确认禁用，不连接存档业务。单层blur24、内部无blur、原控件8px/44px/无固定左边距及屏内边界通过。只读检查V/页面/偏好/存档记录/游戏原节点父级保持，结束关闭菜单、清理样例并恢复焦点/滚动，错误/失败0。重载字段差异单列脱敏收据，用户接受此前差异并继续，不直接回写状态。

[完整包原图及SHA清单](design-previews/2026-10-04-native-save-confirm-beta54/README.md)、[脱敏验证](audits/native-save-confirm-beta54.json)。设备不执行真实确认业务；实际保存/读取/删除与取消只在隔离IDB验收。未来Mod布局、更多旧版确认与长期性能待；不覆写冻结ZIP。

## beta.55：衣柜局部确认区统一（2026-10-04）

仅6行CSS：原整理工具条去完整边框，确认区从棕色警示框改为稳定Neutral轻内容层、弱顶部受光，关联说明使用次级文字，按钮用Flex gap自然换行。不加blur/代理/observer，不改Vue节点/业务逻辑；原不可撤销及时间提示仍保留。

build/typecheck与原版/整合wardrobe-features通过（修理/转移/容量/关联衣物/原模式复位）。隔离真实Wardrobe查看原生流程中的修理审查，节点/直接父级/标题焦点保持，390/1363px与100%-200%不溢出；取消不改衣物耐久或时间。旧CSS54对比与新样式原图已查看。产品不新增测试框架或为低影响样式添加镜像断言。完整包安装与Android只读样例待本轮补证；设备不执行换装、整理、修理或转移。

### beta.55 完整包与真实衣柜验收

已事务安装并重载55，冻结179726字节/SHA256 6b885733d34f68d313b0cf96994bffc6dae8b15936df9c79d8e2afa89b006ecb；实际54回退导出SHA匹配冻结54。重载前后实际均在Wardrobe，改用真实UI而非样例：ADB触摸整理→勾选→审查丢弃→取消→退出整理通过。没有点击确认，也未丢弃/修理/转移/换装/脱衣/存档操作。V/页面/偏好/存档记录/原控件父级保持，审查标题焦点正确，内部blur0、无完整边框或横向溢出，按钮8px/44px。已恢复滚动与焦点、结束整理，错误/适配失败0。

[Android原图及隔离CSS对比/SHA](design-previews/2026-10-04-wardrobe-review-beta55/README.md)、[脱敏收据](audits/native-wardrobe-review-beta55.json)。更多背景、Mod组合与长期性能待；冻结55ZIP不覆写。


## 2.0.0 本地交付（2026-10-04）

正式本地包183127字节，SHA256 `4ed47e305cf0e72dfa9eefe2bb61c236fcd689ecf21a218920572b0c8d385957`。四运行资产与beta.55仅版本串不同，boot仅版本与新增交付文档不同；已从beta.55事务更新，安装期间状态及启停/顺序保持，实际回退ZIP SHA与冻结55一致。重载API确认2.0.0/Wardrobe，Android衣柜和存档详情原图已查看绑定。

本轮发版旧颜色断言失败原报告保留，按批准材质仅更新两处精确值；六个未执行缩放/布局/战斗检查另跑通过。其余通过项及材质/DOM兼容/整合专项复用，未重跑掩盖失败。正式完整包默认双列与三级详情单层blur/正文无blur/边界通过，检查后V/页面/偏好/存档记录/原控件父级一致，已关闭菜单恢复滚动与焦点。无实际存档或游戏写入。

[交付说明](RELEASE_2.0.0.md)、[图片与SHA](design-previews/2026-10-04-soft-wet-2.0.0/README.md)、[脱敏收据](audits/soft-wet-release-2.0.0.json)。当前手机物理设备、未知组合、长期GPU/功耗仍有边界；公开发行未操作。冻结包不因文档补记重打。
## 2.0.2 / 0.5.12.13 兼容补验（2026-10-05）

按最小充分验证补测新增版本和触屏修正，复用 0.5.11.9 有效证据。源码构建、0.5.12.13 隔离商店 / 战斗原事件专项、触屏高亮专项及平板菜单 / 存档 / 设置 / 衣柜 / 战斗浮层检查通过。平板商店已预览列表与详情，工具栏关闭脚本遇到原生遮罩后停止，未完成项不记为通过。范围、失败归类和未覆盖项见 [2.0.2 兼容记录](RELEASE_2.0.2.md)。发行包的 7 个 JS / Twee 与旧发行包逐字节一致，CSS 只追加触屏修正；运行逻辑、存档格式和原控件不变。


## 2.1.0 UI Runtime 第一阶段（2026-10-05）

保持主版本 2.1.0，新增只读主题、视觉档位和能力查询，以及明确目标的 Style Only Adapter。两份可选适配包升级为 0.2.0。只写可撤销的 data 标记，不移动、替换或复制第三方原节点；Core 不内置 ModHub / MapleBirch 结构，也不拥有其业务状态。接口与范围见 [UI Runtime](UI_RUNTIME.md)。

按共享兼容逻辑的风险进行专项验证：`npm run build`（含类型检查）、`node tests/ui-runtime.cjs`、`node tests/resilience.cjs`、`node tests/master-toggle.cjs`、`node tests/test-workflow.test.cjs` 通过。没有重复全项目发布回归。Runtime 专项覆盖输入校验、只读快照、有序 selector fallback、重复目标拒绝、未知版本和结构漂移降级、safe 指纹失效退出、单 Adapter 故障隔离、动态未知 / hidden 内容、原控件值和事件、注销与 Core 重建。稳定 refresh 的属性变动为 0，避免重复标记触发其它观察器。

独立安装的 Android 0.5.12.13 测试版已安装并重载完整主包及两份适配包，实际加载 ModHub 1.3.0 / MapleBirch 5.2.3 / UI 2.1.0 / 两 Adapter 0.2.0。原 ModHub 管理页与 MapleBirch 云存档均命中 full 指纹；总开关 / 存档页开关撤销、恢复样式后，原节点身份、父级、兄弟关系、控件值及原 handler 保持。截图已查看，结束关闭菜单。只读验收期间 V / 页面 / 显示偏好 / 加载顺序 / 隐藏列表保持，未出现 pageerror；重载变量不与重载前做逐字节不变承诺。

没有执行购买、换装、战斗动作、存档读写、云端请求或 ModHub 安装 / 排序 / 删除业务验收。安装候选包本身通过已有 ModHub 安装函数进行，原包已导出用于回退。截图原生日志定位提示不能视为全游戏零错误证据：加载记录仍含 ImageLoaderHook CssReplacer 的 countError[1]，本轮未改图片加载器或把该项列为修复结果。陌生组合、其它目标版本、长期性能和真实云端业务仍未验证。

[脱敏设备收据](audits/ui-runtime-2.1.0.json)。本轮未操作 GitHub 发布；最终包只补充验收文档，运行资产与已完成实机检查的包逐字节一致。


## 2.1.0 Surface 请求 API 增量（2026-10-05）

在 apiVersion 1 下增量开放 openModal / openDrawer，主版本仍为 2.1.0。原生 dialog 提供 top layer、背景 inert 和导航；只接收调用方新建的脱离内容，不替换第三方窗口，不公开内部 store 或 DOM。关闭主题 / 原生能力不足时返回 null，已打开浮层撤销；正文稳定、外壳复用已确认存档 Acrylic。两 Adapter 0.2.1 仅补 API / 方法 / 能力检查，继续 Style Only，不依赖 Surface API。

`npm run build`、`node tests/ui-runtime.cjs`、`node tests/master-toggle.cjs` 通过。复用同一 Runtime 专项检查：重复 id 复用、不同类型冲突拒绝、connected 原节点拒绝、内容值和原 click / submit 保留、父级不变、Esc 上层关闭、按钮与遮罩关闭、拖出不误关、焦点恢复、总开关即时降级、showModal 失败清理、回调失败隔离、销毁幂等、独立示例及两包 API 缺失 fallback。390 / 1280px 示例 Drawer 边界和内部横向溢出检查通过。初始键盘断言把原生 Tab 暂时转到浏览器当作失败；独立裸 dialog 复现确认是 Edge 行为，调整为验证背景控件始终 inert，不通过额外 Tab 拦截改变浏览器行为。测试数组最初误用了 Window.closed 只读属性，已更名；没有产品异常被当作通过。

本轮不重复无关发布级回归，不宣称其它 Surface、registerUiExtension、Proxy 或 Deep Adapter 已实现。完整包 Android 安装和只读示例验收另补下文；实际存档、云端请求及 ModHub 管理业务不属于新增 Surface 验证范围。


## 2.1.0 发布候选：Surface / Inspector 收口（2026-10-05）

新增 Inspector 的手动快照、指纹 / Mapping、原因、最多 32 条状态变化事件、复制和 JSON 下载。界面设置中的开发检查入口默认收起。不读取 State.variables、控件值或 DOM 正文，导出移除 selector 属性值，不导出 Surface 标题 / 内容。原生 API dialog 的 blur 改在 ::backdrop：Android WebView 原先仅 computed dialog blur 存在、图像未生效，临时对照定位后改为单层原生背景模糊；正文 blur 为 none。

build / ui-runtime / resilience / master-toggle 通过。专项覆盖快照不可变、禁止业务变量读取、输入和游戏秘密不进入导出、复制与 JSON 下载内容、Clipboard 拒绝处理、有上限事件、稳定重扫不重复记录、设置入口和主题关闭撤销。可选角色缺失单列 Mapping，不把完整指纹误报为降级。

发布集中回归先完成 build / unit / wardrobe / sidebar / shop，在 saves-runtime 的临时导入导出样例被侧栏截获点击时停止，原失败报告保留（workflow-release-1791191859176.json）。样例外层漏写原生遮罩定位，blur 建立堆叠层后内层 z-index 无法跨出；只修测试挂载，未改产品业务，也未使用 force click。目标 saves-runtime 补测通过，续跑此前未执行的 save transfer / save compatibility / master native / density / scale / overlay / kitchen / combat 通过；三项 Runtime 已通过结果复用，另补社交和普通面板专项。续跑记录 release-2.1.0-continuation.json 保留。没有通过重复全跑掩盖初次失败。

Android 0.5.12.13 独立测试版已安装并重载候选及两个 0.2.1 Adapter。原 ModHub / MapleBirch 窗口 full 匹配，身份 / 父级 / 兄弟 / 控件值 / handler 与开关回退通过。API 示例原 checkbox / click、重复打开复用、Modal / Drawer 关闭、屏内边界及主题关闭通过。Inspector 设置入口、真实 Game 0.5.12.13 / Loader 2.101.1、手动重新扫描和 Adapter 指纹 / Mapping 检查通过；图像已查看。检查期间游戏变量、页面、偏好、顺序和隐藏列表保持，pageerror 为 0。最终关闭所有测试菜单、清理示例。设备未执行购买、换装、战斗、用户存档读写或云端请求。Android 下载和 Clipboard 权限不作普遍保证；不把本轮无 pageerror 等同于整个游戏无历史加载器错误。

[脱敏收据](audits/ui-inspector-2.1.0.json)、[Inspector 原图](screenshots/2.1.0/inspector.png)、[Adapter 展开原图](screenshots/2.1.0/inspector-adapter.png)。最终 ZIP 补充本次验收文档，运行 JS / CSS 与实机候选哈希一致。没有将增强开发工具包编入 UI Core。
