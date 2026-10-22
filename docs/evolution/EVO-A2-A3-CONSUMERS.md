# EVO-A2/A3 — 消费者资源迁移与重复路径退出

2026-10-23，`dev/evolution-4.0`，输入 `fbf026997c73ac35b22e3a697a13d74e0686a065`。负责人本轮指定继续步骤1、2：完成已批准消费者的架构迁移，并在验证后退出对应重复路径。未推进步骤3的视觉原型接线。

## 交付范围

内部 `visualScope` 沿用前批实现，新增可提前释放的登记、定时任务和当前帧批次取消。子作用域关闭时同步从父清理集合退出；定时任务完成时自行解除登记，取消或释放后的迟到回调不能执行。没有新增公共 Runtime 或 Host API。

| 消费者 | 实际迁移与当批退出 |
| --- | --- |
| 设置控制器、侧栏布局 | 主题刷新、玻璃测量、动态观察器、有限挂载重试和环境监听使用作用域。删除局部frame/glassFrame、disposed、定时器集合和监听清理数组；玻璃关闭、侧栏替换时释放对应登记。保留设置300/220ms及原有演出。 |
| 原生窗口呈现 | 代理与导航继续使用原语义；帧批次、观察器和退出清理纳入作用域，删除独立frame集合/dead路径。场景变化仍可取消当前批次，不销毁整个所有者。 |
| 正式天气 | 保留现有paint、读取与材质；轮询、子动效、可见性监听使用作用域，删除局部timer/dead管理。没有替换成C5.2/R10原型。 |
| 正式Hub及经典Floating回退 | 正式贡献/挂载、Hub测量和提示定时器纳管；经典模式使用独立挂载子作用域管理监听、观察器、长按和布局。删除frame/hintTimer/stopped、旧定时器及监听数组。保留偏好、拖动、停靠、真实工具、排序和回退。 |
| 属性、社交、通用面板 | 已共享的导航适配器与挂载事务继续复用；根刷新和发现观察器纳管，删除独立frame/destroyed路径。overlay和passage的观察器同时释放，原内容索引和恢复职责保留。 |
| 商店及对照 | 根刷新、测量、动态Resize登记、原生事件后的结果核对定时器和焦点返回纳管。删除frame/resizeFrame及旧计时ID路径。购买校验、报价、原事件及已提交交易结果不改。 |
| 衣柜、预览、参照与附加内容 | 根扫描、每会话刷新、组件测量和装饰刷新纳管；镜像采样、Intersection观察器及私有绘图包装超时使用作用域。删除queued/previewFrame、旧采样timer/stopped管理。实际穿戴、业务批次、原节点恢复及vendor不重写。 |
| 战斗 | 根扫描和每次挂载的Resize子作用域纳管；删除queued/disposed和会话resizeFrame，释放后不能重新排帧。原动作、Continue、聚焦、原生选择器及结算不变。 |
| 存档 | 根刷新、观察器和SavePanel布局测量纳管；删除frame/destroyed/resizeFrame。元信息、传输、保存/载入及原生节点恢复继续归现有业务控制器所有。 |
| 兼容包 | 原版优化衣柜投影和ReOverfits自有装饰帧/观察器纳管，删除独立frame/destroyed。其它外观包继续通过已有UiApi v1适配器工厂取得共同观察/恢复合同；未接管第三方业务或未知节点。 |

导航坐标继续使用已验证的 `navigationRect` / `navigationScrollTop`；Hub终态沿用共享geometry，固定玻璃、原生布局及Canvas保留各自坐标基准。不同宿主的算法不因纳管而强行合并。GameButton、SettingsToggle、Vue watch/Transition及CSS动画仍由既有组件生命周期拥有。

已有公共UiApi适配器/Surface工厂、Host owner/claims/mounts、reference贡献、业务source与异常恢复继续复用。它们已有专门生命周期和业务边界，本轮不在其外再套第二个公共管理层。保留恢复原生节点的专用控制器，不将其误删为重复动效。

## 明确保留的调度边界

`tests/evolution-resource-contract.test.cjs`检查src、官方呈现/Hub和compat中的原生帧/计时入口，禁止迁移后重新引入私有呈现调度。当前只有以下六个文件允许直接调用；vendor、生成dist及研究原型不在玩家呈现源码扫描范围内：

| 文件 | 保留理由 |
| --- | --- |
| `src/ui/visual-scope.ts` | 共用原语本身调用原生调度。 |
| `src/runtime/ui.ts` | 已有UiApi v1共同适配器/Surface所有者；保留可注入Window调度和对外合同。 |
| `src/runtime/sugarcube.ts` | 原生状态服务的注入式调度合同，归status controller释放。 |
| `src/runtime/inspector.ts` | 下载URL在1秒后回收，必须允许下载请求晚于Inspector关闭完成。 |
| `src/story-actions/main.ts` | 默认退役，已批准排除的历史回退，不重新启用或计为迁移成果。 |
| `src/wardrobe/main.ts` | 仅保留一处原生批次操作yield；必须正常settle以执行原模式恢复，不能当装饰帧取消而悬挂业务Promise。 |

私有绘图包装以完成、错误或15秒超时释放作用域；上游compose没有取消合同，其已开始的图像工作仍可能在视图退出后完成。调用方保留AbortSignal/generation校验，迟到结果不会写回旧界面。没有伪造上游取消能力。

## 验证与失败记录

Windows / Node26 / Edge：

- `visual-scope.test.cjs`：帧合并、替代、peer、异常清理，以及新定时器完成/取消/迟到投递、子登记提前释放与重复释放通过。
- `evolution-resource-contract.test.cjs`：扫描通过，六项保留入口明确登记；新增文件或迁移代码恢复原生私有调度会失败。
- `evolution-owner-resources.cjs`：实际设置、侧栏、属性、社交、通用面板、商店、衣柜、存档、战斗、经典悬浮球、官方呈现、天气、Host+正式Hub共13个入口。销毁前实际取得资源；销毁及主动迟到投递后，帧/计时器/观察器/全局监听均为0。普通页面使用无业务内容的原生壳；设置、Floating和Hub实际挂载组件，不能据此宣称所有业务场景均已覆盖。
- 同一owner检查的 `--baseline` 冻结输入提交的真实衣柜源码，精确拒绝 `wardrobe resources after dispose`：原实现销毁后仍有1个扫描帧，当前为0。没有删断言或提高容差。
- 设置双布局/滚动/Zoom/模态输入、导航与通用页面、战斗原动作/选择器、存档传输、商店与衣柜反馈、原版优化投影及兼容材质的受控回归已执行；最终清单与CI状态见Issue #22。
- 本机已有游戏夹具的侧栏预览验证通过：像素复制、换装同步、隐藏/源丢失后的隔离fallback、恢复、pending取消和abort清理；参照组件受控构建检查通过。没有读取私人存档。这不是新安装包在真实ModLoader/Android上的验收。
- 完整 `npm run prototype:golden-spin:test` 通过，含真实工具输入、反向、隐藏、换景、缩放、零尺寸及卸载；已认可原型、球体外观、终态geometry、材质CSS、依赖和公共合同均未改动。
- 类型/Framework合同、UI及Framework构建通过。新增两个检查接入现有标准与研究CI，研究Artifact记录 `owners.json`。

新owner夹具首次计数包含Vue开发模式初始化的3秒devtools探测定时器。已先初始化同一Vue renderer，再开始消费者资源计数；保留首次失败JSON，严格归零断言不变。该框架初始化任务未记作UI资源泄漏。

完整标准CI首轮 `39834323662` 在兼容包构建阶段失败：构建器原先要求导入全部为type-only，新接入的纯资源原语也因此被拒绝。汇总与moody-gate属于连锁失败，浏览器和包验证阶段没有执行。修正构建边界：仅额外允许复制确切的 `src/ui/visual-scope.ts`，仍拒绝其它任何直接或传递模块；没有允许打入第二份Runtime、Vue或业务代码。新增构建正反例，实际证明资源原语可打包、Runtime与其它内部模块被同一错误拒绝且不生成成员。两个兼容消费者保留共享原语，不退回独立调度。包构建后源码扫描首次误扫生成dist，已将生成目录排除，源码入口和六项例外断言保持。随后本地八包完整构建和包合同/可复现性检查通过；最终完整CI状态另见#22。

补充 `node tests/ui-runtime.cjs` 在版本身份断言停止：实际 `DoLGameUI.version` 为2.7.0，package.json为3.0.4。已确认输入fbf0269的 `src/main.ts` 同样硬编码2.7.0，当前没有修改该文件或断言。此补充套件不能记为整轮通过；版本诊断标识问题列为已知旧问题，后续正式整合时处理，不在本批擅改公开身份。

## 状态

本轮步骤1、2已完成源码迁移与对应旧路径退出，按覆盖表保留原生/第三方/公共工厂例外。完成结论针对本轮架构范围；最终提交、两套完整CI及已知问题更新到 [Issue #22](https://github.com/102326/DoL-Game-UI/issues/22)。G1仍需依据覆盖和例外进行技术复核，不自行宣告整套4.0通过。

未接入设置V2.3、天气C5.2/R10或球体正式路径。真实设备、真实ModLoader、多Mod长期资源与性能仍属后续正式整合验收；本批归零计数不等于FPS或长期内存结论。无main合并、版本升级或发布。
