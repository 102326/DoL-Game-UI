# Soft & Wet 4.0 — Evolution

> 首页替换稿，尚未启用，更新2026-10-25。正式版本文件4.0.0已从源码4ebe0bb实际构建，两套CI、下载制品核对及Android最小装机复验通过，尚未公开发行。当前顶栏方案与披露的性能尾帧已获接受；最终九包见[正式版本准备清单](evolution/EVO-4.0.0-PACKAGES-2026-10-25.json)。

Soft & Wet 为 Degrees of Lewdity 提供黑灰 Acrylic 界面，整理衣柜、服装店、角色信息和常用窗口。Evolution 延续3.X视觉基线，更新悬浮工具与设置的动态表现，并改进窗口在滚动、缩放和快速切换时的行为。

购买、穿戴、战斗结算、角色数值和存档继续由原游戏及对应Mod处理。安装包不包含游戏本体、APK或第三方主Mod。

[版本与下载](https://github.com/102326/DoL-Game-UI/releases) · [安装与回退](INSTALL_EVOLUTION_CANDIDATE.md) · [反馈问题](https://github.com/102326/DoL-Game-UI/issues)

## 核心界面

### Floating Hub

金属球体通过回旋纹理、光照和残影带出真实工具菜单。点击后球体立即响应，菜单留出蓄势时间再展开；关闭时工具与背景一起收束。

保留拖动、侧边停靠、工具调用、键盘和快速反向。新安装默认显示，已有隐藏偏好保留；可在界面设置中关闭，经典入口继续作为回退路径。

### 设置与天气

设置支持上下、左右两种布局，共用真实控件、偏好与实时预览。开关采用短过渡，分类切换保留连续动态；修改自动保存，长内容可滚动，窗口打开时阻挡背后的游戏输入。

设置玻璃响应游戏内降雨、降雪及血月、异世界、极热和严寒，呈现水珠、雨丝、霜羽、月面云影与环境雾光。雨中血月使用普通雨滴。其它已适配窗口保留各自现有天气表现，修复共享雨幕在ModHub等窗口中的持续重绘卡顿。天气来自DoL，不调用现实天气服务；装饰层不接收点击，关闭动画或减少动态时采用静态表现。

### 角色信息与常用窗口

属性、社交、特质、成就、日志和统计等已匹配窗口使用协调的外壳、导航与内容层次。保留原语义颜色、链接和表单操作，导航焦点适应滚动与缩放。

### 衣柜与服装店

- 衣柜支持分类、搜索、当前穿搭、预览、参照比较和衣物详情抽屉；点选衣物仍执行原穿戴操作。
- 已识别的原版优化叠穿项目可以显示多件，保留原顺序调整和卸下入口。
- 商店集中展示分类、配色、商品选择、报价和购买区域，保留原购买、试穿与退出路径。
- 动态选择反馈和详情过渡帮助辨识当前物品，不改写交易或穿戴规则。

### 战斗与存档

新安装默认开启动画、平铺全部战斗选项；聚焦编辑可选，已有偏好保留。修复缩放后的战斗底栏偏移及一条衣柜离开时的失效刷新路径。

存档、导出／载入与已适配云存档共用管理页头。原版优化附加日期无效时，兼容包仅在能确定存档时间的情况下修正文字；正常上游日期保留，存档数据不变。

存档按钮转发前区分正常空槽和异常数据，无法确认时停止该次转发并保留原版入口；未知扩展行继续使用原生控件，不自动修复存档内容。

## 安装与升级

普通玩家需要主UI与Framework Host两个独立ZIP；使用相应第三方Mod时再选装兼容包。无需解压。

| 项目 | 范围 |
| --- | --- |
| DoL | 当前适配与代表性验收基线为0.5.12.13 |
| ModLoader | 最低>=2.100.0，本轮使用2.101.1 |
| TweeReplacer | 最低>=1.0.0，本轮使用1.7.0 |
| Framework Host | >=0.1.2-experimental且<0.2.0，本轮使用0.1.5-experimental |
| 平台 | Android平板WebView与Windows Edge代表性验证；其它环境见验证范围 |

1. 备份存档，保留原包和顺序以便回退。
2. 停用旧同名UI，确保每个技术身份只启用一个版本。
3. 导入Framework Host和主UI，Host排在UI前。
4. 按目标Mod选装兼容包，放在目标Mod和UI之后。
5. 重启，确认入口与版本，再读取自己的进度。

最低依赖、已验证版本与结构识别共同决定兼容范围，不保证所有未来版本或整合包均已验证。详细步骤见[安装、升级与回退](INSTALL_EVOLUTION_CANDIDATE.md)。

## 可选兼容包

| 包 | 用途 |
| --- | --- |
| ModHubSoftWet | 管理器、市场、帮助及已识别工具浮层外观 |
| MapleBirchSoftWet | 云存档页面外观，保留原云端业务 |
| DolOptimizationSoftWet | 存档外观、条件日期显示修复与原叠穿列表 |
| CheatExtendedSoftWet | 原作者CE及已支持独立维护版的外观 |
| ReOverfitsSoftWet | 额外服装槽位接入 |
| LyraMouthCompat051213 | 指定Lyra环境的嘴部资源适配 |
| SmartPhoneSoftWet | 万能手机Alpha及已识别组件外观 |

没有目标Mod就不安装对应包。CE原作者版与独立维护的rebuild.30只能启用一个；万能手机包不适用于Omega。具体版本与支持范围见发布页。

## 兼容、限制与回退

部分Android环境的复杂天气下仍可能有偶发慢帧。未知第三方页面可能保留原外观。尚未穷举所有WebView、衣物、商品、战斗和Mod组合；当前没有完整FPS或长期无泄漏结论。ModHub所有安装／更新场景的卡顿、闪烁，以及全部历史衣柜同名异常不作根治承诺。

各专用界面可以独立关闭。需要回退时停用当前UI及只适用于它的兼容包，恢复保留的原包和顺序，再重启；其它Mod仍使用Host时保留Host。不要清空存档或整个App数据。

## 开发者与许可

维护中的自有界面、Host、兼容逻辑及测试/构建工具已按TS First整理，CommonJS运行形式按需保留。开发工具使用Node26；玩家无需安装Node。对外UI API保持v1，Host保留`StoneFreeHost`技术名，公共协议不因视觉或类型迁移改变。

- [验证范围与发布关卡](evolution/EVO-RELEASE-GATE-2026-10-24.md)
- [持续集成](CI.md)、[UI Runtime API](UI_RUNTIME.md)、[兼容适配](OPTIONAL_ADAPTERS.md)
- [UI接入示例](../examples/ui-surfaces/README.md)

<details>
<summary>源码检查与构建</summary>

开发工具使用Node.js 26.12.1+（仅26.x），需要npm和Python；CI使用Python 3.12。玩家无需安装这些工具。

```text
npm ci
npm run ci:check
npm run ci:build
```

该入口检查类型并构建主UI、Host及七个兼容包；主UI／Host输出到`dist/framework/`，兼容包输出到各自的`compat/*/dist/`。需要执行包合同、反例和双构建校验时，运行`npm run ci:packages`。不同系统的压缩容器摘要可能不同，不能据此覆盖已发布附件。

</details>

## 反馈与许可

通过[GitHub Issues](https://github.com/102326/DoL-Game-UI/issues)提供游戏、Loader、UI／Host及相关Mod版本，说明设备、复现步骤和实际表现。截图、日志与存档可选；公开反馈中不要包含账号凭据、敏感数据或无权分发的Mod包。

项目原创代码使用[MIT](../LICENSE)，版权署名为DoLWorkbench contributors。衣柜衍生渲染及四项游戏Twee替换来自Vrelnir及Degrees of Lewdity贡献者，适用**CC BY-NC-SA 4.0**；见[来源与修改说明](../UPSTREAM-RENDERER-NOTICE.md)及[完整许可](../UPSTREAM-RENDERER-LICENSE)。MIT不替代这些衍生代码的原许可。Vue、Tailwind CSS与GSAP等依赖的声明随包保留。

## 画面与动态预览

[Android设置原速顶栏雨效录屏（24秒）](media/evolution-rain-header/android-settings-rain.mp4)。来源、运行成员等价及性能限制见[本轮复验](evolution/EVO-RAIN-HEADER-PERF-2026-10-25.md)。

![本轮Android设置：上下布局](media/evolution-rain-header/android-horizontal.png)

![实际Android设置：血月环境，普通雨保留](https://raw.githubusercontent.com/102326/DoL-Game-UI/dev/evolution-4.0/docs/media/evolution-rc1-game/android-blood-moon.png)

- [设置与特殊天气原速预览](https://github.com/102326/DoL-Game-UI/blob/dev/evolution-4.0/docs/media/evolution-special-integrated/desktop-1x.mp4)
- [悬浮球与工具原速预览](https://github.com/102326/DoL-Game-UI/blob/dev/evolution-4.0/docs/media/evolution-rc1-hub/desktop-1x.mp4)
- [窄屏设置预览](https://github.com/102326/DoL-Game-UI/blob/dev/evolution-4.0/docs/media/evolution-special-integrated/narrow-1x.mp4)

血月截图来自Android测试App；后三段视频为真实组件演示，非同次实机录屏。媒体采集早于正式包，复用关系见[媒体记录](media/evolution-rain-header/provenance.json)和[验证范围](evolution/EVO-RELEASE-GATE-2026-10-24.md)。
