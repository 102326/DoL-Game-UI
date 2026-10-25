# TS First：迁移与技术验收收束

> 后续独立终审发现GB40-TS-F1。178f8b2已修复并完成新两套CI、制品与代表性只读实机复验，独立复审仍Pending，见[存档revision专项](EVO-SAVE-REVISION-P2-2026-10-25.md)。本页记录d8430当时的检查结果，不冒称后续修复的执行证据；243项迁移与未变范围的原证据继续有效。

2026-10-25。受验代码 `d8430a8274282528a68a7a737b37c970dfae7020`，分支 `dev/evolution-4.0`，内部版本仍为 **4.0.0-rc.2**。负责人授权的方案一迁移与本轮技术回归已完成；正式4.0、main合入、Tag与发布继续等待负责人决定。

## Delivered

- 冻结清单243个维护中独立JS来源全部转为TS/CTS/MTS，并实际进入严格工具图。现有CommonJS命令、导入导出和执行路径保留，由CTS编译生成。
- 维护中的HTML预览逻辑已提取为TS；device-probe从严格TS生成；两处Twee resize回调从严格TS生成，保留原宏和原事件路径，八类输入等价及生成漂移反例通过。五份EYES历史展示保留为归档，不进入产品构建。
- 当前产品、Host、Vue、兼容包与原型内核使用strict、checked indexing，产品关闭allowJs；已有TS的JSON、宿主/渲染输入和CI证据边界继续收紧。衣柜无效定义与上传假PASS分别补运行时校验、正常/异常及无写入测试。迁移、边界修复、夹具修复分开提交。
- 开发、构建及两套CI统一Node **>=26.12.1且<27**；实际使用26.12.1。玩家浏览器目标、双包合同、视觉方向、业务和存档语义保持原约定。NaN仍是number，运行时输入检查没有因TS而取消，也不声称旧日期/资源Unknown已经解决。

## Validated

| 项目 | 当前证据 |
| --- | --- |
| 标准CI | [40172977229](https://github.com/102326/DoL-Game-UI/actions/runs/40172977229)：完整success，含validate、独立evidence-verify与moody-gate |
| 研究CI | [40172975815](https://github.com/102326/DoL-Game-UI/actions/runs/40172975815)：完整success，含独立evidence-verify |
| 独立回读 | 两份remote-verification和summary均绑定d8430a8、dirty=false、Node26.12.1、PASS/COMPLETE；完整原始研究包下载并校验CRC |
| 制品 | 下载10项摘要、9个ZIP CRC及合同、元数据/依赖/许可/成员核对；双构建PASS且differences=[]，见[九包冻结清单](EVO-TS-FIRST-PACKAGES-2026-10-25.json) |
| Windows | Edge157.0.4341.16、隔离DoL0.5.12.13真实Loader；八个包实际成员，双布局/分类、真实设置开关及恢复、受控血月/极热/严寒、390px边界和关闭清理通过。此桌面环境不是完整Android社区组合 |
| Android | 独立测试App、WebView155.0.8059.43，1363×876 CSS视口/dpr2.5；原生重启后8个适用包成员、150%字号触控滚动、背景阻挡、双布局/分类、Hub触控开闭/快速反向/收起背景，以及ModHub管理/帮助原页签、自然severe雷雨单一天气层与关闭释放通过 |

实机预检先使用4f95f78的调试负载，保留该原始身份；最终d8430a8的八个适用ZIP容器及全部成员与预检包逐项完全相同，另有精确等价记录。随后用新连接再次读取Android实际Loader成员，对照最终CI，并确认标题页、原偏好/顺序/禁用列表、关闭状态和零残留天气层。没有把旧记录的source改成新HEAD，也没有仅凭相同版本号复用。ReOverfits目标未安装，未顺带装入。

标准CI设备布局覆盖Chromium仿真124项并保留四类负例；它不等同实体手机/iPad验收。存档、购买、叠穿、真实回合等未变业务，复用[发布前回归](EVO-PRERELEASE-2026-10-24.md)和[RC2记录](EVO-RC2-VALIDATION-2026-10-24.md)，本次不冒称重走全部业务。

## 有限JS与历史编译例外

提交内12个JS/CJS分别为10个严格CTS生成的安装前/独立下载检查入口、固定第三方isolated-model.js、冻结tests/story/helpers.js。原始HTML/Twee脚本和恶意反例字串作为数据保留。只有生成输出保持JS运行形式，不保留第二份手写业务实现。

历史设置/天气对照含915dcb9与b507冻结源码，使用其原strict=true编译合同（当时allowJs=true，未启用checked indexing），不改写历史输入；当前独立原型内核另按当前root严格检查并进入ci:check。配置边界测试锁定这一差别，不能将历史配置用于当前产品。

## 失败与Known limitations

- 首轮研究CI发现当前原型的索引检查遗漏及历史快照继承新配置；单独修正当前读取，并隔离历史编译合同。随后标准/研究共同发现settings-ci只有浏览器端must实现，Node端只有声明；补实际函数后完整专项和两套CI通过。其后8021362标准CI的所有行为脚本通过，但三组收据因生成CJS的条件空格导致误带core-identity而UNVERIFIED；改为按AST读取实际CTS分组，独立身份检查、缺项拒绝和全部突变/pageerror反例保留并验证。未删除真实测试、放宽等待或隐藏连锁失败。
- 本次额外现场检查器曾在450ms采样620ms分类转场，并误用ModHub的.active/DOM移除判据。保留首次失败，分别按既有3秒完整状态判据、原生tab-selected及display:none关闭合同验证；没有为此改产品。
- 本地历史脚本仍有旧颜色、偏好、旧Core身份断言和新旧同样的超时；有缺失历史ZIP/game.html/外部工具的入口仅完成严格编译。banner skybox异常、长期残余资源与既有社区告警仍为原记录中的Unknown，不以当前CI成功宣称全部解决。详见[分批执行与失败记录](EVO-TS-FIRST-IMPLEMENTATION-2026-10-24.md)。
- 未覆盖Mac/iOS、所有实体手机/WebView与Mod组合、全部自然特殊事件、长期资源及呈现FPS。此前gfxinfo无有效帧不作为FPS证明。这些属于覆盖边界，不追加成本轮无限验收。

## 当前终点

**TS First本轮技术范围Completed。** 源码、当前两套CI、九包、代表环境与交接证据已收束。保持4.0.0-rc.2；下一步由负责人进行整体体验/发布前裁决，再单独处理正式版本、main与发行。未创建Tag、Release或修改公开Assets。

本机原始证据位于tests/artifacts/ci-readback-243-final、ts243-final-*与ts243-provisional-*；含原始设备资料，未自动公开。当前文档是技术结果索引，不替代其引用的准确代码与制品。
