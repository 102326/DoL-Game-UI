# Evolution：发布前整合与当前 Mod 组合

2026-10-24，分支 `dev/evolution-4.0`。执行依据为负责人“完成到发布前”及更新 Mod / 对应兼容包的补充授权。此记录是技术进度，不是发布授权或负责人视觉通过。

## 当前输入与更新范围

以独立 Android 测试 App 中 ModHub 的可更新列表为准。已核对作者发布资源并写入 Loader，重启后的实际加载版本为：

| 目标 | 原版本 → 当前版本 | 对应本地兼容候选 |
| --- | --- | --- |
| [ModHub](https://github.com/JohnLiao501/ModHub/releases/tag/v1.8.3) | 1.7.6 → 1.8.3 | ModHubSoftWet 1.0.2 |
| [MapleBirch](https://github.com/MaplebirchLeaf/SCML-DOL-maplebirchFramework/releases/tag/maplebirch-release-v5.5.4) | 5.5.1 → 5.5.4 | MapleBirchSoftWet 1.0.1 |
| [原版优化](https://github.com/ANLINSTUDIO/Degrees-of-Lewdity-DolOptimization/releases/tag/v1.1.2.1) | 1.1.2 → 1.1.2.1 | DolOptimizationSoftWet 1.0.2 |
| [SmartPhone Alpha](https://github.com/ANLINSTUDIO/Degrees-of-Lewdity-DolSmartPhone/releases/tag/v0.3.91) | 0.3.91 → 0.3.91.1 | SmartPhoneSoftWet 1.1.1 |

保留 CE `1.20.3.1-rebuild.30`、PhotoPack 和其它当前非更新项。银商启动按负责人决定保留，不另行找包。APK 内置 Loader / 汉化 / Lyra 资源不通过市场同名包替换。ModHub 刷新后四项更新提示清除；公开 UI 3.0.4 与研究包同技术版本而成员不同，不将公开包当升级覆盖研究成果。

操作前保留原包成员、顺序和禁用列表；更新前后 Loader 顺序一致、禁用列表仍为空。作者 ZIP 只用于本地测试，不随我们的候选重新分发。SmartPhone 兼容源码从此前独立维护分支的 `de95ad4a2ae2fc62b04690e062ab4c2e889dfe23` 纳入当前构建；保留原结构合同和 0.3.92 拒绝反例，新增已核对的 0.3.91.1。其它三个兼容包继续使用既有结构识别，不接管目标业务。

## 已完成的当前验证

- Windows / Node 26 / Edge，真实游戏 HTML 与实际 ModLoader 的隔离会话：原生新游戏路线、设置双布局和真实开关、Hub 打开实际设置、角色属性 / 社交 / 特质 / 日志 / 成就开关通过；四个目标更新及兼容候选加载后再次验证核心界面通过。
- Android 17 / WebView 155，已连接平板的独立测试 App：重启确认四个目标和四个兼容候选实际版本。ModHub 管理 / 市场 / 说明 / 日志 / 帮助和 body 工具浮层结构匹配；390×844 受控视口无列表横向溢出，不能写成物理手机测试。
- 原版优化 1.1.2.1：存档、导出 / 载入、云存档拥有统一存档管理页头。空槽 4 新建测试存档后重新打开可读取，未覆盖已有 1–3 槽。原存档码导出产生非空内容，原按钮载入返回 Bedroom。MapleBirch 5.5.4 云页匹配；只检查页面，不读凭据或操作云端。
- `ci:check`、SmartPhone 定向合同通过。九包结构 / 独立版本 / 许可证和原损坏反例通过，两次独立构建成员、字节、元数据和 SHA-256 一致。Python 临时反例曾因 Windows 默认编码生成非 UTF-8 文件，现显式 UTF-8，未删除或放宽反例。

## 失败与覆盖边界

- 本地全量 unit 保留 Windows 路径 / file URL 及符号链接权限失败。完整 Linux Actions 尚待本批源码执行，不用历史成功替代。
- 本地 browser 在 Vite fixture 初始导航出现超时；同次其它实际组件 / 兼容合同继续记录。正在核对与本轮临时真实游戏 HTML 进入 Vite 自动扫描的关系，不以重跑到绿处理。
- Windows 输入为同一测试 APK 的未改 HTML；其 `Save.export` 直接调用 Cordova 保存插件，浏览器没有原生文件导出能力。点击导出未收到下载事件，原失败保留。这是该验收宿主的明确限制，不能冒称 Windows 标准发行版文件导出已验收。
- 剩余本轮工作：Android 原生文件 / 槽位读取、所选业务与兼容界面、短时稳定性记录、最终候选文档与对应新源码 CI。负责人 G2 / G3 最终裁决仍待确认。

未合并 main，未改公开版本 / Host 公共协议，未创建 Tag 或 Release。原始截图、存档、HTML、作者 ZIP 和完整设备日志留本地忽略目录；本报告只公开必要结论。
