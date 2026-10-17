# R16：固定输入与复现实验

2026-10-17，基线 `a95a3ba88e4571b16bc7717f559074595d164e08`。以下34个包由获授权独立平板的当前Loader reader导出，未修改成员或版本声明；ZIP经JSZip重封装，**不声称作者原始发行ZIP身份**。源为独立测试App，而非新一轮作者最新版调查。当前版本与R15记录一致；CE是已装rebuild.28，不是作者原包。只读导出没有复制私人存档、账号或第三方配置。

原始包、所有条目摘要、Loader解析的JSON5 Manifest、依赖及插件目标位于本地忽略目录 `tests/artifacts/stone-free-r16/input/identity.json`，档案来源为 `exports.json` / `loaded-metadata.json`。运行脚本不改包。Source中的别名、依赖与原脚本清单均保留，不能用boot解析成功证明实际执行或全部功能正常。

| 顺序 | 技术名 | 版本 | 导出ZIP SHA-256 |
| --- | --- | --- | --- |
| 1 | ModLoaderGui | 1.9.1 | `8f0f7e196c7ca443cca9f46d849dd8fb0cd111f6b3b225878cbfb09e31d1a33a` |
| 2 | ConflictChecker | 1.3.0 | `8644ff5fd7a635310c0d2e70cfd94ee968202a90e11a89a043cf5fcaaae8ce26` |
| 3 | ModLoader DoL ImageLoaderHook | 2.101.0 | `ac676fe836ad36f1d2e3b03edecf9c42b61a17a1f10d2020c02f438dd0a6e884` |
| 4 | ModSubUiAngularJs | 1.2.0 | `26c746e709300d82783703d2a3b1b7166f8c17947c1c56c3491d77df4ab87d96` |
| 5 | BeautySelectorAddon | 2.9.0 | `c17628ac397e596084364adf24bacb6638d6c9daa2b3a25bf26fae48f73e0f31` |
| 6 | ImageLoaderHook2BeautySelectorAddon | 1.1.0 | `0c7969d889ef439f5be1205f4b5faf8b637728907cdeda1255f70baefb749b44` |
| 7 | CheckGameVersion | 2.2.1 | `63cca865c2d3229d2fefaa59cebfa4d7539233901f9039f52d39a46609c32cb7` |
| 8 | CheckDoLCompressorDictionaries | 1.3.0 | `ddaffee89a04174de171db87f680297f1fc8be869051101dd8007d03a4e3c302` |
| 9 | TweeReplacerLinker | 1.0.0 | `ac06160a156432b6716433f7cfb1e3ba234e3bea0b28f403e87e356098b95ea9` |
| 10 | TweeReplacer | 1.7.0 | `2064e0e1bfa5fac782f2c249f5cbb0509ccfc07f1a8ab35022712a592f0fe37d` |
| 11 | I18nTweeReplacer | 1.1.0 | `20ec4c280082c9cd6ce3fcb7eadbc797b80af644adbe1edd645632ca9501637a` |
| 12 | I18nTweeList | 1.0.0 | `27c869ae7d5e7099b25bee8efd479e71db2b7591e39a827b63194a7125428a93` |
| 13 | I18nScriptList | 1.0.0 | `2c3d57afee8586f16b88f3f1739e0a1865d1a9721ca189d0e47713d95531c3f2` |
| 14 | ReplacePatcher | 1.3.0 | `05dcfca91e94a744c746b0f125a1262914d3918637a570f9f0a81eeca10b6ed2` |
| 15 | TweePrefixPostfixAddon | 1.0.1 | `584d3760336a2ce956a3a90acf93ec9ff8935c66b8447e48ca6dd4140e5aa887` |
| 16 | Diff3WayMerge | 1.1.1 | `4a1e7b6daf70fdefdfecdb8be1d609525bc2e09467d924a3781c8c4a6d2e5630` |
| 17 | DoLTimeWrapperAddon | 1.2.0 | `bd4f042d7fd93cd7d6d2ff9694e4a5a27c8152267688ddb5d89c561472dd74ec` |
| 18 | ModdedClothesAddon | 1.6.3 | `e6d645008b6610e0ba7749875dc8f54b85404ce451b56882600ae9bd82e3e53d` |
| 19 | ModdedHairAddon | 1.0.2 | `3347567b77a6bc84419fcf15538fcbafd197732122357cf8a60d87f7a81f1b4f` |
| 20 | ModdedFeatsAddon | 1.1.1 | `827f850ba4c3a3f77d2630dc82b73cbdbd0a2652ff68a201b068c6219f80bfd7` |
| 21 | SweetAlert2Mod | 1.1.0 | `3be2f8d0d4d00bfa48427b48ddea4247c87a45599b4178488f94aeaec1c11ac6` |
| 22 | ModuleCssReplacer | 1.0.1 | `996ccc3116af16e3af4564b4b751ae776e7e47ea768008ac132622a2fd60d687` |
| 23 | DoLLinkButtonFilter | 1.1.0 | `9050a95a10bf8044e301cc78fd92b5fa084b5d04bc31a57eb6f32fd0ad83ee3a` |
| 24 | Cheat-Lyra | 1.1.3 | `413f9b0083970df3fa703fdb6cf52e9a50d55c9655dcfb55d9a242600df7394c` |
| 25 | CombatStatusDisplay-Lyra | 1.0.1 | `d0fac3435855ed0880fc689463ded58c625bd44308bbded14f20aa365efc6a20` |
| 26 | Lyra | 0.5.12.13-1.0.1a-1004.1-goose-ucb | `cc97c54df791e4c7c774d46b5d60bb08d556b25c10190cb44fc9605cfe3876f8` |
| 27 | ModHub | 1.7.0 | `47a9aab42f75341728ecd599a9aa6ae9d813bf45d666827854ec106a6d0bbdb1` |
| 28 | maplebirch | 5.4.3 | `2515688951ff5faaf7b88730738a180142aab3b87607df6532510399a5ea0f54` |
| 29 | cheat extended | 1.20.3.1-rebuild.28 | `597a0297e462f14ef9db5f0fedbf0a4a2108e6f3011bd7e5d288c1f7c0224c61` |
| 30 | 特姿拓展 | 1.2.2 | `f1511c78a6ef99b4f5da6e4a2ae3ccfb40ba2086e99ba01fd2f03b92a1e72748` |
| 31 | 银商启动 | 1.5.6 | `de02c5a96d3d7ea0715bc431c8c7e8fae8a02c1b4ee87d5b5b85f03ef5493187` |
| 32 | 美化修正 | 1.0.1 | `52e0dc395746c9eaf9630aa527ed8e9dff8bfd260cf09f97d75b220913773531` |
| 33 | LyraMouthCompat051213 | 0.1.2 | `35e7975f693717d5a9182bcde8f300760175ff3b4168151e762712ade1ca5764` |
| 34 | 原版优化 | 1.1.1.5 | `1aa4e2ea13d9679d317c09b0db1a31a5a58a1d685c78db65746bf86188ad5428` |

1–23为Loader基础插件；Lyra是宿主整合标识。A使用这24个输入，B再加Host、同伴NativeStatus和官方UI。C为全部34包，含10项额外社区/整合/兼容扩展；D为同一C加3个Stone Free包。**34个装配包不等于34个内容Mod**。没有为凑数下载未知包。

`ModI18N`当时的已加载reader未提供可生成ZIP的对象；没有证据确认是资源释放、容器能力或其它原因，记为Unknown。Windows四组均不装它，不能据此宣称复刻了完整Lyra APK；Android保留已安装ModI18N为固定平台条件。未尝试解密、改包或把失败包装为成功导出。剧情专属扩展及新的未知衣槽没有进入本轮。

## Stone Free 固定配对

| 用途 | 包 | SHA-256 |
| --- | --- | --- |
| Host，始终相同 | StoneFreeHost-0.1.2-experimental.mod.zip | `34e0df095fbca7793878fcd8171187c215bea586e4820309fce5365097017aae` |
| 同伴，始终相同 | StoneFreeNativeStatus-0.1.2-experimental.mod.zip | `162803f660adceec5ebd1b1665e63658f7ec86e3b8993633b5eccb53c5e0016f` |
| 原始B/D | DoLGameUI-3.0.0-lab.15.mod.zip | `c21ad41a57e2d936cf3659d01416064383ef6824258a90b6b33d86bb8831b9a3` |
| 修复后B/D | DoLGameUI-3.0.0-lab.16.mod.zip | `58ed39d70e37b0232b709bdbbb0a47363e04ff57b4d5f911d8a3b04b13930975` |

Host协议仍为0.1-experimental，UI API仍v1。所有Windows最终装配都读回实际Loader版本清单及声明JS/CSS/Twee成员摘要。它不代表每条启动规则都成功命中；部分运行告警仍保留。

## 旧官方外观包：补充条件，不混进C/D主对照

三个包依赖DoLGameUI >=2.2.2，并有各自目标/游戏范围。没有改版本门禁。C没有官方UI，因此不强装这些包；补测是在D上额外加入原样导出包。明细：

| 技术名 | 实际版本 | SHA-256 |
| --- | --- | --- |
| ModHubSoftWet | 0.2.4 | `ee63e835544667ac2e378d850498f249db0cd929915076a5ec016d42ae21e28a` |
| MapleBirchSoftWet | 0.2.4 | `8bc86a4061160566992fad5f209cf90a68c7c01d93cddbfb698ab503081dbe14` |
| DolOptimizationSoftWet | 0.1.6-rc.1 | `be4049a8b90cd85e36d18d41ac8bd1ccb6284f9947e49f4f3a77daa5abb340f7` |

DolOptimizationSoftWet导出的版本是0.1.6-rc.1，与当前源码文件的0.1.6不同；本轮测试的是实际导出包，没有混用版本身份。ModHub/原版优化页面验证了API1样式接入和原控件；MapleBirch云页及云端业务未验收。

## 宿主与隔离

Windows真实编译HTML为0.5.12.13，SHA `c6441487307e66b79f34b62a75497bd4cdca911a6ab60beb90a329d7233d65f0`；Loader2.101.1、SugarCube2.36.1+34、Edge156。每组独立浏览器和HTTP来源；只在内存中将标准内嵌ZIP块清空，然后用原Loader接口安装上述输入。外网连接被CSP限制，不测试ModHub远程服务；服务器未提供完整原版图片，资源/天气错误不可当成UI冲突。Mod图片仍由包内原ImageLoader路径加载。

Android M367FC / Android17 / WebView154.0.8037.58，独立包 `com.vrelnir.dol.lyra.uicompat051213`，安装APK版本0.5.12.13，base APK SHA `ab67be61aea19cb259dae155356f7621cd6114d3209c66ca88a4162cbb9b9585`。Lyra标识 `0.5.12.13-1.0.1a-1004.1-goose-ucb`。APK与桌面HTML不同，分别记录；不分发原游戏。

Android只补D代表性流程。保留原社区包字节，不覆盖它们；停用原UI及三项外观包，添加新的独立Host/同伴和官方候选存储键。新UI的实际boot.name仍DoLGameUI，安装键是StoneFreeOfficialUICandidate，不把ModHub按存储键查包的结果当作严格身份对照。完整配置/依赖扫描在Windows技术名键装配中执行。结束删自有槽和包、恢复原活跃/隐藏清单及UI偏好并重启读回。原存档payload不读取或迁移，原存档details仅内存比较。

## 已执行入口

项目脚本 `tests/framework-ecosystem-r16.cjs` 使用本地固定输入和已有依赖，不下载、安装工具或改GER。复现前须合法取得相同摘要输入、同一游戏宿主与授权隔离环境。

```powershell
node tests/framework-ecosystem-r16.cjs A
node tests/framework-ecosystem-r16.cjs B --candidate
node tests/framework-ecosystem-r16.cjs C
node tests/framework-ecosystem-r16.cjs D --candidate
node tests/framework-ecosystem-r16.cjs D --candidate --adapters
# Android仅适用于脚本中明确的授权测试目标，先核对当前设备/包。
node tests/framework-ecosystem-r16.cjs D --candidate --android
```

原生购买、存档和回合会改变新测试进度。不要对私人进度或不明数据使用这些命令。存档清理只删除同一运行标记槽；失败时不盲目重派。源码/输入和实际结果的关系见 [R16报告](STONE_FREE_3.0_R16.md)。
