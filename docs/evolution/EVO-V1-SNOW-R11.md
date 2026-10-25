# EVO-V1-SNOW-R11：雪天候选与材质角色首轮

2026-10-23。研发分支 `dev/evolution-4.0`，输入 `f318241c909125efe0319f041f783209d4fb1494`。负责人批准先做不依赖实机的雪天样片与其它表面角色提案；正式 G1/G2/G3 裁决、实际消费者推广、main 合并和发行不在本批范围。

## 本批做了什么

| 编号 | 实际交付 | 状态 |
| --- | --- | --- |
| EVO-V1-SNOW-A | A「霜羽」：固定种子的非均匀边缘羽状冰晶、细脉/暗部/冷光、18槽散雪 | 隔离原型 Implemented / Targeted Tested；视觉待裁决 |
| EVO-V1-SNOW-B | B「雪沿」：横沿细碎积雪、较薄侧边颗粒、柔和冷光与散雪；与A区别明显 | 同上；没有自判高保真或实机通过 |
| EVO-V1-SNOW-REF | 当前 frostSurface 保留原源码；现行/A/B使用相同受控天气、实际设置组件、1280×900/DPR1和原速操作计划 | 三段录像与静态/近景；现行雪效仍未获得视觉通过 |
| EVO-V1-MAT-01–04 | 正文窗口、信息面板、轻量工具、操作抽屉；不同底材层次、正文/控件净区 | [四角色提案](EVO-MATERIAL-ROLES.md)，只在研究页展示；不是这些真实消费者已迁移 |
| EVO-V1-SNOW-EVIDENCE | 手动检查、39项研究输入摘要、每次录制前重新构建、33项实际服务HTML/JS/CSS摘要及稳定性检查、9项媒体摘要 | 原始[录制报告](../media/evolution-snow-r11/snow-evidence.json)与[普通检查报告](EVO-SNOW-R11-CHECKS.json)分开保存 |

只给现有 wetGlass 增加末尾可选内部 frost 工厂，默认仍为原 frostSurface；候选工厂放在 prototypes，由显式 snow 查询参数选择。实际 settingsWeather 调用没有更改；生产代码不导入两个新候选。没有新增时钟、轮询、DOM截图纹理、新框架或第三方图片。

保留设置V2.3的100/80ms开关、620ms分类，已认可C5.2/R10雨滴/默认稀疏斜雨/四档/转场、球体与240/650ms Hub节奏。其它实际原生窗口继续保留原天气路径。本轮未删除仍有消费者的旧CSS/SVG。

## 观看与复现

启动：`node scripts/prepare-settings-refraction.mjs`，然后 `npx vite --config vite.evolution-weather.config.ts --port 5195`。

- `snow-review.html`：现行/A/B原速录像、稳定雪天截图、单独材质近景、实际设置和角色页入口。
- `/?candidate=glass&background=day&climate=1&scatter=1&snow=feather` / `snow=powder`：同一实际设置组件，可晴雨雪切换、分类操作、暂停、关闭重开。
- `snow-lab.html?snow=feather` / `snow=powder`：四角色、无正文近景、日光/夜色。按钮展示空间，不执行游戏业务。

三段都是原速、1280×900/DPR1、25fps编码，时长19.32 / 19.24 / 19.20秒。操作时钟从页面与设置准备后起算：2秒雨、3.2秒中断转雪、9秒材质分类、11.5秒阅读分类、14秒回雨、18秒结束；录像包含约1.2–1.3秒装载前导。真实操作完成时间在报告内，分类点击相对计划最多约188ms延后。没有加速、删除等待或声称逐帧同步；评审页同时发起播放仍可能存在播放器时差。静态近景另行截图，不冒充游戏实录。

## 实际验证与环境

本机macOS / Node v24.18.0 / Playwright Chromium 153.0.8010.12 / Python3.9.6。下面命令均实际完成且退出0：

- `npx vue-tsc --noEmit -p tsconfig.evolution.json`、`npm run ci:check`、`node scripts/build-framework.mjs`：研究类型、现有类型/Framework合同与生产构建。
- `node --test tests/evolution-rain-model.test.cjs tests/evolution-scattered-shower.test.cjs`：9项模型/有限边界/确定性/档位/更新检查。
- `node tests/evolution-snow-study.cjs`：三种实际设置雪效；非稳态雨途中转雪、输入不跳变、实际阅读区域像素不变、有限正尺寸边界、窄屏不溢出、减少动态、隐藏停帧/停轮询、关闭移除和重开单实例。两个候选和现行版在固定时钟下，雨天Canvas及包含DOM水滴的完整设置窗口摘要均一致，且要求有可见DOM雨滴；不推论全部动态时刻逐像素相同。
- 同一手动检查对三种雪效×四角色×两视口，共24条角色记录，验证几何保护/单层/页面不溢出、暂停后时钟不前进、释放后帧/轮询为0。角色项主要是边界几何检查，不声称每个角色所有像素均独立复验。
- `node tests/evolution-snow-study.cjs --record`：独立新鲜构建与三段1×录制，24条角色记录同样执行。录制报告不复写普通模式的静态雨天像素比较；该证据在普通检查报告。
- `node tests/evolution-weather-integration.cjs`：实际W01九组回归成功；包含入口/单共享源、四档/连续、反向/异常回退、阅读和关闭真实像素、偏好输入、缩放/窄屏/零尺寸、隐藏/释放、部分构造失败与抛错清理。
- `node tests/evolution-weather-shower.cjs --scatter`：已认可C5.2斜雨实际绘制、保护、生命周期及默认无开关回归成功。

录制时JS天气绘图P95：现行1.5ms / A1.3ms / B1.5ms，rAF间隔中位约33.3ms。这是本机短时浏览器与录屏负载下的CPU观测，不是60fps、GPU、堆内存、长期稳定性或目标设备性能结论。

普通检查修正过两处采样前置条件：原先等待全部子动画结束会被既有循环导航阻塞，改为等待本次开窗/分类完成；材质近景在尺寸过渡期间允许几何帧，暂停归零检查改在尺寸过渡终态执行。未为测试改变产品动画或放宽暂停/保护断言。独立静态复审提出的新鲜构建身份、中间雨态两项P2已修复并重新检查和录制，最终复审无新增可行动问题；复审本身没有运行测试，不冒充第二次执行证据。

## 证据身份和交付

录制与普通报告的source为输入f318241、workingTree=true，诚实记录录制时尚未提交的新实现。两者记录39项研究输入；最终38项原字节摘要一致，snow-material.ts仅清理一处空行尾空格后重新构建，33项实际服务文件仍全部逐字节一致。保留原始报告而不重标源码：该文件原SHA256为`4c691e1f1796d437f376f9cb5da776034ed32ecafd322f8e50ed56aea8265492`，最终为`0fd5b6e042009bbb34c3be48265680e23cefd2ce0765498d5a0b147d652bfc13`。这不是全仓来源审计。生成的设置依赖与实际执行产物通过本次新鲜构建及33项服务文件摘要标识，构建前后研究输入与服务文件均校验稳定；不同invocation有不同build.id。

新增媒体9项＋录制报告共 **4,906,042字节**，复制时逐项校验大小及SHA256。每组仍有16MiB硬上限，超限失败，不截断；历史媒体保持各自源码与验收身份。无私人存档、凭据、完整游戏HTML、未知第三方制品或大段原始日志。

最终提交、push与两套实际Actions运行的精确身份/结果见 [Issue #22 本批交付记录](https://github.com/102326/DoL-Game-UI/issues/22)。研究为push，标准为手动触发，不称真实PR检查；新手动雪天检查没有加入默认CI矩阵，不能说远端自动执行了这项手动研究。CI现有整轮总结/后置下载验证继续由原流程负责，本批没有另造验证器或修改CI规则。

## 没做什么，接下来做什么

- 雪效和四角色尚未由负责人视觉确认，没有推广其它真实窗口。实际设置的默认雪效仍为现行版；待选择方向后再批准正式整合切片。
- 没有完整游戏/ModLoader/多Mod样本，没有Windows、真实Android/iOS/WebView、软键盘或触控验收，也没有长期性能验收。用户设备型号仍不当作实测viewport。
- 没有改UiApi/Host协议、组件正式版本、Tag/Release、保护规则/bypass、自动CD或外部AI；不合并main/发布4.0。
- CI Build Identity由另一聊天在独立PR #24推进，本批未合入或宣称已通过。CJ-4单独审批。
- 下一步先由负责人看现行/A/B设置和角色页，给出雪效及材质角色取舍；确定后选一个真实消费者继续。保持每项Implemented / Tested / Visually Accepted / Integrated / ReleaseReady分开，不能用本批技术绿灯替代G1/G2/G3。
