# Stone Free 3.0：局部恢复与独立作者源码包

2026-10-17，基于 `4e1cfa8ef49b1572db368b4a02600d4d98a74282` 的本地第七轮。范围是当前布局的局部恢复、作者接入文档及从导出制品独立开发的验证，不增加 Runtime 合同、不重构游戏页面、不发布。

## 已交付

工作台编辑区新增“恢复本布局”，恢复默认顺序、全部公开视图可见及舒适密度。只写当前 `StoneFreeWorkspace.<owner>.v1`，不清空其它布局、第三方偏好、作者视图内部状态或游戏状态。存储拒绝时仍调整当前界面并明确提示无法保存；不会承诺下次加载仍然恢复成功。

打包流程新增 `StoneFreeAuthorKit-0.1.0-experimental.source.zip`，白名单包含许可证、Factory、三个 SDK 源码、五个模板和说明/摘要，共 12 个文件。没有 `boot.json`，不能导入 ModLoader。它不包含官方 UI 源码、游戏、ModLoader、依赖、截图或测试证据，运行 Host 仍是独立 `.mod.zip`。

作者包实际从这个导出 ZIP 解压、创建并修改，不从完整 UI 源码引入组件或 Store。标准配方和 SDK 不因此改成另一个运行时。摘要只核对本地内容，不能证明发布者可信或语义兼容。

[作者指南](STONE_FREE_3.0_AUTHOR_GUIDE.md)覆盖预览、构建、寿命、来源、公开视图、受审命令、能力检查和保护式升级。源码包内另有独立可读 README，链接只指向随包 SDK。

## 验证

| 范围 | 结果 | 本地证据 |
| --- | --- | --- |
| 研究构建 | `npm run framework:build` 通过；已有 8 个研究 Mod 加 1 个开发用源码包 | `dist/framework/` |
| 工作台 | 14 组通过；包含局部重置、其它布局/作者状态隔离、重新接入持久化、拒绝存储、阅读返回和代表性窗口 | `tests/artifacts/stone-free-workspace/browser-1792171051355/result.json` |
| Android 组合 | 通过；真实官方 Drawer、布局交接、局部恢复和原值对照，测试前偏好恢复、挂载/Host/等待订阅清空 | `tests/artifacts/stone-free-workspace/android-1792171206687/result.json` |
| 作者制品闭环 | `npm run framework:author-kit:test` 4 组通过；白名单/摘要、离线链接、解压创建和二次修改、SDK 检查/更新、类型/构建/ZIP、390px 独立运行与清理 | `tests/artifacts/stone-free-foundation/author-kit-1792171579556/result.json` |

Android 目标仍是已授权 M367FC、Android 17、独立 `com.vrelnir.dol.lyra.uicompat051213`，DoL 0.5.12.13 / UI 2.7.0。新增工作台操作使用 Paisley Park 6.1.0 标准 `web-click`，原生截图 collector 取得画面；保留既有组件检查中的 CDP DOM 点击和合成 IME 负对照，两者不称为物理触控/键盘证明。没有购买、换装、战斗推进、存档读写或 GER 操作。

源码包检验先核对完整白名单及逐文件摘要，再解压到新目录；创建的作者项目通过 junction 复用当前已安装依赖，没有联网重新安装。旧 Mod ZIP 的归档流程改为共用同一确定性写入函数，同输入对照中八个包的大小和 SHA 一致，未改变运行资源或目录结构。随后 README 的本轮说明会改变文档字节，不影响这个同输入对照结论。

## 失败与归属

首次平板流程 `android-1792171100707` 已确认重置为 `comfortable`，后续旧断言仍期望 `compact` 而失败。源码没有被修改来满足旧断言；按新增“恢复”操作的实际合同修正后续预期，补齐关闭按钮的标准动作映射，并再次通过。失败收据及原偏好恢复结果保留。它属于项目测试遗漏，不是游戏、Tools 或重置实现缺陷。

本轮没有新的工具实现问题或通用 Skill 建议；此前截图超时与历史 Unknown 的结论不变。作者包的 Browser 场景只证明生成制品在无官方 UI/游戏对象时工作，不能替代实际 ModLoader 安装或游戏业务验收。

## 完成与覆盖边界

本轮交付已完成。SDK/Factory 的独立源码制品路径现在有实际构建证据，但尚未证明相对熟练作者使用 Vite 模板和 Agent 的普遍效率收益，亦不是独立社区作者采用证明。

物理手机触控、真实 IME、新电脑首次依赖安装、持久 Mod 安装更新和更多版本组合未验证；它们不自动成为本轮剩余任务。正式 UI、API v1、Host/SDK 源码与锁文件保持原状。仍不宣称整个 3.0 已完成发布验收，也未推送、合并或发布。
